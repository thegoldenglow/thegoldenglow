import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import GameLayout from '../../components/templates/GameLayout';
import Button from '../../components/atoms/Button';
import Icon from '../../components/atoms/Icon';
import Board from './Board';
import useGameState from '../../hooks/useGameState';
import { useUser } from '../../contexts/UserContext';
import { useGameReward } from '../../contexts/GameRewardContext';
import { saveGameScoreAndUpdatePoints } from '../../utils/gameScoreManager';
import GameMasteryDisplay from '../../components/molecules/GameMasteryDisplay';
import RewardNotification from '../../components/molecules/RewardNotification';
import { calculateWinner, isBoardFull } from '../../utils/gameHelpers';

// TODO: Replace with your actual server URL
const SERVER_URL = 'http://localhost:3001';

const MultiplayerMarksOfDestiny = () => {
  const navigate = useNavigate();
  const { addPoints } = useUser();
  const { gameData, isUnlocked, loading, saveProgress, saveStats } = useGameState('marks-of-destiny-multiplayer');
  const { awardGameReward } = useGameReward();
  
  // Socket.IO state
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState('');
  const [roomId, setRoomId] = useState('');
  const [playerSymbol, setPlayerSymbol] = useState('');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [opponentName, setOpponentName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connecting', 'connected', 'disconnected'
  
  // Game state
  const [board, setBoard] = useState(Array(9).fill(null));
  const [gameStatus, setGameStatus] = useState('setup'); // 'setup', 'waiting', 'playing', 'ended'
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
  const [message, setMessage] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const [gameStartTime, setGameStartTime] = useState(null);
  
  // For reward notifications
  const [rewardNotification, setRewardNotification] = useState(null);
  const winCountRef = useRef(0);

  // Socket.IO connection and event handlers
  useEffect(() => {
    if (gameStatus === 'setup') return;
    
    setConnectionStatus('connecting');
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to multiplayer server');
      setConnectionStatus('connected');
      setMessage('Connected to server. Waiting for opponent...');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnectionStatus('disconnected');
      setMessage('Disconnected from server');
    });

    // Room events
    newSocket.on('roomJoined', (data) => {
      console.log(`Joined room ${data.roomId} as ${data.playerSymbol}`);
      setRoomId(data.roomId);
      setPlayerSymbol(data.playerSymbol);
      setIsMyTurn(data.turn === data.playerSymbol);
      setBoard(data.board);
      setGameStatus(Object.keys(data.players || {}).length === 2 ? 'playing' : 'waiting');
      
      if (Object.keys(data.players || {}).length === 2) {
        setGameStartTime(Date.now()); // Track when game starts
        setMessage(data.turn === data.playerSymbol ? 'Game started! Your turn (Sun)' : 'Game started! Opponent\'s turn (Moon)');
      } else {
        setMessage(data.message || 'Waiting for opponent to join...');
      }
    });

    // Game events
    newSocket.on('gameUpdate', (data) => {
      setBoard(data.board);
      setIsMyTurn(data.turn === playerSymbol);
      setGameStatus(data.gameOver ? 'ended' : 'playing');
      
      if (data.gameOver) {
        handleGameEnd(data.winner, data.board);
      } else {
        setMessage(data.turn === playerSymbol ? 'Your turn' : 'Opponent\'s turn');
      }
    });

    newSocket.on('opponentJoined', (data) => {
      setOpponentName(data.opponentName || 'Anonymous Mystic');
      setGameStatus('playing');
      setGameStartTime(Date.now()); // Track when game starts
      setMessage('Opponent joined! Game begins. Sun goes first.');
    });

    newSocket.on('opponentLeft', () => {
      setMessage('Your opponent left the cosmic realm. You achieve victory by default!');
      setGameStatus('ended');
      setWinner(playerSymbol);
      handleGameEnd(playerSymbol, board, true);
    });

    // Error handling
    newSocket.on('error', (errorMessage) => {
      console.error('Socket error:', errorMessage);
      setMessage(`Error: ${errorMessage}`);
    });

    // Cleanup on component unmount
    return () => {
      newSocket.disconnect();
      console.log('Disconnected from multiplayer server');
    };
  }, [gameStatus, playerSymbol]);

  // Handle game end
  const handleGameEnd = async (gameWinner, finalBoard, opponentLeft = false) => {
    const result = calculateWinner(finalBoard);
    if (result || isBoardFull(finalBoard) || opponentLeft) {
      setWinner(gameWinner);
      if (result) {
        setWinningLine(result.winningLine);
      }
      setGameStatus('ended');
      
      // Update scores
      if (gameWinner === playerSymbol) {
        setScores(prev => ({ ...prev, player1: prev.player1 + 1 }));
        winCountRef.current += 1;
        
        // Award rewards for winning
        try {
          const participationResult = await awardGameReward('marks-of-destiny-multiplayer', 'participation');
          if (participationResult.pointsAwarded > 0) {
            setRewardNotification({
              amount: participationResult.pointsAwarded,
              source: 'Multiplayer Participation'
            });
            setTimeout(() => setRewardNotification(null), 3000);
          }
          
          const winResult = await awardGameReward('marks-of-destiny-multiplayer', 'win', { 
            isMultiplayer: true,
            opponentLeft: opponentLeft
          });
          
          if (winResult.pointsAwarded > 0) {
            setTimeout(() => {
              setRewardNotification({
                amount: winResult.pointsAwarded,
                source: `Multiplayer Victory${opponentLeft ? ' (Opponent Left)' : ''}!`
              });
              setTimeout(() => setRewardNotification(null), 3000);
            }, 1500);
          }
          
          // Save game session and update points
          try {
            const gameDuration = gameStartTime ? Date.now() - gameStartTime : 0;
            await saveGameScoreAndUpdatePoints({
              gameType: 'MarksOfDestiny',
              score: 1, // Win = 1, Loss = 0
              pointsEarned: 20,
              duration: gameDuration,
              completed: true,
              gameData: {
                gameMode: 'multiplayer',
                winner: gameWinner,
                finalBoard: board,
                opponentLeft: opponentLeft || false
              }
            });
          } catch (error) {
            console.error('Error saving multiplayer game session:', error);
            // Fallback to legacy points
            addPoints(20);
          }
          
          saveStats({ 
            gamesWon: 1,
            pointsEarned: 20
          });
        } catch (error) {
          console.error('Error awarding multiplayer win rewards:', error);
        }
      } else if (gameWinner === null) {
        // Draw
        setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
        try {
          const participationResult = await awardGameReward('marks-of-destiny-multiplayer', 'participation');
          if (participationResult.pointsAwarded > 0) {
            setRewardNotification({
              amount: participationResult.pointsAwarded,
              source: 'Multiplayer Participation (Draw)'
            });
            setTimeout(() => setRewardNotification(null), 3000);
          }
        } catch (error) {
          console.error('Error awarding participation reward:', error);
        }
      } else {
        // Loss
        setScores(prev => ({ ...prev, player2: prev.player2 + 1 }));
        try {
          const participationResult = await awardGameReward('marks-of-destiny-multiplayer', 'participation');
          if (participationResult.pointsAwarded > 0) {
            setRewardNotification({
              amount: participationResult.pointsAwarded,
              source: 'Multiplayer Participation'
            });
            setTimeout(() => setRewardNotification(null), 3000);
          }
        } catch (error) {
          console.error('Error awarding participation reward:', error);
        }
      }
      
      // Save game to history
      setTimeout(() => {
        saveGameToHistory(gameWinner);
      }, 100);
    }
  };

  // Save game to history
  const saveGameToHistory = (gameWinner) => {
    try {
      const newGameEntry = {
        id: Date.now(),
        board: JSON.parse(JSON.stringify(board)),
        winner: gameWinner,
        isMultiplayer: true,
        opponentName: opponentName || 'Anonymous Mystic',
        date: new Date().toISOString()
      };
      
      const updatedHistory = [...gameHistory, newGameEntry];
      setGameHistory(updatedHistory);
      
      const winCount = updatedHistory.filter(game => game.winner === playerSymbol).length;
      const winPercentage = updatedHistory.length > 0 
        ? Math.round((winCount / updatedHistory.length) * 100)
        : 0;
      
      setTimeout(() => {
        saveProgress({ 
          progress: winPercentage, 
          history: updatedHistory 
        });
      }, 200);
    } catch (error) {
      console.error('Error saving multiplayer game to history:', error);
    }
  };

  // Handle cell click
  const handleCellClick = (index) => {
    if (!socket || board[index] || !isMyTurn || gameStatus !== 'playing') {
      return;
    }
    
    console.log(`Making move at index ${index}`);
    socket.emit('makeMove', { roomId, index, player: playerSymbol });
  };

  // Create room
  const handleCreateRoom = () => {
    if (!room.trim()) {
      setMessage('Please enter a room name');
      return;
    }
    setGameStatus('waiting');
  };

  // Join room
  const handleJoinRoom = () => {
    if (!room.trim()) {
      setMessage('Please enter a room name');
      return;
    }
    setGameStatus('waiting');
  };

  // Start new game
  const startNewGame = () => {
    if (socket && roomId) {
      socket.emit('requestNewGame', { roomId });
    }
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine([]);
    setGameStatus('playing');
    setMessage('New game started!');
  };

  // Leave room
  const leaveRoom = () => {
    if (socket) {
      socket.disconnect();
    }
    setGameStatus('setup');
    setRoomId('');
    setRoom('');
    setPlayerSymbol('');
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine([]);
    setMessage('');
  };

  // Handle back button
  const handleBack = () => {
    if (gameStatus === 'playing') {
      if (window.confirm('Are you sure you want to leave the multiplayer game?')) {
        leaveRoom();
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
        title="Marks of Destiny - Multiplayer"
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
        title="Marks of Destiny - Multiplayer"
        gameType="board"
        onBackClick={handleBack}
      >
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-20 h-20 bg-deepLapisLight rounded-full flex items-center justify-center mb-4">
            <Icon name="lock" size={32} color="#DAA520" />
          </div>
          <h2 className="text-xl font-primary text-royalGold mb-2">Multiplayer Locked</h2>
          <p className="text-white/70 max-w-md mb-6">
            Master the single-player realm first to unlock the cosmic battles against other seekers.
          </p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/games/marks-of-destiny')}
          >
            Play Single Player
          </Button>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout 
      title="Marks of Destiny - Multiplayer"
      gameType="board"
      onBackClick={handleBack}
      backgroundPattern="geometric"
    >
      <div className="flex flex-col items-center w-full max-w-md mx-auto h-full">
        {/* Game setup */}
        {gameStatus === 'setup' && (
          <>
            <GameMasteryDisplay gameId="marks-of-destiny-multiplayer" />
            
            <motion.div 
              className="w-full text-center py-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl font-primary text-royalGold mb-3">Cosmic Duel</h1>
              <p className="text-white/80 mb-6">
                Challenge another seeker in the mystical realm of Marks of Destiny
              </p>
              
              <div className="space-y-4 mb-6">
                <input 
                  type="text" 
                  placeholder="Enter Cosmic Realm Name" 
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full px-4 py-3 bg-deepLapisLight/50 border border-royalGold/30 rounded-md text-white placeholder-white/50 focus:outline-none focus:border-royalGold"
                />
                
                <div className="flex space-x-3">
                  <Button 
                    variant="primary" 
                    fullWidth
                    icon={<Icon name="star" size={18} />}
                    onClick={handleCreateRoom}
                    disabled={!room.trim()}
                  >
                    Create Realm
                  </Button>
                  <Button 
                    variant="secondary" 
                    fullWidth
                    icon={<Icon name="profile" size={18} />}
                    onClick={handleJoinRoom}
                    disabled={!room.trim()}
                  >
                    Join Realm
                  </Button>
                </div>
              </div>
              
              <div className="p-3 rounded-md bg-deepLapisLight/50 text-sm text-white/70">
                <p>
                  <strong className="text-royalGold">Multiplayer Rules:</strong> Face another seeker in real-time. 
                  First to align three cosmic symbols claims victory and greater rewards!
                </p>
                <p className="mt-2 text-royalGold text-xs">
                  Earn bonus Golden Credits for multiplayer victories!
                </p>
              </div>
            </motion.div>
          </>
        )}
        
        {/* Waiting for opponent */}
        {gameStatus === 'waiting' && (
          <motion.div 
            className="w-full text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6">
              <div className="animate-spin w-16 h-16 border-4 border-royalGold border-t-transparent rounded-full mx-auto mb-4" />
              <h2 className="text-xl font-primary text-royalGold mb-2">
                {connectionStatus === 'connecting' ? 'Connecting to Cosmic Realm...' : 'Awaiting Worthy Opponent'}
              </h2>
              <p className="text-white/70 mb-4">
                {roomId ? `Realm: ${roomId}` : 'Establishing connection...'}
              </p>
              <p className="text-white/50 text-sm">
                Share the realm name with another seeker to begin the cosmic duel
              </p>
            </div>
            
            <Button 
              variant="outline" 
              onClick={leaveRoom}
              icon={<Icon name="arrow" size={18} />}
            >
              Leave Realm
            </Button>
          </motion.div>
        )}
        
        {/* Game board */}
        {(gameStatus === 'playing' || gameStatus === 'ended') && (
          <motion.div 
            className="w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Score display */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-center py-1 px-3 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">
                  {playerSymbol === 'X' ? 'You (Sun)' : 'You (Moon)'}
                </p>
                <p className="text-lg text-royalGold">{scores.player1}</p>
              </div>
              
              <div className="text-center">
                <h2 className="text-lg font-primary text-white mb-1">
                  {gameStatus === 'playing' && (
                    isMyTurn ? 'Your Turn' : 'Opponent\'s Turn'
                  )}
                  {gameStatus === 'ended' && winner && (
                    winner === playerSymbol ? 'Victory!' : 'Defeat'
                  )}
                  {gameStatus === 'ended' && !winner && 'Cosmic Balance'}
                </h2>
                <p className="text-xs text-white/50">
                  {roomId && `Realm: ${roomId}`}
                </p>
              </div>
              
              <div className="text-center py-1 px-3 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">
                  {playerSymbol === 'X' ? 'Opponent (Moon)' : 'Opponent (Sun)'}
                </p>
                <p className="text-lg text-mysticalPurple">{scores.player2}</p>
              </div>
            </div>

            {/* Connection status */}
            {connectionStatus !== 'connected' && (
              <div className="mb-4 p-2 bg-red-500/20 border border-red-500/50 rounded-md text-center">
                <p className="text-red-300 text-sm">
                  {connectionStatus === 'connecting' ? 'Reconnecting...' : 'Connection lost'}
                </p>
              </div>
            )}

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
                  Challenge Again
                </Button>
              )}
              <Button 
                variant={gameStatus === 'ended' ? "outline" : "danger"}
                onClick={leaveRoom}
                icon={<Icon name="arrow" size={18} />}
              >
                {gameStatus === 'ended' ? 'Leave Realm' : 'Abandon Duel'}
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
                {winner === playerSymbol && (
                  <p className="text-royalGold">
                    Your cosmic mastery shines bright! You have achieved victory in the multiplayer realm.
                  </p>
                )}
                {winner && winner !== playerSymbol && (
                  <p className="text-mysticalPurple">
                    Your opponent's wisdom prevailed this time. Reflect and return stronger.
                  </p>
                )}
                {!winner && (
                  <p className="text-white">
                    Perfect balance achieved between both seekers. The cosmic forces honor your equal mastery.
                  </p>
                )}
              </motion.div>
            )}
            
            {/* Status message */}
            {message && (
              <div className="mt-4 p-2 bg-deepLapisLight/30 rounded-md text-center">
                <p className="text-white/80 text-sm">{message}</p>
              </div>
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

export default MultiplayerMarksOfDestiny;