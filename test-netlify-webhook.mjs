import fetch from 'node-fetch';

const NETLIFY_URL = 'https://lambent-pithivier-68ddb6.netlify.app';

console.log('🧪 Testing Netlify Telegram Webhook Setup\n');

async function setWebhook() {
  console.log('📡 Setting webhook...');
  try {
    const response = await fetch(`${NETLIFY_URL}/telegram/set-bot-webhook`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Webhook set successfully!');
      console.log('📍 Webhook URL:', data.webhook_url);
      console.log('\n📋 Result:', JSON.stringify(data.result, null, 2));
    } else {
      console.log('❌ Failed to set webhook');
      console.log('Error:', data);
    }
    return data.success;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function checkWebhook() {
  console.log('\n🔍 Checking current webhook status...');
  try {
    const response = await fetch(`${NETLIFY_URL}/telegram/webhook-info`, {
      method: 'POST'
    });
    const data = await response.json();
    console.log('📋 Webhook Info:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  const success = await setWebhook();
  if (success) {
    await checkWebhook();
    console.log('\n🎉 Setup complete! Test your bot by sending /start on Telegram');
  }
}

main();
