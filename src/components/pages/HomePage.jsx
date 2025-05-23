import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useGame } from '../../contexts/GameContext';
import { useWallet } from '../../contexts/WalletContext';
import { useReward } from '../../contexts/RewardContext';
import HomeLayout from '../templates/HomeLayout';
import GameCard from '../molecules/GameCard';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const HomePage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, isAuthenticated, login } = useUser();
  const { games, loadGames } = useGame();
  const { stats } = useWallet();
  const { dailyLogin, wheelOfDestiny } = useReward();
  
  const [showIntro, setShowIntro] = useState(true);
  
  // Load games when component mounts
  useEffect(() => {
    loadGames();
    
    // Check if user has seen intro before
    const hasSeenIntro = localStorage.getItem('hasSeenIntro');
    if (hasSeenIntro) {
      setShowIntro(false);
      
      // Check if we have user data in localStorage or guest mode is active
      const storedUser = localStorage.getItem('gg_user');
      const guestMode = localStorage.getItem('gg_guest_mode') === 'true';
      
      // Only redirect to login if not authenticated AND no stored user data AND not in guest mode
      if (!isAuthenticated && !storedUser && !guestMode) {
        console.log('HomePage: User not authenticated and no stored user data, redirecting to login');
        navigate('/login');
      } else {
        console.log('HomePage: User is authenticated, has stored data, or is in guest mode, staying on homepage');
        // User is either authenticated, has data in localStorage, or has chosen guest mode
      }
    }
  }, [loadGames, isAuthenticated, navigate]);
  
  // Handle intro completion
  const handleIntroComplete = () => {
    setShowIntro(false);
    localStorage.setItem('hasSeenIntro', 'true');
    
    // Check if in guest mode
    const guestMode = localStorage.getItem('gg_guest_mode') === 'true';
    
    // Redirect to login page unless already authenticated or in guest mode
    if (!isAuthenticated && !guestMode) {
      navigate('/login');
    }
  };
  
  // Use all games without filtering
  const filteredGames = games;

  return (
    <HomeLayout>
      {showIntro ? (
        // Intro screen
        <motion.div
          className="fixed inset-0 bg-deepLapis z-50 flex flex-col items-center justify-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="max-w-md w-full text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div 
              className="w-24 h-24 mb-6 mx-auto"
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ type: "spring", delay: 0.6, duration: 1.5 }}
            >
              <div className="w-full h-full rounded-full bg-royalGold flex items-center justify-center">
                <span className="text-deepLapis text-4xl font-primary">GG</span>
              </div>
            </motion.div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
            <motion.h1 
              className="text-2xl font-primary text-royalGold mystic-glow" 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <span className="mystic-decorative">Welcome, Traveler</span>
            </motion.h1>
            
            {/* Login button for guest users */}
            {localStorage.getItem('gg_guest_mode') === 'true' && !isAuthenticated && (
              <motion.button
                className="mt-2 sm:mt-0 px-4 py-1.5 bg-royalGold/20 hover:bg-royalGold/30 text-royalGold border border-royalGold/30 rounded-lg shadow-mystic text-sm transition-all duration-300 flex items-center"
                onClick={() => navigate('/login')}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <span className="mr-2">✨</span>
                <span>Login for Full Experience</span>
              </motion.button>
            )}
          </div>
            
            <motion.p 
              className="text-white/80 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              Embark on a journey through Persian-themed mini-games, each offering unique challenges and rewards. Collect wisdom points, unlock achievements, and discover ancient knowledge.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <Button 
                variant="primary" 
                fullWidth
                onClick={handleIntroComplete}
              >
                Begin Your Journey
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : (
        // Main home content
        <div className="w-full max-w-4xl mx-auto px-4 py-6">
          {/* User welcome */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
              <h1 className="text-2xl font-primary text-royalGold mystic-glow">
                {user ? `Welcome, ${user.name}` : <span className="mystic-decorative">Welcome, Traveler</span>}
              </h1>
              
              {/* Login button for guest users */}
              {!user && localStorage.getItem('gg_guest_mode') === 'true' && (
                <motion.button
                  className="mt-2 sm:mt-0 px-4 py-1.5 bg-royalGold/20 hover:bg-royalGold/30 text-royalGold border border-royalGold/30 rounded-lg shadow-mystic text-sm transition-all duration-300 flex items-center"
                  onClick={() => navigate('/login')}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <span className="mr-2">✨</span>
                  <span>Login for Full Experience</span>
                </motion.button>
              )}
            </div>
            <p className="text-white/80">
              {user ? 
                `Continue your journey with ${user.points} wisdom points collected` : 
                'Begin your journey through ancient Persian wisdom'
              }
            </p>
          </motion.div>
          
          {/* Category filters removed */}
          
          {/* Games grid / carousel */}
          {/* Swiper for small screens */}
          <div className="md:hidden mb-6"> {/* Visible on small screens, hidden on md and up */}
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={16}
              slidesPerView={1.2} // Show one full card and a peek of the next
              centeredSlides={false}
              navigation
              pagination={{ clickable: true }}
              className="w-full py-4" // Added padding for pagination/navigation if they overflow
            >
              {filteredGames.map(game => (
                <SwiperSlide key={game.id}>
                  <GameCard
                    game={game}
                    onClick={() => navigate(`/games/${game.id}`)}
                  />
                </SwiperSlide>
              ))}
              {filteredGames.length === 0 && (
                <SwiperSlide>
                  <div className="text-center py-10">
                    <p className="text-white/70">No games available in this category yet</p>
                  </div>
                </SwiperSlide>
              )}
            </Swiper>
          </div>

          {/* Grid for medium screens and up */}
          <motion.div 
            className="hidden md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" // Hidden on small, grid on md and up
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {filteredGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                onClick={() => navigate(`/games/${game.id}`)}
              />
            ))}
            
            {filteredGames.length === 0 && (
              <div className="col-span-full text-center py-10">
                <p className="text-white/70">No games available in this category yet</p>
              </div>
            )}
          </motion.div>
          
          {/* Daily wisdom quote */}
          <motion.div 
            className="mt-8 p-4 bg-deepLapisLight/30 rounded-lg border border-royalGold/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <h3 className="text-royalGold font-primary mb-2 mystic-title">✧ Daily Wisdom ✧</h3>
            <p className="text-white/80 italic mystic-decorative">
              "The wound is the place where the Light enters you." <span className="text-royalGoldLight">- Rumi</span>
            </p>
          </motion.div>
          
          {/* Rewards and Referral buttons */}
          {user && (
            <motion.div
              className="mt-6 mb-4 space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/rewards')}
                className="flex items-center justify-center space-x-2"
              >
                <span className="mr-2">📈</span>
                <span>Access Rewards & Golden Credits: {user?.points || 0}</span>
                {dailyLogin?.canClaim && (
                  <span className="ml-2 bg-deepLapis px-2 py-0.5 rounded-full text-xs animate-pulse">
                    Daily Reward Ready!
                  </span>
                )}
                {wheelOfDestiny?.freeSpinAvailable && (
                  <span className="ml-2 bg-deepLapis px-2 py-0.5 rounded-full text-xs animate-pulse">
                    Free Spin Available!
                  </span>
                )}
              </Button>
              
              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate('/referral')}
                className="flex items-center justify-center space-x-2"
              >
                <span className="mr-2">👥</span>
                <span>Invite Friends & Earn Rewards</span>
                <span className="ml-2 bg-deepLapis px-2 py-0.5 rounded-full text-xs text-ancientGold">
                  NEW!
                </span>
              </Button>
            </motion.div>
          )}
          
          {/* Quick stats */}
          {user && (
            <motion.div 
              className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <div className="bg-deepLapisLight/30 p-3 rounded-lg">
                <p className="text-xs text-white/70">Games Played</p>
                <p className="text-lg text-white">{user.stats?.gamesPlayed || 0}</p>
              </div>
              <div className="bg-deepLapisLight/30 p-3 rounded-lg">
                <p className="text-xs text-white/70">Achievements</p>
                <p className="text-lg text-royalGold">{user.achievements?.length || 0}</p>
              </div>
              <div className="bg-deepLapisLight/30 p-3 rounded-lg">
                <p className="text-xs text-white/70">Highest Score</p>
                <p className="text-lg text-white">{user.stats?.highestScore || 0}</p>
              </div>
              <div className="bg-deepLapisLight/30 p-3 rounded-lg">
                <p className="text-xs text-white/70">Wisdom Rank</p>
                <p className="text-lg text-royalGold">{getWisdomRank(user.points)}</p>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </HomeLayout>
  );
};

// Helper function to determine wisdom rank based on points
const getWisdomRank = (points) => {
  if (!points) return 'Novice';
  
  if (points >= 10000) return 'Illuminated Master';
  if (points >= 5000) return 'Sage';
  if (points >= 2000) return 'Scholar';
  if (points >= 1000) return 'Adept';
  if (points >= 500) return 'Seeker';
  if (points >= 100) return 'Initiate';
  return 'Novice';
};

export default HomePage;