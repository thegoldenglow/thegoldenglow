/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Supabase utilities as unavailable to focus on local tracking logic
vi.mock('../../../utils/supabase', () => ({
  isSupabaseAvailable: () => false,
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    }
  }
}));

import { TasksManager } from '../TasksManager.jsx';

// Helper to parse gg_tasks from localStorage
function getStoredTasks() {
  const raw = localStorage.getItem('gg_tasks');
  if (!raw) return null;
  try {
    return JSON.parse(raw).data.tasks;
  } catch {
    return null;
  }
}

describe('User task tracking - completion detection and recording', () => {
  let actions;
  let dispatch;

  beforeEach(() => {
    // reset action capture and storage
    actions = [];
    dispatch = (action) => actions.push(action);
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('marks a task as completed when progress meets requirement and records it', async () => {
    const tm = new TasksManager(dispatch);

    // Seed with one not-yet-completed task
    tm.taskList = [
      {
        id: '1',
        title: 'Complete 5 steps',
        requirement: 5,
        progress: 0,
        completed: false,
        claimed: false,
        adBoostAvailable: true,
      },
    ];

    const wasCompleted = await tm.updateTaskProgress('1', 5);

    // Function should return true indicating completion
    expect(wasCompleted).toBe(true);

    // Task state updated in memory
    expect(tm.taskList[0].progress).toBe(5);
    expect(tm.taskList[0].completed).toBe(true);

    // Action dispatched should include TASK_COMPLETED
    expect(actions.some((a) => a.type === 'TASK_COMPLETED' && a.payload?.taskId === '1')).toBe(true);

    // Persisted to localStorage via StorageManager
    const stored = getStoredTasks();
    expect(stored).toBeTruthy();
    expect(stored[0].completed).toBe(true);
    expect(stored[0].progress).toBe(5);
  });

  it('does NOT mark a task as completed when progress is below requirement; records partial progress', async () => {
    const tm = new TasksManager(dispatch);

    tm.taskList = [
      {
        id: '2',
        title: 'Reach 10 points',
        requirement: 10,
        progress: 0,
        completed: false,
        claimed: false,
        adBoostAvailable: true,
      },
    ];

    const wasCompleted = await tm.updateTaskProgress('2', 5);

    expect(wasCompleted).toBe(false);
    expect(tm.taskList[0].progress).toBe(5);
    expect(tm.taskList[0].completed).toBe(false);

    // Should dispatch UPDATE_TASK_PROGRESS (not TASK_COMPLETED)
    expect(actions.some((a) => a.type === 'UPDATE_TASK_PROGRESS' && a.payload?.taskId === '2')).toBe(true);
    expect(actions.some((a) => a.type === 'TASK_COMPLETED')).toBe(false);

    // Persisted state should reflect partial progress and not completed
    const stored = getStoredTasks();
    expect(stored).toBeTruthy();
    expect(stored[0].progress).toBe(5);
    expect(stored[0].completed).toBe(false);

    // Claim should be prevented when not completed
    const claimRes = await tm.claimTaskReward('2', false);
    expect(claimRes).toBe(false);
    expect(tm.taskList[0].claimed).toBe(false);
  });

  it('allows claiming after completion and records claim locally when Supabase is unavailable', async () => {
    const tm = new TasksManager(dispatch);

    tm.taskList = [
      {
        id: '3',
        title: 'Collect 3 items',
        requirement: 3,
        progress: 3,
        completed: true,
        claimed: false,
        adBoostAvailable: true,
      },
    ];

    const ok = await tm.claimTaskReward('3', false);
    expect(ok).toBe(true);

    // State and action assertions
    expect(tm.taskList[0].claimed).toBe(true);
    expect(actions.some((a) => a.type === 'CLAIM_REWARD' && a.payload?.taskId === '3')).toBe(true);

    // Persisted to localStorage
    const stored = getStoredTasks();
    expect(stored).toBeTruthy();
    expect(stored[0].claimed).toBe(true);
    expect(stored[0].completed).toBe(true);
  });
});