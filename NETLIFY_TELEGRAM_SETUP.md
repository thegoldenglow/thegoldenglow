# Netlify Telegram Bot Setup Guide

This guide will help you deploy The Golden Glow with a fully functional Telegram bot on Netlify.

## 🚨 Important: Why Your Bot Doesn't Work on Netlify

Netlify is a **static hosting platform** and cannot run continuous processes like the Telegram bot polling that works locally with `npm run dev`. Instead, you must use **webhooks** where Telegram sends updates to your serverless function.

## ✅ Solution: Webhook-Based Bot

I've created a complete webhook-based implementation using Netlify Functions.

---

## 📋 Setup Steps

### Step 1: Environment Variables

Add these environment variables in your Netlify dashboard (`Site settings` → `Environment variables`):

**Required:**
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token from [@BotFather](https://t.me/BotFather)

**Optional:**
- `TELEGRAM_REQUIRED_CHANNEL` - Channel username (default: `@GoldenGlowGlobal`)
- `TELEGRAM_SKIP_MEMBERSHIP_CHECK` - Set to `true` to skip membership verification
- `TELEGRAM_BOT_USERNAME` - Your bot username (e.g., `TheGoldenGlow_bot`)
- `VITE_APP_URL` - Your deployed app URL (auto-detected from Netlify)

### Step 2: Deploy to Netlify

```bash
# Build your app
npm run build

# Deploy to Netlify
netlify deploy --prod
```

Or connect your GitHub repository to Netlify for automatic deployments.

### Step 3: Configure the Webhook

After deployment, visit your site:

```
https://your-site.netlify.app/telegram-setup.html
```

Click **"Set Bot Webhook"** to configure your bot.

### Step 4: Test Your Bot

Send `/start` to your Telegram bot. You should now see all commands working!

---

## 🎯 Available Bot Commands

Your bot now supports all these commands on Netlify:

- `/start` - Welcome message with channel verification
- `/help` - Show all available commands
- `/referral` - Get your referral link
- `/stats` - View game statistics
- `/support` - Get support link
- `/settings` - Bot settings

---

## 🔧 How It Works

### Local Development (Polling)
```bash
npm run dev
```
- Runs `start-dev.mjs` which starts both Vite and the Telegram bot
- Bot uses **polling** to fetch updates from Telegram
- Works only when your computer is running

### Production on Netlify (Webhooks)
- Telegram sends updates to `/.netlify/functions/telegram-bot-webhook`
- Serverless function processes the update using Telegraf
- No continuous process needed
- Works 24/7 automatically

---

## 📂 Files Created

### Netlify Functions
- `netlify/functions/telegram-bot-webhook.js` - Main webhook handler with full bot logic
- `netlify/functions/set-bot-webhook.js` - Setup endpoint to configure webhook
- `netlify/functions/final-clean-webhook.js` - Legacy simple webhook (optional)

### Configuration
- `netlify.toml` - Redirects for webhook endpoints
- `public/telegram-setup.html` - Web interface for webhook management

### Local Development
- `start-dev.mjs` - Runs both Vite and Telegram bot locally
- `src/bot.js` - Shared bot logic (used locally)

---

## 🔍 Troubleshooting

### Bot Not Responding

1. **Check Environment Variables**
   - Go to Netlify dashboard → Site settings → Environment variables
   - Verify `TELEGRAM_BOT_TOKEN` is set correctly
   - Redeploy after adding/changing variables

2. **Check Webhook Status**
   - Visit `/telegram-setup.html`
   - Click "Check Current Webhook"
   - Ensure it points to your Netlify site

3. **Check Function Logs**
   - Go to Netlify dashboard → Functions
   - Click on `telegram-bot-webhook`
   - Check logs for errors

### "Webhook not found" Error

The webhook URL should be:
```
https://your-site.netlify.app/.netlify/functions/telegram-bot-webhook
```

If it's different, reset it using `/telegram-setup.html`

### Bot Commands Not Updating

After deploying changes:
1. Visit `/telegram-setup.html`
2. Click "Delete Webhook"
3. Click "Set Bot Webhook" again
4. Wait 1-2 minutes for Telegram to update

### Membership Check Failing

If you see errors about "member list is inaccessible":
1. Add your bot as an **administrator** in the required channel
2. Give it "Read Messages" permission
3. Or set `TELEGRAM_SKIP_MEMBERSHIP_CHECK=true` to disable verification

---

## 🚀 Deployment Checklist

- [ ] Add `TELEGRAM_BOT_TOKEN` to Netlify environment variables
- [ ] Deploy site to Netlify
- [ ] Visit `/telegram-setup.html`
- [ ] Click "Set Bot Webhook"
- [ ] Verify webhook is set correctly
- [ ] Test bot with `/start` command
- [ ] Verify all commands work (`/help`, `/referral`, etc.)
- [ ] Test channel membership verification
- [ ] Check Netlify function logs for errors

---

## 💡 Development Workflow

### Local Development with Bot
```bash
# Terminal 1: Backend server
npm run start

# Terminal 2: Frontend + Telegram bot
npm run dev
```

Both Vite and the Telegram bot will run together!

### Testing Locally Without Bot
```bash
# Only frontend
npm run dev:frontend

# Only bot
npm run dev:bot
```

### Deploy to Production
```bash
npm run build
netlify deploy --prod
```

Then set the webhook via `/telegram-setup.html`

---

## 🎮 What's Different From Local?

| Feature | Local Development | Netlify Production |
|---------|------------------|-------------------|
| Bot Mode | Polling | Webhooks |
| Runs When | Your computer is on | 24/7 automatically |
| Configuration | `.env` file | Netlify env vars |
| Setup | Automatic with `npm run dev` | One-time webhook setup |
| Updates | Instant | Requires redeploy |

---

## 🔐 Security Notes

- Never commit `.env` files with your bot token
- Use Netlify environment variables for production tokens
- The webhook handler validates all incoming requests
- Consider adding webhook secret validation for extra security

---

## ✨ Benefits of This Setup

1. **Works 24/7** - No need to keep your computer running
2. **Serverless** - Only pays for actual usage
3. **Scalable** - Handles unlimited users automatically
4. **Fast** - Instant response to user commands
5. **Reliable** - Netlify's global CDN ensures uptime

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Netlify function logs
3. Verify all environment variables are set
4. Test with `/telegram-setup.html`

Your bot should now work perfectly on Netlify! 🎉
