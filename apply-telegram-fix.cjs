const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

console.log('🔧 Applying Telegram Points Fix...');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyTelegramFix() {
  try {
    console.log('📖 Reading SQL fix file...');
    const sqlContent = fs.readFileSync('telegram-points-fix.sql', 'utf8');
    
    console.log('🚀 Executing SQL commands...');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('execute_sql', {
            sql_query: statement + ';'
          });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Unexpected error in statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('\n🎯 Testing the fix with BananBenBadr user...');
    
    // Test the fix
    const { data: testResult, error: testError } = await supabase
      .rpc('save_telegram_game_session', {
        p_profile_id: 38, // BananBenBadr's profile ID
        p_game_type: 'test_game',
        p_score: 100,
        p_points_earned: 10,
        p_duration: 60,
        p_completed: true,
        p_game_data: { test: true }
      });
    
    if (testError) {
      console.error('❌ Test failed:', testError.message);
    } else {
      console.log('✅ Test successful! Game session saved:', testResult);
    }
    
    console.log('\n🏁 Telegram points fix application complete!');
    console.log('\n📱 Next steps:');
    console.log('   1. Test the game in Telegram WebApp');
    console.log('   2. Check if points are now being saved correctly');
    console.log('   3. Verify game sessions appear in the database');
    
  } catch (error) {
    console.error('❌ Failed to apply Telegram fix:', error.message);
    process.exit(1);
  }
}

applyTelegramFix();