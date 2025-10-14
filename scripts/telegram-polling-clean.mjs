import dotenv from 'dotenv';

// Load .env
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
const VERIFY_CHAT = process.env.TELEGRAM_VERIFY_CHAT || '@GoldenGlowGlobal';

if (!BOT_TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN in your environment (.env).');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function tg(method, payload = {}) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) {
    throw Object.assign(new Error(data.description || 'Telegram API error'), { code: data.error_code, method, payload });
  }
  return data.result;
}

async function safeCall(method, payload) {
  try { return await tg(method, payload); } catch (e) { console.warn(`[${method}]`, e.message); return null; }
}

async function deleteWebhookIfAny() {
  // Drop pending updates so we start fresh
  await safeCall('deleteWebhook', { drop_pending_updates: true });
}

async function setDefaultCommands() {
  await safeCall('setMyCommands', {
    commands: [
      { command: 'start', description: 'Start Golden Glow Game' },
      { command: 'help', description: 'How to play & commands' },
      { command: 'verify', description: 'Verify membership in our channel' },
    ],
    scope: { type: 'default' },
  });
}

async function sendMessage(chat_id, text, extra = {}) {
  return tg('sendMessage', { chat_id, text, parse_mode: 'HTML', ...extra });
}

async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const base = text.split(' ')[0];

  if (base.startsWith('/start')) {
    const payload = text.split(' ').slice(1).join(' ');
    const name = msg.from?.first_name || '';
    
    // Clean, modern welcome message
    const welcomeText = `🌟 Welcome to Golden Glow${name ? ', ' + name : ''}! ✨\n\n🎮 Get ready for an amazing gaming experience!\n\n📢 Join our official channel for updates and rewards:`;
    
    const replyMarkup = {
      inline_keyboard: [
        [{ text: '📢 Join Golden Glow Channel', url: 'https://t.me/GoldenGlowGlobal' }],
        [{ text: '🎮 Start Playing Now', web_app: { url: 'https://lambent-pithivier-68ddb6.netlify.app' } }],
      ],
    };
    
    await sendMessage(chatId, welcomeText, { reply_markup: replyMarkup });
    
    if (payload) {
      // Optionally acknowledge deep-link payloads
      await sendMessage(chatId, `🎁 Referral code received: <code>${payload}</code>`);
    }
    return;
  }

  if (base === '/help') {
    const helpText = `🎮 <b>Golden Glow Bot Commands:</b>\n\n` +
      `🚀 /start - Start the game\n` +
      `❓ /help - Show this help\n` +
      `✅ /verify - Verify channel membership\n\n` +
      `🌟 Ready to play? Tap the game link above!`;
    
    await sendMessage(chatId, helpText);
    return;
  }

  if (base === '/verify') {
    try {
      const userId = msg.from.id;
      const member = await tg('getChatMember', { chat_id: VERIFY_CHAT, user_id: userId });
      const status = member.status;
      const isMember = ['member', 'administrator', 'creator'].includes(status) || (status === 'restricted' && member.is_member !== false);
      
      const verifyText = isMember 
        ? '✅ <b>Great!</b> You are a member of our channel.'
        : '❌ <b>Please join our channel first:</b> https://t.me/GoldenGlowGlobal';
      
      await sendMessage(chatId, verifyText);
    } catch (e) {
      await sendMessage(chatId, '⚠️ I could not check membership. Please ensure the bot is an admin in the channel.');
      console.warn('verify error:', e.message);
    }
    return;
  }

  // Default response
  const defaultText = `🎮 <b>Welcome to Golden Glow!</b>\n\n` +
    `Send /start to begin your gaming journey!\n\n` +
    `🌟 Tap the game button above to start playing!`;
  
  await sendMessage(chatId, defaultText);
}

async function getMeAndLog() {
  const me = await tg('getMe');
  console.log(`Bot: @${me.username} (id: ${me.id})`);
}

async function poll() {
  let offset = 0;
  console.log('Deleting webhook (if any) to enable polling...');
  await deleteWebhookIfAny();
  await setDefaultCommands();
  await getMeAndLog();
  console.log('Clean polling started. Send /start to your bot.');

  while (true) {
    try {
      const updates = await tg('getUpdates', { offset, timeout: 50, allowed_updates: ['message'] });
      if (Array.isArray(updates) && updates.length) {
        for (const u of updates) {
          offset = u.update_id + 1;
          if (u.message) {
            console.log('Update:', JSON.stringify({
              chat: u.message.chat.id,
              from: u.message.from?.id,
              text: u.message.text,
            }));
            await handleMessage(u.message);
          }
        }
      }
    } catch (e) {
      console.warn('Polling error:', e.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

poll().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});