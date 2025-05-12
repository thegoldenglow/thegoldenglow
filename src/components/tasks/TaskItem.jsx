import React from 'react';
import { formatReward, getTaskRequirement } from '../../utils/taskUtils';

const TaskItem = ({ task, onNavigate, onClaim, onAdBoost }) => {
  // Calculate progress percentage
  const progressPercentage = task.requirement > 0 
    ? Math.min(100, (task.progress / task.requirement) * 100) 
    : 0;
    
  // Format rewards for display
  const formattedRewards = task.rewards.map(formatReward);
  
  // Get the requirement text
  const requirementText = getTaskRequirement(task);
  
  return (
    <div className="bg-deepLapisDark/70 backdrop-blur-sm rounded-lg p-4 mb-4 border border-royalGold/30 hover:border-royalGold/60 transition-all shadow-lg">
      {/* Task Header */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium text-textGold">{task.title}</h3>
        
        {/* Task type badge */}
        <div className="px-2 py-1 bg-royalGold/20 rounded-full text-xs text-textGold">
          {task.type.replace('_', ' ')}
        </div>
      </div>
      
      {/* Task Description */}
      <p className="text-sm text-textLight mb-3">{task.description}</p>
      
      {/* Progress Bar */}
      <div className="relative h-2 bg-deepLapis rounded-full mb-2">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-textGold rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      {/* Progress Text */}
      <div className="flex justify-between text-xs mb-4">
        <span className="text-textLight">{requirementText}</span>
        <span className="text-textGold">{task.progress}/{task.requirement}</span>
      </div>
      
      {/* Rewards */}
      <div className="flex items-center mb-3 space-x-1">
        <span className="text-sm text-textLight mr-1">Rewards:</span>
        {formattedRewards.map((reward, index) => (
          <div key={index} className="flex items-center bg-royalGold/10 rounded-full px-2 py-1">
            <span className="mr-1">{reward.icon}</span>
            <span className="text-xs text-textGold">{reward.amount} {reward.displayName}</span>
          </div>
        ))}
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between mt-2">
        {task.targetGame && !task.completed && (
          <button
            onClick={() => onNavigate(task)}
            className="px-3 py-1 bg-deepSapphire text-textLight rounded-md hover:bg-deepSapphire/80 transition-colors text-sm"
          >
            Play Now
          </button>
        )}
        
        {task.completed && !task.claimed && (
          <div className="flex space-x-2 w-full">
            <button
              onClick={() => onClaim(task.id)}
              className="flex-1 px-3 py-1 bg-gradient-gold text-deepLapis font-medium rounded-md hover:opacity-90 transition-opacity text-sm"
            >
              Claim Reward
            </button>
            
            {task.adBoostAvailable && (
              <button
                onClick={() => onAdBoost(task)}
                className="flex-1 px-3 py-1 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 transition-colors text-sm flex items-center justify-center"
              >
                <span className="mr-1">2x</span>
                Watch Ad
              </button>
            )}
          </div>
        )}
        
        {task.claimed && (
          <div className="px-3 py-1 bg-royalGold/20 text-textGold rounded-md text-sm w-full text-center">
            Claimed
          </div>
        )}
        
        {!task.completed && !task.targetGame && (
          <div className="text-xs text-textLight italic">
            Complete this task to earn rewards
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;