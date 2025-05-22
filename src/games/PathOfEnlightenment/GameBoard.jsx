import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Tile from './Tile';
import Button from '../../components/atoms/Button';
import Icon from '../../components/atoms/Icon';

// Game constants
const GRID_SIZE = 4;
const CELL_GAP = 12;
const EMPTY_GRID = Array(GRID_SIZE * GRID_SIZE).fill(null);

// Direction vectors
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  RIGHT: { x: 1, y: 0 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
};

const GameBoard = ({ gameOver, onGameOver, onScoreUpdate, onRestart }) => {
  // Add responsive sizing based on viewport
  const [boardSize, setBoardSize] = useState(0);
  
  // Calculate board size based on viewport dimensions
  useEffect(() => {
    const calculateSize = () => {
      // Get the smaller dimension between width and height
      const viewportWidth = Math.min(window.innerWidth - 32, 350); // Account for padding
      const viewportHeight = window.innerHeight - 250; // Account for header and other UI elements
      const availableSize = Math.min(viewportWidth, viewportHeight);
      setBoardSize(availableSize);
    };
    
    calculateSize();
    window.addEventListener('resize', calculateSize);
    return () => window.removeEventListener('resize', calculateSize);
  }, []);
  // Game state
  const [tiles, setTiles] = useState([]);
  const [grid, setGrid] = useState(EMPTY_GRID);
  const [score, setScore] = useState(0);
  const [maxTile, setMaxTile] = useState(2);
  const [gameStarted, setGameStarted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);
  
  // Initialize the game
  useEffect(() => {
    if (!gameOver && !gameStarted) {
      startGame();
    }
  }, [gameOver, gameStarted]);
  
  // Reset the game when gameOver prop changes from true to false (restart)
  useEffect(() => {
    if (gameOver === false && gameEnded) {
      setGameEnded(false);
      startGame();
    }
  }, [gameOver, gameEnded]);
  
  // Update parent component when game ends
  useEffect(() => {
    if (gameEnded && !gameOver) {
      onGameOver(score, maxTile);
    }
  }, [gameEnded, score, maxTile, onGameOver, gameOver]);
  
  // Update parent component when score changes
  useEffect(() => {
    if (gameStarted && !gameEnded) {
      onScoreUpdate(score, maxTile);
    }
  }, [score, maxTile, gameStarted, gameEnded, onScoreUpdate]);
  
  // Start a new game
  const startGame = () => {
    const emptyGrid = Array(GRID_SIZE * GRID_SIZE).fill(null);
    setGrid(emptyGrid);
    setTiles([]);
    setScore(0);
    setMaxTile(2);
    setGameStarted(true);
    setGameEnded(false);
    
    // Add initial tiles
    addRandomTile(emptyGrid, []);
    addRandomTile(emptyGrid, []);
  };
  
  // Get available cells (positions where grid is null)
  const getAvailableCells = (currentGrid) => {
    const cells = [];
    currentGrid.forEach((cell, index) => {
      if (cell === null) {
        cells.push(index);
      }
    });
    return cells;
  };
  
  // Add a random tile to the grid
  const addRandomTile = (currentGrid, currentTiles) => {
    const availableCells = getAvailableCells(currentGrid);
    if (availableCells.length === 0) return false;
    
    // Get random available cell
    const cellIndex = availableCells[Math.floor(Math.random() * availableCells.length)];
    
    // 90% chance for 2, 10% chance for 4
    const value = Math.random() < 0.9 ? 2 : 4;
    
    // Create new tile
    const newTile = {
      id: `tile_${Date.now()}_${cellIndex}`,
      value,
      position: cellIndex,
      isNew: true,
      merged: false
    };
    
    // Update grid and tiles
    const newGrid = [...currentGrid];
    newGrid[cellIndex] = value;
    
    setGrid(newGrid);
    setTiles(prevTiles => [...prevTiles, newTile]);
    
    return true;
  };
  
  // Check if there are any possible moves left
  const hasAvailableMoves = (currentGrid) => {
    // Check for empty cells
    if (getAvailableCells(currentGrid).length > 0) return true;
    
    // Check for possible merges
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const index = i * GRID_SIZE + j;
        const value = currentGrid[index];
        
        // Check right neighbor
        if (j < GRID_SIZE - 1 && value === currentGrid[index + 1]) {
          return true;
        }
        
        // Check bottom neighbor
        if (i < GRID_SIZE - 1 && value === currentGrid[index + GRID_SIZE]) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  // Convert 1D index to 2D coordinates
  const indexToCoordinates = (index) => {
    return {
      x: index % GRID_SIZE,
      y: Math.floor(index / GRID_SIZE)
    };
  };
  
  // Convert 2D coordinates to 1D index
  const coordinatesToIndex = (x, y) => {
    return y * GRID_SIZE + x;
  };
  
  // Move tiles in a direction
  const moveTiles = useCallback((direction) => {
    if (isAnimating || gameEnded) return;
    setIsAnimating(true);
    
    let moved = false;
    let newScore = score;
    let newMaxTile = maxTile;
    const newGrid = [...grid];
    let newTiles = [...tiles];
    
    // Mark all tiles as not merged for this move
    newTiles = newTiles.map(tile => ({ ...tile, merged: false, isNew: false }));
    
    // Ensure tile positions match the grid values (fix for stuck tiles)
    // This validation step ensures our grid and tile states are in sync
    const validatedTiles = [];
    for (let i = 0; i < newGrid.length; i++) {
      const value = newGrid[i];
      if (value !== null) {
        // Find matching tile at this position
        const existingTile = newTiles.find(t => t.position === i);
        if (existingTile) {
          // Make sure value matches
          if (existingTile.value !== value) {
            existingTile.value = value; // Fix inconsistency
          }
          validatedTiles.push(existingTile);
        } else {
          // Create a new tile if one doesn't exist (recovery mechanism)
          validatedTiles.push({
            id: `tile_recovery_${Date.now()}_${i}`,
            value,
            position: i,
            isNew: false,
            merged: false
          });
        }
      }
    }
    
    // Replace the tiles array with our validated version
    newTiles = validatedTiles;
    
    // Determine traversal order based on direction
    // We need to process tiles in the right order to avoid blocking moves
    const traversals = { x: [], y: [] };
    
    for (let i = 0; i < GRID_SIZE; i++) {
      traversals.x.push(i);
      traversals.y.push(i);
    }
    
    // Always traverse from the farthest cell in the direction
    if (direction === DIRECTIONS.RIGHT) traversals.x = traversals.x.reverse();
    if (direction === DIRECTIONS.DOWN) traversals.y = traversals.y.reverse();
    
    // Create a move tracking map to handle multiple tiles moving to the same position
    const moveTracker = new Map();
    
    // Process each cell
    traversals.y.forEach(y => {
      traversals.x.forEach(x => {
        const index = coordinatesToIndex(x, y);
        const value = newGrid[index];
        
        // Skip empty cells
        if (value === null) return;
        
        // Find the farthest available position in the direction
        let newX = x;
        let newY = y;
        let nextX = newX + direction.x;
        let nextY = newY + direction.y;
        
        // Keep moving while in bounds and cell is empty
        while (
          nextX >= 0 && nextX < GRID_SIZE &&
          nextY >= 0 && nextY < GRID_SIZE &&
          newGrid[coordinatesToIndex(nextX, nextY)] === null
        ) {
          newX = nextX;
          newY = nextY;
          nextX = newX + direction.x;
          nextY = newY + direction.y;
        }
        
        // Check if we can merge with the next tile
        if (
          nextX >= 0 && nextX < GRID_SIZE &&
          nextY >= 0 && nextY < GRID_SIZE &&
          newGrid[coordinatesToIndex(nextX, nextY)] === value &&
          !moveTracker.has(coordinatesToIndex(nextX, nextY)) // Check if target hasn't been used in a merge yet
        ) {
          // Get the next position for merge
          newX = nextX;
          newY = nextY;
          
          // Get the new position index
          const newIndex = coordinatesToIndex(newX, newY);
          
          // Double the value for merge
          const mergedValue = value * 2;
          
          // Update max tile value if needed
          if (mergedValue > newMaxTile) {
            newMaxTile = mergedValue;
          }
          
          // Update score
          newScore += mergedValue;
          
          // Update grid
          newGrid[index] = null;
          newGrid[newIndex] = mergedValue;
          
          // Find the tile to move and the target tile to merge with
          const tileToMove = newTiles.find(t => t.position === index);
          const targetTile = newTiles.find(t => t.position === newIndex);
          
          if (tileToMove && targetTile) {
            // Mark the target tile as merged
            targetTile.merged = true;
            targetTile.value = mergedValue;
            
            // Remove the moved tile
            newTiles = newTiles.filter(t => t.id !== tileToMove.id);
            
            // Mark this position as used in a merge for this move
            moveTracker.set(newIndex, true);
          }
          
          moved = true;
        } else if (newX !== x || newY !== y) {
          // Move to the farthest available cell
          const newIndex = coordinatesToIndex(newX, newY);
          
          // Update grid
          newGrid[newIndex] = value;
          newGrid[index] = null;
          
          // Update tile position
          const tileToMove = newTiles.find(t => t.position === index);
          if (tileToMove) {
            tileToMove.position = newIndex;
          } else {
            // Recovery for missing tile - shouldn't normally happen but helps prevent stuck tiles
            const newTile = {
              id: `tile_recovery_${Date.now()}_${newIndex}`,
              value,
              position: newIndex,
              isNew: false,
              merged: false
            };
            newTiles.push(newTile);
          }
          
          moved = true;
        }
      });
    });
    
    // Double-check for data consistency
    // Make sure every non-null grid cell has a corresponding tile
    for (let i = 0; i < newGrid.length; i++) {
      if (newGrid[i] !== null) {
        const hasTile = newTiles.some(t => t.position === i);
        if (!hasTile) {
          // If somehow a grid position has a value but no tile,
          // create a recovery tile to maintain consistency
          newTiles.push({
            id: `tile_fix_${Date.now()}_${i}`,
            value: newGrid[i],
            position: i,
            isNew: false,
            merged: false
          });
        }
      }
    }
    
    // If tiles moved, add a new random tile
    if (moved) {
      // Update state
      setGrid(newGrid);
      setTiles(newTiles);
      setScore(newScore);
      setMaxTile(newMaxTile);
      
      // Add a new random tile with a slight delay
      setTimeout(() => {
        addRandomTile(newGrid, newTiles);
        
        // Check for game over
        if (!hasAvailableMoves(newGrid)) {
          setGameEnded(true);
        }
        
        setIsAnimating(false);
      }, 150);
    } else {
      setIsAnimating(false);
    }
  }, [grid, isAnimating, score, tiles, maxTile, gameEnded]);
  
  // Handle key down events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
          moveTiles(DIRECTIONS.UP);
          e.preventDefault();
          break;
        case 'ArrowRight':
          moveTiles(DIRECTIONS.RIGHT);
          e.preventDefault();
          break;
        case 'ArrowDown':
          moveTiles(DIRECTIONS.DOWN);
          e.preventDefault();
          break;
        case 'ArrowLeft':
          moveTiles(DIRECTIONS.LEFT);
          e.preventDefault();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveTiles, gameOver]);
  
  // Touch event handlers for swipe gestures
  const handleTouchStart = (e) => {
    if (gameOver) return;
    
    // Prevent default to stop page scrolling
    e.preventDefault();
    
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY
    });
  };
  
  const handleTouchEnd = (e) => {
    if (!touchStart || gameOver) return;
    
    // Prevent default to stop page scrolling
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    
    // Determine swipe direction (require minimum distance of 30px)
    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 0) {
          moveTiles(DIRECTIONS.RIGHT);
        } else {
          moveTiles(DIRECTIONS.LEFT);
        }
      } else {
        // Vertical swipe
        if (dy > 0) {
          moveTiles(DIRECTIONS.DOWN);
        } else {
          moveTiles(DIRECTIONS.UP);
        }
      }
    }
    
    setTouchStart(null);
  };
  
  // Render cell backgrounds
  const renderCells = () => {
    const cells = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const { x, y } = indexToCoordinates(i);
      cells.push(
        <div
          key={`cell-${i}`}
          className="bg-deepLapisLight/50 rounded-md"
          style={{
            width: `calc(25% - ${CELL_GAP}px)`,
            height: `calc(25% - ${CELL_GAP}px)`,
            position: 'absolute',
            left: `calc(25% * ${x} + ${CELL_GAP/2}px)`,
            top: `calc(25% * ${y} + ${CELL_GAP/2}px)`,
          }}
        />
      );
    }
    return cells;
  };
  
  // Render tiles
  const renderTiles = () => {
    return tiles.map((tile) => {
      const { x, y } = indexToCoordinates(tile.position);
      return (
        <Tile
          key={tile.id}
          value={tile.value}
          x={x}
          y={y}
          isNew={tile.isNew}
          merged={tile.merged}
        />
      );
    });
  };
  
  return (
    <div 
      className="flex flex-col items-center" 
      onTouchMove={(e) => e.preventDefault()} // Prevent scrolling during game interaction
    >
      <div 
        className="relative bg-deepLapis/50 p-2 rounded-lg border border-royalGold/30"
        style={{
          width: `${boardSize}px`,
          height: `${boardSize}px`,
          maxWidth: '100%',
          margin: '0 auto'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Cell backgrounds */}
        {renderCells()}
        
        {/* Tiles */}
        {renderTiles()}
        
        {/* Game over overlay */}
        {gameEnded && !gameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-deepLapis/90 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl text-royalGold font-primary mb-2">
              {maxTile >= 2048 ? 'Enlightenment!' : 'Board Filled'}
            </h3>
            <p className="text-white text-center mb-4">
              {maxTile >= 2048
                ? 'You have reached true enlightenment!'
                : 'You must play again.'}
            </p>
            <Button
              variant="primary"
              onClick={onRestart}
              icon={<Icon name="game" size={16} />}
            >
              Try Again
            </Button>
          </motion.div>
        )}
      </div>
      
      {/* Game controls */}
      <div className="mt-3 flex justify-center space-x-4">
        <p className="text-white/70 text-sm">
          Use <span className="text-royalGold">arrow keys</span> or <span className="text-royalGold">swipe</span> to move tiles
        </p>
      </div>
      
      {/* Instructions */}
      <div className="mt-2 p-2 bg-deepLapisLight/30 rounded-lg w-full" style={{ maxWidth: `${boardSize}px` }}>
        <p className="text-xs text-white/70 text-center">
          Join the sacred patterns to achieve enlightenment. Reach the 2048 tile to complete your journey.
        </p>
      </div>
    </div>
  );
};

export default GameBoard;