import React, { useEffect, useState } from 'react';
import { supabase, checkSupabaseConnection } from '../../utils/supabase';

/**
 * SupabaseMCP - Component to handle Supabase MCP server integration
 * This registers the Supabase client with the MCP system for AI assistant interaction
 */
const SupabaseMCP = () => {
  const [status, setStatus] = useState('initializing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const initMCP = async () => {
      try {
        // Check connection first
        const connectionStatus = await checkSupabaseConnection();
        
        if (!connectionStatus.success) {
          console.error('Supabase MCP connection error:', connectionStatus.error);
          setStatus('error');
          setError(connectionStatus.error);
          return;
        }
        
        // Create Supabase MCP server connection configuration
        const mcpConfig = {
          connection: supabase,
          url: import.meta.env.VITE_SUPABASE_URL,
          key: import.meta.env.VITE_SUPABASE_ANON_KEY,
          tables: ['profiles', 'analytics_users', 'analytics_games', 'tasks', 'task_completions'],
          functions: {
            updateUserPoints: async (userId, points) => {
              const { data, error } = await supabase
                .from('profiles')
                .update({ points })
                .eq('id', userId);
              return { success: !error, data, error };
            }
          }
        };

        // Register with MCP server system if available
        if (window.registerMCPServer) {
          window.registerMCPServer('supabase-mcp-server', mcpConfig);
          console.log('Supabase MCP server registered successfully');
          setStatus('connected');
        } else {
          console.warn('MCP server registration function not available');
          setStatus('warning');
          setError('MCP server registration function not available');
          
          // Still make the client available globally as fallback
          window.supabaseMCP = mcpConfig;
        }
      } catch (err) {
        console.error('Failed to initialize Supabase MCP:', err);
        setStatus('error');
        setError(err.message);
      }
    };

    initMCP();
  }, []);

  // Hidden component - no visible UI
  return null;
};

export default SupabaseMCP;
