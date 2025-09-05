/**
 * Point Awarding System Test (ES Module)
 * Tests the point awarding system through direct database operations
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role for testing
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'demo-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test user data
const TEST_USER = {
  username: 'points_test_user_' + Date.now(),
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
        username: TEST_USER.username,
        points: TEST_USER.points,
        user_type: 'regular_user',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create test user:', error.message);
      return false;
    }
    
    console.log('✅ Test user created:', data.username);
    TEST_USER.id = data.id; // Store the generated ID
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
      .eq('username', TEST_USER.username)
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
      .eq('username', TEST_USER.username)
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
 * Test game session recording and point awarding simulation
 */
async function testGamePointAwarding() {
  console.log('\n2️⃣ Testing Game Point Awarding...');
  
  const gameTests = [
    {
      name: 'Marks of Destiny Win',
      gameType: 'marks-of-destiny',
      score: 100,
      pointsToAward: 15,
      scenario: 'Player wins against AI'
    },
    {
      name: 'Path of Enlightenment Achievement',
      gameType: 'path-of-enlightenment',
      score: 2048,
      pointsToAward: 25,
      scenario: 'Reached 2048 tile'
    },
    {
      name: 'Sacred Tapping Session',
      gameType: 'sacred-tapping',
      score: 500,
      pointsToAward: 10,
      scenario: 'High accuracy session'
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
        .eq('username', TEST_USER.username)
        .single();
      
      const pointsBefore = beforeData?.points || 0;
      
      // Simulate point awarding for game completion
      const newPoints = pointsBefore + test.pointsToAward;
      const { error: pointError } = await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('username', TEST_USER.username);
      
      if (pointError) {
        console.error(`   ❌ ${test.name} - Point awarding failed:`, pointError.message);
        allTestsPassed = false;
        continue;
      }
      
      // Verify points were awarded
      const { data: afterData } = await supabase
        .from('profiles')
        .select('points')
        .eq('username', TEST_USER.username)
        .single();
      
      const pointsAfter = afterData?.points || 0;
      const pointsAwarded = pointsAfter - pointsBefore;
      
      if (pointsAwarded === test.pointsToAward) {
        console.log(`   ✅ ${test.name} - ${test.scenario}: +${pointsAwarded} points`);
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
      .eq('username', TEST_USER.username)
      .single();
    
    const startingPoints = startData?.points || 0;
    console.log(`   Starting points: ${startingPoints}`);
    
    // Simulate multiple game sessions
    const sessions = [
      { gameType: 'marks-of-destiny', points: 10, description: 'Quick win' },
      { gameType: 'path-of-enlightenment', points: 15, description: 'Tile achievement' },
      { gameType: 'sacred-tapping', points: 5, description: 'Participation' },
      { gameType: 'marks-of-destiny', points: 20, description: 'Perfect game' },
      { gameType: 'path-of-enlightenment', points: 30, description: 'High score' }
    ];
    
    let currentPoints = startingPoints;
    
    for (const session of sessions) {
      currentPoints += session.points;
      
      const { error } = await supabase
        .from('profiles')
        .update({ points: currentPoints })
        .eq('username', TEST_USER.username);
      
      if (error) {
        console.error(`   ❌ Failed to update points for ${session.gameType}:`, error.message);
        return false;
      }
      
      console.log(`   ✅ ${session.gameType} (${session.description}): +${session.points} points (Total: ${currentPoints})`);
      
      // Small delay to simulate real gameplay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Verify final total
    const { data: finalData } = await supabase
      .from('profiles')
      .select('points')
      .eq('username', TEST_USER.username)
      .single();
    
    const finalPoints = finalData?.points || 0;
    const expectedTotal = startingPoints + sessions.reduce((sum, s) => sum + s.points, 0);
    
    if (finalPoints === expectedTotal) {
      console.log(`   ✅ Point accumulation successful: ${finalPoints} total points`);
      console.log(`   ✅ Total points earned this session: ${finalPoints - startingPoints}`);
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
 * Test leaderboard functionality
 */
async function testLeaderboard() {
  console.log('\n4️⃣ Testing Leaderboard Functionality...');
  
  try {
    // Get top users by points
    const { data: leaderboard, error } = await supabase
      .from('profiles')
      .select('username, points, telegram_first_name')
      .order('points', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('   ❌ Leaderboard query failed:', error.message);
      return false;
    }
    
    console.log('   ✅ Current leaderboard (Top 10):');
    leaderboard.forEach((user, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      const displayName = user.telegram_first_name || user.username;
      console.log(`   ${medal} ${index + 1}. ${displayName}: ${user.points} points`);
    });
    
    // Check if our test user appears in results
    const testUserInLeaderboard = leaderboard.find(user => user.username === TEST_USER.username);
    if (testUserInLeaderboard) {
      const position = leaderboard.findIndex(user => user.username === TEST_USER.username) + 1;
      console.log(`   ✅ Test user found in leaderboard at position ${position} with ${testUserInLeaderboard.points} points`);
    } else {
      console.log(`   ℹ️  Test user not in top 10 (this is normal for new users)`);
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Leaderboard test failed:', error.message);
    return false;
  }
}

/**
 * Test point constraints and validation
 */
async function testPointValidation() {
  console.log('\n5️⃣ Testing Point Validation...');
  
  try {
    const { data: beforeData } = await supabase
      .from('profiles')
      .select('points')
      .eq('username', TEST_USER.username)
      .single();
    
    const currentPoints = beforeData?.points || 0;
    
    // Test 1: Large point values
    console.log('   Testing large point values...');
    const largePoints = 999999;
    const { error: largeError } = await supabase
      .from('profiles')
      .update({ points: largePoints })
      .eq('username', TEST_USER.username);
    
    if (largeError) {
      console.log('   ⚠️  Large point values rejected:', largeError.message);
    } else {
      console.log('   ✅ Large point values accepted');
      // Reset to previous value
      await supabase
        .from('profiles')
        .update({ points: currentPoints })
        .eq('username', TEST_USER.username);
    }
    
    // Test 2: Point increment operations
    console.log('   Testing point increment operations...');
    const incrementAmount = 25;
    const { data: incrementResult, error: incrementError } = await supabase
      .from('profiles')
      .update({ points: currentPoints + incrementAmount })
      .eq('username', TEST_USER.username)
      .select()
      .single();
    
    if (incrementError) {
      console.error('   ❌ Point increment failed:', incrementError.message);
      return false;
    }
    
    if (incrementResult.points === currentPoints + incrementAmount) {
      console.log(`   ✅ Point increment successful: +${incrementAmount} points`);
    } else {
      console.error(`   ❌ Point increment mismatch`);
      return false;
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
    // Delete test user
    const { error: userError } = await supabase
      .from('profiles')
      .delete()
      .eq('username', TEST_USER.username);
    
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
    gamePointAwarding: false,
    pointAccumulation: false,
    leaderboard: false,
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
    
    // Test 3: Game point awarding
    results.gamePointAwarding = await testGamePointAwarding();
    
    // Test 4: Point accumulation
    results.pointAccumulation = await testPointAccumulation();
    
    // Test 5: Leaderboard
    results.leaderboard = await testLeaderboard();
    
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
    gamePointAwarding: 'Game Point Awarding',
    pointAccumulation: 'Point Accumulation',
    leaderboard: 'Leaderboard Functionality',
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
    console.log('   • Database point storage: ✅ Working');
    console.log('   • Point persistence: ✅ Verified');
    console.log('   • Point accumulation: ✅ Functional');
    console.log('   • Leaderboard integration: ✅ Working');
    console.log('   • Point validation: ✅ Tested');
    console.log('   • Game reward system: ✅ Ready for integration');
    console.log('\n🎮 Next Steps:');
    console.log('   • Integrate point awarding into game completion handlers');
    console.log('   • Implement reward tiers and bonuses');
    console.log('   • Add achievement tracking');
    console.log('   • Consider daily/weekly challenges');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    console.log('\n🔧 Recommendations:');
    if (!results.basicAwarding) {
      console.log('   • Check database permissions and table structure');
    }
    if (!results.gamePointAwarding) {
      console.log('   • Verify game integration points');
    }
    if (!results.pointAccumulation) {
      console.log('   • Review point calculation logic');
    }
    if (!results.leaderboard) {
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