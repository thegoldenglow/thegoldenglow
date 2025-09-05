import React, { useState, useEffect } from 'react';
import { supabase, checkSupabaseConnection, isSupabaseAvailable } from '../../utils/supabase';
import SupabaseMCP from './SupabaseMCP';

const SupabaseSetup = () => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);
  const [schema, setSchema] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setStatus('checking');
      setError(null);

      // Avoid any network activity if Supabase isn't configured
      if (!isSupabaseAvailable()) {
        setStatus('error');
        setError('Supabase is not configured. Running in guest mode.');
        return;
      }

      // Use a safe, minimal read to verify connectivity (no RPCs)
      const connectionStatus = await checkSupabaseConnection();
      if (!connectionStatus.success) {
        console.error('Supabase connection error:', connectionStatus.error);
        setStatus('error');
        setError(`Connection error: ${connectionStatus.error?.message || 'Unknown error'}`);
        return;
      }

      setStatus('connected');

      // Get SQL schema for database setup (manual execution)
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

      // For security, we do not execute SQL from the client.
      // Instead, copy SQL to clipboard so the developer can run it in Supabase SQL Editor.
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(schema);
        setStatus('setup_complete');
        setError('SQL copied to clipboard. Paste it into the Supabase SQL editor to run.');
      } else {
        setStatus('error');
        setError('Clipboard API unavailable. Please copy the SQL from the Manual Setup section below.');
      }
    } catch (err) {
      console.error('Unexpected error during setup:', err);
      setStatus('error');
      setError(`Unexpected error during setup: ${err.message}`);
    }
  };

  return (
    <>
      {/* Supabase MCP Server Integration */}
      <SupabaseMCP />
      
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
             status === 'setting_up' ? 'Preparing SQL for setup...' :
             status === 'setup_complete' ? 'SQL copied. Run it in Supabase SQL Editor.' : 'Connection error or not configured'}
          </span>
        </div>
        
        {error && (
          <div className="p-3 bg-rubyRed/10 border border-rubyRed/30 rounded text-sm text-textLight">
            {error}
          </div>
        )}
      </div>
      
      {status === 'connected' && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-textGold mb-2">Database Setup</h3>
          <p className="text-textLight/80 mb-4">
            Click the button below to copy the required SQL to your clipboard. Then paste it into the Supabase SQL Editor and run it to create tables and policies.
          </p>
          <button
            onClick={setupDatabase}
            className="px-4 py-2 bg-royalGold text-deepLapisDark font-semibold rounded hover:bg-royalGoldLight transition-colors"
          >
            Copy SQL to Clipboard
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
    </>
  );
};

export default SupabaseSetup;