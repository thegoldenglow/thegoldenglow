// ULTRA CLEAN BOT - Completely eliminates backup channel messages
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ Missing TELEGRAM_BOT_TOKEN in your environment (.env).');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// FORCE OVERRIDE ALL MESSAGES - NO BACKUP CHANNEL REQUIREMENT
const CLEAN_MESSAGES = {
  start: `🌟 <b>Welcome to Golden Glow!</b>

✨ <i>Your adventure begins here!</i>

🎮 <b>Ready to play?</b>
Tap the button below to start your journey!`,

  help: `🎮 <b>Golden Glow Commands:</b>

🚀 /start - Begin adventure
❓ /help - Show commands
🎯 /play - Launch game

🌟 <i>Simple, fun, and rewarding!</i>`,

  play: `🎮 <b>Ready for adventure?</b>

🌟 <i>Your Golden Glow experience awaits!</i>

👇 <b>Launch the game:</b>`,

  default: `✨ <b>Golden Glow is here!</b>

🎮 Use /start to begin
🎯 Use /play to launch
❓ Use /help for info

🌟 <i>Let the games begin!</i>`
};

// COMPLETELY CLEAN BUTTONS - NO CHANNEL REQUIREMENTS
function createCleanMarkup() {
  return {
    inline_keyboard: [
      [{ text: '🎮 PLAY GOLDEN GLOW', web_app: { url: 'https://lambent-pithivier-68ddb6.netlify.app' } }],
      [{ text: '📢 Join Channel', url: 'https://t.me/GoldenGlowGlobal' }],
      [{ text: '🚀 Quick Start', callback_data: 'clean_start' }]
    ],
  };
}

async function tg(method, payload = {}) {
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
}

// ULTRA CLEAN MESSAGE HANDLER - NO BACKUP CHANNEL LOGIC
async function handleCleanMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim().toLowerCase();

  try {
    if (text.startsWith('/start')) {
      await tg('sendMessage', {
        chat_id: chatId,
        text: CLEAN_MESSAGES.start,
        parse_mode: 'HTML',
        reply_markup: createCleanMarkup()
      });
      return;
    }

    if (text === '/help') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: CLEAN_MESSAGES.help,
        parse_mode: 'HTML',
        reply_markup: createCleanMarkup()
      });
      return;
    }

    if (text === '/play') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: CLEAN_MESSAGES.play,
        parse_mode: 'HTML',
        reply_markup: createCleanMarkup()
      });
      return;
    }

    // Default - always send clean message
    await tg('sendMessage', {
      chat_id: chatId,
      text: CLEAN_MESSAGES.default,
      parse_mode: 'HTML',
      reply_markup: createCleanMarkup()
    });
    
  } catch (error) {
    console.error('❌ Clean message failed:', error);
    // Last resort - simple message
    try {
      await tg('sendMessage', {
        chat_id: chatId,
        text: '🌟 Golden Glow is here! Use /start to begin.',
        parse_mode: 'HTML'
      });
    } catch (finalError) {
      console.error('❌ Final fallback failed:', finalError);
    }
  }
}

// COMPLETE BOT RESET AND STERILIZATION
async function sterilizeBotCompletely() {
  console.log('🧪 COMPLETE BOT STERILIZATION IN PROGRESS...');
  
  try {
    // Delete everything possible
    await tg('deleteWebhook', { drop_pending_updates: true });
    console.log('✅ Webhook deleted');
    
    // Clear all commands completely
    await tg('deleteMyCommands', {});
    console.log('✅ Commands cleared');
    
    // Set minimal clean commands
    await tg('setMyCommands', {
      commands: [
        { command: 'start', description: '🚀 Start Golden Glow' },
        { command: 'help', description: '❓ Get help' },
        { command: 'play', description: '🎮 Play game' }
      ]
    });
    console.log('✅ Clean commands set');
    
    // Override bot description completely
    await tg('setMyDescription', {
      description: '🎮 Golden Glow Game Bot - Clean Version'
    });
    
    await tg('setMyShortDescription', {
      short_description: '🌟 Golden Glow Games'
    });
    
    console.log('✅ COMPLETE STERILIZATION FINISHED');
    
  } catch (error) {
    console.warn('⚠️ Sterilization warning:', error.message);
  }
}

async function getMeAndLog() {
  const me = await tg('getMe');
  console.log(`🤖 Ultra Clean Bot: @${me.username} (id: ${me.id})`);
}

// ULTRA CLEAN POLLING LOOP
async function ultraCleanPoll() {
  let offset = 0;
  
  console.log('🧹 ENTERING ULTRA CLEAN MODE');
  await sterilizeBotCompletely();
  await getMeAndLog();
  
  console.log('🧹 ULTRA CLEAN POLLING ACTIVE - NO BACKUP CHANNEL MESSAGES');
  console.log('🧹 ALL PREVIOUS CACHED RESPONSES OVERRIDDEN');

  while (true) {
    try {
      const updates = await tg('getUpdates', { 
        offset, 
        timeout: 25, 
        allowed_updates: ['message'] 
      });
      
      if (Array.isArray(updates) && updates.length) {
        for (const u of updates) {
          offset = u.update_id + 1;
          if (u.message) {
            console.log('🧹 Clean Update:', JSON.stringify({
              chat: u.message.chat.id,
              from: u.message.from?.id,
              text: u.message.text,
            }));
            
            // Handle every message with clean logic
            await handleCleanMessage(u.message);
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Clean polling error:', e.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// Start ultra clean mode
ultraCleanPoll().catch((e) => {
  console.error('💥 Ultra clean mode failed:', e);
  process.exit(1);
});