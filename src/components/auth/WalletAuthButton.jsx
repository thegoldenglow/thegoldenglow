import React, { useState } from 'react';
import { Web3Button } from '@web3modal/react';
import { useConnect } from 'wagmi';
// Note: In a production app, you would need to install @proton/web-sdk
// This is a simplified implementation for demonstration purposes

/**
 * WalletAuthButton component
 * Provides UI for users to connect different types of wallets
 */
const WalletAuthButton = () => {
  const [selectedWallet, setSelectedWallet] = useState(null);
  
  // Helper function to check if Phantom wallet is installed
  const checkIfPhantomInstalled = () => {
    return window && window.phantom && window.phantom.solana && window.phantom.solana.isPhantom;
  };
  
  // Helper function to check if Proton wallet is available
  // In a real implementation, you'd check for the actual Proton wallet provider
  const checkIfProtonAvailable = () => {
    // This is a placeholder - in production you'd use the actual Proton SDK check
    // return window && window.ProtonWebSDK;
    return true; // For demo purposes, always return true
  };

  const handleConnect = async (walletType) => {
    setSelectedWallet(walletType);
    
    if (walletType === 'solana') {
      // Check if Phantom wallet is installed
      const isPhantomInstalled = checkIfPhantomInstalled();
      
      if (isPhantomInstalled) {
        try {
          // Connect to Phantom wallet
          const provider = window.phantom.solana;
          const response = await provider.connect();
          const publicKey = response.publicKey.toString();
          
          console.log('Connected to Phantom wallet:', publicKey);
          
          // The WalletAuthManager component will handle the rest of the authentication process
          // as it's listening for wallet connections
        } catch (error) {
          console.error('Failed to connect to Phantom wallet:', error);
          alert('Failed to connect to Phantom wallet. Please try again.');
        }
      } else {
        // Phantom wallet not installed, redirect to installation page
        if (confirm('Phantom wallet is not installed. Would you like to install it now?')) {
          window.open('https://phantom.app/', '_blank');
        }
      }
    } else if (walletType === 'proton') {
      // Check if Proton wallet is available
      const isProtonAvailable = checkIfProtonAvailable();
      
      if (isProtonAvailable) {
        try {
          // In a real implementation, you would use the Proton Web SDK
          // const { link } = await ProtonWebSDK({
          //   linkOptions: { chainId: '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0' },
          //   transportOptions: { requestAccount: 'youraccount' },
          // });
          // const { actor, permission } = await link.login('youraccount');
          // const account = { actor, permission };
          
          // For demo purposes, simulate a successful connection
          const simulatedPublicKey = 'proton_' + Math.random().toString(36).substring(2, 10);
          console.log('Connected to Proton wallet:', simulatedPublicKey);
          
          // Manually trigger the WalletAuthManager to handle this connection
          window.dispatchEvent(new CustomEvent('protonWalletConnected', { 
            detail: { address: simulatedPublicKey } 
          }));
          
        } catch (error) {
          console.error('Failed to connect to Proton wallet:', error);
          alert('Failed to connect to Proton wallet. Please try again.');
        }
      } else {
        // Proton wallet not available, redirect to installation page
        window.open('https://protonchain.com/wallet', '_blank');
      }
    } else if (walletType === 'ton') {
      // TON wallet connection will be added later
      alert('TON wallet connection coming soon!');
    }
    // EVM wallets are handled by Web3Button
  };
  
  return (
    <div className="flex flex-col space-y-4 items-center">
      <h2 className="text-xl font-bold text-royalGold mb-4">Connect Your Wallet</h2>
      
      <Web3Button 
        label="Connect Trust Wallet"
        className="w-full py-3 px-4 bg-royalGold/20 hover:bg-royalGold/30 text-royalGold rounded-lg transition-colors"
      />
      
      <button 
        onClick={() => handleConnect('solana')}
        className="w-full py-3 px-4 bg-royalGold/20 hover:bg-royalGold/30 text-royalGold rounded-lg transition-colors"
      >
        Connect Phantom Wallet
      </button>
      
      <button 
        onClick={() => handleConnect('proton')}
        className="w-full py-3 px-4 bg-royalGold/20 hover:bg-royalGold/30 text-royalGold rounded-lg transition-colors"
      >
        Connect Proton Wallet
      </button>
      
      <button 
        onClick={() => handleConnect('ton')}
        className="w-full py-3 px-4 bg-royalGold/20 hover:bg-royalGold/30 text-royalGold/50 rounded-lg transition-colors"
      >
        Connect Tonkeeper (Coming Soon)
      </button>
      
      <div className="border-t border-royalGold/20 w-full my-2 pt-2"></div>
      
      <button 
        onClick={() => {
          // Directly redirect to homepage
          window.location.href = '/';
        }}
        className="w-full py-3 px-4 bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-300 rounded-lg transition-colors border border-emerald-400/30"
      >
        Already Logged In? Press to Go Home Page
      </button>
    </div>
  );
};

export default WalletAuthButton;
