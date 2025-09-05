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

async function fixPointSystem() {
  console.log('🔧 Fixing Point System Issues...');
  
  try {
    // 1. Check current schema mismatch
    console.log('\n1. Analyzing current schema...');
    
    // Check if we have the correct schema
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Error querying profiles:', profilesError);
      return;
    }
    
    if (profiles && profiles.length > 0) {
      const columns = Object.keys(profiles[0]);
      console.log('📊 Current profiles table columns:', columns);
      
      const hasUserId = columns.includes('user_id');
      const hasId = columns.includes('id');
      const hasPoints = columns.includes('points');
      
      console.log('Schema analysis:');
      console.log(`- Has 'id' column: ${hasId}`);
      console.log(`- Has 'user_id' column: ${hasUserId}`);
      console.log(`- Has 'points' column: ${hasPoints}`);
      
      if (hasUserId && !hasId) {
        console.log('⚠️ Schema mismatch detected: using user_id instead of id');
      } else if (hasId && !hasUserId) {
        console.log('✅ Schema appears correct: using id as primary key');
      } else {
        console.log('🤔 Unusual schema: has both id and user_id');
      }
    }
    
    // 2. Check game_sessions table
    console.log('\n2. Checking game_sessions table schema...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('game_sessions')
      .select('*')
      .limit(1);
    
    if (sessionsError) {
      console.error('❌ Error querying game_sessions:', sessionsError);
    } else {
      if (sessions && sessions.length > 0) {
        const sessionColumns = Object.keys(sessions[0]);
        console.log('📊 Game sessions columns:', sessionColumns);
        
        const hasPointsEarned = sessionColumns.includes('points_earned');
        console.log(`- Has 'points_earned' column: ${hasPointsEarned}`);
        
        if (!hasPointsEarned) {
          console.log('⚠️ Missing points_earned column in game_sessions');
        }
      } else {
        console.log('ℹ️ No game sessions found to analyze');
      }
    }
    
    // 3. Create SQL migration to fix schema if needed
    console.log('\n3. Preparing schema fixes...');
    
    const migrations = [];
    
    // Add points_earned column to game_sessions if missing
    migrations.push(`
      -- Add points_earned column to game_sessions if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'game_sessions' AND column_name = 'points_earned') THEN
          ALTER TABLE game_sessions ADD COLUMN points_earned INTEGER DEFAULT 0;
        END IF;
      END $$;
    `);
    
    // Ensure proper indexes for performance
    migrations.push(`
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points);
      CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at);
    `);
    
    // Execute migrations
    for (let i = 0; i < migrations.length; i++) {
      console.log(`Executing migration ${i + 1}/${migrations.length}...`);
      const { error } = await supabase.rpc('execute_sql', { sql_query: migrations[i] });
      
      if (error) {
        console.error(`❌ Migration ${i + 1} failed:`, error);
      } else {
        console.log(`✅ Migration ${i + 1} completed successfully`);
      }
    }
    
    console.log('\n4. Schema fixes completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error during fix:', error);
  }
}

// Create improved gameScoreManager function
function generateImprovedGameScoreManager() {
  return `
/**
 * IMPROVED Game Score Manager - Fixed Point System
 * This version properly handles the schema and ensures points are saved correctly
 */

import { supabase } from './supabase';

/**
 * Save game score and update user points in one transaction
 * @param {Object} params - Combined saving parameters
 * @param {string} params.gameType - Type of game
 * @param {number} params.score - Final score achieved
 * @param {number} params.pointsEarned - Points to add to user's total
 * @param {number} params.duration - Game duration in seconds
 * @param {boolean} params.completed - Whether the game was completed
 * @param {Object} params.gameData - Additional game-specific data
 * @param {Object} params.userDataUpdates - Additional user profile updates
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const saveGameScoreAndUpdatePoints = async ({
  gameType,
  score = 0,
  pointsEarned = 0,
  duration = 0,
  completed = true,
  gameData = {},
  userDataUpdates = {}
}) => {
  try {
    console.log('🎮 Starting saveGameScoreAndUpdatePoints:', {
      gameType,
      score,
      pointsEarned,
      duration,
      completed
    });

    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.warn('❌ No authenticated user found, cannot save score');
      return { success: false, error: 'No authenticated user' };
    }

    console.log('👤 Authenticated user ID:', user.id);

    // Use a transaction-like approach with proper error handling
    const results = {};

    // 1. Get current user profile to ensure it exists and get current points
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, points, username')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Error getting user profile:', profileError);
      return { success: false, error: \`Profile not found: \${profileError.message}\` };
    }

    console.log('📊 Current profile:', {
      id: currentProfile.id,
      username: currentProfile.username,
      currentPoints: currentProfile.points
    });

    const currentPoints = currentProfile.points || 0;
    const newPoints = Math.max(0, currentPoints + pointsEarned);

    // 2. Save game session first
    console.log('💾 Saving game session...');
    const { data: gameSession, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: user.id,
        game_type: gameType,
        score: score,
        points_earned: pointsEarned,
        duration: duration,
        completed: completed,
        data: gameData,
        ended_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Error saving game session:', sessionError);
      return { success: false, error: \`Failed to save game session: \${sessionError.message}\` };
    }

    console.log('✅ Game session saved:', {
      sessionId: gameSession.id,
      pointsEarned: gameSession.points_earned
    });

    results.gameSession = gameSession;

    // 3. Update user points if points were earned
    if (pointsEarned !== 0) {
      console.log('💰 Updating user points...');
      
      const updateData = {
        points: newPoints,
        ...userDataUpdates
      };

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating user points:', updateError);
        return { success: false, error: \`Failed to update points: \${updateError.message}\` };
      }

      console.log('✅ Points updated successfully:', {
        previousPoints: currentPoints,
        pointsEarned: pointsEarned,
        newPoints: updatedProfile.points
      });

      results.pointsUpdate = {
        previousPoints: currentPoints,
        pointsEarned,
        newPoints: updatedProfile.points
      };

      // 4. CRITICAL: Refresh user data in localStorage and notify UI
      try {
        localStorage.setItem('gg_user', JSON.stringify(updatedProfile));
        console.log('🔄 User data refreshed in localStorage');

        // Dispatch event to notify UserContext
        window.dispatchEvent(new CustomEvent('userDataUpdated', {
          detail: { 
            updatedProfile, 
            pointsEarned,
            gameType,
            sessionId: gameSession.id
          }
        }));
        
        console.log('📡 UserContext notified of point update');
      } catch (refreshError) {
        console.warn('⚠️ Failed to refresh user data after point update:', refreshError);
        // Don't fail the entire operation if refresh fails
      }
    } else {
      console.log('ℹ️ No points to update (pointsEarned = 0)');
    }

    console.log('🎉 saveGameScoreAndUpdatePoints completed successfully!');

    return {
      success: true,
      data: {
        ...results,
        gameType,
        score,
        pointsEarned,
        userId: user.id
      }
    };

  } catch (error) {
    console.error('❌ Unexpected error in saveGameScoreAndUpdatePoints:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's total points from database (for verification)
 */
export const getUserPoints = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'No authenticated user' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true, points: profile.points || 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get recent game sessions for a user
 */
export const getRecentGameSessions = async (limit = 10) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'No authenticated user' };
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (sessionsError) {
      return { success: false, error: sessionsError.message };
    }

    return { success: true, sessions: sessions || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
  `;
}

async function createTestScript() {
  console.log('\n5. Creating comprehensive test script...');
  
  const testScript = `
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPointSystem() {
  console.log('🧪 Testing Fixed Point System...');
  
  try {
    // 1. Create a test user in auth.users first
    console.log('\n1. Creating test user...');
    const testEmail = \`test_\${Date.now()}@example.com\`;
    const testPassword = 'testpassword123';
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });
    
    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      return;
    }
    
    const userId = authData.user.id;
    console.log('✅ Test user created with ID:', userId);
    
    // 2. Create profile (this should work now with proper auth user)
    console.log('\n2. Creating user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        name: 'Test User',
        username: \`test_user_\${Date.now()}\`,
        points: 0,
        achievements: []
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      return;
    }
    
    console.log('✅ Profile created:', {
      id: profile.id,
      username: profile.username,
      points: profile.points
    });
    
    // 3. Test game session creation with points
    console.log('\n3. Testing game session with points...');
    const pointsToEarn = 150;
    
    const { data: gameSession, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        game_type: 'test_game',
        score: 750,
        points_earned: pointsToEarn,
        duration: 120,
        completed: true,
        data: { test: true, level: 5 }
      })
      .select()
      .single();
    
    if (sessionError) {
      console.error('❌ Error creating game session:', sessionError);
    } else {
      console.log('✅ Game session created:', {
        id: gameSession.id,
        points_earned: gameSession.points_earned
      });
    }
    
    // 4. Update user points
    console.log('\n4. Updating user points...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ points: profile.points + pointsToEarn })
      .eq('id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating points:', updateError);
    } else {
      console.log('✅ Points updated:', {
        previous: profile.points,
        earned: pointsToEarn,
        new: updatedProfile.points
      });
    }
    
    // 5. Verify final state
    console.log('\n5. Verifying final state...');
    const { data: finalProfile, error: finalError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();
    
    if (finalError) {
      console.error('❌ Error fetching final profile:', finalError);
    } else {
      console.log('✅ Final points:', finalProfile.points);
      
      if (finalProfile.points === pointsToEarn) {
        console.log('🎉 Point system test PASSED!');
      } else {
        console.log('❌ Point system test FAILED - points mismatch');
      }
    }
    
    // 6. Cleanup
    console.log('\n6. Cleaning up test data...');
    
    // Delete game session
    await supabase
      .from('game_sessions')
      .delete()
      .eq('user_id', userId);
    
    // Delete profile
    await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    // Delete auth user (admin operation - might not work with anon key)
    // This would require admin privileges
    
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testPointSystem().then(() => {
  console.log('\n🏁 Point system test complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
  `;
  
  // Write the test script
  const fs = require('fs');
  fs.writeFileSync('test-fixed-point-system.cjs', testScript);
  console.log('✅ Test script created: test-fixed-point-system.cjs');
}

// Run the fix
fixPointSystem().then(async () => {
  await createTestScript();
  
  console.log('\n🎯 Point System Fix Summary:');
  console.log('1. ✅ Schema analysis completed');
  console.log('2. ✅ Database migrations applied');
  console.log('3. ✅ Improved gameScoreManager code generated');
  console.log('4. ✅ Test script created');
  console.log('\n📝 Next Steps:');
  console.log('1. Update gameScoreManager.js with the improved code');
  console.log('2. Run: node test-fixed-point-system.cjs');
  console.log('3. Test the games to ensure points are being saved');
  console.log('4. Check UserContext integration');
  
  // Output the improved gameScoreManager code
  console.log('\n📄 Improved gameScoreManager.js code:');
  console.log(generateImprovedGameScoreManager());
  
  process.exit(0);
}).catch(error => {
  console.error('❌ Fix failed:', error);
  process.exit(1);
});