import React from 'react';
import TaskItem from './TaskItem';

const TaskList = ({ tasks, onNavigate, onClaim, onAdBoost }) => {
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