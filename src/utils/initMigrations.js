/**
 * Database Migration Initialization
 * Runs all necessary migrations when the application starts
 */

import { migrateTelegramBotFields } from '../migrations/add_telegram_bot_fields';
import { isSupabaseAvailable, checkSupabaseConnection } from './supabase';

/**
 * Run all database migrations
 * This should be called when the application initializes
 */
export const runMigrations = async () => {
  try {
    console.log('Starting database migrations...');

    // Skip if Supabase is not configured locally (guest mode or missing env)
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not configured or guest mode enabled. Skipping migrations.');
      return { success: false, skipped: true, error: 'Supabase not configured' };
    }

    // Optionally, avoid running schema migrations from the browser for safety
    if (typeof window !== 'undefined') {
      // We still do a lightweight connectivity check for diagnostics
      const { success: connected, error: connectionError } = await checkSupabaseConnection();
      if (!connected) {
        console.error('Cannot run migrations, database not connected:', connectionError);
        return { success: false, skipped: true, error: connectionError };
      }

      console.log('Supabase connected. Skipping schema migrations in browser environment for safety.');
      return { success: true, skipped: true };
    }

    // Migrations for non-browser environments
    console.log('Running server-side migrations...');

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
