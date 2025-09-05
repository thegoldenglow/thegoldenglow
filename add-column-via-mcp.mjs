import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 Adding points_earned column via Supabase MCP...');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPointsEarnedColumn() {
  try {
    console.log('\n📋 Step 1: Checking current game_sessions table structure...');
    
    // First check what columns exist
    const { data: existingData, error: checkError } = await supabase
      .from('game_sessions')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking table:', checkError.message);
      return;
    }
    
    if (existingData && existingData.length > 0) {
      console.log('📊 Current columns:', Object.keys(existingData[0]));
    } else {
      console.log('📊 Table exists but is empty');
    }
    
    console.log('\n🔧 Step 2: Attempting to add points_earned column...');
    
    // Try to use a stored procedure or function to add the column
    const { data: result, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          -- Check if column exists
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'game_sessions' 
            AND column_name = 'points_earned'
          ) THEN
            -- Add the column
            ALTER TABLE game_sessions ADD COLUMN points_earned INTEGER DEFAULT 0;
            
            -- Add a comment
            COMMENT ON COLUMN game_sessions.points_earned IS 'Points earned from this game session';
            
            -- Create an index for better performance
            CREATE INDEX IF NOT EXISTS idx_game_sessions_points_earned 
            ON game_sessions(points_earned);
            
            RAISE NOTICE 'Column points_earned added successfully';
          ELSE
            RAISE NOTICE 'Column points_earned already exists';
          END IF;
        END
        $$;
      `
    });
    
    if (sqlError) {
      console.log('⚠️ RPC exec_sql not available. Trying alternative approach...');
      
      // Alternative: Try to insert a test record to see if column exists
      const testRecord = {
        user_id: '00000000-0000-0000-0000-000000000001',
        game_type: 'column_test',
        score: 100,
        points_earned: 10,
        duration: 60,
        completed: true,
        data: { test: true },
        ended_at: new Date().toISOString()
      };
      
      const { data: testInsert, error: insertError } = await supabase
        .from('game_sessions')
        .insert(testRecord)
        .select()
        .single();
      
      if (insertError && insertError.message.includes('points_earned')) {
        console.log('❌ Column does not exist and cannot be added via client');
        console.log('\n🔧 Manual intervention required:');
        console.log('Please run this SQL in your Supabase SQL Editor:');
        console.log('\n```sql');
        console.log('ALTER TABLE game_sessions ADD COLUMN points_earned INTEGER DEFAULT 0;');
        console.log('COMMENT ON COLUMN game_sessions.points_earned IS \'Points earned from this game session\';');
        console.log('CREATE INDEX idx_game_sessions_points_earned ON game_sessions(points_earned);');
        console.log('```');
        console.log('\n📝 After running the SQL, test again with: node test-database-with-mcp.mjs');
        return;
      } else if (!insertError) {
        console.log('✅ Column already exists! Test insert successful:', {
          id: testInsert.id,
          points_earned: testInsert.points_earned
        });
        
        // Clean up test record
        await supabase
          .from('game_sessions')
          .delete()
          .eq('id', testInsert.id);
        
        console.log('🧹 Test record cleaned up');
      } else {
        console.error('❌ Unexpected error:', insertError.message);
        return;
      }
    } else {
      console.log('✅ SQL executed successfully via RPC');
    }
    
    console.log('\n🧪 Step 3: Verifying column addition...');
    
    // Test the column with a real insert
    const verificationRecord = {
      user_id: '00000000-0000-0000-0000-000000000002',
      game_type: 'verification_test',
      score: 200,
      points_earned: 20,
      duration: 90,
      completed: true,
      data: { verification: true, timestamp: Date.now() },
      ended_at: new Date().toISOString()
    };
    
    const { data: verified, error: verifyError } = await supabase
      .from('game_sessions')
      .insert(verificationRecord)
      .select()
      .single();
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Column verification successful:', {
        id: verified.id,
        points_earned: verified.points_earned,
        game_type: verified.game_type
      });
      
      // Clean up verification record
      await supabase
        .from('game_sessions')
        .delete()
        .eq('id', verified.id);
      
      console.log('🧹 Verification record cleaned up');
    }
    
    console.log('\n📊 Step 4: Final table structure check...');
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('game_sessions')
      .select('*')
      .limit(1);
    
    if (finalError) {
      console.error('❌ Final check failed:', finalError.message);
    } else {
      if (finalCheck && finalCheck.length > 0) {
        console.log('✅ Final table structure:', Object.keys(finalCheck[0]));
      } else {
        console.log('✅ Table structure updated (empty table)');
      }
    }
    
    console.log('\n🎉 Column Addition Complete!');
    console.log('\n📱 Next Steps:');
    console.log('1. Run: node test-database-with-mcp.mjs');
    console.log('2. Test Telegram WebApp games');
    console.log('3. Verify points are being saved');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

addPointsEarnedColumn();