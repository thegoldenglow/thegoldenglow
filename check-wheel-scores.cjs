const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://luzpkuypmyidaluitvzh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1enBrdXlwbXlpZGFsdWl0dnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDM4NDIsImV4cCI6MjA2MjI3OTg0Mn0.D4am_bzy02Ve5iEETJfSapppTc9g5uD5UTLCv7KqXd0'
);

async function checkWheelScores() {
  console.log('Checking user profiles and points...');
  
  try {
    // Get all users with their points
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, username, points, createdAt')
      .order('points', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log('\nUsers ordered by points:');
    console.log('========================');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username || 'No username'}: ${user.points} points`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });
    
    // Check for recent point changes
    const recentUsers = users.filter(user => {
      const createdDate = new Date(user.createdAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return createdDate > oneDayAgo;
    });
    
    if (recentUsers.length > 0) {
      console.log('\nUsers created in the last 24 hours:');
      console.log('===================================');
      recentUsers.forEach(user => {
        console.log(`${user.username || 'No username'}: ${user.points} points`);
      });
    }
    
    // Summary
    console.log('\nSummary:');
    console.log('========');
    console.log(`Total users: ${users.length}`);
    console.log(`Users with points > 0: ${users.filter(u => u.points > 0).length}`);
    console.log(`Highest points: ${users.length > 0 ? users[0].points : 0}`);
    console.log(`Average points: ${users.length > 0 ? Math.round(users.reduce((sum, u) => sum + u.points, 0) / users.length) : 0}`);
    
  } catch (error) {
    console.error('Exception:', error);
  }
}

checkWheelScores();