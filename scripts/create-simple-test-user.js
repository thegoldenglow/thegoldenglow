// Script to create a test user with minimal fields
import { createClient } from '@supabase/supabase-js';

// Supabase credentials from .env.local
const supabaseUrl = 'https://luzpkuypmyidaluitvzh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1enBrdXlwbXlpZGFsdWl0dnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDM4NDIsImV4cCI6MjA2MjI3OTg0Mn0.D4am_bzy02Ve5iEETJfSapppTc9g5uD5UTLCv7KqXd0';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createSimpleTestUser() {
  console.log('Creating test user with minimal fields...');
  
  try {
    // First, check the profiles schema without trying to use it
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('check_table_exists', { table_name: 'profiles' });
    
    if (schemaError) {
      console.log('Schema check error:', schemaError);
      console.log('This is expected if the RPC function doesn\'t exist.');
      console.log('Proceeding with direct insert attempt...');
    } else {
      console.log('Schema check result:', schemaData);
    }
    
    // Generate a UUID for the test user
    const userId = crypto.randomUUID();
    
    // Try to insert a user with only the basic essential fields
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: 'testuser',
        points: 100
      })
      .select();
    
    if (error) {
      console.error('Error creating test user:', error);
      
      // Try with even more minimal fields
      console.log('Trying with only ID field...');
      const { error: minimalError } = await supabase
        .from('profiles')
        .insert({
          id: userId
        });
        
      if (minimalError) {
        console.error('Minimal insert failed too:', minimalError);
      } else {
        console.log('Minimal insert successful!');
      }
      
    } else {
      console.log('Test user created successfully!');
      console.log('User data:', data);
    }
    
    // Try to update the user's points specifically
    console.log('Testing points update...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ points: 200 })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error updating points:', updateError);
    } else {
      console.log('Points updated successfully!');
      
      // Try to read back the updated points
      const { data: updatedUser, error: readError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();
      
      if (readError) {
        console.error('Error reading updated user:', readError);
      } else {
        console.log('Updated user points:', updatedUser.points);
      }
    }
  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

// Run the function
createSimpleTestUser()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script error:', err));
