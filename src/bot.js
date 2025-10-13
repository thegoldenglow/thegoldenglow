import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('Welcome to The Golden Glow! ✨');
});

export default bot;