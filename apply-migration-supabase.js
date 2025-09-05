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
    
    console.log('Applying migration to Supabase...');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          // Use direct SQL execution for DDL statements
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey
            },
            body: JSON.stringify({
              sql: statement + ';'
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error in statement ${i + 1}:`, errorText);
          } else {
            console.log(`Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`Exception in statement ${i + 1}:`, err.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('\nTesting sync_telegram_user function...');
    
    // Test the function
    const { data: testData, error: testError } = await supabase.rpc('sync_telegram_user', {
      p_telegram_id: '123456789',
      p_telegram_username: 'testuser',
      p_telegram_first_name: 'Test',
      p_telegram_last_name: 'User',
      p_telegram_photo_url: 'https://example.com/photo.jpg'
    });
    
    if (testError) {
      console.error('Error testing sync_telegram_user:', testError);
    } else {
      console.log('sync_telegram_user test successful:', testData);
    }
    
    // Verify the user was created
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', '123456789')
      .single();
    
    if (userError) {
      console.error('Error fetching test user:', userError);
    } else {
      console.log('Test user created successfully:', userData);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

applyMigration();