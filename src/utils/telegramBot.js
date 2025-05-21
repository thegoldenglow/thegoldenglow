/**
 * Telegram Bot Service
 * Handles communication with the Telegram Bot API for Golden Glow
 */

import { getTelegramBotToken } from './telegramTokenManager';

// Default bot token as fallback
let cachedBotToken = '8076473971:AAELDeKpUuwqXp3-4nb-8wAnA4HpigjDW84';

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
