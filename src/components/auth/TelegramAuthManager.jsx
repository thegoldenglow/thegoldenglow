import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { validateTelegramWebAppData, getTelegramUser, initializeTelegramBot } from '../../utils/telegramBot';
import { syncTelegramUser } from '../../utils/telegramSync';
import { useUser } from '../../contexts/UserContext';

/**
 * TelegramAuthManager component
 * Automatically authenticates users who enter the application via Telegram
 * Should be mounted at the application root level
 */
const TelegramAuthManager = () => {
  console.log('TelegramAuthManager: Component mounted');
  const { updateUserFromLocalStorage, setUserDirectly, processStartParameter } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleTelegramAuth = async () => {
      try {
        console.log('TelegramAuthManager: Checking for Telegram WebApp...');
        
        // Check if Telegram WebApp is available
        if (!window.Telegram?.WebApp) {
          console.log('TelegramAuthManager: No Telegram WebApp available');
          return;
        }
        
        // Get initData from Telegram WebApp
        const initData = window.Telegram.WebApp.initData;
        
        // Check if initData is still not available
        if (!initData) {
          console.log('TelegramAuthManager: No initData available, waiting...');
          setTimeout(handleTelegramAuth, 500);
          return;
        }
        
        // Initialize the Telegram bot
        const botInitialized = await initializeTelegramBot();
        if (!botInitialized) {
          setError('Failed to initialize Telegram bot');
          setIsInitialized(true);
          return;
        }
        
        // Get Telegram user data
        const tgUser = getTelegramUser();
        
        if (!tgUser) {
          setError('No Telegram user data available');
          setIsInitialized(true);
          return;
        }
        
        console.log('TelegramAuthManager: Telegram user found:', {
          id: tgUser.id,
          first_name: tgUser.first_name,
          username: tgUser.username,
          isDevelopment: process.env.NODE_ENV === 'development',
          hasRealTelegramData: !!window.Telegram?.WebApp?.initDataUnsafe?.user
        });
        console.log('TelegramAuthManager: About to validate initData:', initData);
        
        // Validate initData for security
        const validationResult = await validateTelegramWebAppData(initData);
        console.log('TelegramAuthManager: Validation result:', validationResult);
        if (!validationResult.success) {
          console.log('TelegramAuthManager: Validation failed, stopping authentication');
          setError(`Telegram authentication validation failed: ${validationResult.error}`);
          setIsInitialized(true);
          return;
        }
        
        console.log('TelegramAuthManager: Validation passed, proceeding to database synchronization');
        
        // Clear any existing user data from localStorage to prevent conflicts
        // This ensures fresh data from Telegram takes priority
        localStorage.removeItem('gg_user');
        console.log('TelegramAuthManager: Cleared existing localStorage user data');
        
        // Use the new sync utility to handle user creation/update
        const syncResult = await syncTelegramUser(initData);
        
        if (!syncResult.success) {
          console.error('TelegramAuthManager: Sync failed:', syncResult.error);
          console.log('TelegramAuthManager: Falling back to local user creation');
          
          // Fallback: Create a local user when database sync fails
          const localUser = {
            id: tgUser.id,
            name: tgUser.first_name || 'Telegram User',
            telegram_id: tgUser.id,
            telegram_first_name: tgUser.first_name,
            telegram_last_name: tgUser.last_name,
            telegram_username: tgUser.username,
            points: 0,
            level: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Store in localStorage and set user data
          localStorage.setItem('gg_user', JSON.stringify(localUser));
          try {
            const userSetResult = await setUserDirectly(localUser);
            
            if (userSetResult.success) {
              console.log('TelegramAuthManager: Local user created and set successfully');
              setIsAuthenticated(true);
              
              // Process start parameter for referral tracking after successful local user creation
              const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
              if (startParam && processStartParameter) {
                console.log('TelegramAuthManager: Found start parameter for local user, processing referral:', startParam);
                try {
                  await processStartParameter(startParam);
                  console.log('TelegramAuthManager: Start parameter processed successfully for local user');
                } catch (error) {
                  console.error('TelegramAuthManager: Error processing start parameter for local user:', error);
                }
              }
            } else {
              console.error('TelegramAuthManager: Failed to set local user data:', userSetResult.error);
              setError('Failed to create local user');
            }
          } catch (error) {
            console.error('TelegramAuthManager: Error setting local user data:', error);
            setError('Failed to create local user');
          }
          
          setIsInitialized(true);
          return;
        }
        
        console.log('TelegramAuthManager: User synchronized successfully:', {
          isNewUser: syncResult.isNewUser,
          userId: syncResult.user?.id
        });
        
        // Set user data directly from sync result to avoid stale localStorage data
        try {
          const userSetResult = await setUserDirectly(syncResult.user);
          if (userSetResult.success) {
            console.log('TelegramAuthManager: User data set directly from sync result');
            setIsAuthenticated(true);
            
            // Process start parameter for referral tracking after successful authentication
            const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
            if (startParam && processStartParameter) {
              console.log('TelegramAuthManager: Found start parameter, processing referral:', startParam);
              try {
                await processStartParameter(startParam);
                console.log('TelegramAuthManager: Start parameter processed successfully');
              } catch (error) {
                console.error('TelegramAuthManager: Error processing start parameter:', error);
              }
            }
          } else {
            console.error('TelegramAuthManager: Failed to set user data directly:', userSetResult.error);
            // Fallback to localStorage if direct setting fails
            updateUserFromLocalStorage();
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('TelegramAuthManager: Error setting user data directly:', error);
          // Fallback to localStorage if direct setting fails
          updateUserFromLocalStorage();
          setIsAuthenticated(true);
        }
        
        if (syncResult.isNewUser) {
           console.log('TelegramAuthManager: New user created and authenticated');
         } else {
           console.log('TelegramAuthManager: Existing user updated and authenticated');
         }
        
        setIsInitialized(true);
      } catch (err) {
        console.error('TelegramAuthManager: Authentication error:', err);
        setError(`Authentication error: ${err.message}`);
        setIsInitialized(true);
      }
    };

    // Start authentication immediately for Telegram users
    const timer = setTimeout(handleTelegramAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default TelegramAuthManager;
