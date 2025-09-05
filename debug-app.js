/* eslint-env node */
// Simple script to check Supabase connection and task loading
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase credentials in .env.local file');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

console.log('Supabase credentials found in .env.local');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key starts with: ${supabaseAnonKey.substring(0, 3)}...`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('tasks').select('*').limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase tasks table:', error);
    } else {
      console.log('Successfully connected to Supabase!');
      console.log(`Found ${data.length} tasks`);
      if (data.length > 0) {
        console.log('Sample task:', data[0]);
      }
    }
  } catch (err) {
    console.error('Exception when connecting to Supabase:', err.message);
  }
}

testConnection();
