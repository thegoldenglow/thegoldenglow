import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

const SupabaseSetup = () => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);
  const [projectInfo, setProjectInfo] = useState(null);
  const [schema, setSchema] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setStatus('checking');
      setError(null);

      // Get Supabase project info
      const { data, error } = await supabase.rpc('get_project_info');

      if (error) {
        console.error('Supabase connection error:', error);
        setStatus('error');
        setError(`Connection error: ${error.message}`);
        return;
      }

      setStatus('connected');
      setProjectInfo(data);
      
      // Get SQL schema for database setup
      const schemaSQL = `
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lastName TEXT,
  username TEXT,
  avatar TEXT,
  points INTEGER DEFAULT 0,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  achievements JSONB DEFAULT '[]'::JSONB,
  badges JSONB DEFAULT '[]'::JSONB,
  titles JSONB DEFAULT '[]'::JSONB,
  profileFrames JSONB DEFAULT '[]'::JSONB,
  cosmetics JSONB DEFAULT '[]'::JSONB,
  selectedTitle TEXT,
  selectedFrame TEXT,
  selectedBadge TEXT,
  customStatus TEXT,
  prestige INTEGER DEFAULT 0,
  stats JSONB DEFAULT '{
    "gamesPlayed": 0,
    "highestScore": 0,
    "totalTimePlayed": 0,
    "loginStreak": 0,
    "longestLoginStreak": 0,
    "lastLogin": null,
    "gameStats": {}
  }'::JSONB
);

-- Create RLS policies for the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);
      `;

      setSchema(schemaSQL);
    } catch (err) {
      console.error('Unexpected error:', err);
      setStatus('error');
      setError(`Unexpected error: ${err.message}`);
    }
  };

  const setupDatabase = async () => {
    try {
      setStatus('setting_up');
      setError(null);

      // Execute SQL schema
      const { error } = await supabase.rpc('exec_sql', { sql: schema });

      if (error) {
        console.error('Database setup error:', error);
        setStatus('error');
        setError(`Database setup error: ${error.message}`);
        return;
      }

      setStatus('setup_complete');
    } catch (err) {
      console.error('Unexpected error during setup:', err);
      setStatus('error');
      setError(`Unexpected error during setup: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-deepLapis shadow-lg rounded-lg border border-royalGold/20">
      <h2 className="text-2xl font-bold mb-4 text-royalGold">Supabase Setup</h2>
      
      <div className="mb-6 p-4 rounded bg-deepLapisDark border border-royalGold/10">
        <div className="flex items-center mb-4">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            status === 'checking' ? 'bg-amber animate-pulse' : 
            status === 'connected' ? 'bg-emeraldGreen' :
            status === 'setting_up' ? 'bg-amber animate-pulse' :
            status === 'setup_complete' ? 'bg-emeraldGreen' : 'bg-rubyRed'
          }`}></div>
          <span className="text-textLight">
            {status === 'checking' ? 'Checking connection...' :
             status === 'connected' ? 'Connected to Supabase' :
             status === 'setting_up' ? 'Setting up database...' :
             status === 'setup_complete' ? 'Database setup complete' : 'Connection error'}
          </span>
        </div>
        
        {error && (
          <div className="p-3 bg-rubyRed/10 border border-rubyRed/30 rounded text-sm text-textLight">
            {error}
          </div>
        )}
        
        {projectInfo && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-textGold mb-2">Project Info</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-textLight/70">Project Name:</div>
              <div className="text-textLight">{projectInfo.name}</div>
              <div className="text-textLight/70">Region:</div>
              <div className="text-textLight">{projectInfo.region}</div>
              <div className="text-textLight/70">Organization:</div>
              <div className="text-textLight">{projectInfo.organization}</div>
            </div>
          </div>
        )}
      </div>
      
      {status === 'connected' && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-textGold mb-2">Database Setup</h3>
          <p className="text-textLight/80 mb-4">
            Click the button below to set up the required database tables and policies for the application.
          </p>
          <button
            onClick={setupDatabase}
            className="px-4 py-2 bg-royalGold text-deepLapisDark font-semibold rounded hover:bg-royalGoldLight transition-colors"
          >
            Setup Database
          </button>
        </div>
      )}
      
      {(status === 'error' || status === 'checking') && (
        <div className="mb-6">
          <button
            onClick={checkConnection}
            className="px-4 py-2 bg-royalGold text-deepLapisDark font-semibold rounded hover:bg-royalGoldLight transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-textGold mb-2">Manual Setup</h3>
        <p className="text-textLight/80 mb-2">
          If the automatic setup doesn't work, you can manually execute the SQL in your Supabase dashboard:
        </p>
        <div className="bg-deepLapisDark p-4 rounded-md overflow-auto max-h-60">
          <pre className="text-textLight text-sm whitespace-pre-wrap">{schema}</pre>
        </div>
      </div>
    </div>
  );
};

export default SupabaseSetup; 