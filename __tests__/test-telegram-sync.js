import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function testTelegramSync() {
  console.log('Testing Telegram sync function...');
  
  try {
    // Test the sync_telegram_user function
    const { data, error } = await supabase.rpc('sync_telegram_user', {
      p_telegram_id: 'test123456',
      p_telegram_username: 'testuser',
      p_telegram_first_name: 'Test',
      p_telegram_last_name: 'User',
      p_telegram_photo_url: null,
      p_username: 'testuser',
      p_name: 'Test User'
    });
    
    if (error) {
      console.error('❌ Function call failed:', error);
      return;
    }
    
    console.log('✅ Function call successful!');
    console.log('📊 Result:', JSON.stringify(data, null, 2));
    
    // Test getting the user
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', 'test123456')
      .single();
      
    if (userError) {
      console.error('❌ User fetch failed:', userError);
    } else {
      console.log('✅ User data retrieved:');
      console.log('👤 User:', JSON.stringify(userData, null, 2));
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testTelegramSync();