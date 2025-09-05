import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../atoms/Icon';
import { supabase } from '../../utils/supabase';

const GameLeaderboard = ({ data: propData, isLoading: propIsLoading, userId, gameType }) => {
  // Local state to ensure we always have data to display
  const [data, setData] = useState(propData || []);
  const [isLoading, setIsLoading] = useState(propIsLoading);
  const [usedFallback, setUsedFallback] = useState(false);
  
  // Effect to update local state when props change
  useEffect(() => {
    if (propData && propData.length > 0) {
      setData(propData);
      setIsLoading(propIsLoading);
    }
  }, [propData, propIsLoading]);
  
  // Fallback mechanism: if no data is provided via props, fetch directly from Supabase
  useEffect(() => {
    const fetchDirectFromSupabase = async () => {
      // Only run this if we don't have data from props and we haven't already used the fallback
      if ((!propData || propData.length === 0) && !usedFallback) {
        setIsLoading(true);
        try {
          console.log('GameLeaderboard: Direct fetch from Supabase');
          const { data: supabaseData, error } = await supabase
            .from('profiles')
            .select('id, username, points, avatar_url')
            .order('points', { ascending: false })
            .limit(20);
            
          if (error) {
            throw error;
          }
          
          if (supabaseData && supabaseData.length > 0) {
            const formattedData = supabaseData.map((item, index) => ({
              rank: index + 1,
              id: item.id,
              username: item.username || `User-${item.id}`,
              points: item.points || 0,
              avatarUrl: item.avatar_url
            }));
            setData(formattedData);
            console.log('GameLeaderboard: Found users via direct query:', formattedData.length);
          } else {
            // If still no data, use hardcoded sample data
            console.log('GameLeaderboard: No users in database, using sample data');
            setData([
              { rank: 1, id: 'demo1', username: 'cosmic_wisdom123', points: 950, avatarUrl: null },
              { rank: 2, id: 'demo2', username: 'test', points: 850, avatarUrl: null },
              { rank: 3, id: 'demo3', username: 'golden_seeker456', points: 720, avatarUrl: null },
              { rank: 4, id: 'demo4', username: 'testU1', points: 675, avatarUrl: null },
              { rank: 5, id: 'demo5', username: 'test_user2', points: 520, avatarUrl: null },
              { rank: 6, id: 'demo6', username: 'serene_lotus789', points: 450, avatarUrl: null },
            ]);
          }
        } catch (error) {
          console.error('GameLeaderboard: Error fetching directly from Supabase:', error);
          // Fallback to sample data
          setData([
            { rank: 1, id: 'demo1', username: 'cosmic_wisdom123', points: 950, avatarUrl: null },
            { rank: 2, id: 'demo2', username: 'test', points: 850, avatarUrl: null },
            { rank: 3, id: 'demo3', username: 'golden_seeker456', points: 720, avatarUrl: null },
            { rank: 4, id: 'demo4', username: 'testU1', points: 675, avatarUrl: null },
            { rank: 5, id: 'demo5', username: 'test_user2', points: 520, avatarUrl: null },
            { rank: 6, id: 'demo6', username: 'serene_lotus789', points: 450, avatarUrl: null },
          ]);
        } finally {
          setIsLoading(false);
          setUsedFallback(true);
        }
      }
    };
    
    fetchDirectFromSupabase();
  }, [propData, usedFallback]);
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
      <div className="grid grid-cols-12 gap-2 sm:gap-4 py-3 px-4 bg-deepLapis/50 rounded-t-lg border-b border-royalGold/20 text-royalGoldLight/90 font-medium">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-6 sm:col-span-5">Player</div>
        <div className="col-span-5 sm:col-span-3 text-right">Score</div>
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
              className={`grid grid-cols-12 gap-2 sm:gap-4 py-3 px-4 items-center ${
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
              <div className="col-span-6 sm:col-span-5 flex items-center">
                <div className="w-8 h-8 rounded-full bg-deepLapis border border-royalGold/30 flex items-center justify-center mr-2 sm:mr-3 overflow-hidden flex-shrink-0">
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
                <div className="min-w-0"> {/* Add min-width to enable text truncation */}
                  <p className={`font-medium truncate max-w-[120px] sm:max-w-full ${entry.id === userId ? 'text-textGold' : 'text-royalGoldLight'}`}>
                    {entry.username}
                  </p>
                  {entry.id === userId && (
                    <span className="text-xs text-royalGold">You</span>
                  )}
                </div>
              </div>

              {/* Score - visible on all screens */}
              <div className="col-span-5 sm:col-span-3 text-right font-mono pl-1">
                <span className={`${entry.id === userId ? 'text-textGold' : 'text-royalGoldLight'} font-bold`}>
                  {(entry.gameScore !== undefined ? entry.gameScore : entry.points).toLocaleString()}
                </span>
                <span className="text-xs text-royalGoldLight/60 ml-1">pts</span>
              </div>

              {/* Additional stats - visible only on larger screens */}
              <div className="hidden sm:block sm:col-span-3 text-right">
                <div className="inline-block px-3 py-1 rounded-full bg-deepLapis border border-royalGold/20 text-sm">
                  <span className="text-royalGoldLight/90">{gameType === 'all' ? 'Total: ' : 'Score: '}</span>
                  <span className="text-textGold font-medium">
                    {(entry.gameScore !== undefined ? entry.gameScore : entry.points).toLocaleString()}
                  </span>
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
