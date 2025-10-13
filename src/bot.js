import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(token);

// Register bot commands (shown in Telegram UI) if token exists
if (token) {
  bot.telegram
    .setMyCommands([
      { command: 'start', description: 'Start Golden Glow' },
      { command: 'help', description: 'How to play & commands' },
      { command: 'referral', description: 'Get your referral link' },
      { command: 'stats', description: 'View your game stats' },
      { command: 'support', description: 'Contact support' },
      { command: 'settings', description: 'Adjust preferences' },
    ])
    .catch((err) => console.error('Failed to set bot commands:', err));
}

// Global error handler for bot middleware
bot.catch((err, ctx) => {
  console.error('Telegram bot error:', err);
});

// /start command with deep link payload support
bot.start((ctx) => {
  const payload = ctx.startPayload || '';
  const name = ctx.from?.first_name ? `, ${ctx.from.first_name}` : '';
  let text = `Welcome to The Golden Glow${name}! ✨\n\nPlay the mini-game and earn rewards.`;
  if (payload) {
    text += `\n\nDeep link payload: ${payload}`;
  }
  ctx.reply(text);
});

// /help command
bot.help((ctx) => {
  ctx.reply([
    'Golden Glow Bot Commands:',
    '/start – Begin and get the intro',
    '/help – Show this help',
    '/referral – Get your referral link',
    '/stats – View your game stats',
    '/support – Contact support',
    '/settings – Bot preferences',
  ].join('\n'));
});

// /settings command (placeholder)
bot.command('settings', (ctx) => ctx.reply('Settings are coming soon.'));

// /support command
bot.command('support', (ctx) => ctx.reply('Support: https://t.me/GoldenGlowGlobal'));

// /referral command – generate a simple deep link referral
bot.command('referral', (ctx) => {
  const userId = ctx.from?.id;
  const ref = userId ? `ref_${userId}` : 'ref_unknown';
  ctx.reply(`Share your referral link:\nhttps://t.me/TheGoldenGlow_bot?start=${ref}`);
});

// /stats command (placeholder)
bot.command('stats', (ctx) => {
  ctx.reply('Your stats feature is coming soon. Open the mini app to view more.');
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;