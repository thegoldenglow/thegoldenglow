import { StorageManager } from './StorageManager';
import { AdManager } from './AdManager';
import { generateTasks, checkAndUpdateStreak, getDefaultUserStats } from '../../utils/taskUtils';

export class TasksManager {
  constructor(dispatch) {
    this.dispatch = dispatch;
    this.storageManager = new StorageManager();
    this.adManager = new AdManager();
    this.taskList = [];
    this.streakData = {
      current: 0,
      lastCompletion: null,
      milestones: []
    };
    this.userStats = getDefaultUserStats();
  }

  async init() {
    await this.adManager.init();
    await this.loadTasks();
    await this.loadUserStats();
    await this.loadStreakData();
    this.checkForDailyRefresh();
  }

  async loadTasks() {
    try {
      // Try to load tasks from storage
      const tasksData = this.storageManager.loadData('gg_tasks');
      
      if (tasksData && !this.isTasksDataStale(tasksData)) {
        this.taskList = tasksData.tasks;
        this.dispatch({ type: 'TASKS_LOADED', payload: tasksData.tasks });
      } else {
        // Generate new tasks if no data or data is stale
        await this.refreshDailyTasks();
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.dispatch({ type: 'SET_ERROR', payload: 'Failed to load tasks' });
    }
  }

  async loadUserStats() {
    try {
      const userStats = this.storageManager.loadData('gg_user_stats');
      if (userStats) {
        this.userStats = userStats;
        this.dispatch({ 
          type: 'INITIALIZE', 
          payload: { userStats }
        });
      } else {
        // Initialize with default stats
        this.userStats = getDefaultUserStats();
        this.storageManager.saveData('gg_user_stats', this.userStats);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }

  async loadStreakData() {
    try {
      const streakData = this.storageManager.loadData('gg_streak');
      if (streakData) {
        this.streakData = streakData;
        this.dispatch({ 
          type: 'INITIALIZE', 
          payload: { streak: streakData }
        });
      } else {
        // Initialize with default streak data from the initial state
        this.streakData = {
          current: 0,
          lastCompletion: null,
          milestones: [
            { days: 3, claimed: false, rewards: [{ type: 'MYSTIC_COINS', amount: 150 }] },
            { days: 7, claimed: false, rewards: [{ type: 'MYSTIC_COINS', amount: 350 }, { type: 'MYSTICAL_ESSENCE', amount: 3 }] },
            { days: 14, claimed: false, rewards: [{ type: 'MYSTIC_COINS', amount: 500 }, { type: 'MYSTICAL_ESSENCE', amount: 5 }] },
            { days: 30, claimed: false, rewards: [{ type: 'MYSTIC_COINS', amount: 1000 }, { type: 'MYSTICAL_ESSENCE', amount: 10 }, { type: 'ITEM', amount: 1, itemId: 'exclusive_item_30_day' }] }
          ]
        };
        this.storageManager.saveData('gg_streak', this.streakData);
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
  }

  async refreshDailyTasks() {
    try {
      const tasks = generateTasks();
      this.taskList = tasks;

      // Save tasks with refresh timestamp
      this.storageManager.saveData('gg_tasks', {
        tasks,
        lastRefreshDate: new Date().toISOString()
      });

      this.dispatch({ type: 'TASKS_LOADED', payload: tasks });
      return tasks;
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      return [];
    }
  }

  async updateTaskProgress(taskId, progress) {
    try {
      const task = this.taskList.find(t => t.id === taskId);
      if (!task) return false;

      const newProgress = Math.min(task.requirement, Math.max(task.progress, progress));
      task.progress = newProgress;
      const isCompleted = newProgress >= task.requirement;

      if (isCompleted && !task.completed) {
        task.completed = true;
        this.dispatch({ type: 'TASK_COMPLETED', payload: { taskId } });
      } else {
        this.dispatch({ type: 'UPDATE_TASK_PROGRESS', payload: { taskId, progress: newProgress } });
      }

      // Save updated tasks
      this.storageManager.saveData('gg_tasks', {
        tasks: this.taskList,
        lastRefreshDate: this.storageManager.loadData('gg_tasks')?.lastRefreshDate || new Date().toISOString()
      });

      return isCompleted;
    } catch (error) {
      console.error('Error updating task progress:', error);
      return false;
    }
  }

  async completeTask(taskId) {
    return this.updateTaskProgress(taskId, Infinity); // Set progress to max to complete the task
  }

  async claimTaskReward(taskId, withAdBoost = false) {
    try {
      const task = this.taskList.find(t => t.id === taskId);
      if (!task || !task.completed || task.claimed) return false;

      // Apply reward with or without ad boost
      this.dispatch({ 
        type: 'CLAIM_REWARD', 
        payload: { taskId, withAdBoost } 
      });

      task.claimed = true;
      if (withAdBoost) {
        task.adBoostAvailable = false;
        
        // Update ad status
        this.dispatch({ type: 'AD_VIEWED' });
        this.storageManager.saveData('gg_ad_history', {
          adsViewedToday: this.storageManager.loadData('gg_ad_history')?.adsViewedToday + 1 || 1,
          lastAdTime: new Date().toISOString(),
          lastResetDate: this.storageManager.loadData('gg_ad_history')?.lastResetDate || new Date().toISOString()
        });
      }

      // Save updated tasks
      this.storageManager.saveData('gg_tasks', {
        tasks: this.taskList,
        lastRefreshDate: this.storageManager.loadData('gg_tasks')?.lastRefreshDate || new Date().toISOString()
      });

      // Save updated user stats
      this.storageManager.saveData('gg_user_stats', this.userStats);

      // Check if all tasks are completed for streak update
      this.checkAllTasksCompleted();

      return true;
    } catch (error) {
      console.error('Error claiming task reward:', error);
      return false;
    }
  }

  async claimMilestoneReward(milestone) {
    try {
      const milestoneReward = this.streakData.milestones.find(m => m.days === milestone);
      if (!milestoneReward || milestoneReward.claimed) return false;
      if (this.streakData.current < milestone) return false;

      this.dispatch({ type: 'CLAIM_MILESTONE_REWARD', payload: { milestone } });
      
      // Update milestone in streak data
      milestoneReward.claimed = true;
      this.storageManager.saveData('gg_streak', this.streakData);
      
      // Save updated user stats
      this.storageManager.saveData('gg_user_stats', this.userStats);

      return true;
    } catch (error) {
      console.error('Error claiming milestone reward:', error);
      return false;
    }
  }

  getAvailableTasks() {
    return this.taskList.filter(task => !task.completed);
  }

  getCompletedTasks() {
    return this.taskList.filter(task => task.completed);
  }

  getClaimedTasks() {
    return this.taskList.filter(task => task.claimed);
  }

  getStreakInfo() {
    return this.streakData;
  }

  getAdBoostStatus() {
    return this.adManager.getAdStatus();
  }

  isTasksDataStale(tasksData) {
    if (!tasksData || !tasksData.lastRefreshDate) return true;
    
    const lastRefresh = new Date(tasksData.lastRefreshDate);
    const now = new Date();
    
    // Check if it's a new day (past midnight)
    return lastRefresh.getDate() !== now.getDate() || 
           lastRefresh.getMonth() !== now.getMonth() || 
           lastRefresh.getFullYear() !== now.getFullYear();
  }

  checkForDailyRefresh() {
    try {
      const tasksData = this.storageManager.loadData('gg_tasks');
      if (this.isTasksDataStale(tasksData)) {
        // Update streak before refreshing tasks
        const updatedStreak = checkAndUpdateStreak(
          this.streakData,
          this.taskList
        );
        
        this.streakData = updatedStreak;
        this.dispatch({ 
          type: 'STREAK_UPDATED', 
          payload: { 
            streak: updatedStreak.current, 
            lastCompletion: updatedStreak.lastCompletion 
          } 
        });
        
        this.storageManager.saveData('gg_streak', updatedStreak);
        
        // Reset ad viewing history for the new day
        this.storageManager.saveData('gg_ad_history', {
          adsViewedToday: 0,
          lastAdTime: null,
          lastResetDate: new Date().toISOString()
        });
        
        // Refresh tasks for the new day
        this.refreshDailyTasks();
      }
    } catch (error) {
      console.error('Error checking for daily refresh:', error);
    }
  }

  checkAllTasksCompleted() {
    // If all tasks are completed, update streak data
    const allCompleted = this.taskList.every(task => task.completed);
    if (allCompleted) {
      const today = new Date().toISOString();
      this.streakData.lastCompletion = today;
      this.storageManager.saveData('gg_streak', this.streakData);
    }
  }
}