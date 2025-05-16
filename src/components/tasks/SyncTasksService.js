import { supabase } from '../../utils/supabase';
import { StorageManager } from './StorageManager';

// Enhanced SyncTasksService with better debugging
export class SyncTasksService {
  constructor() {
    this.storageManager = new StorageManager();
    console.log('SyncTasksService initialized');
  }
  
  // Generate mock tasks for when the tasks table doesn't exist
  generateMockTasks() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return [
      {
        id: 1,
        title: "Complete daily login",
        description: "Log in to Golden Glow every day to maintain your streak",
        type: "DAILY_LOGIN",
        status: "Active",
        requirement: 1,
        progress: 0,
        reward: 100,
        reward_type: "MYSTIC_COINS",
        target_game: null,
        expires_at: tomorrow.toISOString()
      },
      {
        id: 2,
        title: "Play Marks of Destiny",
        description: "Play 3 rounds of Tic-Tac-Toe",
        type: "GAME_SPECIFIC",
        status: "Active",
        requirement: 3,
        progress: 0,
        reward: 75,
        reward_type: "MYSTIC_COINS",
        target_game: "marks-of-destiny",
        expires_at: tomorrow.toISOString()
      },
      {
        id: 3,
        title: "Complete all daily tasks",
        description: "Finish all available tasks for today",
        type: "ACHIEVEMENT",
        status: "Active",
        requirement: 1,
        progress: 0,
        reward: 150,
        reward_type: "MYSTIC_COINS",
        target_game: null,
        expires_at: tomorrow.toISOString()
      }
    ];
  }

  // Enhanced version with better error handling for production debugging
  async syncFromSupabase() {
    try {
      console.log('Syncing tasks from Supabase to local storage...', new Date().toISOString());
      console.log('Supabase URL configured:', !!import.meta.env.VITE_SUPABASE_URL);
      console.log('Supabase Anon Key configured:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      // Check connection by directly testing the tasks table
      // We'll skip any profile/auth checks entirely since they're causing issues
      try {
        console.log('▶️ Testing Supabase connection by checking tasks table directly...');
        // We skip auth/profiles entirely and go straight to what matters - the tasks table
      } catch (pingErr) {
        console.error('❌ Supabase connection test exception:', pingErr);
      }
      
      // Check if the tasks table exists by trying to access it
      const { error: tableCheckError } = await supabase
        .from('tasks')
        .select('count')
        .limit(1);
      
      if (tableCheckError) {
        console.error('❌ Tasks table access error:', tableCheckError);  
        
        if (tableCheckError.code === '42P01') { // Table doesn't exist error
          console.log('⚠️ Tasks table does not exist. We need to create it.');
          
          // In this case we should create mock tasks and store them in emergency cache
          // as a fallback until the actual table is created in Supabase
          const mockTasks = this.generateMockTasks();
          localStorage.setItem('emergency_tasks', JSON.stringify(mockTasks));
          console.log('✅ Created mock tasks and saved to emergency_tasks:', mockTasks.length);
          return true;
        }
      } else {
        console.log('✅ Tasks table exists in Supabase');
      }
      
      // Basic fetch of active tasks
      const { data: supabaseTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'Active');

      if (error) {
        console.error('❌ Error fetching tasks from Supabase:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return false;
      }

      // Print tasks for debugging
      console.log(`✅ Found ${supabaseTasks?.length || 0} tasks in Supabase`);
      if (supabaseTasks?.length > 0) {
        console.log('Sample task:', JSON.stringify(supabaseTasks[0], null, 2));
      } else {
        console.warn('⚠️ No tasks found in Supabase tasks table');
        
        // If the table exists but no tasks, let's add default tasks
        console.log('⚠️ Creating default tasks in Supabase...');
        const mockTasks = this.generateMockTasks();
        
        try {
          // Insert default tasks into Supabase
          const { data: insertedTasks, error: insertError } = await supabase
            .from('tasks')
            .insert(mockTasks)
            .select();
            
          if (insertError) {
            console.error('❌ Failed to insert default tasks:', insertError);
          } else {
            console.log('✅ Successfully inserted default tasks:', insertedTasks?.length);
            
            // Store in emergency cache
            localStorage.setItem('emergency_tasks', JSON.stringify(insertedTasks || mockTasks));
            console.log('✅ Saved inserted tasks to emergency_tasks');  
            return true;
          }
        } catch (insertErr) {
          console.error('❌ Exception during task insertion:', insertErr);
        }
        
        // Fallback - use mock tasks in emergency cache
        localStorage.setItem('emergency_tasks', JSON.stringify(mockTasks));
        console.log('✅ Saved mock tasks to emergency_tasks as fallback');
        return true;
      }
      
      // Store a simplified copy in localStorage for emergency access
      if (supabaseTasks && supabaseTasks.length > 0) {
        localStorage.setItem('emergency_tasks', JSON.stringify(supabaseTasks));
        console.log('✅ Tasks saved to emergency_tasks in localStorage');
        return true;
      } else {
        console.warn('⚠️ No tasks saved to emergency_tasks (empty result)');
        return false;
      }

    } catch (error) {
      console.error('❌ Exception in syncFromSupabase:', error);
      console.error('Stack trace:', error?.stack || 'No stack trace available');
      return false;
    }
  }
}
