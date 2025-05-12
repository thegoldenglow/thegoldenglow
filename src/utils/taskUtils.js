// Generate random tasks, handle streak management, and provide utility functions for the daily tasks system

import { v4 as uuidv4 } from 'uuid';
import { TaskType, RewardType } from '../contexts/TasksContext';

/**
 * Generate a set of daily tasks
 * @returns {Array} Array of task objects
 */
export const generateTasks = () => {
  // Get the current date for the expiration
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // Generate a mix of different task types
  const tasks = [
    // Daily login task (always included)
    {
      id: uuidv4(),
      type: TaskType.DAILY_LOGIN,
      title: "Awaken your spirit to the mystical realm",
      description: "Begin your daily journey into the realm of Golden Glow",
      targetGame: null,
      requirement: 1,
      progress: 1, // Auto-completed when opening the app
      completed: true,
      claimed: false,
      rewards: [{ type: RewardType.MYSTIC_COINS, amount: 50 }],
      adBoostAvailable: true,
      expiresAt: tomorrow.toISOString()
    },
    
    // Game-specific tasks (play specific games)
    {
      id: uuidv4(),
      type: TaskType.GAME_SPECIFIC,
      title: "Challenge the Marks of Destiny thrice",
      description: "Play 3 rounds of Tic-Tac-Toe to master the ancient symbols",
      targetGame: "marks-of-destiny",
      requirement: 3,
      progress: 0,
      completed: false,
      claimed: false,
      rewards: [{ type: RewardType.MYSTIC_COINS, amount: 75 }],
      adBoostAvailable: true,
      expiresAt: tomorrow.toISOString()
    },
    
    // Cross-game task (play multiple games)
    {
      id: uuidv4(),
      type: TaskType.CROSS_GAME,
      title: "Balance the elements across the realms",
      description: "Visit and play at least 1 round of 3 different games to maintain cosmic harmony",
      targetGame: null, // Applies to multiple games
      requirement: 3,
      progress: 0,
      completed: false,
      claimed: false,
      rewards: [
        { type: RewardType.MYSTIC_COINS, amount: 100 },
        { type: RewardType.MYSTICAL_ESSENCE, amount: 1 }
      ],
      adBoostAvailable: true,
      expiresAt: tomorrow.toISOString()
    },
    
    // Achievement task (reach specific score)
    {
      id: uuidv4(),
      type: TaskType.ACHIEVEMENT,
      title: "Achieve enlightenment in the Path of Knowledge",
      description: "Reach a score of 512 in the Path of Enlightenment game",
      targetGame: "path-of-enlightenment",
      requirement: 1,
      progress: 0,
      completed: false,
      claimed: false,
      rewards: [{ type: RewardType.MYSTIC_COINS, amount: 150 }],
      adBoostAvailable: true,
      expiresAt: tomorrow.toISOString()
    },
    
    // Social task (invite a friend)
    {
      id: uuidv4(),
      type: TaskType.SOCIAL,
      title: "Share the wisdom with a fellow seeker",
      description: "Invite a friend to explore the mystical world of Golden Glow",
      targetGame: null,
      requirement: 1,
      progress: 0,
      completed: false,
      claimed: false,
      rewards: [{ type: RewardType.MYSTIC_COINS, amount: 200 }],
      adBoostAvailable: true,
      expiresAt: tomorrow.toISOString()
    },
    
    // Special daily challenge
    {
      id: uuidv4(),
      type: TaskType.SPECIAL_CHALLENGE,
      title: "Master today's unique challenge of fate",
      description: "Complete today's special challenge: Play Flame of Wisdom and reach 100 taps",
      targetGame: "flame-of-wisdom",
      requirement: 1,
      progress: 0,
      completed: false,
      claimed: false,
      rewards: [
        { type: RewardType.MYSTIC_COINS, amount: 250 },
        { type: RewardType.WISDOM_SCROLL, amount: 1 }
      ],
      adBoostAvailable: true,
      expiresAt: tomorrow.toISOString()
    }
  ];

  return tasks;
};

/**
 * Check and update streak data based on task completion
 * @param {Object} streakData - Current streak data
 * @param {Array} tasks - Array of tasks
 * @returns {Object} Updated streak data
 */
export const checkAndUpdateStreak = (streakData, tasks) => {
  const updatedStreak = { ...streakData };
  const today = new Date();
  const lastCompletionDate = streakData.lastCompletion ? new Date(streakData.lastCompletion) : null;
  
  // No previous completion, no streak yet
  if (!lastCompletionDate) {
    return updatedStreak;
  }
  
  // Check if last completion was yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isYesterday = 
    lastCompletionDate.getDate() === yesterday.getDate() &&
    lastCompletionDate.getMonth() === yesterday.getMonth() &&
    lastCompletionDate.getFullYear() === yesterday.getFullYear();
  
  // Check if all tasks from the previous day were completed
  const allTasksCompleted = tasks && tasks.length > 0 ? 
    tasks.every(task => task.completed) : false;
  
  // If last completion was yesterday and all tasks were completed, increment streak
  if (isYesterday && allTasksCompleted) {
    updatedStreak.current += 1;
  } else if (!isYesterday) {
    // Not consecutive days, reset streak
    updatedStreak.current = 0;
  }
  
  // Update lastCompletion date if all tasks were completed today
  if (allTasksCompleted) {
    updatedStreak.lastCompletion = today.toISOString();
  }
  
  return updatedStreak;
};

/**
 * Get the next milestone reward that can be claimed
 * @param {Object} streakData - Current streak data
 * @returns {Object|null} Next milestone reward or null if none available
 */
export const getNextMilestone = (streakData) => {
  const currentStreak = streakData.current;
  
  // Find the next unclaimed milestone that the user has reached
  const nextMilestone = streakData.milestones
    .filter(milestone => !milestone.claimed && currentStreak >= milestone.days)
    .sort((a, b) => a.days - b.days)[0];
  
  return nextMilestone || null;
};

/**
 * Get default user stats object
 * @returns {Object} Default user stats
 */
export const getDefaultUserStats = () => ({
  mysticCoins: 100, // Start with some coins
  mysticalEssence: 0,
  wisdomScrolls: 0,
  items: []
});

/**
 * Format a reward for display
 * @param {Object} reward - Reward object
 * @returns {Object} Formatted reward with display information
 */
export const formatReward = (reward) => {
  let displayName = '';
  let icon = '';
  
  switch (reward.type) {
    case RewardType.MYSTIC_COINS:
      displayName = 'Mystic Coins';
      icon = '🪙';
      break;
    case RewardType.MYSTICAL_ESSENCE:
      displayName = 'Mystical Essence';
      icon = '✨';
      break;
    case RewardType.WISDOM_SCROLL:
      displayName = 'Wisdom Scroll';
      icon = '📜';
      break;
    case RewardType.ITEM:
      displayName = 'Special Item';
      icon = '🎁';
      break;
    default:
      displayName = 'Unknown Reward';
      icon = '❓';
  }
  
  return {
    ...reward,
    displayName,
    icon
  };
};

/**
 * Get a description of what's needed to complete a task
 * @param {Object} task - Task object
 * @returns {String} Task completion requirement
 */
export const getTaskRequirement = (task) => {
  switch (task.type) {
    case TaskType.DAILY_LOGIN:
      return 'Open the app';
    case TaskType.GAME_SPECIFIC:
      return `Play ${task.requirement} rounds of ${getGameDisplayName(task.targetGame)}`;
    case TaskType.CROSS_GAME:
      return `Play ${task.requirement} different games`;
    case TaskType.ACHIEVEMENT:
      return task.description;
    case TaskType.SOCIAL:
      return 'Invite a friend to the app';
    case TaskType.SPECIAL_CHALLENGE:
      return task.description;
    default:
      return 'Complete the task';
  }
};

/**
 * Get a user-friendly display name for a game based on its ID
 * @param {String} gameId - Game ID
 * @returns {String} Game display name
 */
export const getGameDisplayName = (gameId) => {
  if (!gameId) return '';
  
  const gameMap = {
    'marks-of-destiny': 'Marks of Destiny',
    'path-of-enlightenment': 'Path of Enlightenment',
    'flame-of-wisdom': 'Flame of Wisdom',
    'sacred-tapping': 'Sacred Tapping',
    'gates-of-knowledge': 'Gates of Knowledge',
    'mystical-tap-journey': 'Mystical Tap Journey'
  };
  
  return gameMap[gameId] || gameId;
};

/**
 * Format time remaining until task expiration
 * @param {String} expiresAt - ISO date string when task expires
 * @returns {String} Formatted time remaining
 */
export const getTimeUntilExpiration = (expiresAt) => {
  const now = new Date();
  const expiration = new Date(expiresAt);
  const diffMs = expiration - now;
  
  // If already expired
  if (diffMs <= 0) return 'Expired';
  
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${diffHrs}h ${diffMins}m remaining`;
};