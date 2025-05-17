import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { useGame } from '../../contexts/GameContext';
import Header from '../molecules/Header';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import GameLeaderboard from '../leaderboard/GameLeaderboard';
import { supabase } from '../../utils/supabase';

const LeaderboardPage = () => {
  const { user, userPoints, userLevel } = useUser();
  const { games } = useGame();
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState('all');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const gamesList = [
    { id: 'marks-of-destiny', name: 'Marks of Destiny', icon: 'marks' },
    { id: 'path-of-enlightenment', name: 'Path of Enlightenment', icon: 'path' },
    { id: 'flame-of-wisdom', name: 'Flame of Wisdom', icon: 'flame' },
    { id: 'sacred-tapping', name: 'Sacred Tapping', icon: 'tap' },
    { id: 'gates-of-knowledge', name: 'Gates of Knowledge', icon: 'gates' },
    { id: 'mystical-tap-journey', name: 'Mystical Tap Journey', icon: 'journey' },
    { id: 'tic-tac-toe', name: 'Tic Tac Toe', icon: 'game' },
  ];

  useEffect(() => {
    fetchLeaderboardData();
  }, [selectedGame]);

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    try {
      let query;
      
      if (selectedGame === 'all') {
        // Fetch overall leaderboard based on total points
        query = supabase
          .from('profiles')
          .select('id, username, points, avatar_url')
          .order('points', { ascending: false })
          .limit(50);
      } else {
        // Use the game_leaderboards view we created
        query = supabase
          .from('game_leaderboards')
          .select('id, username, avatar_url, high_score, game_name')
          .eq('game_name', selectedGame)
          .order('high_score', { ascending: false })
          .limit(50);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      let formattedData;
      if (selectedGame === 'all') {
        formattedData = data.map((item, index) => ({
          rank: index + 1,
          id: item.id,
          username: item.username,
          points: item.points,
          avatarUrl: item.avatar_url
        }));
        
        // Find user's rank in the leaderboard
        const userRankData = formattedData.find(item => item.id === user?.id);
        setUserRank(userRankData?.rank || null);
      } else {
        formattedData = data.map((item, index) => ({
          rank: index + 1,
          id: item.id,
          username: item.username,
          points: item.high_score,
          avatarUrl: item.avatar_url
        }));
        
        // Find user's rank in the game-specific leaderboard
        const userRankData = formattedData.find(item => item.id === user?.id);
        setUserRank(userRankData?.rank || null);
      }
      
      setLeaderboardData(formattedData);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Header 
        userName={user?.username} 
        userPoints={userPoints} 
        userLevel={userLevel}
      />

      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="bg-deepLapisDark/90 rounded-lg p-6 backdrop-blur-sm shadow-lg border border-royalGold/30">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-textGold font-primary mb-4 sm:mb-0">
              Leaderboard
              <span className="block text-sm text-royalGoldLight/80 font-calligraphy mt-1">
                Discover the Masters of Enlightenment
              </span>
            </h1>
            
            {userRank && (
              <div className="bg-deepLapis px-5 py-3 rounded-lg border border-royalGold/40 shadow-glow">
                <p className="text-sm text-royalGoldLight/90">Your Rank</p>
                <p className="text-2xl font-bold text-textGold">{userRank}<span className="text-sm ml-1">{getOrdinalSuffix(userRank)}</span></p>
              </div>
            )}
          </div>
          
          {/* Game selection tabs */}
          <div className="overflow-x-auto pb-2 mb-6">
            <div className="flex space-x-2 min-w-max">
              <button
                key="all"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedGame === 'all' 
                    ? 'bg-gradient-gold text-deepLapis shadow-glow' 
                    : 'bg-deepLapis/50 text-royalGoldLight/70 border border-royalGold/30 hover:bg-deepLapis hover:text-royalGoldLight'
                }`}
                onClick={() => setSelectedGame('all')}
              >
                <span className="flex items-center">
                  <Icon name="star" size={16} className="mr-2" />
                  Overall
                </span>
              </button>
              
              {gamesList.map(game => (
                <button
                  key={game.id}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedGame === game.id 
                      ? 'bg-gradient-gold text-deepLapis shadow-glow' 
                      : 'bg-deepLapis/50 text-royalGoldLight/70 border border-royalGold/30 hover:bg-deepLapis hover:text-royalGoldLight'
                  }`}
                  onClick={() => setSelectedGame(game.id)}
                >
                  <span className="flex items-center">
                    <Icon name={game.icon} size={16} className="mr-2" />
                    {game.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Leaderboard */}
          <GameLeaderboard 
            data={leaderboardData} 
            isLoading={isLoading} 
            userId={user?.id}
            gameType={selectedGame}
          />
        </div>
      </div>
    </motion.div>
  );
};

// Helper function to get the ordinal suffix for ranks
const getOrdinalSuffix = (number) => {
  const j = number % 10;
  const k = number % 100;
  
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

export default LeaderboardPage;
