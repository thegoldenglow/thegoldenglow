import dotenv from 'dotenv';

// Load environment

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN in your environment (.env).');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Helper: safe API call with retry
async function tg(method, payload = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${API}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.description || 'Telegram API error');
      }
      return data.result;
    } catch (e) {
      if (i === retries - 1) throw e;
      console.warn(`[${method}] retry ${i + 1}/${retries} after error:`, e.message);
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function safeCall(method, payload) {
  try { return await tg(method, payload); } catch (e) { console.warn(`[${method}]`, e.message); return null; }
}

// Completely reset bot state
async function resetBotState() {
  console.log('🔄 Resetting bot state...');
  
  // Delete webhook with force cleanup
  await safeCall('deleteWebhook', { drop_pending_updates: true });
  
  // Clear all commands first
  await safeCall('deleteMyCommands', {});
  
  // Set completely new commands
  await safeCall('setMyCommands', {
    commands: [
      { command: 'start', description: '🌟 Start Golden Glow' },
      { command: 'help', description: '❓ Get Help' },
      { command: 'play', description: '🎮 Play Game' }
    ]
  });
  
  // Update bot description to something completely new
  await safeCall('setMyDescription', {
    description: '🌟 Golden Glow - Premium Gaming Experience. Play exciting games and earn rewards!'
  });
  
  await safeCall('setMyShortDescription', {
    short_description: '🎮 Play Golden Glow games in Telegram!'
  });
  
  console.log('✅ Bot state reset complete');
}

async function sendMessage(chat_id, text, extra = {}) {
  return tg('sendMessage', { chat_id, text, parse_mode: 'HTML', ...extra });
}

// Handle messages with complete override
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const base = text.split(' ')[0];

  // Always respond with our custom messages, never let default through
  if (base.startsWith('/start')) {
    const name = msg.from?.first_name || '';
    
    // Completely new welcome message that can't be cached
    const welcomeText = `✨ <b>Welcome to Golden Glow${name ? ', ' + name : ''}!</b>

🎮 <i>Experience the ultimate gaming adventure!</i>

🌟 <b>What you'll get:</b>
• Amazing games
• Great rewards
• Fun community

👇 <b>Tap below to start your journey:</b>`;
    
    const replyMarkup = {
      inline_keyboard: [
        [{ text: '📢 Join Our Channel', url: 'https://t.me/GoldenGlowGlobal' }],
        [{ text: '🎮 Play Golden Glow', web_app: { url: 'https://lambent-pithivier-68ddb6.netlify.app' } }],
        [{ text: '🎯 Quick Start', callback_data: 'quick_start' }]
      ],
    };
    
    await sendMessage(chatId, welcomeText, { reply_markup: replyMarkup });
    return;
  }

  if (base === '/help') {
    const helpText = `🎮 <b>Golden Glow Commands:</b>

/start - 🌟 Start the game
/help - ❓ Show this help
/play - 🎮 Launch game

📢 Join: @GoldenGlowGlobal
🌟 Play now with the button below!`;
    
    await sendMessage(chatId, helpText);
    return;
  }

  if (base === '/play') {
    const playText = `🎮 <b>Ready to play?</b>

Tap the button below to launch Golden Glow:`;
    
    const playMarkup = {
      inline_keyboard: [
        [{ text: '🚀 Launch Golden Glow', web_app: { url: 'https://lambent-pithivier-68ddb6.netlify.app' } }]
      ],
    };
    
    await sendMessage(chatId, playText, { reply_markup: playMarkup });
    return;
  }

  // Default response - completely override any cached messages
  const defaultText = `✨ <b>Golden Glow is here!</b>

Use these commands:
• /start - Begin journey
• /help - Get help
• /play - Launch game

🌟 Ready when you are!`;
  
  await sendMessage(chatId, defaultText);
}

async function getMeAndLog() {
  const me = await tg('getMe');
  console.log(`🤖 Bot: @${me.username} (id: ${me.id})`);
}

// Main polling function
async function poll() {
  let offset = 0;
  
  console.log('🔄 Initializing bot...');
  await resetBotState();
  await getMeAndLog();
  
  console.log('🚀 Ultra-clean polling started. Send /start to your bot.');

  while (true) {
    try {
      const updates = await tg('getUpdates', { offset, timeout: 30, allowed_updates: ['message'] });
      if (Array.isArray(updates) && updates.length) {
        for (const u of updates) {
          offset = u.update_id + 1;
          if (u.message) {
            console.log('📨 Update:', JSON.stringify({
              chat: u.message.chat.id,
              from: u.message.from?.id,
              text: u.message.text,
            }));
            await handleMessage(u.message);
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Polling error:', e.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

poll().catch((e) => {
  console.error('💥 Fatal error:', e);
  process.exit(1);
});