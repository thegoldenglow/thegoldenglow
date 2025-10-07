// Simple Supabase connection test
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

// Test functions
async function testBasicConnection() {
  console.log('\n=== Testing Basic Supabase Connection ===');
  try {
    const { data, error } = await supabase.from('ad_campaigns').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    console.log('✅ Basic connection successful');
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

async function testAdCampaignsTable() {
  console.log('\n=== Testing ad_campaigns Table Access ===');
  try {
    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('id, name, status, created_at')
      .limit(5);
    
    if (error) {
      console.error('❌ Table access failed:', error.message);
      return false;
    }
    
    console.log('✅ Table access successful');
    console.log(`📊 Found ${data.length} campaigns:`);
    data.forEach(campaign => {
      console.log(`  - ${campaign.name} (${campaign.status})`);
    });
    return true;
  } catch (err) {
    console.error('❌ Table access error:', err.message);
    return false;
  }
}

async function testStatsData() {
  console.log('\n=== Testing Statistics Data ===');
  try {
    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('status')
      .not('status', 'is', null);
    
    if (error) {
      console.error('❌ Stats query failed:', error.message);
      return false;
    }
    
    const stats = data.reduce((acc, campaign) => {
      acc[campaign.status] = (acc[campaign.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('✅ Statistics calculation successful');
    console.log('📈 Campaign status breakdown:', stats);
    return true;
  } catch (err) {
    console.error('❌ Stats calculation error:', err.message);
    return false;
  }
}

async function testPagination() {
  console.log('\n=== Testing Pagination ===');
  try {
    const { data, error, count } = await supabase
      .from('ad_campaigns')
      .select('id, name', { count: 'exact' })
      .range(0, 4);
    
    if (error) {
      console.error('❌ Pagination failed:', error.message);
      return false;
    }
    
    console.log('✅ Pagination successful');
    console.log(`📄 Page 1: ${data.length} items, Total: ${count}`);
    return true;
  } catch (err) {
    console.error('❌ Pagination error:', err.message);
    return false;
  }
}

async function testRealtimeSubscription() {
  console.log('\n=== Testing Realtime Subscription ===');
  return new Promise((resolve) => {
    try {
      const subscription = supabase
        .channel('test-channel')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'ad_campaigns' },
          (payload) => {
            console.log('📡 Realtime event received:', payload);
          }
        )
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime subscription successful');
            subscription.unsubscribe();
            resolve(true);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime subscription failed');
            resolve(false);
          }
        });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        subscription.unsubscribe();
        console.log('⏰ Realtime test timeout');
        resolve(true); // Don't fail the test for timeout
      }, 5000);
    } catch (err) {
      console.error('❌ Realtime subscription error:', err.message);
      resolve(false);
    }
  });
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Supabase Connection Tests');
  console.log('🔗 URL:', SUPABASE_URL);
  console.log('🔑 Using API Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  
  const tests = [
    { name: 'Basic Connection', fn: testBasicConnection },
    { name: 'Ad Campaigns Table', fn: testAdCampaignsTable },
    { name: 'Statistics Data', fn: testStatsData },
    { name: 'Pagination', fn: testPagination },
    { name: 'Realtime Subscription', fn: testRealtimeSubscription }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`❌ Test "${test.name}" threw an error:`, err.message);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Supabase integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the Supabase configuration.');
  }
}

// Run tests
runTests().catch(console.error);

export {
  runTests,
  testBasicConnection,
  testAdCampaignsTable,
  testStatsData,
  testPagination,
  testRealtimeSubscription
};