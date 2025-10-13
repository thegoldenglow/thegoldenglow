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
      { command: 'start', description: 'Start and open the main menu' },
      { command: 'help', description: 'How to use the bot' },
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
    const replyText = 'Welcome to Golden Glow! Follow our official channel for updates and rewards:';
    const replyMarkup = {
      inline_keyboard: [
        [{ text: 'Follow Golden Glow', url: 'https://t.me/GoldenGlowGlobal' }],
      ],
    };
    await sendMessage(chatId, replyText, { reply_markup: replyMarkup });
    if (payload) {
      // Optionally acknowledge deep-link payloads
      await sendMessage(chatId, `Referral/start payload: <code>${payload}</code>`);
    }
    return;
  }

  if (base === '/help') {
    await sendMessage(chatId, 'Commands:\n/start - Start and open the menu\n/verify - Verify channel membership');
    return;
  }

  if (base === '/verify') {
    try {
      const userId = msg.from.id;
      const member = await tg('getChatMember', { chat_id: VERIFY_CHAT, user_id: userId });
      const status = member.status; // creator, administrator, member, restricted, left, kicked
      const isMember = ['member', 'administrator', 'creator'].includes(status) || (status === 'restricted' && member.is_member !== false);
      await sendMessage(chatId, isMember ? '✅ You are a member.' : `❌ Please join: https://t.me/GoldenGlowGlobal`);
    } catch (e) {
      await sendMessage(chatId, 'I could not check membership. Ensure the bot is an admin in the channel.');
      console.warn('verify error:', e.message);
    }
    return;
  }

  // Default echo/help
  await sendMessage(chatId, 'Send /start to begin.');
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
  console.log('Polling started. Send /start to your bot.');

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
      // Handle conflicts or transient network errors gracefully
      console.warn('Polling error:', e.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

poll().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
