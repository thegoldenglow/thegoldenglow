import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { TasksManager } from '../TasksManager';
import { StorageManager } from '../StorageManager';

// Mock dependencies
vi.mock('../StorageManager');
vi.mock('../AdManager');
vi.mock('../SyncTasksService');
vi.mock('../../../utils/supabase');

describe('Embedded Post Verification System', () => {
  let tasksManager;
  let mockDispatch;
  let mockStorageManager;

  beforeEach(() => {
    mockDispatch = vi.fn();
    mockStorageManager = {
      loadData: vi.fn(),
      saveData: vi.fn()
    };
    StorageManager.mockImplementation(() => mockStorageManager);
    
    tasksManager = new TasksManager(mockDispatch);
    
    // Setup test tasks
    tasksManager.taskList = [
      {
        id: 'content-task-1',
        title: 'Watch Instagram Post',
        taskCategory: 'Content Engagement',
        postUrl: 'https://instagram.com/p/test123',
        requiredViewingTime: 30,
        requirement: 1,
        progress: 0,
        completed: false,
        rewards: [{ type: 'MYSTIC_COINS', amount: 50 }]
      },
      {
        id: 'game-task-1',
        title: 'Play Game',
        taskCategory: 'Play Game',
        requirement: 1,
        progress: 0,
        completed: false,
        rewards: [{ type: 'MYSTIC_COINS', amount: 100 }]
      }
    ];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('completeEmbeddedPostTask', () => {
    test('should complete valid embedded post task with sufficient viewing time', async () => {
      const result = await tasksManager.completeEmbeddedPostTask('content-task-1', 35, 30);
      
      expect(result).toBe(true);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'EMBEDDED_POST_COMPLETED',
        payload: {
          taskId: 'content-task-1',
          viewingTime: 35,
          requiredTime: 30,
          taskTitle: 'Watch Instagram Post'
        }
      });
    });

    test('should fail when task is not found', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await tasksManager.completeEmbeddedPostTask('non-existent-task', 30, 30);
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Task not found:', 'non-existent-task');
      
      consoleSpy.mockRestore();
    });

    test('should fail when task is not a Content Engagement task', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await tasksManager.completeEmbeddedPostTask('game-task-1', 30, 30);
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Task is not a Content Engagement task:', 'game-task-1');
      
      consoleSpy.mockRestore();
    });

    test('should fail when viewing time is insufficient', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await tasksManager.completeEmbeddedPostTask('content-task-1', 25, 30);
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Insufficient viewing time:', { viewingTime: 25, requiredTime: 30 });
      
      consoleSpy.mockRestore();
    });

    test('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock updateTaskProgress to throw an error
      tasksManager.updateTaskProgress = vi.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await tasksManager.completeEmbeddedPostTask('content-task-1', 35, 30);
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error completing embedded post task:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    test('should log success when task is completed', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock updateTaskProgress to return true
      tasksManager.updateTaskProgress = vi.fn().mockResolvedValue(true);
      
      await tasksManager.completeEmbeddedPostTask('content-task-1', 35, 30);
      
      expect(consoleSpy).toHaveBeenCalledWith('Embedded post task completed successfully:', {
        taskId: 'content-task-1',
        title: 'Watch Instagram Post',
        viewingTime: 35,
        requiredTime: 30
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Integration with existing task completion', () => {
    test('should maintain backward compatibility with regular completeTask method', async () => {
      // Mock updateTaskProgress
      tasksManager.updateTaskProgress = vi.fn().mockResolvedValue(true);
      
      const result = await tasksManager.completeTask('content-task-1');
      
      expect(result).toBe(true);
      expect(tasksManager.updateTaskProgress).toHaveBeenCalledWith('content-task-1', Infinity);
    });

    test('should work with non-content engagement tasks using regular completion', async () => {
      tasksManager.updateTaskProgress = vi.fn().mockResolvedValue(true);
      
      const result = await tasksManager.completeTask('game-task-1');
      
      expect(result).toBe(true);
      expect(tasksManager.updateTaskProgress).toHaveBeenCalledWith('game-task-1', Infinity);
    });
  });
});