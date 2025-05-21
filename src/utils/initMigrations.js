/**
 * Database Migration Initialization
 * Runs all necessary migrations when the application starts
 */

import { migrateTelegramBotFields } from '../migrations/add_telegram_bot_fields';
import { supabase } from './supabase';

/**
 * Run all database migrations
 * This should be called when the application initializes
 */
export const runMigrations = async () => {
  try {
    console.log('Starting database migrations...');
    
    // Check if we're connected to Supabase
    const { success: connected, error: connectionError } = await checkSupabaseConnection();
    
    if (!connected) {
      console.error('Cannot run migrations, database not connected:', connectionError);
      return { success: false, error: connectionError };
    }
    
    // Add Telegram bot fields migration
    const telegramResult = await migrateTelegramBotFields();
    if (!telegramResult.success) {
      console.error('Telegram bot fields migration failed:', telegramResult.error);
    } else {
      console.log('Telegram bot fields migration completed successfully');
    }
    
    // Add more migrations here as needed
    
    console.log('All migrations completed');
    return { success: true };
  } catch (error) {
    console.error('Migration process failed:', error);
    return { success: false, error };
  }
};

/**
 * Check if we can connect to Supabase
 */
const checkSupabaseConnection = async () => {
  try {
    // Try a simple query to check connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

// Auto-run migrations if this module is the entry point
if (import.meta.url === import.meta.main) {
  runMigrations()
    .then(result => {
      console.log('Migration process result:', result);
    })
    .catch(error => {
      console.error('Migration process error:', error);
    });
}

export default runMigrations;
