import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../../contexts/UserContext';
import { useGame } from '../../contexts/GameContext';
import HomeLayout from '../templates/HomeLayout';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import { isValidUsername } from '../../utils/usernameGenerator';

const ProfilePage = () => {
  const { user, logout, updateUsername } = useUser();
  const { games } = useGame();
  
  // State for username editing
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset form when user changes or editing is toggled off
  useEffect(() => {
    if (user && user.username) {
      setNewUsername(user.username);
    }
    
    if (!isEditingUsername) {
      setUsernameError('');
    }
  }, [user, isEditingUsername]);
  
  if (!user) {
    return (
      <HomeLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
          <div className="w-20 h-20 rounded-full bg-deepLapisLight/50 flex items-center justify-center mb-4">
            <Icon name="user" size={32} color="#FFFFFF" />
          </div>
          <h1 className="text-2xl font-primary text-royalGold mb-3">Guest User</h1>
          <p className="text-white/70 text-center mb-6">
            You are not logged in. Start your journey to track your progress and collect wisdom.
          </p>
          <Button variant="primary">
            Login
          </Button>
        </div>
      </HomeLayout>
    );
  }

  // Helper function to determine wisdom rank based on points
  const getWisdomRank = () => {
    const points = user.points || 0;
    
    if (points >= 10000) return { name: 'Illuminated Master', color: 'text-royalGold' };
    if (points >= 5000) return { name: 'Sage', color: 'text-royalGold' };
    if (points >= 2000) return { name: 'Scholar', color: 'text-white' };
    if (points >= 1000) return { name: 'Adept', color: 'text-white' };
    if (points >= 500) return { name: 'Seeker', color: 'text-white/80' };
    if (points >= 100) return { name: 'Initiate', color: 'text-white/80' };
    return { name: 'Novice', color: 'text-white/70' };
  };

  // Calculate how many points until next rank
  const getPointsUntilNextRank = () => {
    const points = user.points || 0;
    
    if (points >= 10000) return { next: 'Eternal Enlightenment', needed: '∞' };
    if (points >= 5000) return { next: 'Illuminated Master', needed: 10000 - points };
    if (points >= 2000) return { next: 'Sage', needed: 5000 - points };
    if (points >= 1000) return { next: 'Scholar', needed: 2000 - points };
    if (points >= 500) return { next: 'Adept', needed: 1000 - points };
    if (points >= 100) return { next: 'Seeker', needed: 500 - points };
    return { next: 'Initiate', needed: 100 - points };
  };

  const rank = getWisdomRank();
  const nextRank = getPointsUntilNextRank();

  return (
    <HomeLayout>
      <div className="w-full max-w-4xl mx-auto px-4 py-6">
        {/* Profile header */}
        <motion.div 
          className="mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-deepLapisLight/50 flex items-center justify-center border-2 border-royalGold/50 relative">
            {/* Display profile image from different sources with priority: telegram_photo_url > avatar */}
            {(user.telegram_photo_url || user.avatar) ? (
              <img 
                src={user.telegram_photo_url || user.avatar} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover" 
              />
            ) : (
              <span className="text-3xl font-primary text-royalGold">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
            
            {/* Display telegram indicator for telegram users */}
            {user.user_source === 'telegram_user' && (
              <div className="absolute bottom-0 right-0 bg-deepLapisLight rounded-full p-1 border border-royalGold">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#209DD3">
                  <path d="M20.665,3.717l-17.73,6.837c-1.21,0.486-1.203,1.161-0.222,1.462l4.552,1.42l10.532-6.645c0.498-0.303,0.953-0.14,0.579,0.192l-8.533,7.701l-0.332,4.99c0.486,0,0.701-0.228,0.97-0.484l2.328-2.243l4.837,3.566c0.89,0.49,1.523,0.237,1.746-0.825l3.153-14.848C22.8,3.268,21.958,2.729,20.665,3.717z"/>
                </svg>
              </div>
            )}
          </div>
          
          {/* User info */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-primary text-royalGold mb-1">{user.name}</h1>
            
            {/* Username display/edit section */}
            {!isEditingUsername ? (
              <div className="flex items-center mb-2 justify-center sm:justify-start">
                <p className="text-white/70">@{user.username}</p>
                <button 
                  onClick={() => setIsEditingUsername(true)}
                  className="ml-2 text-xs text-royalGold hover:text-royalGold/80 bg-deepLapisLight/30 rounded-full p-1"
                  aria-label="Edit username"
                >
                  <Icon name="edit" size={12} color="#DAA520" />
                </button>
              </div>
            ) : (
              <div className="mb-3">
                <div className="flex items-center mb-1 justify-center sm:justify-start">
                  <div className="bg-deepLapisLight/50 flex rounded-lg overflow-hidden border border-royalGold/30">
                    <span className="px-2 py-1 text-royalGold/70 bg-deepLapisLight/70">@</span>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => {
                        setNewUsername(e.target.value);
                        // Validate as user types
                        if (!isValidUsername(e.target.value)) {
                          setUsernameError('Username must be 3-20 characters with only letters, numbers, and underscores');
                        } else {
                          setUsernameError('');
                        }
                      }}
                      className="px-2 py-1 bg-deepLapisLight/30 text-white/90 focus:outline-none"
                      placeholder="username"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex ml-2">
                    <button
                      onClick={async () => {
                        try {
                          console.log('Saving username change:', newUsername);
                          setIsSubmitting(true);
                          
                          // Validate before submission
                          if (!isValidUsername(newUsername)) {
                            console.error('Username validation failed');
                            setUsernameError('Username must be 3-20 characters with only letters, numbers, and underscores');
                            setIsSubmitting(false);
                            return;
                          }
                          
                          // Save to database with verbose logging
                          console.log('Calling updateUsername function with:', newUsername);
                          const result = await updateUsername(newUsername);
                          console.log('Update username result:', result);
                          
                          // Force a direct database insert as a backup approach
                          try {
                            // Import supabase directly to ensure we have access
                            const { supabase } = await import('../../utils/supabase');
                            console.log('Attempting direct database insert/update for:', newUsername);
                            
                            // Try to find existing profile by username
                            const { data: existingProfile } = await supabase
                              .from('profiles')
                              .select('id')
                              .eq('username', user.username)
                              .single();
                              
                            if (existingProfile) {
                              // Update existing profile
                              console.log('Direct update for profile ID:', existingProfile.id);
                              await supabase
                                .from('profiles')
                                .update({ username: newUsername })
                                .eq('id', existingProfile.id);
                            } else {
                              // Create new profile as fallback
                              console.log('Direct insert of new profile for:', newUsername);
                              await supabase
                                .from('profiles')
                                .insert({
                                  username: newUsername,
                                  points: user.points || 0,
                                  created_at: new Date().toISOString()
                                });
                            }
                          } catch (directDbError) {
                            console.error('Direct database operation failed:', directDbError);
                          }
                          
                          if (result.success) {
                            console.log('Username updated successfully');
                            setIsEditingUsername(false);
                          } else {
                            console.error('Username update failed:', result.error);
                            setUsernameError(result.error);
                          }
                        } catch (error) {
                          console.error('Unexpected error during username update:', error);
                          setUsernameError('An unexpected error occurred');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting || !newUsername || !!usernameError}
                      className="text-xs text-deepLapis bg-royalGold hover:bg-royalGold/80 rounded-full p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Save username"
                    >
                      <Icon name="check" size={12} color="#091F39" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingUsername(false);
                        setNewUsername(user.username);
                        setUsernameError('');
                      }}
                      className="text-xs text-white/70 hover:text-white bg-deepLapisLight/50 hover:bg-deepLapisLight/70 rounded-full p-1 ml-1"
                      aria-label="Cancel editing"
                      disabled={isSubmitting}
                    >
                      <Icon name="x" size={12} color="#FFFFFF" />
                    </button>
                  </div>
                </div>
                
                {/* Error message */}
                {usernameError && (
                  <div className="bg-red-500/20 border border-red-400/50 rounded-md px-3 py-2 mb-2">
                    <p className="text-xs text-red-400 text-center sm:text-left flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{usernameError}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Show user source */}
            <p className="text-xs text-white/50 mb-2">
              {user.user_source === 'telegram_user' ? 'Telegram User' : 'App User'}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
              <div className="bg-deepLapisLight/30 px-3 py-1 rounded-full flex items-center">
                <Icon name="wisdom" size={14} color="#DAA520" className="mr-1" />
                <span className="text-royalGold font-medium">{user.points || 0} Points</span>
              </div>
              <div className="bg-deepLapisLight/30 px-3 py-1 rounded-full">
                <span className={`font-medium ${rank.color}`}>{rank.name}</span>
              </div>
            </div>
            <p className="text-white/70 text-sm">
              {nextRank.needed === '∞' ? (
                'You have reached the highest rank!'
              ) : (
                <>Need {nextRank.needed} more points for <span className="text-royalGold">{nextRank.next}</span></>
              )}
            </p>
          </div>
          
          {/* Logout button */}
          <Button variant="outline" size="small" onClick={logout}>
            Log Out
          </Button>
        </motion.div>
        
        {/* Stats section */}
        <motion.section 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-xl font-primary text-royalGold mb-4">Spiritual Journey</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-deepLapisLight/30 p-4 rounded-lg">
              <p className="text-xs text-white/70 mb-1">Games Played</p>
              <p className="text-2xl text-white">{user.stats?.gamesPlayed || 0}</p>
            </div>
            <div className="bg-deepLapisLight/30 p-4 rounded-lg">
              <p className="text-xs text-white/70 mb-1">Wisdom Points</p>
              <p className="text-2xl text-royalGold">{user.points || 0}</p>
            </div>
            <div className="bg-deepLapisLight/30 p-4 rounded-lg">
              <p className="text-xs text-white/70 mb-1">Achievements</p>
              <p className="text-2xl text-white">{user.achievements?.length || 0}</p>
            </div>
            <div className="bg-deepLapisLight/30 p-4 rounded-lg">
              <p className="text-xs text-white/70 mb-1">Highest Score</p>
              <p className="text-2xl text-white">{user.stats?.highestScore || 0}</p>
            </div>
          </div>
        </motion.section>
        
        {/* Game progress section */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-primary text-royalGold mb-4">Game Progress</h2>
          <div className="space-y-3">
            {games.map((game, index) => (
              <div 
                key={game.id} 
                className={`p-3 rounded-lg border ${game.unlocked ? 'border-royalGold/30 bg-deepLapisLight/20' : 'border-white/10 bg-deepLapisLight/10'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Icon name={game.icon} size={18} color={game.unlocked ? '#DAA520' : '#FFFFFF80'} className="mr-2" />
                    <div>
                      <h3 className={`font-medium ${game.unlocked ? 'text-royalGold' : 'text-white/50'}`}>
                        {game.name}
                      </h3>
                      <p className={`text-xs ${game.unlocked ? 'text-white/70' : 'text-white/40'}`}>
                        {game.category.charAt(0).toUpperCase() + game.category.slice(1)}
                      </p>
                    </div>
                  </div>
                  
                  {game.unlocked ? (
                    <Link to={`/games/${game.id}`}>
                      <Button variant="outline" size="small">
                        Play
                      </Button>
                    </Link>
                  ) : (
                    <div className="text-xs text-white/50">
                      <Icon name="lock" size={12} color="#FFFFFF80" className="mr-1" />
                      {game.minPoints} points to unlock
                    </div>
                  )}
                </div>
                
                {/* Progress bar */}
                {game.unlocked && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">Progress</span>
                      <span className="text-royalGold">{game.progress}%</span>
                    </div>
                    <div className="h-2 bg-deepLapis/50 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-royalGold rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${game.progress}%` }}
                        transition={{ duration: 1, delay: 0.3 + (index * 0.1) }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.section>
        
        {/* Achievements section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-xl font-primary text-royalGold mb-4">Achievements</h2>
          
          {user.achievements && user.achievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {user.achievements.map((achievement) => (
                <div key={achievement.id} className="p-3 bg-deepLapisLight/20 rounded-lg border border-royalGold/20">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-royalGold/20 flex items-center justify-center mr-3">
                      <Icon name={achievement.icon || 'star'} size={20} color="#DAA520" />
                    </div>
                    <div>
                      <h3 className="font-medium text-royalGold">{achievement.name}</h3>
                      <p className="text-sm text-white/70">{achievement.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-deepLapisLight/20 rounded-lg text-center">
              <p className="text-white/60 mb-3">No achievements earned yet</p>
              <p className="text-sm text-white/50">
                Continue your spiritual journey through the games to earn achievements and wisdom.
              </p>
            </div>
          )}
        </motion.section>
      </div>
    </HomeLayout>
  );
};

export default ProfilePage;