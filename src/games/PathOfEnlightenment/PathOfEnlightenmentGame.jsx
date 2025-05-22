import React, { useState, useEffect, useCallback } from 'react';
import gameTelegram from '../../utils/telegramGameProxy';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GameLayout from '../../components/templates/GameLayout';
import Button from '../../components/atoms/Button';
import Icon from '../../components/atoms/Icon';
import GameBoard from './GameBoard';
import useGameState from '../../hooks/useGameState';
import useAuth from '../../hooks/useAuth';
import { useGameReward } from '../../contexts/GameRewardContext';
import GameMasteryDisplay from '../../components/molecules/GameMasteryDisplay';
import RewardNotification from '../../components/molecules/RewardNotification';

const PathOfEnlightenmentGame = () => {
  // Add window size tracking for responsive design
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  
  // Update window dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const navigate = useNavigate();
  const { updateUserPoints } = useAuth();
  const { gameData, isUnlocked, loading, saveProgress, saveStats } = useGameState('path-of-enlightenment');
  const { awardGameReward } = useGameReward();
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [bestTile, setBestTile] = useState(2);
  
  // Track points earned in current session
  const [pointsEarned, setPointsEarned] = useState(0);
  // Track GC rewards earned
  const [rewardNotification, setRewardNotification] = useState(null);
  const [rewardsEarned, setRewardsEarned] = useState(0);
  const [dailyHighScoreReached, setDailyHighScoreReached] = useState(false);
  
  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Handle back button
  const handleBack = () => {
    if (gameStarted && !gameOver && score > 0) {
      if (window.confirm('Are you sure you want to leave the game? Your progress will be saved.')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };
  
  // Start new game
  const startNewGame = () => {
    // Notify Telegram Game API that game is initialized
    gameTelegram.gameInitialized();
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setPointsEarned(0);
    setRewardsEarned(0);
    
    // Award participation reward when starting a new game
    setTimeout(() => {
      const participationReward = awardGameReward('path-of-enlightenment', 'participation');
      
      if (participationReward > 0) {
        setRewardNotification({
          amount: participationReward,
          source: 'Game Participation'
        });
      }
    }, 300);
  };
  
  // Handle game over
  const handleGameOver = (finalScore, maxTile) => {
    setGameOver(true);
    
    // Report score to Telegram Game API
    gameTelegram.gameOver(finalScore);
    
    // Update best score
    if (finalScore > bestScore) {
      setBestScore(finalScore);
      saveStats({ bestScore: finalScore });
    }
    
    // Update best tile
    if (maxTile > bestTile) {
      setBestTile(maxTile);
      saveStats({ bestTile: maxTile });
      
      // Award wisdom points based on highest tile achieved (legacy system)
      if (maxTile >= 64) {
        const tilePoints = Math.floor(Math.log2(maxTile) * 5);
        updateUserPoints(tilePoints);
        setPointsEarned(prevPoints => prevPoints + tilePoints);
        
        saveStats({
          gamesPlayed: 1,
          tileMilestones: { [maxTile]: true },
          pointsEarned: tilePoints
        });
      }
    }
    
    // Calculate progress as percentage of best tile relative to target (2048)
    const progress = Math.min(Math.floor((Math.log2(bestTile) / 11) * 100), 100);
    saveProgress(progress);
    
    // Final score reward - give one last reward for the total score if it wasn't
    // already awarded during gameplay
    setTimeout(() => {
      const scoreReward = awardGameReward('path-of-enlightenment', 'score', { score: finalScore });
      
      if (scoreReward > 0) {
        setRewardsEarned(prev => prev + scoreReward);
        setRewardNotification({
          amount: scoreReward,
          source: 'Final Score Reward'
        });
      }
    }, 500);
  };
  
  // Handle score update
  const handleScoreUpdate = useCallback((newScore, newMaxTile) => {
    const previousScore = score;
    setScore(newScore);
    
    // Award score bonus - 1 GC per 1000 points gained
    const scorePoints = Math.floor((newScore - previousScore) / 1000);
    if (scorePoints > 0) {
      setTimeout(() => {
        const scoreReward = awardGameReward('path-of-enlightenment', 'score', { score: newScore - previousScore });
        
        if (scoreReward > 0) {
          setRewardsEarned(prev => prev + scoreReward);
          setRewardNotification({
            amount: scoreReward,
            source: 'Score Milestone'
          });
        }
      }, 100);
    }
    
    // If new max tile, award points
    if (newMaxTile > bestTile) {
      // Award traditional points
      const tilePoints = Math.floor(Math.log2(newMaxTile) * 5);
      updateUserPoints(tilePoints);
      setPointsEarned(prevPoints => prevPoints + tilePoints);
      setBestTile(newMaxTile);
      
      // Check for tile achievement rewards based on the design doc
      const rewardableTiles = [128, 256, 512, 1024, 2048];
      if (rewardableTiles.includes(newMaxTile)) {
        setTimeout(() => {
          const tileReward = awardGameReward('path-of-enlightenment', 'tier', { tileValue: newMaxTile });
          
          if (tileReward > 0) {
            setRewardsEarned(prev => prev + tileReward);
            setRewardNotification({
              amount: tileReward,
              source: `${newMaxTile} Tile Achievement`
            });
          }
        }, 300);
      }
      
      saveStats({
        bestTile: newMaxTile,
        tileMilestones: { [newMaxTile]: true }
      });
    }
    
    // Check if the score is a daily high score
    if (newScore > bestScore && !dailyHighScoreReached) {
      setDailyHighScoreReached(true);
      
      setTimeout(() => {
        const highScoreReward = awardGameReward('path-of-enlightenment', 'daily_high_score');
        
        if (highScoreReward > 0) {
          setRewardsEarned(prev => prev + highScoreReward);
          setRewardNotification({
            amount: highScoreReward,
            source: 'Daily High Score'
          });
        }
      }, 500);
    }
  }, [
    score, 
    setScore, 
    awardGameReward, 
    setRewardsEarned, 
    setRewardNotification, 
    bestTile, 
    updateUserPoints, 
    setPointsEarned, 
    setBestTile, 
    saveStats, 
    bestScore, 
    dailyHighScoreReached, 
    setDailyHighScoreReached
  ]);
  
  // Load saved game stats on component mount
  useEffect(() => {
    if (!loading && gameData) {
      // Retrieve best score from saved stats if available
      const savedBestScore = gameData.stats?.bestScore || 0;
      if (savedBestScore > bestScore) {
        setBestScore(savedBestScore);
      }
      
      // Retrieve best tile from saved stats if available
      const savedBestTile = gameData.stats?.bestTile || 2;
      if (savedBestTile > bestTile) {
        setBestTile(savedBestTile);
      }
    }
  }, [loading, gameData]);
  
  // Loading state
  if (loading) {
    return (
      <GameLayout 
        title="Path of Enlightenment"
        gameType="puzzle"
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
        title="Path of Enlightenment"
        gameType="puzzle"
        onBackClick={handleBack}
      >
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-20 h-20 bg-deepLapisLight rounded-full flex items-center justify-center mb-4">
            <Icon name="lock" size={32} color="#DAA520" />
          </div>
          <h2 className="text-xl font-primary text-royalGold mb-2">Game Locked</h2>
          <div className="mt-1 mb-2 relative w-full max-w-xs mx-auto">
            The path to enlightenment remains hidden. Continue your spiritual journey to unlock this mystical challenge.
          </div>
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
      title="Path of Enlightenment"
      gameType="puzzle"
      onBackClick={handleBack}
    >
      <div 
        className="flex flex-col items-center max-w-md mx-auto h-full overflow-hidden"
        style={{
          // Use calculated height to ensure everything fits on screen
          height: '100%',
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
        {/* Game intro */}
        {!gameStarted && !gameOver && (
          <motion.div 
            className="w-full text-center py-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GameMasteryDisplay gameId="path-of-enlightenment" />
            
            <h1 className="text-2xl font-primary text-royalGold mb-3"></h1>
            <p className="text-white/80 mb-6"></p>
            
            <div className="mt-2 mb-auto mx-auto max-w-xs">
              <p className="text-royalGold font-medium mb-2">Your Best Achievements</p>
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-white/70">Highest Score</p>
                  <p className="text-lg text-white">{bestScore}</p>
                </div>
                <div>
                  <p className="text-xs text-white/70">Highest Tile</p>
                  <p className="text-lg text-royalGold">{bestTile}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <Button 
                variant="primary" 
                fullWidth
                icon={<Icon name="game" size={18} />}
                onClick={startNewGame}
              >
                Begin Journey
              </Button>
              <Button 
                variant="outline" 
                fullWidth
                icon={<Icon name="book" size={18} />}
                onClick={() => setShowTutorial(true)}
              >
                How to Play
              </Button>
            </div>
            
            <div className="p-3 rounded-md bg-deepLapisLight/50 text-sm text-white/70">
              <p>
                <strong className="text-royalGold">Game Goal:</strong> Merge matching tiles to create higher values.
                Reach the enlightened 2048 tile to complete your spiritual journey.
              </p>
            </div>
          </motion.div>
        )}
        
        {/* Active game */}
        {(gameStarted || gameOver) && (
          <motion.div 
            className="w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Score display */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-center py-2 px-4 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">Score</p>
                <p className="text-lg text-royalGold">{score}</p>
              </div>
              
              <div className="text-center py-2 px-4 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">Best</p>
                <p className="text-lg text-white">{bestScore}</p>
              </div>
            </div>
            
            {/* Game board */}
            <GameBoard
              gameOver={gameOver}
              onGameOver={handleGameOver}
              onScoreUpdate={handleScoreUpdate}
              onRestart={startNewGame}
            />
            
            {/* Game over overlay */}
            {gameOver && (
              <motion.div 
                className="mt-6 p-4 rounded-lg bg-deepLapisLight/70 border border-royalGold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <h3 className="text-xl text-royalGold font-primary text-center mb-2">
                  {bestTile >= 2048 ? 'Enlightenment Achieved!' : 'Journey Paused'}
                </h3>
                
                <p className="text-white text-center mb-4">
                  {bestTile >= 2048 
                    ? 'You have reached the pinnacle of wisdom with the 2048 tile!' 
                    : `You achieved a ${bestTile} tile on your path.`}
                </p>
                
                {pointsEarned > 0 && (
                  <div className="bg-royalGold/20 p-2 rounded text-center mb-2">
                    <p className="text-royalGold">+{pointsEarned} Wisdom Points Earned</p>
                  </div>
                )}
                
                {rewardsEarned > 0 && (
                  <div className="bg-royalGold/30 p-2 rounded text-center mb-4">
                    <p className="text-royalGold font-semibold">+{rewardsEarned} Golden Credits Earned</p>
                  </div>
                )}
                
                <div className="flex justify-center space-x-3">
                  <Button 
                    variant="primary" 
                    onClick={startNewGame}
                    icon={<Icon name="game" size={18} />}
                  >
                    New Journey
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/')}
                    icon={<Icon name="home" size={18} />}
                  >
                    Home
                  </Button>
                </div>
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
              className="bg-deepLapis border-2 border-royalGold rounded-lg max-w-md w-full p-3"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl text-royalGold font-primary mb-4">How to Play</h3>
              
              <div className="space-y-4 text-white/90 mb-5">
                <p>
                  <span className="text-royalGold font-medium block">Swipe to Move</span>
                  Use arrow keys (keyboard) or swipe (touch) to move all tiles in one direction.
                </p>
                <p>
                  <span className="text-royalGold font-medium block">Merge Matching Tiles</span>
                  When two tiles with the same pattern touch, they merge into a higher-value tile.
                </p>
                <p>
                  <span className="text-royalGold font-medium block">Reach Enlightenment</span>
                  Create the 2048 tile to achieve spiritual enlightenment and unlock wisdom points.
                </p>
                <p>
                  <span className="text-royalGold font-medium block">Plan Ahead</span>
                  Keep space on the board and plan your moves to create higher-value tiles.
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

export default PathOfEnlightenmentGame;