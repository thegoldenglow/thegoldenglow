import React, { useState } from 'react';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import { formatReward, getTaskRequirement } from '../../utils/taskUtils';
import EmbeddedPostViewer from './EmbeddedPostViewer';
import { useTasks } from '../../contexts/TasksContext';

const TaskItem = ({ task, onNavigate, onClaim, onAdBoost, onVerify }) => {
  const [showEmbeddedPost, setShowEmbeddedPost] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { tasksManager } = useTasks();
  // Calculate progress percentage
  const progressPercentage = task.requirement > 0 
    ? Math.min(100, (task.progress / task.requirement) * 100) 
    : 0;
    
  // Format rewards for display
  const formattedRewards = task.rewards.map(formatReward);
  
  // Get the requirement text
  const requirementText = getTaskRequirement(task);

  // Check if this is a Content Engagement task with embedded post
  const isContentEngagementTask = task.taskCategory === 'Content Engagement' && task.postUrl;

  // Handle embedded post viewing completion
  const handleViewingComplete = async (viewingTime) => {
    try {
      // Mark task as completed using enhanced TasksManager method
      if (tasksManager) {
        const requiredTime = task.requiredViewingTime || 30;
        const success = await tasksManager.completeEmbeddedPostTask(
          task.id, 
          viewingTime || requiredTime, 
          requiredTime
        );
        
        if (success) {
          console.log('Embedded post viewing task completed:', {
            taskId: task.id,
            taskTitle: task.title,
            viewingTime: viewingTime || requiredTime,
            requiredTime
          });
        } else {
          console.error('Failed to complete embedded post task');
        }
      }
    } catch (error) {
      console.error('Error completing embedded post task:', error);
    }
    setShowEmbeddedPost(false);
  };

  // Handle Play Now button click
  const handlePlayNowClick = () => {
    if (isContentEngagementTask) {
      setShowEmbeddedPost(true);
    } else {
      console.log('=== PLAY NOW BUTTON CLICKED ===');
      console.log('Task:', task?.title || task?.id);
      console.log('Task type:', task?.type);
      console.log('Target game:', task?.targetGame);
      console.log('Game identifier:', task?.game_identifier);
      console.log('Full task object:', task);
      console.log('onNavigate function available:', typeof onNavigate === 'function');
      
      if (onNavigate && typeof onNavigate === 'function') {
        console.log('Calling onNavigate with task...');
        onNavigate(task);
      } else {
        console.error('TaskItem: onNavigate not provided for task:', task);
      }
    }
  };
  
  return (
    <div className="bg-deepLapisDark/70 backdrop-blur-sm rounded-lg p-4 mb-4 border border-royalGold/30 hover:border-royalGold/60 transition-all shadow-lg">
      {/* Task Header */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium text-textGold">{task.title}</h3>
        
        <div className="flex items-center gap-2">
          {task.completed && (
            <span className="inline-flex items-center" title="Completed" aria-label="Completed">
              <Icon name="check" size={18} className="text-green-400 drop-shadow-sm" />
            </span>
          )}
          {/* Task type badge */}
          <div className="px-2 py-1 bg-royalGold/20 rounded-full text-xs text-textGold">
            {task.type.replace('_', ' ')}
          </div>
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
        <span className="text-textGold font-medium">{Math.min(task.progress, task.requirement)} / {task.requirement}</span>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        {!task.completed && (
          <>
            <Button
              onClick={handlePlayNowClick}
              variant="primary"
              size="medium"
            >
              {isContentEngagementTask ? 'View Post' : 'Play Now'}
            </Button>
            <Button
              onClick={async (e) => { 
                e.stopPropagation(); 
                if (onVerify && !isVerifying) {
                  setIsVerifying(true);
                  try {
                    await onVerify(task);
                  } finally {
                    // Reset loading state after a short delay to show completion
                    setTimeout(() => setIsVerifying(false), 1000);
                  }
                }
              }}
              loading={isVerifying}
              className="px-3 py-2 bg-blue-600/80 text-white rounded hover:bg-blue-600 transition"
            >
              Verify
            </Button>
          </>
        )}
        {task.completed && !task.claimed && (
          <>
            <Button
              onClick={(e) => { e.stopPropagation(); onClaim && onClaim(task.id); }}
              variant="success"
              size="medium"
            >
              Claim Reward
            </Button>
            {task.adBoostAvailable && onAdBoost && (
              <Button
                onClick={(e) => { e.stopPropagation(); onAdBoost && onAdBoost(task); }}
                variant="secondary"
                size="medium"
              >
                Watch Ad
              </Button>
            )}
          </>
        )}
        {task.claimed && (
          <span className="px-3 py-2 bg-green-700/30 text-green-300 rounded inline-flex items-center gap-1">
            <Icon name="check" size={16} className="text-green-300" />
            Claimed
          </span>
        )}
      </div>
      
      {/* Rewards Display */}
      <div className="mt-3 text-xs text-textLight">
        <div className="flex items-center flex-wrap gap-2">
          <span className="opacity-80">Rewards:</span>
          {formattedRewards.map((reward, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-royalGold/10 text-textGold">
              <span>{reward.icon}</span>
              <span className="font-medium">{reward.amount}</span>
              <span className="opacity-90">{reward.displayName}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Embedded Post Viewer Modal */}
      {showEmbeddedPost && isContentEngagementTask && (
        <EmbeddedPostViewer
          postUrl={task.postUrl}
          requiredViewingTime={task.requiredViewingTime || 30}
          onViewingComplete={handleViewingComplete}
          onClose={() => setShowEmbeddedPost(false)}
        />
      )}
    </div>
  );
};

export default TaskItem;