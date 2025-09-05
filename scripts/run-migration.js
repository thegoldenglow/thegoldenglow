// run-migration.js - ESM format
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Setup proper paths for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local if it exists
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Get Supabase connection details from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to execute SQL on Supabase SQL Editor via API
async function executeSql(sql) {
  try {
    const { data, error } = await supabase.rpc('pg_query', { 
      query_text: sql
    });
    
    return { data, error };
  } catch (error) {
    return { error };
  }
}

// Alternative approach - direct execution
async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = join(__dirname, '..', 'admin_tables_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Applying migration to Supabase...');
    console.log('Please note: If tables already exist, you might see some expected errors for the CREATE TABLE statements.');
    
    // Try to execute the entire migration file as one operation
    const { error } = await supabase.rpc('pg_query', {
      query_text: migrationSQL
    });
    
    if (error) {
      console.error('Error applying migration:', error);
      console.log('Trying to execute statements individually...');
      
      // Split the migration file into individual statements as a fallback
      const statements = migrationSQL
        .replace(/\/\*.*?\*\//gms, '') // Remove SQL block comments
        .replace(/--.*$/gm, '') // Remove single-line comments
        .split(';')
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0);
      
      console.log(`Found ${statements.length} SQL statements to execute`);
      
      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('pg_query', {
            query_text: statement
          });
          
          if (error) {
            console.error(`Error executing statement ${i + 1}:`, error);
            // Continue with other statements even if one fails
          } else {
            console.log(`Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`Exception executing statement ${i + 1}:`, err);
        }
      }
    } else {
      console.log('Migration applied successfully in one operation');
    }
    
    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration(); 