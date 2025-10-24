// Script to set the final clean webhook on Netlify
import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.FINAL_WEBHOOK_URL || "https://lambent-pithivier-68ddb6.netlify.app/.netlify/functions/final-clean-webhook";
const SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET || '';

async function setWebhook() {
  try {
    if (!BOT_TOKEN) {
      throw new Error('Missing TELEGRAM_BOT_TOKEN');
    }
    console.log('🚀 Setting final clean webhook...');
    console.log('🌐 Webhook URL:', WEBHOOK_URL);
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        drop_pending_updates: true,
        allowed_updates: ['message', 'callback_query'],
        ...(SECRET_TOKEN ? { secret_token: SECRET_TOKEN } : {})
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