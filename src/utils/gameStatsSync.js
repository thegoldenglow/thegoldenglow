import { supabase } from './supabase';

/**
 * Fetch user game stats from Supabase
 * @param {string} userId - The user's ID
 * @returns {Object} User game stats or default values
 */
export const fetchUserGameStats = async (userId) => {
  if (!userId) {
    return {
      gamesPlayed: 0,
      wisdomPoints: 0,
      highestScore: 0,
      achievements: 0,
      currentStreak: 0,
      longestStreak: 0
    };
  }

  try {
    const { data, error } = await supabase
      .from('user_game_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user game stats:', error);
      return null;
    }

    if (!data) {
      // Create initial stats record for new user
      const { data: newStats, error: createError } = await supabase
        .from('user_game_stats')
        .insert({
          user_id: userId,
          games_played: 0,
          wisdom_points: 0,
          highest_score: 0,
          total_achievements: 0,
          current_streak: 0,
          longest_streak: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user game stats:', createError);
        return null;
      }

      return {
        gamesPlayed: newStats.games_played,
        wisdomPoints: newStats.wisdom_points,
        highestScore: newStats.highest_score,
        achievements: newStats.total_achievements,
        currentStreak: newStats.current_streak,
        longestStreak: newStats.longest_streak
      };
    }

    return {
      gamesPlayed: data.games_played,
      wisdomPoints: data.wisdom_points,
      highestScore: data.highest_score,
      achievements: data.total_achievements,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak
    };
  } catch (error) {
    console.error('Error in fetchUserGameStats:', error);
    return null;
  }
};

/**
 * Update user game stats in Supabase
 * @param {string} userId - The user's ID
 * @param {Object} updates - Stats to update
 * @returns {boolean} Success status
 */
export const updateUserGameStats = async (userId, updates) => {
  if (!userId) {
    console.error('No user ID provided for updating game stats');
    return false;
  }

  try {
    const { error } = await supabase
      .from('user_game_stats')
      .upsert({
        user_id: userId,
        games_played: updates.gamesPlayed,
        wisdom_points: updates.wisdomPoints,
        highest_score: updates.highestScore,
        total_achievements: updates.achievements,
        current_streak: updates.currentStreak,
        longest_streak: updates.longestStreak,
        last_game_played: updates.lastGamePlayedAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating user game stats:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserGameStats:', error);
    return false;
  }
};

/**
 * Increment specific game stat
 * @param {string} userId - The user's ID
 * @param {string} statType - Type of stat to increment (gamesPlayed, wisdomPoints, etc.)
 * @param {number} amount - Amount to increment by
 * @returns {boolean} Success status
 */
export const incrementGameStat = async (userId, statType, amount = 1) => {
  if (!userId) {
    console.error('No user ID provided for incrementing game stat');
    return false;
  }

  try {
    // First fetch current stats
    const currentStats = await fetchUserGameStats(userId);
    if (!currentStats) {
      return false;
    }

    // Update the specific stat
    const updates = { ...currentStats };
    switch (statType) {
      case 'gamesPlayed':
        updates.gamesPlayed += amount;
        break;
      case 'wisdomPoints':
        updates.wisdomPoints += amount;
        break;
      case 'highestScore':
        updates.highestScore = Math.max(updates.highestScore, amount);
        break;
      case 'achievements':
        updates.achievements += amount;
        break;
      case 'currentStreak':
        updates.currentStreak += amount;
        updates.longestStreak = Math.max(updates.longestStreak, updates.currentStreak);
        break;
      default:
        console.error('Unknown stat type:', statType);
        return false;
    }

    return await updateUserGameStats(userId, updates);
  } catch (error) {
    console.error('Error in incrementGameStat:', error);
    return false;
  }
};

/**
 * Fetch user achievements from Supabase
 * @param {string} userId - The user's ID
 * @returns {Array} User achievements
 */
export const fetchUserAchievements = async (userId) => {
  if (!userId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchUserAchievements:', error);
    return [];
  }
};

/**
 * Record a game completion and update stats
 * @param {string} userId - The user's ID
 * @param {Object} gameData - Game completion data
 * @returns {boolean} Success status
 */
export const recordGameCompletion = async (userId, gameData) => {
  if (!userId) {
    console.error('No user ID provided for recording game completion');
    return false;
  }

  try {
    // Fetch current stats
    const currentStats = await fetchUserGameStats(userId);
    if (!currentStats) {
      return false;
    }

    // Calculate new stats
    const newStats = {
      gamesPlayed: currentStats.gamesPlayed + 1,
      wisdomPoints: currentStats.wisdomPoints + (gameData.pointsEarned || 0),
      highestScore: Math.max(currentStats.highestScore, gameData.score || 0),
      achievements: currentStats.achievements + (gameData.newAchievements || 0),
      currentStreak: gameData.maintainedStreak ? currentStats.currentStreak + 1 : 1,
      longestStreak: Math.max(currentStats.longestStreak, gameData.maintainedStreak ? currentStats.currentStreak + 1 : 1),
      lastGamePlayedAt: new Date().toISOString()
    };

    // Update stats in database
    const success = await updateUserGameStats(userId, newStats);
    
    if (success) {
      console.log('Game completion recorded successfully:', newStats);
      
      // Dispatch custom event to notify components of stats update
      window.dispatchEvent(new CustomEvent('gameStatsUpdated', {
        detail: { userId, newStats, gameData }
      }));
    }
    
    return success;
  } catch (error) {
    console.error('Error in recordGameCompletion:', error);
    return false;
  }
};

/**
 * Add a new achievement for a user
 * @param {string} userId - The user's ID
 * @param {Object} achievementData - Achievement data
 * @returns {boolean} Success status
 */
export const addUserAchievement = async (userId, achievementData) => {
  if (!userId) {
    console.error('No user ID provided for adding achievement');
    return false;
  }

  try {
    const { error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_type: achievementData.type || 'game',
        achievement_name: achievementData.name,
        description: achievementData.description,
        metadata: achievementData.metadata || {},
        earned_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error adding user achievement:', error);
      return false;
    }

    // Update achievement count in game stats
    await incrementGameStat(userId, 'achievements', 1);
    
    console.log('Achievement added successfully:', achievementData.name);
    return true;
  } catch (error) {
    console.error('Error in addUserAchievement:', error);
    return false;
  }
};