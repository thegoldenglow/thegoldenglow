import { supabase, isSupabaseAvailable } from '../../utils/supabase';
import { StorageManager } from './StorageManager';

// Enhanced SyncTasksService with comprehensive debugging
export class SyncTasksService {
  constructor() {
    this.storageManager = new StorageManager();
    this.dispatcher = null;
    console.log('SyncTasksService initialized');
  }

  // Set the dispatcher to update application state
  setDispatcher(dispatcher) {
    this.dispatcher = dispatcher;
    console.log('Dispatcher connected:', !!dispatcher);
  }

  // Check if we have a valid Supabase connection
  async checkConnection() {
    try {
      // Short-circuit when Supabase is not configured/available (guest mode)
      if (!isSupabaseAvailable()) {
        console.warn('Supabase not available (guest mode). Skipping connection check.');
        return { connected: false, error: new Error('Supabase not available') };
      }

      // If the browser is offline, don't attempt requests
      try {
        if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
          console.warn('Navigator reports offline status. Skipping connection check.');
          return { connected: false, error: new Error('Offline') };
        }
      } catch {}

      console.log('Testing Supabase connection...');

      // Try a lightweight GET query against a likely public table.
      // Avoid HEAD requests to prevent potential CORS/adapter aborts in some environments.
      let lastError = null;

      // Attempt 1: tasks table exists and accessible?
      try {
        const { error: tasksGetError } = await supabase
          .from('tasks')
          .select('id')
          .limit(1);
        if (!tasksGetError) {
          console.log('Supabase connection OK via tasks table');
          return { connected: true, via: 'tasks' };
        }
        lastError = tasksGetError;
        console.warn('Tasks GET check failed:', tasksGetError?.message || tasksGetError);
      } catch (e) {
        lastError = e;
        console.warn('Tasks GET check threw error:', e);
      }

      // Attempt 2: profiles table exists and accessible?
      try {
        const { error: profilesGetError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        if (!profilesGetError) {
          console.log('Supabase connection OK via profiles table');
          return { connected: true, via: 'profiles' };
        }
        lastError = profilesGetError;
        console.warn('Profiles GET check failed:', profilesGetError?.message || profilesGetError);
      } catch (e) {
        lastError = e;
        console.warn('Profiles GET check threw error:', e);
      }

      // Could not verify connection via accessible tables
      console.error('Failed to verify Supabase connection via public tables');
      return {
        connected: false,
        error: lastError || new Error('Unable to verify Supabase connection'),
      };
    } catch (err) {
      console.error('Unexpected error checking Supabase connection:', err);
      return {
        connected: false,
        error: err
      };
    }
  }
  
  // Try different approaches to find tasks
  async findTasksTable() {
    try {
      // Short-circuit when Supabase is not configured/available (guest mode)
      if (!isSupabaseAvailable()) {
        console.warn('Supabase not available (guest mode). Skipping findTasksTable.');
        return { exists: false, error: 'Supabase not available' };
      }

      // First try the tasks table (use GET + limit(1) to avoid HEAD)
      const { error: taskError } = await supabase
        .from('tasks')
        .select('id')
        .limit(1);
      
      if (!taskError) {
        return {
          exists: true,
          table: 'tasks'
        };
      }
      
      // If tasks table doesn't exist, check for task (singular)
      const { error: singularError } = await supabase
        .from('task')
        .select('id')
        .limit(1);
      
      if (!singularError) {
        return {
          exists: true,
          table: 'task'
        };
      }
      
      // Do not attempt to query system catalogs via PostgREST (not exposed by default)
      console.warn('No tasks table found (tasks/task not accessible).');
      
      return {
        exists: false,
        error: 'No tasks table found'
      };
    } catch (err) {
      console.error('Error finding tasks table:', err);
      return {
        exists: false,
        error: err
      };
    }
  }

  // Enhanced version to properly load tasks with full debugging
  async syncFromSupabase() {
    try {
      console.log('Syncing tasks from Supabase with detailed logging...');
      
      // First check if we can connect to Supabase (this now short-circuits in guest mode)
      const connection = await this.checkConnection();
      console.log('Supabase connection status:', connection);
      
      if (!connection.connected) {
        console.error('Cannot load tasks - No connection to Supabase');
        // Generate dummy tasks for testing
        const dummyTasks = this.createDummyTasks();
        if (this.dispatcher) {
          console.log('Dispatching dummy tasks for testing:', dummyTasks);
          this.dispatcher({ type: 'TASKS_REFRESHED', payload: { tasks: dummyTasks } });
          return true;
        }
        return false;
      }
      
      // Check if the tasks table exists
      const tableInfo = await this.findTasksTable();
      console.log('Tasks table info:', tableInfo);
      
      let tableName = 'tasks'; // default
      if (tableInfo.exists && tableInfo.table) {
        tableName = tableInfo.table;
      } else if (!tableInfo.exists) {
        console.warn(`No tasks table found. Available tables: ${JSON.stringify(tableInfo.availableTables || [])}`);
        // Generate dummy tasks for testing
        const dummyTasks = this.createDummyTasks();
        if (this.dispatcher) {
          console.log('Dispatching dummy tasks since no table exists:', dummyTasks);
          this.dispatcher({ type: 'TASKS_REFRESHED', payload: { tasks: dummyTasks } });
          return true;
        }
        return false;
      }
      
      // Try different queries to maximize chances of finding tasks
      console.log(`Trying to fetch tasks from '${tableName}' table...`);
      
      // First try without any filters
      const { data: allTasks, error: allError } = await supabase
        .from(tableName)
        .select('*');
      
      if (allError) {
        console.error(`Error fetching all tasks from ${tableName}:`, allError);
        return false;
      }
      
      console.log(`Found ${allTasks?.length || 0} total tasks in ${tableName} table:`, allTasks);
      
      // Filter active tasks client-side to handle different schemas
      const activeTasks = allTasks?.filter(task => 
        !task.status || task.status === 'Active' || task.status === 'active'
      ) || [];
      
      console.log(`After filtering, found ${activeTasks.length} active tasks:`, activeTasks);
      
      // Store a copy in localStorage for emergency access
      if (activeTasks.length > 0) {
        localStorage.setItem('emergency_tasks', JSON.stringify(activeTasks));
        
        // Load existing local tasks to preserve client-side progress/completion
        const existingLocal = this.storageManager.loadData('gg_tasks');
        const localMap = {};
        if (existingLocal && Array.isArray(existingLocal.tasks)) {
          for (const t of existingLocal.tasks) {
            localMap[t.id] = t;
          }
        }

        // Format tasks for the application, handling different possible schemas.
        // Merge with local state to avoid losing verified/completed status when server lags.
        const formattedTasks = activeTasks.map(task => {
          const id = task.id?.toString() || Math.random().toString(36).substring(2, 9);
          const local = localMap[id];
          const requirement = parseInt(task.requirement || task.req || 1, 10);
          const serverProgress = parseInt(task.progress || 0, 10);
          const mergedProgress = Math.max(local?.progress || 0, serverProgress);
          const serverCompleted = task.completed === true || (mergedProgress >= requirement);
          const mergedCompleted = (local?.completed === true) || serverCompleted;
          const mergedClaimed = (local?.claimed === true) || (task.claimed === true);
          return {
            id,
            title: task.title || task.name || 'Mystery Task',
            description: task.description || task.desc || 'Complete this task to earn rewards',
            type: task.type || task.task_type || 'DAILY_LOGIN', 
            // Ensure we also consider game_identifier as a fallback to support navigation
            targetGame: task.target_game || task.targetGame || task.game_identifier || null,
            // Preserve the raw identifier as well for consumers that rely on it
            game_identifier: task.game_identifier || task.gameIdentifier || '',
            // Include the link field for task navigation
            link: task.link || null,
            requirement,
            progress: mergedProgress,
            completed: mergedCompleted,
            claimed: mergedClaimed,
            adBoostAvailable: (local?.adBoostAvailable != null) ? local.adBoostAvailable : (task.ad_boost_available !== false),
            expiresAt: task.expires_at || task.expiresAt || new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
            rewards: [
              {
                type: 'MYSTIC_COINS',
                amount: parseFloat(task.reward || task.rewards || 10)
              }
            ]
          };
        });
        
        console.log('Formatted tasks for application:', formattedTasks);
        
        // Save to local storage with timestamp
        this.storageManager.saveData('gg_tasks', {
          tasks: formattedTasks,
          lastRefreshDate: new Date().toISOString(),
          lastSyncDate: new Date().toISOString()
        });
        
        // Update application state if dispatcher is available
        if (this.dispatcher) {
          console.log('Dispatching tasks to application state:', formattedTasks);
          this.dispatcher({ type: 'TASKS_REFRESHED', payload: { tasks: formattedTasks } });
        } else {
          console.error('No dispatcher available to update app state!');
        }
        
        return true;
      } else {
        console.warn('No active tasks found. Creating dummy tasks instead.');
        // Generate dummy tasks if none were found
        const dummyTasks = this.createDummyTasks();
        if (this.dispatcher) {
          this.dispatcher({ type: 'TASKS_REFRESHED', payload: { tasks: dummyTasks } });
        }
        return true;
      }
    } catch (error) {
      console.error('Critical error in syncFromSupabase:', error);
      return false;
    }
  }
  
  // Create dummy tasks for testing
  createDummyTasks() {
    console.log('Creating dummy tasks for testing...');
    const endOfDayISO = new Date(new Date().setHours(23, 59, 59, 999)).toISOString();
    return [
      {
        id: 'dummy1',
        title: 'Daily Login',
        description: 'Log in to the app to earn rewards',
        type: 'DAILY_LOGIN', 
        targetGame: null,
        requirement: 1,
        progress: 0,
        completed: false,
        claimed: false,
        adBoostAvailable: true,
        expiresAt: endOfDayISO,
        rewards: [
          {
            type: 'MYSTIC_COINS',
            amount: 10
          }
        ]
      },
      {
        id: 'dummyGame1',
        title: 'Play Marks of Destiny',
        description: 'Complete one match in Marks of Destiny',
        type: 'GAME_SPECIFIC',
        targetGame: 'marks-of-destiny',
        requirement: 1,
        progress: 0,
        completed: false,
        claimed: false,
        adBoostAvailable: true,
        expiresAt: endOfDayISO,
        rewards: [
          { type: 'MYSTIC_COINS', amount: 20 }
        ]
      },
      {
        id: 'dummyGame2',
        title: 'Play Path of Enlightenment',
        description: 'Finish a session in Path of Enlightenment',
        type: 'GAME_SPECIFIC',
        targetGame: 'path-of-enlightenment',
        requirement: 1,
        progress: 0,
        completed: false,
        claimed: false,
        adBoostAvailable: true,
        expiresAt: endOfDayISO,
        rewards: [
          { type: 'MYSTIC_COINS', amount: 25 }
        ]
      },
      {
        id: 'dummy2',
        title: 'Sample Task',
        description: 'This is a sample task to show the UI functions correctly',
        type: 'CROSS_GAME',
        targetGame: null,
        requirement: 2,
        progress: 0,
        completed: false,
        claimed: false,
        adBoostAvailable: true,
        expiresAt: endOfDayISO,
        rewards: [
          {
            type: 'MYSTIC_COINS',
            amount: 15
          }
        ]
      }
    ];
  }
}
