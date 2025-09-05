import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiStar, FiAward } from 'react-icons/fi';
import { supabase } from '../../utils/supabase';
import { useUser } from '../../contexts/UserContext';

const ReferralLeaderboard = () => {
  const { user } = useUser();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReferralLeaderboard();
  }, [user]);

  const fetchReferralLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching referral leaderboard...');
      
      // First, try to get referral codes data
      const { data: referralData, error: referralError } = await supabase
        .from('referral_codes')
        .select('user_id, total_referrals, created_at')
        .order('total_referrals', { ascending: false })
        .limit(100);

      if (referralError) {
        console.error('Error fetching referral codes:', referralError);
        throw new Error(`Database error: ${referralError.message}`);
      }

      console.log('Referral data:', referralData);

      if (!referralData || referralData.length === 0) {
        console.log('No referral data found');
        setLeaderboardData([]);
        setIsLoading(false);
        return;
      }

      // Get user profiles separately to avoid join issues
      const userIds = referralData.map(item => item.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, points, avatar_url, telegram_username')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Error fetching profiles, using referral data only:', profilesError);
      }

      console.log('Profiles data:', profilesData);

      // Combine the data
      const formattedData = referralData
        .filter(item => item.total_referrals > 0)
        .map((item, index) => {
          const profile = profilesData?.find(p => p.id === item.user_id);
          return {
            rank: index + 1,
            id: item.user_id,
            username: profile?.username || profile?.telegram_username || `User ${index + 1}`,
            totalReferrals: item.total_referrals,
            points: profile?.points || 0,
            avatarUrl: profile?.avatar_url,
            joinedAt: item.created_at
          };
        });

      console.log('Formatted leaderboard data:', formattedData);
      setLeaderboardData(formattedData);

      // Find current user's rank
      if (user?.id) {
        const userEntry = formattedData.find(entry => entry.id === user.id);
        setUserRank(userEntry ? userEntry.rank : null);
      }

    } catch (err) {
      console.error('Error in fetchReferralLeaderboard:', err);
      
      // Check if it's a table not found error
      if (err.message && err.message.includes('relation "referral_codes" does not exist')) {
        setError('Referral system not initialized. Please contact support to set up the database tables.');
      } else if (err.message && err.message.includes('permission denied')) {
        setError('Database access denied. Please check your authentication.');
      } else {
        setError(`Failed to load referral leaderboard: ${err.message}`);
      }
      
      // Don't show demo data, keep it empty for real data only
      setLeaderboardData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <FiAward className="text-yellow-500" />;
      case 2:
        return <FiAward className="text-gray-400" />;
      case 3:
        return <FiAward className="text-amber-600" />;
      default:
        return <FiStar className="text-blue-500" />;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30';
      default:
        return 'bg-base-200/50 border-base-300/50';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <FiUsers className="text-2xl text-primary" />
          <h2 className="text-2xl font-bold text-textLight">Referral Leaderboard</h2>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-base-200 p-3 sm:p-4 rounded-lg animate-pulse">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-base-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 sm:h-4 bg-base-300 rounded w-1/3 mb-2"></div>
                  <div className="h-2 sm:h-3 bg-base-300 rounded w-1/4"></div>
                </div>
                <div className="h-5 sm:h-6 bg-base-300 rounded w-12 sm:w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <FiUsers className="text-4xl text-error mx-auto mb-4" />
        <p className="text-error">{error}</p>
        <button 
          onClick={fetchReferralLeaderboard}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <FiUsers className="text-xl sm:text-2xl text-primary" />
          <h2 className="text-lg sm:text-2xl font-bold text-textLight">Referral Leaderboard</h2>
        </div>
        <button 
          onClick={fetchReferralLeaderboard}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-base-300 text-textLight rounded-lg hover:bg-base-300/80 transition"
        >
          Refresh
        </button>
      </div>

      {/* User's Current Rank */}
      {userRank && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border border-primary/30 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-primary">#{userRank}</span>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-textLight/70">Your Current Rank</p>
              <p className="text-sm sm:font-medium text-textLight">#{userRank} in Referrals</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-2 sm:space-y-3">
        {leaderboardData.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 sm:p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
              getRankColor(entry.rank)
            } ${
              user?.id === entry.id ? 'ring-2 ring-primary/50' : ''
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Rank */}
              <div className="flex items-center gap-1 sm:gap-2 min-w-[40px] sm:min-w-[60px]">
                <span className="text-sm sm:text-lg font-bold text-textLight">#{entry.rank}</span>
                <div className="hidden sm:block">{getRankIcon(entry.rank)}</div>
              </div>

              {/* Avatar */}
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden">
                {entry.avatarUrl ? (
                  <img 
                    src={entry.avatarUrl} 
                    alt={entry.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm sm:text-lg font-bold text-primary">
                    {entry.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:font-medium text-textLight truncate">{entry.username}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-textLight/70">
                  <span className="flex items-center gap-1">
                    <FiUsers className="text-xs" />
                    {entry.totalReferrals} invite{entry.totalReferrals !== 1 ? 's' : ''}
                  </span>
                  <span className="hidden sm:inline">{entry.points.toLocaleString()} points</span>
                </div>
              </div>

              {/* Referral Count Badge */}
              <div className="text-right">
                <div className="bg-primary/20 text-primary px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                  {entry.totalReferrals}
                </div>
                <div className="text-xs text-textLight/50 mt-1 hidden sm:block">invites</div>
                <div className="text-xs text-textLight/50 mt-1 sm:hidden">{entry.points.toLocaleString()}pts</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {leaderboardData.length === 0 && (
        <div className="text-center py-12">
          <FiUsers className="text-4xl text-textLight/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-textLight mb-2">No Referrals Yet</h3>
          <p className="text-textLight/70 mb-4">
            Be the first to invite friends and climb the leaderboard!
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-base-200/50 rounded-lg">
        <p className="text-xs sm:text-sm text-textLight/70 text-center">
          💡 Invite friends to earn points and climb the referral leaderboard!
        </p>
      </div>
    </div>
  );
};

export default ReferralLeaderboard;