import { createClient } from '@supabase/supabase-js';

// ===== Configuration =====
// Replace these values with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL'; // e.g., 'https://abcdefghijklm.supabase.co'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Your public anon key

// Import Node.js process explicitly for ESM
import { exit } from 'node:process';

// Check if credentials are provided
if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('⚠️ Please edit this file and replace the placeholder Supabase credentials with your actual values');
  exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test user data
const testUsers = [
  {
    username: 'Test User',
    email: 'testuser@example.com',
    role: 'user',
    status: 'active',
    points: 100,
    created_at: new Date().toISOString(),
    telegram_id: '123456789',
    updated_at: new Date().toISOString()
  },
  {
    username: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    points: 500,
    created_at: new Date().toISOString(),
    telegram_id: '987654321',
    updated_at: new Date().toISOString()
  },
  {
    username: 'Inactive User',
    email: 'inactive@example.com',
    role: 'user',
    status: 'inactive',
    points: 50,
    created_at: new Date().toISOString(),
    telegram_id: '555555555',
    updated_at: new Date().toISOString()
  }
];

// Function to add test users
async function addTestUsers() {
  try {
    console.log('Adding test users to Supabase...');
    
    for (const user of testUsers) {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
        console.error(`Error checking for existing user ${user.email}:`, checkError);
        continue;
      }
      
      if (existingUser) {
        console.log(`User with email ${user.email} already exists. Updating...`);
        const { error: updateError } = await supabase
          .from('profiles')
          .update(user)
          .eq('email', user.email);
          
        if (updateError) {
          console.error(`Error updating user ${user.email}:`, updateError);
        } else {
          console.log(`Updated user: ${user.email}`);
        }
      } else {
        console.log(`Adding new user: ${user.email}`);
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(user);
          
        if (insertError) {
          console.error(`Error adding user ${user.email}:`, insertError);
        } else {
          console.log(`Added user: ${user.email}`);
        }
      }
    }
    
    console.log('Finished adding test users');
  } catch (error) {
    console.error('Error in addTestUsers function:', error);
  }
}

// Run the function
addTestUsers().then(() => {
  console.log('Script completed');
  exit(0);
}).catch(error => {
  console.error('Unhandled error:', error);
  exit(1);
});
