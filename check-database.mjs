import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDatabase() {
  console.log('🔍 Checking Supabase Database for Game Scores\n');
  
  try {
    // Check game_sessions table
    console.log('1. Checking game_sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('game_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (sessionsError) {
      console.log('❌ Error querying game_sessions:', sessionsError.message);
    } else {
      console.log(`✅ Found ${sessions.length} game sessions total`);
      if (sessions.length > 0) {
        console.log('\nRecent game sessions:');
        sessions.forEach((session, i) => {
          console.log(`  ${i+1}. ${session.game_type} - Score: ${session.score} - ${new Date(session.created_at).toLocaleString()}`);
        });
      }
    }
    
    // Check specifically for Path of Enlightenment scores
    console.log('\n2. Checking Path of Enlightenment scores...');
    const { data: pathScores, error: pathError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('game_type', 'path-of-enlightenment')
      .order('score', { ascending: false })
      .limit(5);
    
    if (pathError) {
      console.log('❌ Error querying path-of-enlightenment scores:', pathError.message);
    } else {
      console.log(`✅ Found ${pathScores.length} Path of Enlightenment scores`);
      if (pathScores.length > 0) {
        console.log('\nTop Path of Enlightenment scores:');
        pathScores.forEach((session, i) => {
          console.log(`  ${i+1}. Score: ${session.score} - ${new Date(session.created_at).toLocaleString()}`);
        });
      } else {
        console.log('  No Path of Enlightenment scores found in database');
      }
    }
    
    // Check profiles table for user data
    console.log('\n3. Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, points, created_at')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Error querying profiles:', profilesError.message);
    } else {
      console.log(`✅ Found ${profiles.length} user profiles`);
      if (profiles.length > 0) {
        console.log('\nUser profiles:');
        profiles.forEach((profile, i) => {
          console.log(`  ${i+1}. ${profile.username || 'Anonymous'} - Points: ${profile.points || 0}`);
        });
      }
    }
    
    console.log('\n📊 Database Check Summary:');
    console.log(`  - Game sessions table: ${sessions?.length || 0} records`);
    console.log(`  - Path of Enlightenment scores: ${pathScores?.length || 0} records`);
    console.log(`  - User profiles: ${profiles?.length || 0} records`);
    
    if (pathScores?.length > 0) {
      console.log('\n✅ CONCLUSION: Best scores ARE being saved to the Supabase database!');
      console.log('   The game score saving system is working correctly.');
    } else {
      console.log('\n⚠️  CONCLUSION: No Path of Enlightenment scores found in database.');
      console.log('   This could mean:');
      console.log('   - No games have been completed yet');
      console.log('   - Authentication issues preventing saves');
      console.log('   - Game not triggering save function properly');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkDatabase();