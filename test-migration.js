// test-migration.js
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Setup proper paths for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Get Supabase connection details from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local file');
  process.exit(1);
}

console.log('Connecting to Supabase...');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key starts with: ${supabaseKey.substring(0, 5)}...`);

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    // Read the migration file
    console.log('Reading migration file...');
    const migrationSQL = fs.readFileSync('admin_tables_migration.sql', 'utf8');
    
    // Split the migration file into individual statements
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
        // Use a parameterized RPC call with the REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            sql_statement: statement
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error executing statement ${i + 1}:`, errorText);
          // Continue with other statements even if one fails
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`Exception executing statement ${i + 1}:`, err);
      }
    }
    
    console.log('Migration completed');
    return true;
  } catch (error) {
    console.error('Error running migration:', error);
    return false;
  }
}

// Run the migration
runMigration().then(success => {
  if (success) {
    console.log('Migration process completed. Check the logs for any errors in individual statements.');
  } else {
    console.log('Migration process failed. Please check your Supabase dashboard for the state of your database.');
  }
}); 