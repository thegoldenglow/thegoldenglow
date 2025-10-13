import bot from '../../src/bot.js';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const update = event.body ? JSON.parse(event.body) : {};
    await bot.handleUpdate(update);

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('Telegram webhook error:', err);
    const msg = err?.message || 'Internal Server Error';
    return { statusCode: 500, body: msg };
  }
};