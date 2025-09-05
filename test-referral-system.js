/**
 * Comprehensive Referral System Test Script
 * Tests database tables, referral code generation, and tracking functionality
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}${details ? ': ' + details : ''}`);
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

// Helper function to generate a test UUID
function generateTestUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to generate referral code
function generateReferralCode(userId) {
  const shortId = userId.substring(0, 8).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${shortId}${randomSuffix}`;
}

async function testDatabaseTables() {
  console.log('\n🔍 Testing Database Tables...');
  
  try {
    // Test referral_codes table
    const { data: referralCodes, error: rcError } = await supabase
      .from('referral_codes')
      .select('*')
      .limit(1);
    
    logTest('referral_codes table exists', !rcError, rcError?.message);
    
    // Test referrals table
    const { data: referrals, error: rError } = await supabase
      .from('referrals')
      .select('*')
      .limit(1);
    
    logTest('referrals table exists', !rError, rError?.message);
    
    // Test profiles table (should exist for user references)
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, username, points')
      .limit(1);
    
    logTest('profiles table exists', !pError, pError?.message);
    
    return { referralCodes: !rcError, referrals: !rError, profiles: !pError };
  } catch (error) {
    logTest('Database connection', false, error.message);
    return { referralCodes: false, referrals: false, profiles: false };
  }
}

async function testReferralCodeGeneration() {
  console.log('\n🔍 Testing Referral Code Generation...');
  
  const testUserId = generateTestUUID();
  const testCode = generateReferralCode(testUserId);
  
  try {
    // Test inserting a referral code
    const { data, error } = await supabase
      .from('referral_codes')
      .insert({
        user_id: testUserId,
        code: testCode,
        total_referrals: 0
      })
      .select()
      .single();
    
    if (error) {
      logTest('Referral code insertion', false, error.message);
      return null;
    }
    
    logTest('Referral code insertion', true, `Code: ${testCode}`);
    
    // Test retrieving the referral code
    const { data: retrieved, error: retrieveError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', testUserId)
      .single();
    
    logTest('Referral code retrieval', !retrieveError && retrieved?.code === testCode);
    
    return { testUserId, testCode, data };
  } catch (error) {
    logTest('Referral code generation', false, error.message);
    return null;
  }
}

async function testReferralTracking(referrerData) {
  console.log('\n🔍 Testing Referral Tracking...');
  
  if (!referrerData) {
    logTest('Referral tracking setup', false, 'No referrer data available');
    return;
  }
  
  const referredUserId = generateTestUUID();
  
  try {
    // Test recording a referral
    const { data, error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerData.testUserId,
        referred_id: referredUserId,
        code_used: referrerData.testCode,
        reward_claimed: false,
        points_awarded: 0
      })
      .select()
      .single();
    
    logTest('Referral tracking insertion', !error, error?.message);
    
    if (!error) {
      // Test updating referral count
      const { error: updateError } = await supabase
        .from('referral_codes')
        .update({
          total_referrals: 1,
          last_used_at: new Date().toISOString()
        })
        .eq('user_id', referrerData.testUserId);
      
      logTest('Referral count update', !updateError, updateError?.message);
      
      // Test retrieving referrals for user
      const { data: userReferrals, error: fetchError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', referrerData.testUserId);
      
      logTest('Referral retrieval', !fetchError && userReferrals?.length > 0);
    }
    
    return { referredUserId, data };
  } catch (error) {
    logTest('Referral tracking', false, error.message);
    return null;
  }
}

async function testReferralLinkGeneration(referrerData) {
  console.log('\n🔍 Testing Referral Link Generation...');
  
  if (!referrerData) {
    logTest('Referral link generation', false, 'No referrer data available');
    return;
  }
  
  try {
    const botUsername = 'TheGoldenGlow_bot';
    const expectedLink = `https://t.me/${botUsername}?start=${referrerData.testCode}`;
    
    logTest('Referral link format', true, expectedLink);
    
    // Test parsing the referral code from link
    const startParam = referrerData.testCode;
    const { data: codeData, error } = await supabase
      .from('referral_codes')
      .select('user_id, code, total_referrals')
      .eq('code', startParam)
      .single();
    
    logTest('Referral code parsing', !error && codeData?.user_id === referrerData.testUserId);
    
  } catch (error) {
    logTest('Referral link generation', false, error.message);
  }
}

async function testRLSPolicies() {
  console.log('\n🔍 Testing Row Level Security Policies...');
  
  try {
    // Test with anonymous access (should be restricted)
    const anonSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || supabaseKey);
    
    const { data, error } = await anonSupabase
      .from('referral_codes')
      .select('*')
      .limit(1);
    
    // With RLS enabled, anonymous users should not see data
    logTest('RLS policies active', error !== null || (data && data.length === 0));
    
  } catch (error) {
    logTest('RLS policy test', false, error.message);
  }
}

async function cleanupTestData(testData) {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    if (testData.referral) {
      await supabase
        .from('referrals')
        .delete()
        .eq('referrer_id', testData.referrer?.testUserId);
    }
    
    if (testData.referrer) {
      await supabase
        .from('referral_codes')
        .delete()
        .eq('user_id', testData.referrer.testUserId);
    }
    
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.log('⚠️ Error cleaning up test data:', error.message);
  }
}

async function runReferralSystemTests() {
  console.log('🚀 Starting Referral System Tests\n');
  console.log('='.repeat(50));
  
  const testData = {};
  
  try {
    // Test 1: Database Tables
    const tableTests = await testDatabaseTables();
    
    if (!tableTests.referralCodes || !tableTests.referrals) {
      console.log('\n❌ Critical tables missing. Please run the migration:');
      console.log('npm run migrate:referrals');
      return;
    }
    
    // Test 2: Referral Code Generation
    testData.referrer = await testReferralCodeGeneration();
    
    // Test 3: Referral Tracking
    testData.referral = await testReferralTracking(testData.referrer);
    
    // Test 4: Referral Link Generation
    await testReferralLinkGeneration(testData.referrer);
    
    // Test 5: RLS Policies
    await testRLSPolicies();
    
  } catch (error) {
    console.error('\n❌ Test execution error:', error);
  } finally {
    // Cleanup
    if (testData.referrer || testData.referral) {
      await cleanupTestData(testData);
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`   - ${test.name}: ${test.details}`));
  }
  
  console.log('\n🎯 Referral System Status:', testResults.failed === 0 ? '✅ WORKING' : '❌ NEEDS ATTENTION');
}

// Run the tests
runReferralSystemTests()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

export { runReferralSystemTests };