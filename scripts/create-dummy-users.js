// Script to create dummy users directly in the database using SQL
// This bypasses RLS policies by using an RPC function that must exist in the database

import { createClient } from '@supabase/supabase-js';

// Supabase credentials from .env.local
const supabaseUrl = 'https://luzpkuypmyidaluitvzh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1enBrdXlwbXlpZGFsdWl0dnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDM4NDIsImV4cCI6MjA2MjI3OTg0Mn0.D4am_bzy02Ve5iEETJfSapppTc9g5uD5UTLCv7KqXd0';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to create a dummy user directly via SQL
async function createDummyUser() {
  console.log('Starting dummy user creation process...');
  
  try {
    // First, check if there's already a test user by getting all users
    const { data: existingUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, points')
      .limit(5);
      
    if (fetchError) {
      console.error('Error fetching existing users:', fetchError);
    } else {
      console.log('Existing users:', existingUsers);
      
      // If we found users, report them
      if (existingUsers && existingUsers.length > 0) {
        console.log(`Found ${existingUsers.length} existing users.`);
        console.log('User columns available:', Object.keys(existingUsers[0]).join(', '));
        return;
      }
    }
    
    // Try using the exec_sql RPC function to bypass RLS policies
    // This requires that the function exists in the database
    console.log('Attempting to create a test user via RPC...');
    
    const insertSql = `
      INSERT INTO public.profiles (username, points)
      VALUES 
        ('testuser1', 100),
        ('testuser2', 200),
        ('testuser3', 300);
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: insertSql
    });
    
    if (error) {
      console.error('RPC error:', error);
      
      // Fallback to regular insert (may hit RLS)
      console.log('Trying direct insert as fallback...');
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          { username: 'test_user1', points: 100 },
          { username: 'test_user2', points: 200 }
        ]);
        
      if (insertError) {
        console.error('Direct insert error:', insertError);
      } else {
        console.log('Direct insert successful!');
      }
    } else {
      console.log('SQL execution successful!');
    }
  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

// Run the function
createDummyUser()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script error:', err));
