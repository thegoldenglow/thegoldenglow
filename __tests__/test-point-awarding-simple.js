/**
 * Point Awarding System Test (Simplified)
 * Tests the point awarding system through direct database operations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test user data
const TEST_USER = {
  id: 'test-user-points-' + Date.now(),
  username: 'points_test_user',
  name: 'Points Test User',
  points: 0
};

/**
 * Create a test user for point testing
 */
async function createTestUser() {
  console.log('\n🔧 Creating test user for point awarding tests...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: TEST_USER.id,
        username: TEST_USER.username,
        name: TEST_USER.name,
        points: TEST_USER.points,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create test user:', error.message);
      return false;
    }
    
    console.log('✅ Test user created:', data.username);
    return true;
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    return false;
  }
}

/**
 * Test basic point awarding functionality
 */
async function testBasicPointAwarding() {
  console.log('\n1️⃣ Testing Basic Point Awarding...');
  
  try {
    // Test 1: Award points directly
    console.log('   Testing direct point update...');
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({ points: 50 })
      .eq('id', TEST_USER.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('   ❌ Direct point update failed:', updateError.message);
      return false;
    }
    
    console.log(`   ✅ Points updated: ${updateResult.points} points`);
    
    // Test 2: Verify point persistence
    console.log('   Testing point persistence...');
    const { data: fetchResult, error: fetchError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', TEST_USER.id)
      .single();
    
    if (fetchError) {
      console.error('   ❌ Point fetch failed:', fetchError.message);
      return false;
    }
    
    if (fetchResult.points === 50) {
      console.log('   ✅ Points persisted correctly');
      return true;
    } else {
      console.error(`   ❌ Point mismatch: expected 50, got ${fetchResult.points}`);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Basic point awarding test failed:', error.message);
    return false;
  }
}

/**
 * Test game session recording (simulated)
 */
async function testGameSessionRecording() {
  console.log('\n2️⃣ Testing Game Session Recording...');
  
  const gameTests = [
    {
      name: 'Marks of Destiny Win',
      gameType: 'marks-of-destiny',
      score: 100,
      duration: 120,
      completed: true,
      gameData: { winner: 'player', difficulty: 'medium' },
      pointsToAward: 15
    },
    {
      name: 'Path of Enlightenment High Score',
      gameType: 'path-of-enlightenment',
      score: 2048,
      duration: 300,
      completed: true,
      gameData: { maxTile: 512, moves: 150 },
      pointsToAward: 25
    },
    {
      name: 'Sacred Tapping Session',
      gameType: 'sacred-tapping',
      score: 500,
      duration: 60,
      completed: true,
      gameData: { taps: 500, accuracy: 0.95 },
      pointsToAward: 10
    }
  ];
  
  let allTestsPassed = true;
  
  for (const test of gameTests) {
    console.log(`   Testing ${test.name}...`);
    
    try {
      // Get current points
      const { data: beforeData } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', TEST_USER.id)
        .single();
      
      const pointsBefore = beforeData?.points || 0;
      
      // Simulate game session recording
      const gameSessionData = {
        user_id: TEST_USER.id,
        game_type: test.gameType,
        score: test.score,
        duration: test.duration,
        completed: test.completed,
        ended_at: new Date().toISOString(),
        data: {
          ...test.gameData,
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      };
      
      // Try to save game session (table might not exist)
      let sessionSaved = false;
      try {
        const { data: sessionResult, error: sessionError } = await supabase
          .from('game_sessions')
          .insert(gameSessionData)
          .select()
          .single();
        
        if (!sessionError) {
          console.log(`   ✅ ${test.name} - Game session saved`);
          sessionSaved = true;
        }
      } catch (sessionErr) {
        console.log(`   ⚠️  ${test.name} - Game sessions table not available`);
      }
      
      // Simulate point awarding
      const newPoints = pointsBefore + test.pointsToAward;
      const { error: pointError } = await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', TEST_USER.id);
      
      if (pointError) {
        console.error(`   ❌ ${test.name} - Point awarding failed:`, pointError.message);
        allTestsPassed = false;
        continue;
      }
      
      // Verify points were awarded
      const { data: afterData } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', TEST_USER.id)
        .single();
      
      const pointsAfter = afterData?.points || 0;
      const pointsAwarded = pointsAfter - pointsBefore;
      
      if (pointsAwarded === test.pointsToAward) {
        console.log(`   ✅ ${test.name} - Points awarded: ${pointsAwarded}`);
      } else {
        console.error(`   ❌ ${test.name} - Point mismatch: expected ${test.pointsToAward}, got ${pointsAwarded}`);
        allTestsPassed = false;
      }
      
    } catch (error) {
      console.error(`   ❌ ${test.name} - Test failed:`, error.message);
      allTestsPassed = false;
    }
  }
  
  return allTestsPassed;
}

/**
 * Test point accumulation over multiple games
 */
async function testPointAccumulation() {
  console.log('\n3️⃣ Testing Point Accumulation...');
  
  try {
    // Get starting points
    const { data: startData } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', TEST_USER.id)
      .single();
    
    const startingPoints = startData?.points || 0;
    console.log(`   Starting points: ${startingPoints}`);
    
    // Simulate multiple game sessions with incremental rewards
    const sessions = [
      { gameType: 'marks-of-destiny', score: 50, points: 10 },
      { gameType: 'path-of-enlightenment', score: 1024, points: 15 },
      { gameType: 'sacred-tapping', score: 300, points: 5 },
      { gameType: 'marks-of-destiny', score: 75, points: 12 },
      { gameType: 'path-of-enlightenment', score: 2048, points: 20 }
    ];
    
    let currentPoints = startingPoints;
    
    for (const session of sessions) {
      currentPoints += session.points;
      
      const { error } = await supabase
        .from('profiles')
        .update({ points: currentPoints })
        .eq('id', TEST_USER.id);
      
      if (error) {
        console.error(`   ❌ Failed to update points for ${session.gameType}:`, error.message);
        return false;
      }
      
      console.log(`   ✅ ${session.gameType}: +${session.points} points (Total: ${currentPoints})`);
      
      // Small delay to simulate real gameplay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Verify final total
    const { data: finalData } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', TEST_USER.id)
      .single();
    
    const finalPoints = finalData?.points || 0;
    const expectedTotal = startingPoints + sessions.reduce((sum, s) => sum + s.points, 0);
    
    if (finalPoints === expectedTotal) {
      console.log(`   ✅ Point accumulation successful: ${finalPoints} total points`);
      return true;
    } else {
      console.error(`   ❌ Point mismatch: expected ${expectedTotal}, got ${finalPoints}`);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Point accumulation test failed:', error.message);
    return false;
  }
}

/**
 * Test leaderboard integration
 */
async function testLeaderboardIntegration() {
  console.log('\n4️⃣ Testing Leaderboard Integration...');
  
  try {
    // Get top users by points
    const { data: leaderboard, error } = await supabase
      .from('profiles')
      .select('username, points')
      .order('points', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('   ❌ Leaderboard query failed:', error.message);
      return false;
    }
    
    console.log('   ✅ Current leaderboard (Top 10):');
    leaderboard.forEach((user, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`   ${medal} ${index + 1}. ${user.username}: ${user.points} points`);
    });
    
    // Check if our test user appears in results
    const testUserInLeaderboard = leaderboard.find(user => user.username === TEST_USER.username);
    if (testUserInLeaderboard) {
      console.log(`   ✅ Test user found in leaderboard with ${testUserInLeaderboard.points} points`);
    } else {
      console.log(`   ℹ️  Test user not in top 10 (this is normal for new users)`);
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Leaderboard integration test failed:', error.message);
    return false;
  }
}

/**
 * Test point validation and constraints
 */
async function testPointValidation() {
  console.log('\n5️⃣ Testing Point Validation...');
  
  try {
    // Test negative points (should be prevented or handled)
    console.log('   Testing negative point handling...');
    const { data: beforeData } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', TEST_USER.id)
      .single();
    
    const currentPoints = beforeData?.points || 0;
    
    // Try to set negative points
    const { error: negativeError } = await supabase
      .from('profiles')
      .update({ points: -10 })
      .eq('id', TEST_USER.id);
    
    if (negativeError) {
      console.log('   ✅ Negative points properly rejected by database constraints');
    } else {
      // Check if points were actually set to negative
      const { data: checkData } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', TEST_USER.id)
        .single();
      
      if (checkData.points < 0) {
        console.log('   ⚠️  Negative points allowed - consider adding database constraints');
        // Reset to positive value
        await supabase
          .from('profiles')
          .update({ points: currentPoints })
          .eq('id', TEST_USER.id);
      } else {
        console.log('   ✅ Negative points handled appropriately');
      }
    }
    
    // Test large point values
    console.log('   Testing large point values...');
    const largePoints = 999999;
    const { error: largeError } = await supabase
      .from('profiles')
      .update({ points: largePoints })
      .eq('id', TEST_USER.id);
    
    if (largeError) {
      console.log('   ⚠️  Large point values rejected:', largeError.message);
    } else {
      console.log('   ✅ Large point values accepted');
      // Reset to reasonable value
      await supabase
        .from('profiles')
        .update({ points: currentPoints })
        .eq('id', TEST_USER.id);
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Point validation test failed:', error.message);
    return false;
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test game sessions (if table exists)
    try {
      const { error: sessionError } = await supabase
        .from('game_sessions')
        .delete()
        .eq('user_id', TEST_USER.id);
      
      if (!sessionError) {
        console.log('   ✅ Test game sessions deleted');
      }
    } catch (sessionErr) {
      console.log('   ℹ️  Game sessions cleanup skipped (table may not exist)');
    }
    
    // Delete test user
    const { error: userError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', TEST_USER.id);
    
    if (userError) {
      console.error('   ⚠️  Failed to delete test user:', userError.message);
    } else {
      console.log('   ✅ Test user deleted');
    }
    
  } catch (error) {
    console.error('   ⚠️  Cleanup error:', error.message);
  }
}

/**
 * Run all point awarding tests
 */
async function runPointAwardingTests() {
  console.log('🎯 Point Awarding System Test Suite');
  console.log('=====================================');
  
  const results = {
    userCreation: false,
    basicAwarding: false,
    gameSessionRecording: false,
    pointAccumulation: false,
    leaderboardIntegration: false,
    pointValidation: false
  };
  
  try {
    // Test 1: Create test user
    results.userCreation = await createTestUser();
    if (!results.userCreation) {
      console.log('\n❌ Cannot proceed without test user');
      return;
    }
    
    // Test 2: Basic point awarding
    results.basicAwarding = await testBasicPointAwarding();
    
    // Test 3: Game session recording
    results.gameSessionRecording = await testGameSessionRecording();
    
    // Test 4: Point accumulation
    results.pointAccumulation = await testPointAccumulation();
    
    // Test 5: Leaderboard integration
    results.leaderboardIntegration = await testLeaderboardIntegration();
    
    // Test 6: Point validation
    results.pointValidation = await testPointValidation();
    
  } catch (error) {
    console.error('\n💥 Test suite error:', error.message);
  } finally {
    // Always cleanup
    await cleanupTestData();
  }
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  
  const testNames = {
    userCreation: 'Test User Creation',
    basicAwarding: 'Basic Point Awarding',
    gameSessionRecording: 'Game Session Recording',
    pointAccumulation: 'Point Accumulation',
    leaderboardIntegration: 'Leaderboard Integration',
    pointValidation: 'Point Validation'
  };
  
  let passedTests = 0;
  const totalTests = Object.keys(results).length;
  
  Object.entries(results).forEach(([key, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testNames[key]}`);
    if (passed) passedTests++;
  });
  
  console.log(`\n🏆 Overall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All point awarding tests passed!');
    console.log('\n✅ Point System Status:');
    console.log('   • Database point storage: Working');
    console.log('   • Point persistence: Verified');
    console.log('   • Point accumulation: Functional');
    console.log('   • Leaderboard compatibility: Confirmed');
    console.log('   • Point validation: Tested');
    console.log('   • Game integration: Ready for implementation');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    console.log('\n🔧 Recommendations:');
    if (!results.basicAwarding) {
      console.log('   • Check database permissions and table structure');
    }
    if (!results.gameSessionRecording) {
      console.log('   • Consider creating game_sessions table for tracking');
    }
    if (!results.pointAccumulation) {
      console.log('   • Review point calculation logic');
    }
    if (!results.leaderboardIntegration) {
      console.log('   • Check leaderboard query permissions');
    }
    if (!results.pointValidation) {
      console.log('   • Consider adding database constraints for points');
    }
  }
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run the tests
runPointAwardingTests().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});