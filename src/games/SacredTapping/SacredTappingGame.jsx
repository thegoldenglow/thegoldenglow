import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GameLayout from '../../components/templates/GameLayout';
import Button from '../../components/atoms/Button';
import Icon from '../../components/atoms/Icon';
import TapCircle from './TapCircle';
import useGameState from '../../hooks/useGameState';
import useAuth from '../../hooks/useAuth';
import { useGameReward } from '../../contexts/GameRewardContext';
import GameMasteryDisplay from '../../components/molecules/GameMasteryDisplay';
import RewardNotification from '../../components/molecules/RewardNotification';

const SacredTappingGame = () => {
  const navigate = useNavigate();
  const { updateUserPoints } = useAuth();
  const { gameData, isUnlocked, loading, saveProgress, saveStats } = useGameState('sacred-tapping');
  const { awardGameReward } = useGameReward();
  const [rewardNotification, setRewardNotification] = useState(null);
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [circles, setCircles] = useState([]);
  const [difficulty, setDifficulty] = useState('normal');
  const [showTutorial, setShowTutorial] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  
  // Game area ref for positioning
  const gameAreaRef = useRef(null);
  
  // Game mechanics constants
  const MAX_CIRCLES = 5; // Maximum number of circles on screen
  const BASE_CIRCLE_SPAWN_INTERVAL = {
    easy: 2000,
    normal: 1500,
    hard: 1000
  };
  const BASE_CIRCLE_LIFETIME = {
    easy: 3000,
    normal: 2500,
    hard: 2000
  };
  
  // Calculate speed multiplier based on remaining time
  const getSpeedMultiplier = (timeRemaining) => {
    // Start increasing speed when 45 seconds remain
    // Max multiplier of 2x (twice as fast) at end of game
    if (timeRemaining >= 45) return 1;
    return 1 + ((45 - timeRemaining) / 45);
  };
  const PERFECT_TAP_THRESHOLD = 300; // ms within which a tap is considered "perfect"
  const GOOD_TAP_THRESHOLD = 600; // ms within which a tap is considered "good"
  
  // Timers
  const [gameTime, setGameTime] = useState(60); // 60 second game
  const [spawnInterval, setSpawnInterval] = useState(null);
  const [gameTimer, setGameTimer] = useState(null);
  
  // Load saved data
  useEffect(() => {
    if (!loading && gameData) {
      // Load highscore if available
      const savedHighScore = gameData.stats?.highScore || 0;
      const savedMaxCombo = gameData.stats?.maxCombo || 0;
      setHighScore(savedHighScore);
      setMaxCombo(savedMaxCombo);
    }
  }, [loading, gameData]);
  
  // Start game with selected difficulty
  const startGame = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setCombo(0);
    setCircles([]);
    setGameTime(60);
    setPointsAwarded(0);
    
    // Award participation reward with difficulty-based bonus
    const difficultyBonus = selectedDifficulty === 'easy' ? 1 : selectedDifficulty === 'normal' ? 1.5 : 2;
    const participationReward = awardGameReward('sacred-tapping', 'participation', { difficultyLevel: selectedDifficulty, difficultyBonus });
    
    if (participationReward > 0) {
      setRewardNotification({
        amount: participationReward,
        source: 'Game Started'
      });
      
      // Clear notification after a few seconds
      setTimeout(() => setRewardNotification(null), 3000);
    }
    
    // Start spawning circles with initial rate
    const initialRate = BASE_CIRCLE_SPAWN_INTERVAL[selectedDifficulty];
    const intervalId = setInterval(() => {
      spawnCircle(selectedDifficulty, 60); // Initial gameTime is 60
    }, initialRate);
    setSpawnInterval(intervalId);
    
    // Start game timer
    const timerId = setInterval(() => {
      setGameTime(prevTime => {
        if (prevTime <= 1) {
          // End game when timer reaches zero
          clearInterval(intervalId);
          clearInterval(timerId);
          endGame();
          return 0;
        }
        
        const newTime = prevTime - 1;
        
        // Adjust spawn rate every 5 seconds as time decreases
        if (newTime % 5 === 0 || newTime === 45 || newTime === 30 || newTime === 15) {
          // Clear existing interval
          clearInterval(intervalId);
          
          // Calculate new interval based on remaining time
          const speedMultiplier = getSpeedMultiplier(newTime);
          const newRate = Math.floor(BASE_CIRCLE_SPAWN_INTERVAL[selectedDifficulty] / speedMultiplier);
          
          // Set new spawn interval with adjusted rate
          const newIntervalId = setInterval(() => {
            spawnCircle(selectedDifficulty, newTime);
          }, newRate);
          
          // Update the interval reference
          setSpawnInterval(newIntervalId);
        }
        
        return newTime;
      });
    }, 1000);
    setGameTimer(timerId);
    
    return () => {
      clearInterval(intervalId);
      clearInterval(timerId);
    };
  };
  
  // End game
  const endGame = () => {
    setGameOver(true);
    
    // Clear intervals
    if (spawnInterval) clearInterval(spawnInterval);
    if (gameTimer) clearInterval(gameTimer);
    
    // Update high score if needed
    let newHighScore = highScore;
    if (score > highScore) {
      setHighScore(score);
      newHighScore = score;
      
      // Award achievement reward for new high score
      const highScoreReward = awardGameReward('sacred-tapping', 'achievement', { type: 'highscore', score: newHighScore });
      
      if (highScoreReward > 0) {
        setRewardNotification({
          amount: highScoreReward,
          source: 'New High Score!'
        });
        
        // Clear notification after a few seconds
        setTimeout(() => setRewardNotification(null), 3000);
      }
    }
    
    // Update max combo if needed
    let newMaxCombo = maxCombo;
    if (combo > maxCombo) {
      setMaxCombo(combo);
      newMaxCombo = combo;
      
      // Award achievement reward for combo milestones
      if (newMaxCombo >= 10 && (newMaxCombo % 10 === 0 || newMaxCombo === 15 || newMaxCombo === 25)) {
        const comboReward = awardGameReward('sacred-tapping', 'achievement', { type: 'combo', combo: newMaxCombo });
        
        if (comboReward > 0) {
          setRewardNotification({
            amount: comboReward,
            source: `${newMaxCombo}x Combo Achievement!`
          });
          
          // Clear notification after a few seconds
          setTimeout(() => setRewardNotification(null), 3000);
        }
      }
    }
    
    // Calculate progress (percentage of achievement towards 1000 points)
    const progress = Math.min(Math.floor((newHighScore / 1000) * 100), 100);
    saveProgress(progress);
    
    // Award wisdom points based on score and difficulty multiplier
    const difficultyMultiplier = difficulty === 'easy' ? 1 : difficulty === 'normal' ? 1.5 : 2;
    const wisdomPoints = Math.floor((score / 100) * difficultyMultiplier);
    
    if (wisdomPoints > 0) {
      updateUserPoints(wisdomPoints);
      setPointsAwarded(wisdomPoints);
    }
    
    // Award completion reward based on score and difficulty
    const completionReward = awardGameReward('sacred-tapping', 'completion', {
      score,
      difficulty,
      difficultyMultiplier,
      combo: newMaxCombo
    });
    
    if (completionReward > 0) {
      // Wait a bit before showing the completion reward
      setTimeout(() => {
        setRewardNotification({
          amount: completionReward,
          source: 'Game Completed'
        });
        
        // Clear notification after a few seconds
        setTimeout(() => setRewardNotification(null), 3500);
      }, 1000); // Delay showing the completion reward
    }
    
    // Save stats
    saveStats({
      gamesPlayed: 1,
      highScore: newHighScore,
      maxCombo: newMaxCombo,
      totalScore: score,
      pointsEarned: wisdomPoints
    });
  };
  
  // Spawn a new circle
  const spawnCircle = (difficultyLevel, timeRemaining) => {
    // Don't spawn if maximum circles reached
    if (circles.length >= MAX_CIRCLES) return;
    
    // Get game area dimensions for positioning
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;
    
    const { width, height } = gameArea.getBoundingClientRect();
    
    // Calculate a random position within game area (with margins)
    const margin = 60; // Margin from edges
    const x = margin + Math.random() * (width - 2 * margin);
    const y = margin + Math.random() * (height - 2 * margin);
    
    // Calculate speed multiplier based on remaining time
    const speedMultiplier = getSpeedMultiplier(timeRemaining);
    
    // Adjust lifetime based on speed multiplier
    const adjustedLifetime = Math.floor(BASE_CIRCLE_LIFETIME[difficultyLevel] / speedMultiplier);
    
    // Generate circle data
    const newCircle = {
      id: `circle-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      x,
      y,
      size: Math.floor(Math.random() * 30) + 50, // Random size between 50-80px
      createdAt: Date.now(),
      lifetime: adjustedLifetime,
      tapped: false,
      speedMultiplier, // Store the speed multiplier for animation reference
      type: Math.random() > 0.8 ? 'golden' : 'normal' // 20% chance for golden (bonus) circles
    };
    
    // Add to circles array
    setCircles(prevCircles => [...prevCircles, newCircle]);
    
    // Auto-remove circle after its lifetime
    setTimeout(() => {
      setCircles(prevCircles => {
        // Find and remove the circle by id
        const circleIndex = prevCircles.findIndex(c => c.id === newCircle.id);
        
        if (circleIndex !== -1) {
          // Check if circle was tapped
          const wasTapped = prevCircles[circleIndex].tapped;
          
          // Reset combo if circle expired without being tapped
          if (!wasTapped) {
            setCombo(0);
          }
          
          // Remove the circle
          return prevCircles.filter(c => c.id !== newCircle.id);
        }
        
        return prevCircles;
      });
    }, newCircle.lifetime);
  };
  
  // Handle circle tap
  const handleTap = (circleId) => {
    // Find the tapped circle
    const circleIndex = circles.findIndex(c => c.id === circleId);
    if (circleIndex === -1) return;
    
    const circle = circles[circleIndex];
    
    // Calculate how well-timed the tap was
    const age = Date.now() - circle.createdAt;
    const timeRemaining = circle.lifetime - age;
    
    // Calculate points based on timing
    let points = 0;
    let tapQuality = '';
    
    if (timeRemaining <= PERFECT_TAP_THRESHOLD) {
      // Perfect timing: more points
      points = circle.type === 'golden' ? 50 : 25;
      tapQuality = 'perfect';
      setCombo(prev => prev + 1);
    } else if (timeRemaining <= GOOD_TAP_THRESHOLD) {
      // Good timing: standard points
      points = circle.type === 'golden' ? 30 : 15;
      tapQuality = 'good';
      setCombo(prev => prev + 1);
    } else {
      // Too early: fewer points
      points = circle.type === 'golden' ? 10 : 5;
      tapQuality = 'early';
      setCombo(prev => prev + 1);
    }
    
    // Apply combo multiplier (max 3x)
    const comboMultiplier = Math.min(1 + (combo * 0.1), 3);
    points = Math.floor(points * comboMultiplier);
    
    // Update score
    setScore(prev => prev + points);
    
    // Update max combo if needed
    if (combo > maxCombo) {
      setMaxCombo(combo);
    }
    
    // Mark circle as tapped and update circles array
    setCircles(prevCircles => {
      const newCircles = [...prevCircles];
      newCircles[circleIndex] = {
        ...newCircles[circleIndex],
        tapped: true,
        tapQuality
      };
      return newCircles;
    });
    
    // Remove circle after showing tap quality indicator
    setTimeout(() => {
      setCircles(prevCircles => prevCircles.filter(c => c.id !== circleId));
    }, 300);
  };
  
  // Handle back button
  const handleBack = () => {
    if (gameStarted && !gameOver) {
      if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
        // Clean up intervals
        if (spawnInterval) clearInterval(spawnInterval);
        if (gameTimer) clearInterval(gameTimer);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <GameLayout 
        title="Sacred Tapping"
        gameType="rhythm"
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
        title="Sacred Tapping"
        gameType="rhythm"
        onBackClick={handleBack}
      >
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-20 h-20 bg-deepLapisLight rounded-full flex items-center justify-center mb-4">
            <Icon name="lock" size={32} color="#DAA520" />
          </div>
          <h2 className="text-xl font-primary text-royalGold mb-2">Game Locked</h2>
          <p className="text-white/70 max-w-md mb-6">
            The celestial bodies await your rhythmic touch. Continue your journey to unlock this mystical experience.
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
      title="Sacred Tapping"
      gameType="rhythm"
      onBackClick={handleBack}
      backgroundPattern="stars"
    >
      <div className="flex flex-col items-center justify-center w-full h-full overflow-hidden">
        {!gameStarted ? (
          // Game start screen
          <motion.div 
            className="text-center w-full max-w-md py-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GameMasteryDisplay gameId="sacred-tapping" />
            
            <h1 className="text-2xl font-primary text-royalGold mb-3"></h1>
            <p className="text-white/80 mb-6"></p>
            
            <div className="mb-6 p-4 bg-deepLapisLight/30 rounded-lg border border-royalGold/30">
              <p className="text-royalGold font-medium mb-2">Your Celestial Record</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/70">Highest Score</p>
                  <p className="text-lg text-white">{highScore}</p>
                </div>
                <div>
                  <p className="text-xs text-white/70">Longest Harmony</p>
                  <p className="text-lg text-royalGold">{maxCombo}x Combo</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <Button 
                variant="primary" 
                fullWidth
                icon={<Icon name="star" size={18} />}
                onClick={() => startGame('easy')}
              >
                Novice Rhythm
              </Button>
              <Button 
                variant="primary" 
                fullWidth
                icon={<Icon name="star" size={18} />}
                onClick={() => startGame('normal')}
              >
                Adept Rhythm
              </Button>
              <Button 
                variant="primary" 
                fullWidth
                icon={<Icon name="star" size={18} />}
                onClick={() => startGame('hard')}
              >
                Master Rhythm
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              fullWidth
              icon={<Icon name="book" size={18} />}
              onClick={() => setShowTutorial(true)}
              className="mb-6"
            >
              How to Play
            </Button>
            
            <div className="p-3 rounded-md bg-deepLapisLight/50 text-sm text-white/70">
              <p>
                <strong className="text-royalGold">Celestial Tip:</strong> Timing is everything. 
                Watch the circles pulsate and tap them at the perfect moment to maximize your harmony.
              </p>
            </div>
          </motion.div>
        ) : (
          // Active game
          <motion.div 
            className="w-full h-full flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Game HUD */}
            <div className="w-full flex justify-between items-center mb-4">
              <div className="p-2 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">Score</p>
                <p className="text-lg text-royalGold">{score}</p>
              </div>
              
              <div className="p-2 bg-deepLapisLight/50 rounded-md text-center">
                <p className="text-xs text-white/70">Time</p>
                <p className="text-lg text-white">{gameTime}s</p>
              </div>
              
              <div className="p-2 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">Combo</p>
                <p className="text-lg text-white">{combo}x</p>
              </div>
            </div>
            
            {/* Game area */}
            <div 
              ref={gameAreaRef}
              className="relative flex-grow w-full bg-deepLapisLight/20 rounded-lg border border-royalGold/30 overflow-hidden"
              style={{ minHeight: '400px', maxHeight: '70vh' }}
            >
              {/* Circles */}
              <AnimatePresence>
                {circles.map(circle => (
                  <TapCircle
                    key={circle.id}
                    circle={circle}
                    onTap={handleTap}
                  />
                ))}
              </AnimatePresence>
              
              {/* Game over overlay */}
              {gameOver && (
                <motion.div
                  className="absolute inset-0 flex flex-col items-center justify-center bg-deepLapis/90 z-10 p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="text-2xl font-primary text-royalGold mb-2">
                    Harmony Complete
                  </h3>
                  
                  <p className="text-white text-center mb-6">
                    You have completed your celestial meditation.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-6">
                    <div className="p-3 rounded-lg bg-deepLapisLight/30 text-center">
                      <p className="text-xs text-white/70">Final Score</p>
                      <p className="text-xl text-royalGold">{score}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-deepLapisLight/30 text-center">
                      <p className="text-xs text-white/70">Max Combo</p>
                      <p className="text-xl text-white">{combo}x</p>
                    </div>
                  </div>
                  
                  {pointsAwarded > 0 && (
                    <div className="bg-royalGold/20 p-3 rounded mb-6 text-center">
                      <p className="text-royalGold">+{pointsAwarded} Wisdom Points Earned</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-4">
                    <Button 
                      variant="primary"
                      onClick={() => startGame(difficulty)}
                      icon={<Icon name="game" size={18} />}
                    >
                      Play Again
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setGameStarted(false)}
                      icon={<Icon name="arrow" size={18} />}
                    >
                      Change Mode
                    </Button>
                  </div>
                </motion.div>
              )}
              
              {/* Instructions overlay at start of game */}
              {gameStarted && !gameOver && gameTime >= 57 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div 
                    className="bg-deepLapis/70 px-6 py-3 rounded-lg text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <p className="text-royalGold text-lg font-primary">Tap the circles when they pulse!</p>
                    <p className="text-royalGold/80 text-sm font-primary mt-1">Circles speed up as time decreases!</p>
                  </motion.div>
                </div>
              )}
            </div>
            
            {/* Game status text */}
            <div className="mt-4 text-center">
              <p className="text-white/70 text-sm">
                {gameOver ? (
                  `Game Over! ${score > highScore ? 'New High Score!' : 'Well played!'}`
                ) : (
                  gameTime <= 30 ? 
                  `Circles speeding up! ${gameTime <= 15 ? 'Final rush!' : ''}` : 
                  'Tap the circles as they reach their brightest moment'
                )}
              </p>
            </div>
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
              <h3 className="text-xl text-royalGold font-primary mb-4">How to Play</h3>
              
              <div className="space-y-4 text-white/90 mb-5">
                <p>
                  <span className="text-royalGold font-medium block">Tap the Circles</span>
                  Celestial bodies will appear on screen. Tap them when they reach peak brightness.
                </p>
                <p>
                  <span className="text-royalGold font-medium block">Perfect Timing</span>
                  The closer to perfect timing, the more points you'll earn. Watch for the pulse!
                </p>
                <p>
                  <span className="text-royalGold font-medium block">Build Combos</span>
                  Successfully tap circles in sequence to build your combo multiplier.
                </p>
                <p>
                  <span className="text-royalGold font-medium block">Golden Circles</span>
                  Special golden circles appear occasionally and award more points.
                </p>
              </div>
              
              <Button 
                variant="primary" 
                fullWidth
                onClick={() => setShowTutorial(false)}
              >
                Begin Your Rhythm
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

export default SacredTappingGame;