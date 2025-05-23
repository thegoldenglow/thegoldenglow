import React, { useState, useEffect } from 'react';
// Import no-scroll styles
import './styles/noScroll.css';
// Import Telegram Game Proxy safe wrapper
import gameTelegram from './utils/telegramGameProxy';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Web3 Wallet imports
import { Web3Modal, Web3Button } from '@web3modal/react';
import { WagmiConfig, createConfig, http } from 'wagmi';
import { mainnet, polygon, base } from 'wagmi/chains';

// Solana wallet adapter imports
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

// Context Providers
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { GameProvider } from './contexts/GameContext';
import { TasksProvider } from './contexts/TasksContext';
import { RewardProvider } from './contexts/RewardContext';
import { WalletProvider } from './contexts/WalletContext';
import { GameRewardProvider } from './contexts/GameRewardContext';

// Auth Components
import WalletAuthManager from './components/auth/WalletAuthManager';

// Pages
import HomePage from './components/pages/HomePage';
import ProfilePage from './components/pages/ProfilePage';
import LoginPage from './components/pages/LoginPage';
import DailyTasksPage from './components/pages/DailyTasksPage';
import RewardsPage from './components/pages/RewardsPage';
import ReferralPage from './components/pages/ReferralPage';
import LeaderboardPage from './components/pages/LeaderboardPage';

// Import game components
import MarksOfDestinyGame from './games/MarksOfDestiny/MarksOfDestinyGame';
import PathOfEnlightenmentGame from './games/PathOfEnlightenment/PathOfEnlightenmentGame';
import FlameOfWisdomGame from './games/FlameOfWisdom/FlameOfWisdomGame';
import SacredTappingGame from './games/SacredTapping/SacredTappingGame';
import GatesOfKnowledgeGame from './games/GatesOfKnowledge/GatesOfKnowledgeGame';
import NoScrollWrapper from './components/NoScrollWrapper';
import MysticalTapJourneyGame from './games/MysticalTapJourney/MysticalTapJourneyGame';
import TicTacToe from './games/TicTacToe/TicTacToe';

// Configure Solana wallet adapter
const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);
const wallets = [new PhantomWalletAdapter()];

// Configure EVM wallets
const chains = [mainnet, polygon, base];
const wagmiConfig = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
  },
});

// Web3Modal configuration
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo'; // Use 'demo' for testing, get real ID from https://cloud.walletconnect.com


function App() {
  // State to track if the app is initialized
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('App component mounted, initializing Telegram WebApp...');
    
    // Safe access to window object to prevent SSR issues
    if (typeof window === 'undefined') {
      console.log('Running in SSR context, skipping initialization');
      setIsInitialized(true);
      setIsLoading(false);
      return;
    }
    
    // Function to initialize the Telegram Web App
    const initTelegramWebApp = () => {
      console.log('Running Telegram WebApp initialization...');
      
      try {
        // Initialize Telegram Game Proxy
        gameTelegram.gameLoaded();
        
        // Check if Telegram WebApp is available
        if (window.Telegram && window.Telegram.WebApp) {
          const webApp = window.Telegram.WebApp;
          console.log('WebApp found, initializing with data:', 
            JSON.stringify({
              initData: webApp.initData ? 'present' : 'missing',
              version: webApp.version || 'unknown',
              platform: webApp.platform || 'unknown',
              colorScheme: webApp.colorScheme || 'unknown'
            })
          );
          
          // Initialize WebApp
          webApp.ready();
          webApp.expand();
          console.log('WebApp initialization methods called successfully');
        } else {
          // For development without Telegram WebApp
          console.log('Telegram WebApp not available, running in development mode');
        }
      } catch (error) {
        console.error('Error initializing WebApp:', error);
        // Log additional debugging info
        console.warn('Browser info:', navigator.userAgent);
      } finally {
        // Always mark as initialized to allow app to run even with errors
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    // Handle script loading strategy
    const handleTelegramScriptStrategy = () => {
      // Check if script is already loaded
      const scriptExists = document.querySelector('script[src="https://telegram.org/js/telegram-web-app.js"]');
      
      // If Telegram object already exists, we can proceed directly
      if (window.Telegram) {
        console.log('Telegram object already exists, initializing directly');
        initTelegramWebApp();
        return;
      }
      
      // If script exists but Telegram object doesn't, wait a bit longer
      if (scriptExists) {
        console.log('Script tag exists but Telegram object not ready, waiting...');
        const timer = setTimeout(initTelegramWebApp, 1000);
        return () => clearTimeout(timer);
      }
      
      // If neither script nor Telegram object exists, add the script
      console.log('Telegram script not found, adding dynamically');
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Telegram script loaded successfully');
        // Wait a moment for the object to initialize
        setTimeout(initTelegramWebApp, 500);
      };
      
      script.onerror = (e) => {
        console.error('Failed to load Telegram script:', e);
        // Continue anyway for development purposes
        setIsInitialized(true);
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    };
    
    // Start the initialization process
    handleTelegramScriptStrategy();
    
    // Backup initialization in case all else fails
    const backupTimer = setTimeout(() => {
      if (!isInitialized) { 
        console.warn('Backup initialization triggered after timeout');
        setIsInitialized(true);
        setIsLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(backupTimer);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-deepLapis bg-pattern-arabesque">
        <div className="text-royalGold text-2xl font-primary arabesque-border p-8 shadow-glow bg-deepLapisDark/80 backdrop-blur-sm">
          <div className="animate-spin w-16 h-16 border-4 border-royalGold border-t-transparent rounded-full mb-6 mx-auto shadow-glow"></div>
          <p className="text-center shimmer font-calligraphy text-textGold">Loading Golden Glow...</p>
          <div className="mt-4 flex justify-center space-x-2">
            <span className="w-2 h-2 bg-royalGold rounded-full animate-pulse delay-100"></span>
            <span className="w-2 h-2 bg-royalGold rounded-full animate-pulse delay-200"></span>
            <span className="w-2 h-2 bg-royalGold rounded-full animate-pulse delay-300"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WagmiConfig config={wagmiConfig}>
          <ThemeProvider>
            <UserProvider>
              <RewardProvider>
                <WalletProvider>
                  <GameProvider>
                    <GameRewardProvider>
                      <TasksProvider>
                        <Router>
                          <div 
                            className="min-h-screen bg-deepLapis bg-pattern-stars text-textLight relative"
                          >
                            {/* Wallet Auth Manager - handles wallet authentication */}
                            <WalletAuthManager />
                            
                            {/* Web3Modal component for wallet connections */}
                            <Web3Modal 
                              projectId={projectId}
                              ethereumClient={wagmiConfig}
                              themeMode="dark" 
                              themeColor="gold"
                            />
                            
                            {/* Decorative top border */}
                      <div className="h-1 w-full bg-gradient-gold absolute top-0 left-0 shadow-glow z-10"></div>
                      <NoScrollWrapper>
                        <div 
                        className="min-h-full max-w-6xl mx-auto px-4 py-6 relative z-0"
                        data-component-name="App"
                        style={{
                          backgroundImage: "url('/assets/IMG_8525-ezgif.com-video-to-webp-converter.webp')",
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                        }}
                      >
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/profile" element={<ProfilePage />} />
                          <Route path="/login" element={<LoginPage />} />
                          <Route path="/daily-tasks" element={<DailyTasksPage />} />
                          <Route path="/rewards" element={<RewardsPage />} />
                          <Route path="/referral" element={<ReferralPage />} />
                          <Route path="/leaderboard" element={<LeaderboardPage />} />
                          
                          {/* Game Routes */}
                          <Route path="/games/marks-of-destiny" element={<MarksOfDestinyGame />} />
                          <Route path="/games/path-of-enlightenment" element={<PathOfEnlightenmentGame />} />
                          <Route path="/games/flame-of-wisdom" element={<FlameOfWisdomGame />} />
                          <Route path="/games/sacred-tapping" element={<SacredTappingGame />} />
                          <Route path="/games/gates-of-knowledge" element={<GatesOfKnowledgeGame />} />
                          <Route path="/games/mystical-tap-journey" element={<MysticalTapJourneyGame />} />
                          <Route path="/games/tic-tac-toe" element={<TicTacToe />} />
                          
                          {/* Default redirect for unknown routes */}
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                        </div>
                      </NoScrollWrapper>
                    </div>
                  </Router>
                </TasksProvider>
              </GameRewardProvider>
            </GameProvider>
          </WalletProvider>
        </RewardProvider>
      </UserProvider>
    </ThemeProvider>
    </WagmiConfig>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

export default App;