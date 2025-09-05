/**
 * Telegram InitData Validation Utility
 * Implements proper HMAC-SHA256 validation for Telegram Mini App authentication
 * This should be used server-side for security
 */

// Use Web Crypto API for browser compatibility
// Note: This validation should ideally be done server-side for security

/**
 * Creates HMAC-SHA256 hash using Web Crypto API
 * @param {string} key - The key for HMAC
 * @param {string} data - The data to hash
 * @returns {Promise<ArrayBuffer>} - The HMAC hash as ArrayBuffer
 */
async function createHmacSha256(key, data) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  return await crypto.subtle.sign('HMAC', cryptoKey, messageData);
}

/**
 * Creates HMAC-SHA256 hash and returns as hex string
 * @param {ArrayBuffer} key - The key for HMAC as ArrayBuffer
 * @param {string} data - The data to hash
 * @returns {Promise<string>} - The HMAC hash as hex string
 */
async function createHmacSha256Hex(key, data) {
  const encoder = new TextEncoder();
  const messageData = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates Telegram WebApp initData using proper cryptographic verification
 * @param {string} initData - The initData string from Telegram WebApp
 * @param {string} botToken - The Telegram bot token
 * @param {number} maxAge - Maximum age of the auth data in seconds (default: 86400 = 24 hours)
 * @returns {Promise<Object>} - Validation result with success status and parsed data
 */
export const validateTelegramInitData = async (initData, botToken, maxAge = 86400) => {
  try {
    if (!initData || !botToken) {
      return {
        valid: false,
        error: 'Missing initData or botToken',
        data: null
      };
    }

    // Parse the initData as URL parameters
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      return {
        valid: false,
        error: 'Missing hash in initData',
        data: null
      };
    }

    // Remove hash from parameters for validation
    urlParams.delete('hash');
    
    // Check auth_date for expiry
    const authDate = urlParams.get('auth_date');
    if (authDate) {
      const authTimestamp = parseInt(authDate);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      
      if (currentTimestamp - authTimestamp > maxAge) {
        return {
          valid: false,
          error: 'InitData has expired',
          data: null
        };
      }
    }
    
    // Sort parameters alphabetically and create data check string
    const dataCheckArray = [];
    for (const [key, value] of urlParams.entries()) {
      dataCheckArray.push(`${key}=${value}`);
    }
    dataCheckArray.sort();
    const dataCheckString = dataCheckArray.join('\n');
    
    // Create secret key using HMAC-SHA256 with "WebAppData" and bot token
    const secretKey = await createHmacSha256('WebAppData', botToken);
    
    // Create hash using the secret key and data check string
    const calculatedHash = await createHmacSha256Hex(secretKey, dataCheckString);
    
    // Compare calculated hash with provided hash
    const isValid = calculatedHash === hash;
    
    if (!isValid) {
      return {
        valid: false,
        error: 'Hash validation failed',
        data: null
      };
    }

    // Parse user data if validation passed
    const userData = urlParams.get('user');
    let parsedUser = null;
    
    if (userData) {
      try {
        parsedUser = JSON.parse(decodeURIComponent(userData));
      } catch (e) {
        return {
          valid: false,
          error: 'Invalid user data format',
          data: null
        };
      }
    }

    return {
      valid: true,
      error: null,
      data: {
        user: parsedUser,
        authDate: authDate ? parseInt(authDate) : null,
        queryId: urlParams.get('query_id'),
        chatType: urlParams.get('chat_type'),
        chatInstance: urlParams.get('chat_instance'),
        startParam: urlParams.get('start_param')
      }
    };
    
  } catch (error) {
    return {
      valid: false,
      error: `Validation error: ${error.message}`,
      data: null
    };
  }
};

/**
 * Client-side validation wrapper (for development only)
 * In production, this should always call a server endpoint
 * @param {string} initData - The initData string from Telegram WebApp
 * @returns {Object} - Validation result with user data
 */
export const validateTelegramWebAppDataClient = (initData) => {
  console.warn('⚠️ CLIENT-SIDE VALIDATION - FOR DEVELOPMENT ONLY!');
  console.warn('⚠️ NEVER USE IN PRODUCTION - MOVE TO SERVER!');
  
  if (!initData) {
    console.error('No initData provided');
    return { isValid: false, error: 'No initData provided' };
  }

  // Check if this is mock data for development
  if (initData.includes('mock_hash_for_development')) {
    console.log('🔧 Development mode: Using mock Telegram data');
    
    const params = new URLSearchParams(initData);
    const user = params.get('user');
    const authDate = params.get('auth_date');
    
    if (!user || !authDate) {
      return { isValid: false, error: 'Invalid mock data format' };
    }
    
    try {
      const userData = JSON.parse(decodeURIComponent(user));
      return {
        isValid: true,
        user: userData,
        authDate: parseInt(authDate),
        isDevelopmentMode: true
      };
    } catch (error) {
      console.error('Failed to parse mock user data:', error);
      return { isValid: false, error: 'Invalid mock user data format' };
    }
  }

  // Basic checks for real Telegram data
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  const authDate = params.get('auth_date');
  const user = params.get('user');

  if (!hash) {
    console.error('No hash in initData');
    return { isValid: false, error: 'No hash provided' };
  }

  if (!authDate) {
    console.error('No auth_date in initData');
    return { isValid: false, error: 'No auth_date provided' };
  }

  if (!user) {
    console.error('No user in initData');
    return { isValid: false, error: 'No user data provided' };
  }

  // Check if auth_date is not too old (24 hours)
  const authTimestamp = parseInt(authDate);
  const now = Math.floor(Date.now() / 1000);
  const maxAge = 24 * 60 * 60; // 24 hours in seconds

  if (now - authTimestamp > maxAge) {
    console.error('Auth data is too old');
    return { isValid: false, error: 'Auth data expired' };
  }

  // For development, we'll do basic validation
  // In production, this should call /api/validate-telegram-auth
  console.log('⚠️ Using client-side validation for development');
  console.log('⚠️ Remember to implement server-side validation for production!');
  
  try {
    const userData = JSON.parse(decodeURIComponent(user));
    return {
      isValid: true,
      user: userData,
      authDate: authTimestamp
    };
  } catch (error) {
    console.error('Failed to parse user data:', error);
    return { isValid: false, error: 'Invalid user data format' };
  }
};

/**
 * Extract user data from initData without validation
 * Use only after successful validation
 * @param {string} initData - The initData string from Telegram WebApp
 * @returns {Object|null} - Parsed user data or null
 */
export const extractUserFromInitData = (initData) => {
  try {
    const urlParams = new URLSearchParams(initData);
    const userData = urlParams.get('user');
    
    if (!userData) {
      return null;
    }
    
    return JSON.parse(decodeURIComponent(userData));
  } catch (error) {
    console.error('Error extracting user data:', error);
    return null;
  }
};