import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GameLayout from '../../components/templates/GameLayout';
import Button from '../../components/atoms/Button';
import Icon from '../../components/atoms/Icon';
import JourneyCanvas from './JourneyCanvas';
import useGameState from '../../hooks/useGameState';
import useAuth from '../../hooks/useAuth';
import { useGameReward } from '../../contexts/GameRewardContext';
import GameMasteryDisplay from '../../components/molecules/GameMasteryDisplay';
import RewardNotification from '../../components/molecules/RewardNotification';

const MysticalTapJourneyGame = () => {
  const navigate = useNavigate();
  const { updateUserPoints } = useAuth();
  const { gameData, isUnlocked, loading, saveProgress, saveStats } = useGameState('mystical-tap-journey');
  const { awardGameReward } = useGameReward();
  const [rewardNotification, setRewardNotification] = useState(null);
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [distance, setDistance] = useState(0);
  const [maxDistance, setMaxDistance] = useState(1000); // Journey target, will be updated by useEffect
  const [speed, setSpeed] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [tapRate, setTapRate] = useState(0);
  const [wisdomCollected, setWisdomCollected] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(null);
  const [tapTimes, setTapTimes] = useState([]);
  const [tapRateHistory, setTapRateHistory] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentCity, setCurrentCity] = useState(null);
  const [visitedCities, setVisitedCities] = useState([]);
  const [milestone, setMilestone] = useState(null);
  const [journeyMode, setJourneyMode] = useState('short'); // short, medium, long
  const [difficultyLevel, setDifficultyLevel] = useState('normal'); // easy, normal, hard
  
  // Constants & calculated values (memoized)
  const TARGET_DISTANCES = useMemo(() => ({
    short: 1000,
    medium: 2500,
    long: 5000
  }), []);
  
  const DIFFICULTY_MODIFIERS = useMemo(() => ({
    easy: { decay: 0.5, boost: 1.5 },
    normal: { decay: 1.0, boost: 1.0 },
    hard: { decay: 1.5, boost: 0.8 }
  }), []);
  
  // Game timer and animation frame
  const [animationFrameId, setAnimationFrameId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const speedDecayRef = useRef(0.2); // Base speed decay per frame
  
  // Cities along the journey (Persian Silk Road) - Memoized
  const cities = useMemo(() => [
    { name: "Isfahan", distance: 0, description: "The jewel of Persia with its grand bazaar and magnificent architecture", bonus: 5 },
    { name: "Yazd", distance: 200, description: "Ancient desert city known for its windcatchers and Zoroastrian fire temples", bonus: 10 },
    { name: "Kerman", distance: 400, description: "Historic trading post famous for its carpets and metalwork", bonus: 15 },
    { name: "Bam", distance: 600, description: "Oasis city with its ancient citadel along the Silk Road", bonus: 20 },
    { name: "Zahedan", distance: 800, description: "Gateway to the east where Persian culture meets the Indian subcontinent", bonus: 25 },
    { name: "Mary (Merv)", distance: 1200, description: "Once one of the largest cities in the world and major Silk Road center", bonus: 30 },
    { name: "Bukhara", distance: 1600, description: "Sacred city of scholarly study with over 100 madrasas", bonus: 35 },
    { name: "Samarkand", distance: 2000, description: "Crossroads of cultures known for its stunning Registan Square", bonus: 40 },
    { name: "Kashgar", distance: 2800, description: "Western outpost of Chinese territory and important trading hub", bonus: 45 },
    { name: "Dunhuang", distance: 3600, description: "Desert oasis famous for the Mogao Caves filled with Buddhist art", bonus: 50 },
    { name: "Chang'an (Xi'an)", distance: 4500, description: "Eastern terminus of the Silk Road and ancient Chinese capital", bonus: 100 }
  ], []);
  
  // Effect to update maxDistance when journeyMode changes
  useEffect(() => {
    setMaxDistance(TARGET_DISTANCES[journeyMode]);
  }, [journeyMode, TARGET_DISTANCES]);

  // Load saved data - initialize once without causing re-renders
  useEffect(() => {
    if (!loading && gameData) {
      const savedMaxDistance = gameData.stats?.maxDistance || 0;
      // Set saved progress once on initialization
      if (savedMaxDistance > 0) {
        const progressPercentage = Math.min((savedMaxDistance / 5000) * 100, 100);
        setTimeout(() => {
          saveProgress(progressPercentage);
        }, 0);
      }
    }
  }, [loading, gameData, saveProgress]); // saveProgress from useGameState should be stable
  
  // Update game speed decay based on difficulty
  useEffect(() => {
    speedDecayRef.current = 0.2 * DIFFICULTY_MODIFIERS[difficultyLevel].decay;
  }, [difficultyLevel, DIFFICULTY_MODIFIERS]);
  
  // Handle city milestone separately to avoid render loops
  const handleCityMilestone = useCallback((nextCity) => {
    // These state updates will be batched together
    setCurrentCity(nextCity);
    setVisitedCities(prev => [...prev, nextCity]);
    setMilestone({
      type: 'city',
      name: nextCity.name,
      bonus: nextCity.bonus
    });
    
    // Add wisdom points for reaching a city
    setWisdomCollected(prev => prev + nextCity.bonus);
    
    // Award city milestone reward - this is moved out of the render cycle
    setTimeout(() => {
      const cityReward = awardGameReward('mystical-tap-journey', 'milestone', {
        type: 'city',
        cityName: nextCity.name,
        cityDistance: nextCity.distance,
        bonusPoints: nextCity.bonus
      });
      
      if (cityReward > 0) {
        setRewardNotification({
          amount: cityReward,
          source: `Discovered ${nextCity.name}!`
        });
        
        // Clear notification after a few seconds
        setTimeout(() => setRewardNotification(null), 3000);
      }
    }, 0);
  }, [awardGameReward]);
  
  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver || !startTime) return; // Ensure startTime is initialized
    
    let animationFrameIdLocal; // Use a local variable for the ID
    let previousElapsedTime = elapsedTime;
    let needsRateHistoryUpdate = false;

    const gameLoop = (timestamp) => {
      // Use refs for intermediate values instead of depending on state
      // This prevents unnecessary re-renders
      
      // Update elapsed time
      const newElapsedTime = Math.floor((timestamp - startTime) / 1000);
      if (newElapsedTime !== previousElapsedTime) {
        previousElapsedTime = newElapsedTime;
        needsRateHistoryUpdate = true;
        setElapsedTime(newElapsedTime);
      }
      
      // Update speed (natural decay)
      setSpeed(prevSpeed => Math.max(0, prevSpeed - speedDecayRef.current));
      
      // Update distance based on current speed
      setDistance(prevDistance => {
        const newDistance = prevDistance + speed / 60; // Adjust for 60fps
        
        // Check for city milestones - use a ref to track processed cities
        const nextCity = cities.find(city => 
          prevDistance < city.distance && newDistance >= city.distance
        );
        
        if (nextCity) {
          // Handle city milestone in a separate function to avoid dependency issues
          handleCityMilestone(nextCity);
        }
        
        // Check if journey is complete
        if (newDistance >= maxDistance) {
          // Use cancelAnimationFrame before completing journey to prevent further updates
          cancelAnimationFrame(animationFrameIdLocal);
          completeJourney();
          return maxDistance;
        }
        
        return newDistance;
      });
      
      // Calculate current tap rate (taps per second) - just use the current value instead of state
      const recentTaps = tapTimes.filter(time => timestamp - time < 5000); // Last 5 seconds
      const currentTapRate = recentTaps.length / (Math.min(5, newElapsedTime || 1));
      
      setTapRate(currentTapRate);
      
      // Update tap rate history every second for graph - only when elapsed time changes
      if (needsRateHistoryUpdate) {
        needsRateHistoryUpdate = false;
        setTapRateHistory(prev => [...prev, {time: newElapsedTime, rate: currentTapRate}]);
      }
      
      // Continue the game loop - don't set state for each animation frame
      animationFrameIdLocal = requestAnimationFrame(gameLoop);
    };
    
    // Start game loop
    animationFrameIdLocal = requestAnimationFrame(gameLoop);
    setAnimationFrameId(animationFrameIdLocal);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameIdLocal);
    };
  }, [gameStarted, gameOver, startTime, maxDistance, cities, speed, handleCityMilestone]);
  
  // Complete journey
  const completeJourney = useCallback(() => {
    // Stop game
    setGameOver(true);
    setSpeed(0);
    
    // Cancel animation frame if it exists
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      setAnimationFrameId(null);
    }
    
    // Calculate journey stats
    const averageTapRate = tapCount / Math.max(1, elapsedTime);
    const timeBonus = Math.max(0, maxDistance - (elapsedTime * 10)); // Faster journeys get bonus points
    const tapBonus = Math.floor(averageTapRate * 20); // More consistent tapping gets bonus points
    
    // Add bonus wisdom points
    const totalWisdom = wisdomCollected + timeBonus + tapBonus;
    setWisdomCollected(totalWisdom);
    
    // Move the user points update out of the render cycle to prevent loops
    setTimeout(() => {
      // Update user stats with wisdom points earned
      updateUserPoints(totalWisdom);
    }, 0);
    
    // Update game stats
    let maxDistanceCompleted = maxDistance;
    const journeyDifficulty = {
      distance: maxDistance,
      mode: journeyMode,
      difficulty: difficultyLevel
    };
    
    // Save journey stats to game progress - move outside of render cycle
    setTimeout(() => {
      saveStats({
        maxDistance: Math.max(gameData?.stats?.maxDistance || 0, maxDistanceCompleted),
        journeysCompleted: 1,
        totalTaps: tapCount,
        totalWisdomCollected: totalWisdom,
        fastestJourney: {
          distance: maxDistance,
          time: elapsedTime,
          averageTapRate
        },
        citiesVisited: visitedCities.map(city => city.name),
        journeyHistory: [{
          date: new Date().toISOString(),
          distance: maxDistance,
          time: elapsedTime,
          wisdom: totalWisdom,
          cities: visitedCities.length,
          mode: journeyMode,
          difficulty: difficultyLevel
        }]
      });
      
      // Set progress based on journey completion
      const progressPercentage = Math.min(Math.floor((maxDistanceCompleted / 5000) * 100), 100);
      saveProgress(progressPercentage);
    }, 0);
    
    // Award journey completion bonus based on journey difficulty
    setTimeout(() => {
      // Calculate factors for reward calculation
      const journeyModeValue = journeyMode === 'short' ? 1 : journeyMode === 'medium' ? 2 : 3;
      const difficultyValue = difficultyLevel === 'easy' ? 1 : difficultyLevel === 'normal' ? 2 : 3;
      const speedFactor = (maxDistance / Math.max(1, elapsedTime)) * 0.1;
      
      // Award journey completion reward
      const completionReward = awardGameReward('mystical-tap-journey', 'completion', {
        journeyMode,
        journeyModeValue,
        difficultyLevel,
        difficultyValue,
        distance: maxDistance,
        time: elapsedTime,
        speedFactor
      });
      
      if (completionReward > 0) {
        setRewardNotification({
          amount: completionReward,
          source: 'Journey Completed!'
        });
        
        // Clear notification after a few seconds
        setTimeout(() => setRewardNotification(null), 3500);
      }
    }, 800);
  }, [animationFrameId, tapCount, elapsedTime, maxDistance, wisdomCollected, updateUserPoints, saveStats, gameData, visitedCities, journeyMode, difficultyLevel, saveProgress, awardGameReward]);
  
  // Start game - wrapped in useCallback to prevent recreation on each render
  const startGame = useCallback((mode, difficulty) => {
    setJourneyMode(mode);
    setMaxDistance(TARGET_DISTANCES[mode]);
    setDifficultyLevel(difficulty);
    
    // Reset game state
    setGameStarted(true);
    setGameOver(false);
    setDistance(0);
    setSpeed(0);
    setTapCount(0);
    setTapRate(0);
    setWisdomCollected(0);
    setLastTapTime(null);
    setTapTimes([]);
    setTapRateHistory([]);
    setStartTime(performance.now()); // Set actual start time
    setElapsedTime(0);
    setVisitedCities([]);
    setCurrentCity(cities[0]); // Start at first city
    setMilestone({
      type: 'start',
      name: cities[0].name,
      bonus: 0
    });
    
    // Award participation reward based on journey length and difficulty
    // Use setTimeout to prevent render cycle issues
    setTimeout(() => {
      const journeyModifier = mode === 'short' ? 1 : mode === 'medium' ? 1.5 : 2;
      const difficultyModifier = difficulty === 'easy' ? 1 : difficulty === 'normal' ? 1.5 : 2;
      
      const participationReward = awardGameReward('mystical-tap-journey', 'participation', { 
        journeyLength: mode,
        journeyModifier,
        difficulty,
        difficultyModifier 
      });
      
      // Show notification if reward is awarded
      if (participationReward > 0) {
        setRewardNotification({
          amount: participationReward,
          source: 'Journey Started'
        });
        
        // Clear notification after a few seconds
        setTimeout(() => setRewardNotification(null), 3000);
      }
    }, 0);
  }, [TARGET_DISTANCES, cities, awardGameReward]);
  
  // Handle player tap
  const handleTap = useCallback(() => {
    if (!gameStarted || gameOver) return;
    
    const now = performance.now();
    
    // Record tap
    setTapCount(prev => prev + 1);
    setTapTimes(prev => [...prev, now]);
    
    // Calculate time since last tap
    const timeSinceLast = lastTapTime ? now - lastTapTime : 0;
    setLastTapTime(now);
    
    // Adjust speed boost based on rhythm (better boost for consistent timing)
    let rhythmMultiplier = 1;
    if (lastTapTime && timeSinceLast > 0) {
      const recentTaps = tapTimes.filter(time => now - time < 2000); // Last 2 seconds
      
      if (recentTaps.length > 2) {
        const intervals = [];
        for (let i = 1; i < recentTaps.length; i++) {
          intervals.push(recentTaps[i] - recentTaps[i-1]);
        }
        
        // Calculate consistency of tapping intervals
        const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        
        // Higher consistency (lower stdDev relative to avgInterval) gives better boost
        const consistency = Math.max(0, 1 - (stdDev / avgInterval));
        rhythmMultiplier = 1 + consistency;
      }
    }
    
    // Base boost adjusted by difficulty and rhythm
    const baseBoost = 0.5 * DIFFICULTY_MODIFIERS[difficultyLevel].boost;
    const speedBoost = baseBoost * rhythmMultiplier;
    
    // Update speed with boost
    setSpeed(prev => Math.min(prev + speedBoost, 10)); // Cap max speed at 10
  }, [gameStarted, gameOver, lastTapTime, tapTimes, difficultyLevel, DIFFICULTY_MODIFIERS]);
  
  // Format time display (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle back button
  const handleBack = () => {
    if (gameStarted && !gameOver) {
      if (window.confirm('Are you sure you want to abandon your journey? Your progress will be lost.')) {
        // Stop game loop
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = Math.min((distance / maxDistance) * 100, 100);
  
  // Loading state
  if (loading) {
    return (
      <GameLayout 
        title="Mystical Tap Journey"
        gameType="journey"
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
        title="Mystical Tap Journey"
        gameType="journey"
      >
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-20 h-20 bg-deepLapisLight rounded-full flex items-center justify-center mb-4">
            <Icon name="lock" size={32} color="#DAA520" />
          </div>
          <h2 className="text-xl font-primary text-royalGold mb-2">Journey Locked</h2>
          <p className="text-white/70 max-w-md mb-6">
            The ancient Silk Road awaits your spiritual journey. Complete other challenges to unlock this mystical experience.
          </p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/')}
          >
            Return to Path
          </Button>
        </div>
      </GameLayout>
    );
  }
  
  return (
    <GameLayout 
      title="Mystical Tap Journey"
      gameType="journey"
    >
      <div className="flex flex-col items-center w-full h-full overflow-hidden">
        {!gameStarted ? (
          // Game start screen
          <motion.div 
            className="w-full max-w-md text-center py-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GameMasteryDisplay gameId="mystical-tap-journey" />
            
            <h1 className="text-2xl font-primary text-royalGold mb-3"></h1>
            <p className="text-white/80 mb-6"></p>
            
            <div className="mb-6 p-4 bg-deepLapisLight/30 rounded-lg border border-royalGold/30">
              <p className="text-royalGold font-medium mb-2">Choose Your Journey</p>
              
              {/* Journey length selection */}
              <div className="mb-4">
                <p className="text-white text-sm mb-2">Journey Length:</p>
                <div className="flex justify-between gap-2">
                  <Button 
                    variant={journeyMode === 'short' ? "primary" : "outline"}
                    size="small"
                    fullWidth
                    onClick={() => setJourneyMode('short')}
                  >
                    Short (1000)
                  </Button>
                  <Button 
                    variant={journeyMode === 'medium' ? "primary" : "outline"}
                    size="small"
                    fullWidth
                    onClick={() => setJourneyMode('medium')}
                  >
                    Medium (2500)
                  </Button>
                  <Button 
                    variant={journeyMode === 'long' ? "primary" : "outline"}
                    size="small"
                    fullWidth
                    onClick={() => setJourneyMode('long')}
                  >
                    Long (5000)
                  </Button>
                </div>
              </div>
              
              {/* Difficulty selection */}
              <div>
                <p className="text-white text-sm mb-2">Spiritual Challenge:</p>
                <div className="flex justify-between gap-2">
                  <Button 
                    variant={difficultyLevel === 'easy' ? "primary" : "outline"}
                    size="small"
                    fullWidth
                    onClick={() => setDifficultyLevel('easy')}
                  >
                    Novice
                  </Button>
                  <Button 
                    variant={difficultyLevel === 'normal' ? "primary" : "outline"}
                    size="small"
                    fullWidth
                    onClick={() => setDifficultyLevel('normal')}
                  >
                    Adept
                  </Button>
                  <Button 
                    variant={difficultyLevel === 'hard' ? "primary" : "outline"}
                    size="small"
                    fullWidth
                    onClick={() => setDifficultyLevel('hard')}
                  >
                    Master
                  </Button>
                </div>
              </div>
            </div>
            
            <Button 
              variant="primary" 
              fullWidth
              icon={<Icon name="game" size={18} />}
              onClick={() => startGame(journeyMode, difficultyLevel)}
              className="mb-4"
            >
              Begin Pilgrimage
            </Button>
            
            <Button 
              variant="outline" 
              fullWidth
              icon={<Icon name="book" size={18} />}
              onClick={() => setShowTutorial(true)}
              className="mb-6"
            >
              Journey Guide
            </Button>
            
            {/* Stats display if available */}
            {gameData?.stats && (
              <div className="p-4 bg-deepLapisLight/30 rounded-lg text-center">
                <p className="text-royalGold font-medium mb-2">Your Pilgrim's Record</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-deepLapis/50 rounded">
                    <p className="text-xs text-white/70">Furthest Distance</p>
                    <p className="text-white">{gameData.stats.maxDistance || 0}</p>
                  </div>
                  <div className="p-2 bg-deepLapis/50 rounded">
                    <p className="text-xs text-white/70">Cities Visited</p>
                    <p className="text-white">{gameData.stats.citiesVisited || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          // Active game
          <motion.div 
            className="w-full flex flex-col relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Background Image Overlay */}
            <motion.div
              className="absolute inset-0 opacity-70 z-10"
              style={{
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }} // Animate opacity to 0.7
              transition={{ duration: 0.5, delay: 0.2 }}
            ></motion.div>

            {/* Game stats bar */}
            <div className="w-full flex justify-between items-center mb-4 relative z-20">
              <div className="py-1 px-3 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">Distance</p>
                <p className="text-lg text-royalGold">{Math.floor(distance)}/{maxDistance}</p>
              </div>
              
              <div className="py-1 px-3 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">Time</p>
                <p className="text-lg text-white">{formatTime(elapsedTime)}</p>
              </div>
              
              <div className="py-1 px-3 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">Wisdom</p>
                <p className="text-lg text-royalGold">{wisdomCollected}</p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-deepLapisLight/30 rounded-full h-2 mb-4">
              <motion.div 
                className="bg-royalGold h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            {/* Journey Canvas */}
            <div 
              className="relative w-full aspect-[16/7] bg-black/30 rounded-lg overflow-hidden shadow-lg mb-4 border border-royalGold/30 z-20"
              onClick={handleTap}
            >
              <JourneyCanvas 
                distance={distance}
                speed={speed}
                tapRate={tapRate}
                currentCity={currentCity}
                visitedCities={visitedCities}
                milestone={milestone}
                maxDistance={maxDistance}
              />
              
              {/* Initial tap indicator */}
              {gameStarted && !gameOver && tapCount === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div 
                    className="bg-deepLapis/70 px-6 py-3 rounded-lg text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <p className="text-royalGold text-lg font-primary">Tap rhythmically to begin your journey!</p>
                  </motion.div>
                </div>
              )}
            </div>
            
            {/* Speed and rhythm indicators */}
            <div className="flex justify-between gap-4 mb-4">
              <div className="flex-1 bg-deepLapisLight/30 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">Journey Speed</p>
                <div className="w-full bg-deepLapis/50 rounded-full h-3">
                  <div 
                    className="bg-royalGold h-3 rounded-full"
                    style={{ width: `${Math.min(speed * 10, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="flex-1 bg-deepLapisLight/30 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">Rhythm Quality</p>
                <div className="w-full bg-deepLapis/50 rounded-full h-3">
                  <div 
                    className="bg-royalGold h-3 rounded-full"
                    style={{ width: `${Math.min(tapRate * 20, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Current location info */}
            {currentCity && !gameOver && (
              <motion.div 
                className="bg-deepLapisLight/30 rounded-lg p-3 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-royalGold font-primary">{currentCity.name}</h3>
                    <p className="text-white/70 text-sm">{currentCity.description}</p>
                  </div>
                  {currentCity.bonus > 0 && (
                    <div className="bg-royalGold/20 px-2 py-1 rounded">
                      <p className="text-royalGold text-sm">+{currentCity.bonus} Wisdom</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {/* Tap here indicator */}
            {!gameOver && (
              <div className="text-center mb-1">
                <motion.p 
                  className="text-white/60 text-sm"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Tap anywhere on the journey to maintain your rhythm
                </motion.p>
              </div>
            )}
            
            {/* Game over overlay */}
            {gameOver && (
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
                  <h3 className="text-xl text-royalGold font-primary mb-2">Journey Complete</h3>
                  <p className="text-white mb-4">
                    Your spiritual pilgrimage has come to an end. You've traveled the ancient Silk Road and gathered wisdom along the way.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-deepLapisLight/30 p-3 rounded text-center">
                      <p className="text-xs text-white/70">Distance Traveled</p>
                      <p className="text-lg text-royalGold">{Math.floor(distance)}</p>
                    </div>
                    <div className="bg-deepLapisLight/30 p-3 rounded text-center">
                      <p className="text-xs text-white/70">Journey Time</p>
                      <p className="text-lg text-white">{formatTime(elapsedTime)}</p>
                    </div>
                    <div className="bg-deepLapisLight/30 p-3 rounded text-center">
                      <p className="text-xs text-white/70">Cities Visited</p>
                      <p className="text-lg text-white">{visitedCities.length}</p>
                    </div>
                    <div className="bg-deepLapisLight/30 p-3 rounded text-center">
                      <p className="text-xs text-white/70">Wisdom Gained</p>
                      <p className="text-lg text-royalGold">{wisdomCollected}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="primary" 
                      fullWidth
                      onClick={() => startGame(journeyMode, difficultyLevel)}
                    >
                      New Journey
                    </Button>
                    <Button 
                      variant="outline" 
                      fullWidth
                      onClick={() => setGameStarted(false)}
                    >
                      Change Path
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
        
        {/* Tutorial modal */}
        {showTutorial && (
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
              <h3 className="text-xl text-royalGold font-primary mb-4">Journey Guide</h3>
              
              <div className="space-y-4 text-white/90 mb-5">
                <p>
                  <span className="text-royalGold font-medium block">The Ancient Path</span>
                  Travel the historic Silk Road from Isfahan to Chang'an (Xi'an), visiting ancient cities along the way.
                </p>
                <p>
                  <span className="text-royalGold font-medium block">Rhythmic Tapping</span>
                  Maintain a steady rhythm by tapping consistently. The quality of your rhythm affects your journey speed.
                </p>
                <p>
                  <span className="text-royalGold font-medium block">Wisdom Collection</span>
                  Each city you visit grants wisdom points. Greater distances and speeds earn additional wisdom.
                </p>
                <p>
                  <span className="text-royalGold font-medium block">Journey Completion</span>
                  Complete your selected journey distance to finish your pilgrimage and collect all wisdom points.
                </p>
              </div>
              
              <Button 
                variant="primary" 
                fullWidth
                onClick={() => setShowTutorial(false)}
              >
                Begin Your Journey
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

export default MysticalTapJourneyGame;