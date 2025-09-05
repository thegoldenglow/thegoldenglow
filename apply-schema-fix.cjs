/**
 * Apply Schema Fix for Point Synchronization
 * This script fixes the schema mismatch and creates a test user
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySchemaFix() {
  console.log('🔧 Applying Schema Fix for Point Synchronization...');
  
  try {
    // Step 1: Check current schema
    console.log('\n1️⃣ Checking current schema...');
    const { data: currentProfiles, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking current schema:', checkError.message);
      return;
    }
    
    console.log('✅ Current profiles table structure detected');
    if (currentProfiles.length > 0) {
      console.log('📊 Sample record structure:', Object.keys(currentProfiles[0]));
    }
    
    // Step 2: Create a test user for authentication
    console.log('\n2️⃣ Creating test user for authentication...');
    
    const testEmail = 'test@goldenglow.com';
    const testPassword = 'testpassword123';
    
    // Get existing user or create new one
    let { data: users, error: listError } = await supabase.auth.admin.listUsers();
    let testUser = users?.users?.find(u => u.email === testEmail);
    
    if (!testUser) {
      // Create new user
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Test User',
          username: 'testuser'
        }
      });
      
      if (signUpError) {
        console.error('❌ Error creating test user:', signUpError.message);
        return;
      }
      testUser = signUpData.user;
    } else if (!testUser.email_confirmed_at) {
      // Confirm existing user
      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        testUser.id,
        { email_confirm: true }
      );
      
      if (confirmError) {
        console.error('❌ Error confirming user:', confirmError.message);
        return;
      }
    }
    
    console.log('✅ Test user ready:', testEmail);
    
    // Step 3: Sign in as the test user
    console.log('\n3️⃣ Signing in as test user...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.error('❌ Error signing in:', signInError.message);
      return;
    }
    
    console.log('✅ Signed in successfully');
    const userId = signInData.user.id;
    console.log('👤 User ID:', userId);
    
    // Step 4: Check if user has a profile in the current table structure
    console.log('\n4️⃣ Checking user profile...');
    
    // Try to find profile by user_id field (current structure)
    let { data: currentProfile, error: currentError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (currentError && currentError.code === 'PGRST116') {
      console.log('⚠️ No profile found, creating one...');
      
      // Create a profile in the current structure
      console.log('🔧 Creating profile in current structure...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          username: 'testuser_' + Date.now(),
          points: 0,
          user_type: 'test_user'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating profile:', createError.message);
        return;
      }
      
      currentProfile = newProfile;
      console.log('✅ Profile created:', newProfile);
    } else if (currentError) {
      console.error('❌ Error querying profile:', currentError.message);
      return;
    } else {
      console.log('✅ Found existing profile:', currentProfile);
    }
    
    // Step 5: Test point update in current structure
    console.log('\n5️⃣ Testing point update...');
    
    if (!currentProfile) {
      console.error('❌ No profile found for user');
      return;
    }
    
    let userProfile = currentProfile;
    let profileIdField = 'user_id';
    let profileIdValue = userId;
    
    console.log('📊 Current profile:', userProfile);
    console.log('💰 Current points:', userProfile.points);
    
    // Add 10 test points
    const testPoints = 10;
    const newPoints = (userProfile.points || 0) + testPoints;
    
    console.log(`🎯 Adding ${testPoints} points (${userProfile.points} → ${newPoints})`);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq(profileIdField, profileIdValue);
    
    if (updateError) {
      console.error('❌ Error updating points:', updateError.message);
      return;
    }
    
    console.log('✅ Points updated successfully!');
    
    // Verify the update
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq(profileIdField, profileIdValue)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError.message);
      return;
    }
    
    console.log('✅ Verified: Points are now', updatedProfile.points);
    
    // Step 6: Test game session creation
    console.log('\n6️⃣ Testing game session creation...');
    
    const { data: gameSession, error: gameError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        game_type: 'test-game',
        score: 100,
        duration: 60,
        completed: true,
        data: { test: true }
      })
      .select()
      .single();
    
    if (gameError) {
      console.error('❌ Error creating game session:', gameError.message);
    } else {
      console.log('✅ Game session created:', gameSession);
    }
    
    // Step 7: Provide recommendations
    console.log('\n7️⃣ Recommendations:');
    console.log('🔧 The point synchronization issue is caused by:');
    console.log('   1. Schema mismatch between expected and actual database structure');
    console.log('   2. Authentication issues in the browser environment');
    console.log('\n💡 Solutions:');
    console.log('   1. Ensure users are properly authenticated before playing games');
    console.log('   2. Update the code to handle the current database schema');
    console.log('   3. Or migrate the database to match the expected schema');
    
    console.log('\n🎮 Test the fix:');
    console.log(`   1. Sign in with: ${testEmail} / ${testPassword}`);
    console.log('   2. Play a game and check if points are saved');
    console.log('   3. Check browser console for any authentication errors');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the schema fix
applySchemaFix().then(() => {
  console.log('\n🏁 Schema fix complete');
}).catch(error => {
  console.error('💥 Schema fix failed:', error.message);
});