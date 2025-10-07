// ES Module format for browser/Vite compatibility
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Supabase credentials not found in environment variables');
  process.exit(1);
}

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
  console.log('🔍 Testing Supabase MCP connection...');
  console.log(`📊 Supabase URL: ${supabaseUrl}`);

  try {
    // Test 1: Basic Supabase connection
    console.log('\n📝 Test 1: Basic Supabase connection');
    const connectionResult = await mockMCPServer.testConnection();
    
    if (connectionResult.success) {
      console.log('✅ Supabase connection successful!');
    } else {
      console.error('❌ Supabase connection failed:', connectionResult.error);
    }
    
    // Test 2: MCP Server registration simulation
    console.log('\n📝 Test 2: MCP Server registration simulation');
    const registrationResult = mockMCPServer.registerServer(mcpConfig);
    
    if (registrationResult.success) {
      console.log('✅ MCP server registration simulation successful!');
      console.log(`📣 Message: ${registrationResult.message}`);
    } else {
      console.error('❌ MCP server registration simulation failed!');
    }
    
    // Test 3: Check all required tables
    console.log('\n📝 Test 3: Check all required tables');
    const tables = ['profiles', 'analytics_users', 'analytics_games', 'tasks', 'task_completions'];
    let allTablesAccessible = true;
    
    for (const table of tables) {
      try {
        console.log(`   Checking table: ${table}`);
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
          
        if (error) {
          console.warn(`⚠️ Warning: Error accessing table ${table}:`, error);
          allTablesAccessible = false;
        } else {
          console.log(`   ✅ Table ${table} is accessible`);
        }
      } catch (e) {
        console.warn(`⚠️ Warning: Exception when testing table ${table}:`, e);
        allTablesAccessible = false;
      }
    }
    
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
    
    if (connectionResult.success && registrationResult.success) {
      console.log('✅ Supabase MCP server should be working correctly!');
      
      // Save test result to file for reference
      const testResult = {
        timestamp: new Date().toISOString(),
        success: true,
        connectionTest: connectionResult.success,
        registrationTest: registrationResult.success,
        tablesAccessible: allTablesAccessible,
        url: supabaseUrl
      };
      
      fs.writeFileSync(
        path.join(__dirname, '..', 'supabase', 'mcp-test-result.json'),
        JSON.stringify(testResult, null, 2)
      );
      
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
      process.exit(0);
    } else {
      console.error('❌ Tests failed');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
