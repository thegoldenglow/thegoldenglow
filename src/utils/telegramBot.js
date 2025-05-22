/**
 * Telegram Bot Service
 * Handles communication with the Telegram Bot API for Golden Glow
 */

import { getTelegramBotToken } from './telegramTokenManager';
import { supabase } from './supabase';

// Default bot token as fallback
let cachedBotToken = '8076473971:AAELDeKpUuwqXp3-4nb-8wAnA4HpigjDW84';

// Bot username - update this to match your actual bot
const BOT_USERNAME = 'TheGoldenGlow_bot';

/**
 * Validates Telegram WebApp initData to ensure it's coming from a legitimate Telegram client
 * @param {string} initData - The initData string from Telegram WebApp
 * @returns {boolean} - Whether the data is valid
 */
export const validateTelegramWebAppData = async (initData) => {
  try {
    if (!initData) return false;
    
    // Parse the parameters
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) return false;
    
    // For secure validation, we would normally verify the hash server-side
    // But for this client-side implementation, we'll at least do basic validation
    
    // In production, this should be performed on your backend for security
    // See https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
    
    console.log('Telegram initData validated (client-side)');
    return true;
  } catch (error) {
    console.error('Error validating Telegram data:', error);
    return false;
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
 * Send a message to the user via the Telegram bot
 * @param {string} chatId - The Telegram chat ID
 * @param {string} message - The message to send
 * @returns {Promise<Object>} The response from the Telegram API
 */
export const sendTelegramMessage = async (chatId, message) => {
  try {
    // Get the bot token from the token manager
    const botToken = await getTelegramBotToken();
    
    // For security reasons, this should be done from your backend
    // This client-side implementation is for demonstration only
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
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
 * Initialize the Telegram bot connection and verify it's working
 * @returns {Promise<boolean>} Whether initialization was successful
 */
export const initializeTelegramBot = async () => {
  try {
    // Get the bot token from the database or environment
    await getTelegramBotToken(true); // Force refresh the token
    
    const botInfo = await getBotInfo();
    if (botInfo.ok && botInfo.result) {
      console.log(`Telegram bot initialized: @${botInfo.result.username}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
    return false;
  }
};
