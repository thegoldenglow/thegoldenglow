import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';

// Debug component to test Supabase connection and task loading
const DebugSupabase = () => {
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [envVariables, setEnvVariables] = useState({});
  
  useEffect(() => {
    // Check if environment variables are loaded
    setEnvVariables({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
    });
    
    // Test Supabase connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('tasks').select('count').single();
        
        if (error) {
          console.error('Supabase connection error:', error);
          setConnectionStatus(`Error: ${error.message}`);
          setError(error);
          return;
        }
        
        setConnectionStatus('Connected successfully!');
        
        // Try to fetch tasks
        await fetchTasks();
      } catch (err) {
        console.error('Unexpected error:', err);
        setConnectionStatus(`Unexpected error: ${err.message}`);
        setError(err);
      }
    };
    
    const fetchTasks = async () => {
      try {
        // Try different queries to see what works
        console.log('Fetching tasks from Supabase...');
        
        // First try with status=Active
        const { data: activeTasks, error: activeError } = await supabase
          .from('tasks')
          .select('*')
          .eq('status', 'Active');
          
        if (activeError) {
          console.error('Error fetching active tasks:', activeError);
        } else {
          console.log('Active tasks:', activeTasks);
        }
        
        // Try without status filter
        const { data: allTasks, error: allError } = await supabase
          .from('tasks')
          .select('*');
          
        if (allError) {
          console.error('Error fetching all tasks:', allError);
          setError(allError);
        } else {
          console.log('All tasks:', allTasks);
          setTasks(allTasks || []);
        }
        
        // Check if the 'tasks' table exists
        const { data: tables, error: tablesError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');
          
        if (tablesError) {
          console.error('Error fetching tables:', tablesError);
        } else {
          console.log('Available tables:', tables);
        }
      } catch (err) {
        console.error('Error in fetchTasks:', err);
        setError(err);
      }
    };
    
    testConnection();
  }, []);
  
  return (
    <div className="p-4 bg-deepLapisDark/20 rounded-lg text-textLight">
      <h2 className="text-xl font-semibold mb-4">Supabase Debug Info</h2>
      
      <div className="mb-4">
        <h3 className="font-medium">Environment Variables:</h3>
        <pre className="bg-black/30 p-2 rounded mt-2">
          {JSON.stringify(envVariables, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium">Connection Status:</h3>
        <div className={`mt-2 p-2 rounded ${connectionStatus.includes('Error') ? 'bg-red-900/30' : 'bg-green-900/30'}`}>
          {connectionStatus}
        </div>
      </div>
      
      {error && (
        <div className="mb-4">
          <h3 className="font-medium">Error:</h3>
          <pre className="bg-red-900/30 p-2 rounded mt-2 overflow-auto max-h-40">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}
      
      <div>
        <h3 className="font-medium">Tasks in Database ({tasks.length}):</h3>
        {tasks.length === 0 ? (
          <div className="bg-yellow-900/30 p-2 rounded mt-2">
            No tasks found in the database.
          </div>
        ) : (
          <pre className="bg-black/30 p-2 rounded mt-2 overflow-auto max-h-60">
            {JSON.stringify(tasks, null, 2)}
          </pre>
        )}
      </div>
      
      <div className="mt-4">
        <p className="text-sm">
          Open your browser console (F12) to see more detailed logs about Supabase connection
          and task queries.
        </p>
      </div>
    </div>
  );
};

export default DebugSupabase;
