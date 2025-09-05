/**
 * Game Score Manager
 * Handles saving game scores to database and updating user points
 */

import { supabase, isSupabaseAvailable } from './supabase';

/**
 * Save a game score to the database
 * @param {Object} params - Score saving parameters
 * @param {string} params.gameType - Type of game (e.g., 'marks-of-destiny', 'path-of-enlightenment')
 * @param {number} params.score - Final score achieved
 * @param {number} params.duration - Game duration in seconds
 * @param {boolean} params.completed - Whether the game was completed
 * @param {Object} params.gameData - Additional game-specific data
 * @param {string} params.userId - User ID (optional, will use current auth user if not provided)
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const saveGameScore = async ({
  gameType,
  score = 0,
  duration = 0,
  completed = true,
  gameData = {},
  userId = null
}) => {
  if (!isSupabaseAvailable()) {
    console.warn('Supabase not available, skipping saveGameScore.');
    return { success: false, error: 'Supabase not available' };
  }
  try {
    // Get current user if userId not provided
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.warn('No authenticated user found, cannot save score to database');
        return { success: false, error: 'No authenticated user' };
      }
      currentUserId = user.id;
    }

    // Prepare game session data
    const gameSessionData = {
      user_id: currentUserId,
      game_type: gameType,
      score: score,
      duration: duration,
      completed: completed,
      ended_at: new Date().toISOString(),
      data: {
        ...gameData,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    };

    // Save to game_sessions table
    const { data: sessionData, error: sessionError } = await supabase
      .from('game_sessions')
      .insert(gameSessionData)
      .select()
      .single();

    if (sessionError) {
      console.error('Error saving game session:', sessionError);
      return { success: false, error: sessionError.message };
    }

    console.log('Game score saved successfully:', {
      gameType,
      score,
      duration,
      sessionId: sessionData.id
    });

    return {
      success: true,
      data: {
        sessionId: sessionData.id,
        gameType,
        score,
        duration,
        completed
      }
    };

  } catch (error) {
    console.error('Error in saveGameScore:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's best score for a specific game
 * @param {string} gameType - Type of game
 * @param {string} userId - User ID (optional, will use current auth user if not provided)
 * @returns {Promise<number>} - Best score or 0 if none found
 */
export const getUserBestScore = async (gameType, userId = null) => {
  if (!isSupabaseAvailable()) {
    console.warn('Supabase not available, skipping getUserBestScore.');
    return 0;
  }
  try {
    // Get current user if userId not provided
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return 0;
      }
      currentUserId = user.id;
    }

    const { data, error } = await supabase
      .from('game_sessions')
      .select('score')
      .eq('user_id', currentUserId)
      .eq('game_type', gameType)
      .order('score', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return 0;
    }

    return data.score || 0;
  } catch (error) {
    console.error('Error getting user best score:', error);
    return 0;
  }
};

/**
 * Get user's game statistics
 * @param {string} gameType - Type of game (optional, if not provided returns stats for all games)
 * @param {string} userId - User ID (optional, will use current auth user if not provided)
 * @returns {Promise<Object>} - Game statistics
 */
export const getUserGameStats = async (gameType = null, userId = null) => {
  if (!isSupabaseAvailable()) {
    console.warn('Supabase not available, skipping getUserGameStats.');
    return {};
  }
  try {
    // Get current user if userId not provided
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return {};
      }
      currentUserId = user.id;
    }

    let query = supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', currentUserId);

    if (gameType) {
      query = query.eq('game_type', gameType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting game stats:', error);
      return {};
    }

    if (!data || data.length === 0) {
      return {
        gamesPlayed: 0,
        totalScore: 0,
        averageScore: 0,
        bestScore: 0,
        totalDuration: 0,
        averageDuration: 0,
        completionRate: 0
      };
    }

    const gamesPlayed = data.length;
    const totalScore = data.reduce((sum, session) => sum + (session.score || 0), 0);
    const bestScore = Math.max(...data.map(session => session.score || 0));
    const totalDuration = data.reduce((sum, session) => sum + (session.duration || 0), 0);
    const completedGames = data.filter(session => session.completed).length;

    return {
      gamesPlayed,
      totalScore,
      averageScore: gamesPlayed > 0 ? Math.round(totalScore / gamesPlayed) : 0,
      bestScore,
      totalDuration,
      averageDuration: gamesPlayed > 0 ? Math.round(totalDuration / gamesPlayed) : 0,
      completionRate: gamesPlayed > 0 ? Math.round((completedGames / gamesPlayed) * 100) : 0
    };
  } catch (error) {
    console.error('Error getting user game stats:', error);
    return {};
  }
};

/**
 * Get game leaderboard
 * @param {string} gameType - Type of game (optional, if not provided returns overall leaderboard)
 * @param {number} limit - Number of top players to return (default: 10)
 * @returns {Promise<Array>} - Leaderboard data
 */
export const getGameLeaderboard = async (gameType = null, limit = 10) => {
  if (!isSupabaseAvailable()) {
    console.warn('Supabase not available, skipping getGameLeaderboard.');
    return [];
  }
  try {
    let query;
    
    if (gameType) {
      // Game-specific leaderboard
      query = supabase
        .from('game_sessions')
        .select(`
          score,
          user_id,
          created_at,
          profiles!game_sessions_user_id_fkey(
            id,
            username,
            avatar_url,
            telegram_username
          )
        `)
        .eq('game_type', gameType)
        .order('score', { ascending: false })
        .limit(limit);
    } else {
      // Overall points leaderboard from profiles
      query = supabase
        .from('profiles')
        .select('id, username, avatar_url, telegram_username, points')
        .order('points', { ascending: false })
        .limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    // Format the data
    return data.map((entry, index) => {
      if (gameType) {
        // Game-specific leaderboard format
        return {
          rank: index + 1,
          id: entry.profiles?.id || entry.user_id,
          username: entry.profiles?.username || entry.profiles?.telegram_username || 'Anonymous',
          avatarUrl: entry.profiles?.avatar_url,
          gameScore: entry.score,
          date: entry.created_at
        };
      } else {
        // Overall leaderboard format
        return {
          rank: index + 1,
          id: entry.id,
          username: entry.username || entry.telegram_username || 'Anonymous',
          avatarUrl: entry.avatar_url,
          points: entry.points
        };
      }
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
};

/**
 * IMPROVED Save game score and update user points - Telegram Compatible
 * Fixed to handle both authenticated users and Telegram users without auth linkage
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
  if (!isSupabaseAvailable()) {
    console.warn('Supabase not available, skipping saveGameScoreAndUpdatePoints.');
    // Fallback to local storage update for guest mode
    const storedUser = localStorage.getItem('gg_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        user.points = (user.points || 0) + pointsEarned;
        // Basic stats update
        if (!user.stats) user.stats = {};
        user.stats.gamesPlayed = (user.stats.gamesPlayed || 0) + 1;
        user.stats.totalScore = (user.stats.totalScore || 0) + score;
        localStorage.setItem('gg_user', JSON.stringify(user));
        return { success: true, data: { pointsEarned, newTotalPoints: user.points }, fromCache: true };
      } catch (e) {
        return { success: false, error: 'Failed to update guest user in local storage' };
      }
    }
    return { success: false, error: 'Supabase not available and no guest user found' };
  }
  try {
    console.log('🎮 Starting saveGameScoreAndUpdatePoints:', {
      gameType,
      score,
      pointsEarned,
      duration,
      completed
    });

    // First, try to get the current user from localStorage (for Telegram users)
    let currentUser = null;
    try {
      const storedUser = localStorage.getItem('gg_user');
      if (storedUser) {
        currentUser = JSON.parse(storedUser);
        console.log('👤 Found user in localStorage:', currentUser.username);
      }
    } catch (e) {
      console.log('No user in localStorage');
    }

    // If no user in localStorage, try auth
    if (!currentUser) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.warn('❌ No authenticated user found, cannot save score');
        return { success: false, error: 'No authenticated user' };
      }

      // Get profile for authenticated user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Error getting user profile:', profileError);
        return { success: false, error: `Profile not found: ${profileError.message}` };
      }

      currentUser = profile;
    }

    if (!currentUser || !currentUser.id) {
      console.error('❌ No valid user found');
      return { success: false, error: 'No valid user found' };
    }

    console.log('📊 Using profile:', {
      id: currentUser.id,
      username: currentUser.username,
      currentPoints: currentUser.points
    });

    // Try to save game session - handle both authenticated and Telegram users
      console.log('💾 Saving game session...');
      let sessionResult = null;
      let sessionError = null;

      // For Telegram users without auth linkage, generate a UUID for the session
      let sessionUserId = null;
      if (currentUser.auth_user_id) {
        sessionUserId = currentUser.auth_user_id;
      } else {
        // Generate a consistent UUID based on profile ID for unlinked users
        sessionUserId = `telegram-${currentUser.id}-${Date.now()}`;
        // Convert to a valid UUID format
        sessionUserId = sessionUserId.padEnd(36, '0').substring(0, 36);
        sessionUserId = sessionUserId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
      }

      // Direct database insert for game session
      const { data: gameSession, error: insertError } = await supabase
        .from('game_sessions')
        .insert({
          user_id: sessionUserId,
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

      if (insertError) {
        console.error('❌ Error saving game session:', insertError);
        return { success: false, error: `Failed to save game session: ${insertError.message}` };
      }

      console.log('✅ Game session saved successfully:', gameSession);
      sessionResult = gameSession;

      // Update user points and stats in profiles table
      console.log('💰 Updating user points and stats...');
      const newPoints = (currentUser.points || 0) + pointsEarned;
      
      // Prepare stats updates
      const currentStats = currentUser.stats || {
        gamesPlayed: 0,
        highestScore: 0,
        totalTimePlayed: 0,
        loginStreak: 0,
        longestLoginStreak: 0,
        lastLogin: new Date().toISOString(),
        gameStats: {}
      };
      
      // Update general stats
      const updatedStats = {
        ...currentStats,
        gamesPlayed: (currentStats.gamesPlayed || 0) + 1,
        highestScore: Math.max(currentStats.highestScore || 0, score),
        totalTimePlayed: (currentStats.totalTimePlayed || 0) + duration,
        gameStats: {
          ...currentStats.gameStats,
          [gameType]: {
            ...currentStats.gameStats[gameType],
            gamesPlayed: ((currentStats.gameStats[gameType]?.gamesPlayed) || 0) + 1,
            highestScore: Math.max((currentStats.gameStats[gameType]?.highestScore) || 0, score),
            totalScore: ((currentStats.gameStats[gameType]?.totalScore) || 0) + score,
            totalTimePlayed: ((currentStats.gameStats[gameType]?.totalTimePlayed) || 0) + duration,
            lastPlayed: new Date().toISOString()
          }
        }
      };
      
      // Prepare profile updates
      const profileUpdates = {
        points: newPoints,
        stats: updatedStats,
        ...userDataUpdates
      };
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', currentUser.id)
        .select()
        .single();

      if (updateError) {
         console.warn('⚠️ Failed to update profile in database:', updateError.message);
         // Don't fail the entire operation, just update localStorage
       } else {
         console.log('✅ Profile updated in database:', {
           points: updatedProfile.points,
           gamesPlayed: updatedProfile.stats?.gamesPlayed,
           highestScore: updatedProfile.stats?.highestScore
         });
         // Update currentUser with new data
         currentUser.points = updatedProfile.points;
         currentUser.stats = updatedProfile.stats;
         
         // Dispatch event to notify UserContext of the update
         window.dispatchEvent(new CustomEvent('userDataUpdated', {
           detail: { updatedProfile: currentUser }
         }));
         console.log('📡 Dispatched userDataUpdated event');
       }

     // Update localStorage if this is a Telegram user
     if (currentUser && !currentUser.auth_user_id) {
       const updatedUser = {
         ...currentUser,
         points: currentUser.points,
         stats: currentUser.stats
       };
       localStorage.setItem('gg_user', JSON.stringify(updatedUser));
       console.log('📱 Updated localStorage user data:', {
         points: updatedUser.points,
         gamesPlayed: updatedUser.stats?.gamesPlayed,
         highestScore: updatedUser.stats?.highestScore
       });
     }

     return {
       success: true,
       data: {
         gameSession: sessionResult,
         pointsEarned,
         newTotalPoints: currentUser.points,
         user: currentUser,
         statsUpdated: {
           gamesPlayed: currentUser.stats?.gamesPlayed,
           highestScore: currentUser.stats?.highestScore,
           totalTimePlayed: currentUser.stats?.totalTimePlayed
         }
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
  if (!isSupabaseAvailable()) {
    console.warn('Supabase not available, skipping getUserPoints.');
    return null;
  }
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
 * @param {number} limit - Number of recent sessions to return (default: 10)
 * @returns {Promise<Object>} - Result with sessions array
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

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use getRecentGameSessions instead
 */
export const getRecentGameSessionsLegacy = async (limit = 10, userId = null) => {
  try {
    // Get current user if userId not provided
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return [];
      }
      currentUserId = user.id;
    }

    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting recent game sessions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting recent game sessions:', error);
    return [];
  }
};