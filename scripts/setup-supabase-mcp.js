// Script to setup Supabase MCP server connection
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// MCP configuration file path
const mcpConfigPath = path.join(__dirname, '..', 'supabase', 'mcp-config.json');

// Create MCP server configuration
const mcpConfig = {
  version: "1.0.0",
  name: "supabase-mcp-server",
  type: "supabase",
  connection: {
    url: supabaseUrl,
    key: supabaseAnonKey,
    options: {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      db: {
        schema: 'public'
      }
    }
  },
  tables: [
    "profiles", 
    "analytics_users", 
    "analytics_games", 
    "tasks", 
    "task_completions"
  ],
  enabled: true
};

// Ensure supabase directory exists
const supabaseDir = path.join(__dirname, '..', 'supabase');
if (!fs.existsSync(supabaseDir)) {
  fs.mkdirSync(supabaseDir, { recursive: true });
}

// Write configuration
fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
console.log(`MCP configuration written to ${mcpConfigPath}`);

// Create SupabaseMCP component
const mcpComponentPath = path.join(__dirname, '..', 'src', 'components', 'supabase', 'SupabaseMCP.jsx');
const mcpComponentDir = path.dirname(mcpComponentPath);

// Ensure directory exists
if (!fs.existsSync(mcpComponentDir)) {
  fs.mkdirSync(mcpComponentDir, { recursive: true });
}

// Write SupabaseMCP component
const mcpComponentContent = `import React, { useEffect, useState } from 'react';
import { supabase, checkSupabaseConnection } from '../../utils/supabase';

const SupabaseMCP = () => {
  const [status, setStatus] = useState('initializing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const initMCP = async () => {
      try {
        // Check connection
        const connectionStatus = await checkSupabaseConnection();
        
        if (!connectionStatus.success) {
          setStatus('error');
          setError(connectionStatus.error);
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
`;

fs.writeFileSync(mcpComponentPath, mcpComponentContent);
console.log(`SupabaseMCP component written to ${mcpComponentPath}`);

// Update SupabaseSetup.jsx to include the MCP component
const setupComponentPath = path.join(__dirname, '..', 'src', 'components', 'supabase', 'SupabaseSetup.jsx');
if (fs.existsSync(setupComponentPath)) {
  let setupContent = fs.readFileSync(setupComponentPath, 'utf8');
  
  if (!setupContent.includes('SupabaseMCP')) {
    // Add import statement if it's not already there
    if (!setupContent.includes("import SupabaseMCP")) {
      setupContent = setupContent.replace(
        /(import React.*?;(\r\n|\r|\n))/,
        '$1import SupabaseMCP from \'./SupabaseMCP\';\n'
      );
    }
    
    // Add component to render if it's not already there
    if (!setupContent.includes("<SupabaseMCP")) {
      setupContent = setupContent.replace(
        /(<\/React.Fragment>|<\/>)/,
        '<SupabaseMCP />\n      $1'
      );
    }
    
    fs.writeFileSync(setupComponentPath, setupContent);
    console.log(`Updated SupabaseSetup.jsx to include SupabaseMCP component`);
  } else {
    console.log('SupabaseMCP already included in SupabaseSetup.jsx');
  }
} else {
  console.log('SupabaseSetup.jsx not found, creating it...');
  
  const setupComponentContent = `import React from 'react';
import { AuthProvider } from '../../context/AuthContext';
import SupabaseMCP from './SupabaseMCP';

const SupabaseSetup = ({ children }) => {
  return (
    <AuthProvider>
      <SupabaseMCP />
      {children}
    </AuthProvider>
  );
};

export default SupabaseSetup;
`;

  fs.writeFileSync(setupComponentPath, setupComponentContent);
  console.log(`Created SupabaseSetup.jsx at ${setupComponentPath}`);
}

console.log('Supabase MCP server setup completed successfully');
