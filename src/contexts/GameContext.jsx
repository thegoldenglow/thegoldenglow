import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unlockInProgress, setUnlockInProgress] = useState(false);

  // Define game data - in a real app, this would come from an API
  const gameData = [
    {
      id: 'marks-of-destiny',
      name: 'Marks of Destiny',
      description: 'A strategic board game where you place sacred symbols to claim territory and unlock ancient wisdom.',
      icon: 'game',
      category: 'strategy',
      unlocked: true, // Always unlocked as the first game
      progress: 0,
      minPoints: 0,
      gcCost: 0, // No cost - always unlocked
      image: '/assets/Marks of Destiny Animation.webp',
      stats: {
        timesPlayed: 0,
        highestScore: 0,
        winsAgainstAI: 0
      }
    },
    {
      id: 'path-of-enlightenment',
      name: 'Path of Enlightenment',
      description: 'Combine mystical tiles to reach enlightenment in this challenging puzzle game inspired by 2048.',
      icon: 'puzzle',
      category: 'puzzle',
      unlocked: false, // Locked - requires GC to unlock
      progress: 0,
      minPoints: 50,
      gcCost: 100, // Cost in Golden Credits to unlock
      image: '/assets/Path of Enlightenment Animation.webp',
      stats: {
        timesPlayed: 0,
        highestScore: 0,
        highestTile: 0
      }
    },
    {
      id: 'flame-of-wisdom',
      name: 'Flame of Wisdom',
      description: 'Nurture an eternal flame through rhythmic tapping to gather wisdom points and spiritual insights.',
      icon: 'flame',
      category: 'clicker',
      unlocked: false, // Locked - requires GC to unlock
      progress: 0,
      minPoints: 100,
      gcCost: 250, // Cost in Golden Credits to unlock
      image: '/assets/Flame of Wisdom.webp',
      stats: {
        totalTaps: 0,
        wisdomGained: 0,
        highestFlameLevel: 0
      }
    },
    {
      id: 'sacred-tapping',
      name: 'Sacred Tapping',
      description: 'Tap celestial patterns in perfect harmony to unlock cosmic wisdom and maintain balance.',
      icon: 'music',
      category: 'rhythm',
      unlocked: false, // Locked - requires GC to unlock
      progress: 0,
      minPoints: 200,
      gcCost: 500, // Cost in Golden Credits to unlock
      image: '/assets/Sacred Tapping.webp',
      stats: {
        perfectTaps: 0,
        highestCombo: 0,
        highestScore: 0
      }
    },
    {
      id: 'gates-of-knowledge',
      name: 'Gates of Knowledge',
      description: 'Answer questions from ancient Persian and Arabic philosophers to unlock wisdom and understanding.',
      icon: 'book',
      category: 'quiz',
      unlocked: false, // Locked - requires GC to unlock
      progress: 0,
      minPoints: 300,
      gcCost: 750, // Cost in Golden Credits to unlock
      image: '/assets/Gates of Knowledge.webp',
      stats: {
        questionsAnswered: 0,
        questionsCorrect: 0,
        wisdomEarned: 0
      }
    },
    {
      id: 'mystical-tap-journey',
      name: 'Mystical Tap Journey',
      description: 'Travel the ancient Silk Road through rhythmic tapping, visiting historic cities and gathering wisdom.',
      icon: 'map',
      category: 'journey',
      unlocked: false, // Locked - requires GC to unlock
      progress: 0,
      minPoints: 500,
      gcCost: 1000, // Cost in Golden Credits to unlock
      image: '/assets/Mystical Tap Journey.webp',
      stats: {
        journeysCompleted: 0,
        citiesVisited: 0,
        totalDistance: 0
      }
    }
  ];

  // Load games data
  const loadGames = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // For development purposes, unlock all games
      const devModeEnabled = true; // Toggle this to enable/disable all games being unlocked
      
      if (devModeEnabled) {
        // Create a copy of gameData with all games unlocked
        const unlockedGameData = gameData.map(game => ({
          ...game,
          unlocked: true // Set all games to unlocked for testing
        }));
        
        // Save the unlocked games to localStorage
        localStorage.setItem('gg_games', JSON.stringify(unlockedGameData));
        setGames(unlockedGameData);
        console.log('DEV MODE: All games unlocked for testing');
      } else {
        // Load games from localStorage or use default game data
        const savedGames = localStorage.getItem('gg_games');
        if (savedGames) {
          setGames(JSON.parse(savedGames));
        } else {
          // No saved games, use default data
          localStorage.setItem('gg_games', JSON.stringify(gameData));
          setGames(gameData);
        }
      }
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get a specific game by ID
  const getGame = useCallback((id) => {
    return games.find(game => game.id === id) || null;
  }, [games]);

  // Update game progress
  const updateGameProgress = useCallback((gameId, progressData) => {
    try {
      setGames(prevGames => {
        // First find the game to update
        const gameToUpdate = prevGames.find(game => game.id === gameId);
        if (!gameToUpdate) return prevGames; // Game not found
        
        // Create a new updated game object with stable references
        let updatedGame;
        
        // Handle both object and number formats
        if (typeof progressData === 'object') {
          const progress = progressData.progress !== undefined ? 
            Math.max(gameToUpdate.progress, progressData.progress) : gameToUpdate.progress;
          
          updatedGame = {
            ...gameToUpdate,
            progress,
            ...(progressData.history ? { history: [...progressData.history] } : {})
          };
        } else {
          updatedGame = {
            ...gameToUpdate,
            progress: Math.max(gameToUpdate.progress, progressData) // only update if new progress is higher
          };
        }
        
        // Create a new games array with the updated game
        const updatedGames = prevGames.map(game => 
          game.id === gameId ? updatedGame : game
        );
        
        // Save to localStorage
        try {
          localStorage.setItem('gg_games', JSON.stringify(updatedGames));
        } catch (e) {
          console.error('Error saving games to localStorage:', e);
        }
        
        return updatedGames;
      });
    } catch (error) {
      console.error('Error in updateGameProgress:', error);
    }
  }, []);

  // Update game stats
  const updateGameStats = useCallback((gameId, stats) => {
    try {
      setGames(prevGames => {
        // Find the game to update
        const gameToUpdate = prevGames.find(game => game.id === gameId);
        if (!gameToUpdate) return prevGames; // Game not found
        
        // Create a new updated game object with stable references
        const updatedGame = {
          ...gameToUpdate,
          stats: {
            ...gameToUpdate.stats,
            ...stats
          }
        };
        
        // Create a new games array with the updated game
        const updatedGames = prevGames.map(game => 
          game.id === gameId ? updatedGame : game
        );
        
        // Save to localStorage
        try {
          localStorage.setItem('gg_games', JSON.stringify(updatedGames));
        } catch (e) {
          console.error('Error saving games to localStorage:', e);
        }
        
        return updatedGames;
      });
    } catch (error) {
      console.error('Error in updateGameStats:', error);
    }
  }, []);

  // Check if a game is unlocked based on points
  const checkGameUnlock = useCallback((userPoints) => {
    setGames(prevGames => {
      const updatedGames = prevGames.map(game => {
        // Update unlock status based on points requirement
        if (!game.unlocked && userPoints >= game.minPoints) {
          return { ...game, unlocked: true };
        }
        return game;
      });
      
      localStorage.setItem('gg_games', JSON.stringify(updatedGames));
      return updatedGames;
    });
  }, []);

  // Get game state for a specific game
  const useGameState = (gameId) => {
    const [gameState, setGameState] = useState({
      gameData: null,
      isUnlocked: false,
      loading: true
    });

    useEffect(() => {
      const loadGameState = async () => {
        try {
          // Find the game
          const game = games.find(g => g.id === gameId);
          
          if (game) {
            setGameState({
              gameData: game,
              isUnlocked: game.unlocked,
              loading: false
            });
          } else {
            setGameState({
              gameData: null,
              isUnlocked: false,
              loading: false
            });
          }
        } catch (error) {
          console.error(`Error loading game state for ${gameId}:`, error);
          setGameState({
            gameData: null,
            isUnlocked: false,
            loading: false
          });
        }
      };

      loadGameState();
    }, [gameId, games]);

    // Helper functions for the game
    const saveProgress = (progress) => {
      updateGameProgress(gameId, progress);
    };

    const saveStats = (stats) => {
      updateGameStats(gameId, stats);
    };

    return {
      ...gameState,
      saveProgress,
      saveStats
    };
  };

  // Unlock a game using Golden Credits
  const unlockGame = useCallback(async (gameId) => {
    try {
      setUnlockInProgress(true);
      
      // Get the game to unlock
      const gameToUnlock = games.find(game => game.id === gameId);
      
      if (!gameToUnlock) {
        console.error(`Game with ID ${gameId} not found`);
        setUnlockInProgress(false);
        return { success: false, error: 'Game not found' };
      }
      
      if (gameToUnlock.unlocked) {
        setUnlockInProgress(false);
        return { success: true, message: 'Game is already unlocked' };
      }
      
      // Update the game's unlocked status
      setGames(prevGames => {
        const updatedGames = prevGames.map(game => 
          game.id === gameId ? { ...game, unlocked: true } : game
        );
        
        // Save to localStorage
        try {
          localStorage.setItem('gg_games', JSON.stringify(updatedGames));
        } catch (e) {
          console.error('Error saving games to localStorage:', e);
        }
        
        return updatedGames;
      });
      
      return { success: true, message: 'Game unlocked successfully' };
    } catch (error) {
      console.error('Error unlocking game:', error);
      return { success: false, error: 'Failed to unlock game' };
    } finally {
      setUnlockInProgress(false);
    }
  }, [games]);

  return (
    <GameContext.Provider value={{
      games,
      isLoading,
      unlockInProgress,
      loadGames,
      getGame,
      updateGameProgress,
      updateGameStats,
      checkGameUnlock,
      unlockGame,
      useGameState
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);

export default GameContext;