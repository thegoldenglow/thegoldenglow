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
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
// Prefer service role for migrations (DDL via RPC), fall back to anon if not set
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  console.error('Make sure VITE_SUPABASE_URL is set, and preferably VITE_SUPABASE_SERVICE_ROLE_KEY (or provide VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

// Create Supabase client (Node context)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
});

// Get migration file path from command line argument
const migrationFileName = process.argv[2];
if (!migrationFileName) {
  console.error('Error: Please provide a migration file path');
  console.error('Usage: node apply-migration.mjs <migration-file-path>');
  process.exit(1);
}

const migrationFilePath = join(__dirname, '..', migrationFileName);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationSQL = readFileSync(migrationFilePath, 'utf8');
    
    console.log('Applying migration to Supabase project...');
    console.log(`Project URL: ${supabaseUrl}`);
    console.log(`Using key type: ${supabaseServiceRoleKey ? 'service_role' : 'anon'}`);
    
    // Execute the SQL directly using the rpc function
    // This assumes your project has the postgrest_rpc function set up
    const { data, error } = await supabase.rpc('postgrest_rpc', {
      query: migrationSQL
    });
    
    if (error) {
      console.error('Error executing migration:', error);
      
      // If the RPC function doesn't exist, we'll try to guide the user
      const message = (error && (error.message || error.error_description || error.msg)) || '';
      if (message.includes('postgrest_rpc') || message.includes('function') || message.includes('schema cache')) {
        console.log('\nThe postgrest_rpc function may not be set up in your Supabase project.');
        console.log('You can apply this migration manually by:');
        console.log(`1. Go to your Supabase dashboard SQL editor: ${supabaseUrl.replace('/rest/v1', '')}/sql`);
        console.log('2. Create a new query');
        console.log('3. Paste the contents of the migration file');
        console.log('4. Run the query');
      }
      
      process.exit(1);
    }
    
    console.log('Migration applied successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
