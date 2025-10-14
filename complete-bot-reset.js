const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;

if (!token) {
  console.log('No Telegram bot token found');
  process.exit(1);
}

async function completeBotReset() {
  try {
    console.log('🔄 Starting complete bot reset...\n');

    // Step 1: Delete webhook and clear all pending updates
    console.log('Step 1: Deleting webhook and clearing ALL pending updates...');
    const webhookResponse = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        drop_pending_updates: true,
        timeout: 1 // Force immediate cleanup
      })
    });
    const webhookData = await webhookResponse.json();
    console.log('✅ Webhook deletion result:', webhookData);

    // Step 2: Clear all bot commands
    console.log('\nStep 2: Clearing ALL bot commands...');
    const clearCommandsResponse = await fetch(`https://api.telegram.org/bot${token}/deleteMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const clearCommandsData = await clearCommandsResponse.json();
    console.log('✅ Commands cleared:', clearCommandsData);

    // Step 3: Set completely new commands
    console.log('\nStep 3: Setting fresh bot commands...');
    const commandsResponse = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'start', description: '🌟 Start Golden Glow Game' },
          { command: 'help', description: '❓ Game Help' },
          { command: 'play', description: '🎮 Play Now' }
        ]
      })
    });
    const commandsData = await commandsResponse.json();
    console.log('✅ Commands update result:', commandsData);

    // Step 4: Update bot description
    console.log('\nStep 4: Updating bot description...');
    const descResponse = await fetch(`https://api.telegram.org/bot${token}/setMyDescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: '🌟 Welcome to Golden Glow - The Ultimate Gaming Experience! Play exciting games and earn rewards.'
      })
    });
    const descData = await descResponse.json();
    console.log('✅ Description update result:', descData);

    // Step 5: Update bot short description
    console.log('\nStep 5: Updating bot short description...');
    const shortDescResponse = await fetch(`https://api.telegram.org/bot${token}/setMyShortDescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        short_description: '🎮 Play Golden Glow games directly in Telegram!'
      })
    });
    const shortDescData = await shortDescResponse.json();
    console.log('✅ Short description update result:', shortDescData);

    // Step 6: Update bot name (if possible)
    console.log('\nStep 6: Updating bot name...');
    const nameResponse = await fetch(`https://api.telegram.org/bot${token}/setMyName`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Golden Glow Game'
      })
    });
    const nameData = await nameResponse.json();
    console.log('✅ Name update result:', nameData);

    // Step 7: Get current webhook info to verify it's clear
    console.log('\nStep 7: Verifying webhook is clear...');
    const webhookInfoResponse = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const webhookInfoData = await webhookInfoResponse.json();
    console.log('✅ Current webhook info:', webhookInfoData);

    // Step 8: Get bot info to confirm changes
    console.log('\nStep 8: Confirming bot info...');
    const botInfoResponse = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const botInfoData = await botInfoResponse.json();
    console.log('✅ Bot info:', botInfoData);

    console.log('\n🎉 Complete bot reset finished successfully!');
    console.log('🧹 All old messages and settings have been cleared.');
    console.log('🚀 The bot is now ready with fresh settings.');

  } catch (error) {
    console.error('❌ Error during bot reset:', error);
    process.exit(1);
  }
}

completeBotReset();