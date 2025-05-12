import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { TasksManager } from '../components/tasks/TasksManager';

// Create the tasks context
const TasksContext = createContext();

// Define task types as an enum
export const TaskType = {
  DAILY_LOGIN: 'DAILY_LOGIN',
  GAME_SPECIFIC: 'GAME_SPECIFIC',
  CROSS_GAME: 'CROSS_GAME',
  ACHIEVEMENT: 'ACHIEVEMENT',
  SOCIAL: 'SOCIAL',
  SPECIAL_CHALLENGE: 'SPECIAL_CHALLENGE'
};

// Define reward types as an enum
export const RewardType = {
  MYSTIC_COINS: 'MYSTIC_COINS',
  MYSTICAL_ESSENCE: 'MYSTICAL_ESSENCE',
  WISDOM_SCROLL: 'WISDOM_SCROLL',
  ITEM: 'ITEM'
};

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
    
    initTasks();
  }, [tasksManager]);

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