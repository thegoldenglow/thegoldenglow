import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

async function checkAndFixWebhook() {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.error('❌ No bot token found in environment variables');
    process.exit(1);
  }

  console.log('🔍 Checking current webhook status...\n');

  try {
    // Check current webhook
    const checkResponse = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const webhookInfo = await checkResponse.json();
    
    if (!webhookInfo.ok) {
      console.error('❌ Failed to get webhook info:', webhookInfo);
      return;
    }

    const currentWebhook = webhookInfo.result;
    
    console.log('📊 Current Webhook Status:');
    console.log('══════════════════════════');
    console.log(`URL: ${currentWebhook.url || 'No webhook set'}`);
    console.log(`Pending updates: ${currentWebhook.pending_update_count || 0}`);
    console.log(`Last error: ${currentWebhook.last_error_message || 'None'}`);
    
    if (currentWebhook.url) {
      console.log(`\n⚠️  Active webhook detected: ${currentWebhook.url}`);
      console.log('\n🤔 What would you like to do?');
      console.log('1. DELETE the webhook (for local development)');
      console.log('2. KEEP the webhook (for production on Netlify)');
      console.log('\nIf you want to run the bot locally, you need to DELETE the webhook.');
      
      // Prompt user
      console.log('\n🗑️  Deleting webhook for local development...');
      
      const deleteResponse = await fetch(
        `https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`
      );
      const deleteResult = await deleteResponse.json();
      
      if (deleteResult.ok) {
        console.log('✅ Webhook deleted successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Run "npm run dev" to start local bot');
        console.log('2. Send /start to your bot');
        console.log('3. Messages should now work correctly!');
      } else {
        console.error('❌ Failed to delete webhook:', deleteResult);
      }
    } else {
      console.log('\n✅ No webhook is currently set');
      console.log('📝 You can safely run the bot locally with "npm run dev"');
    }
    
    console.log('\n💡 Remember:');
    console.log('- For LOCAL development: No webhook (use polling)');
    console.log('- For PRODUCTION (Netlify): Set webhook via telegram-setup.html');
    console.log('- NEVER run both at the same time!');
    
  } catch (error) {
    console.error('❌ Error checking webhook:', error.message);
    if (error.message.includes('fetch failed')) {
      console.log('\n🌐 Network issue detected. This might be due to regional blocking.');
      console.log('Consider using a VPN or proxy to access Telegram API.');
    }
  }
}

// Run the check
checkAndFixWebhook();
