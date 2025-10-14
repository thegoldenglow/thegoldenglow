// Emergency Bot Fix - Completely overrides any cached messages
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ Missing TELEGRAM_BOT_TOKEN in your environment (.env).');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Emergency message override templates
const EMERGENCY_MESSAGES = {
  start: `🌟 <b>Golden Glow is LIVE!</b>

✨ <i>Welcome to the ultimate gaming experience!</i>

🎮 <b>What awaits you:</b>
• Epic games
• Amazing rewards  
• Thrilling adventures

👇 <b>Start your journey now:</b>`,

  help: `🎮 <b>Golden Glow Commands:</b>

🚀 /start - Begin adventure
❓ /help - Show commands
🎯 /play - Launch game

📢 Channel: @GoldenGlowGlobal
🌟 Tap the game button to play!`,

  play: `🎮 <b>Ready for adventure?</b>

🌟 <i>Your Golden Glow experience awaits!</i>

👇 <b>Launch the game:</b>`,

  default: `✨ <b>Golden Glow Active!</b>

🎮 Use /start to begin
🎯 Use /play to launch
❓ Use /help for info

🌟 Your adventure starts here!`
};

// Force override any cached responses
function createForceReplyMarkup() {
  return {
    inline_keyboard: [
      [{ text: '🎮 PLAY GOLDEN GLOW', web_app: { url: 'https://lambent-pithivier-68ddb6.netlify.app' } }],
      [{ text: '📢 Join Channel', url: 'https://t.me/GoldenGlowGlobal' }],
      [{ text: '🚀 Quick Start', callback_data: 'force_start' }]
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

async function sendEmergencyMessage(chat_id, text, extra = {}) {
  // Always include force reply markup to override any cached buttons
  const emergencyExtra = {
    ...extra,
    reply_markup: createForceReplyMarkup(),
    parse_mode: 'HTML'
  };
  
  return tg('sendMessage', { chat_id, text, ...emergencyExtra });
}

// Emergency message handler
async function handleEmergencyMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim().toLowerCase();

  try {
    if (text.startsWith('/start')) {
      await sendEmergencyMessage(chatId, EMERGENCY_MESSAGES.start);
      return;
    }

    if (text === '/help') {
      await sendEmergencyMessage(chatId, EMERGENCY_MESSAGES.help);
      return;
    }

    if (text === '/play') {
      await sendEmergencyMessage(chatId, EMERGENCY_MESSAGES.play);
      return;
    }

    // Default case - force our message
    await sendEmergencyMessage(chatId, EMERGENCY_MESSAGES.default);
    
  } catch (error) {
    console.error('❌ Emergency message failed:', error);
    // Last resort - try simple message
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

// Complete bot sterilization
async function sterilizeBot() {
  console.log('🧪 Sterilizing bot completely...');
  
  try {
    // Delete everything
    await tg('deleteWebhook', { drop_pending_updates: true });
    console.log('✅ Webhook deleted');
    
    // Clear all commands
    await tg('deleteMyCommands', {});
    console.log('✅ Commands cleared');
    
    // Set emergency commands
    await tg('setMyCommands', {
      commands: [
        { command: 'start', description: '🚨 EMERGENCY START' },
        { command: 'help', description: '🆘 EMERGENCY HELP' },
        { command: 'play', description: '🎮 EMERGENCY PLAY' }
      ]
    });
    console.log('✅ Emergency commands set');
    
    // Override bot description
    await tg('setMyDescription', {
      description: '🚨 EMERGENCY MODE - Golden Glow Game Bot'
    });
    
    await tg('setMyShortDescription', {
      short_description: '🎮 Golden Glow Emergency Mode'
    });
    
    console.log('✅ Bot sterilization complete');
    
  } catch (error) {
    console.warn('⚠️ Sterilization warning:', error.message);
  }
}

async function getMeAndLog() {
  const me = await tg('getMe');
  console.log(`🤖 Emergency Bot: @${me.username} (id: ${me.id})`);
}

// Emergency polling loop
async function emergencyPoll() {
  let offset = 0;
  
  console.log('🚨 ENTERING EMERGENCY MODE');
  await sterilizeBot();
  await getMeAndLog();
  
  console.log('🚨 EMERGENCY POLLING ACTIVE - All cached messages overridden');

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
            console.log('🚨 Emergency Update:', JSON.stringify({
              chat: u.message.chat.id,
              from: u.message.from?.id,
              text: u.message.text,
            }));
            
            // Force handle every message
            await handleEmergencyMessage(u.message);
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Emergency polling error:', e.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// Start emergency mode
emergencyPoll().catch((e) => {
  console.error('💥 Emergency mode failed:', e);
  process.exit(1);
});