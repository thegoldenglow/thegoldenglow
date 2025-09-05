import React, { createContext, useContext, useReducer, useEffect, useState, useRef } from 'react';
import { TasksManager } from '../components/tasks/TasksManager';
import { TaskType, RewardType } from '../utils/taskConstants';

// Create the tasks context
const TasksContext = createContext();

// Define task types as an enum
// Moved to ../utils/taskConstants

// Define reward types as an enum
// Moved to ../utils/taskConstants

// Initial state for the tasks context
const initialState = {
  tasks: [],
  streak: {
    current: 0,
    lastCompletion: null,
    milestones: [
      { days: 3, claimed: false, rewards: [{ type: RewardType.MYSTIC_COINS, amount: 150 }] },
      { days: 7, claimed: false, rewards: [{ type: RewardType.MYSTIC_COINS, amount: 350 }, { type: RewardType.MYSTICAL_ESSENCE, amount: 3 }] },
      { days: 14, claimed: false, rewards: [{ type: RewardType.MYSTIC_COINS, amount: 500 }, { type: RewardType.MYSTICAL_ESSENCE, amount: 5 }] },
      { days: 30, claimed: false, rewards: [{ type: RewardType.MYSTIC_COINS, amount: 1000 }, { type: RewardType.MYSTICAL_ESSENCE, amount: 10 }, { type: RewardType.ITEM, amount: 1, itemId: 'exclusive_item_30_day' }] },
    ],
  },
  userStats: {
    mysticCoins: 0,
    mysticalEssence: 0,
    wisdomScrolls: 0,
    items: []
  },
  adStatus: {
    adsViewedToday: 0,
    lastAdTime: null,
    adCooldownRemaining: 0
  },
  isLoading: true,
  error: null
};

// Reducer function to handle state updates
function tasksReducer(state, action) {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        ...action.payload,
        isLoading: false
      };
    
    case 'TASKS_LOADED':
      return {
        ...state,
        tasks: action.payload,
        isLoading: false
      };
    
    case 'UPDATE_TASK_PROGRESS':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.taskId 
            ? { 
                ...task, 
                progress: Math.max(task.progress, action.payload.progress),
                completed: Math.max(task.progress, action.payload.progress) >= task.requirement
              }
            : task
        )
      };
    
    case 'TASK_COMPLETED':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.taskId
            ? { ...task, completed: true }
            : task
        )
      };
    
    case 'EMBEDDED_POST_COMPLETED':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.taskId
            ? { 
                ...task, 
                completed: true,
                viewingTime: action.payload.viewingTime,
                completedAt: new Date().toISOString()
              }
            : task
        )
      };
    
    case 'CLAIM_REWARD':
      // Apply rewards to user stats
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (!task || task.claimed) return state;
      
      const rewards = action.payload.withAdBoost 
        ? task.rewards.map(reward => ({
            ...reward,
            amount: reward.amount * 2 // Double rewards with ad boost
          }))
        : task.rewards;
      
      // Update user stats based on rewards
      const updatedStats = { ...state.userStats };
      rewards.forEach(reward => {
        if (reward.type === RewardType.MYSTIC_COINS) {
          updatedStats.mysticCoins += reward.amount;
        } else if (reward.type === RewardType.MYSTICAL_ESSENCE) {
          updatedStats.mysticalEssence += reward.amount;
        } else if (reward.type === RewardType.WISDOM_SCROLL) {
          updatedStats.wisdomScrolls += reward.amount;
        } else if (reward.type === RewardType.ITEM && reward.itemId) {
          updatedStats.items.push({ id: reward.itemId, amount: reward.amount });
        }
      });
      
      return {
        ...state,
        tasks: state.tasks.map(t => 
          t.id === action.payload.taskId
            ? { ...t, claimed: true, adBoostAvailable: false }
            : t
        ),
        userStats: updatedStats
      };
    
    case 'AD_VIEWED':
      return {
        ...state,
        adStatus: {
          ...state.adStatus,
          adsViewedToday: state.adStatus.adsViewedToday + 1,
          lastAdTime: new Date().toISOString()
        }
      };
    
    case 'STREAK_UPDATED':
      return {
        ...state,
        streak: {
          ...state.streak,
          current: action.payload.streak,
          lastCompletion: action.payload.lastCompletion
        }
      };
    
    case 'CLAIM_MILESTONE_REWARD':
      // Find the milestone
      const milestone = state.streak.milestones.find(m => m.days === action.payload.milestone);
      if (!milestone || milestone.claimed) return state;
      
      // Update user stats based on milestone rewards
      const updatedUserStats = { ...state.userStats };
      milestone.rewards.forEach(reward => {
        if (reward.type === RewardType.MYSTIC_COINS) {
          updatedUserStats.mysticCoins += reward.amount;
        } else if (reward.type === RewardType.MYSTICAL_ESSENCE) {
          updatedUserStats.mysticalEssence += reward.amount;
        } else if (reward.type === RewardType.WISDOM_SCROLL) {
          updatedUserStats.wisdomScrolls += reward.amount;
        } else if (reward.type === RewardType.ITEM && reward.itemId) {
          updatedUserStats.items.push({ id: reward.itemId, amount: reward.amount });
        }
      });
      
      return {
        ...state,
        streak: {
          ...state.streak,
          milestones: state.streak.milestones.map(m => 
            m.days === action.payload.milestone
              ? { ...m, claimed: true }
              : m
          )
        },
        userStats: updatedUserStats
      };
    
    case 'TASKS_REFRESHED':
      return {
        ...state,
        tasks: action.payload.tasks
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    default:
      return state;
  }
}

// Provider component
export const TasksProvider = ({ children }) => {
  const [state, dispatch] = useReducer(tasksReducer, initialState);
  const [tasksManager] = useState(() => new TasksManager(dispatch));
  const crossGameSetRef = useRef(new Set());
  const todayKey = `gg:crossGamesPlayed:v1:${new Date().toDateString()}`;

  // Normalize gameId variants to base IDs (e.g., '-multiplayer' -> base game)
  const normalizeGameId = (id) => {
    try {
      if (!id || typeof id !== 'string') return null;
      // Normalize case and separators first
      let slug = id.trim().toLowerCase().replace(/_/g, '-');

      // Unify known variants
      if (slug === 'tic-tac-toe' || slug === 'tic-tac-toe-multiplayer') slug = 'tic-tac-toe';

      // Strip multiplayer suffix to count towards base game tasks
      if (slug.endsWith('-multiplayer')) slug = slug.replace(/-multiplayer$/, '');

      // Map common aliases
      if (slug === 'mark-of-destiny') slug = 'marks-of-destiny';
      if (slug === 'path-of-knowledge') slug = 'path-of-enlightenment';

      return slug;
    } catch (_) {
      return null;
    }
  };

  // Initialize tasks on component mount
  useEffect(() => {
    const initTasks = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        await tasksManager.init();
      } catch (error) {
        console.error('Error initializing tasks:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load tasks' });
      }
    };
    // Load cross-game set for today
    try {
      const stored = localStorage.getItem(todayKey);
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) {
          crossGameSetRef.current = new Set(arr);
        }
      }
    } catch (e) {
      // ignore localStorage errors
    }
    initTasks();
  }, [tasksManager]);

  // Listen for game reward events and update matching tasks' progress
  useEffect(() => {
    const onGameReward = (evt) => {
      try {
        const { gameId, rewardType } = evt.detail || {};
        const baseGameId = normalizeGameId(gameId);
        if (!baseGameId) return;

        // Only count full rounds for GAME_SPECIFIC tasks
        const roundTypes = new Set([
          'participation',
          'win',
          'journey_completion',
          'completion',
          'session'
        ]);

        if (roundTypes.has(rewardType)) {
          const gameSpecific = state.tasks.filter(t => !t.completed && !t.claimed && t.type === 'GAME_SPECIFIC' && normalizeGameId(t.targetGame) === baseGameId);
          gameSpecific.forEach(t => {
            const nextProgress = Math.min((t.progress || 0) + 1, t.requirement || Infinity);
            tasksManager.updateTaskProgress(t.id, nextProgress);
          });
        }

        // Cross-game: track unique base games per day regardless of reward type
        const beforeSize = crossGameSetRef.current.size;
        crossGameSetRef.current.add(baseGameId);
        if (crossGameSetRef.current.size !== beforeSize) {
          try { localStorage.setItem(todayKey, JSON.stringify([...crossGameSetRef.current])); } catch (_) {}
        }
        const uniqueCount = crossGameSetRef.current.size;
        const crossGameTasks = state.tasks.filter(t => !t.completed && !t.claimed && t.type === 'CROSS_GAME');
        crossGameTasks.forEach(t => {
          const nextProgress = Math.min(uniqueCount, t.requirement || uniqueCount);
          tasksManager.updateTaskProgress(t.id, nextProgress);
        });
      } catch (e) {
        // swallow errors from best-effort listener
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('gg:gameRewardAwarded', onGameReward);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('gg:gameRewardAwarded', onGameReward);
      }
    };
  }, [state.tasks, tasksManager]);

  // Expose the context value
  const contextValue = {
    state,
    dispatch,
    tasksManager
  };

  return (
    <TasksContext.Provider value={contextValue}>
      {children}
    </TasksContext.Provider>
  );
};

// Custom hook to use the tasks context
export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};

export default TasksContext;