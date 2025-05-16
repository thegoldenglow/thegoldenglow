/* eslint-env node */
/* global process */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

async function refreshSchemaCache() {
  try {
    // Create a Supabase client with the admin key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Step 1: Attempting to apply game_identifier migration directly...');
    
    // Apply the game_identifier migration directly
    const { error: migrationError } = await supabase.rpc('pg_execute', {
      query: `
        -- Add game_identifier column to tasks table if it doesn't exist
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'tasks' AND column_name = 'game_identifier') THEN
            ALTER TABLE tasks ADD COLUMN game_identifier TEXT DEFAULT NULL;
          END IF;
        END $$;
      `
    });
    
    if (migrationError) {
      console.error('Error applying migration:', migrationError);
    } else {
      console.log('Migration applied successfully!');
    }
    
    console.log('Step 2: Attempting to refresh Supabase schema cache...');
    
    // Method 1: Try calling the reload schema endpoint
    const reloadUrl = `${supabaseUrl}/rest/v1/`;
    const response = await fetch(reloadUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    console.log('Schema reload request status:', response.status);
    
    // Method 2: Force a rpc call to pg_trigger_cache_reset
    console.log('Step 3: Forcing cache reset via pg_trigger_cache_reset...');
    try {
      const { error: resetError } = await supabase.rpc('pg_trigger_cache_reset', {});
      if (resetError) {
        console.error('Error triggering cache reset:', resetError);
      } else {
        console.log('Cache reset triggered successfully!');
      }
    } catch (rpcError) {
      console.error('Error calling pg_trigger_cache_reset:', rpcError.message);
    }
    
    console.log('Schema cache refresh attempts completed.');
    console.log('If issues persist, you may need to restart your Supabase project in the dashboard.');
    
    return true;
  } catch (err) {
    console.error('Error refreshing schema cache:', err.message);
    return false;
  }
}

refreshSchemaCache().then(success => {
  console.log('Script completed.');
  process.exit(0);
});
