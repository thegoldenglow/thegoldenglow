import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
// Optional local override to handle encoding issues or local-only secrets
dotenv.config({ path: '.env.local', override: true });

const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(token);

// Required channel to join before playing
const REQUIRED_CHANNEL = process.env.TELEGRAM_REQUIRED_CHANNEL || '@GoldenGlowGlobal';
const REQUIRED_CHANNEL_ID = process.env.TELEGRAM_REQUIRED_CHANNEL_ID; // e.g. -1001234567890
const REQUIRED_CHAT = REQUIRED_CHANNEL_ID ? Number(REQUIRED_CHANNEL_ID) : REQUIRED_CHANNEL;
const CHANNEL_URL = `https://t.me/${REQUIRED_CHANNEL.replace('@','')}`;

// Cache for resolved numeric chat id (for reliability)
let RESOLVED_CHAT_ID = REQUIRED_CHANNEL_ID ? Number(REQUIRED_CHANNEL_ID) : null;

async function resolveChannelId(telegram) {
  if (RESOLVED_CHAT_ID) return RESOLVED_CHAT_ID;
  try {
    const chat = await telegram.getChat(REQUIRED_CHANNEL);
    if (chat?.id) {
      RESOLVED_CHAT_ID = Number(chat.id);
      return RESOLVED_CHAT_ID;
    }
  } catch (e) {
    // Non-fatal: we’ll fall back to username-based checks
    console.warn('Could not resolve channel id via getChat:', e?.response?.description || e?.message || e);
  }
  return null;
}

// Helper: check if a user is a member of the required channel
async function checkRequiredChannelMember(telegram, userId) {
  try {
    const chatId = (await resolveChannelId(telegram)) || REQUIRED_CHAT;
    const res = await telegram.getChatMember(chatId, userId);
    const status = res?.status; // 'creator','administrator','member','restricted','left','kicked'
    const isRestrictedMember = status === 'restricted' && res?.is_member !== false;
    return { isMember: ['member', 'administrator', 'creator'].includes(status) || isRestrictedMember, error: null };
  } catch (err) {
    console.error('Membership check error:', err);
    const apiError = err?.response?.description || err?.message || 'Unknown error';
    return { isMember: false, error: apiError };
  }
}

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
bot.start(async (ctx) => {
  const payload = ctx.startPayload || '';
  const name = ctx.from?.first_name ? `, ${ctx.from.first_name}` : '';
  const userId = ctx.from?.id;

  const { isMember, error } = userId ? await checkRequiredChannelMember(ctx.telegram, userId) : { isMember: false, error: null };

  if (isMember) {
    const text = [
      `Welcome to The Golden Glow${name}! ✨`,
      'You are subscribed to our official channel. You can play the game now.',
      payload ? `Deep link payload: ${payload}` : ''
    ].filter(Boolean).join('\n\n');

    await ctx.reply(text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Follow Golden Glow', url: CHANNEL_URL }]
        ]
      }
    });
  } else {
    const text = [
      `Welcome to The Golden Glow${name}! ✨`,
      'To play, please follow our official channel first:',
      CHANNEL_URL,
      'After joining, tap “I\'ve joined ✅” below to unlock the game.',
      error?.includes('member list is inaccessible')
        ? 'Note: Verification requires the bot to be an admin of the channel. Please add @TheGoldenGlow_bot as an admin in @GoldenGlowGlobal and try again.'
        : ''
    ].join('\n\n');

    await ctx.reply(text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Follow Golden Glow', url: CHANNEL_URL }],
          [{ text: "I've joined ✅", callback_data: 'check_membership' }]
        ]
      }
    });
  }
});

// Callback to re-check membership after the user joins the channel
bot.action('check_membership', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const userId = ctx.from?.id;
    const { isMember, error } = userId ? await checkRequiredChannelMember(ctx.telegram, userId) : { isMember: false, error: null };

    if (isMember) {
      await ctx.editMessageText(
        'Thanks for joining! You are now subscribed and can play the game. 🎮',
      );
    } else {
      const message = [
        'Still not detected as a member yet. Please ensure you joined the channel, then tap “I\'ve joined ✅” again.',
        error?.includes('member list is inaccessible')
          ? 'Verification requires the bot to be an admin of the channel. Please add @TheGoldenGlow_bot as an admin in @GoldenGlowGlobal and try again.'
          : ''
      ].filter(Boolean).join('\n\n');

      await ctx.reply(message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Follow Golden Glow', url: CHANNEL_URL }],
            [{ text: "I've joined ✅", callback_data: 'check_membership' }]
          ]
        }
      });
    }
  } catch (err) {
    console.error('check_membership error:', err);
    await ctx.reply('Error checking membership. Please try again.');
  }
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