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
      
      // For all games (overall ranking) or specific games, query the profiles table
      // Since we're keeping it simple for now, we'll always use the profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, points, avatar_url, telegram_username')
        .order('points', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      console.log('Fetched user data:', data?.length || 0, 'users');
      
      // Always provide some default data for preview if database is empty
      if (!data || data.length === 0) {
        // Insert sample data if none exists
        console.log('No leaderboard data found, adding demo users to database...');
        try {
          // Create some sample users if none exist
          const demoUsers = [
            { username: 'cosmic_wisdom123', points: 850, created_at: new Date().toISOString() },
            { username: 'golden_seeker456', points: 720, created_at: new Date().toISOString() },
            { username: 'testU1', points: 675, created_at: new Date().toISOString() },
            { username: 'test_user2', points: 520, created_at: new Date().toISOString() },
            { username: 'serene_lotus789', points: 450, created_at: new Date().toISOString() },
          ];
          
          // Insert the users one by one to avoid conflicts
          for (const demoUser of demoUsers) {
            // Check if user already exists
            const { data: existing } = await supabase
              .from('profiles')
              .select('id')
              .eq('username', demoUser.username)
              .single();
              
            if (!existing) {
              await supabase.from('profiles').insert(demoUser);
              console.log(`Added demo user: ${demoUser.username}`);
            }
          }
          
          // Fetch the data again
          const { data: refreshedData } = await supabase
            .from('profiles')
            .select('id, username, points, avatar_url, telegram_username')
            .order('points', { ascending: false })
            .limit(100);
            
          if (refreshedData && refreshedData.length > 0) {
            // Format and use the refreshed data
            const formattedData = refreshedData.map((item, index) => ({
              rank: index + 1,
              id: item.id,
              username: item.telegram_username || item.username,
              points: item.points || 0,
              avatarUrl: item.avatar_url
            }));
            
            setLeaderboardData(formattedData);
            
            // Find user's rank in the leaderboard if user is logged in
            if (user) {
              const userRankData = formattedData.find(item => 
                item.username === user.username || 
                item.id === user.id ||
                item.username === user.telegram_username
              );
              setUserRank(userRankData?.rank || null);
            }
            
            setIsLoading(false);
            return;
          }
        } catch (insertError) {
          console.error('Error creating demo users:', insertError);
        }
      }
      
      // Format the data for the leaderboard component
      const formattedData = data.map((item, index) => ({
        rank: index + 1,
        id: item.id,
        username: item.telegram_username || item.username || `User-${item.id}`,
        points: item.points || 0,
        avatarUrl: item.avatar_url
      }));
      
      setLeaderboardData(formattedData);
      
      // Find user's rank in the leaderboard if user is logged in
      if (user) {
        const userRankData = formattedData.find(item => 
          item.username === user.username || 
          item.id === user.id ||
          item.username === user.telegram_username
        );
        setUserRank(userRankData?.rank || null);
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
