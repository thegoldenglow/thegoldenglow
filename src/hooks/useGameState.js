import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';

/**
 * Custom hook for managing game state for a specific game
 * @param {string} gameId - The ID of the game
 * @returns {Object} Game state and methods
 */
const useGameState = (gameId) => {
  const { 
    games, 
    isLoading: loading, 
    getGame,
    updateGameProgress,
    updateGameStats
  } = useGame();
  
  const [gameState, setGameState] = useState({
    initialized: false,
    gameData: null,
    isUnlocked: false,
    progress: 0,
    stats: {},
    gameSpecificState: {},
    error: null,
    lastSaved: null
  });
  
  // Initialize the game state
  useEffect(() => {
    if (loading || !gameId || gameState.initialized) return;
    
    try {
      const game = getGame(gameId);
      if (!game) {
        throw new Error(`Game with ID ${gameId} not found`);
      }
      
      // Use the game object directly from getGame
      const isUnlocked = game.unlocked;
      const progress = game.progress;
      const stats = game.stats || {};
      
      setGameState(prev => ({
        ...prev,
        initialized: true,
        gameData: game,
        isUnlocked,
        progress,
        stats,
        error: null
      }));
      
    } catch (error) {
      console.error('Error initializing game state:', error);
      setGameState(prev => ({
        ...prev,
        initialized: true,
        error: error.message
      }));
    }
  }, [gameId, loading, gameState.initialized, getGame]);
  
  // Update local game state
  const updateLocalState = useCallback((newState) => {
    setGameState(prev => ({
      ...prev,
      gameSpecificState: {
        ...prev.gameSpecificState,
        ...newState
      },
      lastSaved: Date.now()
    }));
  }, []);
  
  // Save progress
  const saveProgress = useCallback((progressData) => {
    if (!gameId || !gameState.initialized) return;
    
    try {
      // Handle both object format and direct number format
      const progress = typeof progressData === 'object' ? progressData.progress : progressData;
      
      // Deep clone history if provided to prevent reference issues
      let historyToSave;
      if (typeof progressData === 'object' && progressData.history) {
        try {
          historyToSave = JSON.parse(JSON.stringify(progressData.history));
        } catch (cloneError) {
          console.error('Error cloning history:', cloneError);
          // Fallback to simple spread if JSON stringify/parse fails
          historyToSave = [...progressData.history];
        }
      }
      
      // Update progress in context first with a safe clone
      const updateData = {
        progress: progress,
        ...(historyToSave ? { history: historyToSave } : {})
      };
      
      // Use timeout to avoid race conditions with other state updates
      setTimeout(() => {
        try {
          updateGameProgress(gameId, updateData);
          
          // Then update local state with stable references
          setGameState(prev => ({
            ...prev,
            progress: progress,
            gameData: {
              ...prev.gameData,
              ...(historyToSave ? { history: historyToSave } : {})
            },
            lastSaved: Date.now()
          }));
        } catch (innerError) {
          console.error('Error in progress update timeout:', innerError);
        }
      }, 50);
    } catch (error) {
      console.error('Error saving game progress:', error);
    }
  }, [gameId, gameState.initialized, updateGameProgress]);
  
  // Save stats
  const saveStats = useCallback((statsUpdate) => {
    if (!gameId || !gameState.initialized) return;
    
    // Update stats in context
    updateGameStats(gameId, statsUpdate);
    
    // Update local state
    setGameState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        ...statsUpdate
      },
      lastSaved: Date.now()
    }));
  }, [gameId, gameState.initialized, updateGameStats]);
  
  // Reset game state
  const resetGameState = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gameSpecificState: {},
      lastSaved: Date.now()
    }));
  }, []);
  
  // Get full game state
  const getFullState = useCallback(() => {
    return {
      gameId,
      gameData: gameState.gameData,
      isUnlocked: gameState.isUnlocked,
      progress: gameState.progress,
      stats: gameState.stats,
      ...gameState.gameSpecificState
    };
  }, [gameId, gameState]);
  
  // Load saved state (for resuming games)
  const loadSavedState = useCallback(() => {
    // In a real implementation, this would load state from storage/backend
    // For now, just return the current state
    return gameState.gameSpecificState;
  }, [gameState.gameSpecificState]);
  
  return {
    loading: loading || !gameState.initialized,
    error: gameState.error,
    gameData: gameState.gameData,
    isUnlocked: gameState.isUnlocked,
    progress: gameState.progress,
    stats: gameState.stats,
    updateLocalState,
    saveProgress,
    saveStats,
    resetGameState,
    getFullState,
    loadSavedState,
    lastSaved: gameState.lastSaved
  };
};

export default useGameState;