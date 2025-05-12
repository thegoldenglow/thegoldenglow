// src/utils/gameHelpers.js
/**
 * Game helper utilities for Golden Glow app
 */

/**
 * Calculates the level from experience points
 * @param {number} xp - Experience points
 * @param {number} baseXp - Base XP required for level 1
 * @param {number} growthFactor - How quickly XP requirements increase per level
 * @returns {number} - The calculated level
 */
export const calculateLevelFromXP = (xp, baseXp = 500, growthFactor = 1.5) => {
  if (xp < baseXp) return 1;
  
  let level = 1;
  let totalXpRequired = baseXp;
  
  while (xp >= totalXpRequired) {
    level++;
    const nextLevelXp = Math.floor(baseXp * Math.pow(growthFactor, level - 1));
    totalXpRequired += nextLevelXp;
  }
  
  return level;
};

/**
 * Calculates XP required for a specific level
 * @param {number} level - The target level
 * @param {number} baseXp - Base XP required for level 1
 * @param {number} growthFactor - How quickly XP requirements increase per level
 * @returns {number} - XP required to reach the specified level
 */
export const calculateXpForLevel = (level, baseXp = 500, growthFactor = 1.5) => {
  if (level <= 1) return 0;
  
  let totalXp = baseXp;
  
  for (let i = 2; i <= level; i++) {
    totalXp += Math.floor(baseXp * Math.pow(growthFactor, i - 1));
  }
  
  return totalXp;
};

/**
 * Checks if a user has earned an achievement
 * @param {Object} stats - User's game statistics
 * @param {Object} achievement - Achievement to check for
 * @returns {boolean} - Whether the achievement is earned
 */
export const checkAchievementEligibility = (stats, achievement) => {
  if (!stats || !achievement?.requirements) return false;
  
  // Check each requirement
  for (const [key, value] of Object.entries(achievement.requirements)) {
    if (!stats[key] || stats[key] < value) {
      return false;
    }
  }
  
  return true;
};

/**
 * Generates a random string ID
 * @param {number} length - Length of the ID
 * @returns {string} - Random ID
 */
export const generateRandomId = (length = 8) => {
  return Math.random().toString(36).substring(2, 2 + length);
};

/**
 * Formats a score or number for display
 * @param {number} number - Number to format
 * @returns {string} - Formatted number string
 */
export const formatNumber = (number) => {
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }
  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }
  return number.toString();
};

/**
 * Formats time in seconds to mm:ss format
 * @param {number} seconds - Seconds to format
 * @returns {string} - Formatted time string
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Fisher-Yates shuffle algorithm for arrays
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
export const shuffleArray = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Determines if a Tic-Tac-Toe board has a winner
 * @param {Array} squares - The game board array
 * @returns {string|null} - Winner symbol or null
 */
export const calculateWinner = (squares) => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return {
        winner: squares[a],
        winningLine: lines[i]
      };
    }
  }
  
  return null;
};

/**
 * Determines if a Tic-Tac-Toe board is full (draw)
 * @param {Array} squares - The game board array
 * @returns {boolean} - Whether the board is full
 */
export const isBoardFull = (squares) => {
  return squares.every(square => square !== null);
};

/**
 * Simple AI for Tic-Tac-Toe
 * @param {Array} squares - Current board state
 * @param {string} playerSymbol - Human player's symbol
 * @param {string} aiSymbol - AI player's symbol
 * @param {string} difficulty - AI difficulty (easy, medium, hard)
 * @returns {number} - Index of AI's move
 */
export const getAiMove = (squares, playerSymbol, aiSymbol, difficulty = 'medium') => {
  // Easy AI: random valid move
  if (difficulty === 'easy') {
    const emptySquares = squares
      .map((square, index) => square === null ? index : null)
      .filter(index => index !== null);
    
    return emptySquares[Math.floor(Math.random() * emptySquares.length)];
  }
  
  // Medium AI: win if possible, block opponent, otherwise random
  if (difficulty === 'medium') {
    // Try to win
    const winMove = findWinningMove(squares, aiSymbol);
    if (winMove !== null) return winMove;
    
    // Block opponent
    const blockMove = findWinningMove(squares, playerSymbol);
    if (blockMove !== null) return blockMove;
    
    // Take center if available
    if (squares[4] === null) return 4;
    
    // Take a corner if available
    const corners = [0, 2, 6, 8].filter(index => squares[index] === null);
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }
    
    // Take any available square
    const emptySquares = squares
      .map((square, index) => square === null ? index : null)
      .filter(index => index !== null);
    
    return emptySquares[Math.floor(Math.random() * emptySquares.length)];
  }
  
  // Hard AI: Minimax algorithm
  if (difficulty === 'hard') {
    return getBestMove(squares, aiSymbol, playerSymbol);
  }
};

/**
 * Finds a winning move for the given symbol
 * @param {Array} squares - Current board state
 * @param {string} symbol - Player symbol to find winning move for
 * @returns {number|null} - Winning move index or null
 */
const findWinningMove = (squares, symbol) => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    // Check if we can win in this line
    if (squares[a] === symbol && squares[b] === symbol && squares[c] === null) {
      return c;
    }
    if (squares[a] === symbol && squares[c] === symbol && squares[b] === null) {
      return b;
    }
    if (squares[b] === symbol && squares[c] === symbol && squares[a] === null) {
      return a;
    }
  }
  
  return null;
};

/**
 * Minimax algorithm for optimal Tic-Tac-Toe play
 * @param {Array} squares - Current board state
 * @param {string} aiPlayer - AI player symbol
 * @param {string} huPlayer - Human player symbol
 * @returns {number} - Best move index
 */
const getBestMove = (squares, aiPlayer, huPlayer) => {
  // Get available moves
  const availableMoves = squares
    .map((square, index) => square === null ? index : null)
    .filter(index => index !== null);
  
  // If no moves available, return null
  if (availableMoves.length === 0) {
    return null;
  }
  
  // Evaluate each available move
  let bestMove;
  let bestScore = -Infinity;
  
  for (const move of availableMoves) {
    // Make the move
    const newSquares = [...squares];
    newSquares[move] = aiPlayer;
    
    // Calculate score using minimax
    const score = minimax(newSquares, 0, false, aiPlayer, huPlayer);
    
    // Update best score and move
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove;
};

/**
 * Minimax algorithm helper function
 * @param {Array} squares - Current board state
 * @param {number} depth - Current recursion depth
 * @param {boolean} isMaximizing - Whether the current player is maximizing
 * @param {string} aiPlayer - AI player symbol
 * @param {string} huPlayer - Human player symbol
 * @returns {number} - Score of the move
 */
const minimax = (squares, depth, isMaximizing, aiPlayer, huPlayer) => {
  // Check for terminal state
  const result = calculateWinner(squares);
  if (result?.winner === aiPlayer) {
    return 10 - depth;
  }
  if (result?.winner === huPlayer) {
    return depth - 10;
  }
  if (isBoardFull(squares)) {
    return 0;
  }
  
  if (isMaximizing) {
    // Maximizing player (AI)
    let bestScore = -Infinity;
    for (let i = 0; i < squares.length; i++) {
      if (squares[i] === null) {
        const newSquares = [...squares];
        newSquares[i] = aiPlayer;
        const score = minimax(newSquares, depth + 1, false, aiPlayer, huPlayer);
        bestScore = Math.max(bestScore, score);
      }
    }
    return bestScore;
  } else {
    // Minimizing player (Human)
    let bestScore = Infinity;
    for (let i = 0; i < squares.length; i++) {
      if (squares[i] === null) {
        const newSquares = [...squares];
        newSquares[i] = huPlayer;
        const score = minimax(newSquares, depth + 1, true, aiPlayer, huPlayer);
        bestScore = Math.min(bestScore, score);
      }
    }
    return bestScore;
  }
};

export default {
  calculateLevelFromXP,
  calculateXpForLevel,
  checkAchievementEligibility,
  generateRandomId,
  formatNumber,
  formatTime,
  shuffleArray,
  calculateWinner,
  isBoardFull,
  getAiMove
};