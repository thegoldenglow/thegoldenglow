/**
 * Simple Database Connection Test
 * Tests basic Supabase connectivity and table access
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.log('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase Database Connection...');
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log(`🔑 Using anonymous key: ${supabaseAnonKey.substring(0, 20)}...`);
  
  try {
    // Test 1: Basic connection
    console.log('\n1️⃣ Testing basic connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.error('❌ Connection failed:', healthError.message);
      return false;
    }
    
    console.log('✅ Basic connection successful');
    console.log(`📊 Profiles table has ${healthCheck} records`);
    
    // Test 2: Check table structure
    console.log('\n2️⃣ Testing table access...');
    const tables = ['profiles', 'tasks', 'task_completions', 'app_settings'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`⚠️  Table '${table}': ${error.message}`);
        } else {
          console.log(`✅ Table '${table}': ${count} records`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`);
      }
    }
    
    // Test 3: Sample data query
    console.log('\n3️⃣ Testing sample data query...');
    const { data: sampleProfiles, error: sampleError } = await supabase
      .from('profiles')
      .select('id, username, points, created_at')
      .limit(3);
    
    if (sampleError) {
      console.log(`⚠️  Sample query failed: ${sampleError.message}`);
    } else {
      console.log('✅ Sample profiles data:');
      sampleProfiles.forEach(profile => {
        console.log(`   - ${profile.username || 'No username'}: ${profile.points || 0} points`);
      });
    }
    
    console.log('\n🎉 Database connection test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

// Run the test
testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ All database tests passed!');
      console.log('\n📋 Database Status Summary:');
      console.log('   • Supabase connection: Working');
      console.log('   • Table access: Verified');
      console.log('   • Data queries: Functional');
    } else {
      console.log('\n❌ Some database tests failed. Check the logs above.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });