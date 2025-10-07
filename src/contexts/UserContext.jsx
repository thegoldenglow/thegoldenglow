import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseAvailable } from '../utils/supabase';
import { 
  validateTelegramWebAppData, 
  getTelegramUser, 
  initializeTelegramBot,
  generateTelegramBotReferralLink,
  getUserReferralCode,
  trackReferral,
  parseReferralStartParam
} from '../utils/telegramBot';
import { generateRandomUsername, isValidUsername, isUsernameAvailable } from '../utils/usernameGenerator';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [referrals, setReferrals] = useState([]); // Track referrals by current user
  const [authToken, setAuthToken] = useState(null);
  const [session, setSession] = useState(null);
  const [anonymousUserScore, setAnonymousUserScore] = useState(0);

  // Define updateUserPoints first to avoid circular dependency
  const updateUserPoints = useCallback(async (pointsToAdd, additionalData = null) => {
    if (user && isAuthenticated && isSupabaseAvailable()) { // Authenticated user logic with Supabase check
      const currentPoints = user.points || 0;
      const newTotalPoints = Math.max(0, currentPoints + pointsToAdd); // Ensure points don't go negative

      let processedAdditionalData = {};
      if (additionalData) {
        processedAdditionalData = Object.keys(additionalData).reduce((acc, key) => {
          if (user.hasOwnProperty(key) && Array.isArray(user[key])) {
            // For array fields (e.g., achievements, badges, titles), additionalData should provide the new full array
            acc[key] = additionalData[key]; 
          } else if (typeof user[key] === 'object' && user[key] !== null && !Array.isArray(user[key])) {
            // For object fields (like stats), merge them
            acc[key] = { ...(user[key] || {}), ...additionalData[key] };
          } else {
            // For other fields (like username, selectedTitle), overwrite
            acc[key] = additionalData[key];
          }
          return acc;
        }, {});
      }

      const updatedUser = {
        ...user,
        points: newTotalPoints,
        ...processedAdditionalData
      };

      try {
        const { error } = await supabase
          .from('profiles')
          .update({ points: newTotalPoints, ...processedAdditionalData })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating user points in Supabase:', error);
          return { success: false, error: error.message };
        } else {
          setUser(updatedUser);
          localStorage.setItem('gg_user', JSON.stringify(updatedUser)); 
          console.log('User points/data updated successfully in Supabase and locally.');
          return { success: true, pointsAdded: pointsToAdd, newTotal: newTotalPoints };
        }
      } catch (e) {
        console.error('Error in updateUserPoints Supabase call:', e);
        return { success: false, error: e.message };
      }
    } else { // Anonymous user logic or Supabase unavailable
      console.log(`Updating points for anonymous user or Supabase is unavailable. Adding: ${pointsToAdd}`);
      const currentAnonScore = anonymousUserScore;
      const newAnonScore = Math.max(0, currentAnonScore + pointsToAdd);

      localStorage.setItem('gg_anonymous_score', newAnonScore.toString());
      setAnonymousUserScore(newAnonScore);
      console.log(`Anonymous user score updated to: ${newAnonScore}`);
      if (additionalData) {
        console.log('Processing additionalData for anonymous user (currently local state only):', additionalData);
        // For anonymous users, additionalData might update a local version of achievements/badges if implemented
      }
      return { success: true, pointsAdded: pointsToAdd, newTotal: newAnonScore };
    }
  }, [
    user, 
    isAuthenticated, 
    anonymousUserScore, 
    setAnonymousUserScore, 
    supabase, 
    setUser,
    // Removed addAchievement, addBadge, addTitle, recordReferral from here as they now call updateUserPoints
  ]);

  // Define helper functions that depend on updateUserPoints
  const addTitle = useCallback((titleData) => {
    if (!user) return null;
    const existingTitles = user.titles || [];
    if (existingTitles.some(t => t.id === titleData.id)) {
      console.log('User already has title:', titleData.id);
      return null;
    }
    const updates = {
      titles: [...existingTitles, titleData]
    };
    if (!user.selectedTitle) {
      updates.selectedTitle = titleData.id;
    }
    updateUserPoints(0, updates); // Titles usually don't grant points directly
    return titleData;
  }, [user, updateUserPoints]);

  const addBadge = useCallback((badgeData) => {
    if (!user) return null;
    const existingBadges = user.badges || [];
    if (existingBadges.some(b => b.id === badgeData.id)) {
      console.log('User already has badge:', badgeData.id);
      return null;
    }
    const updates = {
      badges: [...existingBadges, badgeData]
    };
    if (!user.selectedBadge) {
      updates.selectedBadge = badgeData.id;
    }
    updateUserPoints(0, updates);
    return badgeData;
  }, [user, updateUserPoints]);

  const addAchievement = useCallback((achievementData, awardPointsFromAchievement = true) => {
    if (!user) return null;

    const existingAchievements = user.achievements || [];
    if (existingAchievements.some(a => a.id === achievementData.id)) {
      console.log('User already has achievement:', achievementData.id);
      return null;
    }

    const achievementWithTimestamp = { ...achievementData, unlockedAt: new Date().toISOString() };    
    let pointsToAward = 0;
    const updates = {
      achievements: [...existingAchievements, achievementWithTimestamp]
    };

    if (awardPointsFromAchievement && achievementData.reward) {
      if (achievementData.reward.points) {
        pointsToAward = achievementData.reward.points;
      }
      if (achievementData.reward.title) {
        const existingTitles = user.titles || [];
        if (!existingTitles.some(t => t.id === achievementData.reward.title.id)) {
          updates.titles = [...existingTitles, achievementData.reward.title];
          if (!user.selectedTitle) updates.selectedTitle = achievementData.reward.title.id;
        }
      }
      if (achievementData.reward.badge) {
        const existingBadges = user.badges || [];
        if (!existingBadges.some(b => b.id === achievementData.reward.badge.id)) {
          updates.badges = [...existingBadges, achievementData.reward.badge];
          if (!user.selectedBadge) updates.selectedBadge = achievementData.reward.badge.id;
        }
      }
    }
    updateUserPoints(pointsToAward, updates);
    return achievementWithTimestamp;
  }, [user, updateUserPoints]);

  // Initialize user on component mount (useEffect)
  useEffect(() => {
    const initializeUser = async () => {
      // ... (existing initializeUser logic remains largely the same) ...
      // It should load user from Supabase, or localStorage, or Telegram
      // And for anonymous users, load anonymousUserScore from localStorage
      console.log('Initializing UserContext...');
      
      const fetchUserReferralsFromDB = async (userId) => { // Renamed to avoid conflict if getUserReferrals is defined later
        if (!userId || !isSupabaseAvailable()) return [];
        try {
          const { data, error } = await supabase
            .from('referrals')
            .select('*, referred_id(username, name, telegram_photo_url, created_at)')
            .eq('referrer_id', userId)
            .order('created_at', { ascending: false });
          if (error) {
            console.error('Error fetching referrals:', error); return [];
          }
          return data || [];
        } catch (fetchError) {
          console.error('Error in fetchUserReferrals:', fetchError); return [];
        }
      };

      if (!isSupabaseAvailable()) {
        console.log('Supabase is not available. Initializing in guest mode.');
        setUser(null);
        setIsAuthenticated(false);
        const storedAnonScore = localStorage.getItem('gg_anonymous_score');
        setAnonymousUserScore(storedAnonScore ? parseInt(storedAnonScore, 10) : 0);
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();
        setSession(supabaseSession);
        
        if (supabaseSession) {
          console.log('User authenticated with Supabase');
          const { data: userProfile, error } = await supabase
            .from('profiles').select('*').eq('id', supabaseSession.user.id).single();
            
          if (error && error.code === 'PGRST116') {
            const newProfile = {
              id: supabaseSession.user.id, name: supabaseSession.user.user_metadata?.full_name || 'User', username: supabaseSession.user.email?.split('@')[0] || generateRandomUsername(),
              points: 0, createdAt: new Date().toISOString(), achievements: [], badges: [], titles: [],
              profileFrames: [], cosmetics: [], selectedTitle: null, selectedFrame: null, selectedBadge: null,
              customStatus: '', prestige: 0, stats: { gamesPlayed: 0, highestScore: 0, totalTimePlayed: 0, loginStreak: 0, longestLoginStreak: 0, lastLogin: new Date().toISOString(), gameStats: {} }
            };
            const { error: insertError } = await supabase.from('profiles').insert(newProfile);
            if (insertError) console.error('Error creating user profile:', insertError);
            else { setUser(newProfile); setIsAuthenticated(true); }
          } else if (error) {
            console.error('Error fetching user profile:', error);
          } else {
            setUser(userProfile); setIsAuthenticated(true);
          }
        } else {
          // Check if we're in a Telegram WebApp environment
          if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
            console.log('UserContext: Detected Telegram WebApp, waiting for TelegramAuthManager...');
            // Wait a bit for TelegramAuthManager to handle authentication
            setTimeout(() => {
              const localTgUser = localStorage.getItem('gg_user');
              if (localTgUser) {
                const parsedUser = JSON.parse(localTgUser);
                setUser(parsedUser);
                setIsAuthenticated(true);
                console.log('UserContext: Telegram user loaded from localStorage');
              } else {
                console.log('UserContext: No Telegram user found, setting up anonymous session');
                setUser(null);
                setIsAuthenticated(false);
                const storedAnonScore = localStorage.getItem('gg_anonymous_score');
                setAnonymousUserScore(storedAnonScore ? parseInt(storedAnonScore, 10) : 0);
              }
            }, 2000); // Wait 2 seconds for TelegramAuthManager to complete
          } else {
            // Not in Telegram, check localStorage immediately
            const localTgUser = localStorage.getItem('gg_user');
            if (localTgUser) {
              setUser(JSON.parse(localTgUser));
              setIsAuthenticated(true);
              console.log('User initialized from local gg_user data.');
            } else {
              console.log('UserContext: No stored user found, user needs to login');
              setUser(null);
              setIsAuthenticated(false);
              const storedAnonScore = localStorage.getItem('gg_anonymous_score');
              setAnonymousUserScore(storedAnonScore ? parseInt(storedAnonScore, 10) : 0);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        setUser(null); setIsAuthenticated(false);
        const storedAnonScore = localStorage.getItem('gg_anonymous_score');
        setAnonymousUserScore(storedAnonScore ? parseInt(storedAnonScore, 10) : 0);
      } finally {
        setIsLoading(false);
      }
    };
    initializeUser();
  }, [supabase]); // supabase client is a dependency

  const login = useCallback(async (/* credentials */) => {
    // Removed login page redirect
    console.log('Login redirect removed - staying on current page');
  }, []);

  // NEW METHOD: Update user from localStorage without page refresh
  const updateUserFromLocalStorage = useCallback(() => {
    console.log('UserContext: Updating user from localStorage...');
    try {
      const localUser = localStorage.getItem('gg_user');
      if (localUser) {
        const parsedUser = JSON.parse(localUser);
        console.log('UserContext: Found user in localStorage:', parsedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        return { success: true, user: parsedUser };
      } else {
        console.warn('UserContext: No user found in localStorage');
        return { success: false, error: 'No user found in localStorage' };
      }
    } catch (error) {
      console.error('UserContext: Error updating user from localStorage:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const setUserDirectly = useCallback(async (userData) => {
    console.log('UserContext: Setting user data directly:', userData);
    if (userData) {
      setUser(userData);
      setIsAuthenticated(true);
      
      // Transfer anonymous score to database if exists
      const storedAnonScore = localStorage.getItem('gg_anonymous_score');
      if (storedAnonScore && parseInt(storedAnonScore, 10) > 0) {
        const anonPoints = parseInt(storedAnonScore, 10);
        console.log(`Transferring ${anonPoints} anonymous points to authenticated user`);
        
        try {
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ points: (userData.points || 0) + anonPoints })
            .eq('id', userData.id)
            .select()
            .single();
            
          if (updateError) {
            console.error('Error transferring anonymous points:', updateError);
            // Still set user data even if point transfer fails
            localStorage.setItem('gg_user', JSON.stringify(userData));
          } else {
            console.log(`Successfully transferred ${anonPoints} points to database`);
            setUser(updatedProfile);
            localStorage.setItem('gg_user', JSON.stringify(updatedProfile));
            // Clear anonymous score after successful transfer
            localStorage.removeItem('gg_anonymous_score');
            setAnonymousUserScore(0);
            return { success: true, user: updatedProfile };
          }
        } catch (transferError) {
          console.error('Error during anonymous score transfer:', transferError);
          // Still set user data even if point transfer fails
          localStorage.setItem('gg_user', JSON.stringify(userData));
        }
      } else {
        // No anonymous score to transfer, just set user data
        localStorage.setItem('gg_user', JSON.stringify(userData));
      }
      
      return { success: true, user: userData };
    } else {
      console.warn('UserContext: No user data provided to setUserDirectly');
      return { success: false, error: 'No user data provided' };
    }
  }, [supabase, setAnonymousUserScore]);

  const logout = useCallback(async () => {
    console.log('Logging out...');
    if (isSupabaseAvailable()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsAuthenticated(false);
    setSession(null);
    setAnonymousUserScore(0); // Reset anonymous score too, or decide if it should persist
    localStorage.removeItem('gg_user');
    localStorage.removeItem('gg_anonymous_score'); // Clear anonymous score on logout
    localStorage.removeItem('gg_referrals');
    // Potentially clear other local storage items
  }, [supabase, setUser, setIsAuthenticated, setSession, setAnonymousUserScore]);

  const loginWithEmail = useCallback(async (email, password) => {
    if (!isSupabaseAvailable()) return { success: false, error: 'Supabase is not available.' };
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      return { success: false, error: error.message };
    }
    if (data.user) {
      // Session is set by Supabase listener, initializeUser effect will pick it up
      // Or trigger profile fetch manually here
      const { data: userProfile, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      if (profileError) { /* handle */ }
      else { 
        setUser(userProfile); 
        setIsAuthenticated(true);
        
        // Transfer anonymous score to database if exists
        const storedAnonScore = localStorage.getItem('gg_anonymous_score');
        if (storedAnonScore && parseInt(storedAnonScore, 10) > 0) {
          const anonPoints = parseInt(storedAnonScore, 10);
          console.log(`Transferring ${anonPoints} anonymous points to authenticated user`);
          
          if (isSupabaseAvailable()) {
            try {
              const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .update({ points: (userProfile.points || 0) + anonPoints })
                .eq('id', data.user.id)
                .select()
                .single();
                
              if (updateError) {
                console.error('Error transferring anonymous points:', updateError);
              } else {
                console.log(`Successfully transferred ${anonPoints} points to database`);
                setUser(updatedProfile);
                // Clear anonymous score after successful transfer
                localStorage.removeItem('gg_anonymous_score');
                setAnonymousUserScore(0);
              }
            } catch (transferError) {
              console.error('Error during anonymous score transfer:', transferError);
            }
          }
        }
      }
    }
    setIsLoading(false);
    return { success: true, user: data.user };
  }, [supabase, setIsLoading, setUser, setIsAuthenticated, setAnonymousUserScore]);

  const signUpWithEmail = useCallback(async (email, password, name) => {
    if (!isSupabaseAvailable()) return { success: false, error: 'Supabase is not available.' };
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password, 
      options: { data: { full_name: name } }
    });
    if (error) {
      setIsLoading(false);
      return { success: false, error: error.message };
    }
    if (data.user) {
      // User created, profile will be created by initializeUser or a trigger
      // For now, let's assume initializeUser handles it or create it here.
      const newProfile = {
        id: data.user.id, name: name || 'User', username: email.split('@')[0] || generateRandomUsername(),
        points: 0, createdAt: new Date().toISOString(), achievements: [], badges: [], titles: [],
        // ... other default fields
      };
      const { error: insertError } = await supabase.from('profiles').insert(newProfile);
      if (insertError) { /* handle */ }
      else { setUser(newProfile); setIsAuthenticated(true); }
    }
    setIsLoading(false);
    return { success: true, user: data.user };
  }, [supabase, setIsLoading, setUser, setIsAuthenticated]);

  const loginWithMagicLink = useCallback(async (email) => {
    if (!isSupabaseAvailable()) return { success: false, error: 'Supabase is not available.' };
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setIsLoading(false);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, [supabase, setIsLoading]);

  const updateUsername = useCallback(async (newUsername) => {
    if (!user) return { success: false, error: 'User not logged in' };
    if (!isValidUsername(newUsername)) {
      return { success: false, error: 'Invalid username format.' };
    }
    const availability = await isUsernameAvailable(supabase, newUsername, user.id);
    if (!availability.available) {
      return { success: false, error: availability.error || 'Username taken.' };
    }
    updateUserPoints(0, { username: newUsername });
    return { success: true };
  }, [user, supabase, () => updateUserPoints]);

  const updateUserStats = useCallback((statsDelta) => {
    if (!user) return;
    // Merges new stats with existing. Assumes statsDelta is an object of changes.
    const newStats = { ...(user.stats || {}), ...statsDelta };
    updateUserPoints(0, { stats: newStats });
  }, [user, () => updateUserPoints]);

  const addProfileFrame = useCallback((frameData) => {
    if (!user) return null;
    const existingFrames = user.profileFrames || [];
    if (existingFrames.some(f => f.id === frameData.id)) return null;
    const updates = { profileFrames: [...existingFrames, frameData] };
    if (!user.selectedFrame) updates.selectedFrame = frameData.id;
    updateUserPoints(0, updates);
    return frameData;
  }, [user, () => updateUserPoints]);

  const addCosmetic = useCallback((cosmeticData) => {
    if (!user) return null;
    const existingCosmetics = user.cosmetics || [];
    if (existingCosmetics.some(c => c.id === cosmeticData.id)) return null;
    updateUserPoints(0, { cosmetics: [...existingCosmetics, cosmeticData] });
    return cosmeticData;
  }, [user, () => updateUserPoints]);

  const updateSelectedCustomizations = useCallback((selections) => {
    if (!user) return null;
    const updates = {};
    if (selections.title !== undefined) updates.selectedTitle = selections.title;
    if (selections.badge !== undefined) updates.selectedBadge = selections.badge;
    if (selections.frame !== undefined) updates.selectedFrame = selections.frame;
    if (selections.customStatus !== undefined) updates.customStatus = selections.customStatus.slice(0, 100);
    if (Object.keys(updates).length > 0) {
      updateUserPoints(0, updates);
    }
    return updates;
  }, [user, () => updateUserPoints]);

  const generateReferralLink = useCallback(() => {
    if (!user) return null;
    return `${window.location.origin}?ref=${user.id || user.username}`; // Use a stable ID
  }, [user]);

  const generateTelegramReferralLink = useCallback(async () => {
    if (!user || !user.id) return 'https://t.me/GoldenGlowGlobal'; // Fallback
    return await generateTelegramBotReferralLink(user.id); // Assumes user.id is the correct Supabase ID
  }, [user]);

  const getReferralCode = useCallback(async () => {
    if (!user || !user.id) return null;
    return await getUserReferralCode(user.id);
  }, [user]);

  // Helper function to fetch referrals data (defined at UserProvider scope)
  const fetchUserReferralsFromDB = async (userId) => {
    try {
      // Skip the query if userId is not provided
      if (!userId) {
        console.log('Skipping referrals query - no user ID provided');
        return [];
      }
      
      // Using a simpler query structure to avoid foreign key relationship issues
      const { data, error } = await supabase
        .from('referrals')
        .select('id, code_used, created_at, points_awarded, reward_claimed, referrer_id, referred_id')
        .eq('referrer_id', userId);
        
      if (error) throw error;
      
      // If we need user details, we can fetch them separately
      // This avoids the relationship query issues
      return data || [];
    } catch (error) {
      console.error('Error fetching referrals:', error.message);
      return [];
    }
  };
  
  const getUserReferrals = useCallback(async () => {
    if (!user) { setReferrals([]); return []; }
    
    // Use user_id (UUID) if available, otherwise fall back to id
    const userIdToUse = user.user_id || user.id;
    
    if (!userIdToUse) { setReferrals([]); return []; }
    
    try {
      const data = await fetchUserReferralsFromDB(userIdToUse);
      setReferrals(data || []);
      return data || [];
    } catch (error) {
      console.error('Error in getUserReferrals:', error);
      setReferrals([]);
      return [];
    }
  }, [user]);

  const recordReferral = useCallback(async (referrerUserId, referredUsername = null, referralCode = null) => {
    if (!user || !user.id) return;
    // Logic to record referral in DB, potentially award points to referrer
    // The current user is the one being referred, referrerUserId is the one who referred them
    console.log('Recording referral:', { referrer: referrerUserId, referred: user.id, referralCode });
    try {
      await trackReferral(referralCode, user.id); // trackReferral(referralCode, newUserId)
      // Award points to the current user for being referred
      updateUserPoints(50, { referralBonus: true });
      // Fetch updated referrals list
      getUserReferrals();
    } catch (error) {
      console.error('Error recording referral:', error);
    }
  }, [user, updateUserPoints, getUserReferrals]);

  const getUserLevel = useCallback(() => {
    if (!user) return { level: 0, progress: 0, nextLevelThreshold: 100 };
    const points = user.points || 0;
    const levels = [
      { level: 1, threshold: 0 }, { level: 2, threshold: 100 }, { level: 3, threshold: 250 }, 
      { level: 4, threshold: 500 }, { level: 5, threshold: 1000 }, { level: 6, threshold: 2000 },
      // ... more levels
    ];
    let currentLevelData = levels[0];
    let nextLevelData = levels[1];
    for (let i = levels.length - 1; i >= 0; i--) {
      if (points >= levels[i].threshold) {
        currentLevelData = levels[i];
        nextLevelData = levels[i+1] || { level: currentLevelData.level + 1, threshold: currentLevelData.threshold * 2 };
        break;
      }
    }
    const pointsInLevel = points - currentLevelData.threshold;
    const pointsToNextLevel = nextLevelData.threshold - currentLevelData.threshold;
    const progress = pointsToNextLevel > 0 ? Math.min(100, Math.floor((pointsInLevel / pointsToNextLevel) * 100)) : 100;
    return {
      level: currentLevelData.level, progress,
      currentThreshold: currentLevelData.threshold, nextThreshold: nextLevelData.threshold,
      pointsToNextLevel: nextLevelData.threshold - points
    };
  }, [user]);

  const processStartParameter = useCallback(async (startParam) => {
    if (!startParam || !user || !user.id) return null;
    try {
      const referralInfo = await parseReferralStartParam(startParam);
      if (referralInfo && referralInfo.referrerUserId !== user.id) {
        await recordReferral(referralInfo.referrerUserId, null, referralInfo.referralCode);
        updateUserPoints(50, { referralBonus: true }); // Points for being referred
        return referralInfo;
      }
      return null;
    } catch (error) {
      console.error('Error processing start parameter:', error);
      return null;
    }
  }, [user, recordReferral, () => updateUserPoints]);

  // Effect to fetch referrals when user logs in
  useEffect(() => {
    if (user && isAuthenticated) {
      getUserReferrals();
    }
  }, [user, isAuthenticated, getUserReferrals]);

  // CRITICAL FIX: Listen for user data updates from game score manager
  // This ensures the UI refreshes immediately when points are updated
  useEffect(() => {
    const handleUserDataUpdate = (event) => {
      console.log('UserContext: Received userDataUpdated event:', event.detail);
      const { updatedProfile } = event.detail;
      if (updatedProfile && user && updatedProfile.id === user.id) {
        console.log('UserContext: Refreshing user data after point update');
        setUser(updatedProfile);
        // Also ensure localStorage is in sync
        localStorage.setItem('gg_user', JSON.stringify(updatedProfile));
      }
    };

    // Listen for custom events from gameScoreManager
    window.addEventListener('userDataUpdated', handleUserDataUpdate);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate);
    };
  }, [user]);

  // Create addPoints as an alias for updateUserPoints for backward compatibility
  const addPoints = useCallback((points) => {
    return updateUserPoints(points);
  }, [updateUserPoints]);

  // Function to refresh user data from database
  const refreshUserData = useCallback(async () => {
    if (!user || !user.id || !isAuthenticated || !isSupabaseAvailable()) {
      console.log('Cannot refresh user data - no authenticated user or Supabase unavailable');
      return { success: false, error: 'No authenticated user or Supabase unavailable' };
    }

    try {
      console.log('🔄 Refreshing user data from database...');
      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error refreshing user data:', error);
        return { success: false, error: error.message };
      }

      if (userProfile) {
        console.log('✅ User data refreshed successfully:', {
          points: userProfile.points,
          gamesPlayed: userProfile.stats?.gamesPlayed,
          highestScore: userProfile.stats?.highestScore
        });
        setUser(userProfile);
        localStorage.setItem('gg_user', JSON.stringify(userProfile));
        return { success: true, user: userProfile };
      }

      return { success: false, error: 'No user profile found' };
    } catch (error) {
      console.error('Error in refreshUserData:', error);
      return { success: false, error: error.message };
    }
  }, [user, isAuthenticated, supabase]);

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
      addPoints,
      updateUserStats,
      addAchievement,
      addTitle,
      addBadge,
      addProfileFrame,
      addCosmetic,
      updateSelectedCustomizations,
      generateReferralLink,
      generateTelegramReferralLink,
      getReferralCode,
      recordReferral,
      processStartParameter,
      getUserLevel,
      referrals,
      getUserReferrals,
      authToken,
      session,
      anonymousUserScore,
      updateUsername,
      updateUserFromLocalStorage,
      setUserDirectly,
      refreshUserData
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserContext;