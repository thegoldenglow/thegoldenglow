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
    await bot.launch();
    console.log('Telegraf bot launched via long polling');
    console.log('Press Ctrl+C to stop.');
  } catch (err) {
    console.error('Failed to launch Telegraf bot:', err);
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