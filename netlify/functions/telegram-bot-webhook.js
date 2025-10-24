import { Telegraf } from 'telegraf';

// Initialize bot with token from environment
const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('Missing TELEGRAM_BOT_TOKEN in Netlify environment variables');
}

const bot = token ? new Telegraf(token) : {
  start: () => {},
  action: () => {},
  command: () => {},
  help: () => {},
  catch: () => {},
  handleUpdate: async () => {}
};

// Configuration
const REQUIRED_CHANNEL = process.env.TELEGRAM_REQUIRED_CHANNEL || '@GoldenGlowGlobal';
const SKIP_MEMBERSHIP_CHECK = process.env.TELEGRAM_SKIP_MEMBERSHIP_CHECK === 'true';
const CHANNEL_URL = `https://t.me/${REQUIRED_CHANNEL.replace('@', '')}`;
const WEB_APP_URL = process.env.TELEGRAM_WEB_APP_URL 
  || process.env.VITE_TELEGRAM_WEB_APP_URL 
  || process.env.VITE_APP_URL 
  || 'https://lambent-pithivier-68ddb6.netlify.app';

// Helper: check if user is a member
async function checkRequiredChannelMember(telegram, userId) {
  try {
    if (SKIP_MEMBERSHIP_CHECK) {
      return { isMember: true, error: null };
    }
    const res = await telegram.getChatMember(REQUIRED_CHANNEL, userId);
    const status = res?.status;
    const isRestrictedMember = status === 'restricted' && res?.is_member !== false;
    return { 
      isMember: ['member', 'administrator', 'creator'].includes(status) || isRestrictedMember, 
      error: null 
    };
  } catch (err) {
    console.error('Membership check error:', err);
    const apiError = err?.response?.description || err?.message || 'Unknown error';
    if (SKIP_MEMBERSHIP_CHECK) {
      return { isMember: true, error: apiError };
    }
    return { isMember: false, error: apiError };
  }
}

// /start command
bot.start(async (ctx) => {
  const payload = ctx.startPayload || '';
  const name = ctx.from?.first_name ? `, ${ctx.from.first_name}` : '';
  const userId = ctx.from?.id;

  const { isMember, error } = userId ? await checkRequiredChannelMember(ctx.telegram, userId) : { isMember: false, error: null };

  if (isMember) {
    const text = [
      `🌟 Welcome to The Golden Glow${name}! ✨`,
      '🎮 You are subscribed to our official channel and can now play the game!',
      'Tap the button below to start playing:',
      payload ? `Your referral code: ${payload}` : ''
    ].filter(Boolean).join('\n\n');

    await ctx.reply(text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Play Golden Glow', web_app: { url: WEB_APP_URL } }],
          [{ text: '📢 Visit Channel', url: CHANNEL_URL }]
        ]
      }
    });
  } else {
    const text = [
      `🌟 Welcome to The Golden Glow${name}!`,
      '',
      '⚠️ *ACCESS RESTRICTED* ⚠️',
      '',
      '📢 You MUST join our official channel first:',
      `🔗 ${CHANNEL_URL}`,
      '',
      '👉 *Step 1:* Click the "Join Channel" button below',
      '👉 *Step 2:* After joining, click "Check Access"',
      '',
      '❌ You cannot use this bot until you join the channel.',
      error?.includes('member list is inaccessible')
        ? '⚠️ Note: Please add the bot as an admin in the channel for verification to work properly.'
        : ''
    ].filter(Boolean).join('\n');

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📢 Join Channel', url: CHANNEL_URL }],
          [{ text: '🔍 Check Access', callback_data: 'force_check_membership' }]
        ]
      }
    });
  }
});

// Callback queries
bot.action('check_membership', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const userId = ctx.from?.id;
    const { isMember, error } = userId ? await checkRequiredChannelMember(ctx.telegram, userId) : { isMember: false, error: null };

    if (isMember) {
      await ctx.editMessageText(
        '✅ Thanks for joining! You are now subscribed and can play the game. 🎮',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Play Golden Glow', web_app: { url: WEB_APP_URL } }]
            ]
          }
        }
      );
    } else {
      const message = [
        'Still not detected as a member yet. Please ensure you joined the channel, then tap "I\'ve joined ✅" again.',
        error?.includes('member list is inaccessible')
          ? 'Verification requires the bot to be an admin of the channel. Please add the bot as an admin and try again.'
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

bot.action('force_check_membership', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const userId = ctx.from?.id;
    const { isMember, error } = userId ? await checkRequiredChannelMember(ctx.telegram, userId) : { isMember: false, error: null };

    if (isMember) {
      const text = [
        '🎉 *ACCESS GRANTED!* 🎉',
        '',
        'Welcome to The Golden Glow! You are now subscribed to our channel.',
        'Tap the button below to start playing:'
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
      const message = [
        '❌ *ACCESS DENIED* ❌',
        '',
        'You are still not a member of our channel.',
        '',
        '📢 *REQUIRED:* Join our official channel first:',
        `🔗 ${CHANNEL_URL}`,
        '',
        '👉 Click "Join Channel" below, then come back and tap "Check Access" again.',
        error?.includes('member list is inaccessible')
          ? '⚠️ Note: Please add the bot as an admin in the channel for verification to work properly.'
          : ''
      ].filter(Boolean).join('\n');

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📢 Join Channel', url: CHANNEL_URL }],
            [{ text: '🔍 Check Access', callback_data: 'force_check_membership' }]
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
    '🎮 *Golden Glow Bot Commands:*',
    '',
    '/start – Begin and get the intro',
    '/help – Show this help',
    '/referral – Get your referral link',
    '/stats – View your game stats',
    '/support – Contact support',
    '/settings – Bot preferences',
  ].join('\n'), { parse_mode: 'Markdown' });
});

// /settings command
bot.command('settings', (ctx) => ctx.reply('⚙️ Settings are coming soon.'));

// /support command
bot.command('support', (ctx) => ctx.reply(`📞 Support: ${CHANNEL_URL}`));

// /referral command
bot.command('referral', (ctx) => {
  const userId = ctx.from?.id;
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'TheGoldenGlow_bot';
  const ref = userId ? `ref_${userId}` : 'ref_unknown';
  ctx.reply(
    `🎁 *Share your referral link:*\n\nhttps://t.me/${botUsername}?start=${ref}\n\n💰 Earn rewards when friends join!`,
    { parse_mode: 'Markdown' }
  );
});

// /stats command
bot.command('stats', (ctx) => {
  ctx.reply('📊 Your stats feature is coming soon. Open the mini app to view more.');
});

// Global error handler
bot.catch((err, ctx) => {
  console.error('Telegram bot error:', err);
});

// Netlify function handler
export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Optional secret verification when set via setWebhook?secret_token=...
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret) {
      const headers = event.headers || {};
      const got = headers['x-telegram-bot-api-secret-token'] || headers['X-Telegram-Bot-Api-Secret-Token'];
      if (got !== expectedSecret) {
        console.warn('Rejected Telegram webhook: invalid secret token');
        return { statusCode: 401, body: 'Unauthorized' };
      }
    }

    if (!token) {
      console.error('Missing TELEGRAM_BOT_TOKEN in Netlify environment');
      return { 
        statusCode: 500, 
        body: JSON.stringify({ ok: false, error: 'Missing bot token' }) 
      };
    }

    // Parse the webhook update
    const raw = event.body || '{}';
    const payloadStr = event.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw;
    const update = JSON.parse(payloadStr);

    console.log('Webhook update received:', update?.message?.text || update?.callback_query?.data || 'unknown');

    // Handle the update using Telegraf
    await bot.handleUpdate(update);

    return { 
      statusCode: 200, 
      body: JSON.stringify({ ok: true }) 
    };
  } catch (err) {
    console.error('Webhook error:', err);
    return { 
      statusCode: 200, 
      body: JSON.stringify({ ok: false, error: err?.message || 'Internal Error' }) 
    };
  }
};
