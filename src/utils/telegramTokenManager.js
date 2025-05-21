/**
 * Telegram Token Manager
 * Handles fetching and refreshing the Telegram bot token from the database
 */

import { supabase } from './supabase';

// Default token from environment in case database is not accessible
const DEFAULT_TOKEN = '8076473971:AAELDeKpUuwqXp3-4nb-8wAnA4HpigjDW84';

// Cache the token to reduce database queries
let cachedToken = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get the Telegram bot token from the database or cache
 * @param {boolean} forceRefresh - Whether to force a refresh from database
 * @returns {Promise<string>} The Telegram bot token
 */
export const getTelegramBotToken = async (forceRefresh = false) => {
  // Return cached token if it's still valid and refresh not forced
  const now = Date.now();
  if (cachedToken && !forceRefresh && now - lastFetchTime < CACHE_DURATION) {
    return cachedToken;
  }
  
  try {
    // Try to fetch token from database
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'telegram_bot_token')
      .single();
      
    if (error) {
      console.warn('Error fetching Telegram bot token from database:', error);
      // If unable to get from database, use default
      return DEFAULT_TOKEN;
    }
    
    // Update cache and return token
    cachedToken = data.value || DEFAULT_TOKEN;
    lastFetchTime = now;
    return cachedToken;
  } catch (error) {
    console.error('Exception getting Telegram bot token:', error);
    return DEFAULT_TOKEN;
  }
};

/**
 * Update the Telegram bot token in the database
 * @param {string} newToken - The new token value
 * @returns {Promise<boolean>} Success status
 */
export const updateTelegramBotToken = async (newToken) => {
  if (!newToken) {
    return { success: false, error: 'No token provided' };
  }
  
  try {
    const { error } = await supabase
      .from('app_settings')
      .update({ 
        value: newToken,
        updated_at: new Date()
      })
      .eq('key', 'telegram_bot_token');
      
    if (error) {
      console.error('Error updating Telegram bot token:', error);
      return { success: false, error };
    }
    
    // Update cache
    cachedToken = newToken;
    lastFetchTime = Date.now();
    
    return { success: true };
  } catch (error) {
    console.error('Exception updating Telegram bot token:', error);
    return { success: false, error };
  }
};

export default {
  getTelegramBotToken,
  updateTelegramBotToken
};
