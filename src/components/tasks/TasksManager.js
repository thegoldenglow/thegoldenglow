import { StorageManager } from './StorageManager';
import { AdManager } from './AdManager';
import { SyncTasksService } from './SyncTasksService';
import { generateTasks, checkAndUpdateStreak, getDefaultUserStats } from '../../utils/taskUtils';
import { v4 as uuidv4 } from 'uuid';

export class TasksManager {
  constructor(dispatch) {
    this.dispatch = dispatch;
    this.storageManager = new StorageManager();
    this.adManager = new AdManager();
    this.syncService = new SyncTasksService();
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
      // Log environment for debugging
      console.log('Environment:', import.meta.env.MODE);
      console.log('TasksManager.loadTasks() called at:', new Date().toISOString());
      
      // Check for the last successful real data sync
      const lastRealSync = localStorage.getItem('last_real_data_sync');
      const hasHadRealData = !!lastRealSync;
      if (hasHadRealData) {
        console.log('✅ Previously synced real data from Supabase on:', new Date(lastRealSync).toLocaleString());
      }

      // Try to load from emergency cache first (from our simplified SyncTasksService)
      const emergencyTasks = localStorage.getItem('emergency_tasks');
      
      if (emergencyTasks) {
        try {
          const parsedTasks = JSON.parse(emergencyTasks);
          const isRealData = parsedTasks.length > 0 && parsedTasks[0].is_real_data === true;
          
          console.log(`▶️ Using ${isRealData ? 'REAL' : 'MOCK'} tasks from cache:`, parsedTasks.length);
          
          if (parsedTasks.length === 0) {
            console.warn('⚠️ Emergency tasks cache exists but is empty - will try direct sync');
            // Don't throw error yet, try direct sync first
          } else {
            // Convert to the expected format
            const formattedTasks = parsedTasks.map(task => ({
              id: task.id?.toString() || uuidv4(),
              title: task.title || 'Unknown Task',
              description: task.description || 'Task details unavailable',
              type: task.type || 'Daily', 
              targetGame: task.target_game || null,
              requirement: Number(task.requirement) || 1,
              progress: Number(task.progress) || 0,
              completed: Boolean(task.completed) || false,
              claimed: Boolean(task.claimed) || false,
              adBoostAvailable: task.ad_boost_available !== false, // Default to true
              expiresAt: task.expires_at || new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
              rewards: [
                {
                  type: task.reward_type || 'MYSTIC_COINS',
                  amount: Number(task.reward_amount || task.reward) || 10
                }
              ],
              isRealData: isRealData // Keep track of data source
            }));
            
            console.log('▶️ Sample formatted task:', JSON.stringify(formattedTasks[0], null, 2));
            
            this.taskList = formattedTasks;
            this.dispatch({ type: 'TASKS_LOADED', payload: formattedTasks });
            
            // Also try to sync in the background
            console.log('▶️ Attempting background sync with Supabase...');
            this.syncService.syncFromSupabase()
              .then(success => {
                console.log(success ? '✅ Background sync successful!' : '⚠️ Background sync returned false');
                // If we had mock data but got real data, reload tasks without refreshing the page
                if (success && !isRealData) {
                  console.log('✅ Got real data to replace mocks! Reloading tasks...');
                  setTimeout(() => this.loadTasks(), 1000); // Give a second for storage to update
                }
              })
              .catch(e => console.warn('⚠️ Background sync failed:', e));
            
            // If we have real data, we're done
            // Only keep trying if we have mock data
            if (isRealData) {
              return; // We're done if we have real data
            }
          }
        } catch (parseError) {
          console.error('❌ Error parsing emergency tasks:', parseError);
          // Continue to fallback
        }
      } else {
        console.log('⚠️ No emergency tasks found in localStorage');
      }
      
      // Before falling back to mocks, try a direct Supabase sync
      try {
        console.log('▶️ Attempting direct Supabase sync before generating mock tasks...');
        const syncSuccess = await this.syncService.syncFromSupabase();
        
        if (syncSuccess) {
          console.log('✅ Direct Supabase sync successful!');
          // Now try to load from emergency cache again (should be populated by the sync)
          const freshEmergencyTasks = localStorage.getItem('emergency_tasks');
          
          if (freshEmergencyTasks) {
            const parsedFreshTasks = JSON.parse(freshEmergencyTasks);
            if (parsedFreshTasks && parsedFreshTasks.length > 0) {
              const isRealData = parsedFreshTasks[0].is_real_data === true;
              console.log(`✅ Successfully loaded ${isRealData ? 'REAL' : 'MOCK'} tasks from Supabase!`, parsedFreshTasks.length);
              
              // Instead of forcing a reload, just format and use the tasks directly
              const formattedTasks = parsedFreshTasks.map(task => ({
                id: task.id?.toString() || uuidv4(),
                title: task.title || 'Unknown Task',
                description: task.description || 'Task details unavailable',
                type: task.type || 'Daily', 
                targetGame: task.target_game || null,
                requirement: Number(task.requirement) || 1,
                progress: Number(task.progress) || 0,
                completed: Boolean(task.completed) || false,
                claimed: Boolean(task.claimed) || false,
                adBoostAvailable: task.ad_boost_available !== false,
                expiresAt: task.expires_at || new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
                rewards: [
                  {
                    type: task.reward_type || 'MYSTIC_COINS',
                    amount: Number(task.reward_amount || task.reward) || 10
                  }
                ],
                isRealData: isRealData
              }));
              
              this.taskList = formattedTasks;
              this.dispatch({ type: 'TASKS_LOADED', payload: formattedTasks });
              return;
            }
          }
        } else {
          const hasHadRealData = !!localStorage.getItem('last_real_data_sync');
          if (hasHadRealData) {
            // If we've had real data before, don't fall back to mocks!
            console.warn('⚠️ Direct Supabase sync failed, but we had real data before. NOT using mock tasks.');
            // Don't continue to fallback in this case
            return;
          } else {
            console.warn('⚠️ Direct Supabase sync failed, will use mock tasks as initial data only');
          }
        }
      } catch (syncError) {
        console.error('❌ Error during direct Supabase sync:', syncError);
        // Continue to fallback only if we've never had real data
        if (!!localStorage.getItem('last_real_data_sync')) {
          return; // Don't use mocks if we've had real data before
        }
      }
      
      // Fallback to generating tasks if we don't have any cached tasks
      console.log('▶️ Generating mock tasks as last resort...');
      const tasks = generateTasks();
      this.taskList = tasks;
      this.dispatch({ type: 'TASKS_LOADED', payload: tasks });
      
      // Schedule another sync attempt for the future
      setTimeout(() => {
        console.log('▶️ Attempting delayed background sync...');
        this.syncService.syncFromSupabase()
          .then(success => console.log(success ? '✅ Delayed sync successful' : '⚠️ Delayed sync returned false'))
          .catch(e => console.warn('⚠️ Delayed sync failed:', e));
      }, 5000); // Try again after 5 seconds
    } catch (error) {
      console.error('❌ Unhandled error in loadTasks:', error);
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