import { supabase, isSupabaseAvailable } from '../../utils/supabase';

/**
 * TaskProgressService
 * - Persists and retrieves per-user task progress from Supabase
 * - Provides basic server-side validation for claiming rewards
 * - Falls back to local storage when Supabase is unavailable
 */
export class TaskProgressService {
  async _getUserId() {
    if (!isSupabaseAvailable()) return null;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('Supabase auth.getUser error in TaskProgressService:', error.message);
        return null;
      }
      return data?.user?.id || null;
    } catch (e) {
      console.error('Unexpected error fetching user in TaskProgressService:', e);
      return null;
    }
  }

  _toNumericId(taskId) {
    if (typeof taskId === 'number') return taskId;
    if (typeof taskId === 'string') {
      const n = parseInt(taskId, 10);
      return Number.isNaN(n) ? null : n;
    }
    return null;
  }

  async loadProgressMap(taskIds) {
    if (!isSupabaseAvailable()) {
      // Return empty map when Supabase is unavailable
      return {};
    }

    const userId = await this._getUserId();
    if (!userId) return {};

    const numericIds = (taskIds || [])
      .map((id) => this._toNumericId(id))
      .filter((id) => typeof id === 'number');

    if (numericIds.length === 0) return {};

    try {
      const { data, error } = await supabase
        .from('user_task_progress')
        .select('task_id, progress, completed, claimed, requirement')
        .in('task_id', numericIds)
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading user task progress:', error);
        return {};
      }

      const map = {};
      for (const row of data || []) {
        map[row.task_id] = {
          progress: row.progress ?? 0,
          completed: !!row.completed,
          claimed: !!row.claimed,
          requirement: row.requirement ?? null,
        };
      }
      return map;
    } catch (e) {
      console.error('Unexpected error loading task progress:', e);
      return {};
    }
  }

  async upsertProgress(taskId, progress, completed, requirement) {
    if (!isSupabaseAvailable()) {
      // Skip upsert when Supabase is unavailable
      return false;
    }

    const userId = await this._getUserId();
    const numericTaskId = this._toNumericId(taskId);
    if (!userId || numericTaskId == null) return false;

    try {
      const payload = {
        task_id: numericTaskId,
        user_id: userId,
        progress: Math.max(0, parseInt(progress || 0, 10)),
        completed: !!completed,
        requirement: typeof requirement === 'number' ? requirement : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_task_progress')
        .upsert(payload, { onConflict: 'task_id,user_id' });

      if (error) {
        console.error('Error upserting user task progress:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Unexpected error upserting task progress:', e);
      return false;
    }
  }

  async canClaim(taskId, requirementFromClient = null) {
    if (!isSupabaseAvailable()) {
      // Allow claiming when Supabase is unavailable, relying on local validation
      return true;
    }

    const userId = await this._getUserId();
    const numericTaskId = this._toNumericId(taskId);
    if (!userId || numericTaskId == null) return false;

    try {
      // Check if already claimed in task_completions
      const { data: existingClaim, error: claimErr } = await supabase
        .from('task_completions')
        .select('id')
        .eq('task_id', numericTaskId)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (!claimErr && existingClaim) return false;

      // Check progress row
      const { data: row, error } = await supabase
        .from('user_task_progress')
        .select('progress, completed, claimed, requirement')
        .eq('task_id', numericTaskId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking canClaim:', error);
        return false;
      }

      if (!row) {
        // If no row, allow claim only if requirement is 0/1 and treated as completed locally is unreliable; block by default
        return false;
      }

      if (row.claimed) return false;

      const requirement = row.requirement ?? requirementFromClient ?? 1;
      const isCompleted = !!row.completed || (parseInt(row.progress || 0, 10) >= parseInt(requirement || 1, 10));
      return isCompleted;
    } catch (e) {
      console.error('Unexpected error checking claim eligibility:', e);
      return false;
    }
  }

  async markClaimed(taskId) {
    if (!isSupabaseAvailable()) {
      // Skip marking claimed when Supabase is unavailable
      return false;
    }

    const userId = await this._getUserId();
    const numericTaskId = this._toNumericId(taskId);
    if (!userId || numericTaskId == null) return false;

    try {
      const { error } = await supabase
        .from('user_task_progress')
        .update({ claimed: true, completed: true, updated_at: new Date().toISOString() })
        .eq('task_id', numericTaskId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error marking task as claimed:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Unexpected error marking task as claimed:', e);
      return false;
    }
  }
}