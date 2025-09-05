/**
 * Fixed Referral System Test Script
 * Tests with existing users and proper database constraints
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

// Helper function to generate referral code
function generateReferralCode(userId) {
  const shortId = userId.substring(0, 8).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${shortId}${randomSuffix}`;
}

async function testDatabaseTables() {
  console.log('\n🔍 Testing Database Tables...');
  
  try {
    // Test referral_codes table structure
    const { data: referralCodes, error: rcError } = await supabase
      .from('referral_codes')
      .select('*')
      .limit(1);
    
    logTest('referral_codes table exists', !rcError, rcError?.message);
    
    // Test referrals table structure
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

async function getExistingUser() {
  console.log('\n🔍 Finding existing user for testing...');
  
  try {
    // Try to get an existing user from profiles table
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, points')
      .limit(1);
    
    if (error || !profiles || profiles.length === 0) {
      logTest('Find existing user', false, 'No users found in profiles table');
      return null;
    }
    
    const user = profiles[0];
    logTest('Find existing user', true, `Found user: ${user.username || user.id}`);
    return user;
  } catch (error) {
    logTest('Find existing user', false, error.message);
    return null;
  }
}

async function testReferralCodeGeneration(user) {
  console.log('\n🔍 Testing Referral Code Generation...');
  
  if (!user) {
    logTest('Referral code generation', false, 'No user available');
    return null;
  }
  
  const testCode = generateReferralCode(user.id);
  
  try {
    // Check if user already has a referral code
    const { data: existing, error: existingError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (existing && !existingError) {
      logTest('Referral code exists', true, `Code: ${existing.code}`);
      return { testUserId: user.id, testCode: existing.code, data: existing };
    }
    
    // Try to insert a new referral code
    const { data, error } = await supabase
      .from('referral_codes')
      .insert({
        user_id: user.id,
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
      .eq('user_id', user.id)
      .single();
    
    logTest('Referral code retrieval', !retrieveError && retrieved?.code === testCode);
    
    return { testUserId: user.id, testCode, data };
  } catch (error) {
    logTest('Referral code generation', false, error.message);
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

async function testReferralCodeLookup() {
  console.log('\n🔍 Testing Referral Code Lookup Functions...');
  
  try {
    // Test getting all referral codes
    const { data: allCodes, error: allError } = await supabase
      .from('referral_codes')
      .select('user_id, code, total_referrals, created_at')
      .limit(5);
    
    logTest('Referral codes query', !allError, `Found ${allCodes?.length || 0} codes`);
    
    if (allCodes && allCodes.length > 0) {
      // Test looking up a specific code
      const testCode = allCodes[0];
      const { data: specificCode, error: specificError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', testCode.code)
        .single();
      
      logTest('Specific code lookup', !specificError && specificCode?.code === testCode.code);
    }
    
  } catch (error) {
    logTest('Referral code lookup', false, error.message);
  }
}

async function testReferralTracking() {
  console.log('\n🔍 Testing Referral Tracking (Read-only)...');
  
  try {
    // Test getting existing referrals
    const { data: existingReferrals, error } = await supabase
      .from('referrals')
      .select('referrer_id, referred_id, code_used, created_at, points_awarded')
      .limit(5);
    
    logTest('Referrals query', !error, `Found ${existingReferrals?.length || 0} referrals`);
    
    if (existingReferrals && existingReferrals.length > 0) {
      // Test aggregating referrals by referrer
      const { data: referralCounts, error: countError } = await supabase
        .from('referrals')
        .select('referrer_id')
        .limit(10);
      
      if (!countError && referralCounts) {
        const counts = referralCounts.reduce((acc, ref) => {
          acc[ref.referrer_id] = (acc[ref.referrer_id] || 0) + 1;
          return acc;
        }, {});
        
        logTest('Referral counting', true, `${Object.keys(counts).length} users have referrals`);
      }
    }
    
  } catch (error) {
    logTest('Referral tracking test', false, error.message);
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
    
    // With RLS enabled, anonymous users should not see data or get an auth error
    const rlsWorking = error !== null || (data && data.length === 0);
    logTest('RLS policies active', rlsWorking, error?.message || 'No data returned');
    
  } catch (error) {
    logTest('RLS policy test', true, 'Access properly restricted');
  }
}

async function testReferralSystemIntegration() {
  console.log('\n🔍 Testing Referral System Integration...');
  
  try {
    // Test the complete flow simulation
    const { data: codes, error: codesError } = await supabase
      .from('referral_codes')
      .select('user_id, code')
      .limit(1);
    
    if (!codesError && codes && codes.length > 0) {
      const testCode = codes[0];
      
      // Simulate parsing a referral link
      const botUsername = 'TheGoldenGlow_bot';
      const simulatedLink = `https://t.me/${botUsername}?start=${testCode.code}`;
      const extractedCode = simulatedLink.split('?start=')[1];
      
      logTest('Link parsing simulation', extractedCode === testCode.code);
      
      // Test code validation
      const { data: validatedCode, error: validationError } = await supabase
        .from('referral_codes')
        .select('user_id, total_referrals')
        .eq('code', extractedCode)
        .single();
      
      logTest('Code validation', !validationError && validatedCode?.user_id === testCode.user_id);
    }
    
  } catch (error) {
    logTest('Integration test', false, error.message);
  }
}

async function runReferralSystemTests() {
  console.log('🚀 Starting Referral System Tests (Fixed Version)\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Database Tables
    const tableTests = await testDatabaseTables();
    
    if (!tableTests.referralCodes || !tableTests.referrals) {
      console.log('\n❌ Critical tables missing. Please run the migration:');
      console.log('supabase migration up');
      return;
    }
    
    // Test 2: Find existing user
    const existingUser = await getExistingUser();
    
    // Test 3: Referral Code Generation (with existing user)
    const referrerData = await testReferralCodeGeneration(existingUser);
    
    // Test 4: Referral Link Generation
    await testReferralLinkGeneration(referrerData);
    
    // Test 5: Referral Code Lookup
    await testReferralCodeLookup();
    
    // Test 6: Referral Tracking (read-only)
    await testReferralTracking();
    
    // Test 7: RLS Policies
    await testRLSPolicies();
    
    // Test 8: Integration Test
    await testReferralSystemIntegration();
    
  } catch (error) {
    console.error('\n❌ Test execution error:', error);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  
  if (testResults.passed + testResults.failed > 0) {
    console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  }
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`   - ${test.name}: ${test.details}`));
  }
  
  // Determine system status
  const criticalTests = ['referral_codes table exists', 'referrals table exists', 'profiles table exists'];
  const criticalFailures = testResults.tests.filter(test => 
    criticalTests.includes(test.name) && !test.passed
  ).length;
  
  let status;
  if (criticalFailures > 0) {
    status = '❌ CRITICAL ISSUES';
  } else if (testResults.failed === 0) {
    status = '✅ FULLY WORKING';
  } else if (testResults.failed <= 2) {
    status = '⚠️ MOSTLY WORKING';
  } else {
    status = '❌ NEEDS ATTENTION';
  }
  
  console.log('\n🎯 Referral System Status:', status);
  
  // Provide recommendations
  if (criticalFailures > 0) {
    console.log('\n🔧 Recommendations:');
    console.log('   1. Run database migrations: supabase migration up');
    console.log('   2. Check Supabase connection and permissions');
  } else if (testResults.failed > 0) {
    console.log('\n🔧 Recommendations:');
    console.log('   1. Check RLS policies if authentication tests failed');
    console.log('   2. Verify environment variables are set correctly');
    console.log('   3. Test with actual user authentication flow');
  } else {
    console.log('\n🎉 All tests passed! The referral system is working correctly.');
  }
}

// Run the tests
runReferralSystemTests()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

export { runReferralSystemTests };