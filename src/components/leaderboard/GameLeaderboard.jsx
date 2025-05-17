import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../atoms/Icon';

const GameLeaderboard = ({ data, isLoading, userId, gameType }) => {
  // Animation variants
  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  // Define special styling for top 3 ranks
  const getRankStyling = (rank) => {
    switch(rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-300 to-yellow-500 text-deepLapis shadow-glow-xl';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-deepLapis shadow-glow';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-amber-800 text-deepLapis shadow-glow';
      default:
        return 'bg-deepLapis text-royalGoldLight';
    }
  };

  // Placeholder content for loading state
  if (isLoading) {
    return (
      <div className="w-full py-8">
        <div className="flex justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-royalGold border-t-transparent rounded-full"></div>
        </div>
        <p className="text-center text-royalGoldLight/80 mt-4">Loading leaderboard data...</p>
      </div>
    );
  }

  // Handle empty data state
  if (!data || data.length === 0) {
    return (
      <div className="w-full py-8 text-center">
        <Icon name="trophy" size={48} className="mx-auto text-royalGoldLight/50 mb-4" />
        <h3 className="text-xl font-bold text-textGold mb-2">No Rankings Yet</h3>
        <p className="text-royalGoldLight/80">
          Be the first to master this challenge and claim your place in history!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Leaderboard header */}
      <div className="grid grid-cols-12 gap-4 py-3 px-4 bg-deepLapis/50 rounded-t-lg border-b border-royalGold/20 text-royalGoldLight/90 font-medium">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-7 sm:col-span-5">Player</div>
        <div className="col-span-4 sm:col-span-3 text-right">Score</div>
        <div className="hidden sm:block sm:col-span-3 text-right">
          {gameType === 'all' ? 'Total Points' : 'Game Score'}
        </div>
      </div>

      {/* Leaderboard entries */}
      <motion.div
        className="divide-y divide-royalGold/10"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence>
          {data.map((entry) => (
            <motion.div
              key={entry.id + "-" + entry.rank}
              className={`grid grid-cols-12 gap-4 py-3 px-4 items-center ${
                entry.id === userId ? 'bg-royalGoldLight/10' : ''
              } hover:bg-deepLapis/70 transition-colors duration-200`}
              variants={itemVariants}
            >
              {/* Rank */}
              <div className="col-span-1 text-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankStyling(entry.rank)}`}
                >
                  {entry.rank <= 3 ? (
                    <Icon name="trophy" size={12} className="text-current" />
                  ) : entry.rank}
                </div>
              </div>

              {/* Player name and avatar */}
              <div className="col-span-7 sm:col-span-5 flex items-center">
                <div className="w-8 h-8 rounded-full bg-deepLapis border border-royalGold/30 flex items-center justify-center mr-3 overflow-hidden">
                  {entry.avatarUrl ? (
                    <img 
                      src={entry.avatarUrl} 
                      alt={entry.username} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Icon name="profile" size={16} className="text-royalGoldLight/70" />
                  )}
                </div>
                <div>
                  <p className={`font-medium ${entry.id === userId ? 'text-textGold' : 'text-royalGoldLight'}`}>
                    {entry.username}
                  </p>
                  {entry.id === userId && (
                    <span className="text-xs text-royalGold">You</span>
                  )}
                </div>
              </div>

              {/* Score - visible on all screens */}
              <div className="col-span-4 sm:col-span-3 text-right font-mono">
                <span className={`${entry.id === userId ? 'text-textGold' : 'text-royalGoldLight'} font-bold`}>
                  {entry.points.toLocaleString()}
                </span>
                <span className="text-xs text-royalGoldLight/60 ml-1">pts</span>
              </div>

              {/* Additional stats - visible only on larger screens */}
              <div className="hidden sm:block sm:col-span-3 text-right">
                <div className="inline-block px-3 py-1 rounded-full bg-deepLapis border border-royalGold/20 text-sm">
                  <span className="text-royalGoldLight/90">{gameType === 'all' ? 'Total: ' : 'Score: '}</span>
                  <span className="text-textGold font-medium">{entry.points.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default GameLeaderboard;
