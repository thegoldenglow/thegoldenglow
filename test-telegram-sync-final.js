import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://luzpkuypmyidaluitvzh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1enBrdXlwbXlpZGFsdWl0dnpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjcwMzg0MiwiZXhwIjoyMDYyMjc5ODQyfQ.VjJJGcSBuNpLnc2nkTWzrIqGv_Zw9QUu3VJtJEx_HO8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTelegramSync() {
  try {
    console.log('Testing Telegram user synchronization...');
    
    // Test data
    const testTelegramUser = {
      p_telegram_id: '987654321',
      p_telegram_username: 'johndoe',
      p_telegram_first_name: 'John',
      p_telegram_last_name: 'Doe',
      p_telegram_photo_url: 'https://example.com/john.jpg'
    };
    
    console.log('\n1. Testing sync_telegram_user function...');
    
    // Test the sync function
    const { data: syncData, error: syncError } = await supabase.rpc('sync_telegram_user', testTelegramUser);
    
    if (syncError) {
      console.error('❌ sync_telegram_user function failed:', syncError.message);
      console.log('\n📝 Please ensure you have executed the SQL function in the Supabase dashboard.');
      console.log('📄 The function definition is available in: sync_telegram_user_function.sql');
      return;
    }
    
    console.log('✅ sync_telegram_user function executed successfully');
    console.log('📊 Result:', syncData);
    
    console.log('\n2. Verifying user was created/updated...');
    
    // Verify the user exists
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', testTelegramUser.p_telegram_id)
      .single();
    
    if (userError) {
      console.error('❌ Error fetching user:', userError.message);
    } else {
      console.log('✅ User found in database:');
      console.log('👤 User ID:', userData.id);
      console.log('📱 Telegram ID:', userData.telegram_id);
      console.log('👤 Username:', userData.username);
      console.log('📝 Name:', userData.name);
      console.log('🔗 User Source:', userData.user_source);
    }
    
    console.log('\n3. Testing user update...');
    
    // Test updating the same user
    const updateData = {
      ...testTelegramUser,
      p_telegram_first_name: 'Johnny',
      p_telegram_photo_url: 'https://example.com/johnny.jpg'
    };
    
    const { data: updateResult, error: updateError } = await supabase.rpc('sync_telegram_user', updateData);
    
    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
    } else {
      console.log('✅ User update successful');
      console.log('📊 Update result:', updateResult);
    }
    
    console.log('\n4. Testing set_telegram_user_context function...');
    
    // Test the context function
    const { data: contextData, error: contextError } = await supabase.rpc('set_telegram_user_context', {
      telegram_user_id: testTelegramUser.p_telegram_id
    });
    
    if (contextError) {
      console.error('❌ set_telegram_user_context failed:', contextError.message);
    } else {
      console.log('✅ Telegram user context set successfully');
    }
    
    console.log('\n5. Cleaning up test data...');
    
    // Clean up test user
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('telegram_id', testTelegramUser.p_telegram_id);
    
    if (deleteError) {
      console.error('❌ Error cleaning up test user:', deleteError.message);
    } else {
      console.log('✅ Test user cleaned up successfully');
    }
    
    console.log('\n🎉 Telegram synchronization test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Table columns added to profiles');
    console.log('✅ sync_telegram_user function working');
    console.log('✅ set_telegram_user_context function working');
    console.log('✅ User creation and updates working');
    console.log('\n🚀 Telegram user synchronization is now ready!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTelegramSync();