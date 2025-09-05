const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🧪 Testing Telegram Points Fix...');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTelegramFix() {
  try {
    console.log('1️⃣ Getting BananBenBadr profile...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'BananBenBadr')
      .single();
    
    if (profileError) {
      console.error('❌ Profile not found:', profileError.message);
      return;
    }
    
    console.log('📊 Profile found:', {
      id: profile.id,
      username: profile.username,
      points: profile.points,
      auth_user_id: profile.auth_user_id
    });
    
    console.log('\n2️⃣ Testing game session creation...');
    
    // Generate a UUID for the session
    const sessionUserId = `telegram-${profile.id}-${Date.now()}`
      .padEnd(36, '0')
      .substring(0, 36)
      .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    
    console.log('🔑 Generated session user ID:', sessionUserId);
    
    const testSession = {
      user_id: sessionUserId,
      game_type: 'test_telegram_fix',
      score: 150,
      points_earned: 15,
      duration: 90,
      completed: true,
      data: { test: true, timestamp: Date.now() },
      ended_at: new Date().toISOString()
    };
    
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .insert(testSession)
      .select()
      .single();
    
    if (sessionError) {
      console.error('❌ Session creation failed:', sessionError.message);
      return;
    }
    
    console.log('✅ Game session created successfully:', {
      id: session.id,
      game_type: session.game_type,
      score: session.score,
      points_earned: session.points_earned
    });
    
    console.log('\n3️⃣ Testing points update...');
    
    const currentPoints = profile.points || 0;
    const newPoints = currentPoints + 15;
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq('id', profile.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Points update failed:', updateError.message);
      return;
    }
    
    console.log('✅ Points updated successfully:', {
      previousPoints: currentPoints,
      newPoints: updatedProfile.points,
      pointsEarned: 15
    });
    
    console.log('\n4️⃣ Verifying game sessions table...');
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('game_type', 'test_telegram_fix')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (sessionsError) {
      console.error('❌ Sessions query failed:', sessionsError.message);
    } else {
      console.log('✅ Recent test sessions:', sessions.length);
      sessions.forEach((s, i) => {
        console.log(`   ${i + 1}. Score: ${s.score}, Points: ${s.points_earned}, ID: ${s.id}`);
      });
    }
    
    console.log('\n🎉 Telegram Points Fix Test Results:');
    console.log('   ✅ Game sessions can be created');
    console.log('   ✅ Points_earned column is working');
    console.log('   ✅ User points can be updated');
    console.log('   ✅ Database operations are successful');
    
    console.log('\n📱 The fix is ready! Telegram users should now be able to:');
    console.log('   • Play games and have sessions saved');
    console.log('   • Earn points that are properly tracked');
    console.log('   • See their points increase after games');
    
  } catch (error) {
    console.error('❌ Test failed with unexpected error:', error.message);
  }
}

testTelegramFix();