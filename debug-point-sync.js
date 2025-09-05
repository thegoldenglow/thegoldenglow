/**
 * Debug Point Synchronization Issue
 * This script tests the point saving functionality
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugPointSync() {
  console.log('🔍 Debugging Point Synchronization...');
  
  try {
    // Test 1: Check if we can connect to profiles table
    console.log('\n1️⃣ Testing profiles table access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Cannot access profiles table:', profilesError.message);
      return;
    }
    
    console.log('✅ Profiles table accessible');
    console.log('📊 Sample profiles:', profiles);
    
    // Test 2: Check if we can access game_sessions table
    console.log('\n2️⃣ Testing game_sessions table access...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('game_sessions')
      .select('id, user_id, game_type, score')
      .limit(5);
    
    if (sessionsError) {
      console.error('❌ Cannot access game_sessions table:', sessionsError.message);
      return;
    }
    
    console.log('✅ Game sessions table accessible');
    console.log('📊 Sample sessions:', sessions);
    
    // Test 3: Check authentication status
    console.log('\n3️⃣ Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️ No authenticated user (this is normal for server-side testing)');
      console.log('🔍 Auth error:', authError.message);
    } else if (user) {
      console.log('✅ User authenticated:', user.id);
    } else {
      console.log('ℹ️ No user session found');
    }
    
    // Test 4: Simulate the saveGameScoreAndUpdatePoints function logic
    console.log('\n4️⃣ Testing point update logic (simulation)...');
    
    if (!user) {
      console.log('⚠️ Cannot test point updates without authenticated user');
      console.log('💡 This explains why points are not being saved!');
      console.log('🔧 Solution: Ensure user is properly authenticated before playing games');
      return;
    }
    
    // If we have a user, test the point update
    const testPointsToAdd = 10;
    console.log(`🎯 Attempting to add ${testPointsToAdd} points to user ${user.id}`);
    
    // Get current points
    const { data: currentProfile, error: getCurrentError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single();
    
    if (getCurrentError) {
      console.error('❌ Cannot get current user profile:', getCurrentError.message);
      return;
    }
    
    const currentPoints = currentProfile?.points || 0;
    const newPoints = currentPoints + testPointsToAdd;
    
    console.log(`📊 Current points: ${currentPoints}`);
    console.log(`📊 New points will be: ${newPoints}`);
    
    // Update points
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('❌ Failed to update points:', updateError.message);
      return;
    }
    
    console.log('✅ Points updated successfully in database!');
    
    // Verify the update
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Cannot verify update:', verifyError.message);
      return;
    }
    
    console.log(`✅ Verified: Points are now ${updatedProfile.points}`);
    
    // Test the event dispatch mechanism
    console.log('\n5️⃣ Testing event dispatch mechanism...');
    console.log('🔧 In browser environment, this would dispatch userDataUpdated event');
    console.log('🔧 UserContext should listen for this event and update the UI');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the debug
debugPointSync().then(() => {
  console.log('\n🏁 Debug complete');
}).catch(error => {
  console.error('💥 Debug failed:', error.message);
});