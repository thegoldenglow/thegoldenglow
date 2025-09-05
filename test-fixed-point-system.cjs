
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPointSystem() {
  console.log('🧪 Testing Fixed Point System...');
  
  try {
    // 1. Create a test user in auth.users first
    console.log('
1. Creating test user...');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });
    
    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      return;
    }
    
    const userId = authData.user.id;
    console.log('✅ Test user created with ID:', userId);
    
    // 2. Create profile (this should work now with proper auth user)
    console.log('
2. Creating user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        name: 'Test User',
        username: `test_user_${Date.now()}`,
        points: 0,
        achievements: []
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      return;
    }
    
    console.log('✅ Profile created:', {
      id: profile.id,
      username: profile.username,
      points: profile.points
    });
    
    // 3. Test game session creation with points
    console.log('
3. Testing game session with points...');
    const pointsToEarn = 150;
    
    const { data: gameSession, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        game_type: 'test_game',
        score: 750,
        points_earned: pointsToEarn,
        duration: 120,
        completed: true,
        data: { test: true, level: 5 }
      })
      .select()
      .single();
    
    if (sessionError) {
      console.error('❌ Error creating game session:', sessionError);
    } else {
      console.log('✅ Game session created:', {
        id: gameSession.id,
        points_earned: gameSession.points_earned
      });
    }
    
    // 4. Update user points
    console.log('
4. Updating user points...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ points: profile.points + pointsToEarn })
      .eq('id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating points:', updateError);
    } else {
      console.log('✅ Points updated:', {
        previous: profile.points,
        earned: pointsToEarn,
        new: updatedProfile.points
      });
    }
    
    // 5. Verify final state
    console.log('
5. Verifying final state...');
    const { data: finalProfile, error: finalError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();
    
    if (finalError) {
      console.error('❌ Error fetching final profile:', finalError);
    } else {
      console.log('✅ Final points:', finalProfile.points);
      
      if (finalProfile.points === pointsToEarn) {
        console.log('🎉 Point system test PASSED!');
      } else {
        console.log('❌ Point system test FAILED - points mismatch');
      }
    }
    
    // 6. Cleanup
    console.log('
6. Cleaning up test data...');
    
    // Delete game session
    await supabase
      .from('game_sessions')
      .delete()
      .eq('user_id', userId);
    
    // Delete profile
    await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    // Delete auth user (admin operation - might not work with anon key)
    // This would require admin privileges
    
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testPointSystem().then(() => {
  console.log('
🏁 Point system test complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
  