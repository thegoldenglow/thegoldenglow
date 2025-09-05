import { useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { recordGameCompletion, addUserAchievement, incrementGameStat } from '../utils/gameStatsSync';

/**
 * Custom hook for managing game statistics
 * @returns {Object} Game stats management functions
 */
export const useGameStats = () => {
  const { user } = useUser();

  /**
   * Record a completed game and update user stats
   * @param {Object} gameData - Game completion data
   * @param {number} gameData.score - Final score achieved
   * @param {number} gameData.pointsEarned - Points earned from the game
   * @param {boolean} gameData.maintainedStreak - Whether the user maintained their streak
   * @param {number} gameData.newAchievements - Number of new achievements earned
   * @returns {Promise<boolean>} Success status
   */
  const recordGame = useCallback(async (gameData) => {
    if (!user?.id) {
      console.warn('No user ID available for recording game stats');
      return false;
    }

    try {
      const success = await recordGameCompletion(user.id, gameData);
      if (success) {
        console.log('Game stats updated successfully');
      }
      return success;
    } catch (error) {
      console.error('Error recording game completion:', error);
      return false;
    }
  }, [user?.id]);

  /**
   * Add a new achievement for the user
   * @param {Object} achievementData - Achievement data
   * @param {string} achievementData.name - Achievement name
   * @param {string} achievementData.description - Achievement description
   * @param {string} achievementData.type - Achievement type (default: 'game')
   * @param {Object} achievementData.metadata - Additional metadata (icon, etc.)
   * @returns {Promise<boolean>} Success status
   */
  const addAchievement = useCallback(async (achievementData) => {
    if (!user?.id) {
      console.warn('No user ID available for adding achievement');
      return false;
    }

    try {
      const success = await addUserAchievement(user.id, achievementData);
      if (success) {
        console.log('Achievement added successfully:', achievementData.name);
      }
      return success;
    } catch (error) {
      console.error('Error adding achievement:', error);
      return false;
    }
  }, [user?.id]);

  /**
   * Increment a specific game statistic
   * @param {string} statType - Type of stat to increment
   * @param {number} amount - Amount to increment by
   * @returns {Promise<boolean>} Success status
   */
  const incrementStat = useCallback(async (statType, amount = 1) => {
    if (!user?.id) {
      console.warn('No user ID available for incrementing stat');
      return false;
    }

    try {
      const success = await incrementGameStat(user.id, statType, amount);
      if (success) {
        console.log(`${statType} incremented by ${amount}`);
      }
      return success;
    } catch (error) {
      console.error('Error incrementing stat:', error);
      return false;
    }
  }, [user?.id]);

  /**
   * Award wisdom points to the user
   * @param {number} points - Number of points to award
   * @returns {Promise<boolean>} Success status
   */
  const awardWisdomPoints = useCallback(async (points) => {
    return await incrementStat('wisdomPoints', points);
  }, [incrementStat]);

  /**
   * Update highest score if the new score is higher
   * @param {number} score - New score to compare
   * @returns {Promise<boolean>} Success status
   */
  const updateHighestScore = useCallback(async (score) => {
    return await incrementStat('highestScore', score);
  }, [incrementStat]);

  return {
    recordGame,
    addAchievement,
    incrementStat,
    awardWisdomPoints,
    updateHighestScore,
    userId: user?.id
  };
};

export default useGameStats;