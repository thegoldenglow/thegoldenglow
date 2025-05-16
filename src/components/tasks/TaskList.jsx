import React, { useEffect, useState } from 'react';
import TaskItem from './TaskItem';

const TaskList = ({ tasks = [], onNavigate, onClaim, onAdBoost }) => {
  const [displayTasks, setDisplayTasks] = useState([]);
  
  // Generate fallback tasks if none are provided
  useEffect(() => {
    // If we have real tasks, use them
    if (tasks && tasks.length > 0) {
      console.log('TaskList: Using provided tasks:', tasks.length);
      setDisplayTasks(tasks);
      return;
    }
    
    // Try to load from emergency cache
    try {
      const emergencyTasks = localStorage.getItem('emergency_tasks');
      if (emergencyTasks) {
        const parsedTasks = JSON.parse(emergencyTasks);
        if (parsedTasks && parsedTasks.length > 0) {
          console.log('TaskList: Using emergency tasks from localStorage:', parsedTasks.length);
          
          // Convert to the expected format if necessary
          const formattedTasks = parsedTasks.map(task => ({
            id: task.id?.toString() || String(Math.random()),
            title: task.title || 'Unknown Task',
            description: task.description || 'Task details unavailable',
            type: task.type || 'DAILY_LOGIN', 
            targetGame: task.target_game || null,
            requirement: Number(task.requirement) || 1,
            progress: Number(task.progress) || 0,
            completed: Boolean(task.completed) || false,
            claimed: Boolean(task.claimed) || false,
            adBoostAvailable: task.ad_boost_available !== false,
            expiresAt: task.expires_at || new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
            rewards: [
              {
                type: task.reward_type || 'MYSTIC_COINS',
                amount: Number(task.reward_amount || task.reward) || 10
              }
            ]
          }));
          
          setDisplayTasks(formattedTasks);
          return;
        }
      }
    } catch (err) {
      console.error('Error loading emergency tasks in TaskList:', err);
    }
    
    // Last resort: Generate simpler default tasks
    console.log('TaskList: Generating fallback tasks');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const fallbackTasks = [
      {
        id: 'default-1',
        title: "Daily Meditation",
        description: "Spend a few moments in quiet reflection",
        type: "DAILY_LOGIN",
        targetGame: null,
        requirement: 1,
        progress: 1, // Auto-completed when opening the app
        completed: true,
        claimed: false,
        adBoostAvailable: true,
        expiresAt: tomorrow.toISOString(),
        rewards: [{ type: 'MYSTIC_COINS', amount: 100 }]
      },
      {
        id: 'default-2',
        title: "Explore Game Collection",
        description: "Browse through our collection of mystical games",
        type: "EXPLORATION",
        targetGame: null,
        requirement: 1,
        progress: 0,
        completed: false,
        claimed: false,
        adBoostAvailable: true,
        expiresAt: tomorrow.toISOString(),
        rewards: [{ type: 'MYSTIC_COINS', amount: 75 }]
      }
    ];
    
    setDisplayTasks(fallbackTasks);
  }, [tasks]);
  
  // Separate tasks into completed but not claimed, incomplete, and claimed
  const completedNotClaimed = displayTasks.filter(task => task.completed && !task.claimed);
  const notCompleted = displayTasks.filter(task => !task.completed);
  const claimed = displayTasks.filter(task => task.claimed);
  
  // Sort tasks by priority order
  const sortedTasks = [
    ...completedNotClaimed, // Show completed tasks that can be claimed first
    ...notCompleted,        // Then show tasks that still need completion
    ...claimed              // Show claimed tasks at the bottom
  ];
  
  return (
    <div className="space-y-4">
      {sortedTasks.length === 0 ? (
        <div className="text-center py-8 text-textLight bg-deepLapisDark/30 rounded-lg">
          <p>No tasks available. Check back later!</p>
        </div>
      ) : (
        sortedTasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onNavigate={onNavigate}
            onClaim={onClaim}
            onAdBoost={onAdBoost}
          />
        ))
      )}
    </div>
  );
};

export default TaskList;