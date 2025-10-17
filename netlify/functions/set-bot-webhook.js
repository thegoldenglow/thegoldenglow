import fetch from 'node-fetch';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
    if (!token) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Missing TELEGRAM_BOT_TOKEN in environment variables' }) 
      };
    }

    // Build the webhook URL
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const host = event.headers.host;
    const webhookUrl = `${proto}://${host}/.netlify/functions/telegram-bot-webhook`;

    console.log('Setting webhook to:', webhookUrl);

    // Set the webhook
    const res = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`
    );
    const data = await res.json();
    
    if (data.ok) {
      // Also set the bot commands
      await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: [
            { command: 'start', description: 'Start Golden Glow' },
            { command: 'help', description: 'How to play & commands' },
            { command: 'referral', description: 'Get your referral link' },
            { command: 'stats', description: 'View your game stats' },
            { command: 'support', description: 'Contact support' },
            { command: 'settings', description: 'Adjust preferences' },
          ]
        })
      });
    }
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        success: data.ok,
        webhook_url: webhookUrl, 
        result: data,
        message: data.ok 
          ? '✅ Telegram bot webhook set successfully!' 
          : '❌ Failed to set webhook'
      }) 
    };
  } catch (err) {
    console.error('Set webhook error:', err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: err?.message || 'Internal Error' }) 
    };
  }
};
