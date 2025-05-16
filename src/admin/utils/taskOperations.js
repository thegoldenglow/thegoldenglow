/**
 * Utility functions for task management that bypass schema cache issues
 */
import { supabase } from '../../utils/supabase';

/**
 * Add a new task bypassing the schema cache issues
 * @param {Object} taskData - The task data to add
 * @returns {Promise<Object>} - The result of the operation
 */
export const addTask = async (taskData) => {
  try {
    // First insert the task with only the known fields
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        title: taskData.title,
        description: taskData.description,
        type: taskData.type,
        reward: taskData.reward,
        status: taskData.status
      }])
      .select();
    
    if (error) {
      console.error('Error adding task:', error);
      return { success: false, error };
    }
    
    if (data && data.length > 0) {
      // If task was added successfully and we have game identifier data, 
      // update it with a raw SQL query which bypasses schema cache
      if (taskData.gameIdentifier) {
        // Use direct SQL to update the column that's not in the schema cache
        const updateQuery = `
          UPDATE tasks 
          SET game_identifier = '${taskData.gameIdentifier}'
          WHERE id = ${data[0].id}
        `;
        
        // Execute the query directly using PostgreSQL's direct query execution
        const { error: updateError } = await supabase.rpc(
          'postgrest_rpc',
          { query: updateQuery }
        ).single();
        
        if (updateError) {
          console.warn('Could not update game_identifier, but task was created:', updateError);
        }
      }
      
      return { success: true, data: data[0] };
    }
    
    return { success: false, error: 'No data returned after insert' };
  } catch (error) {
    console.error('Error in addTask:', error);
    return { success: false, error };
  }
};

/**
 * Update an existing task bypassing schema cache issues
 * @param {number} taskId - The ID of the task to update
 * @param {Object} taskData - The updated task data
 * @returns {Promise<Object>} - The result of the operation
 */
export const updateTask = async (taskId, taskData) => {
  try {
    // First update the task with only the known fields
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: taskData.title,
        description: taskData.description,
        type: taskData.type,
        reward: taskData.reward,
        status: taskData.status
      })
      .eq('id', taskId)
      .select();
    
    if (error) {
      console.error('Error updating task:', error);
      return { success: false, error };
    }
    
    // If task was updated successfully and we have game identifier data,
    // update it with a raw SQL query which bypasses schema cache
    if (taskData.gameIdentifier !== undefined) {
      const gameIdValue = taskData.gameIdentifier ? 
        `'${taskData.gameIdentifier}'` : 'NULL';
        
      // Use direct SQL to update the column that's not in the schema cache
      const updateQuery = `
        UPDATE tasks 
        SET game_identifier = ${gameIdValue}
        WHERE id = ${taskId}
      `;
      
      // Execute the query directly
      const { error: updateError } = await supabase.rpc(
        'postgrest_rpc',
        { query: updateQuery }
      ).single();
      
      if (updateError) {
        console.warn('Could not update game_identifier, but other fields were updated:', updateError);
      }
    }
    
    return { success: true, data: data && data.length > 0 ? data[0] : null };
  } catch (error) {
    console.error('Error in updateTask:', error);
    return { success: false, error };
  }
};
