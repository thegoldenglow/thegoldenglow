import React from 'react';
import { motion } from 'framer-motion';
import Cell from './Cell';

const Board = ({ squares, winningLine = [], onClick }) => {
  // Animation variants
  const boardVariants = {
    initial: {
      opacity: 0,
      scale: 0.95
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.05
      }
    }
  };

  // Generate the board grid
  const renderBoard = () => {
    return (
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto">
        {squares.map((value, index) => {
          const isWinningCell = winningLine.includes(index);
          return (
            <Cell
              key={index}
              value={value}
              isWinning={isWinningCell}
              onClick={() => onClick(index)}
            />
          );
        })}
      </div>
    );
  };

  // Render decorative elements and the board
  return (
    <div className="relative">
      {/* Sacred geometry background pattern */}
      <div className="absolute inset-0 -z-10 opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 300 300">
          <circle cx="150" cy="150" r="145" stroke="#DAA520" strokeWidth="1" fill="none" />
          <circle cx="150" cy="150" r="120" stroke="#DAA520" strokeWidth="1" fill="none" />
          <line x1="5" y1="150" x2="295" y2="150" stroke="#DAA520" strokeWidth="1" />
          <line x1="150" y1="5" x2="150" y2="295" stroke="#DAA520" strokeWidth="1" />
          <line x1="25" y1="25" x2="275" y2="275" stroke="#DAA520" strokeWidth="1" />
          <line x1="25" y1="275" x2="275" y2="25" stroke="#DAA520" strokeWidth="1" />
        </svg>
      </div>

      {/* Game board with animations */}
      <motion.div
        className="relative z-10"
        variants={boardVariants}
        initial="initial"
        animate="animate"
      >
        <div className="p-4 bg-deepLapisLight/30 rounded-lg border border-royalGold/50 shadow-lg">
          {renderBoard()}
        </div>
      </motion.div>
      
      {/* Glowing effect for active game */}
      <div className="absolute inset-0 -z-10 blur-lg opacity-20 bg-royalGold rounded-full"></div>
    </div>
  );
};

export default Board;