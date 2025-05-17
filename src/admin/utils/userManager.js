import { supabase } from './supabase';

/**
 * UserManager - Utilities for user management that work with both database and local storage
 * Implements the dual storage approach for Golden Glow where points are stored in:
 * 1. The 'profiles' table in Supabase (column: 'points')
 * 2. Local storage as backup ('gg_user' key)
 */

// Load users from both database and local storage
export const loadAllUsers = async (searchTerm = '') => {
  try {
    // Load local test users first
    const localUsers = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('gg_user_')) {
          const userData = JSON.parse(localStorage.getItem(key));
          if (userData) {
            // Skip if doesn't match search term
            if (searchTerm && 
                !userData.username?.toLowerCase().includes(searchTerm.toLowerCase())) {
              continue;
            }
            localUsers.push({
              ...userData,
              is_test_user: true
            });
          }
        }
      }
      console.log('Found local test users:', localUsers.length);
    } catch (localErr) {
      console.warn('Error loading local test users:', localErr);
    }
    
    // Then get users from the database
    let query = supabase.from('profiles').select();
    
    if (searchTerm) {
      query = query.ilike('username', `%${searchTerm}%`);
    }
    
    const { data: dbUsers, error: usersError } = await query;
    
    if (usersError) {
      console.error('Database query error:', usersError);
      throw usersError;
    }
    
    console.log('Database users found:', dbUsers?.length || 0);
    
    // Combine database users with local test users
    const allUsers = [
      ...(dbUsers || []).map(user => ({
        id: user.id,
        username: user.username || 'Unknown',
        points: user.points || 0,
        role: user.user_type || 'user',
        status: 'active', // Default status
        created_at: user.created_at || new Date().toISOString(),
        is_db_user: true, // Mark as database user
        // Include Telegram data
        telegram_id: user.telegram_id,
        telegram_username: user.telegram_username,
        telegram_first_name: user.telegram_first_name,
        telegram_last_name: user.telegram_last_name,
        telegram_photo_url: user.telegram_photo_url,
        avatar_url: user.avatar_url || user.telegram_photo_url,
        bio: user.bio
      })),
      ...localUsers
    ];
    
    // Sort by points (highest first)
    allUsers.sort((a, b) => (b.points || 0) - (a.points || 0));
    
    return {
      users: allUsers,
      count: allUsers.length,
      error: null
    };
  } catch (err) {
    console.error('Error fetching users:', err);
    return {
      users: [],
      count: 0,
      error: err.message
    };
  }
};

// Create a real user (stored in Supabase database)
export const createRealUser = async (userData) => {
  try {
    if (!userData.username) {
      throw new Error('Username is required');
    }
    
    // Create user in Supabase database
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          username: userData.username,
          bio: userData.bio || `${userData.username}'s profile`,
          points: parseInt(userData.points) || 0,
          user_type: userData.role || 'regular',
          avatar_url: userData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username)}&background=0D47A1&color=fff`,
          created_at: new Date().toISOString()
        }
      ])
      .select();
      
    if (error) throw error;
    
    // Also store in local storage as backup (as per Golden Glow's dual storage approach)
    if (data && data[0]) {
      const newUser = data[0];
      localStorage.setItem('gg_user', JSON.stringify(newUser));
    }
    
    return {
      user: data?.[0] || null,
      error: null
    };
  } catch (err) {
    console.error('Error creating real user:', err);
    return {
      user: null,
      error: err.message
    };
  }
};

// Create a test user (stored in local storage only)
export const createTestUser = async (userData) => {
  try {
    if (!userData.username) {
      throw new Error('Username is required');
    }
    
    // Generate a unique ID for the local user
    const testUserId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create the user object
    const newUser = {
      id: testUserId,
      username: userData.username,
      name: userData.name || userData.username,
      points: parseInt(userData.points) || 0,
      role: userData.role || 'user',
      status: userData.status || 'active',
      created_at: new Date().toISOString(),
      is_test_user: true
    };
    
    // Store in local storage (as described in system memory)
    localStorage.setItem(`gg_user_${testUserId}`, JSON.stringify(newUser));
    
    return {
      user: newUser,
      error: null
    };
  } catch (err) {
    console.error('Error creating test user:', err);
    return {
      user: null,
      error: err.message
    };
  }
};

// Update user points (for both database and local storage users)
export const updateUserPoints = async (userId, points) => {
  try {
    // Ensure points is a valid integer
    const pointsValue = parseInt(points, 10);
    if (isNaN(pointsValue)) {
      throw new Error('Points must be a valid number');
    }
    
    // Check if this is a local test user
    if (userId.toString().startsWith('test_')) {
      // Update local storage user
      const key = `gg_user_${userId}`;
      const userData = localStorage.getItem(key);
      
      if (!userData) {
        throw new Error('User not found in local storage');
      }
      
      const user = JSON.parse(userData);
      user.points = pointsValue;
      
      localStorage.setItem(key, JSON.stringify(user));
      console.log('Updated local test user points');
      
      return {
        success: true,
        error: null
      };
    } else {
      // Update database user
      
      // Try to use Supabase MCP server if available
      let updateSuccess = false;
      
      if (window.mcpServers?.['supabase-mcp-server']?.functions?.updateUserPoints) {
        try {
          console.log('Using Supabase MCP server for points update');
          const result = await window.mcpServers['supabase-mcp-server'].functions.updateUserPoints(userId, pointsValue);
          
          if (result && !result.error) {
            updateSuccess = true;
            console.log('Points updated via MCP server successfully');
          } else {
            console.warn('MCP server update failed:', result?.error);
          }
        } catch (mcpError) {
          console.warn('MCP server points update error:', mcpError);
        }
      }
      
      // Fallback to direct Supabase update if MCP update failed or isn't available
      if (!updateSuccess) {
        console.log('Falling back to direct Supabase update');
        const { error } = await supabase
          .from('profiles')
          .update({ points: pointsValue })
          .eq('id', userId);
        
        if (error) {
          throw error;
        }
      }
      
      // Also update in local storage if present (dual storage approach)
      try {
        const userDataString = localStorage.getItem('gg_user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          if (userData.id === userId) {
            userData.points = pointsValue;
            localStorage.setItem('gg_user', JSON.stringify(userData));
            console.log('Updated local storage points backup');
          }
        }
      } catch (e) {
        console.warn('Could not update local storage:', e);
      }
      
      return {
        success: true,
        error: null
      };
    }
  } catch (err) {
    console.error('Error updating user points:', err);
    return {
      success: false,
      error: err.message
    };
  }
};
