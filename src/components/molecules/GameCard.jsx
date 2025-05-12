import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import Icon from '../atoms/Icon';
import { useUser } from '../../contexts/UserContext';
import { useWallet } from '../../contexts/WalletContext';
import { useGame } from '../../contexts/GameContext';
import { animationVariants, animationTransitions, mysticalFloat, calligraphicReveal } from '../../utils/animations';

const GameCard = ({ game, onClick }) => {
  const { user } = useUser();
  const { purchaseGame } = useWallet();
  const { unlockGame, unlockInProgress } = useGame();
  const [unlockStatus, setUnlockStatus] = useState({ message: '', isError: false });
  const [showStatus, setShowStatus] = useState(false);
  
  const useDefaultBackground = false; // Set to false to use game.image
  const gamesWithSpecialAnimations = ['marks-of-destiny', 'flame-of-wisdom', 'path-of-enlightenment', 'gates-of-knowledge', 'mystical-tap-journey'];
    
  // Get color based on category
  const getCategoryColor = () => {
    switch (game.category) {
      case 'strategy':
        return 'bg-emeraldGreen/80';
      case 'puzzle':
        return 'bg-persianBlue/80';
      case 'rhythm':
        return 'bg-persianRose/80';
      case 'clicker':
        return 'bg-amber/80';
      case 'quiz':
        return 'bg-royalGold/80';
      case 'journey':
        return 'bg-deepLapisLight/80';
      default:
        return 'bg-royalGold/80';
    }
  };

  // Get border color based on category
  const getBorderColor = () => {
    // Highlight games that can be unlocked
    if (!game.unlocked && user && user.points >= game.gcCost) {
      return 'border-textGold/70'; // Gold border for unlockable games
    }
    
    if (!game.unlocked) return 'border-white/10';
    
    switch (game.category) {
      case 'strategy':
        return 'border-emeraldGreen/60';
      case 'puzzle':
        return 'border-persianBlue/60';
      case 'rhythm':
        return 'border-persianRose/60';
      case 'clicker':
        return 'border-amber/60';
      case 'quiz':
        return 'border-royalGold/60';
      case 'journey':
        return 'border-deepLapisLight/60';
      default:
        return 'border-royalGold/60';
    }
  };
  
  // Check if user can unlock this game
  const canUnlock = user && user.points >= game.gcCost;
  
  // Handle game unlock
  const handleUnlock = async (e) => {
    e.stopPropagation(); // Prevent card click
    
    try {
      // Process payment first
      const purchaseResult = purchaseGame(game);
      
      if (!purchaseResult.success) {
        setUnlockStatus({ 
          message: purchaseResult.error || 'Failed to purchase game', 
          isError: true 
        });
        setShowStatus(true);
        setTimeout(() => setShowStatus(false), 3000);
        return;
      }
      
      // Then unlock the game
      const unlockResult = await unlockGame(game.id);
      
      if (unlockResult.success) {
        setUnlockStatus({ 
          message: 'Game unlocked!', 
          isError: false 
        });
      } else {
        setUnlockStatus({ 
          message: unlockResult.error || 'Failed to unlock game', 
          isError: true 
        });
      }
      
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    } catch (error) {
      console.error('Error unlocking game:', error);
      setUnlockStatus({ 
        message: 'An error occurred', 
        isError: true 
      });
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    }
  };

  const getImagePath = (imageName) => {
    if (!imageName) return '/assets/images/games/placeholder.svg'; // Default placeholder
    if (imageName.startsWith('/assets/')) { // If it's already a full path from public/assets
      return imageName;
    }
    return `/assets/images/games/${imageName}`; // Otherwise, assume it's in the games subfolder
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-lg border-2 ${getBorderColor()} bg-deepLapisDark/80 shadow-lg`}
      variants={animationVariants.slideUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={animationTransitions.gentle}
      whileHover={game.unlocked ? { 
        scale: 1.03, 
        boxShadow: game.id === 'marks-of-destiny' ? 
          '0 0 25px rgba(218, 165, 32, 0.7), 0 0 15px rgba(123, 104, 238, 0.6)' : 
          '0 0 20px rgba(218, 165, 32, 0.6), 0 0 10px rgba(255, 215, 0, 0.4)'
      } : {}}
      whileTap={game.unlocked ? { scale: 0.98 } : {}}
      onClick={game.unlocked ? onClick : undefined}
      style={game.unlocked ? { animation: 'mystical-float 6s infinite ease-in-out' } : undefined}
    >
      {/* Game card content */}
      <div className="relative h-full">
        {/* Game image with overlay */}
        <div className="relative h-32 overflow-hidden">
          <div 
            className={`absolute inset-0 ${useDefaultBackground ? getCategoryColor() : ''} bg-cover bg-center`}>
            {!useDefaultBackground && game.image && !(game.unlocked && gamesWithSpecialAnimations.includes(game.id)) && (
              <img 
                src={getImagePath(game.image)}
                alt={game.name} 
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/images/games/placeholder.svg';
                }} 
              />
            )}
            {useDefaultBackground && (
              <div className={`w-full h-full ${getCategoryColor()}`}></div> // Ensure colored background fills space if no image
            )}
          </div>
          {/* Category Badge */}
          <div className="absolute top-2 right-2 z-20">
            <span className={`text-xs px-3 py-1 rounded-full ${getCategoryColor()} text-white font-medium`}>
              {game.category.charAt(0).toUpperCase() + game.category.slice(1)}
            </span>
          </div>
          {game.unlocked ? (
            <>
              {/* Dynamic glowing background animation */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-b"
                initial={{ opacity: 0.7 }}
                animate={{
                  background: game.id === 'marks-of-destiny' ? [
                    'radial-gradient(circle at 30% 50%, rgba(218, 165, 32, 0.4) 0%, rgba(40, 68, 120, 0.4) 50%, rgba(123, 104, 238, 0.3) 100%)',
                    'radial-gradient(circle at 70% 30%, rgba(218, 165, 32, 0.5) 0%, rgba(40, 68, 120, 0.5) 60%, rgba(123, 104, 238, 0.4) 100%)',
                    'radial-gradient(circle at 40% 60%, rgba(218, 165, 32, 0.4) 0%, rgba(40, 68, 120, 0.4) 50%, rgba(123, 104, 238, 0.3) 100%)'
                  ] : [
                    'linear-gradient(135deg, rgba(40, 68, 120, 0.3) 0%, rgba(60, 88, 140, 0.6) 50%, rgba(40, 68, 120, 0.3) 100%)',
                    'linear-gradient(225deg, rgba(40, 68, 120, 0.4) 0%, rgba(60, 88, 140, 0.7) 50%, rgba(40, 68, 120, 0.4) 100%)',
                    'linear-gradient(135deg, rgba(40, 68, 120, 0.3) 0%, rgba(60, 88, 140, 0.6) 50%, rgba(40, 68, 120, 0.3) 100%)'
                  ],
                  opacity: [0.7, 0.9, 0.7]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              />
              
              {/* Inner glow effect and game-specific animations */}
              {game.id === 'marks-of-destiny' ? (
                <motion.div
                  className="absolute inset-0 opacity-70 z-10"
                  style={{ boxShadow: `0 0 15px 2px ${game.color || '#DAA520'}30` }}
                >
                  <img
                    src="/assets/Marks of Destiny Animation.webp"
                    alt="Marks of Destiny Animation"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ) : game.id === 'flame-of-wisdom' ? (
                <motion.div
                  className="absolute inset-0 opacity-70 z-10"
                  style={{ boxShadow: `0 0 15px 2px ${game.color || '#DAA520'}30` }}
                >
                  <img
                    src="/assets/Flame of Wisdom.webp"
                    alt="Flame of Wisdom Animation"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ) : game.id === 'path-of-enlightenment' ? (
                <motion.div
                  className="absolute inset-0 opacity-70 z-10"
                  style={{ boxShadow: `0 0 15px 2px ${game.color || '#DAA520'}30` }}
                >
                  <img
                    src="/assets/Path of Enlightenment Animation.webp"
                    alt="Path of Enlightenment Animation"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ) : game.id === 'gates-of-knowledge' ? (
                <motion.div
                  className="absolute inset-0 opacity-70 z-10"
                  style={{ boxShadow: `0 0 15px 2px ${game.color || '#DAA520'}30` }}
                >
                  <img
                    src="/assets/Gates of Knowledge.webp"
                    alt="Gates of Knowledge Animation"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ) : game.id === 'mystical-tap-journey' ? (
                <motion.div
                  className="absolute inset-0 opacity-70 z-10"
                  style={{ boxShadow: `0 0 15px 2px ${game.color || '#DAA520'}30` }}
                >
                  <img
                    src="/assets/Mystical Tap Journey.webp"
                    alt="Mystical Tap Journey Animation"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ) : (
                <motion.div
                  className="absolute inset-0 opacity-70 z-10"
                  style={{ boxShadow: `0 0 15px 2px ${game.color || '#DAA520'}30` }}
                />
              )}
              
              {/* Game-specific overlay elements */}
              {game.id === 'marks-of-destiny' && (
                <motion.div 
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                >
                  <motion.div 
                    className="absolute w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <svg width="100%" height="100%" viewBox="0 0 200 100" className="opacity-50">
                      <motion.circle 
                        cx="40" cy="50" r="15" 
                        fill="none" stroke="#DAA520" strokeWidth="1.5"
                        initial={{ opacity: 0.3, scale: 0.8 }}
                        animate={{ 
                          opacity: [0.3, 0.8, 0.3],
                          scale: [0.8, 1, 0.8]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut"
                        }}
                      />
                      <motion.path 
                        d="M160 50 A 20 20 0 1 1 140 30"
                        fill="none" stroke="#9370DB" strokeWidth="1.5"
                        initial={{ opacity: 0.3, strokeDashoffset: 100, strokeDasharray: 100 }}
                        animate={{ 
                          opacity: [0.3, 0.8, 0.3],
                          strokeDashoffset: [100, 0, 100]
                        }}
                        transition={{ 
                          duration: 6,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut"
                        }}
                      />
                      <motion.line 
                        x1="20" y1="20" x2="180" y2="80" 
                        stroke="#DAA520" strokeWidth="0.5"
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: [0, 0.5, 0]
                        }}
                        transition={{ 
                          duration: 5,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut",
                          delay: 1
                        }}
                      />
                      <motion.line 
                        x1="180" y1="20" x2="20" y2="80" 
                        stroke="#DAA520" strokeWidth="0.5"
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: [0, 0.5, 0]
                        }}
                        transition={{ 
                          duration: 5,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut",
                          delay: 2
                        }}
                      />
                    </svg>
                  </motion.div>
                </motion.div>
              )}
              
              {/* Animated pulsing inner shadow effect */}
              <motion.div 
                className="absolute inset-0 opacity-70 z-10"
                initial={{ boxShadow: 'inset 0 0 10px rgba(255, 215, 0, 0.2)' }}
                animate={{ 
                  boxShadow: game.id === 'marks-of-destiny' ? [
                    'inset 0 0 15px rgba(255, 215, 0, 0.3)',
                    'inset 0 0 25px rgba(255, 215, 0, 0.6)',
                    'inset 0 0 15px rgba(255, 215, 0, 0.3)'
                  ] : [
                    'inset 0 0 10px rgba(255, 215, 0, 0.2)',
                    'inset 0 0 20px rgba(255, 215, 0, 0.4)',
                    'inset 0 0 10px rgba(255, 215, 0, 0.2)'
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-deepLapis/80" />
          )}
          
          {/* Lock icon for locked games with mystical animation */}
          {!game.unlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                className="p-3 rounded-full bg-deepLapisDark/90 border border-white/30"
                animate={{
                  boxShadow: canUnlock
                    ? ['0 0 5px rgba(255, 215, 0, 0.3)', '0 0 15px rgba(255, 215, 0, 0.6)', '0 0 5px rgba(255, 215, 0, 0.3)']
                    : ['0 0 5px rgba(255, 255, 255, 0.1)', '0 0 10px rgba(255, 255, 255, 0.2)', '0 0 5px rgba(255, 255, 255, 0.1)']
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              >
                <motion.div
                  animate={{
                    rotate: canUnlock ? [0, 10, -10, 0] : 0
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    times: [0, 0.2, 0.8, 1]
                  }}
                >
                  <Icon name="lock" size={24} color={canUnlock ? "#FFD700" : "#FFFFFF"} />
                </motion.div>
              </motion.div>
            </div>
          )}
          
          {/* Category badge with mystical animation */}
          <div className="absolute top-2 right-2">
            <motion.div 
              className={`text-xs px-3 py-1 rounded-full ${getCategoryColor()} text-white font-medium`}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              whileHover={game.unlocked ? { scale: 1.1, y: -2 } : {}}
              style={game.unlocked ? {
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.4), 0 0 4px rgba(255, 215, 0, 0.6)'
              } : {
                boxShadow: '0 0 4px rgba(255, 255, 255, 0.2)'
              }}
            >
              {game.category.charAt(0).toUpperCase() + game.category.slice(1)}
            </motion.div>
          </div>
        </div>
        
        {/* Game info */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <motion.h3 
              className={`font-primary text-lg ${game.unlocked ? 'text-textGold' : 'text-white/60'} tracking-wide`}
              initial={game.unlocked ? { opacity: 0, y: -10 } : {}}
              animate={game.unlocked ? { opacity: 1, y: 0 } : {}}
              transition={game.unlocked ? { duration: 0.8, ease: "easeOut" } : {}}
              style={game.unlocked ? {
                textShadow: '0 0 8px rgba(255, 215, 0, 0.6)',
                animation: 'calligraphic-reveal 2s ease-out'
              } : {}}
            >
              {game.name}
            </motion.h3>
            <motion.div
              animate={game.unlocked ? {
                rotate: [0, 15, -15, 0],
                scale: [1, 1.2, 1],
              } : {}}
              transition={game.unlocked ? {
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              } : {}}
            >
              <Icon 
                name={game.icon} 
                size={20} 
                color={game.unlocked ? '#FFD700' : '#FFFFFF80'} 
                className={game.unlocked ? 'pulse' : ''}
              />
            </motion.div>
          </div>
          <motion.p 
            className={`text-sm mt-2 ${game.unlocked ? 'text-white/90' : 'text-white/40'} leading-relaxed`}
            initial={game.unlocked ? { opacity: 0 } : {}}
            animate={game.unlocked ? { opacity: 1 } : {}}
            transition={game.unlocked ? { delay: 0.3, duration: 1 } : {}}
          >
            {game.description.length > 100 ? game.description.substring(0, 100) + '...' : game.description}
          </motion.p>
          
          {/* Progress bar for unlocked games with mystical animation */}
          {game.unlocked && game.progress > 0 && (
            <motion.div 
              className="mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className="flex justify-between text-xs mb-1">
                <motion.span 
                  className="text-white/80 font-medium"
                  style={{ textShadow: '0 0 5px rgba(255, 255, 255, 0.5)' }}
                >
                  Progress
                </motion.span>
                <motion.span 
                  className="text-textGold font-bold"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  style={{ textShadow: '0 0 8px rgba(255, 215, 0, 0.6)' }}
                >
                  {game.progress}%
                </motion.span>
              </div>
              <div className="h-2 bg-deepLapisLight/30 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  className="h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${game.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{
                    background: 'linear-gradient(to right, #BF953F, #FCF6BA, #B38728, #FBF5B7)',
                    boxShadow: '0 0 10px rgba(255, 215, 0, 0.7)'
                  }}
                />
              </div>
            </motion.div>
          )}
          
          {/* Unlock requirement for locked games */}
          {!game.unlocked && (
            <div className="mt-4">
              {/* Unlock cost info */}
              <div className="p-3 bg-deepLapisDark/60 border border-white/10 rounded-md text-xs text-white/70 flex items-center justify-between">
                <div className="flex items-center">
                  <Icon name="wisdom" size={14} color="#FFD700" className="mr-2" />
                  <span>Cost: <span className="text-textGold font-bold">{game.gcCost}</span> Golden Credits</span>
                </div>
                {canUnlock && (
                  <motion.button
                    onClick={handleUnlock}
                    disabled={unlockInProgress}
                    className={`px-3 py-1 rounded-full text-deepLapis bg-gradient-gold hover:bg-textGold transition-colors text-xs font-bold ${unlockInProgress ? 'opacity-70 cursor-not-allowed' : ''}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      boxShadow: [
                        '0 0 5px rgba(255, 215, 0, 0.3)',
                        '0 0 10px rgba(255, 215, 0, 0.6)',
                        '0 0 5px rgba(255, 215, 0, 0.3)'
                      ]
                    }}
                    transition={{
                      boxShadow: {
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }
                    }}
                  >
                    {unlockInProgress ? 'Unlocking...' : 'Unlock'}
                  </motion.button>
                )}
              </div>
              
              {/* Status message */}
              {showStatus && (
                <div className={`mt-2 p-2 rounded-md text-xs font-medium ${unlockStatus.isError ? 'bg-red-500/20 text-red-100' : 'bg-green-500/20 text-green-100'}`}>
                  {unlockStatus.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default GameCard;