import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import WalletAuthButton from '../auth/WalletAuthButton';

/**
 * LoginPage component
 * Provides a dedicated page for wallet authentication
 */
const LoginPage = () => {
  const { user, isAuthenticated } = useUser();
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-deepLapis/30 rounded-xl border border-royalGold/30 backdrop-blur-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-royalGold">Welcome to Golden Glow</h1>
          <p className="mt-2 text-white/70">Connect your wallet to continue</p>
        </div>
        
        <WalletAuthButton />
        
        <div className="mt-4 text-center">
          <p className="text-white/50 text-sm">
            Or continue as a <button 
              className="text-royalGold underline" 
              onClick={() => { 
                // Properly redirect to homepage as anonymous user
                localStorage.removeItem('gg_user'); // Clear any existing user data
                localStorage.setItem('gg_guest_mode', 'true'); // Set guest mode flag
                window.location.href = '/'; // Direct redirect to homepage
              }}
            >
              Guest
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
