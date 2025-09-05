import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🚀 Applying Telegram sync migration directly...');
  
  try {
    // Read the migration SQL
    const migrationSQL = fs.readFileSync('supabase/migrations/20250108_ensure_telegram_sync.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('execute_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          console.log('Statement was:', statement.substring(0, 200) + '...');
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('\n🎉 Migration application completed!');
    
    // Test the function
    console.log('\n🧪 Testing sync_telegram_user function...');
    const { data, error } = await supabase.rpc('sync_telegram_user', {
      p_telegram_id: 'test123456',
      p_telegram_username: 'testuser',
      p_telegram_first_name: 'Test',
      p_telegram_last_name: 'User'
    });
    
    if (error) {
      console.error('❌ Function test failed:', error);
    } else {
      console.log('✅ Function test successful!');
      console.log('📊 Result:', JSON.stringify(data, null, 2));
    }
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  }
}

applyMigration();