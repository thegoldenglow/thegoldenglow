import bot from '../src/bot.js';

const REQUIRED_CHANNEL = process.env.TELEGRAM_REQUIRED_CHANNEL || '@GoldenGlowGlobal';
const REQUIRED_CHANNEL_ID = process.env.TELEGRAM_REQUIRED_CHANNEL_ID; // e.g. -1001234567890
const REQUIRED_CHAT = REQUIRED_CHANNEL_ID ? Number(REQUIRED_CHANNEL_ID) : REQUIRED_CHANNEL;

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { user_id } = JSON.parse(event.body || '{}');
    if (!user_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'user_id required' }) };
    }

    const res = await bot.telegram.getChatMember(REQUIRED_CHAT, Number(user_id));
    const status = res?.status;
    const isRestrictedMember = status === 'restricted' && res?.is_member !== false;
    const isMember = ['member', 'administrator', 'creator'].includes(status) || isRestrictedMember;

    return { statusCode: 200, body: JSON.stringify({ isMember, status }) };
  } catch (err) {
    const desc = err?.response?.description || err?.message || 'Unknown error';
    // Return 200 with isMember:false so client logic can handle gracefully
    return { statusCode: 200, body: JSON.stringify({ isMember: false, error: desc }) };
  }
};
