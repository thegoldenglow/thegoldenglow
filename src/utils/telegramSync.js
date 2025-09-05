import { supabase, isSupabaseAvailable } from './supabase';
import { validateTelegramWebAppData } from './telegramBot';

/**
 * Synchronizes Telegram user data with Supabase database
 * @param {string} initData - Telegram WebApp initData
 * @returns {Promise<{success: boolean, user: object|null, error: string|null, isNewUser: boolean}>}
 */
export async function syncTelegramUser(initData) {
  try {
    console.log('TelegramSync: Starting user synchronization...');
    
    // Validate Telegram data first
    const validationResult = await validateTelegramWebAppData(initData);
    if (!validationResult.success) {
      console.error('TelegramSync: Invalid Telegram authentication data');
      return {
        success: false,
        user: null,
        error: 'Invalid Telegram authentication data',
        isNewUser: false
      };
    }
    
    // Get user data from validation result or extract from initData
    let tgUser = validationResult.user;
    
    if (!tgUser) {
      // Fallback to extracting from initData
      const urlParams = new URLSearchParams(initData);
      const userParam = urlParams.get('user');
      
      if (!userParam) {
        console.error('TelegramSync: No user data found in initData');
        return {
          success: false,
          user: null,
          error: 'No user data found in Telegram authentication',
          isNewUser: false
        };
      }
      
      tgUser = JSON.parse(decodeURIComponent(userParam));
    }
    
    console.log('TelegramSync: Parsed Telegram user:', {
      ...tgUser,
      isDevelopmentMode: validationResult.isDevelopmentMode
    });

    // If Supabase is not configured/available, skip DB sync and let caller fallback to local user
    if (!isSupabaseAvailable()) {
      console.warn('TelegramSync: Supabase not available; skipping DB sync');
      return {
        success: false,
        user: null,
        error: 'Supabase not configured',
        isNewUser: false
      };
    }
    
    // Attempt to call the sync function (preferred path when backend RPCs are installed)
    let rpcData = null;
    try {
      const { data, error } = await supabase.rpc('sync_telegram_user', {
        p_telegram_id: tgUser.id.toString(),
        p_telegram_username: tgUser.username || null,
        p_telegram_first_name: tgUser.first_name || null,
        p_telegram_last_name: tgUser.last_name || null,
        p_telegram_photo_url: tgUser.photo_url || null,
        p_username: tgUser.username || null,
        p_name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || null
      });

      if (error) {
        throw error;
      }
      rpcData = data;
    } catch (rpcError) {
      // If RPC is missing or fails, try a safe client-side fallback for existing users
      const msg = rpcError?.message || String(rpcError);
      console.warn('TelegramSync: RPC sync_telegram_user failed, attempting fallback if possible:', msg);

      // Try to update an existing Telegram user directly; if none exists, let caller handle local fallback
      const existing = await getTelegramUser(tgUser.id);
      if (existing.success && existing.user) {
        const updatePayload = {
          telegram_username: tgUser.username || null,
          telegram_first_name: tgUser.first_name || null,
          telegram_last_name: tgUser.last_name || null,
          telegram_photo_url: tgUser.photo_url || null,
          user_type: 'telegram_user',
          bot_authenticated: true,
          bot_auth_token: initData,
          // Provide reasonable defaults if schema supports them
          username: tgUser.username || existing.user.username || `user${tgUser.id}`,
          name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || existing.user.name || `User ${tgUser.id}`
        };

        const updateRes = await updateTelegramUser(tgUser.id, updatePayload);
        if (!updateRes.success) {
          return {
            success: false,
            user: null,
            error: updateRes.error || 'Failed to update existing Telegram user',
            isNewUser: false
          };
        }

        // Re-fetch the updated user
        const refreshed = await getTelegramUser(tgUser.id);
        if (refreshed.success && refreshed.user) {
          const userForStorage = {
            ...refreshed.user,
            telegram_first_name: tgUser.first_name || '',
            telegram_last_name: tgUser.last_name || '',
            bot_authenticated: true,
            bot_auth_token: initData,
            avatar_url: refreshed.user.telegram_photo_url || refreshed.user.avatar
          };
          try { localStorage.setItem('gg_user', JSON.stringify(userForStorage)); } catch {}

          return {
            success: true,
            user: refreshed.user,
            error: null,
            isNewUser: false
          };
        }

        return {
          success: false,
          user: null,
          error: 'Updated user could not be retrieved',
          isNewUser: false
        };
      }

      // No existing user found; signal failure so caller can perform local fallback
      return {
        success: false,
        user: null,
        error: 'RPC not available and user does not exist in DB',
        isNewUser: false
      };
    }

    if (!rpcData || rpcData.length === 0) {
      console.error('TelegramSync: No data returned from sync function');
      return {
        success: false,
        user: null,
        error: 'No user data returned from synchronization',
        isNewUser: false
      };
    }
    
    const syncResult = rpcData[0];
    const userData = syncResult.user_data;
    
    console.log('TelegramSync: Sync successful:', {
      userId: syncResult.user_id,
      isNewUser: syncResult.is_new_user,
      userData: userData
    });
    
    // Store user data in localStorage for offline access
    const userForStorage = {
      ...userData,
      telegram_first_name: tgUser.first_name || '',
      telegram_last_name: tgUser.last_name || '',
      bot_authenticated: true,
      bot_auth_token: initData,
      avatar_url: userData.telegram_photo_url || userData.avatar
    };
    
    try { localStorage.setItem('gg_user', JSON.stringify(userForStorage)); } catch {}
    
    return {
      success: true,
      user: userData,
      error: null,
      isNewUser: syncResult.is_new_user
    };
    
  } catch (error) {
    console.error('TelegramSync: Unexpected error during sync:', error);
    return {
      success: false,
      user: null,
      error: `Synchronization failed: ${error.message}`,
      isNewUser: false
    };
  }
}

/**
 * Gets user by Telegram ID from the database
 * @param {string} telegramId - Telegram user ID
 * @returns {Promise<{success: boolean, user: object|null, error: string|null}>}
 */
export async function getTelegramUser(telegramId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', telegramId.toString())
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('TelegramSync: Error fetching user:', error);
      return {
        success: false,
        user: null,
        error: `Failed to fetch user: ${error.message}`
      };
    }
    
    return {
      success: true,
      user: data,
      error: null
    };
    
  } catch (error) {
    console.error('TelegramSync: Unexpected error fetching user:', error);
    return {
      success: false,
      user: null,
      error: `Failed to fetch user: ${error.message}`
    };
  }
}

/**
 * Checks if a Telegram user exists in the database
 * @param {string} telegramId - Telegram user ID
 * @returns {Promise<boolean>}
 */
export async function telegramUserExists(telegramId) {
  const result = await getTelegramUser(telegramId);
  return result.success && result.user !== null;
}

/**
 * Updates Telegram user data in the database
 * @param {string} telegramId - Telegram user ID
 * @param {object} updateData - Data to update
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function updateTelegramUser(telegramId, updateData) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updateData,
        telegram_auth_date: new Date().toISOString()
      })
      .eq('telegram_id', telegramId.toString());
    
    if (error) {
      console.error('TelegramSync: Error updating user:', error);
      return {
        success: false,
        error: `Failed to update user: ${error.message}`
      };
    }
    
    return {
      success: true,
      error: null
    };
    
  } catch (error) {
    console.error('TelegramSync: Unexpected error updating user:', error);
    return {
      success: false,
      error: `Failed to update user: ${error.message}`
    };
  }
}