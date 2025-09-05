import { loadAllUsers } from "./userManager";

/**
 * Admin Data Service - Provides centralized data access for admin components
 * Ensures all admin components display consistent data
 */

// Create a simple event system for updates
const listeners = {
  userUpdate: []
};

// Add a listener for a specific event
export const addListener = (event, callback) => {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event].push(callback);
  return () => removeListener(event, callback); // Return unsubscribe function
};

// Remove a listener
export const removeListener = (event, callback) => {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(cb => cb !== callback);
};

// Notify all listeners of an event
export const notifyListeners = (event, data) => {
  if (!listeners[event]) return;
  listeners[event].forEach(callback => callback(data));
};

// Get user statistics (total, active, new)
export const getUserStats = async () => {
  try {
    // Use the userManager to get all users (both database and local test users)
    const { users, count, error } = await loadAllUsers();
    
    if (error) {
      console.error('Error fetching user stats:', error);
      return {
        total: 0,
        active: 0,
        new: 0
      };
    }
    
    // For active users, we'll consider all users active for now
    // In a real app, you might want to check last login time
    const activeUsers = count;
    
    // For new users, we could look at recently created profiles
    // For this example, we'll use a placeholder calculation
    const newUsers = Math.round(count * 0.05);
    
    return {
      total: count,
      active: activeUsers,
      new: newUsers
    };
  } catch (err) {
    console.error('Error in getUserStats:', err);
    return {
      total: 0,
      active: 0,
      new: 0
    };
  }
};

// Refresh user data and notify all listeners
export const refreshUserData = async () => {
  const userStats = await getUserStats();
  notifyListeners('userUpdate', userStats);
  return userStats;
};
