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
      console.log('Fetching leaderboard data for game:', selectedGame);
      
      let data, error;
      
      if (selectedGame === 'all') {
        // For overall ranking, query the profiles table
        ({ data, error } = await supabase
          .from('profiles')
          .select('id, username, points, avatar_url, telegram_username')
          .order('points', { ascending: false })
          .limit(100));
      } else {
        // For specific games, query the game_scores table
        ({ data, error } = await supabase
          .from('game_scores')
          .select('id, profile_id, auth_user_id, score, created_at, profiles!game_scores_profile_id_fkey(id, username, avatar_url, telegram_username, points)')
          .eq('game_name', selectedGame)
          .order('score', { ascending: false })
          .limit(100));
      }
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      console.log('Fetched data:', data?.length || 0, 'records');
      
      // Process and format data based on query type
      let formattedData = [];
      
      if (!data || data.length === 0) {
        // No data found, use demo data based on the selected game
        console.log('No leaderboard data found, using demo data');
        
        if (selectedGame === 'all') {
          // Demo data for overall ranking
          formattedData = [
            { rank: 1, id: 'demo1', username: 'cosmic_wisdom123', points: 850, avatarUrl: null },
            { rank: 2, id: 'demo2', username: 'golden_seeker456', points: 720, avatarUrl: null },
            { rank: 3, id: 'demo3', username: 'testU1', points: 675, avatarUrl: null },
            { rank: 4, id: 'demo4', username: 'test_user2', points: 520, avatarUrl: null },
            { rank: 5, id: 'demo5', username: 'serene_lotus789', points: 450, avatarUrl: null }
          ];
        } else if (selectedGame === 'marks-of-destiny') {
          // Demo data for Marks of Destiny game
          formattedData = [
            { rank: 1, id: 'demo1', username: 'cosmic_wisdom123', points: 950, avatarUrl: null, gameScore: 950 },
            { rank: 2, id: 'demo2', username: 'golden_seeker456', points: 720, avatarUrl: null, gameScore: 850 },
            { rank: 3, id: 'demo3', username: 'mystical_player', points: 600, avatarUrl: null, gameScore: 780 },
            { rank: 4, id: 'demo4', username: 'destiny_finder', points: 580, avatarUrl: null, gameScore: 690 },
            { rank: 5, id: 'demo5', username: 'mark_master', points: 530, avatarUrl: null, gameScore: 530 }
          ];
        } else {
          // Demo data for other games
          formattedData = [
            { rank: 1, id: 'demo1', username: 'game_expert', points: 750, avatarUrl: null, gameScore: 750 },
            { rank: 2, id: 'demo2', username: 'player_one', points: 680, avatarUrl: null, gameScore: 680 },
            { rank: 3, id: 'demo3', username: 'skills_master', points: 620, avatarUrl: null, gameScore: 620 },
            { rank: 4, id: 'demo4', username: 'game_guru', points: 550, avatarUrl: null, gameScore: 550 },
            { rank: 5, id: 'demo5', username: 'top_player', points: 490, avatarUrl: null, gameScore: 490 }
          ];
        }
      } else {
        // Format real data from database
        if (selectedGame === 'all') {
          // Format overall ranking data
          formattedData = data.map((user, index) => ({
            rank: index + 1,
            id: user.id,
            username: user.username || `User-${user.id.substring(0, 6)}`,
            points: user.points || 0,
            avatarUrl: user.avatar_url
          }));
        } else {
          // Format game-specific data from game_scores table
          formattedData = data.map((record, index) => ({
            rank: index + 1,
            id: record.profiles?.id || record.profile_id,
            username: record.profiles?.username || `User-${record.auth_user_id?.substring(0, 6)}`,
            points: record.profiles?.points || 0,
            avatarUrl: record.profiles?.avatar_url,
            gameScore: record.score || 0
          }));
        }
      }
      
      // Set the formatted data to state
      setLeaderboardData(formattedData);
      
      // Find and set user's rank if logged in
      if (user?.id) {
        const userRankItem = formattedData.find(item => item.id === user.id);
        if (userRankItem) {
          setUserRank(userRankItem.rank);
        } else {
          setUserRank(null); // Reset rank if user is not in the leaderboard
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      // Provide fallback data for preview
      const fallbackData = [
        { rank: 1, id: 'demo1', username: 'cosmic_wisdom123', points: 850, avatarUrl: null },
        { rank: 2, id: 'demo2', username: 'golden_seeker456', points: 720, avatarUrl: null },
        { rank: 3, id: 'demo3', username: 'testU1', points: 675, avatarUrl: null },
        { rank: 4, id: 'demo4', username: 'test_user2', points: 520, avatarUrl: null },
        { rank: 5, id: 'demo5', username: 'serene_lotus789', points: 450, avatarUrl: null },
      ];
      setLeaderboardData(fallbackData);
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
