import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase as AVAILABLE to test server-side logic
var scenario;
vi.mock('../../../utils/supabase', () => {
  scenario = {};
  const supabase = {
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-123' } }, error: null }),
    },
    from: (table) => {
      const builder = {
        _table: table,
        _select: null,
        _updates: null,
        select(fields) {
          this._select = fields;
          return this;
        },
        in() { return this; },
        limit() { return this; },
        eq() {
          // If this is a SELECT chain without maybeSingle, allow awaiting to resolve list data
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
        async maybeSingle() {
          const resp = scenario[table]?.maybeSingle ?? { data: null, error: null };
          return resp;
        },
        update(values) {
          this._updates = values;
          return {
            eq: () => ({
              eq: async () => {
                scenario.lastUpdate = { table, values };
                const resp = scenario.updateResult ?? { error: null };
                return resp;
              },
            }),
          };
        },
        upsert(values) {
          this._updates = values;
          scenario.lastUpsert = { table, values };
          return Promise.resolve({ error: scenario.upsertError ?? null });
        },
        insert(values) {
          scenario.lastInsert = { table, values };
          return Promise.resolve({ error: scenario.insertError ?? null });
        },
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

import { TaskProgressService } from '../TaskProgressService';
import { __setSupabaseScenario, __getSupabaseScenario } from '../../../utils/supabase';

describe('TaskProgressService - server-side canClaim logic', () => {
  beforeEach(() => {
    __setSupabaseScenario({});
  });

  it('returns false if a prior claim exists in task_completions', async () => {
    __setSupabaseScenario({
      task_completions: { maybeSingle: { data: { id: 123 }, error: null } },
    });

    const svc = new TaskProgressService();
    const res = await svc.canClaim(42);
    expect(res).toBe(false);
  });

  it('returns false if no user_task_progress row exists for the task', async () => {
    __setSupabaseScenario({
      task_completions: { maybeSingle: { data: null, error: null } },
      user_task_progress: { maybeSingle: { data: null, error: null } },
    });

    const svc = new TaskProgressService();
    const res = await svc.canClaim('7');
    expect(res).toBe(false);
  });

  it('returns false if progress row exists but is already claimed', async () => {
    __setSupabaseScenario({
      task_completions: { maybeSingle: { data: null, error: null } },
      user_task_progress: { maybeSingle: { data: { progress: 10, completed: true, claimed: true, requirement: 10 }, error: null } },
    });

    const svc = new TaskProgressService();
    const res = await svc.canClaim(10);
    expect(res).toBe(false);
  });

  it('returns true if completed flag is true and not claimed', async () => {
    __setSupabaseScenario({
      task_completions: { maybeSingle: { data: null, error: null } },
      user_task_progress: { maybeSingle: { data: { progress: 1, completed: true, claimed: false, requirement: 5 }, error: null } },
    });

    const svc = new TaskProgressService();
    const res = await svc.canClaim(5);
    expect(res).toBe(true);
  });

  it('returns true if progress >= requirement and not claimed', async () => {
    __setSupabaseScenario({
      task_completions: { maybeSingle: { data: null, error: null } },
      user_task_progress: { maybeSingle: { data: { progress: 10, completed: false, claimed: false, requirement: 10 }, error: null } },
    });

    const svc = new TaskProgressService();
    const res = await svc.canClaim(9);
    expect(res).toBe(true);
  });

  it('uses requirementFromClient when requirement is null', async () => {
    __setSupabaseScenario({
      task_completions: { maybeSingle: { data: null, error: null } },
      user_task_progress: { maybeSingle: { data: { progress: 5, completed: false, claimed: false, requirement: null }, error: null } },
    });

    const svc = new TaskProgressService();
    const res = await svc.canClaim(99, 5);
    expect(res).toBe(true);
  });
});

describe('TaskProgressService - server-side markClaimed', () => {
  beforeEach(() => {
    __setSupabaseScenario({ updateResult: { error: null } });
  });

  it('updates user_task_progress to claimed=true, completed=true', async () => {
    const svc = new TaskProgressService();
    const ok = await svc.markClaimed('12');
    expect(ok).toBe(true);

    const state = __getSupabaseScenario();
    expect(state.lastUpdate).toBeTruthy();
    expect(state.lastUpdate.table).toBe('user_task_progress');
    expect(state.lastUpdate.values.claimed).toBe(true);
    expect(state.lastUpdate.values.completed).toBe(true);
    expect(typeof state.lastUpdate.values.updated_at).toBe('string');
  });

  it('returns false when update returns an error', async () => {
    __setSupabaseScenario({ updateResult: { error: { message: 'fail' } } });
    const svc = new TaskProgressService();
    const ok = await svc.markClaimed(33);
    expect(ok).toBe(false);
  });
});

describe('TaskProgressService - loadProgressMap', () => {
  beforeEach(() => {
    __setSupabaseScenario({});
  });

  it('returns empty map with empty taskIds', async () => {
    const svc = new TaskProgressService();
    const result = await svc.loadProgressMap([]);
    expect(result).toEqual({});
  });

  it('filters out invalid task IDs and queries only valid numeric ones', async () => {
    __setSupabaseScenario({
      user_task_progress: {
        select: {
          data: [
            { task_id: 1, progress: 5, completed: true, claimed: false, requirement: 10 },
            { task_id: 3, progress: 0, completed: false, claimed: false, requirement: null },
          ],
          error: null,
        },
      },
    });

    const svc = new TaskProgressService();
    const result = await svc.loadProgressMap(['1', 'invalid', 3, null, '3']);
    
    expect(result).toEqual({
      1: { progress: 5, completed: true, claimed: false, requirement: 10 },
      3: { progress: 0, completed: false, claimed: false, requirement: null },
    });
  });

  it('handles Supabase query error gracefully', async () => {
    __setSupabaseScenario({
      user_task_progress: {
        select: { data: null, error: { message: 'DB error' } },
      },
    });

    const svc = new TaskProgressService();
    const result = await svc.loadProgressMap([1, 2]);
    expect(result).toEqual({});
  });

  it('normalizes data types correctly', async () => {
    __setSupabaseScenario({
      user_task_progress: {
        select: {
          data: [
            { task_id: 7, progress: null, completed: 1, claimed: 0, requirement: 15 },
          ],
          error: null,
        },
      },
    });

    const svc = new TaskProgressService();
    const result = await svc.loadProgressMap([7]);
    
    expect(result).toEqual({
      7: { progress: 0, completed: true, claimed: false, requirement: 15 },
    });
  });
});

describe('TaskProgressService - upsertProgress', () => {
  beforeEach(() => {
    __setSupabaseScenario({});
  });

  it('upserts progress with valid inputs', async () => {
    const svc = new TaskProgressService();
    const success = await svc.upsertProgress('5', 8, true, 10);
    
    expect(success).toBe(true);
    const state = __getSupabaseScenario();
    expect(state.lastUpsert).toBeTruthy();
    expect(state.lastUpsert.table).toBe('user_task_progress');
    expect(state.lastUpsert.values.task_id).toBe(5);
    expect(state.lastUpsert.values.user_id).toBe('user-123');
    expect(state.lastUpsert.values.progress).toBe(8);
    expect(state.lastUpsert.values.completed).toBe(true);
    expect(state.lastUpsert.values.requirement).toBe(10);
    expect(typeof state.lastUpsert.values.updated_at).toBe('string');
  });

  it('handles negative progress by normalizing to 0', async () => {
    const svc = new TaskProgressService();
    await svc.upsertProgress(2, -5, false, 7);
    
    const state = __getSupabaseScenario();
    expect(state.lastUpsert.values.progress).toBe(0);
  });

  it('handles non-numeric requirement by setting null', async () => {
    const svc = new TaskProgressService();
    await svc.upsertProgress(3, 1, true, 'invalid');
    
    const state = __getSupabaseScenario();
    expect(state.lastUpsert.values.requirement).toBeNull();
  });

  it('returns false with invalid taskId', async () => {
    const svc = new TaskProgressService();
    const success = await svc.upsertProgress('not-a-number', 5, false, 10);
    expect(success).toBe(false);
  });

  it('returns false when upsert fails', async () => {
    __setSupabaseScenario({ upsertError: { message: 'Constraint violation' } });
    
    const svc = new TaskProgressService();
    const success = await svc.upsertProgress(1, 5, false, 10);
    expect(success).toBe(false);
  });
});