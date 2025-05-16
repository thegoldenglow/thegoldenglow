// Script to add test users to Supabase
import { createClient } from '@supabase/supabase-js';

// Supabase credentials from .env.local
const supabaseUrl = 'https://luzpkuypmyidaluitvzh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1enBrdXlwbXlpZGFsdWl0dnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDM4NDIsImV4cCI6MjA2MjI3OTg0Mn0.D4am_bzy02Ve5iEETJfSapppTc9g5uD5UTLCv7KqXd0';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test user data
const testUsers = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'John Doe',
    lastName: 'Test',
    username: 'johndoe',
    email: 'john.doe@example.com',
    avatar: 'https://i.pravatar.cc/150?u=johndoe',
    points: 1000,
    status: 'active',
    role: 'user',
    createdAt: new Date().toISOString(),
    achievements: JSON.stringify([]),
    badges: JSON.stringify(['newcomer']),
    titles: JSON.stringify(['novice']),
    profileFrames: JSON.stringify([]),
    cosmetics: JSON.stringify([]),
    selectedTitle: 'novice',
    selectedFrame: null,
    selectedBadge: 'newcomer',
    customStatus: 'Just getting started!',
    prestige: 0,
    stats: JSON.stringify({
      gamesPlayed: 12,
      highestScore: 850,
      totalTimePlayed: 3600,
      loginStreak: 3,
      longestLoginStreak: 5,
      lastLogin: new Date().toISOString(),
      gameStats: {}
    })
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Jane Smith',
    lastName: 'Test',
    username: 'janesmith',
    email: 'jane.smith@example.com',
    avatar: 'https://i.pravatar.cc/150?u=janesmith',
    points: 2500,
    status: 'active',
    role: 'user',
    createdAt: new Date().toISOString(),
    achievements: JSON.stringify(['first_win', 'rookie']),
    badges: JSON.stringify(['veteran', 'point_collector']),
    titles: JSON.stringify(['master', 'expert']),
    profileFrames: JSON.stringify(['gold']),
    cosmetics: JSON.stringify(['sparkle_effect']),
    selectedTitle: 'master',
    selectedFrame: 'gold',
    selectedBadge: 'point_collector',
    customStatus: 'Gold tier player!',
    prestige: 1,
    stats: JSON.stringify({
      gamesPlayed: 85,
      highestScore: 2800,
      totalTimePlayed: 28000,
      loginStreak: 12,
      longestLoginStreak: 15,
      lastLogin: new Date().toISOString(),
      gameStats: {
        wins: 42,
        losses: 43
      }
    })
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Admin',
    lastName: 'User',
    username: 'adminuser',
    email: 'admin@goldenglow.app',
    avatar: 'https://i.pravatar.cc/150?u=adminuser',
    points: 5000,
    status: 'active',
    role: 'admin',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    achievements: JSON.stringify(['all_achievements']),
    badges: JSON.stringify(['admin', 'developer']),
    titles: JSON.stringify(['admin', 'developer']),
    profileFrames: JSON.stringify(['diamond']),
    cosmetics: JSON.stringify(['premium_effects']),
    selectedTitle: 'admin',
    selectedFrame: 'diamond',
    selectedBadge: 'admin',
    customStatus: 'System administrator',
    prestige: 5,
    stats: JSON.stringify({
      gamesPlayed: 250,
      highestScore: 9999,
      totalTimePlayed: 180000,
      loginStreak: 60,
      longestLoginStreak: 60,
      lastLogin: new Date().toISOString(),
      gameStats: {
        wins: 200,
        losses: 50
      }
    })
  }
];

// Function to add test users
async function addTestUsers() {
  console.log('Adding test users to Supabase database...');

  for (const user of testUsers) {
    console.log(`Adding user: ${user.username}`);
    
    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id);

    if (checkError) {
      console.error(`Error checking user ${user.username}:`, checkError);
      continue;
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log(`User ${user.username} already exists, updating...`);
      
      // Update existing user
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: user.name,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          points: user.points,
          status: user.status,
          role: user.role,
          achievements: user.achievements,
          badges: user.badges,
          titles: user.titles,
          profileFrames: user.profileFrames,
          cosmetics: user.cosmetics,
          selectedTitle: user.selectedTitle,
          selectedFrame: user.selectedFrame,
          selectedBadge: user.selectedBadge,
          customStatus: user.customStatus,
          prestige: user.prestige,
          stats: user.stats
        })
        .eq('id', user.id);

      if (updateError) {
        console.error(`Error updating user ${user.username}:`, updateError);
      } else {
        console.log(`Successfully updated user: ${user.username}`);
      }
    } else {
      // Insert new user
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: user.name,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          points: user.points,
          createdAt: user.createdAt,
          status: user.status,
          role: user.role,
          achievements: user.achievements,
          badges: user.badges,
          titles: user.titles,
          profileFrames: user.profileFrames,
          cosmetics: user.cosmetics,
          selectedTitle: user.selectedTitle,
          selectedFrame: user.selectedFrame,
          selectedBadge: user.selectedBadge,
          customStatus: user.customStatus,
          prestige: user.prestige,
          stats: user.stats
        });

      if (insertError) {
        console.error(`Error inserting user ${user.username}:`, insertError);
      } else {
        console.log(`Successfully added user: ${user.username}`);
      }
    }
  }

  console.log('Test users setup completed!');
}

// Run the function
addTestUsers().catch(error => {
  console.error('Error adding test users:', error);
});
