import React, { useState } from 'react';
import { useReward } from '../../contexts/RewardContext';
import { useWallet } from '../../contexts/WalletContext';
import { FiCheckCircle, FiAward, FiHelpCircle, FiCheck, FiCalendar } from 'react-icons/fi';

const DailyLoginCalendar = () => {
  const { dailyLogin, claimDailyReward, claimMilestoneReward } = useReward();
  const { addTransaction } = useWallet();
  
  const [showInfo, setShowInfo] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [showMilestoneInfo, setShowMilestoneInfo] = useState(null);
  
  // Generate calendar days (current week)
  const generateCalendarDays = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const result = [];
    
    // Start from 6 days ago (beginning of the week)
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() - dayOfWeek + i);
      
      const isToday = date.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0);
      
      // Convert to timestamp for comparison with last claim
      const dateTimestamp = date.getTime();
      const lastClaimDate = dailyLogin.lastClaimDate 
        ? new Date(dailyLogin.lastClaimDate).setHours(0, 0, 0, 0) 
        : 0;
      
      // Check if this day was claimed
      const claimed = lastClaimDate >= dateTimestamp;
      
      result.push({
        date,
        day: date.getDate(),
        isToday,
        claimed: isToday ? !dailyLogin.canClaim : claimed
      });
    }
    
    return result;
  };
  
  const days = generateCalendarDays();
  
  // Handle daily reward claim
  const handleClaimDailyReward = () => {
    if (!dailyLogin.canClaim) return;
    
    const result = claimDailyReward();
    
    if (result) {
      // Record transaction
      addTransaction(result.amount, 'daily_login', `Daily login reward (day ${result.streak})`);
      
      // Show success message
      setSuccessData(result);
      setShowSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessData(null);
      }, 5000);
    }
  };
  
  // Handle milestone claim
  const handleClaimMilestone = (milestone) => {
    if (dailyLogin.streak < milestone.days || milestone.claimed) return;
    
    const result = claimMilestoneReward(milestone);
    
    if (result && result.rewards) {
      // Record transaction if there are golden credits
      if (result.rewards.golden_credits) {
        addTransaction(
          result.rewards.golden_credits, 
          'milestone_reward', 
          `${milestone.days}-day streak milestone reward`
        );
      }
      
      // Show success message
      setSuccessData({
        milestone: true,
        days: milestone.days,
        rewards: result.rewards
      });
      setShowSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessData(null);
      }, 5000);
    }
  };
  
  return (
    <div className="bg-deepLapisDark border border-royalGold/30 rounded-lg p-4 shadow-glow mb-6">
      <div className="relative mb-3">
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className="absolute -top-2 -right-2 text-royalGold text-xl bg-deepLapisDark p-1 rounded-full"
        >
          <FiHelpCircle />
        </button>
        
        <div className="flex items-center gap-2 justify-center mb-1">
          <FiCalendar className="text-royalGold" />
          <h3 className="text-center text-xl font-primary text-royalGold">Daily Rewards</h3>
        </div>
        
        {showInfo && (
          <div className="absolute top-8 right-0 bg-deepLapisDark border border-royalGold rounded-md p-3 z-10 shadow-lg w-64">
            <p className="text-sm text-textLight mb-2">Log in daily to earn Golden Credits and build your streak!</p>
            <p className="text-xs text-textLight mb-1">• Each daily login earns you 10-30 GC</p>
            <p className="text-xs text-textLight mb-1">• Longer streaks = bigger rewards</p>
            <p className="text-xs text-textLight">• Claim milestone bonuses for extra rewards</p>
          </div>
        )}
      </div>
      
      {/* Streak Display */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-textLight">
          <span className="block">Current Streak</span>
          <span className="text-royalGold text-xl font-bold">{dailyLogin.streak} Days</span>
        </div>
        
        <div className="text-sm text-textLight">
          <span className="block">Longest Streak</span>
          <span className="text-royalGold text-xl font-bold">{dailyLogin.longestStreak} Days</span>
        </div>
      </div>
      
      {/* Calendar */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayLabel, idx) => (
          <div key={`header-${idx}`} className="text-center text-xs text-textLight font-bold">
            {dayLabel}
          </div>
        ))}
        
        {days.map((day, idx) => (
          <div 
            key={`day-${idx}`} 
            className={`text-center p-2 rounded-full relative ${
              day.isToday ? 'border-2 border-royalGold' : ''
            } ${
              day.claimed ? 'bg-royalGold/20' : 'bg-deepLapis/50'
            }`}
          >
            <span className={day.isToday ? 'text-royalGold font-bold' : 'text-textLight'}>
              {day.day}
            </span>
            
            {day.claimed && (
              <div className="absolute -top-1 -right-1 text-emerald-400 text-xs bg-deepLapisDark rounded-full">
                <FiCheckCircle />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Daily Claim Button */}
      <div className="mb-6">
        <button 
          onClick={handleClaimDailyReward}
          disabled={!dailyLogin.canClaim}
          className={`w-full py-3 rounded-md text-center font-bold text-lg ${
            dailyLogin.canClaim 
              ? 'bg-royalGold text-deepLapis shadow-glow hover:bg-royalGold/80 transition' 
              : 'bg-gray-600 text-gray-300 cursor-not-allowed'
          }`}
        >
          {dailyLogin.canClaim ? 'Claim Daily Reward' : 'Already Claimed Today'}
        </button>
      </div>
      
      {/* Streak Milestones */}
      <div className="mb-2">
        <h4 className="flex items-center gap-2 text-textLight font-semibold mb-3">
          <FiAward className="text-royalGold" /> Streak Milestones
        </h4>
        
        <div className="space-y-3">
          {dailyLogin.streakMilestones.map((milestone, idx) => (
            <div 
              key={`milestone-${idx}`} 
              className={`border rounded-md relative ${
                milestone.claimed
                  ? 'border-emerald-600/50 bg-emerald-900/10'
                  : dailyLogin.streak >= milestone.days
                    ? 'border-royalGold/50 bg-royalGold/10 shadow-glow'
                    : 'border-gray-600/30 bg-transparent'
              }`}
            >
              <div className="p-3 flex justify-between items-center">
                <div>
                  <span className="block text-royalGold font-bold">
                    {milestone.days} Day Streak
                  </span>
                  <div className="text-xs text-textLight mt-1">
                    {milestone.reward.golden_credits && (
                      <span className="block">{milestone.reward.golden_credits} Golden Credits</span>
                    )}
                    {milestone.reward.wheel_spins && (
                      <span className="block">{milestone.reward.wheel_spins} Wheel Spin(s)</span>
                    )}
                    {milestone.reward.badge && (
                      <span className="block">Badge: {milestone.reward.badge}</span>
                    )}
                    {milestone.reward.title && (
                      <span className="block">Title: {milestone.reward.title}</span>
                    )}
                  </div>
                </div>
                
                <div>
                  {milestone.claimed ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <FiCheck /> Claimed
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleClaimMilestone(milestone)}
                      disabled={dailyLogin.streak < milestone.days}
                      className={`px-3 py-1 rounded ${
                        dailyLogin.streak >= milestone.days
                          ? 'bg-royalGold text-deepLapis hover:bg-royalGold/80 transition'
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {dailyLogin.streak >= milestone.days ? 'Claim' : `${milestone.days - dailyLogin.streak} days left`}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Info button */}
              <button
                onClick={() => setShowMilestoneInfo(showMilestoneInfo === idx ? null : idx)}
                className="absolute top-2 right-2 text-sm text-textLight/60 hover:text-textLight"
              >
                <FiHelpCircle />
              </button>
              
              {/* Milestone info popup */}
              {showMilestoneInfo === idx && (
                <div className="p-3 bg-deepLapis border-t border-royalGold/30 text-sm">
                  <p className="text-textLight">
                    Maintain a daily login streak of {milestone.days} days to unlock this reward.
                    Login every day to keep your streak going!
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Success Popup */}
      {showSuccess && successData && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-emerald-900/90 border border-emerald-500 text-white rounded-lg p-4 shadow-lg z-50 max-w-xs w-full">
          {successData.milestone ? (
            <div className="text-center">
              <h4 className="font-bold text-lg flex items-center justify-center gap-2">
                <FiAward className="text-yellow-300" /> 
                Milestone Reward!
              </h4>
              <p className="mb-2">{successData.days}-day streak completed!</p>
              <div className="text-sm">
                {successData.rewards.golden_credits && (
                  <p>+{successData.rewards.golden_credits} Golden Credits</p>
                )}
                {successData.rewards.wheel_spins && (
                  <p>+{successData.rewards.wheel_spins} Wheel Spin(s)</p>
                )}
                {successData.rewards.badge && (
                  <p>New Badge: {successData.rewards.badge}</p>
                )}
                {successData.rewards.title && (
                  <p>New Title: {successData.rewards.title}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h4 className="font-bold text-lg flex items-center justify-center gap-2">
                <FiCheckCircle /> 
                Daily Reward Claimed!
              </h4>
              <p className="mb-1">Day {successData.streak}</p>
              <p className="font-bold">+{successData.amount} Golden Credits</p>
              {successData.wheelSpins > 0 && (
                <p className="mt-1">+{successData.wheelSpins} Wheel Spin</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyLoginCalendar;