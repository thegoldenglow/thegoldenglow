import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [referrals, setReferrals] = useState([]); // Track referrals by current user
  const [authToken, setAuthToken] = useState(null);
  const [session, setSession] = useState(null);

  // Initialize user on component mount
  useEffect(() => {
    const initializeUser = async () => {
      console.log('Initializing UserContext...');
      try {
        // Check Supabase session first
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();
        setSession(supabaseSession);
        
        if (supabaseSession) {
          // User is authenticated with Supabase
          console.log('User authenticated with Supabase');
          
          // Fetch user profile from Supabase
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseSession.user.id)
            .single();
            
          if (error) {
            console.error('Error fetching user profile:', error);
            
            // Create a new profile if it doesn't exist
            if (error.code === 'PGRST116') {
              const newProfile = {
                id: supabaseSession.user.id,
                name: supabaseSession.user.user_metadata?.full_name || 'User',
                lastName: '',
                username: supabaseSession.user.email?.split('@')[0] || null,
                avatar: null,
                points: 0,
                createdAt: new Date().toISOString(),
                achievements: [],
                badges: [],
                titles: [],
                profileFrames: [],
                cosmetics: [],
                selectedTitle: null,
                selectedFrame: null,
                selectedBadge: null,
                customStatus: '',
                prestige: 0,
                stats: {
                  gamesPlayed: 0,
                  highestScore: 0,
                  totalTimePlayed: 0,
                  loginStreak: 0,
                  longestLoginStreak: 0,
                  lastLogin: new Date().toISOString(),
                  gameStats: {}
                }
              };
              
              const { error: insertError } = await supabase
                .from('profiles')
                .insert(newProfile);
                
              if (insertError) {
                console.error('Error creating user profile:', insertError);
              } else {
                setUser(newProfile);
                setIsAuthenticated(true);
              }
            }
          } else {
            // User profile retrieved successfully
            setUser(userProfile);
            setIsAuthenticated(true);
          }
        } else {
          // Try to get user from localStorage for development/demo purposes
          let savedUser;
          let savedReferrals = [];
          try {
            savedUser = localStorage.getItem('gg_user');
            const savedReferralsData = localStorage.getItem('gg_referrals');
            if (savedReferralsData) {
              savedReferrals = JSON.parse(savedReferralsData);
            }
            
            if (savedUser) {
              const parsedUser = JSON.parse(savedUser);
              console.log('Found saved user in localStorage');
              setUser(parsedUser);
              setReferrals(savedReferrals);
              setIsAuthenticated(true);
            }
          } catch (storageError) {
            console.warn('Error accessing localStorage:', storageError);
          }
          
          // Check if we're in Telegram environment
          if (window.Telegram && window.Telegram.WebApp) {
            console.log('Detected Telegram WebApp, retrieving user data...');
            // Get user data from Telegram WebApp
            const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
            const initData = window.Telegram.WebApp.initData;
            
            // Store auth token for API calls
            if (initData) {
              setAuthToken(initData);
            }
            
            if (tgUser) {
              console.log('Telegram user found:', tgUser.first_name);
              // Create or update user
              const userData = {
                id: tgUser.id.toString(),
                name: tgUser.first_name || 'User',
                lastName: tgUser.last_name || '',
                username: tgUser.username || null,
                avatar: null, // Telegram doesn't provide avatar in WebApp initData
                points: 0, // Golden Credits
                createdAt: new Date().toISOString(),
                achievements: [],
                badges: [],
                titles: [],
                profileFrames: [],
                cosmetics: [],
                selectedTitle: null,
                selectedFrame: null,
                selectedBadge: null,
                customStatus: '',
                prestige: 0,
                stats: {
                  gamesPlayed: 0,
                  highestScore: 0,
                  totalTimePlayed: 0,
                  loginStreak: 0,
                  longestLoginStreak: 0,
                  lastLogin: new Date().toISOString(),
                  gameStats: {}
                }
              };
              
              // For demo purposes, preserve points from localStorage if user exists
              if (savedUser) {
                try {
                  const parsedUser = JSON.parse(savedUser);
                  userData.points = parsedUser.points || 0;
                  userData.achievements = parsedUser.achievements || [];
                  userData.badges = parsedUser.badges || [];
                  userData.titles = parsedUser.titles || [];
                  userData.profileFrames = parsedUser.profileFrames || [];
                  userData.cosmetics = parsedUser.cosmetics || [];
                  userData.selectedTitle = parsedUser.selectedTitle;
                  userData.selectedFrame = parsedUser.selectedFrame;
                  userData.selectedBadge = parsedUser.selectedBadge;
                  userData.customStatus = parsedUser.customStatus || '';
                  userData.prestige = parsedUser.prestige || 0;
                  userData.stats = parsedUser.stats || {
                    gamesPlayed: 0,
                    highestScore: 0,
                    totalTimePlayed: 0,
                    loginStreak: 0,
                    longestLoginStreak: 0,
                    lastLogin: new Date().toISOString(),
                    gameStats: {}
                  };
                } catch (e) {
                  console.warn('Error parsing saved user data:', e);
                }
              }
              
              setUser(userData);
              setReferrals(savedReferrals);
              try {
                localStorage.setItem('gg_user', JSON.stringify(userData));
              } catch (e) {
                console.warn('Could not save user to localStorage:', e);
              }
              setIsAuthenticated(true);
              
              // Check for referral code in URL
              checkForReferral();
            } else {
              console.log('No Telegram user data available in WebApp.initDataUnsafe');
            }
          } else {
            console.log('Telegram WebApp not available, running in development mode');
            
            // Create a demo user if no saved user and not in Telegram environment
            if (!savedUser && !isAuthenticated) {
              console.log('Creating demo user for development');
              login();
            } else {
              setReferrals(savedReferrals);
            }
          }
        }
        
        // Set up Supabase auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            setSession(session);
            if (session) {
              // User is authenticated
              setIsAuthenticated(true);
            } else {
              // User is not authenticated with Supabase
              // Don't clear user if using Telegram or local auth
              if (!user) {
                setIsAuthenticated(false);
              }
            }
          }
        );
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        console.log('User initialization complete');
        setIsLoading(false);
      }
    };
    
    // Add a small delay to ensure Telegram WebApp is fully initialized
    const timer = setTimeout(initializeUser, 500);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);
  
  // Check URL for referral code
  const checkForReferral = useCallback(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('ref');
      
      if (referralCode && referralCode !== user?.id) {
        console.log('Referral code detected:', referralCode);
        
        // Check if this is a first-time user
        const isNewUser = !localStorage.getItem('gg_first_login');
        
        if (isNewUser) {
          // Record that this user was referred by another user
          localStorage.setItem('gg_referred_by', referralCode);
          localStorage.setItem('gg_first_login', 'true');
          
          // Award user bonus for using a referral (50 GC)
          updateUserPoints(50);
        }
      }
    } catch (error) {
      console.error('Error processing referral:', error);
    }
  }, [user]);

  // Supabase Email/Password login
  const loginWithEmail = async (email, password) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Supabase Email signup
  const signUpWithEmail = async (email, password, name) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Login with Supabase Magic Link
  const loginWithMagicLink = async (email) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Magic link error:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  // Login function (simulated for development)
  const login = async () => {
    try {
      setIsLoading(true);
      
      // If in Telegram WebApp, we already have the user
      if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        // User is already set in the initialization
        return;
      }
      
      // For development: create a demo user
      const demoUser = {
        id: 'demo_' + Date.now().toString(),
        name: 'Demo User',
        lastName: '',
        username: 'demo_user',
        avatar: null,
        points: 0,
        createdAt: new Date().toISOString(),
        achievements: [],
        badges: [],
        titles: [],
        profileFrames: [],
        cosmetics: [],
        selectedTitle: null,
        selectedFrame: null,
        selectedBadge: null,
        customStatus: 'On a spiritual journey',
        prestige: 0,
        stats: {
          gamesPlayed: 0,
          highestScore: 0,
          totalTimePlayed: 0,
          loginStreak: 0,
          longestLoginStreak: 0,
          lastLogin: new Date().toISOString(),
          gameStats: {}
        }
      };
      
      setUser(demoUser);
      localStorage.setItem('gg_user', JSON.stringify(demoUser));
      localStorage.setItem('gg_first_login', 'true');
      setIsAuthenticated(true);
      
      // Check for referral code
      checkForReferral();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    // If using Supabase, sign out
    if (session) {
      await supabase.auth.signOut();
    }
    
    setUser(null);
    setIsAuthenticated(false);
    setSession(null);
    localStorage.removeItem('gg_user');
  };

  // Update user points (Golden Credits) and optionally additional user data in a single update
  const updateUserPoints = async (points, additionalData = null) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      points: Math.max(0, user.points + points) // Ensure points don't go negative
    };
    
    // Handle additional data if provided (like progress updates)
    if (additionalData) {
      if (additionalData.progress) {
        updatedUser.progress = {
          ...(updatedUser.progress || {}),
          ...additionalData.progress
        };
      }
      
      // Handle any other additional data fields here
    }
    
    // If using Supabase, update in database
    if (session) {
      // Prepare update object with points and any additional fields
      const updateObj = { points: updatedUser.points };
      if (additionalData?.progress) {
        updateObj.progress = updatedUser.progress;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateObj)
        .eq('id', user.id);
        
      if (error) {
        console.error('Error updating user data in Supabase:', error);
      }
    }
    
    // Update local state in a single operation
    setUser(updatedUser);
    localStorage.setItem('gg_user', JSON.stringify(updatedUser));
    
    // If this earned points from a referral, award the referrer a bonus
    if (points > 0) {
      const referredBy = localStorage.getItem('gg_referred_by');
      if (referredBy) {
        // Earn 5% bonus for the referrer on first 1000 GC earned
        // This would normally be handled server-side in a real implementation
        console.log('Calculating referral bonus for:', referredBy);
      }
    }
    
    return updatedUser.points;
  };

  // Update user stats
  const updateUserStats = (stats) => {
    if (!user) return;
    
    // Handle game-specific stats separately
    let updatedStats = { ...user.stats };
    
    if (stats.gameId && stats.gameStats) {
      // Update game-specific stats
      const gameId = stats.gameId;
      const gameStats = stats.gameStats;
      
      updatedStats.gameStats = {
        ...updatedStats.gameStats,
        [gameId]: {
          ...updatedStats.gameStats?.[gameId],
          ...gameStats
        }
      };
      
      // Remove these from the general stats update
      delete stats.gameId;
      delete stats.gameStats;
    }
    
    // Update general stats
    updatedStats = {
      ...updatedStats,
      ...stats
    };
    
    const updatedUser = {
      ...user,
      stats: updatedStats
    };
    
    setUser(updatedUser);
    localStorage.setItem('gg_user', JSON.stringify(updatedUser));
    return updatedUser.stats;
  };

  // Add an achievement
  const addAchievement = (achievement) => {
    if (!user) return;
    
    // Check if achievement already exists
    const hasAchievement = user.achievements.some(a => a.id === achievement.id);
    
    if (!hasAchievement) {
      // Add rewards from achievement if specified
      if (achievement.reward) {
        if (achievement.reward.points) {
          updateUserPoints(achievement.reward.points);
        }
        
        if (achievement.reward.title) {
          addTitle(achievement.reward.title);
        }
        
        if (achievement.reward.badge) {
          addBadge(achievement.reward.badge);
        }
      }
      
      // Add achievement with timestamp
      const achievementWithTimestamp = {
        ...achievement,
        unlockedAt: new Date().toISOString()
      };
      
      const updatedUser = {
        ...user,
        achievements: [...user.achievements, achievementWithTimestamp]
      };
      
      setUser(updatedUser);
      localStorage.setItem('gg_user', JSON.stringify(updatedUser));
      return achievementWithTimestamp;
    }
    
    return null;
  };

  // Add a title to user
  const addTitle = useCallback((title) => {
    if (!user) return null;
    
    // Check if title already exists
    const hasTitle = user.titles.some(t => t.id === title.id);
    
    if (!hasTitle) {
      const updatedUser = {
        ...user,
        titles: [...user.titles, title],
        selectedTitle: user.selectedTitle || title.id // Auto-select if none selected
      };
      
      setUser(updatedUser);
      localStorage.setItem('gg_user', JSON.stringify(updatedUser));
      return title;
    }
    
    return null;
  }, [user]);
  
  // Add a badge to user
  const addBadge = useCallback((badge) => {
    if (!user) return null;
    
    // Check if badge already exists
    const hasBadge = user.badges.some(b => b.id === badge.id);
    
    if (!hasBadge) {
      const updatedUser = {
        ...user,
        badges: [...user.badges, badge],
        selectedBadge: user.selectedBadge || badge.id // Auto-select if none selected
      };
      
      setUser(updatedUser);
      localStorage.setItem('gg_user', JSON.stringify(updatedUser));
      return badge;
    }
    
    return null;
  }, [user]);
  
  // Add a profile frame
  const addProfileFrame = useCallback((frame) => {
    if (!user) return null;
    
    // Check if frame already exists
    const hasFrame = user.profileFrames.some(f => f.id === frame.id);
    
    if (!hasFrame) {
      const updatedUser = {
        ...user,
        profileFrames: [...user.profileFrames, frame],
        selectedFrame: user.selectedFrame || frame.id // Auto-select if none selected
      };
      
      setUser(updatedUser);
      localStorage.setItem('gg_user', JSON.stringify(updatedUser));
      return frame;
    }
    
    return null;
  }, [user]);
  
  // Add a cosmetic item
  const addCosmetic = useCallback((cosmetic) => {
    if (!user) return null;
    
    // Check if cosmetic already exists
    const hasCosmetic = user.cosmetics.some(c => c.id === cosmetic.id);
    
    if (!hasCosmetic) {
      const updatedUser = {
        ...user,
        cosmetics: [...user.cosmetics, cosmetic]
      };
      
      setUser(updatedUser);
      localStorage.setItem('gg_user', JSON.stringify(updatedUser));
      return cosmetic;
    }
    
    return null;
  }, [user]);
  
  // Update selected customizations
  const updateSelectedCustomizations = useCallback((selections) => {
    if (!user) return null;
    
    const updatedUser = {
      ...user
    };
    
    if (selections.title && user.titles.some(t => t.id === selections.title)) {
      updatedUser.selectedTitle = selections.title;
    }
    
    if (selections.badge && user.badges.some(b => b.id === selections.badge)) {
      updatedUser.selectedBadge = selections.badge;
    }
    
    if (selections.frame && user.profileFrames.some(f => f.id === selections.frame)) {
      updatedUser.selectedFrame = selections.frame;
    }
    
    if (selections.customStatus !== undefined) {
      updatedUser.customStatus = selections.customStatus.slice(0, 100); // Limit length
    }
    
    setUser(updatedUser);
    localStorage.setItem('gg_user', JSON.stringify(updatedUser));
    return {
      selectedTitle: updatedUser.selectedTitle,
      selectedBadge: updatedUser.selectedBadge,
      selectedFrame: updatedUser.selectedFrame,
      customStatus: updatedUser.customStatus
    };
  }, [user]);
  
  // Generate a referral code/link
  const generateReferralLink = useCallback(() => {
    if (!user) return null;
    
    const baseUrl = window.location.origin;
    return `${baseUrl}?ref=${user.id}`;
  }, [user]);
  
  // Record a successful referral
  const recordReferral = useCallback((referredUserId, referredUsername = null) => {
    if (!user) return;
    
    // Check if user is already in referrals
    if (referrals.some(r => r.userId === referredUserId)) return;
    
    const newReferral = {
      userId: referredUserId,
      username: referredUsername,
      timestamp: new Date().toISOString(),
      bonusCollected: false
    };
    
    const updatedReferrals = [...referrals, newReferral];
    setReferrals(updatedReferrals);
    localStorage.setItem('gg_referrals', JSON.stringify(updatedReferrals));
    
    // Check for milestone rewards
    const milestones = [5, 10, 25, 50];
    const referralCount = updatedReferrals.length;
    
    if (milestones.includes(referralCount)) {
      // Award milestone bonus
      let bonus = 0;
      let badge = null;
      let title = null;
      
      switch (referralCount) {
        case 5:
          bonus = 500;
          badge = {
            id: 'referral_5',
            name: 'Friend of Many',
            icon: 'users',
            description: 'Referred 5 friends to Golden Glow'
          };
          break;
        case 10:
          bonus = 1000;
          badge = {
            id: 'referral_10',
            name: 'Light Spreader',
            icon: 'star',
            description: 'Referred 10 friends to Golden Glow'
          };
          break;
        case 25:
          bonus = 2500;
          title = {
            id: 'spiritual_guide',
            name: 'Spiritual Guide',
            description: 'A beacon of wisdom who has guided 25 souls'
          };
          break;
        case 50:
          bonus = 5000;
          title = {
            id: 'golden_emissary',
            name: 'Golden Emissary',
            description: 'An enlightened soul who has brought 50 travelers to the path'
          };
          break;
      }
      
      if (bonus > 0) updateUserPoints(bonus);
      if (badge) addBadge(badge);
      if (title) addTitle(title);
    }
    
    return updatedReferrals.length;
  }, [user, referrals, updateUserPoints]);
  
  // Get user level data (for display purposes)
  const getUserLevel = useCallback(() => {
    if (!user) return { level: 0, progress: 0, nextLevel: 100 };
    
    const points = user.points || 0;
    
    // Level thresholds (geometric progression)
    const levels = [
      { level: 1, threshold: 0 },
      { level: 2, threshold: 100 },
      { level: 3, threshold: 250 },
      { level: 4, threshold: 500 },
      { level: 5, threshold: 1000 },
      { level: 6, threshold: 2000 },
      { level: 7, threshold: 3500 },
      { level: 8, threshold: 5000 },
      { level: 9, threshold: 7500 },
      { level: 10, threshold: 10000 },
      { level: 11, threshold: 15000 },
      { level: 12, threshold: 20000 },
      { level: 13, threshold: 30000 },
      { level: 14, threshold: 40000 },
      { level: 15, threshold: 50000 },
      { level: 16, threshold: 75000 },
      { level: 17, threshold: 100000 },
      { level: 18, threshold: 150000 },
      { level: 19, threshold: 200000 },
      { level: 20, threshold: 300000 },
    ];
    
    // Find current level
    let currentLevel = levels[0];
    let nextLevel = levels[1];
    
    for (let i = levels.length - 1; i >= 0; i--) {
      if (points >= levels[i].threshold) {
        currentLevel = levels[i];
        nextLevel = levels[i + 1] || { level: currentLevel.level + 1, threshold: currentLevel.threshold * 1.5 };
        break;
      }
    }
    
    // Calculate progress to next level
    const pointsInLevel = points - currentLevel.threshold;
    const pointsToNextLevel = nextLevel.threshold - currentLevel.threshold;
    const progress = Math.min(100, Math.floor((pointsInLevel / pointsToNextLevel) * 100));
    
    return {
      level: currentLevel.level,
      progress: progress,
      currentThreshold: currentLevel.threshold,
      nextThreshold: nextLevel.threshold,
      pointsToNextLevel: nextLevel.threshold - points
    };
  }, [user]);

  return (
    <UserContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      loginWithEmail,
      signUpWithEmail,
      loginWithMagicLink,
      updateUserPoints,
      updateUserStats,
      addAchievement,
      addTitle,
      addBadge,
      addProfileFrame,
      addCosmetic,
      updateSelectedCustomizations,
      generateReferralLink,
      recordReferral,
      getUserLevel,
      referrals,
      authToken,
      session
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserContext;