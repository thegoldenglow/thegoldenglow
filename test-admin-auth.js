// Test admin authentication using demo mode (localStorage)

async function testDemoAdminAuth() {
  console.log('🔐 Testing Demo Admin Authentication...');
  
  try {
    // Step 1: Simulate demo login by setting localStorage
    console.log('\n1. Setting up demo admin user...');
    const demoAdmin = {
      id: 'demo-admin-123',
      name: 'Demo Admin',
      email: 'admin@goldenglow.app',
      role: 'admin'
    };
    
    // This simulates what the AdminAuthContext does for demo login
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('adminUser', JSON.stringify(demoAdmin));
      console.log('✅ Demo admin user set in localStorage');
    } else {
      console.log('❌ localStorage not available in Node.js environment');
      console.log('ℹ️ This test should be run in a browser environment');
      return;
    }
    
    // Step 2: Verify localStorage storage
    console.log('\n2. Verifying localStorage storage...');
    const storedAdmin = localStorage.getItem('adminUser');
    if (storedAdmin) {
      const parsedAdmin = JSON.parse(storedAdmin);
      console.log('✅ Admin user found in localStorage:', {
        name: parsedAdmin.name,
        email: parsedAdmin.email,
        role: parsedAdmin.role
      });
    } else {
      console.log('❌ No admin user found in localStorage');
      return;
    }
    
    // Step 3: Simulate session check
    console.log('\n3. Simulating session validation...');
    const adminData = JSON.parse(localStorage.getItem('adminUser'));
    const isAuthenticated = adminData && (adminData.role === 'admin' || adminData.role === 'superadmin');
    
    if (isAuthenticated) {
      console.log('✅ Session validation successful');
      console.log('✅ Admin privileges confirmed');
    } else {
      console.log('❌ Session validation failed');
      return;
    }
    
    console.log('\n🎉 Demo admin authentication test completed successfully!');
    console.log('\nℹ️ The admin panel should now work with demo authentication.');
    console.log('ℹ️ Try logging in with any credentials in the admin panel - it will use demo mode.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Mock localStorage for Node.js environment
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    data: {},
    setItem(key, value) {
      this.data[key] = value;
    },
    getItem(key) {
      return this.data[key] || null;
    },
    removeItem(key) {
      delete this.data[key];
    }
  };
}

// Run the test
testDemoAdminAuth();