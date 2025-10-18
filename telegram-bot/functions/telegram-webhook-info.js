import fetch from 'node-fetch';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
    if (!token) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing TELEGRAM_BOT_TOKEN' }) };
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    console.error('Webhook info error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || 'Internal Error' }) };
  }
};
