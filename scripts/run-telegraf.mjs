import dotenv from 'dotenv';
import bot from '../src/bot.js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('Missing TELEGRAM_BOT_TOKEN or VITE_TELEGRAM_BOT_TOKEN in .env/.env.local');
    process.exit(1);
  }

  try {
    // Check and delete webhook before launching in polling mode
    console.log('Checking for existing webhook...');
    const webhookInfo = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const webhookData = await webhookInfo.json();
    
    if (webhookData.result?.url) {
      console.log(`⚠️  Webhook detected: ${webhookData.result.url}`);
      console.log('Deleting webhook to avoid conflicts with polling mode...');
      const deleteResult = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`);
      const deleteData = await deleteResult.json();
      if (deleteData.ok) {
        console.log('✅ Webhook deleted successfully');
      } else {
        console.warn('⚠️  Failed to delete webhook:', deleteData);
      }
    } else {
      console.log('✅ No webhook set, proceeding with polling mode');
    }

    await bot.launch();
    console.log('🤖 Telegraf bot launched via long polling');
    console.log('📍 Bot is now listening for updates...');
    console.log('Press Ctrl+C to stop.');
  } catch (err) {
    console.error('❌ Failed to launch Telegraf bot:', err);
    process.exit(1);
  }
}

main();

process.once('SIGINT', () => {
  try { bot.stop('SIGINT'); } catch {}
});
process.once('SIGTERM', () => {
  try { bot.stop('SIGTERM'); } catch {}
});