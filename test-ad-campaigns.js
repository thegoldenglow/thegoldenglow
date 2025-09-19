import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing ad_campaigns table...');
console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Key:', supabaseAnonKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

try {
  // Test if ad_campaigns table exists
  const { data, error } = await supabase
    .from('ad_campaigns')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error accessing ad_campaigns table:', error.message);
    console.log('This suggests the table might not exist or there are permission issues.');
  } else {
    console.log('✅ ad_campaigns table accessible');
    console.log('Sample data:', data);
  }

  // List all tables to see what's available
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_schema_tables')
    .select('*');

  if (!tablesError && tables) {
    console.log('Available tables:', tables);
  }

} catch (err) {
  console.error('Exception:', err.message);
}