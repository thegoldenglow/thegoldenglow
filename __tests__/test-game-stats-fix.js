/**
 * Test script to verify that game statistics are properly updated
 * Run this script to test the fix for game status elements showing zero
 */

import { saveGameScoreAndUpdatePoints } from './src/utils/gameScoreManager.js';
import { supabase } from './src/utils/supabase.js';

async function testGameStatsUpdate() {
  console.log('🎮 Testing Game Statistics Update Fix\n');
  
  try {
    // First, let's check if we have a test user
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError.message);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('❌ No test users found. Please create a user first.');
      return;
    }
    
    const testUser = profiles[0];
    console.log('👤 Using test user:', testUser.username || testUser.name);
    console.log('📊 Current stats:', {
      points: testUser.points,
      gamesPlayed: testUser.stats?.gamesPlayed || 0,
      highestScore: testUser.stats?.highestScore || 0
    });
    
    // Simulate a game completion
    console.log('\n🎯 Simulating game completion...');
    const gameData = {
      gameType: 'PathOfEnlightenment',
      score: 150,
      pointsEarned: 25,
      duration: 120, // 2 minutes
      completed: true,
      gameData: {
        maxTile: 8,
        moves: 45,
        bestScore: 150,
        bestTile: 8
      }
    };
    
    // Mock the current user for the test
    const mockCurrentUser = {
      id: testUser.id,
      points: testUser.points,
      stats: testUser.stats || {
        gamesPlayed: 0,
        highestScore: 0,
        totalTimePlayed: 0,
        loginStreak: 0,
        longestLoginStreak: 0,
        lastLogin: new Date().toISOString(),
        gameStats: {}
      }
    };
    
    // Call the updated saveGameScoreAndUpdatePoints function
    const result = await saveGameScoreAndUpdatePoints(
      gameData.gameType,
      gameData.score,
      gameData.pointsEarned,
      gameData.duration,
      gameData.completed,
      gameData.gameData,
      mockCurrentUser
    );
    
    if (result.success) {
      console.log('✅ Game score saved successfully!');
      console.log('📈 Updated stats:', result.data.statsUpdated);
      console.log('💰 New total points:', result.data.newTotalPoints);
      
      // Verify the database was updated
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUser.id)
        .single();
      
      if (fetchError) {
        console.error('❌ Error fetching updated profile:', fetchError.message);
      } else {
        console.log('\n🔍 Verified database update:');
        console.log('📊 Final stats:', {
          points: updatedProfile.points,
          gamesPlayed: updatedProfile.stats?.gamesPlayed || 0,
          highestScore: updatedProfile.stats?.highestScore || 0,
          totalTimePlayed: updatedProfile.stats?.totalTimePlayed || 0
        });
        
        // Check if stats were properly incremented
        const expectedGamesPlayed = (testUser.stats?.gamesPlayed || 0) + 1;
        const expectedHighestScore = Math.max(testUser.stats?.highestScore || 0, gameData.score);
        
        if (updatedProfile.stats?.gamesPlayed === expectedGamesPlayed) {
          console.log('✅ Games played count updated correctly!');
        } else {
          console.log('❌ Games played count not updated correctly');
        }
        
        if (updatedProfile.stats?.highestScore === expectedHighestScore) {
          console.log('✅ Highest score updated correctly!');
        } else {
          console.log('❌ Highest score not updated correctly');
        }
      }
    } else {
      console.error('❌ Failed to save game score:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testGameStatsUpdate().then(() => {
  console.log('\n🏁 Test completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});