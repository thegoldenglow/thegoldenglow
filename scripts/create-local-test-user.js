// Test user data
const testUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  username: 'TestUser',
  email: 'test@example.com',
  telegram_id: '123456789',
  role: 'user',
  status: 'active',
  points: 100,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  achievements: [],
  badges: [],
  titles: [],
  profileFrames: [],
  cosmetics: [],
  selectedTitle: null,
  selectedFrame: null,
  selectedBadge: null,
  customStatus: 'Test user status',
  prestige: 0,
  stats: {
    gamesPlayed: 5,
    highestScore: 120,
    totalTimePlayed: 3600,
    loginStreak: 3,
    longestLoginStreak: 5,
    lastLogin: new Date().toISOString(),
    gameStats: {}
  }
};

// Save to localStorage
localStorage.setItem('gg_user', JSON.stringify(testUser));
console.log('Test user created and saved to localStorage');

// If you need to manually access the admin page (if not already available in navigation)
// You can navigate to: http://localhost:3001/admin/users
