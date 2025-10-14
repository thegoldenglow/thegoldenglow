const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;

if (!token) {
  console.log('No Telegram bot token found');
  process.exit(1);
}

async function clearTelegramCache() {
  try {
    // Step 1: Delete webhook with drop_pending_updates
    console.log('Step 1: Deleting webhook and clearing pending updates...');
    const webhookResponse = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: true })
    });
    const webhookData = await webhookResponse.json();
    console.log('Webhook deletion result:', webhookData);

    // Step 2: Set new bot commands to override any cached ones
    console.log('\nStep 2: Setting new bot commands...');
    const commandsResponse = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'start', description: 'Start Golden Glow Game' },
          { command: 'help', description: 'How to play & commands' },
          { command: 'verify', description: 'Verify membership in our channel' }
        ]
      })
    });
    const commandsData = await commandsResponse.json();
    console.log('Commands update result:', commandsData);

    // Step 3: Update bot description
    console.log('\nStep 3: Updating bot description...');
    const descResponse = await fetch(`https://api.telegram.org/bot${token}/setMyDescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Golden Glow - An exciting gaming experience! Join our channel and start playing now.'
      })
    });
    const descData = await descResponse.json();
    console.log('Description update result:', descData);

    // Step 4: Update bot short description
    console.log('\nStep 4: Updating bot short description...');
    const shortDescResponse = await fetch(`https://api.telegram.org/bot${token}/setMyShortDescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        short_description: '🎮 Play Golden Glow - Join @GoldenGlowGlobal'
      })
    });
    const shortDescData = await shortDescResponse.json();
    console.log('Short description update result:', shortDescData);

    console.log('\n✅ Telegram cache cleared successfully!');
    console.log('The old message should no longer appear.');

  } catch (error) {
    console.error('Error clearing Telegram cache:', error.message);
  }
}

clearTelegramCache();