// Test script to debug ad campaign deletion issues
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Mock fetch for Node.js environment
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

// Test configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://luzpkuypmyidaluitvzh.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1enBrdXlwbXlpZGFsdWl0dnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDM4NDIsImV4cCI6MjA2MjI3OTg0Mn0.D4am_bzy02Ve5iEETJfSapppTc9g5uD5UTLCv7KqXd0';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCampaignOperations() {
  console.log('🔍 Testing Ad Campaign Operations');
  console.log('🔗 URL:', SUPABASE_URL);
  console.log('🔑 Using API Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  
  try {
    // Test 1: List all campaigns
    console.log('\n=== Test 1: Fetching Campaigns ===');
    const { data: campaigns, error: fetchError } = await supabase
      .from('ad_campaigns')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching campaigns:', fetchError);
      return;
    }
    
    console.log('✅ Successfully fetched campaigns:');
    campaigns.forEach(campaign => {
      console.log(`  - ID: ${campaign.id}, Name: "${campaign.name}", Status: ${campaign.status}`);
    });
    
    if (campaigns.length === 0) {
      console.log('⚠️ No campaigns found to test deletion');
      return;
    }
    
    // Test 2: Check RLS policies by attempting to delete
    console.log('\n=== Test 2: Testing Delete Permissions ===');
    const testCampaign = campaigns[campaigns.length - 1]; // Use last campaign for testing
    console.log(`🎯 Testing deletion of campaign: "${testCampaign.name}" (ID: ${testCampaign.id})`);
    
    // First, let's check what role we're using
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.log('⚠️ No authenticated user found, using anonymous access');
    } else {
      console.log('👤 Authenticated user:', user?.email || 'Unknown');
    }
    
    // Test 3: Attempt deletion
    console.log('\n=== Test 3: Attempting Deletion ===');
    const { error: deleteError } = await supabase
      .from('ad_campaigns')
      .delete()
      .eq('id', testCampaign.id);
    
    if (deleteError) {
      console.error('❌ Delete operation failed:', deleteError);
      console.log('🔍 Error details:');
      console.log('  - Message:', deleteError.message);
      console.log('  - Code:', deleteError.code);
      console.log('  - Details:', deleteError.details);
      console.log('  - Hint:', deleteError.hint);
      
      // Check if it's an RLS policy issue
      if (deleteError.code === 'PGRST116' || deleteError.message.includes('policy')) {
        console.log('\n🛡️ This appears to be a Row Level Security (RLS) policy issue.');
        console.log('💡 Possible solutions:');
        console.log('  1. The user needs to be authenticated');
        console.log('  2. The RLS policy for DELETE operations may be too restrictive');
        console.log('  3. The user role may not have sufficient permissions');
      }
    } else {
      console.log('✅ Delete operation successful!');
      console.log('🔄 Verifying deletion...');
      
      // Verify the campaign was actually deleted
      const { data: verifyData, error: verifyError } = await supabase
        .from('ad_campaigns')
        .select('id')
        .eq('id', testCampaign.id);
      
      if (verifyError) {
        console.error('❌ Error verifying deletion:', verifyError);
      } else if (verifyData.length === 0) {
        console.log('✅ Campaign successfully deleted from database');
      } else {
        console.log('⚠️ Campaign still exists in database after delete operation');
      }
    }
    
    // Test 4: Check current RLS policies
    console.log('\n=== Test 4: Checking RLS Policies ===');
    try {
      const { data: policies, error: policyError } = await supabase
        .rpc('get_policies', { table_name: 'ad_campaigns' })
        .single();
      
      if (policyError) {
        console.log('⚠️ Could not fetch RLS policies (this is normal for anonymous users)');
      } else {
        console.log('📋 RLS Policies:', policies);
      }
    } catch (err) {
      console.log('⚠️ RLS policy check not available');
    }
    
  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

// Test 5: Create a test campaign and try to delete it
async function testCreateAndDelete() {
  console.log('\n=== Test 5: Create and Delete Test Campaign ===');
  
  try {
    // Create a test campaign
    const testCampaignData = {
      name: 'Test Campaign for Deletion',
      description: 'This is a test campaign created to test deletion functionality',
      status: 'Draft',
      target: 'Test Users',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    };
    
    console.log('📝 Creating test campaign...');
    const { data: newCampaign, error: createError } = await supabase
      .from('ad_campaigns')
      .insert(testCampaignData)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Failed to create test campaign:', createError);
      return;
    }
    
    console.log('✅ Test campaign created:', newCampaign.name, '(ID:', newCampaign.id, ')');
    
    // Now try to delete it
    console.log('🗑️ Attempting to delete test campaign...');
    const { error: deleteError } = await supabase
      .from('ad_campaigns')
      .delete()
      .eq('id', newCampaign.id);
    
    if (deleteError) {
      console.error('❌ Failed to delete test campaign:', deleteError);
    } else {
      console.log('✅ Test campaign deleted successfully!');
    }
    
  } catch (err) {
    console.error('💥 Error in create and delete test:', err);
  }
}

// Main test runner
async function runDeleteTests() {
  console.log('🚀 Starting Ad Campaign Delete Functionality Tests');
  console.log('=' .repeat(60));
  
  await testCampaignOperations();
  await testCreateAndDelete();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Delete functionality tests completed');
  console.log('\n💡 If delete operations are failing:');
  console.log('  1. Check if the user is properly authenticated in the frontend');
  console.log('  2. Verify RLS policies allow DELETE operations');
  console.log('  3. Check browser console for additional error details');
  console.log('  4. Ensure the campaign ID being passed is correct');
}

// Run the tests
runDeleteTests().catch(console.error);

export { runDeleteTests, testCampaignOperations, testCreateAndDelete };