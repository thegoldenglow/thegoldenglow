// Test file for Supabase frontend connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test functions
async function testBasicConnection() {
  console.log('\n=== Testing Basic Supabase Connection ===');
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Basic connection successful');
    return true;
  } catch (error) {
    console.error('❌ Basic connection failed:', error.message);
    return false;
  }
}

async function testAdCampaignsTable() {
  console.log('\n=== Testing Ad Campaigns Table ===');
  try {
    // Test table access
    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    
    console.log('✅ Ad campaigns table accessible');
    console.log(`📊 Found ${data.length} campaigns`);
    
    if (data.length > 0) {
      console.log('Sample campaign:', {
        id: data[0].id,
        name: data[0].name,
        status: data[0].status,
        created_at: data[0].created_at
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ad campaigns table test failed:', error.message);
    return false;
  }
}

async function testAdCampaignStats() {
  console.log('\n=== Testing Ad Campaign Statistics ===');
  try {
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('ad_campaigns')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    // Get status breakdown
    const { data: statusData, error: statusError } = await supabase
      .from('ad_campaigns')
      .select('status')
      .not('status', 'is', null);
    
    if (statusError) throw statusError;
    
    const statusCounts = statusData.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('✅ Campaign statistics retrieved');
    console.log(`📈 Total campaigns: ${totalCount}`);
    console.log('📊 Status breakdown:', statusCounts);
    
    return true;
  } catch (error) {
    console.error('❌ Campaign statistics test failed:', error.message);
    return false;
  }
}

async function testPagination() {
  console.log('\n=== Testing Pagination ===');
  try {
    const pageSize = 10;
    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .range(0, pageSize - 1);
    
    if (error) throw error;
    
    console.log('✅ Pagination test successful');
    console.log(`📄 Retrieved ${data.length} items (page size: ${pageSize})`);
    
    return true;
  } catch (error) {
    console.error('❌ Pagination test failed:', error.message);
    return false;
  }
}

async function testRealTimeSubscription() {
  console.log('\n=== Testing Real-time Subscription ===');
  return new Promise((resolve) => {
    try {
      const subscription = supabase
        .channel('ad_campaigns_test')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'ad_campaigns'
        }, (payload) => {
          console.log('📡 Real-time update received:', payload);
        })
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time subscription successful');
            subscription.unsubscribe();
            resolve(true);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.log('❌ Real-time subscription failed');
            resolve(false);
          }
        });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        subscription.unsubscribe();
        console.log('⏰ Real-time test timed out');
        resolve(false);
      }, 5000);
      
    } catch (error) {
      console.error('❌ Real-time subscription error:', error.message);
      resolve(false);
    }
  });
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Supabase Frontend Tests');
  console.log('=' .repeat(50));
  
  const results = {
    basicConnection: await testBasicConnection(),
    adCampaignsTable: await testAdCampaignsTable(),
    campaignStats: await testAdCampaignStats(),
    pagination: await testPagination(),
    realTime: await testRealTimeSubscription()
  };
  
  console.log('\n' + '=' .repeat(50));
  console.log('📋 TEST RESULTS SUMMARY');
  console.log('=' .repeat(50));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Supabase frontend is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testBasicConnection,
  testAdCampaignsTable,
  testAdCampaignStats,
  testPagination,
  testRealTimeSubscription,
  runAllTests
};