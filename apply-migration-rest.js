import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://luzpkuypmyidaluitvzh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1enBrdXlwbXlpZGFsdWl0dnpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjcwMzg0MiwiZXhwIjoyMDYyMjc5ODQyfQ.VjJJGcSBuNpLnc2nkTWzrIqGv_Zw9QUu3VJtJEx_HO8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250108_ensure_telegram_sync.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Checking if columns already exist...');
    
    // Check if telegram_id column exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'profiles')
      .eq('column_name', 'telegram_id');
    
    if (columnError) {
      console.log('Could not check existing columns, proceeding with migration...');
    } else if (columns && columns.length > 0) {
      console.log('telegram_id column already exists, checking function...');
    } else {
      console.log('telegram_id column does not exist, applying migration...');
    }
    
    // Try to apply individual parts of the migration
    console.log('\nApplying table alterations...');
    
    const alterTableSQL = `
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS telegram_id TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS telegram_username TEXT,
      ADD COLUMN IF NOT EXISTS telegram_first_name TEXT,
      ADD COLUMN IF NOT EXISTS telegram_last_name TEXT,
      ADD COLUMN IF NOT EXISTS telegram_photo_url TEXT,
      ADD COLUMN IF NOT EXISTS telegram_auth_date TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS user_source TEXT DEFAULT 'web_user';
    `;
    
    try {
      const { error: alterError } = await supabase.rpc('exec', { sql: alterTableSQL });
      if (alterError) {
        console.log('Table alteration result:', alterError.message);
      } else {
        console.log('Table alterations applied successfully');
      }
    } catch (err) {
      console.log('Table alteration attempt:', err.message);
    }
    
    console.log('\nCreating index...');
    const indexSQL = 'CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON profiles(telegram_id);';
    
    try {
      const { error: indexError } = await supabase.rpc('exec', { sql: indexSQL });
      if (indexError) {
        console.log('Index creation result:', indexError.message);
      } else {
        console.log('Index created successfully');
      }
    } catch (err) {
      console.log('Index creation attempt:', err.message);
    }
    
    console.log('\nTesting sync_telegram_user function...');
    
    // Test if the function exists and works
    const { data: testData, error: testError } = await supabase.rpc('sync_telegram_user', {
      p_telegram_id: '123456789',
      p_telegram_username: 'testuser',
      p_telegram_first_name: 'Test',
      p_telegram_last_name: 'User',
      p_telegram_photo_url: 'https://example.com/photo.jpg'
    });
    
    if (testError) {
      console.log('sync_telegram_user function not found or error:', testError.message);
      console.log('\nThe function may need to be created manually in the Supabase dashboard.');
      console.log('Please copy the function definition from the migration file and execute it in the SQL editor.');
    } else {
      console.log('sync_telegram_user test successful:', testData);
      
      // Verify the user was created
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', '123456789')
        .single();
      
      if (userError) {
        console.log('Error fetching test user:', userError.message);
      } else {
        console.log('Test user created successfully:', userData);
        
        // Clean up test user
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('telegram_id', '123456789');
        
        if (deleteError) {
          console.log('Error cleaning up test user:', deleteError.message);
        } else {
          console.log('Test user cleaned up');
        }
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log('1. Table columns should be added to profiles table');
    console.log('2. Index on telegram_id should be created');
    console.log('3. sync_telegram_user function may need manual creation');
    console.log('4. Telegram user synchronization should now work');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
  }
}

applyMigration();