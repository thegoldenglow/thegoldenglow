const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;

if (!token) {
  console.log('No Telegram bot token found');
  process.exit(1);
}

fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
  .then(r => r.json())
  .then(d => {
    console.log('Webhook Info:');
    console.log(JSON.stringify(d, null, 2));
  })
  .catch(e => console.error('Error:', e.message));