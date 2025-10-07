import React, { createContext, useState, useContext } from 'react';

// Create context
const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState({ id: 'anonymous', name: 'Admin', email: '', role: 'admin' });
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Login disabled; always allow access
  const login = async () => true;
  
  // Logout function
  const logout = async () => {
    // No-op logout since authentication is disabled
    setAdminUser({ id: 'anonymous', name: 'Admin', email: '', role: 'admin' });
    setIsAuthenticated(true);
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
