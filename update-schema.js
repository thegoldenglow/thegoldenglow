import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateSchema() {
  try {
    console.log('Connecting to Supabase...');
    
    // Use the SQL method to execute the ALTER TABLE statement
    const { error } = await supabase.rpc('pg_query', {
      query_text: 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS game_identifier TEXT'
    });
    
    if (error) {
      // Fallback method if pg_query RPC isn't available
      console.log('Trying alternative method...');
      
      // Directly querying the database using REST API
      const { error: restError } = await supabase
        .from('_schema')
        .select('*')
        .limit(1)
        .then(async () => {
          // This is just to verify connection
          console.log('Database connection successful, trying to alter table...');
          
          // For Supabase SQL queries are typically executed through the REST API
          // or using database functions. Let's try executing it through your migration function
          const { error: migrationError } = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              sql: 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS game_identifier TEXT'
            })
          }).then(res => res.json());
          
          return { error: migrationError };
        });
      
      if (restError) {
        console.error('Error updating schema with alternative method:', restError);
        return false;
      }
    }
    
    console.log('Schema updated successfully!');
    return true;
  } catch (err) {
    console.error('Error updating schema:', err.message);
    return false;
  }
}

updateSchema().then(success => {
  if (success) {
    console.log('Database schema has been updated successfully.');
  } else {
    console.log('Failed to update the database schema. See errors above.');
  }
  process.exit(success ? 0 : 1);
});
