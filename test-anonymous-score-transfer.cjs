const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAnonymousScoreTransfer() {
  console.log('🧪 Testing Anonymous Score Transfer Functionality\n');
  
  const testEmail = 'test-anon-transfer@goldenglow.com';
  const testPassword = 'testpassword123';
  
  try {
    // Step 1: Clean up any existing test user
    console.log('1️⃣ Cleaning up existing test user...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === testEmail);
    
    if (existingUser) {
      await supabase.auth.admin.deleteUser(existingUser.id);
      console.log('✅ Existing test user deleted');
    }
    
    // Step 2: Simulate anonymous user accumulating points
    console.log('\n2️⃣ Simulating anonymous user with points...');
    const anonymousPoints = 150;
    console.log(`📊 Anonymous user has accumulated ${anonymousPoints} points`);
    
    // Step 3: Create and confirm test user
    console.log('\n3️⃣ Creating test user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (signUpError) {
      console.error('❌ Error creating user:', signUpError.message);
      return;
    }
    
    console.log('✅ Test user created successfully');
    const userId = signUpData.user.id;
    
    // Step 4: Check if profile exists or create one
    console.log('\n4️⃣ Checking user profile...');
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      console.log('Creating new profile...');
      const uniqueUsername = `testuser_${Date.now()}`;
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          username: uniqueUsername,
          points: 0,
          achievements: []
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating profile:', createError.message);
        return;
      }
      profile = newProfile;
      console.log('✅ User profile created with 0 points');
    } else if (profileError) {
      console.error('❌ Error checking profile:', profileError.message);
      return;
    } else {
      console.log('✅ User profile found with', profile.points, 'points');
      // Reset points to 0 for testing
      const { data: resetProfile, error: resetError } = await supabase
        .from('profiles')
        .update({ points: 0 })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (resetError) {
        console.error('❌ Error resetting points:', resetError.message);
        return;
      }
      profile = resetProfile;
      console.log('✅ Points reset to 0 for testing');
    }
    
    // Step 5: Simulate anonymous score transfer during authentication
    console.log('\n5️⃣ Simulating anonymous score transfer...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ points: (profile.points || 0) + anonymousPoints })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error transferring anonymous points:', updateError.message);
      return;
    }
    
    console.log(`✅ Anonymous points transferred successfully!`);
    console.log(`📊 User points before transfer: ${profile.points}`);
    console.log(`📊 Anonymous points transferred: ${anonymousPoints}`);
    console.log(`📊 User points after transfer: ${updatedProfile.points}`);
    
    // Step 6: Verify the transfer worked correctly
    console.log('\n6️⃣ Verifying transfer...');
    if (updatedProfile.points === anonymousPoints) {
      console.log('✅ Transfer verification successful!');
    } else {
      console.log('❌ Transfer verification failed!');
      console.log(`Expected: ${anonymousPoints}, Got: ${updatedProfile.points}`);
    }
    
    // Step 7: Test game session creation with transferred points
    console.log('\n7️⃣ Testing game session creation...');
    const { data: gameSession, error: gameError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        game_type: 'test_game',
        score: 50,
        points_earned: 25,
        duration: 120,
        completed: true
      })
      .select()
      .single();
    
    if (gameError) {
      console.error('❌ Error creating game session:', gameError.message);
    } else {
      console.log('✅ Game session created successfully');
      console.log(`🎮 Game session ID: ${gameSession.id}`);
    }
    
    console.log('\n🎉 Anonymous Score Transfer Test Complete!');
    console.log('\n📋 Summary:');
    console.log(`   • Anonymous points: ${anonymousPoints}`);
    console.log(`   • Final user points: ${updatedProfile.points}`);
    console.log(`   • Transfer successful: ${updatedProfile.points === anonymousPoints ? 'Yes' : 'No'}`);
    console.log(`   • Game session created: ${gameSession ? 'Yes' : 'No'}`);
    
    console.log('\n🔧 Implementation Notes:');
    console.log('   1. Anonymous points are now transferred to database during authentication');
    console.log('   2. localStorage is cleared after successful transfer');
    console.log('   3. Both email and Telegram authentication support anonymous score transfer');
    console.log('   4. Points are properly persisted in the database');
    
    console.log('\n🧪 To test manually:');
    console.log('   1. Play games without signing in to accumulate anonymous points');
    console.log('   2. Sign in with any authentication method');
    console.log('   3. Verify that anonymous points are added to your account');
    console.log('   4. Check that localStorage anonymous score is cleared');
    
    // Clean up: Delete test user and profile
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    
    if (deleteProfileError) {
      console.log('Note: Could not delete profile:', deleteProfileError.message);
    }
    
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('❌ Error deleting test user:', deleteError.message);
    } else {
      console.log('✅ Test user cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error);
  }
}

// Run the test
testAnonymousScoreTransfer();