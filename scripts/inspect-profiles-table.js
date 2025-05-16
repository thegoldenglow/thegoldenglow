// Script to inspect the actual structure of the profiles table
import { createClient } from '@supabase/supabase-js';

// Supabase credentials from .env.local
const supabaseUrl = 'https://luzpkuypmyidaluitvzh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1enBrdXlwbXlpZGFsdWl0dnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDM4NDIsImV4cCI6MjA2MjI3OTg0Mn0.D4am_bzy02Ve5iEETJfSapppTc9g5uD5UTLCv7KqXd0';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to inspect table structure
async function inspectProfilesTable() {
  console.log('Inspecting profiles table structure...');

  // Method 1: Query system tables (may not work depending on permissions)
  try {
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', { table_name: 'profiles' });

    if (error) {
      console.log('Error getting columns via RPC:', error.message);
    } else {
      console.log('Columns found:', columns);
    }
  } catch (e) {
    console.log('Exception when querying system tables:', e);
  }

  // Method 2: Try a direct insert with minimal fields
  try {
    console.log('\nAttempting minimal insert to profiles table...');
    
    // Generate a test user ID
    const testUserId = crypto.randomUUID();
    
    // Try minimal fields first
    const { error: minimalError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        name: 'Test User'
      });
      
    if (minimalError) {
      console.log('Error with minimal insert:', minimalError);
    } else {
      console.log('Minimal insert successful! ID:', testUserId);
    }
  } catch (e) {
    console.log('Exception during minimal insert:', e);
  }
  
  // Method 3: Get existing records to inspect structure
  try {
    console.log('\nFetching existing records to inspect structure...');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('Error fetching records:', error);
    } else if (data && data.length > 0) {
      console.log('Record structure:');
      console.log(JSON.stringify(data[0], null, 2));
      console.log('\nColumns available:', Object.keys(data[0]).join(', '));
    } else {
      console.log('No records found to inspect');
    }
  } catch (e) {
    console.log('Exception when fetching records:', e);
  }
}

// Run the function
inspectProfilesTable().catch(error => {
  console.error('Error in inspection script:', error);
});
