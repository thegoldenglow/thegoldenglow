import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GameLayout from '../../components/templates/GameLayout';
import Button from '../../components/atoms/Button';
import Icon from '../../components/atoms/Icon';
import Board from './Board';
import useGameState from '../../hooks/useGameState';
import { useUser } from '../../contexts/UserContext';
import { useGameReward } from '../../contexts/GameRewardContext';
import GameMasteryDisplay from '../../components/molecules/GameMasteryDisplay';
import RewardNotification from '../../components/molecules/RewardNotification';
import { calculateWinner, isBoardFull, getAiMove } from '../../utils/gameHelpers';

const MarksOfDestinyGame = () => {
  const navigate = useNavigate();
  const { addPoints } = useUser();
  const { gameData, isUnlocked, loading, saveProgress, saveStats } = useGameState('marks-of-destiny');
  const { awardGameReward } = useGameReward();
  
  // Game state
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true); // Sun (X) always goes first
  const [gameMode, setGameMode] = useState(null); // 'ai', 'local', or 'online'
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [gameStatus, setGameStatus] = useState('setup'); // 'setup', 'playing', 'ended'
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [playerSymbols, setPlayerSymbols] = useState({
    player1: 'X', // Sun
    player2: 'O'  // Moon
  });
  const [scores, setScores] = useState({
    player1: 0,
    player2: 0,
    draws: 0
  });
  const [gameHistory, setGameHistory] = useState([]);
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  
  // For reward notifications
  const [rewardNotification, setRewardNotification] = useState(null);
  const winCountRef = useRef(0);

  // Update consecutive wins when player wins
  useEffect(() => {
    if (winner === playerSymbols.player1) {
      setConsecutiveWins(prev => prev + 1);
    } else if (winner) {
      setConsecutiveWins(0); // Reset on loss
    }
  }, [winner, playerSymbols.player1]);

  // Check for game result after each move
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    
    // Use a flag to track if we've found a result
    let resultFound = false;
    
    const result = calculateWinner(board);
    if (result) {
      resultFound = true;
      const winnerValue = result.winner;
      
      // First set all the UI-related state in a single batch
      setTimeout(() => {
        try {
          setWinner(winnerValue);
          setWinningLine(result.winningLine);
          setGameStatus('ended');
          
          // Update scores
          if (winnerValue === playerSymbols.player1) {
            setScores(prev => ({ ...prev, player1: prev.player1 + 1 }));
            winCountRef.current += 1;
          } else {
            setScores(prev => ({ ...prev, player2: prev.player2 + 1 }));
          }
          
          // Award points after UI updates if playing against AI and player won
          setTimeout(async () => {
            try {
              if (winnerValue === playerSymbols.player1) {
                // Award participation reward for completing a game
                const participationResult = await awardGameReward('marks-of-destiny', 'participation');
                if (participationResult.error) {
                  console.error('Error awarding participation reward (win path):', participationResult.error);
                } else if (participationResult.pointsAwarded > 0) {
                  // Optionally show participation reward notification or combine
                }

                if (gameMode === 'ai') {
                  const isStreak = consecutiveWins >= 3;
                  const winResult = await awardGameReward('marks-of-destiny', 'win', { 
                    difficulty: aiDifficulty,
                    isStreak: isStreak
                  });
                  
                  if (winResult.error) {
                    console.error('Error awarding win reward:', winResult.error);
                  } else if (winResult.pointsAwarded > 0) {
                    setRewardNotification({
                      amount: winResult.pointsAwarded,
                      source: `${aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)} difficulty win${isStreak ? ' streak!' : ''}`
                    });
                  }
                  
                  if (winCountRef.current >= 10) {
                    setTimeout(async () => {
                      const masteryResult = await awardGameReward('marks-of-destiny', 'mastery');
                      if (masteryResult.error) {
                        console.error('Error awarding mastery reward:', masteryResult.error);
                      } else if (masteryResult.pointsAwarded > 0) {
                        setRewardNotification({
                          amount: masteryResult.pointsAwarded,
                          source: 'Daily Mastery Bonus!'
                        });
                      }
                    }, 3500);
                  }

                  const legacyPoints = aiDifficulty === 'easy' ? 5 : 
                                       aiDifficulty === 'medium' ? 10 : 15;
                  // Assuming addPoints handles its own errors or is less critical for this flow's error reporting
                  addPoints(legacyPoints); 
                }
                
                saveStats({ 
                  gamesWon: 1,
                  pointsEarned: gameMode === 'ai' ? (aiDifficulty === 'easy' ? 5 : aiDifficulty === 'medium' ? 10 : 15) : 0
                });
              } else { // Player lost or non-AI game win for opponent
                const participationResult = await awardGameReward('marks-of-destiny', 'participation');
                if (participationResult.error) {
                  console.error('Error awarding participation reward (loss/other path):', participationResult.error);
                } else if (participationResult.pointsAwarded > 0) {
                  setRewardNotification({
                    amount: participationResult.pointsAwarded,
                    source: 'Game Participation'
                  });
                }
              }
              
              setTimeout(() => {
                saveGameToHistory(winnerValue);
              }, 100);
            } catch (error) { // General catch for this async block
              console.error('Error in points/stats awarding process:', error);
            }
          }, 50);
        } catch (uiError) {
          console.error('Error updating UI after win:', uiError);
        }
      }, 10);
      
    } else if (isBoardFull(board)) {
      resultFound = true;
      setGameStatus('ended');
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      
      setTimeout(async () => {
        const participationResult = await awardGameReward('marks-of-destiny', 'participation');
        if (participationResult.error) {
          console.error('Error awarding participation reward (draw):', participationResult.error);
        } else if (participationResult.pointsAwarded > 0) {
          setRewardNotification({
            amount: participationResult.pointsAwarded,
            source: 'Game Participation (Draw)'
          });
        }
      }, 300);
      
      setTimeout(() => {
        saveGameToHistory(null);
      }, 100);
    } else if (gameMode === 'ai' && !isXNext && gameStatus === 'playing' && !resultFound) {
      // AI's turn - only trigger if we haven't found a result
      handleAIMove();
    }
  }, [board, isXNext, gameStatus, gameMode, aiDifficulty]);

  // Handle AI move with delay for better UX
  const handleAIMove = () => {
    setTimeout(() => {
      const aiSymbol = playerSymbols.player2;
      const playerSymbol = playerSymbols.player1;
      const moveIndex = getAiMove(board, playerSymbol, aiSymbol, aiDifficulty);
      
      if (moveIndex !== null) {
        const newBoard = [...board];
        newBoard[moveIndex] = aiSymbol;
        setBoard(newBoard);
        setIsXNext(true);
      }
    }, 700); // Add delay to make AI move feel more natural
  };

  // Save game to history
  const saveGameToHistory = (gameWinner) => {
    try {
      console.log('Saving game to history with winner:', gameWinner);
      
      // Create a new history entry
      const newGameEntry = {
        id: Date.now(),
        board: JSON.parse(JSON.stringify(board)), // Deep clone the board
        winner: gameWinner,
        date: new Date().toISOString()
      };
      
      // Deep clone the history to avoid reference issues
      const currentHistory = JSON.parse(JSON.stringify(gameHistory)); 
      const updatedHistory = [...currentHistory, newGameEntry];
      
      // First update local game history
      setGameHistory(updatedHistory);
      
      // Calculate win percentage based on current data
      const winCount = updatedHistory.filter(game => game.winner === playerSymbols.player1).length;
      const winPercentage = updatedHistory.length > 0 
        ? Math.round((winCount / updatedHistory.length) * 100)
        : 0;
      
      // Calculate current scores manually to ensure accuracy
      const currentWins = scores.player1 + (gameWinner === playerSymbols.player1 ? 1 : 0);
      const currentLosses = scores.player2 + (gameWinner === playerSymbols.player2 ? 1 : 0);
      const currentDraws = scores.draws + (gameWinner === null ? 1 : 0);
      
      console.log('Current game stats - Wins:', currentWins, 'Losses:', currentLosses, 'Draws:', currentDraws);
      
      // Update progress with current calculated values - use a longer timeout
      setTimeout(() => {
        try {
          // First save the stats
          saveStats({
            gamesPlayed: updatedHistory.length,
            gamesWon: currentWins,
            gamesLost: currentLosses,
            gamesTied: currentDraws
          });
          
          // Then save the progress after a delay to avoid race conditions
          setTimeout(() => {
            try {
              saveProgress({ 
                progress: winPercentage, 
                history: updatedHistory 
              });
              console.log('Game progress saved successfully');
            } catch (progressError) {
              console.error('Error saving progress:', progressError);
            }
          }, 100);
        } catch (statsError) {
          console.error('Error saving game stats:', statsError);
        }
      }, 200);
    } catch (error) {
      console.error('Error in saveGameToHistory:', error);
    }
  };

  // Handle cell click
  const handleCellClick = (index) => {
    // Ignore click if cell is filled or game is not in progress or not player's turn (in AI mode)
    if (board[index] || gameStatus !== 'playing' || (gameMode === 'ai' && !isXNext)) return;
    
    const newBoard = [...board];
    newBoard[index] = isXNext ? playerSymbols.player1 : playerSymbols.player2;
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  // Start a new game
  const startNewGame = () => {
    // First set game status to a temporary state to force component unmounting
    setGameStatus('resetting');
    
    // Small timeout to ensure animations complete and components unmount
    setTimeout(() => {
      setBoard(Array(9).fill(null));
      setWinner(null);
      setWinningLine([]);
      setGameStatus('playing');
      setIsXNext(true); // Sun always goes first
    }, 50);
  };

  // Start game with selected mode
  const selectGameMode = (mode, difficulty = 'medium') => {
    setGameMode(mode);
    if (mode === 'ai') {
      setAiDifficulty(difficulty);
    }
    startNewGame();
  };

  // Reset the game to setup screen
  const resetGame = () => {
    // First set to a temporary state to force unmounting
    setGameStatus('resetting');
    
    // Small timeout to ensure animations complete and components unmount
    setTimeout(() => {
      setGameStatus('setup');
      setGameMode(null);
      setBoard(Array(9).fill(null));
      setWinner(null);
      setWinningLine([]);
    }, 50);
  };

  // Handle back button
  const handleBack = () => {
    if (gameStatus === 'playing') {
      // Show confirmation before leaving game in progress
      if (window.confirm('Are you sure you want to leave the game?')) {
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
        title="Marks of Destiny"
        gameType="board"
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
        title="Marks of Destiny"
        gameType="board"
        onBackClick={handleBack}
      >
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-20 h-20 bg-deepLapisLight rounded-full flex items-center justify-center mb-4">
            <Icon name="lock" size={32} color="#DAA520" />
          </div>
          <h2 className="text-xl font-primary text-royalGold mb-2">Game Locked</h2>
          <p className="text-white/70 max-w-md mb-6">
            This mystical challenge remains sealed. Continue your journey to unlock the cosmic balance of Marks of Destiny.
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
      title="Marks of Destiny"
      gameType="board"
      onBackClick={handleBack}
      backgroundPattern="geometric"
    >
      <div className="flex flex-col items-center w-full max-w-md mx-auto h-full">
        {/* Game intro */}
        {gameStatus === 'setup' && (
          <>
            <GameMasteryDisplay gameId="marks-of-destiny" />
            
            <motion.div 
              className="w-full text-center py-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl font-primary text-royalGold mb-3"></h1>
              <p className="text-white/80 mb-6"></p>
              
              <div className="space-y-4 mb-6">
                <Button 
                  variant="primary" 
                  fullWidth
                  icon={<Icon name="star" size={18} />}
                  onClick={() => selectGameMode('ai', 'easy')}
                >
                  Play Against Novice Mystic
                </Button>
                <Button 
                  variant="primary" 
                  fullWidth
                  icon={<Icon name="star" size={18} />}
                  onClick={() => selectGameMode('ai', 'medium')}
                >
                  Play Against Adept Mystic
                </Button>
                <Button 
                  variant="primary" 
                  fullWidth
                  icon={<Icon name="star" size={18} />}
                  onClick={() => selectGameMode('ai', 'hard')}
                >
                  Play Against Grand Mystic
                </Button>
                <Button 
                  variant="secondary" 
                  fullWidth
                  icon={<Icon name="profile" size={18} />}
                  onClick={() => selectGameMode('local')}
                >
                  Two Seekers (Local Play)
                </Button>
              </div>
              
              <div className="p-3 rounded-md bg-deepLapisLight/50 text-sm text-white/70">
                <p>
                  <strong className="text-royalGold">Game Rules:</strong> Take turns placing sun and moon symbols. 
                  First to align three symbols horizontally, vertically, or diagonally claims victory.
                </p>
                <p className="mt-2 text-royalGold text-xs">
                  Earn Golden Credits for participation, wins, and winning streaks!
                </p>
              </div>
            </motion.div>
          </>
        )}
        
        {/* Game board */}
        {gameStatus !== 'setup' && (
          <motion.div 
            className="w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Score display */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-center py-1 px-3 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">Sun (You)</p>
                <p className="text-lg text-royalGold">{scores.player1}</p>
              </div>
              
              <div className="text-center">
                <h2 className="text-lg font-primary text-white mb-1">
                  {gameStatus === 'playing' && (
                    isXNext ? 'Sun\'s Turn' : gameMode === 'ai' ? 'Moon Contemplates...' : 'Moon\'s Turn'
                  )}
                  {gameStatus === 'ended' && winner && (
                    winner === playerSymbols.player1 ? 'Sun Triumphs!' : 'Moon Prevails!'
                  )}
                  {gameStatus === 'ended' && !winner && 'Cosmic Balance'}
                </h2>
              </div>
              
              <div className="text-center py-1 px-3 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">{gameMode === 'ai' ? 'Moon (AI)' : 'Moon'}</p>
                <p className="text-lg text-mysticalPurple">{scores.player2}</p>
              </div>
            </div>

            {/* Game board */}
            <Board 
              squares={board}
              winningLine={winningLine}
              onClick={handleCellClick}
            />
            
            {/* Game controls */}
            <div className="flex justify-center mt-6 space-x-3">
              {gameStatus === 'ended' && (
                <Button 
                  variant="primary" 
                  onClick={startNewGame}
                  icon={<Icon name="game" size={18} />}
                >
                  Play Again
                </Button>
              )}
              <Button 
                variant={gameStatus === 'ended' ? "outline" : "danger"}
                onClick={resetGame}
                icon={<Icon name="arrow" size={18} />}
              >
                {gameStatus === 'ended' ? 'Change Mode' : 'Abandon Game'}
              </Button>
            </div>
            
            {/* Game result message */}
            {gameStatus === 'ended' && (
              <motion.div 
                className="mt-4 p-3 rounded-md bg-deepLapisLight/50 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {winner === playerSymbols.player1 && (
                  <p className="text-royalGold">
                    The Sun's radiance illuminates the path! You have achieved cosmic harmony.
                  </p>
                )}
                {winner === playerSymbols.player2 && (
                  <p className="text-mysticalPurple">
                    The Moon's gentle glow prevails. Reflect on the patterns of destiny.
                  </p>
                )}
                {!winner && (
                  <p className="text-white">
                    Perfect balance between sun and moon. The cosmic forces are aligned.
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
        
        {/* Reward notification */}
        {rewardNotification && (
          <RewardNotification 
            amount={rewardNotification.amount} 
            source={rewardNotification.source} 
          />
        )}
      </div>
    </GameLayout>
  );
};

export default MarksOfDestinyGame;