// Script to fix the profiles table schema based on the console error
import { createClient } from '@supabase/supabase-js';

// Supabase credentials 
const supabaseUrl = 'https://luzpkuypmyidaluitvzh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1enBrdXlwbXlpZGFsdWl0dnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDM4NDIsImV4cCI6MjA2MjI3OTg0Mn0.D4am_bzy02Ve5iEETJfSapppTc9g5uD5UTLCv7KqXd0';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const adminSupabase = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

async function fixProfilesTable() {
  console.log('Starting profiles table fix...');
  
  // Try with PostgreSQL RPC (requires service role key)
  if (adminSupabase) {
    try {
      console.log('Attempting to fix schema using admin privileges...');
      
      // Use RPC to run SQL that adds the missing columns
      const { error } = await adminSupabase.rpc('exec_sql', { 
        sql: `
          -- Add missing columns to profiles table
          ALTER TABLE IF EXISTS profiles 
          ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::JSONB,
          ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::JSONB,
          ADD COLUMN IF NOT EXISTS titles JSONB DEFAULT '[]'::JSONB,
          ADD COLUMN IF NOT EXISTS profile_frames JSONB DEFAULT '[]'::JSONB,
          ADD COLUMN IF NOT EXISTS cosmetics JSONB DEFAULT '[]'::JSONB,
          ADD COLUMN IF NOT EXISTS selected_title TEXT,
          ADD COLUMN IF NOT EXISTS selected_frame TEXT,
          ADD COLUMN IF NOT EXISTS selected_badge TEXT;
        `
      });
      
      if (error) {
        console.error('RPC error:', error);
      } else {
        console.log('Table schema updated successfully!');
      }
    } catch (e) {
      console.error('Admin operation error:', e);
    }
  } else {
    console.log('Service role key not available, skipping schema updates.');
  }
  
  // Let's try a simplified approach for user creation
  console.log('\nCreating a test user with the correct table structure...');
  
  try {
    // Only include basic fields that we know exist based on our testing
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        username: 'testuser_' + Date.now().toString().substring(6), // Use timestamp to ensure uniqueness
        points: 500
      })
      .select();
      
    if (error) {
      console.error('Error creating user:', error);
    } else {
      console.log('Test user created successfully:', data);
      
      // Let's check the fields that are actually available on the profiles table
      console.log('\nAvailable fields in the profiles table:');
      if (data && data.length > 0) {
        console.log(Object.keys(data[0]));
      }
    }
  } catch (e) {
    console.error('Test user creation error:', e);
  }
  
  console.log('\nScript completed.');
}

// Run the function
fixProfilesTable()
  .then(() => console.log('Schema fix script complete'))
  .catch(err => console.error('Schema fix script error:', err));
