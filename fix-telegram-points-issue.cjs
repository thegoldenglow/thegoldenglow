const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTelegramPointsIssue() {
  console.log('🔧 Fixing Telegram points saving issue...');
  
  try {
    // 1. Check current game_sessions table structure
    console.log('\n📋 Checking game_sessions table structure...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'game_sessions' })
      .catch(() => {
        // Fallback: try to get columns by querying the table
        return supabase.from('game_sessions').select('*').limit(1);
      });
    
    // 2. Add missing points_earned column if it doesn't exist
    console.log('\n➕ Adding points_earned column to game_sessions...');
    const addColumnSQL = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'game_sessions' AND column_name = 'points_earned'
        ) THEN
          ALTER TABLE game_sessions ADD COLUMN points_earned INTEGER DEFAULT 0;
          COMMENT ON COLUMN game_sessions.points_earned IS 'Points earned from this game session';
        END IF;
      END $$;
    `;
    
    const { error: alterError } = await supabase.rpc('exec_sql', { sql: addColumnSQL })
      .catch(async () => {
        // Fallback: try direct SQL execution
        console.log('⚠️ Trying alternative method to add column...');
        return await supabase.from('game_sessions').select('points_earned').limit(1)
          .then(() => ({ error: null })) // Column exists
          .catch(() => ({ error: 'Column does not exist' }));
      });
    
    if (alterError) {
      console.log('⚠️ Could not add points_earned column automatically. Manual SQL needed:');
      console.log('ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;');
    } else {
      console.log('✅ points_earned column added successfully');
    }
    
    // 3. Check the BananBenBadr user profile
    console.log('\n👤 Checking BananBenBadr profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'BananBenBadr')
      .single();
    
    if (profileError) {
      console.error('❌ Error finding BananBenBadr profile:', profileError);
      return;
    }
    
    console.log('📊 Profile found:', {
      id: profile.id,
      username: profile.username,
      telegram_id: profile.telegram_id,
      auth_user_id: profile.auth_user_id,
      points: profile.points
    });
    
    // 4. Check if there's a corresponding auth user
    if (!profile.auth_user_id) {
      console.log('\n⚠️ No auth_user_id found. This is likely the issue!');
      console.log('The profile exists but is not linked to an auth.users entry.');
      
      // Try to find auth user by telegram_id in metadata
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError && authUsers) {
        const matchingAuthUser = authUsers.users.find(user => 
          user.user_metadata?.telegram_id === profile.telegram_id.toString() ||
          user.user_metadata?.telegram_username === profile.telegram_username
        );
        
        if (matchingAuthUser) {
          console.log('✅ Found matching auth user:', matchingAuthUser.id);
          
          // Update profile with auth_user_id
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ auth_user_id: matchingAuthUser.id })
            .eq('id', profile.id);
          
          if (updateError) {
            console.error('❌ Error linking profile to auth user:', updateError);
          } else {
            console.log('✅ Profile linked to auth user successfully');
            profile.auth_user_id = matchingAuthUser.id;
          }
        } else {
          console.log('❌ No matching auth user found');
        }
      }
    }
    
    // 5. Test game session creation
    if (profile.auth_user_id) {
      console.log('\n🧪 Testing game session creation...');
      
      const testSession = {
        user_id: profile.auth_user_id,
        game_type: 'test-telegram-fix',
        score: 500,
        points_earned: 5,
        duration: 60,
        completed: true,
        data: { test: true },
        ended_at: new Date().toISOString()
      };
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert(testSession)
        .select()
        .single();
      
      if (sessionError) {
        console.error('❌ Error creating test session:', sessionError);
        
        // Try without points_earned if it fails
        console.log('🔄 Retrying without points_earned column...');
        const { points_earned, ...sessionWithoutPoints } = testSession;
        
        const { data: retryData, error: retryError } = await supabase
          .from('game_sessions')
          .insert(sessionWithoutPoints)
          .select()
          .single();
        
        if (retryError) {
          console.error('❌ Still failed:', retryError);
        } else {
          console.log('✅ Session created without points_earned column');
          
          // Clean up test session
          await supabase.from('game_sessions').delete().eq('id', retryData.id);
        }
      } else {
        console.log('✅ Test session created successfully:', sessionData.id);
        
        // Test points update
        console.log('\n💰 Testing points update...');
        const newPoints = profile.points + 5;
        
        const { error: pointsError } = await supabase
          .from('profiles')
          .update({ points: newPoints })
          .eq('id', profile.id);
        
        if (pointsError) {
          console.error('❌ Error updating points:', pointsError);
        } else {
          console.log('✅ Points updated successfully');
          
          // Restore original points
          await supabase
            .from('profiles')
            .update({ points: profile.points })
            .eq('id', profile.id);
        }
        
        // Clean up test session
        await supabase.from('game_sessions').delete().eq('id', sessionData.id);
        console.log('🧹 Test session cleaned up');
      }
    }
    
    // 6. Provide fix summary
    console.log('\n📋 ISSUE SUMMARY:');
    console.log('==================');
    
    if (!profile.auth_user_id) {
      console.log('❌ MAIN ISSUE: Profile is not linked to auth.users table');
      console.log('   - The profile exists in the profiles table');
      console.log('   - But auth_user_id is null/undefined');
      console.log('   - gameScoreManager.js uses auth user ID to save sessions');
      console.log('   - This causes the save to fail silently');
    } else {
      console.log('✅ Profile is properly linked to auth user');
    }
    
    console.log('\n🔧 FIXES NEEDED:');
    console.log('1. Ensure points_earned column exists in game_sessions');
    console.log('2. Link Telegram profiles to proper auth users');
    console.log('3. Update gameScoreManager.js to handle schema correctly');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Run the SQL to add missing column if needed');
    console.log('2. Test game in Telegram to verify points are now saved');
    console.log('3. Check that points accumulate properly');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

fixTelegramPointsIssue();