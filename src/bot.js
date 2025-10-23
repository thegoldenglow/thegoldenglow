import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
// Optional local override to handle encoding issues or local-only secrets
dotenv.config({ path: '.env.local', override: true });

const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
// Allow bypassing membership check when Telegram restricts member list access
const SKIP_MEMBERSHIP_CHECK =
  (process.env.TELEGRAM_SKIP_MEMBERSHIP_CHECK === 'true') ||
  (process.env.VITE_TELEGRAM_SKIP_MEMBERSHIP_CHECK === 'true');
const bot = new Telegraf(token);

// Required channel to join before playing
const REQUIRED_CHANNEL = process.env.TELEGRAM_REQUIRED_CHANNEL || '@GoldenGlowGlobal';
const REQUIRED_CHANNEL_ID = process.env.TELEGRAM_REQUIRED_CHANNEL_ID; // e.g. -1001234567890
const REQUIRED_CHAT = REQUIRED_CHANNEL_ID ? Number(REQUIRED_CHANNEL_ID) : REQUIRED_CHANNEL;
const CHANNEL_URL = `https://t.me/${REQUIRED_CHANNEL.replace('@','')}`;

// Web App URL for the menu button
const WEB_APP_URL = process.env.TELEGRAM_WEB_APP_URL || 
                    process.env.VITE_TELEGRAM_WEB_APP_URL || 
                    'https://lambent-pithivier-68ddb6.netlify.app';

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
    if (SKIP_MEMBERSHIP_CHECK) {
      return { isMember: true, error: null };
    }
    const chatId = (await resolveChannelId(telegram)) || REQUIRED_CHAT;
    const res = await telegram.getChatMember(chatId, userId);
    const status = res?.status; // 'creator','administrator','member','restricted','left','kicked'
    const isRestrictedMember = status === 'restricted' && res?.is_member !== false;
    return { isMember: ['member', 'administrator', 'creator'].includes(status) || isRestrictedMember, error: null };
  } catch (err) {
    console.error('Membership check error:', err);
    const apiError = err?.response?.description || err?.message || 'Unknown error';
    // If skip is enabled, treat as member to avoid blocking gameplay
    if (SKIP_MEMBERSHIP_CHECK) {
      return { isMember: true, error: apiError };
    }
    return { isMember: false, error: apiError };
  }
}

// Helper: Set menu button to Web App (enable access)
async function enableMenuButton(telegram, userId) {
  try {
    // First, reset to default to force a refresh
    await telegram.setChatMenuButton({
      chat_id: userId,
      menu_button: { type: 'default' }
    });
    
    // Small delay to ensure the change is processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Then set the Web App button
    await telegram.setChatMenuButton({
      chat_id: userId,
      menu_button: {
        type: 'web_app',
        text: '🎮 Golden Glow',
        web_app: { url: WEB_APP_URL }
      }
    });
    console.log(`Menu button enabled for user ${userId}`);
    return true;
  } catch (err) {
    console.error('Error enabling menu button:', err?.response?.description || err?.message || err);
    return false;
  }
}

// Helper: Set menu button to default/commands (disable access)
async function disableMenuButton(telegram, userId) {
  try {
    await telegram.setChatMenuButton({
      chat_id: userId,
      menu_button: {
        type: 'default'
      }
    });
    console.log(`Menu button disabled for user ${userId}`);
    return true;
  } catch (err) {
    console.error('Error disabling menu button:', err?.response?.description || err?.message || err);
    return false;
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

// /start command with deep link payload support - FORCES channel membership
bot.start(async (ctx) => {
  const payload = ctx.startPayload || '';
  const name = ctx.from?.first_name ? `, ${ctx.from.first_name}` : '';
  const userId = ctx.from?.id;

  const { isMember, error } = userId ? await checkRequiredChannelMember(ctx.telegram, userId) : { isMember: false, error: null };

  // Disable the menu button for non-members
  if (!isMember && userId) {
    await disableMenuButton(ctx.telegram, userId);
  }

  // Always require explicit verification via "Check Access" button
  // Don't show Play button on initial /start even if already a member
  const text = [
    `🌟 Welcome to The Golden Glow${name}!`,
    '',
    isMember 
      ? '✅ You are already a member of our channel!'
      : '⚠️ *ACCESS RESTRICTED* ⚠️',
    '',
    '📢 Please verify your membership:',
    `🔗 ${CHANNEL_URL}`,
    '',
    isMember
      ? '👉 Click "Verify & Play" below to access the game'
      : '👉 *Step 1:* Click "Join Channel" button below',
    isMember
      ? ''
      : '👉 *Step 2:* After joining, click "Verify & Play"',
    '',
    error?.includes('member list is inaccessible')
      ? '⚠️ Note: Please add @TheGoldenGlow_bot as an admin in @GoldenGlowGlobal for verification to work properly.'
      : ''
  ].filter(Boolean).join('\n');

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📢 Join Channel', url: CHANNEL_URL }],
        [{ text: '🔍 Verify & Play', callback_data: 'force_check_membership' }]
      ]
    }
  });
});

// Callback to re-check membership after the user joins the channel
bot.action('check_membership', async (ctx) => {
  try {
    const userId = ctx.from?.id;
    const { isMember, error } = userId ? await checkRequiredChannelMember(ctx.telegram, userId) : { isMember: false, error: null };

    if (isMember) {
      // Enable the menu button for verified members
      if (userId) {
        const enabled = await enableMenuButton(ctx.telegram, userId);
        
        // Send a notification to trigger UI refresh
        if (enabled) {
          await ctx.answerCbQuery('✅ Menu button activated! Check the bottom of your chat.', { show_alert: false });
        } else {
          await ctx.answerCbQuery();
        }
      } else {
        await ctx.answerCbQuery();
      }

      // Show success message with Play button
      const text = [
        '🎉 *VERIFIED!* 🎉',
        '',
        '✅ You are now subscribed to our channel.',
        '',
        '🎮 *Menu Button Activated!*',
        'Look at the bottom left of your chat - you should see a "Golden Glow" button.',
        '',
        '_If it doesn\'t appear, try typing any message or close/reopen the chat._',
        '',
        'Or tap the button below to start playing now:'
      ].join('\n');

      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Play Golden Glow', web_app: { url: WEB_APP_URL } }],
            [{ text: '📢 Visit Channel', url: CHANNEL_URL }]
          ]
        }
      });
    } else {
      await ctx.answerCbQuery('❌ Not verified. Please join the channel first.', { show_alert: false });
      
      const message = [
        '❌ Not verified yet.',
        '',
        'Please ensure you joined the channel, then tap "I\'ve joined ✅" again.',
        error?.includes('member list is inaccessible')
          ? '⚠️ Note: Verification requires the bot to be an admin of @GoldenGlowGlobal.'
          : ''
      ].filter(Boolean).join('\n');

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📢 Join Channel', url: CHANNEL_URL }],
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

// Forceful membership check for users who haven't joined
bot.action('force_check_membership', async (ctx) => {
  try {
    const userId = ctx.from?.id;
    const { isMember, error } = userId ? await checkRequiredChannelMember(ctx.telegram, userId) : { isMember: false, error: null };

    if (isMember) {
      // Enable the menu button for verified members
      if (userId) {
        const enabled = await enableMenuButton(ctx.telegram, userId);
        
        // Send a notification to trigger UI refresh
        if (enabled) {
          await ctx.answerCbQuery('✅ Menu button activated! Check the bottom of your chat.', { show_alert: false });
        } else {
          await ctx.answerCbQuery();
        }
      } else {
        await ctx.answerCbQuery();
      }

      const text = [
        '🎉 *ACCESS GRANTED!* 🎉',
        '',
        'Welcome to The Golden Glow! You are now subscribed to our channel.',
        '',
        '🎮 *Menu Button Activated!*',
        'Look at the bottom left of your chat - you should see a "Golden Glow" button.',
        '',
        '_If it doesn\'t appear, try typing any message or close/reopen the chat._',
        '',
        'Or tap the button below to start playing now:'
      ].join('\n');

      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Play Golden Glow', web_app: { url: WEB_APP_URL } }],
            [{ text: '📢 Visit Channel', url: CHANNEL_URL }]
          ]
        }
      });
    } else {
      await ctx.answerCbQuery('❌ Not verified. Please join the channel first.', { show_alert: false });
      const message = [
        '❌ *ACCESS DENIED* ❌',
        '',
        'You are still not a member of our channel.',
        '',
        '📢 *REQUIRED:* Join our official channel first:',
        `🔗 ${CHANNEL_URL}`,
        '',
        '👉 Click "Join Channel" below, then come back and tap "Verify & Play" again.',
        error?.includes('member list is inaccessible')
          ? '⚠️ Note: Please add @TheGoldenGlow_bot as an admin in @GoldenGlowGlobal for verification to work properly.'
          : ''
      ].filter(Boolean).join('\n');

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📢 Join Channel', url: CHANNEL_URL }],
            [{ text: '🔍 Verify & Play', callback_data: 'force_check_membership' }]
          ]
        }
      });
    }
  } catch (err) {
    console.error('force_check_membership error:', err);
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