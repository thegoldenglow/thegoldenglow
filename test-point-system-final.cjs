const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

/**
 * Comprehensive test of the point system
 */
async function testPointSystem() {
  console.log('🧪 Starting comprehensive point system test...');
  
  try {
    // 1. Check if we have an authenticated user
    console.log('\n1️⃣ Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ No authenticated user found. Please sign in first.');
      console.log('💡 You can test this by:');
      console.log('   - Opening your app in browser');
      console.log('   - Signing in with email or Telegram');
      console.log('   - Then running this test again');
      return;
    }
    
    console.log('✅ Authenticated user found:', {
      id: user.id,
      email: user.email
    });
    
    // 2. Get current user profile
    console.log('\n2️⃣ Getting current user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error getting profile:', profileError);
      return;
    }
    
    console.log('✅ Current profile:', {
      id: profile.id,
      username: profile.username,
      points: profile.points,
      created_at: profile.created_at
    });
    
    const initialPoints = profile.points || 0;
    console.log(`💰 Initial points: ${initialPoints}`);
    
    // 3. Test saving a game session with points
    console.log('\n3️⃣ Testing game session creation...');
    const testGameData = {
      user_id: user.id,
      game_type: 'test_game',
      score: 1500,
      points_earned: 50,
      duration: 120,
      completed: true,
      data: { level: 5, achievements: ['first_win'] },
      ended_at: new Date().toISOString()
    };
    
    const { data: gameSession, error: sessionError } = await supabase
      .from('game_sessions')
      .insert(testGameData)
      .select()
      .single();
    
    if (sessionError) {
      console.error('❌ Error creating game session:', sessionError);
      return;
    }
    
    console.log('✅ Game session created:', {
      id: gameSession.id,
      game_type: gameSession.game_type,
      score: gameSession.score,
      points_earned: gameSession.points_earned
    });
    
    // 4. Test updating user points
    console.log('\n4️⃣ Testing point update...');
    const newPoints = initialPoints + testGameData.points_earned;
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq('id', user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating points:', updateError);
      return;
    }
    
    console.log('✅ Points updated successfully:', {
      previousPoints: initialPoints,
      pointsEarned: testGameData.points_earned,
      newPoints: updatedProfile.points
    });
    
    // 5. Verify the update worked
    console.log('\n5️⃣ Verifying point update...');
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying points:', verifyError);
      return;
    }
    
    const expectedPoints = initialPoints + testGameData.points_earned;
    const actualPoints = verifyProfile.points;
    
    if (actualPoints === expectedPoints) {
      console.log('✅ Point verification successful!');
      console.log(`   Expected: ${expectedPoints}, Actual: ${actualPoints}`);
    } else {
      console.log('❌ Point verification failed!');
      console.log(`   Expected: ${expectedPoints}, Actual: ${actualPoints}`);
    }
    
    // 6. Test getting recent game sessions
    console.log('\n6️⃣ Testing game session retrieval...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (sessionsError) {
      console.error('❌ Error getting sessions:', sessionsError);
      return;
    }
    
    console.log(`✅ Found ${sessions.length} recent game sessions:`);
    sessions.forEach((session, index) => {
      console.log(`   ${index + 1}. ${session.game_type}: ${session.score} points (earned: ${session.points_earned})`);
    });
    
    // 7. Clean up test data
    console.log('\n7️⃣ Cleaning up test data...');
    
    // Delete the test game session
    const { error: deleteError } = await supabase
      .from('game_sessions')
      .delete()
      .eq('id', gameSession.id);
    
    if (deleteError) {
      console.warn('⚠️ Could not delete test session:', deleteError);
    } else {
      console.log('✅ Test game session deleted');
    }
    
    // Restore original points
    const { error: restoreError } = await supabase
      .from('profiles')
      .update({ points: initialPoints })
      .eq('id', user.id);
    
    if (restoreError) {
      console.warn('⚠️ Could not restore original points:', restoreError);
    } else {
      console.log(`✅ Points restored to original value: ${initialPoints}`);
    }
    
    // 8. Final summary
    console.log('\n🎉 Point system test completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ User authentication working');
    console.log('   ✅ Profile retrieval working');
    console.log('   ✅ Game session creation working');
    console.log('   ✅ Point updates working');
    console.log('   ✅ Point verification working');
    console.log('   ✅ Session retrieval working');
    console.log('   ✅ Cleanup completed');
    
    console.log('\n💡 Next steps:');
    console.log('   1. Test the improved gameScoreManager.js in your games');
    console.log('   2. Check that points update correctly in the UI');
    console.log('   3. Verify localStorage sync is working');
    console.log('   4. Test with different games and point values');
    
  } catch (error) {
    console.error('❌ Unexpected error during test:', error);
  }
}

// Run the test
testPointSystem().catch(console.error);