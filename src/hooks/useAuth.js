import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

/**
 * Hook for managing authentication state and operations
 * 
 * @returns {Object} Auth methods and state
 */
const useAuth = () => {
  const { 
    isAuthenticated, 
    loading, 
    user, 
    error, 
    telegramData,
    login, 
    logout, 
    updateUserPoints: contextUpdateUserPoints, 
    updateUserStats 
  } = useUser();
  
  const [authInitialized, setAuthInitialized] = useState(false);
  
  // Check if Telegram auth is available
  const isTelegramAvailable = () => {
    return window.Telegram && window.Telegram.WebApp;
  };
  
  // Initialize authentication
  useEffect(() => {
    if (!authInitialized && !loading) {
      setAuthInitialized(true);
    }
  }, [loading, authInitialized]);
  
  // Handle user profile updates
  const updateUserProfile = async (profileData) => {
    try {
      // In a real implementation, this would send the update to backend
      // For now, just update local state
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      updateUserStats(profileData);
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };
  
  // Handle user points update
  const updateUserPoints = async (pointsToAdd) => {
    try {
      if (user) {
        // Calculate what the new points total would be
        const expectedNewTotal = user.points + pointsToAdd;
        
        // Prepare the progress data
        const currentProgress = user.progress || {};
        
        // Instead of calling contextUpdateUserPoints followed by updateUserStats,
        // we'll update the user data directly with a single update
        if (contextUpdateUserPoints) {
          // This will update user.points directly
          await contextUpdateUserPoints(pointsToAdd, {
            // Pass the progress data to be updated in the same operation
            progress: {
              ...currentProgress,
              wisdomPoints: expectedNewTotal
            }
          });
        }
        
        // Return the expected new total points
        return { success: true, newTotal: expectedNewTotal };
      }
      return { success: false, error: 'User not found for points update in useAuth' };
    } catch (error) {
      console.error('Error in useAuth updateUserPoints:', error, 'Stack:', error.stack, 'JSON:', JSON.stringify(error));
      return { success: false, error: error.message };
    }
  };
  
  // Handle level update
  const updateUserLevel = async (newLevel) => {
    try {
      // In a real implementation, this would send the update to backend
      // For now, just update local state
      if (user) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
        await updateUserStats({
          level: newLevel,
          progress: {
            ...user.progress,
            level: newLevel
          }
        });
        return { success: true, level: newLevel };
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Error updating level:', error);
      return { success: false, error: error.message };
    }
  };
  
  return {
    isAuthenticated,
    loading,
    user,
    error,
    telegramData,
    login,
    logout,
    updateUserProfile,
    updateUserPoints,
    updateUserLevel,
    isTelegramAvailable,
    authInitialized
  };
};

export default useAuth;