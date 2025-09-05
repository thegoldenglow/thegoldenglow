import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import PropTypes from 'prop-types';

// Create RewardContext
const RewardContext = createContext();

export const useReward = () => useContext(RewardContext);

export const RewardProvider = ({ children }) => {
  const { user, updateUserPoints } = useUser();
  
  // Daily Login State
  const [dailyLogin, setDailyLogin] = useState({
    streak: 0,
    longestStreak: 0,
    lastClaimDate: null,
    canClaim: false,
    streakMilestones: [
      {
        days: 3,
        reward: { golden_credits: 50 },
        claimed: false
      },
      {
        days: 7,
        reward: { golden_credits: 100, wheel_spins: 1 },
        claimed: false
      },
      {
        days: 14,
        reward: { golden_credits: 200, wheel_spins: 2 },
        claimed: false
      },
      {
        days: 30,
        reward: { golden_credits: 500, wheel_spins: 3, badge: 'Monthly Master' },
        claimed: false
      },
      {
        days: 60,
        reward: { golden_credits: 1000, wheel_spins: 5, title: 'Golden Guardian' },
        claimed: false
      },
      {
        days: 90,
        reward: { golden_credits: 2000, wheel_spins: 10, profileFrame: true },
        claimed: false
      }
    ]
  });
  
  // Wheel of Destiny State
  const [wheelOfDestiny, setWheelOfDestiny] = useState({
    segments: [
      { id: 1, value: 5, label: '5 GC', colorName: 'ancientGold', textColorName: 'mysticPurple-dark', probability: 0.30 },
      { id: 2, value: 10, label: '10 GC', colorName: 'mysticPurple-light', textColorName: 'text-offWhite', probability: 0.25 },
      { id: 3, value: 20, label: '20 GC', colorName: 'ethericBlue', textColorName: 'text-offWhite', probability: 0.20 },
      { id: 4, value: 50, label: '50 GC', colorName: 'mysticPurple', textColorName: 'ancientGold-light', probability: 0.15 },
      { id: 5, value: 100, label: '100 GC', colorName: 'arcaneIndigo', textColorName: 'ancientGold-light', probability: 0.06 },
      { id: 6, value: 250, label: '250 GC', colorName: 'ancientGold-dark', textColorName: 'text-offWhite', probability: 0.03 },
      { id: 7, value: 500, label: '500 GC', colorName: 'mysticPurple-dark', textColorName: 'ancientGold-light', probability: 0.01 },
      { id: 8, value: 0, label: 'Try Again', colorName: 'arcaneIndigo-dark', textColorName: 'ancientGold-light', probability: 0 } // Using a standard Tailwind gray
    ],
    freeSpinAvailable: false,
    spinsAvailable: 0,
    lastFreeSpinDate: null,
    currentSpin: null, // Current unclaimed spin
    history: [] // Past spins
  });
  
  // Track spins currently being claimed to prevent double claiming
  const [claimingSpins, setClaimingSpins] = useState(new Set());
  
  // Initialize from localStorage
  useEffect(() => {
    // Load daily login data
    const storedDailyLogin = localStorage.getItem('dailyLogin');
    if (storedDailyLogin) {
      setDailyLogin(JSON.parse(storedDailyLogin));
    }
    
    // Load wheel data
    const storedWheel = localStorage.getItem('wheelOfDestiny');
    if (storedWheel) {
      setWheelOfDestiny(JSON.parse(storedWheel));
    }
    
    // Check for daily rewards
    checkDailyRewardEligibility();
    
    // Check for free spin
    checkDailySpinEligibility();
  }, [user?.id]); // Re-run when user changes
  
  // Add interval to check for daily resets every minute
  useEffect(() => {
    const interval = setInterval(() => {
      // Check daily eligibility inline to avoid dependency issues
      if (!user) return;
      
      // Check daily login eligibility
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const lastClaim = dailyLogin.lastClaimDate ? new Date(dailyLogin.lastClaimDate).getTime() : 0;
      const canClaim = !lastClaim || lastClaim < today;
      const shouldResetStreak = lastClaim && (now.getTime() - lastClaim > 48 * 60 * 60 * 1000);
      
      setDailyLogin(prev => ({
        ...prev,
        canClaim,
        shouldResetStreak: shouldResetStreak && prev.streak > 0
      }));
      
      // Check daily spin eligibility
      let freeSpinAvailable = true;
      if (wheelOfDestiny.lastFreeSpinDate) {
        const lastFreeSpinDate = new Date(wheelOfDestiny.lastFreeSpinDate);
        const lastFreeSpinDay = new Date(lastFreeSpinDate.getFullYear(), lastFreeSpinDate.getMonth(), lastFreeSpinDate.getDate()).getTime();
        freeSpinAvailable = lastFreeSpinDay < today;
      }
      
      setWheelOfDestiny(prev => ({
        ...prev,
        freeSpinAvailable
      }));
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user, dailyLogin.lastClaimDate, wheelOfDestiny.lastFreeSpinDate]);
  
  // Save to localStorage when state changes with error handling
  useEffect(() => {
    try {
      if (dailyLogin) {
        localStorage.setItem('dailyLogin', JSON.stringify(dailyLogin));
      }
    } catch (error) {
      console.error('Failed to save daily login state to localStorage:', error);
    }
    
    try {
      if (wheelOfDestiny) {
        localStorage.setItem('wheelOfDestiny', JSON.stringify(wheelOfDestiny));
        console.log('Wheel state synchronized to localStorage');
      }
    } catch (error) {
      console.error('Failed to save wheel state to localStorage:', error);
    }
  }, [dailyLogin, wheelOfDestiny]);
  
  // Check if user can claim daily reward
  const checkDailyRewardEligibility = useCallback(() => {
    if (!user) return;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lastClaim = dailyLogin.lastClaimDate ? new Date(dailyLogin.lastClaimDate).getTime() : 0;
    
    // Check if last claim was before today
    const canClaim = !lastClaim || lastClaim < today;
    
    // Check if streak should be reset (more than 48h since last claim)
    const shouldResetStreak = lastClaim && (now.getTime() - lastClaim > 48 * 60 * 60 * 1000);
    
    setDailyLogin(prev => ({
      ...prev,
      canClaim,
      // Only show the reset message if we're going to reset an existing streak
      shouldResetStreak: shouldResetStreak && prev.streak > 0
    }));
  }, [user, dailyLogin.lastClaimDate]);
  
  // Check if user can claim free spin
  const checkDailySpinEligibility = useCallback(() => {
    if (!user) return;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Check if last free spin was on a different day
    let freeSpinAvailable = true;
    if (wheelOfDestiny.lastFreeSpinDate) {
      const lastFreeSpinDate = new Date(wheelOfDestiny.lastFreeSpinDate);
      const lastFreeSpinDay = new Date(lastFreeSpinDate.getFullYear(), lastFreeSpinDate.getMonth(), lastFreeSpinDate.getDate()).getTime();
      freeSpinAvailable = lastFreeSpinDay < today;
    }
    
    setWheelOfDestiny(prev => ({
      ...prev,
      freeSpinAvailable
    }));
  }, [user, wheelOfDestiny.lastFreeSpinDate]);
  
  // Claim daily reward
  const claimDailyReward = () => {
    if (!user || !dailyLogin.canClaim) return null;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lastClaim = dailyLogin.lastClaimDate ? new Date(dailyLogin.lastClaimDate).getTime() : 0;
    
    // Calculate streak
    let newStreak = dailyLogin.streak;
    let streakContinued = true;
    
    // If no previous claim or last claim was yesterday, increment streak
    if (!lastClaim) {
      newStreak = 1;
      streakContinued = false;
    } else if (today - lastClaim <= 48 * 60 * 60 * 1000) {
      // Within 48 hours, continue streak
      newStreak += 1;
    } else {
      // More than 48 hours, reset streak
      newStreak = 1;
      streakContinued = false;
    }
    
    // Calculate reward based on streak
    let rewardAmount = 10; // Base reward
    
    // Bonus for ongoing streaks
    if (newStreak >= 5) rewardAmount = 15;
    if (newStreak >= 10) rewardAmount = 20;
    if (newStreak >= 20) rewardAmount = 25;
    if (newStreak >= 30) rewardAmount = 30;
    
    // Add wheel spins every 7 days
    let wheelSpins = 0;
    if (newStreak % 7 === 0) {
      wheelSpins = 1;
      setWheelOfDestiny(prev => ({
        ...prev,
        spinsAvailable: prev.spinsAvailable + wheelSpins
      }));
    }
    
    // Update user's points
    updateUserPoints(rewardAmount);
    
    // Update daily login state
    setDailyLogin(prev => ({
      ...prev,
      streak: newStreak,
      longestStreak: Math.max(prev.longestStreak, newStreak),
      lastClaimDate: now.toISOString(),
      canClaim: false
    }));
    
    // Return the result for UI feedback
    return {
      amount: rewardAmount,
      streak: newStreak,
      wheelSpins,
      streakContinued
    };
  };
  
  // Claim milestone reward
  const claimMilestoneReward = (milestone) => {
    if (!user) return null;
    
    // Check if milestone exists and is not already claimed
    const milestoneIndex = dailyLogin.streakMilestones.findIndex(
      m => m.days === milestone.days
    );
    
    if (milestoneIndex === -1 || 
        dailyLogin.streak < milestone.days || 
        dailyLogin.streakMilestones[milestoneIndex].claimed) {
      return null;
    }
    
    // Get the reward
    const { reward } = dailyLogin.streakMilestones[milestoneIndex];
    
    // Update user points if reward includes golden credits
    if (reward.golden_credits) {
      updateUserPoints(reward.golden_credits);
    }
    
    // Add wheel spins if included
    if (reward.wheel_spins) {
      setWheelOfDestiny(prev => ({
        ...prev,
        spinsAvailable: prev.spinsAvailable + reward.wheel_spins
      }));
    }
    
    // Mark milestone as claimed
    setDailyLogin(prev => {
      const updatedMilestones = [...prev.streakMilestones];
      updatedMilestones[milestoneIndex] = {
        ...updatedMilestones[milestoneIndex],
        claimed: true
      };
      
      return {
        ...prev,
        streakMilestones: updatedMilestones
      };
    });
    
    // Return the result for UI feedback
    return {
      type: 'milestone',
      milestone: milestone.days,
      rewards: reward
    };
  };
  
  // Spin the wheel
  const spinWheel = async (spinType) => {
    if (!user) return null;
    
    // Check if the user can spin with real-time daily eligibility check
    if (spinType === 'free') {
      // Check daily eligibility in real-time for free spins
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      // Check if last free spin was on the same day
      let freeSpinAvailable = true;
      if (wheelOfDestiny.lastFreeSpinDate) {
        const lastFreeSpinDate = new Date(wheelOfDestiny.lastFreeSpinDate);
        const lastFreeSpinDay = new Date(lastFreeSpinDate.getFullYear(), lastFreeSpinDate.getMonth(), lastFreeSpinDate.getDate()).getTime();
        freeSpinAvailable = lastFreeSpinDay < today;
      }
      
      if (!freeSpinAvailable) {
        return null;
      }
    }
    
    if (spinType === 'paid' && wheelOfDestiny.spinsAvailable <= 0) {
      return null;
    }
    
    // Update spin availability and wheel state atomically to avoid race conditions
    // that could overwrite freeSpinAvailable/lastFreeSpinDate updates
    const nowISOForSpin = new Date().toISOString();
    
    // Check if this is a first-time player (no spin history)
    const isFirstTimeSpin = wheelOfDestiny.history.length === 0 && !wheelOfDestiny.currentSpin;
    
    let selectedSegment = null;
    
    if (isFirstTimeSpin) {
      // For first-time players, guarantee an attractive prize
      // Select from higher value segments (50, 100, or 250 GC)
      const attractivePrizes = wheelOfDestiny.segments.filter(segment => 
        segment.value >= 50 && segment.value <= 250
      );
      
      if (attractivePrizes.length > 0) {
        // Pick a random attractive prize
        const randomIndex = Math.floor(Math.random() * attractivePrizes.length);
        selectedSegment = attractivePrizes[randomIndex];
        console.log('First-time player! Awarded an attractive prize:', selectedSegment.label);
      }
    }
    
    // If not a first-time player or if no attractive prizes were found, use normal probability
    if (!selectedSegment) {
      const roll = Math.random();
      let cumulativeProbability = 0;
      
      for (const segment of wheelOfDestiny.segments) {
        cumulativeProbability += segment.probability;
        if (roll <= cumulativeProbability) {
          selectedSegment = segment;
          break;
        }
      }
      
      // If no segment was selected (shouldn't happen normally), use the last one
      if (!selectedSegment) {
        selectedSegment = wheelOfDestiny.segments[wheelOfDestiny.segments.length - 1];
      }
    }
    
    // Generate unique spin ID to prevent duplicates
    const generateSpinId = () => {
      return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };
    
    // Create spin result
    const spinResult = {
      id: generateSpinId(),
      timestamp: new Date().toISOString(),
      type: spinType,
      segment: selectedSegment,
      claimed: false
    };
    
    // Atomically update wheel state to avoid overwriting free spin flags
    setWheelOfDestiny(prev => {
      const baseState = spinType === 'free'
        ? { ...prev, freeSpinAvailable: false, lastFreeSpinDate: nowISOForSpin }
        : { ...prev, spinsAvailable: prev.spinsAvailable - 1 };
      
      const newState = {
        ...baseState,
        currentSpin: spinResult,
        history: [spinResult, ...(prev.history || [])].slice(0, 20)
      };
      
      try {
        localStorage.setItem('wheelOfDestiny', JSON.stringify(newState));
        console.log('Spin result saved to localStorage:', spinResult.id);
      } catch (error) {
        console.error('Failed to save spin to localStorage:', error);
      }
      
      return newState;
    });
    
    return spinResult;
  };
  
  // Claim wheel spin reward with improved error handling and retry logic
  const claimWheelReward = async (spinId, retryCount = 0) => {
    if (!user) return { success: false, message: 'No user logged in' };
    
    console.log('Attempting to claim spin:', spinId, 'Retry count:', retryCount);
    console.log('Current spin:', wheelOfDestiny.currentSpin);
    console.log('Spin history length:', wheelOfDestiny.history.length);
    
    // Check if already claiming this spin
    if (claimingSpins.has(spinId)) {
      console.warn('Claim already in progress for spin:', spinId);
      return { success: false, message: 'Claim already in progress' };
    }
    
    // Mark as claiming
    setClaimingSpins(prev => new Set([...prev, spinId]));
    
    try {
      // First, try to get the latest state from localStorage
      let currentWheelState = wheelOfDestiny;
      try {
        const storedWheel = localStorage.getItem('wheelOfDestiny');
        if (storedWheel) {
          const parsedWheel = JSON.parse(storedWheel);
          currentWheelState = parsedWheel;
          console.log('Retrieved wheel state from localStorage for claim validation');
        }
      } catch (storageError) {
        console.warn('Failed to read from localStorage, using current state:', storageError);
      }
      
      // Find the spin in either currentSpin or history
      let targetSpin = currentWheelState.currentSpin?.id === spinId ? 
        currentWheelState.currentSpin : 
        currentWheelState.history.find(spin => spin.id === spinId);
      
      if (!targetSpin) {
        console.error('Spin not found in current state:', spinId);
        console.log('Available spins:', {
          currentSpin: currentWheelState.currentSpin?.id,
          historyIds: currentWheelState.history.map(s => s.id)
        });
        
        // Retry logic for missing spins (might be a timing issue)
        if (retryCount < 2) {
          console.log('Retrying claim after 500ms delay...');
          await new Promise(resolve => setTimeout(resolve, 500));
          return claimWheelReward(spinId, retryCount + 1);
        }
        
        return { success: false, message: `Spin with ID ${spinId.substring(0, 8)}... not found` };
      }
      
      if (targetSpin.claimed) {
        console.warn('Spin already claimed:', spinId);
        return { success: false, message: 'Invalid spin or already claimed' };
      }
      
      // Update user's points
      const rewardAmount = targetSpin.segment?.value || 0;
      if (rewardAmount > 0) {
        // Update user points
        const pointsResult = await updateUserPoints(rewardAmount);
        if (pointsResult && pointsResult.error) {
          console.error('Failed to update user points:', pointsResult.error);
          return { success: false, message: 'Failed to award points' };
        }
        console.log(`Added ${rewardAmount} Golden Credits to user balance`);
      }
      
      // Create updated wheel state
      const updatedHistory = currentWheelState.history.map(spin => 
        spin.id === spinId ? { ...spin, claimed: true } : spin
      );
      
      const updatedCurrentSpin = currentWheelState.currentSpin?.id === spinId ? 
        { ...currentWheelState.currentSpin, claimed: true } : 
        currentWheelState.currentSpin;
      
      const newWheelState = {
        ...currentWheelState,
        currentSpin: updatedCurrentSpin,
        history: updatedHistory
      };
      
      // Immediately save to localStorage before updating state
      try {
        localStorage.setItem('wheelOfDestiny', JSON.stringify(newWheelState));
        console.log('Claimed spin state saved to localStorage:', spinId);
      } catch (storageError) {
        console.error('Failed to save claimed state to localStorage:', storageError);
        return { success: false, message: 'Failed to save claim state' };
      }
      
      // Update React state
      setWheelOfDestiny(newWheelState);
      
      console.log(`Successfully claimed ${rewardAmount} Golden Credits for spin:`, spinId);
      return { success: true, amount: rewardAmount };
      
    } catch (error) {
      console.error('Error claiming reward:', error);
      
      // Retry logic for unexpected errors
      if (retryCount < 1) {
        console.log('Retrying claim due to error after 1000ms delay...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return claimWheelReward(spinId, retryCount + 1);
      }
      
      return { success: false, message: `Error claiming reward: ${error.message}` };
    } finally {
      // Remove from claiming set
      setClaimingSpins(prev => {
        const newSet = new Set(prev);
        newSet.delete(spinId);
        return newSet;
      });
    }
  };
  
  // Purchase wheel spin
  const purchaseWheelSpin = (quantity = 1) => {
    if (!user) return false;
    
    const cost = 100 * quantity; // 100 credits per spin
    
    // Check if user has enough points
    if ((user.points || 0) < cost) {
      return false;
    }
    
    // Deduct points
    updateUserPoints(-cost);
    
    // Add spins
    setWheelOfDestiny(prev => ({
      ...prev,
      spinsAvailable: prev.spinsAvailable + quantity
    }));
    
    return true;
  };
  
  // Award points for specific game events (win, loss, participation)
  const awardGameReward = useCallback(async (gameId, rewardType) => {
    if (!user) return { error: 'User not found' }; // Return error object

    // Define reward structures (can be moved to a config file or fetched from backend)
    const gameRewards = {
      'marks-of-destiny': {
        win: { points: 15, message: 'Victory in Marks of Destiny!' },
        loss: { points: 2, message: 'Valiant effort in Marks of Destiny.' },
        participation: { points: 5, message: 'Played Marks of Destiny.' },
      },
      'sands-of-time-quiz': {
        correctAnswerStreak: (streak) => ({ points: streak * 2, message: `Correct answer streak of ${streak}!` }),
        completedQuiz: { points: 10, message: 'Quiz completed!' },
      },
      // ... other games
    };

    const rewardsForGame = gameRewards[gameId];
    if (!rewardsForGame) {
      console.warn(`No reward definition for game: ${gameId}`);
      return { error: `No reward definition for game: ${gameId}` }; // Return error object
    }

    let rewardConfig = rewardsForGame[rewardType];
    if (typeof rewardConfig === 'function') {
      // Handle dynamic rewards like streaks
      // This part needs more context on how 'value' for streak is passed or determined
      // For now, assuming a placeholder or that it's handled before calling
      // Example: if rewardType is 'correctAnswerStreak', value might be the streak count
      // This function expects 'value' to be passed if rewardConfig is a function
      // Temporarily returning 0 if it's a function and value isn't correctly handled.
      // This needs to be fleshed out based on game logic.
      console.warn(`Reward type ${rewardType} for game ${gameId} is a function but not fully implemented here.`);
      return { error: `Dynamic reward ${rewardType} not fully implemented.` }; // Return error object
    }

    if (!rewardConfig) {
      console.warn(`No reward definition for type: ${rewardType} in game: ${gameId}`);
      return { error: `No reward definition for type: ${rewardType} in game: ${gameId}` }; // Return error object
    }

    const pointsToAward = rewardConfig.points || 0;

    if (pointsToAward > 0) {
      const updateResult = await updateUserPoints(pointsToAward);
      if (updateResult && updateResult.error) {
        console.error('Error in updateUserPoints called from awardGameReward:', updateResult.error);
        return { error: updateResult.error, pointsAwarded: 0 }; // Propagate the error and indicate 0 points awarded
      }
    }
    
    // Return the amount of points awarded and any message
    return { pointsAwarded: pointsToAward, message: rewardConfig.message }; // Return object with points and potential error

  }, [user, updateUserPoints]);

  // Reset rewards (for testing)
  const resetRewards = () => {
    setDailyLogin({
      streak: 0,
      longestStreak: 0,
      lastClaimDate: null,
      canClaim: true,
      streakMilestones: dailyLogin.streakMilestones.map(milestone => ({
        ...milestone,
        claimed: false
      }))
    });
    
    setWheelOfDestiny({
      ...wheelOfDestiny,
      freeSpinAvailable: true,
      spinsAvailable: 0,
      lastFreeSpinDate: null,
      currentSpin: null,
      history: []
    });
  };
  
  const contextValue = {
    dailyLogin,
    wheelOfDestiny,
    claimDailyReward,
    claimMilestoneReward,
    spinWheel,
    claimWheelReward,
    purchaseWheelSpin,
    awardGameReward,
    resetRewards
  };
  
  return (
    <RewardContext.Provider value={contextValue}>
      {children}
    </RewardContext.Provider>
  );
};

RewardProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default RewardProvider;