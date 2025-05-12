import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useGameReward } from '../../contexts/GameRewardContext';
import Icon from '../atoms/Icon';

const GameMasteryDisplay = ({ gameId }) => {
  const { getGameMasteryInfo } = useGameReward();
  const masteryInfo = getGameMasteryInfo(gameId);
  
  // Display nothing if game info couldn't be loaded
  if (!masteryInfo) return null;
  
  const { level, multiplier, progress, gamesPlayed, gamesForNextLevel } = masteryInfo;
  const formattedMultiplier = `${(multiplier * 100).toFixed(0)}%`;
  const nextLevelGamesNeeded = gamesForNextLevel - gamesPlayed;
  
  return (
    <div className="bg-deepLapisLight/50 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="bg-royalGold/20 p-1.5 rounded-md mr-2">
            <Icon name="star" size={16} color="#DAA520" />
          </div>
          <h3 className="text-white font-medium">Game Mastery</h3>
        </div>
        <span className="text-sm font-bold text-royalGold">
          Level {level}
        </span>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/70">Mastery Progress</span>
          <span className="text-royalGold">
            {level < 5 ? `${gamesPlayed}/${gamesForNextLevel}` : 'MAX'}
          </span>
        </div>
        <div className="h-2 bg-deepLapis rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-royalGold to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-white">
            <span className="text-royalGold font-medium mr-1">{formattedMultiplier}</span>
            reward bonus
          </p>
          <p className="text-xs text-white/60">
            {level < 5 
              ? `${nextLevelGamesNeeded} more games for next level` 
              : 'Maximum mastery achieved!'}
          </p>
        </div>
        
        <div className="rounded-full bg-deepLapis/50 p-1.5">
          <Icon name="coin" size={20} color="#DAA520" />
        </div>
      </div>
    </div>
  );
};

GameMasteryDisplay.propTypes = {
  gameId: PropTypes.string.isRequired
};

export default GameMasteryDisplay;