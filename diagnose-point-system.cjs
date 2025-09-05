const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosePointSystem() {
  console.log('🔍 Diagnosing Point System Issues...');
  
  try {
    // 1. Check current profiles table structure
    console.log('\n1. Checking profiles table structure...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Error querying profiles:', profilesError);
      return;
    }
    
    if (profiles && profiles.length > 0) {
      console.log('✅ Profiles table columns:', Object.keys(profiles[0]));
      console.log('📊 Sample profile data:', {
        id: profiles[0].id,
        user_id: profiles[0].user_id,
        points: profiles[0].points,
        username: profiles[0].username
      });
    } else {
      console.log('⚠️ No profiles found in database');
    }
    
    // 2. Check game_sessions table
    console.log('\n2. Checking game_sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('game_sessions')
      .select('*')
      .limit(5)
      .order('created_at', { ascending: false });
    
    if (sessionsError) {
      console.error('❌ Error querying game_sessions:', sessionsError);
    } else {
      console.log('✅ Recent game sessions:', sessions?.length || 0);
      if (sessions && sessions.length > 0) {
        console.log('📊 Sample session:', {
          id: sessions[0].id,
          user_id: sessions[0].user_id,
          game_type: sessions[0].game_type,
          score: sessions[0].score,
          points_earned: sessions[0].points_earned
        });
      }
    }
    
    // 3. Test creating a test user and adding points
    console.log('\n3. Testing point addition system...');
    const testUserId = uuidv4();
    const testUsername = `test_user_${Date.now()}`;
    
    // Create test profile
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        user_id: testUserId,
        username: testUsername,
        points: 0,
        achievements: []
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating test profile:', createError);
      return;
    }
    
    console.log('✅ Test profile created:', {
      id: newProfile.id,
      user_id: newProfile.user_id,
      username: newProfile.username,
      points: newProfile.points
    });
    
    // 4. Test adding points
    console.log('\n4. Testing point addition...');
    const pointsToAdd = 100;
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ points: newProfile.points + pointsToAdd })
      .eq('user_id', testUserId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating points:', updateError);
    } else {
      console.log('✅ Points updated successfully:', {
        previous_points: newProfile.points,
        points_added: pointsToAdd,
        new_points: updatedProfile.points
      });
    }
    
    // 5. Test game session creation
    console.log('\n5. Testing game session creation...');
    const { data: gameSession, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: testUserId,
        game_type: 'test_game',
        score: 500,
        points_earned: pointsToAdd,
        duration: 60,
        completed: true,
        game_data: { test: true }
      })
      .select()
      .single();
    
    if (sessionError) {
      console.error('❌ Error creating game session:', sessionError);
    } else {
      console.log('✅ Game session created:', {
        id: gameSession.id,
        user_id: gameSession.user_id,
        game_type: gameSession.game_type,
        points_earned: gameSession.points_earned
      });
    }
    
    // 6. Check if points are properly linked
    console.log('\n6. Verifying point consistency...');
    const { data: finalProfile, error: finalError } = await supabase
      .from('profiles')
      .select('points')
      .eq('user_id', testUserId)
      .single();
    
    if (finalError) {
      console.error('❌ Error fetching final profile:', finalError);
    } else {
      console.log('✅ Final profile points:', finalProfile.points);
      
      if (finalProfile.points === pointsToAdd) {
        console.log('🎉 Point system is working correctly!');
      } else {
        console.log('⚠️ Point mismatch detected!');
      }
    }
    
    // 7. Cleanup test data
    console.log('\n7. Cleaning up test data...');
    
    // Delete game session
    await supabase
      .from('game_sessions')
      .delete()
      .eq('user_id', testUserId);
    
    // Delete test profile
    await supabase
      .from('profiles')
      .delete()
      .eq('user_id', testUserId);
    
    console.log('✅ Test data cleaned up');
    
    // 8. Identify potential issues
    console.log('\n8. Potential Issues Analysis:');
    console.log('- Check if games are using the correct user ID field (user_id vs id)');
    console.log('- Verify that saveGameScoreAndUpdatePoints is being called correctly');
    console.log('- Ensure UserContext is properly syncing with database updates');
    console.log('- Check if there are any authentication issues preventing point saves');
    
  } catch (error) {
    console.error('❌ Unexpected error during diagnosis:', error);
  }
}

// Run the diagnosis
diagnosePointSystem().then(() => {
  console.log('\n🏁 Diagnosis complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Diagnosis failed:', error);
  process.exit(1);
});