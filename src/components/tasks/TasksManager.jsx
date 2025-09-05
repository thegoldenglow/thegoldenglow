import { StorageManager } from './StorageManager';
import { AdManager } from './AdManager';
import { SyncTasksService } from './SyncTasksService';
import { generateTasks, checkAndUpdateStreak, getDefaultUserStats } from '../../utils/taskUtils';
import { supabase, isSupabaseAvailable } from '../../utils/supabase';
import { TaskProgressService } from './TaskProgressService';

export class TasksManager {
  constructor(dispatch) {
    this.dispatch = dispatch;
    this.storageManager = new StorageManager();
    this.adManager = new AdManager();
    this.syncService = new SyncTasksService();
    // Connect the dispatcher to the sync service
    this.syncService.setDispatcher(dispatch);
    this.progressService = new TaskProgressService();
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
      if (isSupabaseAvailable()) {
        try {
          console.log('Attempting to load tasks directly from Supabase...');
          const syncResult = await this.syncService.syncFromSupabase();
          
          // Check if tasks were loaded from gg_tasks storage after sync
          const localTaskData = this.storageManager.loadData('gg_tasks');
          if (localTaskData && localTaskData.tasks && localTaskData.tasks.length > 0) {
            console.log('Using tasks from Supabase sync:', localTaskData.tasks.length);
            this.taskList = localTaskData.tasks;
            this.dispatch({ type: 'TASKS_LOADED', payload: localTaskData.tasks });
            await this._hydrateProgressFromServer();
            return;
          }
        } catch (syncError) {
          console.warn('Failed to sync from Supabase:', syncError);
        }
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
            // Use multiple fallbacks so navigation has a valid slug
            targetGame: task.target_game || task.targetGame || task.game_identifier || null,
            // Preserve raw identifier for components that rely on it
            game_identifier: task.game_identifier || task.gameIdentifier || '',
            // Include the link field for task navigation
            link: task.link || null,
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
          await this._hydrateProgressFromServer();
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
      if (isSupabaseAvailable()) {
        this.syncService.syncFromSupabase().catch(e => console.warn('Background sync retry failed:', e));
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
      // Instead of generating local tasks, just re-sync with the database
      if (isSupabaseAvailable()) {
        await this.syncService.syncFromSupabase();
      }
      
      // Reload synced tasks from storage
      const refreshedTasksData = this.storageManager.loadData('gg_tasks');
      const tasks = refreshedTasksData?.tasks || [];
      
      this.taskList = tasks;
      this.dispatch({ type: 'TASKS_LOADED', payload: tasks });
      console.log('Refreshed tasks from database:', tasks.length);
      await this._hydrateProgressFromServer();
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

      // Save updated tasks locally
      this.storageManager.saveData('gg_tasks', {
        tasks: this.taskList,
        lastRefreshDate: this.storageManager.loadData('gg_tasks')?.lastRefreshDate || new Date().toISOString()
      });
      // Persist progress server-side for authenticated users
      if (isSupabaseAvailable()) {
        try {
          await this.progressService.upsertProgress(taskId, newProgress, isCompleted, task.requirement);
        } catch (e) {
          console.warn('Non-fatal: failed to upsert progress to server:', e?.message || e);
        }
      }
      return isCompleted;
    } catch (error) {
      console.error('Error updating task progress:', error);
      return false;
    }
  }

  async completeTask(taskId) {
    return this.updateTaskProgress(taskId, Infinity); // Set progress to max to complete the task
  }

  /**
   * Complete an embedded post viewing task with specific validation
   * @param {string} taskId - The task ID
   * @param {number} viewingTime - Time spent viewing the post
   * @param {number} requiredTime - Required viewing time
   * @returns {boolean} - Whether the task was completed successfully
   */
  async completeEmbeddedPostTask(taskId, viewingTime, requiredTime) {
    try {
      const task = this.taskList.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found:', taskId);
        return false;
      }

      // Validate that this is a Content Engagement task
      if (task.taskCategory !== 'Content Engagement') {
        console.error('Task is not a Content Engagement task:', taskId);
        return false;
      }

      // Validate viewing time meets requirement
      if (viewingTime < requiredTime) {
        console.error('Insufficient viewing time:', { viewingTime, requiredTime });
        return false;
      }

      // Mark task as completed
      const wasCompleted = await this.updateTaskProgress(taskId, task.requirement);
      
      if (wasCompleted) {
        console.log('Embedded post task completed successfully:', {
          taskId,
          title: task.title,
          viewingTime,
          requiredTime
        });
        
        // Dispatch specific event for embedded post completion
        this.dispatch({ 
          type: 'EMBEDDED_POST_COMPLETED', 
          payload: { 
            taskId, 
            viewingTime, 
            requiredTime,
            taskTitle: task.title
          } 
        });
      }
      
      return wasCompleted;
    } catch (error) {
      console.error('Error completing embedded post task:', error);
      return false;
    }
  }

  async claimTaskReward(taskId, withAdBoost = false) {
    try {
      const task = this.taskList.find(t => t.id === taskId);
      if (!task || !task.completed || task.claimed) return false;

      // Server-side validation if possible
      let canClaim = true;
      if (isSupabaseAvailable()) {
        try {
          canClaim = await this.progressService.canClaim(taskId, task.requirement);
        } catch (e) {
          console.warn('Validation skipped due to error:', e?.message || e);
        }
      }
      if (!canClaim) {
        this.dispatch({ type: 'SET_ERROR', payload: 'Unable to validate task completion for claim.' });
        return false;
      }
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

      // Save updated tasks locally
      this.storageManager.saveData('gg_tasks', {
        tasks: this.taskList,
        lastRefreshDate: this.storageManager.loadData('gg_tasks')?.lastRefreshDate || new Date().toISOString()
      });

      // Save updated user stats
      this.storageManager.saveData('gg_user_stats', this.userStats);

      // Attempt to log completion in Supabase (only if authenticated)
      if (isSupabaseAvailable()) {
        try {
          const { data: authData, error: authError } = await supabase.auth.getUser();
          if (authError) {
            console.warn('Supabase auth getUser error while logging task completion:', authError.message);
          }
          const authenticatedUser = authData?.user;
          if (authenticatedUser?.id) {
            const numericTaskId = typeof taskId === 'string' ? parseInt(taskId, 10) : taskId;
            if (!Number.isNaN(numericTaskId)) {
              const { error: insertError } = await supabase
                .from('task_completions')
                .insert({ task_id: numericTaskId, user_id: authenticatedUser.id });
              if (insertError) {
                console.error('Error inserting task completion into Supabase:', insertError);
              }
              // Also mark claimed in progress table
              try { await this.progressService.markClaimed(taskId); } catch (_) {}
            } else {
              console.warn('Skipping server logging: taskId could not be parsed to number', { taskId });
            }
          } else {
            // Not authenticated, skip server logging silently
            console.log('Skipping server logging for task completion (user not authenticated).');
          }
        } catch (logError) {
          console.error('Unexpected error while logging task completion to Supabase:', logError);
        }
      }

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

  async _hydrateProgressFromServer() {
    if (!isSupabaseAvailable()) return;
    try {
      if (!this.taskList || this.taskList.length === 0) return;
      const ids = this.taskList.map(t => t.id);
      const map = await this.progressService.loadProgressMap(ids);
      let changed = false;
      for (const t of this.taskList) {
        const numericId = (() => { try { return parseInt(t.id, 10); } catch (_) { return null; } })();
        const row = numericId != null ? map[numericId] : undefined;
        if (row) {
          const newProgress = typeof row.progress === 'number' ? row.progress : (t.progress || 0);
          const newCompleted = row.completed || (newProgress >= (t.requirement || 1));
          const newClaimed = row.claimed || t.claimed;
          if (newProgress !== t.progress || newCompleted !== t.completed || newClaimed !== t.claimed) {
            t.progress = newProgress;
            t.completed = newCompleted;
            t.claimed = newClaimed;
            changed = true;
          }
        }
      }
      if (changed) {
        // Persist and dispatch refreshed tasks
        this.storageManager.saveData('gg_tasks', {
          tasks: this.taskList,
          lastRefreshDate: this.storageManager.loadData('gg_tasks')?.lastRefreshDate || new Date().toISOString()
        });
        this.dispatch({ type: 'TASKS_REFRESHED', payload: { tasks: this.taskList } });
      }
    } catch (e) {
      console.warn('Failed to hydrate progress from server:', e?.message || e);
    }
  }
}