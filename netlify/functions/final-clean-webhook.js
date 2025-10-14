// FINAL CLEAN WEBHOOK - No backup channel messages
import fetch from 'node-fetch';

// Clean messages - no backup channel requirements
const FINAL_MESSAGES = {
  start: `🌟 <b>Welcome to Golden Glow!</b>

✨ <i>Your gaming adventure starts here!</i>

🎮 <b>Ready to play?</b>
Tap the button below!`,

  help: `🎮 <b>Golden Glow Commands:</b>

🚀 /start - Begin
❓ /help - Help
🎯 /play - Play

🌟 <i>Simple and fun!</i>`,

  play: `🎮 <b>Let's play!</b>

🌟 <i>Golden Glow awaits!</i>

👇 <b>Start now:</b>`,

  default: `✨ <b>Golden Glow!</b>

🎮 /start to begin
🎯 /play to launch
❓ /help for info`
};

// Clean buttons - no "JOIN" requirements
function createFinalMarkup() {
  return {
    inline_keyboard: [
      [{ text: '🎮 PLAY NOW', web_app: { url: 'https://lambent-pithivier-68ddb6.netlify.app' } }],
      [{ text: '📱 Visit Channel', url: 'https://t.me/GoldenGlowGlobal' }]
    ],
  };
}

async function tg(method, payload, token) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || 'Telegram API error');
  }
  return data.result;
}

// Final clean message handler - zero backup channel logic
async function handleFinalMessage(msg, token) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim().toLowerCase();

  try {
    if (text.startsWith('/start')) {
      await tg('sendMessage', {
        chat_id: chatId,
        text: FINAL_MESSAGES.start,
        parse_mode: 'HTML',
        reply_markup: createFinalMarkup()
      }, token);
      return;
    }

    if (text === '/help') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: FINAL_MESSAGES.help,
        parse_mode: 'HTML',
        reply_markup: createFinalMarkup()
      }, token);
      return;
    }

    if (text === '/play') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: FINAL_MESSAGES.play,
        parse_mode: 'HTML',
        reply_markup: createFinalMarkup()
      }, token);
      return;
    }

    // Default - always send final clean message
    await tg('sendMessage', {
      chat_id: chatId,
      text: FINAL_MESSAGES.default,
      parse_mode: 'HTML',
      reply_markup: createFinalMarkup()
    }, token);
    
  } catch (error) {
    console.error('❌ Final message failed:', error);
    // Absolute last resort
    try {
      await tg('sendMessage', {
        chat_id: chatId,
        text: '🌟 Golden Glow is here!',
        parse_mode: 'HTML'
      }, token);
    } catch (finalError) {
      console.error('❌ Final fallback failed:', finalError);
    }
  }
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const raw = event.body || '{}';
    const payloadStr = event.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw;
    const update = JSON.parse(payloadStr);

    // Basic logging to aid debugging
    console.log('Final Clean Webhook update type:', update?.message?.text ? 'message' : Object.keys(update || {}));
    console.log('From user:', update?.message?.from?.id, update?.message?.from?.username);

    const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error('Missing TELEGRAM_BOT_TOKEN in Netlify environment');
      return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'Missing bot token' }) };
    }

    // Handle message with final clean logic
    if (update.message) {
      await handleFinalMessage(update.message, token);
    }

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('Final Clean Webhook error:', err);
    const msg = err?.response?.description || err?.message || 'Internal Server Error';
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: msg }) };
  }
};