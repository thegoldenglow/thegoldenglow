/**
 * Migration: Add Telegram Bot Authentication Fields
 * Adds necessary columns to the profiles table to support Telegram bot authentication
 */

import { supabase } from '../utils/supabase';

export const migrateTelegramBotFields = async () => {
  console.log('Running migration: add_telegram_bot_fields');
  
  try {
    // Run a simple query to check if the columns already exist
    const { data: columnsData, error: columnsError } = await supabase
      .rpc('get_column_info', { 
        table_name: 'profiles',
        schema_name: 'public'
      });
      
    if (columnsError) {
      // If RPC function doesn't exist, check using a schema query
      console.warn('RPC method not available, using schema query instead');
      
      // Try to select from the profiles table with the new columns
      // This will help us determine if we need to add them
      const { error: checkError } = await supabase
        .from('profiles')
        .select('bot_authenticated, bot_auth_token, bot_auth_date')
        .limit(1);
        
      if (checkError && checkError.code === '42703') {
        // Column doesn't exist, add it
        console.log('Bot authentication columns do not exist, adding them');
        
        // Add the columns
        const { error: alterError } = await supabase.query(`
          ALTER TABLE profiles 
          ADD COLUMN IF NOT EXISTS bot_authenticated BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS bot_auth_token TEXT,
          ADD COLUMN IF NOT EXISTS bot_auth_date TIMESTAMPTZ;
        `);
        
        if (alterError) {
          console.error('Error adding bot authentication columns:', alterError);
          return { success: false, error: alterError };
        }
        
        console.log('Added bot authentication columns successfully');
      } else {
        // Columns likely exist
        console.log('Bot authentication columns already exist');
      }
    } else {
      // Check if the columns exist in the returned data
      const columns = columnsData || [];
      const botAuthenticatedExists = columns.some(col => col.column_name === 'bot_authenticated');
      const botAuthTokenExists = columns.some(col => col.column_name === 'bot_auth_token');
      const botAuthDateExists = columns.some(col => col.column_name === 'bot_auth_date');
      
      if (!botAuthenticatedExists || !botAuthTokenExists || !botAuthDateExists) {
        // At least one column needs to be added
        console.log('Some bot authentication columns do not exist, adding them');
        
        // Add missing columns
        const { error: alterError } = await supabase.query(`
          ALTER TABLE profiles 
          ADD COLUMN IF NOT EXISTS bot_authenticated BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS bot_auth_token TEXT,
          ADD COLUMN IF NOT EXISTS bot_auth_date TIMESTAMPTZ;
        `);
        
        if (alterError) {
          console.error('Error adding bot authentication columns:', alterError);
          return { success: false, error: alterError };
        }
        
        console.log('Added missing bot authentication columns successfully');
      } else {
        console.log('All bot authentication columns already exist');
      }
    }
    
    // Check if we need to add a Telegram bot token column to app_settings table
    // This allows administrators to update the bot token without changing code
    const { data: settingsExists, error: settingsError } = await supabase
      .from('app_settings')
      .select('id')
      .limit(1);
      
    if (settingsError && settingsError.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating app_settings table');
      
      const { error: createError } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          id SERIAL PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      
      if (createError) {
        console.error('Error creating app_settings table:', createError);
        return { success: false, error: createError };
      }
      
      // Insert the Telegram bot token
      const { error: insertError } = await supabase
        .from('app_settings')
        .insert({
          key: 'telegram_bot_token',
          value: '8076473971:AAELDeKpUuwqXp3-4nb-8wAnA4HpigjDW84'
        });
        
      if (insertError) {
        console.error('Error inserting Telegram bot token:', insertError);
        return { success: false, error: insertError };
      }
      
      console.log('Created app_settings table and added Telegram bot token');
    } else {
      // Table exists, check if the bot token entry exists
      const { data: tokenExists, error: tokenError } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'telegram_bot_token')
        .limit(1);
        
      if (tokenError) {
        console.error('Error checking for Telegram bot token:', tokenError);
      } else if (!tokenExists || tokenExists.length === 0) {
        // Insert the token
        const { error: insertError } = await supabase
          .from('app_settings')
          .insert({
            key: 'telegram_bot_token',
            value: '8076473971:AAELDeKpUuwqXp3-4nb-8wAnA4HpigjDW84'
          });
          
        if (insertError) {
          console.error('Error inserting Telegram bot token:', insertError);
          return { success: false, error: insertError };
        }
        
        console.log('Added Telegram bot token to app_settings');
      } else {
        // Update the token to ensure it's current
        const { error: updateError } = await supabase
          .from('app_settings')
          .update({
            value: '8076473971:AAELDeKpUuwqXp3-4nb-8wAnA4HpigjDW84',
            updated_at: new Date()
          })
          .eq('key', 'telegram_bot_token');
          
        if (updateError) {
          console.error('Error updating Telegram bot token:', updateError);
          return { success: false, error: updateError };
        }
        
        console.log('Updated Telegram bot token in app_settings');
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error };
  }
};

// Run the migration if called directly
if (import.meta.url === import.meta.main) {
  migrateTelegramBotFields()
    .then(result => {
      console.log('Migration result:', result);
    })
    .catch(error => {
      console.error('Migration failed:', error);
    });
}

export default migrateTelegramBotFields;
