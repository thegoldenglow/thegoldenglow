import React from 'react';
import TaskItem from './TaskItem';

const TaskList = ({ tasks, onNavigate, onClaim, onAdBoost, onVerify, maxItems }) => {
  // Separate tasks into completed but not claimed, incomplete, and claimed
  const completedNotClaimed = tasks.filter(task => task.completed && !task.claimed);
  const notCompleted = tasks.filter(task => !task.completed);
  const claimed = tasks.filter(task => task.claimed);
  
  // Sort tasks by priority order
  const sortedTasks = [
    ...completedNotClaimed, // Show completed tasks that can be claimed first
    ...notCompleted,        // Then show tasks that still need completion
    ...claimed              // Show claimed tasks at the bottom
  ];

  const visibleTasks = typeof maxItems === 'number' ? sortedTasks.slice(0, maxItems) : sortedTasks;
  
  return (
    <div className="space-y-4">
      {visibleTasks.length === 0 ? (
        <div className="text-center py-8 text-textLight bg-deepLapisDark/30 rounded-lg">
          <p>No tasks available. Check back later!</p>
        </div>
      ) : (
        visibleTasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onNavigate={onNavigate}
            onClaim={onClaim}
            onAdBoost={onAdBoost}
            onVerify={onVerify}
          />
        ))
      )}
    </div>
  );
};

export default TaskList;