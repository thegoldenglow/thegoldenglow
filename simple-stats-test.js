/**
 * Simple test to verify game statistics update functionality
 * This test directly uses Supabase to test the database operations
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStatsUpdate() {
  console.log('🎮 Testing Game Statistics Update\n');
  
  try {
    // Get a test user
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError.message);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('❌ No test users found. Creating a test user...');
      
      // Create a test user
      const { data: newUser, error: createError } = await supabase
        .from('profiles')
        .insert({
          username: 'test_user_' + Date.now(),
          points: 100,
          stats: {
            gamesPlayed: 0,
            highestScore: 0,
            totalTimePlayed: 0,
            loginStreak: 0,
            longestLoginStreak: 0,
            lastLogin: new Date().toISOString(),
            gameStats: {}
          }
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating test user:', createError.message);
        return;
      }
      
      console.log('✅ Created test user:', newUser.username);
      profiles[0] = newUser;
    }
    
    const testUser = profiles[0];
    console.log('👤 Using test user:', testUser.username || testUser.name);
    console.log('📊 Current stats:', {
      points: testUser.points,
      gamesPlayed: testUser.stats?.gamesPlayed || 0,
      highestScore: testUser.stats?.highestScore || 0
    });
    
    // Simulate game completion by updating stats directly
    console.log('\n🎯 Simulating game completion...');
    
    const gameScore = 150;
    const pointsEarned = 25;
    const gameDuration = 120;
    
    const currentStats = testUser.stats || {
      gamesPlayed: 0,
      highestScore: 0,
      totalTimePlayed: 0,
      loginStreak: 0,
      longestLoginStreak: 0,
      lastLogin: new Date().toISOString(),
      gameStats: {}
    };
    
    const updatedStats = {
      ...currentStats,
      gamesPlayed: (currentStats.gamesPlayed || 0) + 1,
      highestScore: Math.max(currentStats.highestScore || 0, gameScore),
      totalTimePlayed: (currentStats.totalTimePlayed || 0) + gameDuration,
      gameStats: {
        ...currentStats.gameStats,
        PathOfEnlightenment: {
          gamesPlayed: ((currentStats.gameStats?.PathOfEnlightenment?.gamesPlayed) || 0) + 1,
          highestScore: Math.max((currentStats.gameStats?.PathOfEnlightenment?.highestScore) || 0, gameScore),
          totalTimePlayed: ((currentStats.gameStats?.PathOfEnlightenment?.totalTimePlayed) || 0) + gameDuration
        }
      }
    };
    
    // Update the user profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        points: testUser.points + pointsEarned,
        stats: updatedStats
      })
      .eq('id', testUser.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating profile:', updateError.message);
      return;
    }
    
    console.log('✅ Profile updated successfully!');
    console.log('📈 Updated stats:', {
      points: updatedProfile.points,
      gamesPlayed: updatedProfile.stats?.gamesPlayed || 0,
      highestScore: updatedProfile.stats?.highestScore || 0,
      totalTimePlayed: updatedProfile.stats?.totalTimePlayed || 0
    });
    
    // Verify the changes
    const expectedGamesPlayed = (testUser.stats?.gamesPlayed || 0) + 1;
    const expectedHighestScore = Math.max(testUser.stats?.highestScore || 0, gameScore);
    const expectedPoints = testUser.points + pointsEarned;
    
    console.log('\n🔍 Verification:');
    
    if (updatedProfile.stats?.gamesPlayed === expectedGamesPlayed) {
      console.log('✅ Games played count updated correctly!');
    } else {
      console.log('❌ Games played count not updated correctly');
      console.log(`   Expected: ${expectedGamesPlayed}, Got: ${updatedProfile.stats?.gamesPlayed}`);
    }
    
    if (updatedProfile.stats?.highestScore === expectedHighestScore) {
      console.log('✅ Highest score updated correctly!');
    } else {
      console.log('❌ Highest score not updated correctly');
      console.log(`   Expected: ${expectedHighestScore}, Got: ${updatedProfile.stats?.highestScore}`);
    }
    
    if (updatedProfile.points === expectedPoints) {
      console.log('✅ Points updated correctly!');
    } else {
      console.log('❌ Points not updated correctly');
      console.log(`   Expected: ${expectedPoints}, Got: ${updatedProfile.points}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testStatsUpdate().then(() => {
  console.log('\n🏁 Test completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});