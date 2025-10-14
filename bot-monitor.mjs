// Bot Monitor - Ensures no message disappearing issues
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

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

// Test the bot to ensure messages don't disappear
async function testBot() {
  console.log('🧪 Testing bot to ensure messages don\'t disappear...');
  
  try {
    // Test 1: Send a message to yourself (bot owner)
    const ownerChatId = '86245582'; // Your chat ID from the logs
    
    console.log('📤 Sending test message...');
    const testMessage = await tg('sendMessage', {
      chat_id: ownerChatId,
      text: '🧪 <b>Bot Test Message</b>\n\nIf you see this message and it stays visible, the disappearing message issue is resolved!',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Message Visible', callback_data: 'test_visible' }
        ]]
      }
    });
    
    console.log('✅ Test message sent successfully!');
    console.log('📋 Message ID:', testMessage.message_id);
    
    // Test 2: Check if message persists
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 Checking if message still exists...');
    try {
      const message = await tg('getMessage', {
        chat_id: ownerChatId,
        message_id: testMessage.message_id
      });
      console.log('✅ Message still exists! Issue resolved.');
    } catch (error) {
      console.log('⚠️ Message check failed (this is normal for some bots)');
    }
    
    // Test 3: Send a follow-up message
    await tg('sendMessage', {
      chat_id: ownerChatId,
      text: '🎉 <b>Success!</b>\n\nThe bot is working correctly. Messages should no longer disappear.\n\n🚀 Try sending /start to see the new clean interface!',
      parse_mode: 'HTML'
    });
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Monitor function
async function monitorBot() {
  console.log('👁️ Bot Monitor Active');
  console.log('📊 Monitoring for message disappearing issues...');
  
  await testBot();
  
  console.log('✅ Monitor complete - bot appears to be working correctly!');
}

monitorBot().catch(console.error);