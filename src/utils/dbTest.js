/**
 * Database Testing Utility
 * This file provides direct database access for testing purposes
 */
import { supabase } from './supabase';

/**
 * Insert or update a test user
 * @returns {Promise<Object>} Result of the operation
 */
export const insertTestUser = async () => {
  try {
    console.log('Attempting to insert test user directly...');
    
    // First check if test_user1 exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', 'test_user1')
      .single();
      
    if (existingUser) {
      console.log('Test user exists, updating:', existingUser.id);
      const { data, error } = await supabase
        .from('profiles')
        .update({
          points: 150, // Increment points to verify update
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select();
        
      if (error) throw error;
      return { success: true, action: 'updated', data };
    } else {
      // Insert new test user
      console.log('Creating new test user');
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          username: 'test_user1',
          points: 100,
          created_at: new Date().toISOString()
        })
        .select();
        
      if (error) throw error;
      return { success: true, action: 'inserted', data };
    }
  } catch (error) {
    console.error('Error in test user operation:', error);
    return { success: false, error };
  }
};

/**
 * Fetch all profiles from the database
 * @returns {Promise<Array>} All profiles
 */
export const getAllProfiles = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return { success: false, error };
  }
};

/**
 * Direct update of profile by username (fallback method)
 * @param {string} currentUsername - Current username to find by
 * @param {string} newUsername - New username to set
 * @returns {Promise<Object>} Result of the operation
 */
export const directUsernameUpdate = async (currentUsername, newUsername) => {
  try {
    console.log(`Directly updating username from "${currentUsername}" to "${newUsername}"`);
    
    // Find the user
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', currentUsername)
      .single();
      
    if (!existingUser) {
      console.log('User not found, creating new profile');
      // Create new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          username: newUsername,
          points: 0,
          created_at: new Date().toISOString()
        })
        .select();
        
      if (error) throw error;
      return { success: true, action: 'created', data };
    }
    
    // Update existing profile
    console.log('Updating existing profile:', existingUser.id);
    const { data, error } = await supabase
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', existingUser.id)
      .select();
      
    if (error) throw error;
    return { success: true, action: 'updated', data };
  } catch (error) {
    console.error('Error in direct username update:', error);
    return { success: false, error: error.message };
  }
};
