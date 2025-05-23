import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '../../utils/supabase';
import { useUser } from '../../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import UsernameSelectorModal from './UsernameSelectorModal';

/**
 * WalletAuthManager component
 * Automatically authenticates users who connect their crypto wallets
 * Should be mounted at the application root level
 */
const WalletAuthManager = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [defaultUsername, setDefaultUsername] = useState('');
  
  // Get access to user context and navigation
  const userContext = useUser();
  const navigate = useNavigate();
  
  // We'll use these methods from userContext later
  // Instead of directly setting the user state, we'll use the login/update methods
  
  // Web3Modal (Trust and EVM wallets)
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  
  // Phantom (Solana)
  const { publicKey: solanaPublicKey, connected: isSolanaConnected } = useWallet();
  
  // Proton wallet state
  const [protonAddress, setProtonAddress] = useState(null);
  const [isProtonConnected, setIsProtonConnected] = useState(false);
  
  // We'll add Tonkeeper support later
  // For now, TON wallets are not supported
  
  // Listen for Proton wallet connection events
  useEffect(() => {
    const handleProtonConnection = (event) => {
      console.log('Proton wallet connected event received:', event.detail);
      setProtonAddress(event.detail.address);
      setIsProtonConnected(true);
    };
    
    window.addEventListener('protonWalletConnected', handleProtonConnection);
    
    return () => {
      window.removeEventListener('protonWalletConnected', handleProtonConnection);
    };
  }, []);
  
  // Handle authentication logic for connected wallets
  useEffect(() => {
    const handleWalletAuth = async () => {
      try {
        // Check if user is already authenticated via localStorage
        const storedUser = localStorage.getItem('gg_user');
        if (storedUser) {
          console.log('WalletAuthManager: User already authenticated via localStorage');
          setIsInitialized(true);
          setIsAuthenticated(true);
          
          // FIXED: Update UserContext with the stored user data and redirect to homepage
          if (userContext && userContext.updateUserFromLocalStorage) {
            console.log('WalletAuthManager: Updating UserContext from localStorage');
            userContext.updateUserFromLocalStorage();
            
            // Use navigate to redirect to homepage
            console.log('WalletAuthManager: Redirecting authenticated user to homepage');
            navigate('/', { replace: true });
          }
          return;
        }
        
        // Prevent multiple processing attempts
        if (isProcessing) {
          return;
        }
        
        // Check if any wallet is connected
        if (!isEvmConnected && !isSolanaConnected && !isProtonConnected) {
          console.log('WalletAuthManager: No wallet connected');
          setIsInitialized(true);
          return;
        }
        
        setIsProcessing(true);
        
        // Determine which wallet is connected and get the address
        let walletType = null;
        let walletAddress = null;
        
        if (isEvmConnected && evmAddress) {
          walletType = 'evm';
          walletAddress = evmAddress;
        } else if (isSolanaConnected && solanaPublicKey) {
          walletType = 'solana';
          walletAddress = solanaPublicKey.toString();
        } else if (isProtonConnected && protonAddress) {
          walletType = 'proton';
          walletAddress = protonAddress;
        }
        
        if (!walletAddress) {
          setError('No wallet address available');
          setIsInitialized(true);
          return;
        }
        
        console.log(`WalletAuthManager: ${walletType} wallet connected with address ${walletAddress}`);
        
        console.log(`Checking for wallet ${walletType} with address ${walletAddress}`);
        
        // Check if user exists in database
        const { data: existingUser, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq(`${walletType}_address`, walletAddress)
          .single();
        
        console.log('Database query result:', { existingUser, fetchError });
        
        if (fetchError && fetchError.code === 'PGRST116') {
          console.log('User not found in database, creating new user...');
          // User doesn't exist, prepare new user data and show username modal
          const suggestedUsername = `${walletType}_${walletAddress.substring(0, 8)}`;
          const pendingNewUser = {
            // Let Supabase auto-generate the ID
            [`${walletType}_address`]: walletAddress,
            user_type: 'wallet_user',
            wallet_type: walletType,
            points: 0,
            created_at: new Date().toISOString()
          };
          
          console.log('Created pending user:', pendingNewUser);
          
          // Set pending user and show username modal
          setPendingUser(pendingNewUser);
          setDefaultUsername(suggestedUsername);
          setShowUsernameModal(true);
          setIsProcessing(false);
        } else if (existingUser) {
          console.log('Found existing user:', existingUser);
          // User exists, update last login
          const updatedUser = {
            ...existingUser,
            last_login: new Date().toISOString()
          };
          
          // Update the user in Supabase
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ last_login: new Date().toISOString() })
            .eq(`${walletType}_address`, walletAddress);
            
          if (updateError) {
            console.error('WalletAuthManager: Error updating user:', updateError);
            setError('Failed to update user profile');
          } else {
            console.log('WalletAuthManager: Updated existing user in database');
            
            // Save the updated user data in localStorage
            localStorage.setItem('gg_user', JSON.stringify(updatedUser));
            setIsAuthenticated(true);
            
            // Set a flag in localStorage to indicate successful authentication
            localStorage.setItem('gg_auth_success', 'true');
            
            // Use the most direct and reliable approach
            console.log('WalletAuthManager: Authentication successful, redirecting to home page');
            
            // Use direct window.location navigation for a full page reload
            // This is the most reliable way to ensure proper authentication state
            window.location.href = '/';
          }
        } else if (fetchError) {
          console.error('WalletAuthManager: Error fetching user:', fetchError);
          setError('Failed to check user profile');
        }
        
        setIsInitialized(true);
        setIsProcessing(false);
      } catch (err) {
        console.error('WalletAuthManager: Authentication error:', err);
        setError(`Authentication error: ${err.message}`);
        setIsInitialized(true);
        setIsProcessing(false);
        
        // Show error to user
        alert(`Wallet authentication failed: ${err.message}`);
      }
    };

    handleWalletAuth();
  }, [isEvmConnected, evmAddress, isSolanaConnected, solanaPublicKey, isProtonConnected, protonAddress, isProcessing, navigate]);

  // Handle username submission
  const handleUsernameSubmit = async (username) => {
    console.log('WalletAuthManager: handleUsernameSubmit called with username:', username);
    console.log('WalletAuthManager: pendingUser:', pendingUser);
    
    if (!pendingUser) {
      console.error('WalletAuthManager: No pending user to update username for');
      alert('No pending user data. Please try connecting your wallet again.');
      return;
    }
    
    setIsProcessing(true);
    console.log('WalletAuthManager: Processing username submission...');
    
    // Get the UserContext methods directly
    const userContextMethods = userContext;
    
    // Add username to pending user
    const userWithUsername = {
      ...pendingUser,
      username: username
    };
    
    console.log('WalletAuthManager: Creating user in Supabase with data:', userWithUsername);
    
    try {
      // Create the user in Supabase
      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert(userWithUsername)
        .select();
        
      console.log('WalletAuthManager: Supabase insert response:', { data, error: insertError });
      
      if (insertError) {
        console.error('WalletAuthManager: Error creating user with username:', insertError);
        alert(`Failed to create user profile: ${insertError.message}`);
        setError('Failed to create user profile');
        setIsProcessing(false);
        return;
      }
    
    console.log('WalletAuthManager: Created new user with username in database');
    
    // Save in localStorage for the dual storage approach
    try {
      console.log('WalletAuthManager: Saving user data to localStorage');
      localStorage.setItem('gg_user', JSON.stringify(userWithUsername));
      console.log('WalletAuthManager: Successfully saved to localStorage');
      
      // IMPORTANT FIX: Manually update the UserContext without page refresh
      if (userContext && userContext.updateUserFromLocalStorage) {
        console.log('WalletAuthManager: Manually updating UserContext with the new user data');
        userContext.updateUserFromLocalStorage();
      } else {
        console.warn('WalletAuthManager: Could not find updateUserFromLocalStorage method in UserContext');
      }
    } catch (e) {
      console.error('WalletAuthManager: Error saving to localStorage:', e);
    }
    
    setIsAuthenticated(true);
    
    // Clear modal state
    setShowUsernameModal(false);
    setPendingUser(null);
    setIsProcessing(false);
    
    // Alert the user and force a reliable redirect
    alert('Successfully authenticated! Redirecting to homepage...');
    
    // Set a flag in localStorage to indicate successful authentication
    localStorage.setItem('gg_auth_success', 'true');
    
    console.log('WalletAuthManager: Authentication with username successful, redirecting to home page');
    
    // Use the most direct approach - window.location.href for a full page reload
    // This is the most reliable way to ensure the app recognizes the new authentication state
    window.location.href = '/';
    
    } catch (err) {
      console.error('WalletAuthManager: Error in handleUsernameSubmit:', err);
      alert(`Error during authentication: ${err.message}`);
      setIsProcessing(false);
    }
  };
  
  // Handle modal close
  const handleModalClose = () => {
    console.log('WalletAuthManager: Username modal closed without submission');
    // Just close the modal and reset state, but don't create user
    setShowUsernameModal(false);
    setPendingUser(null);
    setIsProcessing(false);
  };
  
  // Render the username selector modal if needed
  return (
    <UsernameSelectorModal
      isOpen={showUsernameModal}
      onClose={handleModalClose}
      onSubmit={handleUsernameSubmit}
      defaultUsername={defaultUsername}
    />
  );
};

export default WalletAuthManager;
