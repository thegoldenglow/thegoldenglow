// Script to apply the SQL migration for referral tables
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import process from 'process';

// Get current file directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: join(__dirname, '..', '.env.local') });

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Path to migration file
const migrationFilePath = join(__dirname, '..', 'supabase', 'migrations', '20250522_add_referral_tables.sql');

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationSQL = readFileSync(migrationFilePath, 'utf8');
    
    console.log('Applying migration to Supabase project...');
    console.log('Project ID: luzpkuypmyidaluitvzh');
    
    // Execute the SQL directly using the rpc function
    // This assumes your project has the execute_sql RPC function set up
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: migrationSQL
    });
    
    if (error) {
      console.error('Error executing migration:', error);
      
      // If the RPC function doesn't exist, we'll try to guide the user
      if (error.message.includes('function "execute_sql" does not exist')) {
        console.log('\nThe execute_sql function may not be set up in your Supabase project.');
        console.log('You can apply this migration manually by:');
        console.log('1. Go to your Supabase dashboard: https://app.supabase.com/project/luzpkuypmyidaluitvzh/sql');
        console.log('2. Create a new query');
        console.log('3. Paste the contents of the migration file');
        console.log('4. Run the query');
      }
      
      process.exit(1);
    }
    
    console.log('Migration applied successfully!');
    console.log('The referral_codes and referrals tables are now created in your database.');
    
    // Additional info
    console.log('\nNext steps:');
    console.log('1. Update your telegramBot.js to use the database for referral tracking');
    console.log('2. Update your UserContext.jsx to use the database for referral data');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
