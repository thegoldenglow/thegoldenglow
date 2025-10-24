// FINAL CLEAN WEBHOOK - With channel membership verification
// Use native fetch API (available in Node.js 18+)

// Configuration
const REQUIRED_CHANNEL = process.env.TELEGRAM_REQUIRED_CHANNEL || '@GoldenGlowGlobal';
const SKIP_MEMBERSHIP_CHECK = process.env.TELEGRAM_SKIP_MEMBERSHIP_CHECK === 'true';
const CHANNEL_URL = `https://t.me/${REQUIRED_CHANNEL.replace('@', '')}`;

// Messages with channel verification
const FINAL_MESSAGES = {
  start: `🌟 <b>Welcome to Golden Glow!</b>

✨ <i>Your gaming adventure starts here!</i>

📢 <b>First, join our channel to continue:</b>
${REQUIRED_CHANNEL}

🎮 <b>After joining, click "✅ I Joined" to play!</b>`,

  startVerified: `🎉 <b>Welcome to Golden Glow!</b>

✅ <i>Verified! You're all set!</i>

🎮 <b>Ready to play?</b>
Tap the button below!`,

  notMember: `⚠️ <b>Channel Membership Required</b>

📢 <b>Please join our channel first:</b>
${REQUIRED_CHANNEL}

👉 After joining, click "✅ I Joined" to verify and play!

💡 <i>Why join? Get updates, rewards, and exclusive content!</i>`,

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

// Buttons for non-members (need to join)
function createJoinMarkup() {
  return {
    inline_keyboard: [
      [{ text: '📢 JOIN CHANNEL', url: CHANNEL_URL }],
      [{ text: '✅ I Joined', callback_data: 'verify_membership' }]
    ],
  };
}

// Buttons for verified members
function createPlayMarkup() {
  return {
    inline_keyboard: [
      [{ text: '🎮 PLAY NOW', web_app: { url: 'https://lambent-pithivier-68ddb6.netlify.app' } }],
      [{ text: '📱 Visit Channel', url: CHANNEL_URL }]
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

// Check if user is a member of the required channel
async function checkChannelMembership(userId, token) {
  // Skip check if disabled
  if (SKIP_MEMBERSHIP_CHECK) {
    console.log('⚠️ Membership check skipped (TELEGRAM_SKIP_MEMBERSHIP_CHECK=true)');
    return true;
  }

  try {
    const result = await tg('getChatMember', {
      chat_id: REQUIRED_CHANNEL,
      user_id: userId
    }, token);

    // Check membership status
    const status = result.status;
    const isMember = ['member', 'administrator', 'creator'].includes(status);
    
    console.log(`✓ User ${userId} membership status: ${status} (isMember: ${isMember})`);
    return isMember;
  } catch (error) {
    console.error('❌ Membership check failed:', error.message);
    // If check fails (e.g., bot not admin), allow access but log error
    if (error.message.includes('not enough rights') || error.message.includes('member list is inaccessible')) {
      console.warn('⚠️ Bot needs admin rights in channel. Allowing user by default.');
      return true; // Allow access if we can't check
    }
    return false;
  }
}

// Message handler with membership verification
async function handleFinalMessage(msg, token) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = (msg.text || '').trim().toLowerCase();

  try {
    if (text.startsWith('/start')) {
      // Check if user is a member
      const isMember = await checkChannelMembership(userId, token);
      
      if (isMember) {
        // User is verified - show play button
        await tg('sendMessage', {
          chat_id: chatId,
          text: FINAL_MESSAGES.startVerified,
          parse_mode: 'HTML',
          reply_markup: createPlayMarkup()
        }, token);
      } else {
        // User needs to join - show join button
        await tg('sendMessage', {
          chat_id: chatId,
          text: FINAL_MESSAGES.start,
          parse_mode: 'HTML',
          reply_markup: createJoinMarkup()
        }, token);
      }
      return;
    }

    if (text === '/help') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: FINAL_MESSAGES.help,
        parse_mode: 'HTML',
        reply_markup: createPlayMarkup()
      }, token);
      return;
    }

    if (text === '/play') {
      // Check membership before allowing play
      const isMember = await checkChannelMembership(userId, token);
      
      if (isMember) {
        await tg('sendMessage', {
          chat_id: chatId,
          text: FINAL_MESSAGES.play,
          parse_mode: 'HTML',
          reply_markup: createPlayMarkup()
        }, token);
      } else {
        await tg('sendMessage', {
          chat_id: chatId,
          text: FINAL_MESSAGES.notMember,
          parse_mode: 'HTML',
          reply_markup: createJoinMarkup()
        }, token);
      }
      return;
    }

    // Default - check membership
    const isMember = await checkChannelMembership(userId, token);
    await tg('sendMessage', {
      chat_id: chatId,
      text: FINAL_MESSAGES.default,
      parse_mode: 'HTML',
      reply_markup: isMember ? createPlayMarkup() : createJoinMarkup()
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
    console.log('Final Clean Webhook update type:', update?.message?.text ? 'message' : Object.keys(update || {}));
    console.log('From user:', update?.message?.from?.id, update?.message?.from?.username);

    const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error('Missing TELEGRAM_BOT_TOKEN in Netlify environment');
      return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'Missing bot token' }) };
    }

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const userId = callbackQuery.from.id;
      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;

      if (callbackQuery.data === 'verify_membership') {
        // User clicked "I Joined" - verify membership
        const isMember = await checkChannelMembership(userId, token);
        
        if (isMember) {
          // User is now a member - update message
          await tg('editMessageText', {
            chat_id: chatId,
            message_id: messageId,
            text: FINAL_MESSAGES.startVerified,
            parse_mode: 'HTML',
            reply_markup: createPlayMarkup()
          }, token);
          
          await tg('answerCallbackQuery', {
            callback_query_id: callbackQuery.id,
            text: '✅ Verified! Welcome to Golden Glow!',
            show_alert: false
          }, token);
        } else {
          // User still not a member
          await tg('answerCallbackQuery', {
            callback_query_id: callbackQuery.id,
            text: '❌ Please join the channel first, then click "I Joined" again.',
            show_alert: true
          }, token);
        }
      }
      return { statusCode: 200, body: 'OK' };
    }

    // Handle message with membership verification
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