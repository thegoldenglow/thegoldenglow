import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GameLayout from '../../components/templates/GameLayout';
import Button from '../../components/atoms/Button';
import Icon from '../../components/atoms/Icon';
import Flame from './Flame';
import useGameState from '../../hooks/useGameState';
import useAuth from '../../hooks/useAuth';
import { useGameReward } from '../../contexts/GameRewardContext';
import GameMasteryDisplay from '../../components/molecules/GameMasteryDisplay';
import RewardNotification from '../../components/molecules/RewardNotification';

const FlameOfWisdomGame = () => {
  const navigate = useNavigate();
  const { updateUserPoints, user } = useAuth();
  const { gameData, isUnlocked, loading, saveProgress, saveStats } = useGameState('flame-of-wisdom');
  const { awardGameReward } = useGameReward();
  
  // For reward notifications
  const [rewardNotification, setRewardNotification] = useState(null);
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [flameSize, setFlameSize] = useState(100);
  const [flameLevel, setFlameLevel] = useState(1);
  const [tapCount, setTapCount] = useState(0);
  const [totalWisdomPoints, setTotalWisdomPoints] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrades, setUpgrades] = useState([
    { id: 'auto-tap', name: 'Meditation Focus', description: 'Automatically nurtures the flame once per second', cost: 100, level: 0, effect: 1 },
    { id: 'tap-power', name: 'Inner Strength', description: 'Each tap produces more energy', cost: 50, level: 0, effect: 1 },
    { id: 'points-boost', name: 'Wisdom Insight', description: 'Gain more wisdom points per flame level', cost: 200, level: 0, effect: 1.2 }
  ]);
  
  // Auto tap interval
  const [autoTapInterval, setAutoTapInterval] = useState(null);
  
  // Game mechanics constants
  const BASE_FLAME_DECAY = 0.25; // Flame decreases by this amount per second
  const BASE_TAP_POWER = 5; // Base power of each tap
  const FLAME_LEVEL_THRESHOLD = 50; // Size increase needed for level up
  const MAX_FLAME_SIZE = 200; 
  const MIN_FLAME_SIZE = 50;
  const POINTS_INTERVAL = 5000; // Award points every 5 seconds
  
  // Timer for awarding points
  const [pointsTimer, setPointsTimer] = useState(0);
  
  // Load saved data
  useEffect(() => {
    if (!loading && gameData) {
      // Load saved stats if available
      const savedTotalPoints = gameData.stats?.totalWisdomPoints || 0;
      const savedFlameLevel = gameData.stats?.highestFlameLevel || 1;
      const savedUpgrades = gameData.stats?.upgrades || [];
      
      setTotalWisdomPoints(savedTotalPoints);
      
      // Apply saved upgrades
      if (savedUpgrades.length > 0) {
        setUpgrades(upgrades.map(upgrade => {
          const savedUpgrade = savedUpgrades.find(su => su.id === upgrade.id);
          if (savedUpgrade) {
            return {...upgrade, level: savedUpgrade.level};
          }
          return upgrade;
        }));
      }
    }
  }, [loading, gameData]);
  
  // Start game logic
  const startGame = () => {
    setGameStarted(true);
    setFlameSize(100);
    setFlameLevel(1);
    setTapCount(0);
    setSessionPoints(0);
    setPointsTimer(0);
    
    // Award participation reward
    setTimeout(() => {
      const participationReward = awardGameReward('flame-of-wisdom', 'participation');
      
      if (participationReward > 0) {
        setRewardNotification({
          amount: participationReward,
          source: 'Game Participation'
        });
      }
    }, 300);
    
    // Set up flame decay interval
    const decayInterval = setInterval(() => {
      setFlameSize(prevSize => {
        const newSize = Math.max(MIN_FLAME_SIZE, prevSize - BASE_FLAME_DECAY);
        return newSize;
      });
    }, 50); // Update every 50ms for smoother animation
    
    // Set up points awarding interval
    const pointsInterval = setInterval(() => {
      setPointsTimer(prevTimer => prevTimer + 50);
      
      // Award points based on flame level every POINTS_INTERVAL ms
      if (pointsTimer >= POINTS_INTERVAL) {
        const pointsBoost = upgrades.find(u => u.id === 'points-boost')?.level * upgrades.find(u => u.id === 'points-boost')?.effect || 1;
        const pointsEarned = Math.floor(flameLevel * pointsBoost);
        
        setSessionPoints(prev => prev + pointsEarned);
        setTotalWisdomPoints(prev => prev + pointsEarned);
        updateUserPoints(pointsEarned);
        setPointsTimer(0);
        
        // Save progress
        saveStats({
          totalWisdomPoints: totalWisdomPoints + pointsEarned,
          highestFlameLevel: Math.max(flameLevel, gameData?.stats?.highestFlameLevel || 0)
        });
      }
    }, 50);
    
    // Clean up intervals on unmount
    return () => {
      clearInterval(decayInterval);
      clearInterval(pointsInterval);
      if (autoTapInterval) clearInterval(autoTapInterval);
    };
  };
  
  // Handle manual tap
  const handleTap = () => {
    if (!gameStarted) return;
    
    setTapCount(prev => prev + 1);
    updateUserPoints(0.5); // Award 0.5 GC points per tap
    
    // Calculate tap power with upgrades
    const tapPowerUpgrade = upgrades.find(u => u.id === 'tap-power');
    const tapPower = BASE_TAP_POWER + (tapPowerUpgrade ? tapPowerUpgrade.level * tapPowerUpgrade.effect : 0);
    
    // Update flame size
    setFlameSize(prevSize => {
      const newSize = Math.min(MAX_FLAME_SIZE, prevSize + tapPower);
      
      // Check for level up
      const newLevel = Math.floor((newSize - MIN_FLAME_SIZE) / FLAME_LEVEL_THRESHOLD) + 1;
      if (newLevel > flameLevel) {
        setFlameLevel(newLevel);
        
        // Save progress when leveling up
        saveProgress(Math.min((newLevel / 20) * 100, 100)); // Max level is 20
        
        // Award achievement rewards for certain milestone levels
        if (newLevel % 5 === 0 || newLevel === 10 || newLevel === 15 || newLevel === 20) {
          const achievementReward = awardGameReward('flame-of-wisdom', 'achievement', { level: newLevel });
          
          if (achievementReward > 0) {
            setRewardNotification({
              amount: achievementReward,
              source: `Level ${newLevel} Achievement`
            });
            
            // Clear notification after a few seconds
            setTimeout(() => setRewardNotification(null), 3500);
          }
        }
        
        // Save stats
        saveStats({
          highestFlameLevel: Math.max(newLevel, gameData?.stats?.highestFlameLevel || 0),
          totalTaps: tapCount + 1
        });
      }
      
      return newSize;
    });
  };
  
  // Setup auto tap based on upgrade level
  useEffect(() => {
    // Clear any existing interval
    if (autoTapInterval) {
      clearInterval(autoTapInterval);
      setAutoTapInterval(null);
    }
    
    // Set up new interval if game is started and auto-tap upgrade is active
    if (gameStarted) {
      const autoTapUpgrade = upgrades.find(u => u.id === 'auto-tap');
      if (autoTapUpgrade && autoTapUpgrade.level > 0) {
        const interval = setInterval(() => {
          const tapPowerUpgrade = upgrades.find(u => u.id === 'tap-power');
          const tapPower = BASE_TAP_POWER + (tapPowerUpgrade ? tapPowerUpgrade.level * tapPowerUpgrade.effect : 0);
          
          setFlameSize(prevSize => {
            const autoTapEffect = autoTapUpgrade.level * autoTapUpgrade.effect;
            const newSize = Math.min(MAX_FLAME_SIZE, prevSize + (tapPower * autoTapEffect * 0.2));
            
            // Check for level up
            const newLevel = Math.floor((newSize - MIN_FLAME_SIZE) / FLAME_LEVEL_THRESHOLD) + 1;
            if (newLevel > flameLevel) {
              setFlameLevel(newLevel);
              
              // Save progress when leveling up
              saveProgress(Math.min((newLevel / 20) * 100, 100));
              
              // Award achievement rewards for certain milestone levels
              if (newLevel % 5 === 0 || newLevel === 10 || newLevel === 15 || newLevel === 20) {
                const achievementReward = awardGameReward('flame-of-wisdom', 'achievement', { level: newLevel });
                
                if (achievementReward > 0) {
                  setRewardNotification({
                    amount: achievementReward,
                    source: `Level ${newLevel} Achievement`
                  });
                  
                  // Clear notification after showing it and reset state
                  setTimeout(() => {
                    setRewardNotification(null);
                  }, 3500);
                }
              }
              
              saveStats({
                highestFlameLevel: Math.max(newLevel, gameData?.stats?.highestFlameLevel || 0)
              });
            }
            
            return newSize;
          });
        }, 1000); // Auto tap every second
        
        setAutoTapInterval(interval);
        
        return () => clearInterval(interval);
      }
    }
  }, [gameStarted, upgrades.find(u => u.id === 'auto-tap')?.level]);
  
  // Purchase upgrade
  const purchaseUpgrade = (upgradeId) => {
    const upgradeIndex = upgrades.findIndex(u => u.id === upgradeId);
    if (upgradeIndex === -1) return;
    
    const upgrade = upgrades[upgradeIndex];
    const cost = upgrade.cost * (upgrade.level + 1);
    
    if (totalWisdomPoints >= cost) {
      // Deduct points
      setTotalWisdomPoints(prev => prev - cost);
      
      // Apply upgrade
      const updatedUpgrades = [...upgrades];
      updatedUpgrades[upgradeIndex] = {
        ...upgrade,
        level: upgrade.level + 1
      };
      
      setUpgrades(updatedUpgrades);
      
      // Save upgrades to stats
      saveStats({
        upgrades: updatedUpgrades.map(u => ({ id: u.id, level: u.level })),
        totalWisdomPoints: totalWisdomPoints - cost
      });
      
      // Hide modal after purchase
      setShowUpgradeModal(false);
    }
  };
  
  // Handle back button
  const handleBack = () => {
    if (gameStarted) {
      // Save essential game data before navigating
      saveStats({
        totalTaps: tapCount,
        highestFlameLevel: Math.max(flameLevel, gameData?.stats?.highestFlameLevel || 0),
        totalWisdomPoints,
        upgrades: upgrades.map(u => ({ id: u.id, level: u.level }))
      });
      saveProgress(Math.min((flameLevel / 20) * 100, 100)); // Max level is 20

      // Set game as not started before navigating
      setGameStarted(false);
    }
    navigate('/'); // Navigate to home page
  };
  
  // Exit game
  const exitGame = () => {
    // Save final stats
    saveStats({
      totalTaps: tapCount,
      highestFlameLevel: Math.max(flameLevel, gameData?.stats?.highestFlameLevel || 0),
      totalWisdomPoints,
      upgrades: upgrades.map(u => ({ id: u.id, level: u.level }))
    });
    
    // Update progress
    saveProgress(Math.min((flameLevel / 20) * 100, 100));
    
    // Award completion reward based on flame level and session length
    const sessionReward = awardGameReward('flame-of-wisdom', 'completion', {
      level: flameLevel,
      taps: tapCount,
      duration: sessionPoints > 0 ? Math.ceil(sessionPoints / flameLevel * 5) : 0 // Estimate session length
    });
    
    if (sessionReward > 0) {
      setRewardNotification({
        amount: sessionReward,
        source: 'Session Completed'
      });
      
      // Clear notification after showing it and reset state
      setTimeout(() => {
        setRewardNotification(null);
        setGameStarted(false);
      }, 2000);
    } else {
      setGameStarted(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <GameLayout 
        title="Flame of Wisdom"
        gameType="clicker"
        onBackClick={handleBack}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-royalGold border-t-transparent rounded-full" />
        </div>
      </GameLayout>
    );
  }
  
  // Game not unlocked
  if (!isUnlocked) {
    return (
      <GameLayout 
        title="Flame of Wisdom"
        gameType="clicker"
        onBackClick={handleBack}
      >
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-20 h-20 bg-deepLapisLight rounded-full flex items-center justify-center mb-4">
            <Icon name="lock" size={32} color="#DAA520" />
          </div>
          <h2 className="text-xl font-primary text-royalGold mb-2">Game Locked</h2>
          <p className="text-white/70 max-w-md mb-6">
            The eternal flame awaits your touch. Continue your journey to unlock this source of mystical wisdom.
          </p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/')}
          >
            Return to Journey
          </Button>
        </div>
      </GameLayout>
    );
  }
  
  return (
    <GameLayout 
      title="Flame of Wisdom"
      gameType="clicker"
      onBackClick={handleBack}
      backgroundPattern="stars"
    >
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto h-full">
        {!gameStarted ? (
          // Start screen
          <motion.div 
            className="text-center w-full py-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GameMasteryDisplay gameId="flame-of-wisdom" />
            
            <h1 className="text-2xl font-primary text-royalGold mb-3"></h1>
            <p className="text-white/80 mb-6"></p>
            
            <div className="mb-6 p-4 bg-deepLapisLight/30 rounded-lg border border-royalGold/30">
              <p className="text-royalGold font-medium mb-2">Your Spiritual Journey</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/70">Total Wisdom</p>
                  <p className="text-lg text-white">{totalWisdomPoints}</p>
                </div>
                <div>
                  <p className="text-xs text-white/70">Highest Flame Level</p>
                  <p className="text-lg text-royalGold">{gameData?.stats?.highestFlameLevel || 1}</p>
                </div>
                <div>
                  <p className="text-xs text-white/70">Global GC Points</p>
                  <p className="text-lg text-white">{user?.points || 0}</p>
                </div>
              </div>
            </div>
            
            <Button 
              variant="primary" 
              fullWidth
              icon={<Icon name="flame" size={18} />}
              onClick={startGame}
              className="mb-4"
            >
              Ignite the Flame
            </Button>
            
            <div className="p-3 rounded-md bg-deepLapisLight/50 text-sm text-white/70">
              <p>
                <strong className="text-royalGold">Wisdom Tip:</strong> Tap the flame to strengthen it. 
                The more powerful your flame, the more wisdom points you'll gather.
              </p>
            </div>
          </motion.div>
        ) : (
          // Active game
          <motion.div 
            className="flex flex-col items-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* HUD */}
            <div className="w-full flex justify-between items-center mb-2">
              <div className="py-2 px-4 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">Flame Level</p>
                <p className="text-lg text-royalGold">{flameLevel}</p>
              </div>
              
              <div className="py-2 px-4 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">Golden Credits</p>
                <p className="text-lg text-white flex items-center">
                  {user?.points !== undefined ? parseFloat(user.points).toFixed(1) : '0.0'}
                  {sessionPoints > 0 && (
                    <span className="text-xs text-royalGold ml-1 animate-pulse">(Session: +{sessionPoints})</span>
                  )}
                </p>
              </div>
            </div>
            
            {/* Flame container */}
            <div 
              className="relative w-full aspect-square max-w-xs rounded-full bg-gradient-to-b from-deepLapis/40 to-deepLapis/80 border border-royalGold/20 flex items-center justify-center cursor-pointer overflow-hidden mb-4"
              onClick={handleTap}
            >
              <Flame size={flameSize} level={flameLevel} />
              
              {/* Tap effect container */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {tapCount > 0 && (
                  <motion.div
                    key={tapCount}
                    initial={{ opacity: 1, scale: 0.8 }}
                    animate={{ opacity: 0, scale: 1.5 }}
                    transition={{ duration: 0.5 }}
                    className="absolute w-20 h-20 bg-royalGold/20 rounded-full"
                  />
                )}
              </div>
              
              <div className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-sm">
                Tap to nurture
              </div>
            </div>
            
            {/* Game controls */}
            <div className="flex flex-col w-full gap-3 mb-6">
              <Button 
                variant="primary" 
                fullWidth
                icon={<Icon name="star" size={18} />}
                onClick={() => setShowUpgradeModal(true)}
              >
                Spiritual Upgrades
              </Button>
              
              <Button 
                variant="outline" 
                fullWidth
                icon={<Icon name="home" size={18} />}
                onClick={exitGame}
              >
                End Meditation
              </Button>
            </div>
            
            {/* Upgrade effects display */}
            <div className="w-full p-3 bg-deepLapisLight/30 rounded-lg">
              <p className="text-xs text-white/70 mb-2">Active Enhancements</p>
              <div className="grid grid-cols-2 gap-2">
                {upgrades.filter(u => u.level > 0).map(upgrade => (
                  <div key={upgrade.id} className="text-xs bg-deepLapis/50 rounded p-2">
                    <span className="text-royalGold">{upgrade.name}</span>
                    <span className="text-white/80 block">Level {upgrade.level}</span>
                  </div>
                ))}
                {upgrades.filter(u => u.level > 0).length === 0 && (
                  <p className="text-white/50 text-xs col-span-2">None active</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Upgrades modal */}
        {showUpgradeModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-deepLapis border-2 border-royalGold rounded-lg max-w-md w-full p-5"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl text-royalGold font-primary">Spiritual Upgrades</h3>
                <div className="text-white flex items-center">
                  <Icon name="wisdom" size={16} color="#DAA520" className="mr-1" />
                  {totalWisdomPoints}
                </div>
              </div>
              
              <div className="space-y-4 mb-5">
                {upgrades.map(upgrade => {
                  const cost = upgrade.cost * (upgrade.level + 1);
                  const canAfford = totalWisdomPoints >= cost;
                  
                  return (
                    <div 
                      key={upgrade.id} 
                      className={`p-3 rounded-lg border ${canAfford ? 'border-royalGold/50' : 'border-white/10'}`}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h4 className="text-royalGold font-medium">{upgrade.name}</h4>
                          <p className="text-white/70 text-sm">{upgrade.description}</p>
                          <p className="text-xs text-white/50 mt-1">Current Level: {upgrade.level}</p>
                        </div>
                        <div className="ml-2">
                          <Button 
                            variant={canAfford ? "primary" : "outline"} 
                            size="sm"
                            disabled={!canAfford}
                            onClick={() => purchaseUpgrade(upgrade.id)}
                          >
                            {cost} <Icon name="wisdom" size={12} color="currentColor" className="ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <Button 
                variant="outline" 
                fullWidth
                onClick={() => setShowUpgradeModal(false)}
              >
                Return to Flame
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
      
      {/* Reward notification */}
      {rewardNotification && (
        <RewardNotification 
          amount={rewardNotification.amount} 
          source={rewardNotification.source} 
        />
      )}
    </GameLayout>
  );
};

export default FlameOfWisdomGame;