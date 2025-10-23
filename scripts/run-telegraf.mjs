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
    
    try {
      const webhookInfo = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      const webhookData = await webhookInfo.json();
      
      if (webhookData.result?.url) {
        console.log(`⚠️  Webhook detected: ${webhookData.result.url}`);
        console.log('Deleting webhook to avoid conflicts with polling mode...');
        const deleteResult = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`);
        const deleteData = await deleteResult.json();
        if (deleteData.ok) {
          console.log('✅ Webhook deleted successfully');
          console.log('⏳ Waiting 2 seconds before launching bot...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.warn('⚠️  Failed to delete webhook:', deleteData);
        }
      } else {
        console.log('✅ No webhook set, proceeding with polling mode');
      }
    } catch (fetchErr) {
      console.warn('⚠️  Could not check webhook (network issue):', fetchErr.message);
      console.log('⏭️  Attempting to launch bot anyway...');
    }

    console.log('🚀 Launching bot in polling mode...');
    await bot.launch();
    console.log('🤖 Telegraf bot launched successfully!');
    console.log('📍 Bot is now listening for updates...');
    console.log('Press Ctrl+C to stop.');
  } catch (err) {
    console.error('❌ Failed to launch Telegraf bot:', err);
    console.error('💡 Tip: If you see "409 Conflict", delete the webhook at:');
    console.error('   https://lambent-pithivier-68ddb6.netlify.app/telegram-setup.html');
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