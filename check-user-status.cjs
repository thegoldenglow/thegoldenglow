const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials');
  console.log('VITE_SUPABASE_URL:', !!process.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY:', !!process.env.VITE_SUPABASE_ANON_KEY);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  try {
    console.log('Checking for user BananBenBadr...');
    
    // Search for user by username or telegram_username
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .or('username.eq.BananBenBadr,telegram_username.eq.BananBenBadr');
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Found profiles:', JSON.stringify(profiles, null, 2));
    
    if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      console.log('\nUser details:');
      console.log('- ID:', profile.id);
      console.log('- Username:', profile.username);
      console.log('- Telegram Username:', profile.telegram_username);
      console.log('- Telegram ID:', profile.telegram_id);
      console.log('- Points:', profile.points);
      console.log('- Created:', profile.created_at);
      
      // Check recent game sessions (using auth_user_id since user_id expects UUID)
      const { data: sessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', profile.auth_user_id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      console.log('\nTrying to fetch sessions with auth_user_id:', profile.auth_user_id);
      
      if (!sessionsError && sessions) {
        console.log('\nRecent game sessions:');
        if (sessions.length === 0) {
          console.log('- No game sessions found');
        } else {
          sessions.forEach(session => {
            console.log(`- ${session.game_type}: ${session.score} points (${session.points_earned || 0} earned) at ${session.created_at}`);
          });
        }
      } else {
        console.log('Error fetching game sessions:', sessionsError);
      }
      
      // Check if there are any auth users with this telegram info
      console.log('\nChecking auth.users table...');
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, raw_user_meta_data')
        .like('raw_user_meta_data', '%BananBenBadr%');
      
      if (!authError && authUsers) {
        console.log('Auth users found:', authUsers.length);
        authUsers.forEach(user => {
          console.log(`- Auth ID: ${user.id}, Email: ${user.email}`);
          console.log(`- Meta data:`, user.raw_user_meta_data);
        });
      }
      
    } else {
      console.log('No user found with username or telegram_username BananBenBadr');
      
      // Search more broadly
      console.log('\nSearching for any profiles with similar names...');
      const { data: similarProfiles, error: similarError } = await supabase
        .from('profiles')
        .select('*')
        .or('username.ilike.%banan%,telegram_username.ilike.%banan%,name.ilike.%banan%');
      
      if (!similarError && similarProfiles) {
        console.log('Similar profiles found:', similarProfiles.length);
        similarProfiles.forEach(profile => {
          console.log(`- ID: ${profile.id}, Username: ${profile.username}, Telegram: ${profile.telegram_username}, Name: ${profile.name}`);
        });
      }
    }
    
  } catch (err) {
    console.error('Script error:', err);
  }
}

checkUser();