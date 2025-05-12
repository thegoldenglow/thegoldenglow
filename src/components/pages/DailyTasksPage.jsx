import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTasks } from '../../contexts/TasksContext';
import TaskList from '../tasks/TaskList';
import StreakCalendar from '../tasks/StreakCalendar';
import RewardDisplay from '../tasks/RewardDisplay';
import AdRewardModal from '../tasks/AdRewardModal';
import { getNextMilestone, getTimeUntilExpiration } from '../../utils/taskUtils';

const DailyTasksPage = () => {
  const { state, tasksManager } = useTasks();
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [showAdModal, setShowAdModal] = useState(false);
  const [currentTaskForAd, setCurrentTaskForAd] = useState(null);
  const navigate = useNavigate();

  // Update the countdown timer every minute
  useEffect(() => {
    const updateCountdown = () => {
      if (state.tasks.length > 0 && state.tasks[0].expiresAt) {
        setTimeUntilReset(getTimeUntilExpiration(state.tasks[0].expiresAt));
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [state.tasks]);

  // Check if there's an available milestone reward to claim
  const nextMilestone = getNextMilestone(state.streak);

  // Handle task navigation (for game-specific tasks)
  const handleTaskNavigation = (task) => {
    if (task.targetGame) {
      navigate(`/games/${task.targetGame}`);
    }
  };

  // Handle showing the ad reward modal
  const handleAdBoost = (task) => {
    setCurrentTaskForAd(task);
    setShowAdModal(true);
  };

  // Handle ad completion
  const handleAdCompleted = async (success) => {
    if (success && currentTaskForAd) {
      await tasksManager.claimTaskReward(currentTaskForAd.id, true);
    }
    setShowAdModal(false);
    setCurrentTaskForAd(null);
  };

  // Handle claiming a task reward without ad
  const handleClaimReward = async (taskId) => {
    await tasksManager.claimTaskReward(taskId, false);
  };

  // Handle claiming a milestone reward
  const handleClaimMilestone = async (milestone) => {
    await tasksManager.claimMilestoneReward(milestone);
  };

  if (state.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin w-12 h-12 border-4 border-royalGold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full max-w-6xl mx-auto px-4 py-6 relative">
      {/* Back Button - positioned at the top with enhanced visibility */}
      <div className="mb-8">
        <Link to="/" className="flex items-center text-royalGold hover:text-textGold transition-colors mb-4 p-3 bg-deepLapisLight/30 rounded-lg border border-royalGold/30 inline-block">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
          </svg>
          <span className="text-lg font-medium">Back to Home</span>
        </Link>
      </div>
      
      {/* Header Section */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-calligraphy text-textGold mb-2 shimmer">
          Mystic Quests
        </h1>
        
        {/* Streak and Timer */}
        <div className="flex justify-center items-center space-x-6 mb-4">
          <div className="flex items-center">
            <span className="text-amber-500 mr-2">🔥</span>
            <span className="text-royalGold">
              Flame of Dedication: {state.streak.current} Day{state.streak.current !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="text-amber-500 mr-2">⏳</span>
            <span className="text-royalGold">New Quests in {timeUntilReset}</span>
          </div>
        </div>
      </div>
      
      {/* Streak Calendar */}
      <StreakCalendar 
        streak={state.streak} 
        onClaimMilestone={handleClaimMilestone} 
      />
      
      {/* Task List Section */}
      <div className="my-6">
        <h2 className="text-2xl font-primary text-textGold mb-4">Daily Tasks</h2>
        <TaskList 
          tasks={state.tasks}
          onNavigate={handleTaskNavigation}
          onClaim={handleClaimReward}
          onAdBoost={handleAdBoost}
        />
      </div>
      
      {/* User Stats / Rewards Display */}
      <div className="mt-8">
        <RewardDisplay userStats={state.userStats} />
      </div>
      
      {/* Ad Modal */}
      {showAdModal && (
        <AdRewardModal
          task={currentTaskForAd}
          onClose={() => setShowAdModal(false)}
          onAdCompleted={handleAdCompleted}
        />
      )}
    </div>
  );
};

export default DailyTasksPage;