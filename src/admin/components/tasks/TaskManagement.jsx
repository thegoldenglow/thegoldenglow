import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';
// Fix the import path for SyncTasksService which was causing app loading issues
import { SyncTasksService } from '../../../components/tasks/SyncTasksService';

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    activeTasks: 0,
    completionsToday: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const tasksPerPage = 5;
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(null);
  
  // Create sync service instance
  const syncService = new SyncTasksService();

  const initialTaskFormData = {
    title: '',
    description: '',
    taskCategory: 'Play Game',
    platform: 'Telegram',
    targetUsername: '',
    quantity: 1,
    gameIdentifier: '',
    reward: 10,
    status: 'Active'
  };
  const [taskFormData, setTaskFormData] = useState(initialTaskFormData);

  const availableGames = [
    { id: 'FlameOfWisdom', name: 'Flame Of Wisdom' },
    { id: 'GatesOfKnowledge', name: 'Gates Of Knowledge' },
    { id: 'MarksOfDestiny', name: 'Marks Of Destiny' },
    { id: 'MysticalTapJourney', name: 'Mystical Tap Journey' },
    { id: 'PathOfEnlightenment', name: 'Path Of Enlightenment' },
    { id: 'SacredTapping', name: 'Sacred Tapping' }
  ];

  const fetchTasksAndStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const { count, error: countError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotalTasksCount(count || 0);

      const from = (currentPage - 1) * tasksPerPage;
      const to = from + tasksPerPage - 1;

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .range(from, to)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Enhance tasks with locally stored extra fields
      let enhancedTasks = [];
      if (data && data.length > 0) {
        const taskExtraFields = JSON.parse(localStorage.getItem('taskExtraFields') || '{}');
        
        enhancedTasks = data.map(task => {
          const extraData = taskExtraFields[task.id] || {};
          return {
            ...task,
            platform: extraData.platform || 'Unknown',
            target_username: extraData.targetUsername || '',
            quantity: extraData.quantity || 1,
            game_identifier: extraData.gameIdentifier || ''
          };
        });
      }

      setTasks(enhancedTasks.length > 0 ? enhancedTasks : data || []);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const { count: activeCount, error: activeError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');

      if (activeError) throw activeError;

      const { count: todayCompletions, error: completionsError } = await supabase
        .from('task_completions')
        .select('*', { count: 'exact', head: true })
        .gte('completed_at', todayStart);

      if (completionsError) throw completionsError;

      setTaskStats({
        totalTasks: count || 0,
        activeTasks: activeCount || 0,
        completionsToday: todayCompletions || 0
      });
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(`Failed to load tasks: ${err.message}`);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndStats();
  }, [currentPage]);

  const handleOpenTaskModalForAdd = () => {
    setEditingTask(null);
    setTaskFormData(initialTaskFormData);
    setError(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenTaskModalForEdit = (taskToEdit) => {
    setEditingTask(taskToEdit);
    setTaskFormData({
      id: taskToEdit.id,
      title: taskToEdit.title,
      description: taskToEdit.description,
      taskCategory: taskToEdit.type,
      platform: taskToEdit.platform,
      targetUsername: taskToEdit.target_username || '',
      quantity: taskToEdit.quantity,
      gameIdentifier: taskToEdit.game_identifier || '',
      reward: taskToEdit.reward,
      status: taskToEdit.status
    });
    setError(null);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setTaskFormData(initialTaskFormData);
    setError(null);
  };

  const handleTaskFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : (name === 'reward' || name === 'quantity') ? parseFloat(value) || 0 : value;
    setTaskFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleTaskFormSubmit = async (e) => {
    e.preventDefault();
    if (!taskFormData.title || !taskFormData.description) {
      setError('Title and Description are required.');
      return;
    }
    setIsSubmittingTask(true);
    setError(null);
    
    // Store all the extra fields that don't exist in the database schema
    const extraFields = {
      platform: taskFormData.platform,
      targetUsername: taskFormData.targetUsername || null,
      quantity: parseInt(taskFormData.quantity, 10) || 1,
      gameIdentifier: taskFormData.gameIdentifier || null
    };
    console.log('Extra fields (storing locally):', extraFields);
    
    // Include only fields that are definitely in the database schema
    // Do NOT include game_identifier to avoid the schema cache issue
    const taskData = {
      title: taskFormData.title,
      description: taskFormData.description,
      type: taskFormData.taskCategory,
      reward: String(taskFormData.reward), // Database expects TEXT
      status: taskFormData.status
    };

    try {
      let taskId;
      let error = null;
      
      if (editingTask) {
        // Update existing task
        const { error: updateError } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingTask.id);
          
        error = updateError;
        taskId = editingTask.id;
      } else {
        // Create new task
        const { data: newTask, error: insertError } = await supabase
          .from('tasks')
          .insert([taskData])
          .select();
          
        error = insertError;
        
        if (newTask && newTask.length > 0) {
          taskId = newTask[0].id;
        }
      }
      
      if (error) {
        // If we get an error, log it with more details
        console.error('Database operation error:', error);
        throw error;
      }
      
      // If the task was created/updated successfully, store the extra fields 
      // separately in localStorage until we update the schema
      const { data } = editingTask ? 
        { data: { id: editingTask.id } } : // For existing tasks, we already know the id
        await supabase // For new tasks, fetch the most recently created task
          .from('tasks')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1);
          
      if (data && data.id) {
        const taskId = editingTask ? editingTask.id : data.id;
        const taskExtraFields = JSON.parse(localStorage.getItem('taskExtraFields') || '{}');
        taskExtraFields[taskId] = extraFields;
        localStorage.setItem('taskExtraFields', JSON.stringify(taskExtraFields));
        console.log(`Extra fields saved for task ${taskId}`);
        
        // Sync the new/updated task to local storage so it shows on the DailyTasksPage
        await syncService.syncFromSupabase();
        console.log('Tasks synced after adding/updating task');
      }

      await fetchTasksAndStats();
      closeTaskModal();
    } catch (err) {
      console.error(editingTask ? 'Error updating task:' : 'Error adding task:', err);
      setError(editingTask ? `Failed to update task: ${err.message}` : `Failed to add task: ${err.message}`);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    console.log(`[TaskManagement] Attempting to delete task with ID: ${taskId}`);
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      console.log('[TaskManagement] Deletion cancelled by user.');
      return;
    }

    console.log('[TaskManagement] User confirmed deletion.');
    setIsDeletingTask(taskId);
    setError(null);
    try {
      console.log(`[TaskManagement] Calling Supabase to delete task ID: ${taskId}`);
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) {
        console.error('[TaskManagement] Supabase delete error:', deleteError);
        throw deleteError;
      }

      console.log(`[TaskManagement] Task ${taskId} deleted successfully from Supabase.`);

      // Refresh logic: Fetch the new total count to determine page adjustments
      const { count: newTotalCountAfterDelete, error: countQueryError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      if (countQueryError) {
        console.error("[TaskManagement] Error fetching new total task count after delete:", countQueryError.message);
        // Fallback: attempt to refresh current page data
        await fetchTasksAndStats();
      } else {
        const actualTotalTasks = newTotalCountAfterDelete || 0;
        const newTotalPages = Math.ceil(actualTotalTasks / tasksPerPage);

        console.log(`[TaskManagement] Post-delete: actualTotalTasks = ${actualTotalTasks}, newTotalPages = ${newTotalPages}, currentPage = ${currentPage}`);

        if (actualTotalTasks === 0) {
          // All tasks are gone
          console.log("[TaskManagement] All tasks deleted. Current page was:", currentPage);
          if (currentPage !== 1) {
            setCurrentPage(1); // Will trigger fetch via useEffect
          } else {
            // On page 1 and it's now empty. setCurrentPage(1) won't re-trigger useEffect.
            // Manually call fetchTasksAndStats to update tasks to [] and totalTasksCount to 0.
            await fetchTasksAndStats();
          }
        } else if (currentPage > newTotalPages) {
          // Current page is now out of bounds
          console.log(`[TaskManagement] Current page ${currentPage} is out of bounds. Setting current page to ${newTotalPages}.`);
          setCurrentPage(newTotalPages); // Will trigger fetch via useEffect
        } else {
          // Current page is still valid. Refresh its data.
          console.log(`[TaskManagement] Current page ${currentPage} is still valid. Refreshing tasks for this page.`);
          await fetchTasksAndStats();
        }
      }
    } catch (err) {
      console.error('[TaskManagement] Error in handleDeleteTask catch block:', err);
      setError(`Failed to delete task: ${err.message}`);
    } finally {
      console.log(`[TaskManagement] Resetting isDeletingTask state for task ID: ${taskId}`);
      setIsDeletingTask(null);
    }
  };

  const totalPages = Math.ceil(totalTasksCount / tasksPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textGold mb-2">Task Management</h1>
        <p className="text-textLight/80">Create and manage tasks for users to complete.</p>
        {error && (
          <div className="mt-2 p-2 bg-rubyRed/10 border border-rubyRed/30 rounded text-rubyRed text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-deepLapisDark arabesque-border shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-textLight/60 text-sm">Total Tasks</p>
              <h3 className="text-2xl font-bold text-textGold mt-1">{taskStats.totalTasks}</h3>
            </div>
            <div className="bg-royalGold/10 rounded-lg p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-royalGold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-deepLapisDark arabesque-border shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-textLight/60 text-sm">Active Tasks</p>
              <h3 className="text-2xl font-bold text-textGold mt-1">{taskStats.activeTasks}</h3>
            </div>
            <div className="bg-emeraldGreen/10 rounded-lg p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emeraldGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-deepLapisDark arabesque-border shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-textLight/60 text-sm">Completions Today</p>
              <h3 className="text-2xl font-bold text-textGold mt-1">{taskStats.completionsToday}</h3>
            </div>
            <div className="bg-mysticalPurple/10 rounded-lg p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-mysticalPurple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-deepLapisDark arabesque-border shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 border-b border-royalGold/10 flex justify-between items-center">
          <h2 className="font-medium text-textGold">Tasks</h2>
          <button
            onClick={handleOpenTaskModalForAdd}
            className="bg-royalGold/20 hover:bg-royalGold/30 text-textGold py-1 px-3 rounded text-sm transition-colors"
          >
            + Add Task
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="animate-spin w-10 h-10 border-3 border-royalGold/20 border-t-royalGold rounded-full"></div>
            </div>
          ) : tasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-royalGold/10">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textLight/50 uppercase tracking-wider">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textLight/50 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textLight/50 uppercase tracking-wider">Reward</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textLight/50 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textLight/50 uppercase tracking-wider">Completions</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-textLight/50 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-royalGold/10 bg-deepLapis/30">
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-textGold">{task.title}</p>
                          <p className="text-xs text-textLight/50 mt-1">{task.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-textLight/70">{task.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-royalGold">{task.reward}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.status === 'Active' ? 'bg-emeraldGreen/10 text-emeraldGreen' : 'bg-rubyRed/10 text-rubyRed'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-textLight/70">
                        {(task.completions || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button onClick={() => handleOpenTaskModalForEdit(task)} className="text-royalGold hover:text-royalGold/80 mr-4">Edit</button>
                        <button 
                          onClick={() => handleDeleteTask(task.id)} 
                          disabled={isDeletingTask === task.id} 
                          className="text-rubyRed hover:text-rubyRed/80 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeletingTask === task.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-textLight/50">No tasks found. Create one to get started.</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-textLight/50">
            Showing <span className="font-medium text-textLight">{tasks.length}</span> of <span className="font-medium text-textLight">{totalTasksCount}</span> tasks
          </div>
          <div className="flex items-center space-x-1">
            <button
              className={`border border-royalGold/20 text-textLight/70 rounded-md px-3 py-1 text-sm hover:bg-royalGold/5 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (currentPage > 3) {
                  pageNum = currentPage - 3 + i;
                }
                if (currentPage > totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                }
              }

              if (pageNum <= totalPages) {
                return (
                  <button
                    key={pageNum}
                    className={`border border-royalGold/20 rounded-md px-3 py-1 text-sm ${
                      currentPage === pageNum
                        ? 'bg-royalGold/10 text-textGold'
                        : 'text-textLight/70 hover:bg-royalGold/5'
                    }`}
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              }
              return null;
            })}

            <button
              className={`border border-royalGold/20 text-textLight/70 rounded-md px-3 py-1 text-sm hover:bg-royalGold/5 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-deepLapisDark arabesque-border p-6 rounded-lg shadow-xl w-full max-w-lg my-8">
            <h3 className="text-xl font-semibold text-textGold mb-6">{editingTask ? 'Edit Task' : 'Add New Task'}</h3>

            {error && (
              <div className="mb-4 p-3 bg-rubyRed/10 border border-rubyRed/30 rounded text-rubyRed text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleTaskFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-textLight/70 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={taskFormData.title}
                  onChange={handleTaskFormChange}
                  className="w-full bg-deepLapis/50 border border-royalGold/30 rounded-md p-2 text-textLight focus:ring-royalGold focus:border-royalGold"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-textLight/70 mb-1">Description</label>
                <textarea
                  name="description"
                  id="description"
                  value={taskFormData.description}
                  onChange={handleTaskFormChange}
                  rows="3"
                  className="w-full bg-deepLapis/50 border border-royalGold/30 rounded-md p-2 text-textLight focus:ring-royalGold focus:border-royalGold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="taskCategory" className="block text-sm font-medium text-textLight/70 mb-1">Category</label>
                  <select
                    name="taskCategory"
                    id="taskCategory"
                    value={taskFormData.taskCategory}
                    onChange={handleTaskFormChange}
                    className="w-full bg-deepLapis/50 border border-royalGold/30 rounded-md p-2 text-textLight focus:ring-royalGold focus:border-royalGold"
                  >
                    <option value="Play Game">Play Game</option>
                    <option value="Social Follow">Social Follow</option>
                    <option value="Content Engagement">Content Engagement</option>
                    <option value="Referral">Referral</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="platform" className="block text-sm font-medium text-textLight/70 mb-1">Platform</label>
                  <select
                    name="platform"
                    id="platform"
                    value={taskFormData.platform}
                    onChange={handleTaskFormChange}
                    className="w-full bg-deepLapis/50 border border-royalGold/30 rounded-md p-2 text-textLight focus:ring-royalGold focus:border-royalGold"
                  >
                    <option value="Telegram">Telegram</option>
                    <option value="X">X (Twitter)</option>
                    <option value="Discord">Discord</option>
                    <option value="Web">Web</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {taskFormData.taskCategory === 'Play Game' && (
                <div>
                  <label htmlFor="gameIdentifier" className="block text-sm font-medium text-textLight/70 mb-1">Game</label>
                  <select
                    name="gameIdentifier"
                    id="gameIdentifier"
                    value={taskFormData.gameIdentifier}
                    onChange={handleTaskFormChange}
                    className="w-full bg-deepLapis/50 border border-royalGold/30 rounded-md p-2 text-textLight focus:ring-royalGold focus:border-royalGold"
                  >
                    <option value="">Select Game (Optional)</option>
                    {availableGames.map(game => (
                      <option key={game.id} value={game.id}>{game.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {taskFormData.taskCategory === 'Social Follow' && (
                <div>
                  <label htmlFor="targetUsername" className="block text-sm font-medium text-textLight/70 mb-1">Target Username/URL</label>
                  <input
                    type="text"
                    name="targetUsername"
                    id="targetUsername"
                    value={taskFormData.targetUsername}
                    onChange={handleTaskFormChange}
                    className="w-full bg-deepLapis/50 border border-royalGold/30 rounded-md p-2 text-textLight focus:ring-royalGold focus:border-royalGold"
                    placeholder="e.g., @username or https://..."
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-textLight/70 mb-1">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    id="quantity"
                    value={taskFormData.quantity}
                    onChange={handleTaskFormChange}
                    min="1"
                    className="w-full bg-deepLapis/50 border border-royalGold/30 rounded-md p-2 text-textLight focus:ring-royalGold focus:border-royalGold"
                  />
                </div>
                <div>
                  <label htmlFor="reward" className="block text-sm font-medium text-textLight/70 mb-1">Reward Points</label>
                  <input
                    type="number"
                    name="reward"
                    id="reward"
                    value={taskFormData.reward}
                    onChange={handleTaskFormChange}
                    min="0"
                    className="w-full bg-deepLapis/50 border border-royalGold/30 rounded-md p-2 text-textLight focus:ring-royalGold focus:border-royalGold"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-textLight/70 mb-1">Status</label>
                <select
                  name="status"
                  id="status"
                  value={taskFormData.status}
                  onChange={handleTaskFormChange}
                  className="w-full bg-deepLapis/50 border border-royalGold/30 rounded-md p-2 text-textLight focus:ring-royalGold focus:border-royalGold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="px-4 py-2 text-sm font-medium text-textLight/80 bg-royalGold/10 hover:bg-royalGold/20 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="px-4 py-2 text-sm font-medium text-deepLapisDark bg-royalGold hover:bg-royalGold/80 rounded-md transition-colors disabled:opacity-50 flex items-center"
                >
                  {isSubmittingTask && <div className="animate-spin w-4 h-4 border-2 border-deepLapis/50 border-t-deepLapisDark rounded-full mr-2"></div>}
                  {isSubmittingTask ? (editingTask ? 'Saving...' : 'Adding...') : (editingTask ? 'Save Changes' : 'Add Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;