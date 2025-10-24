/**
 * Telegram Bot Service
 * Handles communication with the Telegram Bot API for Golden Glow
 */

import { getTelegramBotToken } from './telegramTokenManager';
import { supabase } from './supabase';

// Default bot token as fallback - should be set via environment variable
let cachedBotToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8076473971:AAELDeKpUuwqXp3-4nb-8wAnA4HpigjDW84';

// Bot username - update this to match your actual bot
const BOT_USERNAME = 'TheGoldenGlow_bot';

/**
 * Validates Telegram WebApp data using secure client-side wrapper
 * This calls the proper validation utility that should use server-side validation in production
 * @param {string} initData - The initData from Telegram WebApp
 * @returns {Promise<Object>} - Validation result object
 */
export const validateTelegramWebAppData = async (initData) => {
  try {
    console.log('Validating Telegram WebApp data...');
    
    const { validateTelegramWebAppDataClient } = await import('./telegramValidation.js');
    
    // Use client-side validation (development only)
    const validationResult = validateTelegramWebAppDataClient(initData);
    
    if (validationResult.isValid) {
      console.log('✅ Telegram WebApp data validation successful');
      if (validationResult.isDevelopmentMode) {
        console.log('🔧 Running in development mode with mock data');
      }
      return { 
        success: true, 
        user: validationResult.user,
        authDate: validationResult.authDate,
        isDevelopmentMode: validationResult.isDevelopmentMode || false
      };
    } else {
      console.error('❌ Telegram WebApp data validation failed:', validationResult.error);
      return { success: false, error: validationResult.error || 'Invalid Telegram data' };
    }
  } catch (error) {
    console.error('Error validating Telegram WebApp data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user data from Telegram WebApp
 * @returns {Object|null} The Telegram user data or null if not available
 */
export const getTelegramUser = () => {
  if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  return null;
};

/**
 * Sends a message via Telegram Bot API
 * ⚠️ SECURITY WARNING: This function has been removed from client-side code
 * Telegram bot operations should ONLY be performed on the server-side
 * 
 * To send messages, create a server-side API endpoint that:
 * 1. Validates the user's authentication
 * 2. Uses the bot token stored securely on the server
 * 3. Sends the message via Telegram Bot API
 * 
 * Example server endpoint: POST /api/send-telegram-message
 */
export const sendTelegramMessage = async (chatId, message) => {
  console.error('❌ sendTelegramMessage has been disabled for security reasons');
  console.error('❌ Telegram bot operations must be performed server-side');
  console.error('❌ Please implement a server-side API endpoint for sending messages');
  
  // In production, call your server endpoint instead:
  // const response = await fetch('/api/send-telegram-message', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ chatId, message })
  // });
  
  return false;
};

/**
 * Get info about the bot
 * @returns {Promise<Object>} Bot information
 */
export const getBotInfo = async () => {
  try {
    // Get the bot token from the token manager
    const botToken = await getTelegramBotToken();
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();
    
    // Cache the token for future use
    if (data && data.ok) {
      cachedBotToken = botToken;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting bot info:', error);
    throw error;
  }
};

/**
 * Generate a unique referral code for a user
 * @param {string} userId - The user's ID
 * @returns {string} A unique referral code
 */
export const generateReferralCode = (userId) => {
  // Create a unique code based on userId and a timestamp
  const timestamp = Date.now().toString(36);
  const userPart = userId.toString().slice(-4);
  const randomPart = Math.random().toString(36).substring(2, 5);
  
  return `${userPart}${timestamp.slice(-3)}${randomPart}`.toUpperCase();
};

/**
 * Get a user's referral code from database or generate a new one
 * @param {string} userId - The user's ID
 * @returns {Promise<string>} The referral code
 */
export const getUserReferralCode = async (userId) => {
  try {
    // Validate if userId is a proper UUID format
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    // If not a valid UUID, just generate a code without database lookup
    if (!isValidUUID) {
      console.log(`Non-UUID user ID provided (${userId}), generating code without database storage`);
      return generateReferralCode(userId);
    }
    
    // Check if user already has a referral code
    const { data, error } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching referral code:', error);
      // On database errors, still provide a working code
      return generateReferralCode(userId);
    }
    
    if (data?.code) {
      return data.code;
    }
    
    // Generate a new code
    const newCode = generateReferralCode(userId);
    
    try {
      // Store the new code
      const { error: insertError } = await supabase
        .from('referral_codes')
        .insert({
          user_id: userId,
          code: newCode,
          created_at: new Date().toISOString(),
          total_referrals: 0
        });
        
      if (insertError) {
        console.error('Error saving referral code:', insertError);
      }
    } catch (dbError) {
      console.error('Database error while saving referral code:', dbError);
      // Continue anyway with the generated code
    }
    
    return newCode;
  } catch (error) {
    console.error('Error in getUserReferralCode:', error);
    // Return a fallback code if we can't get one from the database
    return generateReferralCode(userId);
  }
};

/**
 * Track a referral when a user joins via a referral code
 * @param {string} referralCode - The referral code used
 * @param {string} newUserId - The new user's ID
 * @returns {Promise<Object>} The referrer's information
 */
export const trackReferral = async (referralCode, newUserId) => {
  try {
    // Validate if IDs are proper UUID format
    const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // For non-UUID new user IDs, provide a fallback response
    if (!isValidUUID(newUserId)) {
      console.log(`Cannot track referral: Non-UUID user ID provided (${newUserId})`);
      return {
        success: false,
        message: 'Invalid user ID format for database storage',
        inMemory: true
      };
    }
    
    // Find the referrer based on the code
    const { data: referrerData, error: referrerError } = await supabase
      .from('referral_codes')
      .select('user_id, total_referrals')
      .eq('code', referralCode)
      .single();
      
    if (referrerError || !referrerData) {
      console.error('Referral code not found:', referralCode);
      return {
        success: false,
        message: 'Referral code not found',
        code: referralCode
      };
    }
    
    // Check if this referral already exists
    try {
      const { data: existingReferral, error: existingError } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', referrerData.user_id)
        .eq('referred_id', newUserId)
        .single();
        
      if (existingReferral) {
        console.log('Referral already recorded');
        return {
          success: true,
          message: 'Referral already recorded',
          referrerData
        };
      }
    } catch (checkError) {
      console.error('Error checking existing referral:', checkError);
      // Continue with the process anyway
    }
    
    // Record the referral
    try {
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerData.user_id,
          referred_id: newUserId,
          code_used: referralCode,
          created_at: new Date().toISOString(),
          reward_claimed: false,
          points_awarded: 0
        });
        
      if (referralError) {
        console.error('Error recording referral:', referralError);
        // Continue with updating the count anyway
      }
    } catch (insertError) {
      console.error('Exception while recording referral:', insertError);
      // Continue with updating the count anyway
    }
    
    // Update the total referrals count
    try {
      const { error: updateError } = await supabase
        .from('referral_codes')
        .update({
          total_referrals: (referrerData.total_referrals || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('user_id', referrerData.user_id);
        
      if (updateError) {
        console.error('Error updating referral count:', updateError);
      }
    } catch (updateError) {
      console.error('Exception while updating referral count:', updateError);
    }
    
    return {
      success: true,
      message: 'Referral tracked successfully',
      referrerData
    };
  } catch (error) {
    console.error('Error tracking referral:', error);
    return null;
  }
};

/**
 * Generate a Telegram bot referral link with the user's referral code
 * @param {string} userId - The user's ID
 * @returns {Promise<string>} The referral link
 */
export const generateTelegramBotReferralLink = async (userId) => {
  try {
    const referralCode = await getUserReferralCode(userId);
    return `https://t.me/${BOT_USERNAME}?start=${referralCode}`;
  } catch (error) {
    console.error('Error generating Telegram referral link:', error);
    return `https://t.me/${BOT_USERNAME}`;
  }
};

/**
 * Parse a start parameter from a Telegram deep link
 * @param {string} startParam - The start parameter
 * @returns {Promise<Object>} Information about the referral code
 */
export const parseReferralStartParam = async (startParam) => {
  if (!startParam) return null;
  
  try {
    // Check if the start parameter is a referral code
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('user_id, code, total_referrals, created_at')
        .eq('code', startParam)
        .single();
        
      if (error || !data) {
        console.log('Not a valid referral code in database:', startParam);
        // Fall back to extracting user ID from the code pattern
        const possibleUserId = startParam.substring(0, 4);
        return {
          referrerUserId: possibleUserId,
          referralCode: startParam,
          totalReferrals: 0,
          fromFallback: true
        };
      }
      
      return {
        referrerUserId: data.user_id,
        referralCode: data.code,
        totalReferrals: data.total_referrals,
        fromDatabase: true
      };
    } catch (dbError) {
      console.error('Database error while parsing referral code:', dbError);
      // Fall back to extracting user ID from the code pattern
      const possibleUserId = startParam.substring(0, 4);
      return {
        referrerUserId: possibleUserId,
        referralCode: startParam,
        totalReferrals: 0,
        fromFallback: true
      };
    }
  } catch (error) {
    console.error('Error parsing referral code:', error);
    return null;
  }
};

/**
 * Initialize the Telegram bot and verify it's working
 * @returns {Promise<boolean>} Whether the bot was successfully initialized
 */
export const initializeTelegramBot = async () => {
  try {
    // Get the bot token from the database or environment
    const token = await getTelegramBotToken(true); // Force refresh the token
    
    // If no token is available, skip bot initialization but allow authentication to continue
    if (!token || token === 'YOUR_BOT_TOKEN_HERE') {
      console.warn('Telegram bot token not configured, skipping bot initialization');
      return true; // Return true to allow authentication to continue
    }
    
    try {
      const botInfo = await getBotInfo();
      if (botInfo.ok && botInfo.result) {
        console.log(`Telegram bot initialized: @${botInfo.result.username}`);
        return true;
      }
    } catch (botError) {
      console.warn('Bot info fetch failed, but allowing authentication to continue:', botError);
    }
    
    return true; // Always return true to allow authentication to continue
  } catch (error) {
    console.warn('Failed to initialize Telegram bot, but allowing authentication to continue:', error);
    return true; // Return true to allow authentication to continue even if bot init fails
  }
};
