import React from 'react';
import { motion } from 'framer-motion';
import GameCard from '../molecules/GameCard';
import Icon from '../atoms/Icon';

const GameGrid = ({ 
  games, 
  onGameSelect, 
  loading = false,
  emptyMessage = "No games available",
  className = ""
}) => {
  // Handle loading state
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="w-12 h-12 rounded-full border-2 border-t-transparent border-royalGold animate-spin mb-4" />
        <p className="text-white/70">Loading games...</p>
      </div>
    );
  }
  
  // Handle empty state
  if (!games || games.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="w-16 h-16 rounded-full bg-deepLapisLight/30 flex items-center justify-center mb-4">
          <Icon name="game" size={24} color="#FFFFFF" />
        </div>
        <p className="text-white/70">{emptyMessage}</p>
      </div>
    );
  }
  
  // Animation variants for container
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ${className}`}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          onClick={() => onGameSelect(game)}
        />
      ))}
    </motion.div>
  );
};

export default GameGrid;