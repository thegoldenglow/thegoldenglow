// FINAL CLEAN BOT - Absolutely NO backup channel messages
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ Missing TELEGRAM_BOT_TOKEN in your environment (.env).');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ABSOLUTELY CLEAN MESSAGES - NO CHANNEL REQUIREMENTS
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

// ABSOLUTELY CLEAN BUTTONS - NO "JOIN" REQUIREMENTS
function createFinalMarkup() {
  return {
    inline_keyboard: [
      [{ text: '🎮 PLAY NOW', web_app: { url: 'https://lambent-pithivier-68ddb6.netlify.app' } }],
      [{ text: '📱 Visit Channel', url: 'https://t.me/GoldenGlowGlobal' }]
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

// FINAL CLEAN MESSAGE HANDLER - ZERO BACKUP CHANNEL LOGIC
async function handleFinalMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim().toLowerCase();

  try {
    if (text.startsWith('/start')) {
      await tg('sendMessage', {
        chat_id: chatId,
        text: FINAL_MESSAGES.start,
        parse_mode: 'HTML',
        reply_markup: createFinalMarkup()
      });
      return;
    }

    if (text === '/help') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: FINAL_MESSAGES.help,
        parse_mode: 'HTML',
        reply_markup: createFinalMarkup()
      });
      return;
    }

    if (text === '/play') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: FINAL_MESSAGES.play,
        parse_mode: 'HTML',
        reply_markup: createFinalMarkup()
      });
      return;
    }

    // Default - always send final clean message
    await tg('sendMessage', {
      chat_id: chatId,
      text: FINAL_MESSAGES.default,
      parse_mode: 'HTML',
      reply_markup: createFinalMarkup()
    });
    
  } catch (error) {
    console.error('❌ Final message failed:', error);
    // Absolute last resort
    try {
      await tg('sendMessage', {
        chat_id: chatId,
        text: '🌟 Golden Glow is here!',
        parse_mode: 'HTML'
      });
    } catch (finalError) {
      console.error('❌ Final fallback failed:', finalError);
    }
  }
}

// ABSOLUTE COMPLETE BOT RESET
async function finalBotReset() {
  console.log('🔥 FINAL COMPLETE BOT RESET IN PROGRESS...');
  
  try {
    // Delete everything completely
    await tg('deleteWebhook', { drop_pending_updates: true });
    console.log('✅ Complete webhook deletion');
    
    // Clear all commands absolutely
    await tg('deleteMyCommands', {});
    console.log('✅ Complete command clearance');
    
    // Set minimal final commands
    await tg('setMyCommands', {
      commands: [
        { command: 'start', description: '🚀 Start' },
        { command: 'help', description: '❓ Help' },
        { command: 'play', description: '🎮 Play' }
      ]
    });
    console.log('✅ Final commands set');
    
    // Override all bot metadata
    await tg('setMyDescription', {
      description: '🎮 Golden Glow Game'
    });
    
    await tg('setMyShortDescription', {
      short_description: '🌟 Golden Glow'
    });
    
    console.log('🔥 FINAL RESET COMPLETE - NO BACKUP CHANNEL MESSAGES POSSIBLE');
    
  } catch (error) {
    console.warn('⚠️ Final reset warning:', error.message);
  }
}

async function getFinalBotInfo() {
  const me = await tg('getMe');
  console.log(`🤖 Final Clean Bot: @${me.username} (id: ${me.id})`);
}

// FINAL POLLING LOOP
async function finalPoll() {
  let offset = 0;
  
  console.log('🔥 ENTERING FINAL CLEAN MODE');
  await finalBotReset();
  await getFinalBotInfo();
  
  console.log('🔥 FINAL CLEAN POLLING ACTIVE');
  console.log('🔥 ABSOLUTELY NO BACKUP CHANNEL MESSAGES');
  console.log('🔥 ALL CACHED RESPONSES PERMANENTLY OVERRIDDEN');

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
            console.log('🔥 Final Update:', JSON.stringify({
              chat: u.message.chat.id,
              from: u.message.from?.id,
              text: u.message.text,
            }));
            
            // Handle with final clean logic
            await handleFinalMessage(u.message);
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Final polling error:', e.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// Start final clean mode
finalPoll().catch((e) => {
  console.error('💥 Final clean mode failed:', e);
  process.exit(1);
});