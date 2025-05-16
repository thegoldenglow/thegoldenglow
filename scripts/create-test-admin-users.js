// Test users data for admin view
const testUsers = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'Test User',
    email: 'testuser@example.com',
    telegram_id: '123456789',
    role: 'user',
    status: 'active',
    points: 100,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    updated_at: new Date().toISOString()
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    username: 'Admin User',
    email: 'admin@example.com',
    telegram_id: '987654321',
    role: 'admin',
    status: 'active',
    points: 500,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    updated_at: new Date().toISOString()
  },
  {
    id: '323e4567-e89b-12d3-a456-426614174002',
    username: 'Inactive User',
    email: 'inactive@example.com',
    telegram_id: '555555555',
    role: 'user',
    status: 'inactive',
    points: 50,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
    updated_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days ago
  },
  {
    id: '423e4567-e89b-12d3-a456-426614174003',
    username: 'VIP User',
    email: 'vip@example.com',
    telegram_id: '111222333',
    role: 'vip',
    status: 'active',
    points: 2500,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    updated_at: new Date().toISOString()
  },
  {
    id: '523e4567-e89b-12d3-a456-426614174004',
    username: 'Pending User',
    email: 'pending@example.com',
    telegram_id: '444333222',
    role: 'user',
    status: 'pending',
    points: 0,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updated_at: new Date().toISOString()
  }
];

// This function mimics what the UserManagement component does
// It creates a fake Supabase response
function createMockSupabaseResponse() {
  // Create an array to store all users to display in UserManagement
  const allTestUsers = [...testUsers];
  
  // Save the admin test users to localStorage
  localStorage.setItem('gg_admin_test_users', JSON.stringify(allTestUsers));
  
  // Set current user to the admin
  localStorage.setItem('gg_user', JSON.stringify(testUsers[1]));
  
  console.log('Test users created and saved to localStorage');
  console.log('Current user set to Admin User');
  console.log('Navigation tip: Visit http://localhost:3001/admin/users to see the UserManagement component');
  
  return allTestUsers;
}

// Execute the function
const users = createMockSupabaseResponse();
console.table(users);

// Helper function to load these users into the UserManagement component
// This function intercepts the supabase query and returns our mock data
function injectMockUsers() {
  // Store the original fetch method
  const originalFetch = window.fetch;
  
  // Override fetch method
  window.fetch = function(url, options) {
    // If this is a supabase request for profiles (for UserManagement)
    if (url.includes('profiles') && options?.method === 'GET') {
      console.log('Intercepting Supabase profiles request');
      
      // Create a mock response
      const mockUsers = JSON.parse(localStorage.getItem('gg_admin_test_users') || '[]');
      
      // Create a mock response object
      const mockResponse = new Response(JSON.stringify({ 
        data: mockUsers,
        count: mockUsers.length 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
      return Promise.resolve(mockResponse);
    }
    
    // Otherwise, use the original fetch method
    return originalFetch.apply(this, arguments);
  };
  
  console.log('Mock user injection active. Refresh the admin/users page to see test users.');
}

// Use this in browser console when on the admin page
// injectMockUsers();

// Direct instructions for use:
/*
1. Copy this entire file content
2. Navigate to http://localhost:3001 in your browser
3. Open the browser console (F12 or right-click > Inspect > Console)
4. Paste the code and press Enter to create test users in localStorage
5. Navigate to http://localhost:3001/admin/users
6. In the console, type: injectMockUsers() and press Enter
7. Refresh the page to see the test users
*/
