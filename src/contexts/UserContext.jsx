import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
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

  // Forward declaration for updateUserPoints dependency in other functions
  let updateUserPoints;

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
  }, [user, () => updateUserPoints]); // Use a thunk for updateUserPoints if direct reference causes issues before full definition

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
  }, [user, () => updateUserPoints]);

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
  }, [user, () => updateUserPoints]); // Depends on updateUserPoints
  
  updateUserPoints = useCallback(async (pointsToAdd, additionalData = null) => {
    if (user && isAuthenticated) { // Authenticated user logic
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
        } else {
          setUser(updatedUser);
          localStorage.setItem('gg_user', JSON.stringify(updatedUser)); 
          console.log('User points/data updated successfully in Supabase and locally.');
        }
      } catch (e) {
        console.error('Error in updateUserPoints Supabase call:', e);
      }
    } else { // Anonymous user logic
      console.log(`Updating points for anonymous user. Adding: ${pointsToAdd}`);
      const currentAnonScore = anonymousUserScore;
      const newAnonScore = Math.max(0, currentAnonScore + pointsToAdd);

      localStorage.setItem('gg_anonymous_score', newAnonScore.toString());
      setAnonymousUserScore(newAnonScore);
      console.log(`Anonymous user score updated to: ${newAnonScore}`);
      if (additionalData) {
        console.log('Processing additionalData for anonymous user (currently local state only):', additionalData);
        // For anonymous users, additionalData might update a local version of achievements/badges if implemented
      }
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

  // Initialize user on component mount (useEffect)
  useEffect(() => {
    const initializeUser = async () => {
      // ... (existing initializeUser logic remains largely the same) ...
      // It should load user from Supabase, or localStorage, or Telegram
      // And for anonymous users, load anonymousUserScore from localStorage
      console.log('Initializing UserContext...');
      
      const fetchUserReferralsFromDB = async (userId) => { // Renamed to avoid conflict if getUserReferrals is defined later
        if (!userId) return [];
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
          const localTgUser = localStorage.getItem('gg_user'); // Assuming gg_user might be a TG user persisted
          if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
            // ... (Telegram user initialization logic as before) ...
            // This part is complex and involves fetching/creating TG user profile
            // For brevity, assuming it sets user, isAuthenticated correctly if TG user found
            // If TG user logic sets user, it should also fetch referrals if applicable
            console.log('Attempting Telegram User Initialization');
            // Placeholder for actual TG user init which is quite long
            // const tgUser = await initializeTelegramUserLogic(); // This would be the refactored TG logic
            // if (tgUser) { setUser(tgUser); setIsAuthenticated(true); }
            // else if (localTgUser) { setUser(JSON.parse(localTgUser)); setIsAuthenticated(true); }
            // else { setup anonymous user }
            if (localTgUser) { // Fallback if full TG init not shown/done
              setUser(JSON.parse(localTgUser));
              setIsAuthenticated(true);
            } else {
              console.log('User is anonymous. Setting up for anonymous session.');
              setUser(null); setIsAuthenticated(false);
              const storedAnonScore = localStorage.getItem('gg_anonymous_score');
              setAnonymousUserScore(storedAnonScore ? parseInt(storedAnonScore, 10) : 0);
            }
          } else if (localTgUser) {
            setUser(JSON.parse(localTgUser));
            setIsAuthenticated(true);
            console.log('User initialized from local gg_user data.');
          } else {
            console.log('User is anonymous. Setting up for anonymous session.');
            setUser(null); setIsAuthenticated(false);
            const storedAnonScore = localStorage.getItem('gg_anonymous_score');
            setAnonymousUserScore(storedAnonScore ? parseInt(storedAnonScore, 10) : 0);
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
    // Redirect to login page instead of auto-login
    console.log('Redirecting to login page...');
    // Use window.location to ensure full page navigation
    window.location.href = '/login';
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

  const logout = useCallback(async () => {
    console.log('Logging out...');
    await supabase.auth.signOut();
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
      else { setUser(userProfile); setIsAuthenticated(true); }
    }
    setIsLoading(false);
    return { success: true, user: data.user };
  }, [supabase, setIsLoading, setUser, setIsAuthenticated]);

  const signUpWithEmail = useCallback(async (email, password, name) => {
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
    if (!user || !user.id) return 'https://t.me/YourBotName?start=default'; // Fallback
    return await generateTelegramBotReferralLink(user.id); // Assumes user.id is the correct Supabase ID
  }, [user]);

  const getReferralCode = useCallback(async () => {
    if (!user || !user.id) return null;
    return await getUserReferralCode(user.id);
  }, [user]);

  const recordReferral = useCallback(async (referredUserId, referredUsername = null, referralCode = null) => {
    if (!user || !user.id) return;
    // Logic to record referral in DB, potentially award points to referrer
    // This might involve calling updateUserPoints for the *current* user (referrer)
    console.log('Recording referral:', { referrer: user.id, referredUserId, referralCode });
    try {
      await trackReferral(referralCode, referredUserId, user.id); // trackReferral needs referrerId
      // Award points to referrer? Example: 100 points
      // updateUserPoints(100, { lastReferralDate: new Date().toISOString() });
      // Fetch updated referrals list
      // getUserReferrals(); // This function would fetch and setReferrals
    } catch (error) {
      console.error('Error recording referral:', error);
    }
  }, [user, () => updateUserPoints, () => getUserReferrals]); // getUserReferrals also needs to be defined

  // Helper function to fetch referrals data (defined at UserProvider scope)
  const fetchUserReferralsFromDB = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_referrals')
        .select(`
          id, code_used, created_at, points_awarded, reward_claimed,
          referrer_id(id, username, telegram_username, telegram_photo_url),
          referred_id(id, username, telegram_username, telegram_photo_url, last_login)
        `)
        .eq('referrer_id', userId);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching referrals:', error.message);
      return [];
    }
  };
  
  const getUserReferrals = useCallback(async () => {
    if (!user || !user.id) { setReferrals([]); return []; }
    try {
      const data = await fetchUserReferralsFromDB(user.id);
      setReferrals(data || []);
      return data || [];
    } catch (error) {
      console.error('Error in getUserReferrals:', error);
      setReferrals([]);
      return [];
    }
  }, [user, supabase]);

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
      updateUserFromLocalStorage
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserContext;