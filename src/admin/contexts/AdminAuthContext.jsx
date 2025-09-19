import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseAvailable } from '../utils/supabase';

// Create context
const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if admin is already logged in (using localStorage or Supabase)
  useEffect(() => {
    const checkAuth = async () => {
      if (isSupabaseAvailable()) {
        try {
          // First check Supabase session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // Verify if user has admin role in profiles table
            const { data: userData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            if (userData && (userData.user_type === 'admin' || userData.user_type === 'superadmin')) {
              setAdminUser({
                id: userData.id,
                name: userData.name || session.user.email,
                email: session.user.email,
                role: userData.user_type
              });
              setIsAuthenticated(true);
              return;
            }
          }
        } catch (error) {
          console.error('Failed to restore admin session from Supabase:', error);
        }
      }
      
      // Fallback to localStorage (for development/demo)
      try {
        const storedUser = localStorage.getItem('adminUser');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setAdminUser(user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to restore admin session from localStorage:', error);
        // Clear any invalid data
        localStorage.removeItem('adminUser');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    if (isSupabaseAvailable()) {
      // Set up Supabase auth listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            // Check admin status
            const { data: userData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (userData && (userData.user_type === 'admin' || userData.user_type === 'superadmin')) {
              setAdminUser({
                id: userData.id,
                name: userData.name || session.user.email,
                email: session.user.email,
                role: userData.user_type
              });
              setIsAuthenticated(true);
            }
          } else if (event === 'SIGNED_OUT') {
            setAdminUser(null);
            setIsAuthenticated(false);
          }
        }
      );
      
      return () => {
        subscription?.unsubscribe();
      };
    }
  }, []);
  
  // Login function - supports both Supabase auth and demo login
  const login = async (userData) => {
    try {
      if (userData.email && userData.password && isSupabaseAvailable()) {
        // Use Supabase authentication
        const { data, error } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password,
        });
        
        if (error) throw error;
        
        // Check admin status
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();
          
        if (profileError) throw profileError;
        
        if (profileData && (profileData.user_type === 'admin' || profileData.user_type === 'superadmin')) {
          setAdminUser({
            id: profileData.id,
            name: profileData.name || data.user.email,
            email: data.user.email,
            role: profileData.user_type
          });
          setIsAuthenticated(true);
          return true;
        } else {
          // Not an admin
          if (isSupabaseAvailable()) {
            await supabase.auth.signOut();
          }
          throw new Error('Access denied: Admin privileges required');
        }
      } else {
        // For demo purposes - use localStorage
        localStorage.setItem('adminUser', JSON.stringify(userData));
        setAdminUser(userData);
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  // Logout function
  const logout = async () => {
    // Clear localStorage
    localStorage.removeItem('adminUser');
    
    // Sign out from Supabase
    if (isSupabaseAvailable()) {
      await supabase.auth.signOut();
    }
    
    setAdminUser(null);
    setIsAuthenticated(false);
  };
  
  // Context value
  const value = {
    adminUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
  
  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
