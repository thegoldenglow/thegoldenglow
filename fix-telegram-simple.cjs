const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTelegramIssue() {
  console.log('🔧 Diagnosing Telegram points issue...');
  
  try {
    // 1. Check BananBenBadr profile
    console.log('\n👤 Checking BananBenBadr profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'BananBenBadr')
      .single();
    
    if (profileError) {
      console.error('❌ Error finding profile:', profileError);
      return;
    }
    
    console.log('📊 Profile details:');
    console.log('- ID:', profile.id);
    console.log('- Username:', profile.username);
    console.log('- Telegram ID:', profile.telegram_id);
    console.log('- Auth User ID:', profile.auth_user_id);
    console.log('- Points:', profile.points);
    
    // 2. Check if points_earned column exists in game_sessions
    console.log('\n🔍 Testing game_sessions table structure...');
    
    // Try to select points_earned to see if column exists
    const { data: testColumn, error: columnError } = await supabase
      .from('game_sessions')
      .select('points_earned')
      .limit(1);
    
    if (columnError && columnError.code === '42703') {
      console.log('❌ points_earned column does NOT exist in game_sessions');
      console.log('\n🔧 SQL to fix this:');
      console.log('ALTER TABLE game_sessions ADD COLUMN points_earned INTEGER DEFAULT 0;');
    } else {
      console.log('✅ points_earned column exists');
    }
    
    // 3. Check auth user linkage
    if (!profile.auth_user_id) {
      console.log('\n❌ CRITICAL ISSUE: No auth_user_id linked to profile');
      console.log('This means the profile is not connected to the auth system.');
      console.log('Games cannot save because gameScoreManager uses auth.getUser().');
    } else {
      console.log('\n✅ Profile is linked to auth user:', profile.auth_user_id);
      
      // Test if we can create a game session
      console.log('\n🧪 Testing game session creation...');
      
      const testSessionData = {
        user_id: profile.auth_user_id,
        game_type: 'test-session',
        score: 100,
        duration: 30,
        completed: true,
        data: { test: true }
      };
      
      // Try without points_earned first
      const { data: session1, error: error1 } = await supabase
        .from('game_sessions')
        .insert(testSessionData)
        .select()
        .single();
      
      if (error1) {
        console.log('❌ Cannot create session without points_earned:', error1.message);
      } else {
        console.log('✅ Can create session without points_earned');
        // Clean up
        await supabase.from('game_sessions').delete().eq('id', session1.id);
      }
      
      // Try with points_earned
      const testSessionWithPoints = {
        ...testSessionData,
        points_earned: 5
      };
      
      const { data: session2, error: error2 } = await supabase
        .from('game_sessions')
        .insert(testSessionWithPoints)
        .select()
        .single();
      
      if (error2) {
        console.log('❌ Cannot create session with points_earned:', error2.message);
      } else {
        console.log('✅ Can create session with points_earned');
        // Clean up
        await supabase.from('game_sessions').delete().eq('id', session2.id);
      }
    }
    
    // 4. Summary and recommendations
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('====================');
    
    if (!profile.auth_user_id) {
      console.log('🚨 MAIN ISSUE: Profile not linked to auth system');
      console.log('   - Telegram user exists in profiles table');
      console.log('   - But no connection to auth.users table');
      console.log('   - gameScoreManager.js cannot save scores');
      console.log('\n🔧 SOLUTION: Need to create proper auth user for Telegram user');
    }
    
    console.log('\n🎯 IMMEDIATE FIXES NEEDED:');
    console.log('1. Add points_earned column to game_sessions table');
    console.log('2. Ensure Telegram users have proper auth linkage');
    console.log('3. Update gameScoreManager to handle missing columns gracefully');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

fixTelegramIssue();