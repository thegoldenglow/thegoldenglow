// Test Supabase connection using the access token
import fetch from 'node-fetch';

// Function to test the Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('Attempting to connect to Supabase Management API...');
    
    // Try to list organizations using the REST API directly
    const response = await fetch('https://api.supabase.com/v1/organizations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer sbp_acbc9ef16dfdca3c3a3dc54be0a3744823ee120b`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Error connecting to Supabase:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return false;
    }
    
    const data = await response.json();
    console.log('Successfully connected to Supabase!');
    console.log('Organizations:', data);
    return true;
  } catch (err) {
    console.error('Exception when connecting to Supabase:', err.message);
    return false;
  }
}

// Run the test
testSupabaseConnection().then(success => {
  if (!success) {
    console.log('Connection test failed. Please check your access token and permissions.');
  }
}); 