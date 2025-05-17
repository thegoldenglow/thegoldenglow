import { StorageManager } from './StorageManager';
import { AdManager } from './AdManager';
import { SyncTasksService } from './SyncTasksService';
import { generateTasks, checkAndUpdateStreak, getDefaultUserStats } from '../../utils/taskUtils';

export class TasksManager {
  constructor(dispatch) {
    this.dispatch = dispatch;
    this.storageManager = new StorageManager();
    this.adManager = new AdManager();
    this.syncService = new SyncTasksService();
    // Connect the dispatcher to the sync service
    this.syncService.setDispatcher(dispatch);
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
      console.log('Loading tasks...');
      
      // First attempt to sync with Supabase immediately
      try {
        console.log('Attempting to load tasks directly from Supabase...');
        const syncResult = await this.syncService.syncFromSupabase();
        
        // Check if tasks were loaded from gg_tasks storage after sync
        const localTaskData = this.storageManager.loadData('gg_tasks');
        if (localTaskData && localTaskData.tasks && localTaskData.tasks.length > 0) {
          console.log('Using tasks from Supabase sync:', localTaskData.tasks.length);
          this.taskList = localTaskData.tasks;
          this.dispatch({ type: 'TASKS_LOADED', payload: localTaskData.tasks });
          return;
        }
      } catch (syncError) {
        console.warn('Failed to sync from Supabase:', syncError);
      }
      
      // If Supabase sync fails, try loading from emergency cache
      const emergencyTasks = localStorage.getItem('emergency_tasks');
      
      if (emergencyTasks) {
        try {
          const parsedTasks = JSON.parse(emergencyTasks);
          console.log('Using emergency tasks from cache:', parsedTasks.length);
          
          // Convert to the expected format
          const formattedTasks = parsedTasks.map(task => ({
            id: task.id.toString(),
            title: task.title || 'Task',
            description: task.description || 'Complete this task to earn rewards',
            type: task.type || 'DAILY_LOGIN', 
            targetGame: task.target_game || null,
            requirement: parseInt(task.requirement || 1, 10),
            progress: parseInt(task.progress || 0, 10),
            completed: task.completed === true,
            claimed: task.claimed === true,
            adBoostAvailable: task.ad_boost_available !== false,
            expiresAt: task.expires_at || new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
            rewards: [
              {
                type: 'MYSTIC_COINS',
                amount: parseFloat(task.reward) || 10
              }
            ]
          }));
          
          this.taskList = formattedTasks;
          this.dispatch({ type: 'TASKS_LOADED', payload: formattedTasks });
          return;
        } catch (parseError) {
          console.error('Error parsing emergency tasks:', parseError);
        }
      }
      
      // Fallback to generating tasks if we don't have any cached tasks
      console.log('No tasks found from any source, generating local tasks...');
      const tasks = generateTasks();
      this.taskList = tasks;
      this.dispatch({ type: 'TASKS_LOADED', payload: tasks });
      
      // Try syncing again in the background for next reload
      this.syncService.syncFromSupabase().catch(e => console.warn('Background sync retry failed:', e));
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
      // Instead of generating local tasks, just re-sync with the database
      await this.syncService.syncFromSupabase();
      
      // Reload synced tasks from storage
      const refreshedTasksData = this.storageManager.loadData('gg_tasks');
      const tasks = refreshedTasksData?.tasks || [];
      
      this.taskList = tasks;
      this.dispatch({ type: 'TASKS_LOADED', payload: tasks });
      console.log('Refreshed tasks from database:', tasks.length);
      return tasks;
    } catch (error) {
      console.error('Error refreshing tasks from database:', error);
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
      const currentDate = new Date();
      const lastSyncDate = tasksData?.lastSyncDate ? new Date(tasksData.lastSyncDate) : null;
      
      // If last sync was more than 1 hour ago, or it's a different day, refresh from database
      const needsRefresh = !lastSyncDate || 
        (currentDate - lastSyncDate) > (60 * 60 * 1000) || // 1 hour in milliseconds
        lastSyncDate.getDate() !== currentDate.getDate() || 
        lastSyncDate.getMonth() !== currentDate.getMonth() || 
        lastSyncDate.getFullYear() !== currentDate.getFullYear();
      
      if (needsRefresh) {
        console.log('Tasks are stale, refreshing from database...');
        
        // Update streak data
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
        
        // Refresh tasks from database instead of generating new ones
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