import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { validateTelegramWebAppData, getTelegramUser, initializeTelegramBot } from '../../utils/telegramBot';

/**
 * TelegramAuthManager component
 * Automatically authenticates users who enter the application via Telegram
 * Should be mounted at the application root level
 */
const TelegramAuthManager = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleTelegramAuth = async () => {
      try {
        console.log('TelegramAuthManager: Checking for Telegram WebApp...');
        
        // Check if we're running in a Telegram WebApp
        if (!window.Telegram?.WebApp) {
          console.log('TelegramAuthManager: Not running in Telegram WebApp');
          setIsInitialized(true);
          return;
        }
        
        // Initialize the Telegram bot
        const botInitialized = await initializeTelegramBot();
        if (!botInitialized) {
          setError('Failed to initialize Telegram bot');
          setIsInitialized(true);
          return;
        }
        
        // Get and validate Telegram data
        const initData = window.Telegram.WebApp.initData;
        const tgUser = getTelegramUser();
        
        if (!tgUser) {
          setError('No Telegram user data available');
          setIsInitialized(true);
          return;
        }
        
        console.log('TelegramAuthManager: Telegram user found', tgUser.first_name);
        
        // Validate initData for security
        const isValid = await validateTelegramWebAppData(initData);
        if (!isValid) {
          setError('Invalid Telegram authentication data');
          setIsInitialized(true);
          return;
        }
        
        // Get the telegram_id and check if user exists in database
        const telegramId = tgUser.id.toString();
        const { data: existingUser, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('telegram_id', telegramId)
          .single();
        
        // Get Telegram profile photo if available
        const photoUrl = tgUser.photo_url || null;
        
        if (fetchError && fetchError.code === 'PGRST116') {
          // User doesn't exist, create a new profile
          const newUser = {
            id: crypto.randomUUID(), // Generate a unique UUID
            username: tgUser.username || `user${tgUser.id}`,
            bio: '',
            telegram_id: telegramId,
            telegram_username: tgUser.username || null,
            telegram_first_name: tgUser.first_name || '',
            telegram_last_name: tgUser.last_name || '',
            telegram_photo_url: photoUrl,
            avatar_url: photoUrl,
            user_type: 'telegram_user', // Use the existing field name
            telegram_auth_date: new Date().toISOString(),
            bot_authenticated: true,
            bot_auth_token: initData || '',
            points: 0,
            created_at: new Date().toISOString()
          };
          
          // Only include fields that actually exist in the profiles table
          const dbUser = {
            id: newUser.id,
            username: newUser.username,
            bio: newUser.bio,
            telegram_id: newUser.telegram_id,
            telegram_username: newUser.telegram_username,
            telegram_first_name: newUser.telegram_first_name,
            telegram_last_name: newUser.telegram_last_name,
            telegram_photo_url: newUser.telegram_photo_url,
            avatar_url: newUser.avatar_url,
            user_type: newUser.user_type,
            points: newUser.points,
            created_at: newUser.created_at
          };
          
          // Create the user in Supabase
          const { error: insertError } = await supabase
            .from('profiles')
            .insert(dbUser);
            
          if (insertError) {
            console.error('TelegramAuthManager: Error creating user:', insertError);
            setError('Failed to create user profile');
          } else {
            console.log('TelegramAuthManager: Created new user in database');
            
            // Also save in localStorage for the dual storage approach
            localStorage.setItem('gg_user', JSON.stringify(newUser));
            setIsAuthenticated(true);
          }
        } else if (existingUser) {
          // User exists, update with latest Telegram data
          const updatedUser = {
            ...existingUser,
            telegram_username: tgUser.username || existingUser.telegram_username,
            telegram_first_name: tgUser.first_name || existingUser.telegram_first_name,
            telegram_last_name: tgUser.last_name || existingUser.telegram_last_name,
            telegram_photo_url: photoUrl || existingUser.telegram_photo_url,
            telegram_auth_date: new Date().toISOString(),
            bot_authenticated: true,
            bot_auth_token: initData || existingUser.bot_auth_token || '',
            avatar_url: photoUrl || existingUser.avatar_url
          };
          
          // Prepare update object with only fields that exist in the database
          const updateFields = {
            telegram_username: updatedUser.telegram_username,
            telegram_first_name: updatedUser.telegram_first_name,
            telegram_last_name: updatedUser.telegram_last_name,
            telegram_photo_url: updatedUser.telegram_photo_url,
            avatar_url: updatedUser.avatar_url
          };
          
          // Only add these fields if they were added in the migration
          try {
            const { error: columnCheckError } = await supabase
              .from('profiles')
              .select('bot_authenticated')
              .limit(1);
            
            // If the column check doesn't error, add these fields
            if (!columnCheckError) {
              updateFields.bot_authenticated = true;
              updateFields.telegram_auth_date = new Date().toISOString();
            }
          } catch (e) {
            console.warn('Some columns may not exist yet:', e);
          }
          
          // Update the user in Supabase
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updateFields)
            .eq('telegram_id', telegramId);
            
          if (updateError) {
            console.error('TelegramAuthManager: Error updating user:', updateError);
            setError('Failed to update user profile');
          } else {
            console.log('TelegramAuthManager: Updated existing user in database');
            
            // Save the updated user data in localStorage
            localStorage.setItem('gg_user', JSON.stringify(updatedUser));
            setIsAuthenticated(true);
          }
        } else if (fetchError) {
          console.error('TelegramAuthManager: Error fetching user:', fetchError);
          setError('Failed to check user profile');
        }
        
        setIsInitialized(true);
      } catch (err) {
        console.error('TelegramAuthManager: Authentication error:', err);
        setError(`Authentication error: ${err.message}`);
        setIsInitialized(true);
      }
    };

    // Add a small delay to ensure Telegram WebApp is fully initialized
    const timer = setTimeout(handleTelegramAuth, 1000);
    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default TelegramAuthManager;
