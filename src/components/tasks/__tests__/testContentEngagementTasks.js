/**
 * Test Content Engagement tasks for different social media platforms
 * This file creates sample tasks to test the embedded post functionality
 */

export const testContentEngagementTasks = [
  {
    id: 'youtube-test-1',
    title: 'Watch YouTube Video',
    description: 'Watch this educational video about blockchain technology',
    taskCategory: 'Content Engagement',
    postUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    requiredViewingTime: 30,
    requirement: 1,
    progress: 0,
    rewards: [{ type: 'points', amount: 100 }],
    isCompleted: false
  },
  {
    id: 'instagram-test-1',
    title: 'View Instagram Post',
    description: 'Check out this amazing post about our latest updates',
    taskCategory: 'Content Engagement',
    postUrl: 'https://www.instagram.com/p/ABC123/',
    requiredViewingTime: 25,
    requirement: 1,
    progress: 0,
    rewards: [{ type: 'points', amount: 75 }],
    isCompleted: false
  },
  {
    id: 'tiktok-test-1',
    title: 'Watch TikTok Video',
    description: 'Enjoy this fun TikTok video from our community',
    taskCategory: 'Content Engagement',
    postUrl: 'https://www.tiktok.com/@username/video/1234567890123456789',
    requiredViewingTime: 20,
    requirement: 1,
    progress: 0,
    rewards: [{ type: 'points', amount: 50 }],
    isCompleted: false
  },
  {
    id: 'twitter-test-1',
    title: 'View Twitter Post',
    description: 'Read this important announcement on Twitter/X',
    taskCategory: 'Content Engagement',
    postUrl: 'https://twitter.com/username/status/1234567890123456789',
    requiredViewingTime: 15,
    requirement: 1,
    progress: 0,
    rewards: [{ type: 'points', amount: 40 }],
    isCompleted: false
  },
  {
    id: 'generic-test-1',
    title: 'View External Content',
    description: 'Check out this external content',
    taskCategory: 'Content Engagement',
    postUrl: 'https://example.com/content',
    requiredViewingTime: 35,
    requirement: 1,
    progress: 0,
    rewards: [{ type: 'points', amount: 120 }],
    isCompleted: false
  }
];

/**
 * Function to add test tasks to the task manager for testing purposes
 * @param {TasksManager} tasksManager - The tasks manager instance
 */
export const addTestContentEngagementTasks = (tasksManager) => {
  if (!tasksManager) {
    console.error('TasksManager not provided');
    return;
  }

  // Add test tasks to the task list
  testContentEngagementTasks.forEach(task => {
    const existingTaskIndex = tasksManager.taskList.findIndex(t => t.id === task.id);
    if (existingTaskIndex === -1) {
      tasksManager.taskList.push(task);
      console.log(`Added test task: ${task.title}`);
    } else {
      console.log(`Test task already exists: ${task.title}`);
    }
  });

  // Dispatch update to refresh the UI
  if (tasksManager.dispatch) {
    tasksManager.dispatch({
      type: 'TASKS_LOADED',
      payload: {
        tasks: tasksManager.taskList,
        userStats: tasksManager.userStats,
        streakData: tasksManager.streakData
      }
    });
  }

  console.log('Test Content Engagement tasks added successfully');
};