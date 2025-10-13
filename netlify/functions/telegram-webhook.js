import bot from '../../src/bot.js';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const raw = event.body || '{}';
    const payloadStr = event.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw;
    const update = JSON.parse(payloadStr);

    // Basic logging to aid debugging
    console.log('Webhook update type:', update?.message?.text ? 'message' : Object.keys(update || {}));
    console.log('From user:', update?.message?.from?.id, update?.message?.from?.username);

    await bot.handleUpdate(update);

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('Telegram webhook error:', err);
    const msg = err?.response?.description || err?.message || 'Internal Server Error';
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: msg }) };
  }
};