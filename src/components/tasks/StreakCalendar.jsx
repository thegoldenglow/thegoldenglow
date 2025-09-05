import React from 'react';
import { formatReward } from '../../utils/taskUtils';

const StreakCalendar = ({ streak, onClaimMilestone }) => {
  // Create a 7-day array for the streak calendar
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  
  // Generate the days for calendar display
  const calendarDays = daysOfWeek.map((day, index) => {
    const dayDiff = index - today;
    const isToday = dayDiff === 0;
    const isPast = dayDiff < 0;
    const isFuture = dayDiff > 0;
    const dayNum = streak.current + dayDiff;
    const isActive = isPast && dayNum > 0; // Days in the current streak
    
    return {
      name: day,
      dayNum: Math.max(0, dayNum),
      isToday,
      isPast,
      isFuture,
      isActive
    };
  });

  // Find the next milestone that can be claimed
  const canClaimMilestone = streak.milestones.find(
    m => !m.claimed && streak.current >= m.days
  );
  
  return (
    <div className="bg-deepLapisDark/50 backdrop-blur-sm p-4 rounded-lg border border-royalGold/30">
      <h3 className="text-lg font-medium text-textGold mb-3">Streak Calendar</h3>
      
      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {calendarDays.map((day, index) => (
          <div 
            key={index} 
            className={`text-center py-2 rounded-md ${
              day.isToday 
                ? 'bg-royalGold text-deepLapis font-bold' 
                : day.isActive 
                  ? 'bg-royalGold/20 text-textGold' 
                  : 'bg-deepLapis/30 text-textLight'
            }`}
          >
            <div className="text-xs mb-1">{day.name}</div>
            <div className="text-sm">{day.dayNum > 0 ? day.dayNum : '-'}</div>
          </div>
        ))}
      </div>
      
      {/* Milestone Rewards */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-textGold mb-2">Milestone Rewards</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {streak.milestones.map((milestone, index) => {
            const isClaimed = milestone.claimed;
            const isReached = streak.current >= milestone.days;
            const canClaim = isReached && !isClaimed;
            
            return (
              <div 
                key={index}
                className={`border rounded-md p-2 ${
                  isClaimed 
                    ? 'bg-royalGold/10 border-royalGold/30' 
                    : isReached 
                      ? 'bg-emerald-900/20 border-emerald-600/40' 
                      : 'bg-deepLapis/30 border-deepLapis/50'
                }`}
              >
                <div className="text-xs font-medium mb-1">
                  {milestone.days} Day{milestone.days !== 1 ? 's' : ''}
                </div>
                
                <div className="space-y-1">
                  {milestone.rewards.map((reward, rewardIndex) => {
                    const formattedReward = formatReward(reward);
                    return (
                      <div key={rewardIndex} className="flex items-center">
                        <span className="text-lg mr-1">{formattedReward.icon}</span>
                        <span className="text-xs text-textGold">
                          {formattedReward.amount} {formattedReward.displayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {canClaim && (
                  <button
                    onClick={() => onClaimMilestone(milestone.days)}
                    className="mt-2 w-full px-2 py-1 text-xs bg-gradient-gold text-deepLapis rounded-md hover:opacity-90"
                  >
                    Claim
                  </button>
                )}
                
                {isClaimed && (
                  <div className="mt-2 w-full px-2 py-1 text-xs text-center text-textGold bg-royalGold/10 rounded-md">
                    Claimed
                  </div>
                )}
                
                {!isReached && (
                  <div className="mt-2 w-full px-2 py-1 text-xs text-center text-textLight bg-deepLapis/20 rounded-md">
                    {milestone.days - streak.current} day{milestone.days - streak.current !== 1 ? 's' : ''} left
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Streak Info */}
      {streak.current > 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-textLight">
            You've maintained your daily tasks streak for 
            <span className="text-textGold font-medium mx-1">{streak.current}</span>
            day{streak.current !== 1 ? 's' : ''}!
          </p>
          {canClaimMilestone && (
            <p className="text-xs text-emerald-400 mt-1">
              You've reached a milestone! Claim your rewards.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default StreakCalendar;