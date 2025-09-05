import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseAvailable } from '../../utils/supabase';

const SupabaseMCP = () => {
  const [status, setStatus] = useState('initializing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const initMCP = async () => {
      try {
        // Do not perform any network calls here. Only proceed if configured.
        if (!isSupabaseAvailable()) {
          setStatus('warning');
          setError('Supabase not configured; MCP server will not be registered.');
          return;
        }

        // Register the MCP server if window.registerMCPServer is available
        if (window.registerMCPServer) {
          window.registerMCPServer('supabase-mcp-server', {
            connection: supabase,
            url: import.meta.env.VITE_SUPABASE_URL,
            key: import.meta.env.VITE_SUPABASE_ANON_KEY
          });
          setStatus('connected');
        } else {
          setStatus('warning');
          setError('MCP server registration function not available');
        }
      } catch (err) {
        console.error('Failed to initialize Supabase MCP:', err);
        setStatus('error');
        setError(err.message);
      }
    };

    initMCP();
  }, []);

  return (
    <div className="supabase-mcp-status" style={{ display: 'none' }}>
      {/* Hidden component to handle MCP server connection */}
      {status === 'error' && <div className="error">{error}</div>}
    </div>
  );
};

export default SupabaseMCP;
