import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock StorageManager minimal behavior to avoid real localStorage
vi.mock('../StorageManager', () => {
  return {
    StorageManager: class {
      constructor() { this._store = {}; }
      isLocalStorageAvailable() { return true; }
      saveData(key, value) { this._store[key] = value; }
      loadData(key) { return this._store[key]; }
      isDataStale() { return false; }
      clearExpiredData() {}
    }
  };
});

// Mock AdManager to avoid ads logic side-effects
vi.mock('../AdManager', () => ({
  AdManager: class { async init() {}; }
}));

// Mock SyncTasksService to bypass remote sync; we will provide tasks directly
vi.mock('../SyncTasksService', () => ({
  SyncTasksService: class {
    constructor() { this.dispatcher = null; }
    setDispatcher(d) { this.dispatcher = d; }
    async syncFromSupabase() {
      if (this.dispatcher) {
        this.dispatcher({ type: 'TASKS_REFRESHED', payload: { tasks: [] } });
      }
      return true;
    }
  }
}));

// Mock Supabase as AVAILABLE with insert/select/update behaviors and capture points
var scenario;
vi.mock('../../../utils/supabase', () => {
  scenario = {};
  const supabase = {
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-abc' } }, error: null }),
    },
    from: (table) => {
      const builder = {
        _table: table,
        _select: null,
        select(fields) { this._select = fields; return this; },
        in() { return this; },
        eq() { 
          if (this._select) {
            const response = scenario[table]?.select ?? { data: [], error: null };
            const chain = {
              maybeSingle: async () => (scenario[table]?.maybeSingle ?? { data: null, error: null }),
              limit: () => chain,
              eq: () => chain,
              then: (resolve) => resolve(response),
            };
            return chain;
          }
          return this; 
        },
        limit() { return this; },
        async maybeSingle() { return scenario[table]?.maybeSingle ?? { data: null, error: null }; },
        update(values) {
          return {
            eq: () => ({
              eq: async () => {
                scenario.lastUpdate = { table, values };
                return scenario.updateResult ?? { error: null };
              }
            })
          };
        },
        upsert(values) { scenario.lastUpsert = { table, values }; return Promise.resolve({ error: scenario.upsertError ?? null }); },
        insert(values) { scenario.lastInsert = { table, values }; return Promise.resolve({ error: scenario.insertError ?? null }); },
      };
      return builder;
    },
  };
  return {
    supabase,
    isSupabaseAvailable: () => true,
    __setSupabaseScenario: (s) => { scenario = s; },
    __getSupabaseScenario: () => scenario,
  };
});

import { TasksManager } from '../TasksManager';
import { TaskProgressService } from '../TaskProgressService';
import { __setSupabaseScenario, __getSupabaseScenario } from '../../../utils/supabase';

function makeDispatcher() {
  return (action) => {
    // no-op by default for tests; could assert action types if needed
  };
}

describe('TasksManager.claimTaskReward (integration with Supabase available)', () => {
  beforeEach(() => {
    __setSupabaseScenario({});
  });

  it('validates with canClaim, inserts into task_completions, then calls markClaimed', async () => {
    // Arrange: Prepare scenario where canClaim will allow claim
    __setSupabaseScenario({
      task_completions: { maybeSingle: { data: null, error: null } },
      user_task_progress: { maybeSingle: { data: { progress: 10, completed: true, claimed: false, requirement: 10 }, error: null } },
    });

    const tm = new TasksManager(makeDispatcher());
    // Preload one completed, unclaimed task in taskList
    tm.taskList = [
      { id: 101, title: 'Task 101', progress: 10, requirement: 10, completed: true, claimed: false, adBoostAvailable: true, reward: 10 },
    ];

    // Spy on progressService.markClaimed to verify it is called
    const markClaimedSpy = vi.spyOn(tm.progressService, 'markClaimed');

    // Act
    const ok = await tm.claimTaskReward(101, false);

    // Assert
    expect(ok).toBe(true);
    // Check task is now claimed locally
    expect(tm.taskList[0].claimed).toBe(true);

    // Check server insertion to task_completions
    const state = __getSupabaseScenario();
    expect(state.lastInsert).toBeTruthy();
    expect(state.lastInsert.table).toBe('task_completions');
    expect(state.lastInsert.values.task_id).toBe(101);
    expect(state.lastInsert.values.user_id).toBe('user-abc');

    // markClaimed called with taskId
    expect(markClaimedSpy).toHaveBeenCalledWith(101);
  });

  it('skips insertion when canClaim fails and returns false', async () => {
    // Arrange: existing claim should block
    __setSupabaseScenario({
      task_completions: { maybeSingle: { data: { id: 1 }, error: null } },
    });

    const tm = new TasksManager(makeDispatcher());
    tm.taskList = [
      { id: 202, title: 'Task 202', progress: 10, requirement: 10, completed: true, claimed: false, adBoostAvailable: true, reward: 10 },
    ];

    const markClaimedSpy = vi.spyOn(tm.progressService, 'markClaimed');

    // Act
    const ok = await tm.claimTaskReward(202, true);

    // Assert
    expect(ok).toBe(false);
    const state = __getSupabaseScenario();
    expect(state.lastInsert).toBeUndefined();
    expect(markClaimedSpy).not.toHaveBeenCalled();
    expect(tm.taskList[0].claimed).toBe(false);
  });

  it('logs completion and markClaimed even when taskId string parses correctly', async () => {
    __setSupabaseScenario({
      task_completions: { maybeSingle: { data: null, error: null } },
      user_task_progress: { maybeSingle: { data: { progress: 2, completed: true, claimed: false, requirement: 2 }, error: null } },
    });

    const tm = new TasksManager(makeDispatcher());
    tm.taskList = [
      { id: '303', title: 'Task 303', progress: 2, requirement: 2, completed: true, claimed: false, adBoostAvailable: false, reward: 5 },
    ];

    const markClaimedSpy = vi.spyOn(tm.progressService, 'markClaimed');

    const ok = await tm.claimTaskReward('303', false);
    expect(ok).toBe(true);

    const state = __getSupabaseScenario();
    expect(state.lastInsert).toBeTruthy();
    expect(state.lastInsert.values.task_id).toBe(303);
    expect(markClaimedSpy).toHaveBeenCalledWith('303');
  });
});