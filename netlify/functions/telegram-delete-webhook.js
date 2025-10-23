// Delete Telegram webhook
export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { 
        statusCode: 405, 
        body: JSON.stringify({ error: 'Method Not Allowed' }) 
      };
    }

    const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
    if (!token) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ 
          success: false,
          error: 'Missing TELEGRAM_BOT_TOKEN in environment variables' 
        }) 
      };
    }

    console.log('Deleting webhook...');

    // Delete the webhook
    const res = await fetch(
      `https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`
    );
    const data = await res.json();
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        success: data.ok,
        result: data,
        message: data.ok 
          ? '✅ Telegram bot webhook deleted successfully!' 
          : '❌ Failed to delete webhook: ' + (data.description || 'Unknown error')
      }) 
    };
  } catch (err) {
    console.error('Delete webhook error:', err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        success: false,
        error: err?.message || 'Internal Error' 
      }) 
    };
  }
};
