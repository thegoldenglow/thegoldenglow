import { supabase } from '../../utils/supabase';
import { StorageManager } from './StorageManager';

// Simplified SyncTasksService to fix loading issues
export class SyncTasksService {
  constructor() {
    this.storageManager = new StorageManager();
    console.log('SyncTasksService initialized');
  }

  // Simplified version to reduce potential issues
  async syncFromSupabase() {
    try {
      console.log('Syncing tasks from Supabase to local storage...');
      
      // Basic fetch of active tasks
      const { data: supabaseTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'Active');

      if (error) {
        console.error('Error fetching tasks from Supabase:', error);
        return false;
      }

      // Print tasks for debugging
      console.log(`Found ${supabaseTasks?.length || 0} tasks in Supabase`);
      
      // Store a simplified copy in localStorage for emergency access
      if (supabaseTasks && supabaseTasks.length > 0) {
        localStorage.setItem('emergency_tasks', JSON.stringify(supabaseTasks));
      }

      return true;
    } catch (error) {
      console.error('Error in simplified syncFromSupabase:', error);
      return false;
    }
  }
}
