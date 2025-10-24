export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Optional secret verification when set via setWebhook?secret_token=...
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret) {
      const headers = event.headers || {};
      const got = headers['x-telegram-bot-api-secret-token'] || headers['X-Telegram-Bot-Api-Secret-Token'];
      if (got !== expectedSecret) {
        console.warn('Rejected Telegram webhook: invalid secret token');
        return { statusCode: 401, body: 'Unauthorized' };
      }
    }

    const raw = event.body || '{}';
    const payloadStr = event.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw;
    const update = JSON.parse(payloadStr);

    // Basic logging to aid debugging
    console.log('Webhook update type:', update?.message?.text ? 'message' : Object.keys(update || {}));
    console.log('From user:', update?.message?.from?.id, update?.message?.from?.username);

    const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error('Missing TELEGRAM_BOT_TOKEN in Netlify environment');
      return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'Missing bot token' }) };
    }

    const { default: bot } = await import('../../src/bot.js');
    await bot.handleUpdate(update);

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('Telegram webhook error:', err);
    const msg = err?.response?.description || err?.message || 'Internal Server Error';
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: msg }) };
  }
};