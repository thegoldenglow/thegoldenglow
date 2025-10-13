import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
// Optional local override to handle encoding issues or local-only secrets
dotenv.config({ path: '.env.local', override: true });

const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;

async function main() {
  if (!token) {
    console.error('Telegram bot token is not set. Add TELEGRAM_BOT_TOKEN or VITE_TELEGRAM_BOT_TOKEN in .env or .env.local (UTF-8).');
    process.exit(1);
  }

  const base = `https://api.telegram.org/bot${token}`;

  const getMe = await fetch(`${base}/getMe`).then(r => r.json());
  if (!getMe.ok) {
    console.error('getMe failed:', getMe.description);
    process.exit(1);
  }
  console.log('Bot identity:', getMe.result.username, `(id: ${getMe.result.id})`);

  const getCommands = await fetch(`${base}/getMyCommands`).then(r => r.json());
  if (!getCommands.ok) {
    console.error('getMyCommands failed:', getCommands.description);
    process.exit(1);
  }
  console.log('Registered commands:', getCommands.result.map(c => `/${c.command}`).join(', '));

  console.log('Bot API connectivity OK. You can now send /start to the bot in Telegram.');
}

main().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});