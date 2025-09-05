const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔧 Adding points_earned column to game_sessions...');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPointsColumn() {
  try {
    console.log('1️⃣ Checking current game_sessions structure...');
    
    // First, let's see what columns exist
    const { data: existingSessions, error: checkError } = await supabase
      .from('game_sessions')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking table:', checkError.message);
      return;
    }
    
    if (existingSessions && existingSessions.length > 0) {
      console.log('📋 Current columns:', Object.keys(existingSessions[0]));
    }
    
    console.log('\n2️⃣ Adding points_earned column using SQL...');
    
    // Use RPC to execute raw SQL
    const { data: result, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'game_sessions' 
            AND column_name = 'points_earned'
          ) THEN
            ALTER TABLE game_sessions ADD COLUMN points_earned INTEGER DEFAULT 0;
            COMMENT ON COLUMN game_sessions.points_earned IS 'Points earned from this game session';
          END IF;
        END
        $$;
      `
    });
    
    if (sqlError) {
      console.log('⚠️ RPC method not available, trying direct SQL execution...');
      
      // Try alternative approach using a simple query
      const { error: altError } = await supabase
        .from('game_sessions')
        .select('points_earned')
        .limit(1);
      
      if (altError && altError.message.includes('column "points_earned" does not exist')) {
        console.log('❌ Column does not exist and cannot be added via client');
        console.log('\n🔧 Manual SQL needed:');
        console.log('ALTER TABLE game_sessions ADD COLUMN points_earned INTEGER DEFAULT 0;');
        console.log('\n📝 Please run this SQL in your Supabase SQL editor.');
        return;
      } else if (!altError) {
        console.log('✅ Column already exists!');
      }
    } else {
      console.log('✅ SQL executed successfully');
    }
    
    console.log('\n3️⃣ Testing the column...');
    
    // Test inserting a record with points_earned
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
    
    const { data: inserted, error: insertError } = await supabase
      .from('game_sessions')
      .insert(testRecord)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Test insert failed:', insertError.message);
      
      if (insertError.message.includes('points_earned')) {
        console.log('\n🔧 The column still needs to be added manually.');
        console.log('Please run this SQL in your Supabase dashboard:');
        console.log('ALTER TABLE game_sessions ADD COLUMN points_earned INTEGER DEFAULT 0;');
      }
    } else {
      console.log('✅ Test record inserted successfully:', {
        id: inserted.id,
        points_earned: inserted.points_earned
      });
      
      // Clean up test record
      await supabase
        .from('game_sessions')
        .delete()
        .eq('id', inserted.id);
      
      console.log('🧹 Test record cleaned up');
    }
    
    console.log('\n4️⃣ Final verification...');
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('game_sessions')
      .select('id, game_type, score, points_earned')
      .limit(1);
    
    if (finalError) {
      console.error('❌ Final check failed:', finalError.message);
    } else {
      console.log('✅ Table structure verified');
      if (finalCheck && finalCheck.length > 0) {
        console.log('📋 Available columns include points_earned:', Object.keys(finalCheck[0]));
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

addPointsColumn();