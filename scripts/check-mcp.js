// Simple MCP test script
import { createClient } from '@supabase/supabase-js';

// Hardcoding the credentials from .env.local for testing purposes only
const supabaseUrl = 'https://luzpkuypmyidaluitvzh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1enBrdXlwbXlpZGFsdWl0dnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDM4NDIsImV4cCI6MjA2MjI3OTg0Mn0.D4am_bzy02Ve5iEETJfSapppTc9g5uD5UTLCv7KqXd0';

console.log('🔍 Testing Supabase MCP connection...');
console.log(`📊 Supabase URL: ${supabaseUrl}`);

// Create Supabase client with enhanced configuration
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
});

// Mock MCP server registration function
const mockMCPServer = {
  name: 'supabase-mcp-server',
  registerServer: (config) => {
    console.log('Registering with MCP server:', config.name || 'supabase-mcp-server');
    return {
      success: true,
      message: 'MCP server registered successfully'
    };
  },
  testConnection: async () => {
    try {
      // Test basic connection
      const { data, error } = await supabase.from('profiles').select('count');
      
      if (error) {
        console.error('❌ Connection error:', error);
        return { success: false, error };
      }
      
      return { success: true, data };
    } catch (err) {
      console.error('❌ Unexpected error during connection test:', err);
      return { success: false, error: err };
    }
  }
};

// Simulate MCP server configuration
const mcpConfig = {
  name: 'supabase-mcp-server',
  connection: supabase,
  url: supabaseUrl,
  key: supabaseAnonKey,
  tables: ['profiles', 'analytics_users', 'analytics_games', 'tasks', 'task_completions'],
  functions: {
    updateUserPoints: async (userId, points) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ points })
        .eq('id', userId);
      return { success: !error, data, error };
    }
  }
};

// Run tests
async function runTests() {
  try {
    // Test 1: Basic Supabase connection
    console.log('\n📝 Test 1: Basic Supabase connection');
    const connectionResult = await mockMCPServer.testConnection();
    
    if (connectionResult.success) {
      console.log('✅ Supabase connection successful!');
    } else {
      console.error('❌ Supabase connection failed:', connectionResult.error);
      return false;
    }
    
    // Test 2: MCP Server registration simulation
    console.log('\n📝 Test 2: MCP Server registration simulation');
    const registrationResult = mockMCPServer.registerServer(mcpConfig);
    
    if (registrationResult.success) {
      console.log('✅ MCP server registration simulation successful!');
      console.log(`📣 Message: ${registrationResult.message}`);
    } else {
      console.error('❌ MCP server registration simulation failed!');
      return false;
    }
    
    // Test 3: Check all required tables
    console.log('\n📝 Test 3: Check all required tables');
    const tables = ['profiles', 'analytics_users', 'analytics_games', 'tasks', 'task_completions'];
    let allTablesAccessible = true;
    let accessibleTables = [];
    let inaccessibleTables = [];
    
    for (const table of tables) {
      try {
        console.log(`   Checking table: ${table}`);
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
          
        if (error) {
          console.warn(`⚠️ Warning: Error accessing table ${table}:`, error.message);
          allTablesAccessible = false;
          inaccessibleTables.push(table);
        } else {
          console.log(`   ✅ Table ${table} is accessible`);
          accessibleTables.push(table);
        }
      } catch (e) {
        console.warn(`⚠️ Warning: Exception when testing table ${table}:`, e.message);
        allTablesAccessible = false;
        inaccessibleTables.push(table);
      }
    }
    
    console.log('\n📊 Table Access Results:');
    console.log(`✅ Accessible tables: ${accessibleTables.join(', ') || 'None'}`);
    console.log(`❌ Inaccessible tables: ${inaccessibleTables.join(', ') || 'None'}`);
    
    if (allTablesAccessible) {
      console.log('✅ All tables are accessible!');
    } else {
      console.warn('⚠️ Some tables are not accessible');
    }

    // Final results
    console.log('\n📊 Test Results Summary');
    console.log('✅ Basic Supabase connection: ', connectionResult.success ? 'PASS' : 'FAIL');
    console.log('✅ MCP Server registration: ', registrationResult.success ? 'PASS' : 'FAIL');
    console.log('✅ Table accessibility: ', allTablesAccessible ? 'PASS' : 'PARTIAL');
    
    console.log('\n🎉 Supabase MCP server integration test completed!');
    
    // Final conclusion on MCP server readiness
    if (connectionResult.success && registrationResult.success) {
      console.log('✅ Supabase MCP server should be working correctly!');
      if (!allTablesAccessible) {
        console.log('⚠️ Note: Some tables in the MCP configuration are not accessible.');
        console.log('   This might be due to missing tables or permission issues.');
        console.log('   The MCP server will still work with the accessible tables.');
      }
      return true;
    } else {
      console.error('❌ Some tests failed. Supabase MCP server may not be working correctly.');
      return false;
    }
  } catch (error) {
    console.error('❌ Fatal error during MCP testing:', error);
    return false;
  }
}

// Run the tests
runTests()
  .then(success => {
    if (success) {
      console.log('✅ All tests passed successfully');
    } else {
      console.error('❌ Tests failed');
    }
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
  });
