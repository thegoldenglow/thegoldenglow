// Script to set the final clean webhook on Netlify
import fetch from 'node-fetch';

const BOT_TOKEN = "8076473971:AAELDeKpUuwqXp3-4nb-8wAnA4HpigjDW84";
const WEBHOOK_URL = "https://lambent-pithivier-68ddb6.netlify.app/.netlify/functions/final-clean-webhook";

async function setWebhook() {
  try {
    console.log('🚀 Setting final clean webhook...');
    console.log('🤖 Bot Token:', BOT_TOKEN.substring(0, 10) + '...');
    console.log('🌐 Webhook URL:', WEBHOOK_URL);
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        drop_pending_updates: true,
        allowed_updates: ['message', 'callback_query']
      }),
    });
    
    const result = await response.json();
    console.log('📊 Webhook setup result:', result);
    
    if (result.ok) {
      console.log('✅ Final clean webhook set successfully!');
      console.log('🔗 Webhook URL:', result.result.url);
      console.log('📝 Description:', result.result.description || 'No description');
    } else {
      console.error('❌ Failed to set webhook:', result.description);
    }
  } catch (error) {
    console.error('💥 Error setting webhook:', error.message);
  }
}

setWebhook();