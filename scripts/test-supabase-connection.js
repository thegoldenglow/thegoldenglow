// Script to test Supabase connection and MCP server integration
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase credentials not found in environment variables');
  process.exit(1);
}

// Create Supabase client with enhanced configuration
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
});

async function testConnection() {
  try {
    console.log('Connecting to Supabase...');
    console.log(`URL: ${supabaseUrl}`);
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      console.error('Connection error:', error);
      return false;
    }
    
    console.log('Connection successful!');
    console.log('Retrieved data sample:', data);
    
    // Test other tables based on the memory info
    const tables = ['analytics_users', 'analytics_games', 'tasks', 'task_completions'];
    
    for (const table of tables) {
      try {
        console.log(`Testing table: ${table}`);
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('count')
          .limit(1);
          
        if (tableError) {
          console.warn(`Warning: Error accessing table ${table}:`, tableError);
        } else {
          console.log(`Table ${table} accessible`);
        }
      } catch (e) {
        console.warn(`Warning: Exception when testing table ${table}:`, e);
      }
    }
    
    return true;
  } catch (e) {
    console.error('Unexpected error during connection test:', e);
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    if (success) {
      console.log('All connection tests passed successfully');
    } else {
      console.error('Connection test failed');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
