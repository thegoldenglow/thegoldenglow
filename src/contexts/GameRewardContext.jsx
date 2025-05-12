import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useUser } from './UserContext';
import { useWallet } from './WalletContext';
import { useGame } from './GameContext';

// Create GameRewardContext
const GameRewardContext = createContext();

export const useGameReward = () => useContext(GameRewardContext);

// Game display names for transaction descriptions
const gameDisplayNames = {
  'marks-of-destiny': 'Marks of Destiny',
  'path-of-enlightenment': 'Path of Enlightenment',
  'flame-of-wisdom': 'Flame of Wisdom',
  'gates-of-knowledge': 'Gates of Knowledge',
  'sacred-tapping': 'Sacred Tapping',
  'mystical-tap-journey': 'Mystical Tap Journey'
};

// Base reward configuration
const baseRewards = {
  'marks-of-destiny': {
    participation: 2,
    win: 5,
    difficultyBonus: {
      easy: 0,
      medium: 5,
      hard: 10
    },
    streak: 5,
    mastery: 20
  },
  'path-of-enlightenment': {
    participation: 2,
    tiers: {
      128: 5,
      256: 10,
      512: 15,
      1024: 25,
      2048: 50
    },
    scoreBonus: 1, // per 1000 points
    dailyHighScore: 5
  },
  'flame-of-wisdom': {
    participation: 2,
    levels: {
      5: 5,
      10: 10,
      20: 20
    },
    tapMilestone: 1, // per 100 taps, max 25
    dailyDedication: 10
  },
  'gates-of-knowledge': {
    participation: 3,
    correctAnswer: 2,
    perfectQuiz: 10,
    speedBonus: 1, // per fast answer
    difficultyBonus: 5,
    streak: 5
  },
  'sacred-tapping': {
    participation: 3,
    scoreReward: 2, // per 1000 points
    perfectTap: 0.1,
    comboBonus: {
      25: 5,
      50: 10
    },
    fullCombo: 15,
    difficultyBonus: 10
  },
  'mystical-tap-journey': {
    participation: 3,
    cityVisited: 5,
    perfectRhythm: 10,
    distanceBonus: 1, // per 100 distance units
    journeyCompletion: 25,
    collectionBonus: 15
  }
};

// Game mastery level multipliers
const masteryMultipliers = [
  { level: 1, games: 0, multiplier: 1 },
  { level: 2, games: 26, multiplier: 1.05 },
  { level: 3, games: 51, multiplier: 1.1 },
  { level: 4, games: 101, multiplier: 1.15 },
  { level: 5, games: 201, multiplier: 1.2 }
];

// Login streak multipliers
const streakMultipliers = [
  { days: 3, multiplier: 1.1 },
  { days: 7, multiplier: 1.15 },
  { days: 14, multiplier: 1.2 },
  { days: 30, multiplier: 1.25 }
];

export const GameRewardProvider = ({ children }) => {
  const { user } = useUser();
  const { addTransaction } = useWallet();
  const { games, updateGameStats } = useGame();
  
  // Track first wins of the day for each game
  const [dailyFirstWins, setDailyFirstWins] = useState({});
  
  // Track daily reward totals for capping
  const [dailyRewards, setDailyRewards] = useState({
    date: new Date().toDateString(),
    total: 0,
    games: {}
  });
  
  // Initialize/reset daily tracking
  useEffect(() => {
    // Load saved data from localStorage
    const storedFirstWins = localStorage.getItem('gg_daily_first_wins');
    const storedDailyRewards = localStorage.getItem('gg_daily_rewards');
    
    if (storedFirstWins) {
      const parsedWins = JSON.parse(storedFirstWins);
      setDailyFirstWins(parsedWins);
    }
    
    if (storedDailyRewards) {
      const parsedRewards = JSON.parse(storedDailyRewards);
      
      // Check if we need to reset daily counters (new day)
      const today = new Date().toDateString();
      if (parsedRewards.date !== today) {
        // Reset for new day
        const newDailyRewards = {
          date: today,
          total: 0,
          games: {}
        };
        setDailyRewards(newDailyRewards);
        localStorage.setItem('gg_daily_rewards', JSON.stringify(newDailyRewards));
        
        // Also reset first wins
        setDailyFirstWins({});
        localStorage.removeItem('gg_daily_first_wins');
      } else {
        // Same day, use stored values
        setDailyRewards(parsedRewards);
      }
    }
  }, [user?.id]);
  
  // Save data when it changes
  useEffect(() => {
    if (Object.keys(dailyFirstWins).length > 0) {
      localStorage.setItem('gg_daily_first_wins', JSON.stringify(dailyFirstWins));
    }
    
    localStorage.setItem('gg_daily_rewards', JSON.stringify(dailyRewards));
  }, [dailyFirstWins, dailyRewards]);
  
  // Calculate mastery level multiplier for a game
  const getMasteryMultiplier = useCallback((gameId) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return 1;
    
    const gamesPlayed = game.stats?.gamesPlayed || 0;
    
    // Find the highest mastery level achieved
    for (let i = masteryMultipliers.length - 1; i >= 0; i--) {
      if (gamesPlayed >= masteryMultipliers[i].games) {
        return masteryMultipliers[i].multiplier;
      }
    }
    
    return 1; // Default multiplier
  }, [games]);
  
  // Calculate login streak multiplier
  const getStreakMultiplier = useCallback(() => {
    // This would normally come from a user profile or streak context
    // For now, we'll use localStorage to simulate
    const streakData = localStorage.getItem('dailyLogin');
    if (!streakData) return 1;
    
    const { streak } = JSON.parse(streakData);
    
    // Find the highest streak multiplier achieved
    for (let i = streakMultipliers.length - 1; i >= 0; i--) {
      if (streak >= streakMultipliers[i].days) {
        return streakMultipliers[i].multiplier;
      }
    }
    
    return 1; // Default multiplier
  }, []);
  
  // Check if reward exceeds daily cap
  const checkDailyRewardCap = useCallback((gameId, amount) => {
    const dailyCapTotal = 200; // Combined cap for all games
    const gamePlayCap = 10; // Cap diminishing returns after 10 plays
    
    // Check total daily rewards cap
    if (dailyRewards.total + amount > dailyCapTotal) {
      // Cap at the maximum
      return dailyCapTotal - dailyRewards.total;
    }
    
    // Check game-specific diminishing returns
    const gamePlays = dailyRewards.games[gameId] ? dailyRewards.games[gameId].plays : 0;
    if (gamePlays >= gamePlayCap) {
      // Apply diminishing returns - 10% reduction per play over cap
      const reductionFactor = Math.max(0.1, 1 - ((gamePlays - gamePlayCap + 1) * 0.1));
      return Math.floor(amount * reductionFactor);
    }
    
    return amount;
  }, [dailyRewards]);
  
  // Process reward and update daily tracking
  const processReward = useCallback((amount, gameId, achievementType) => {
    if (amount <= 0 || !user) return 0;
    
    // Apply daily cap checks
    const cappedAmount = checkDailyRewardCap(gameId, amount);
    if (cappedAmount <= 0) return 0;
    
    // Add transaction through wallet context
    addTransaction(
      cappedAmount, 
      'game-reward', 
      `${achievementType} reward from ${gameDisplayNames[gameId] || gameId}`
    );
    
    // Update daily reward tracking
    setDailyRewards(prev => {
      const gameStats = prev.games[gameId] || { plays: 0, amount: 0 };
      
      return {
        ...prev,
        total: prev.total + cappedAmount,
        games: {
          ...prev.games,
          [gameId]: {
            plays: gameStats.plays + 1,
            amount: gameStats.amount + cappedAmount
          }
        }
      };
    });
    
    // Update game stats with earned GC
    updateGameStats(gameId, { gcEarned: (games.find(g => g.id === gameId)?.stats?.gcEarned || 0) + cappedAmount });
    
    return cappedAmount;
  }, [user, addTransaction, checkDailyRewardCap, updateGameStats, games]);
  
  // Award for Marks of Destiny game
  const awardMarksOfDestinyReward = useCallback((rewardType, params = {}) => {
    const gameId = 'marks-of-destiny';
    const rewards = baseRewards[gameId];
    let amount = 0;
    let description = '';
    
    switch (rewardType) {
      case 'participation':
        amount = rewards.participation;
        description = 'Participation';
        break;
        
      case 'win':
        amount = rewards.win;
        description = 'Victory';
        
        // Add difficulty bonus
        if (params.difficulty && rewards.difficultyBonus[params.difficulty]) {
          amount += rewards.difficultyBonus[params.difficulty];
        }
        
        // Add streak bonus
        if (params.isStreak) {
          amount += rewards.streak;
          description = 'Winning Streak';
        }
        
        // Check for first win of the day
        const today = new Date().toDateString();
        if (!dailyFirstWins[gameId] || dailyFirstWins[gameId] !== today) {
          amount += 5; // First win bonus
          setDailyFirstWins(prev => ({ ...prev, [gameId]: today }));
          description = 'First Win of the Day';
        }
        break;
        
      case 'mastery':
        amount = rewards.mastery;
        description = 'Game Mastery';
        break;
        
      default:
        return 0;
    }
    
    // Apply multipliers
    const masteryMultiplier = getMasteryMultiplier(gameId);
    const streakMultiplier = getStreakMultiplier();
    amount = Math.round(amount * masteryMultiplier * streakMultiplier);
    
    return processReward(amount, gameId, description);
  }, [processReward, dailyFirstWins, getMasteryMultiplier, getStreakMultiplier]);
  
  // Award for Path of Enlightenment game
  const awardPathOfEnlightenmentReward = useCallback((rewardType, params = {}) => {
    const gameId = 'path-of-enlightenment';
    const rewards = baseRewards[gameId];
    let amount = 0;
    let description = '';
    
    switch (rewardType) {
      case 'participation':
        amount = rewards.participation;
        description = 'Participation';
        break;
        
      case 'tier':
        // Award for reaching a specific tile value
        if (params.tileValue && rewards.tiers[params.tileValue]) {
          amount = rewards.tiers[params.tileValue];
          description = `${params.tileValue} Tile Achievement`;
        }
        break;
        
      case 'score':
        // Award based on final score
        if (params.score) {
          // Award 1 GC per 1000 points
          amount = Math.floor(params.score / 1000) * rewards.scoreBonus;
          description = 'Score Bonus';
        }
        break;
        
      case 'daily_high_score':
        amount = rewards.dailyHighScore;
        description = 'Daily High Score';
        break;
        
      default:
        return 0;
    }
    
    // Apply multipliers
    const masteryMultiplier = getMasteryMultiplier(gameId);
    const streakMultiplier = getStreakMultiplier();
    amount = Math.round(amount * masteryMultiplier * streakMultiplier);
    
    return processReward(amount, gameId, description);
  }, [processReward, getMasteryMultiplier, getStreakMultiplier]);
  
  // Award for Flame of Wisdom game
  const awardFlameOfWisdomReward = useCallback((rewardType, params = {}) => {
    const gameId = 'flame-of-wisdom';
    const rewards = baseRewards[gameId];
    let amount = 0;
    let description = '';
    
    switch (rewardType) {
      case 'participation':
        amount = rewards.participation;
        description = 'Participation';
        break;
        
      case 'level':
        // Award for reaching a specific flame level
        if (params.level && rewards.levels[params.level]) {
          amount = rewards.levels[params.level];
          description = `Flame Level ${params.level}`;
        }
        break;
        
      case 'taps':
        // Award based on tap count in a session
        if (params.taps) {
          // Cap at 25 GC max from taps
          const tapReward = Math.min(25, Math.floor(params.taps / 100) * rewards.tapMilestone);
          amount = tapReward;
          description = 'Tap Milestone';
        }
        break;
        
      case 'daily_dedication':
        amount = rewards.dailyDedication;
        description = 'Daily Dedication';
        break;
        
      default:
        return 0;
    }
    
    // Apply multipliers
    const masteryMultiplier = getMasteryMultiplier(gameId);
    const streakMultiplier = getStreakMultiplier();
    amount = Math.round(amount * masteryMultiplier * streakMultiplier);
    
    return processReward(amount, gameId, description);
  }, [processReward, getMasteryMultiplier, getStreakMultiplier]);
  
  // Award for Gates of Knowledge game
  const awardGatesOfKnowledgeReward = useCallback((rewardType, params = {}) => {
    const gameId = 'gates-of-knowledge';
    const rewards = baseRewards[gameId];
    let amount = 0;
    let description = '';
    
    switch (rewardType) {
      case 'participation':
        amount = rewards.participation;
        description = 'Participation';
        break;
        
      case 'correct_answer':
        // Award for each correct answer
        amount = rewards.correctAnswer * (params.count || 1);
        description = 'Correct Answer';
        break;
        
      case 'perfect_quiz':
        amount = rewards.perfectQuiz;
        description = 'Perfect Quiz';
        break;
        
      case 'speed_bonus':
        // Award for fast answers
        amount = rewards.speedBonus * (params.count || 1);
        description = 'Speed Bonus';
        break;
        
      case 'difficulty_bonus':
        amount = rewards.difficultyBonus;
        description = 'Difficulty Bonus';
        break;
        
      case 'streak':
        amount = rewards.streak;
        description = 'Answer Streak';
        break;
        
      default:
        return 0;
    }
    
    // Apply multipliers
    const masteryMultiplier = getMasteryMultiplier(gameId);
    const streakMultiplier = getStreakMultiplier();
    amount = Math.round(amount * masteryMultiplier * streakMultiplier);
    
    return processReward(amount, gameId, description);
  }, [processReward, getMasteryMultiplier, getStreakMultiplier]);
  
  // Award for Sacred Tapping game
  const awardSacredTappingReward = useCallback((rewardType, params = {}) => {
    const gameId = 'sacred-tapping';
    const rewards = baseRewards[gameId];
    let amount = 0;
    let description = '';
    
    switch (rewardType) {
      case 'participation':
        amount = rewards.participation;
        description = 'Participation';
        break;
        
      case 'score':
        // Award based on score
        if (params.score) {
          amount = Math.floor(params.score / 1000) * rewards.scoreReward;
          description = 'Score Reward';
        }
        break;
        
      case 'perfect_taps':
        // Award for perfect taps
        if (params.count) {
          // Cap perfect tap rewards
          const maxTapReward = 20; // Max 20 GC from perfect taps
          amount = Math.min(maxTapReward, params.count * rewards.perfectTap);
          description = 'Perfect Taps';
        }
        break;
        
      case 'combo':
        // Award for combo streaks
        if (params.combo >= 50) {
          amount = rewards.comboBonus[50];
          description = '50+ Combo';
        } else if (params.combo >= 25) {
          amount = rewards.comboBonus[25];
          description = '25+ Combo';
        }
        break;
        
      case 'full_combo':
        amount = rewards.fullCombo;
        description = 'Full Combo';
        break;
        
      case 'difficulty_bonus':
        amount = rewards.difficultyBonus;
        description = 'Difficulty Bonus';
        break;
        
      default:
        return 0;
    }
    
    // Apply multipliers
    const masteryMultiplier = getMasteryMultiplier(gameId);
    const streakMultiplier = getStreakMultiplier();
    amount = Math.round(amount * masteryMultiplier * streakMultiplier);
    
    return processReward(amount, gameId, description);
  }, [processReward, getMasteryMultiplier, getStreakMultiplier]);
  
  // Award for Mystical Tap Journey game
  const awardMysticalTapJourneyReward = useCallback((rewardType, params = {}) => {
    const gameId = 'mystical-tap-journey';
    const rewards = baseRewards[gameId];
    let amount = 0;
    let description = '';
    
    switch (rewardType) {
      case 'participation':
        amount = rewards.participation;
        description = 'Participation';
        break;
        
      case 'city_visited':
        amount = rewards.cityVisited * (params.count || 1);
        description = 'City Visited';
        break;
        
      case 'perfect_rhythm':
        amount = rewards.perfectRhythm;
        description = 'Perfect Rhythm';
        break;
        
      case 'distance':
        if (params.distance) {
          amount = Math.floor(params.distance / 100) * rewards.distanceBonus;
          description = 'Distance Bonus';
        }
        break;
        
      case 'journey_completion':
        amount = rewards.journeyCompletion;
        description = 'Journey Completed';
        break;
        
      case 'collection_bonus':
        amount = rewards.collectionBonus;
        description = 'Collection Complete';
        break;
        
      default:
        return 0;
    }
    
    // Apply multipliers
    const masteryMultiplier = getMasteryMultiplier(gameId);
    const streakMultiplier = getStreakMultiplier();
    amount = Math.round(amount * masteryMultiplier * streakMultiplier);
    
    return processReward(amount, gameId, description);
  }, [processReward, getMasteryMultiplier, getStreakMultiplier]);
  
  // Main award function that routes to the appropriate game handler
  const awardGameReward = useCallback((gameId, rewardType, params = {}) => {
    if (!user) return null;
    
    // Route to the appropriate game handler
    switch (gameId) {
      case 'marks-of-destiny':
        return awardMarksOfDestinyReward(rewardType, params);
        
      case 'path-of-enlightenment':
        return awardPathOfEnlightenmentReward(rewardType, params);
        
      case 'flame-of-wisdom':
        return awardFlameOfWisdomReward(rewardType, params);
        
      case 'gates-of-knowledge':
        return awardGatesOfKnowledgeReward(rewardType, params);
        
      case 'sacred-tapping':
        return awardSacredTappingReward(rewardType, params);
        
      case 'mystical-tap-journey':
        return awardMysticalTapJourneyReward(rewardType, params);
        
      default:
        console.error(`Unknown game ID: ${gameId}`);
        return 0;
    }
  }, [
    user, 
    awardMarksOfDestinyReward, 
    awardPathOfEnlightenmentReward, 
    awardFlameOfWisdomReward,
    awardGatesOfKnowledgeReward,
    awardSacredTappingReward,
    awardMysticalTapJourneyReward
  ]);
  
  // Get mastery level info for a game
  const getGameMasteryInfo = useCallback((gameId) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return { level: 1, multiplier: 1, progress: 0 };
    
    const gamesPlayed = game.stats?.gamesPlayed || 0;
    
    // Find current mastery level and next level target
    let currentLevel = 1;
    let nextLevelGames = masteryMultipliers[1].games;
    let progress = 0;
    
    for (let i = masteryMultipliers.length - 1; i >= 0; i--) {
      if (gamesPlayed >= masteryMultipliers[i].games) {
        currentLevel = masteryMultipliers[i].level;
        
        // Calculate progress to next level
        if (i < masteryMultipliers.length - 1) {
          const currentLevelGames = masteryMultipliers[i].games;
          nextLevelGames = masteryMultipliers[i + 1].games;
          progress = (gamesPlayed - currentLevelGames) / (nextLevelGames - currentLevelGames);
        } else {
          // Max level reached
          progress = 1;
        }
        
        break;
      }
    }
    
    return {
      level: currentLevel,
      multiplier: getMasteryMultiplier(gameId),
      progress: Math.min(1, progress),
      nextLevel: currentLevel < 5 ? currentLevel + 1 : null,
      gamesPlayed,
      gamesForNextLevel: nextLevelGames
    };
  }, [games, getMasteryMultiplier]);
  
  // Reset daily rewards (for testing)
  const resetDailyRewards = useCallback(() => {
    const today = new Date().toDateString();
    setDailyRewards({
      date: today,
      total: 0,
      games: {}
    });
    setDailyFirstWins({});
    localStorage.removeItem('gg_daily_first_wins');
    localStorage.removeItem('gg_daily_rewards');
  }, []);
  
  const contextValue = {
    awardGameReward,
    getGameMasteryInfo,
    dailyRewards,
    resetDailyRewards
  };
  
  return (
    <GameRewardContext.Provider value={contextValue}>
      {children}
    </GameRewardContext.Provider>
  );
};

GameRewardProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default GameRewardProvider;