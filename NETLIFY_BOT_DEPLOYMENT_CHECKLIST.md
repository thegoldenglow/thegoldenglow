# ✅ Netlify Bot Deployment Checklist

## 🎯 Goal: Ensure the Same Telegram Bot Runs on Netlify

Your Telegram bot is currently working locally with polling. This guide ensures the **exact same bot** will work on Netlify using webhooks.

---

## 📋 Pre-Deployment Checklist

### 1. Verify Local Bot Token
✅ **Your bot token is already configured in `.env` file**

Check your local bot token:
```bash
# In your .env file, you should see:
TELEGRAM_BOT_TOKEN=your-bot-token-here
VITE_TELEGRAM_BOT_TOKEN=your-bot-token-here
```

**Important:** Make a note of this token - you'll need to add it to Netlify.

---

## 🚀 Netlify Deployment Steps

### Step 1: Add Bot Token to Netlify Environment Variables

**THIS IS CRITICAL:** You must add your bot token to Netlify for the bot to work.

1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add the following:

   | Variable Name | Value |
   |---------------|-------|
   | `TELEGRAM_BOT_TOKEN` | Copy from your `.env` file |
   | `VITE_TELEGRAM_BOT_TOKEN` | Copy from your `.env` file |

6. Click **Save**

### Step 2: Deploy to Netlify

Your site should automatically deploy when you push to GitHub. If not:

```bash
# Manual deployment
git push origin main
```

Or use Netlify CLI:
```bash
netlify deploy --prod
```

### Step 3: Configure Webhook

After deployment:

1. Visit: `https://your-site.netlify.app/telegram/set-final-clean-webhook`
   
   Or use the POST endpoint directly:
   ```bash
   curl -X POST https://your-site.netlify.app/telegram/set-final-clean-webhook
   ```

2. You should see a success message with the webhook URL

### Step 4: Verify Webhook is Set

Check the webhook status:
```bash
# Visit this URL in your browser:
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

You should see:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-site.netlify.app/.netlify/functions/final-clean-webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

### Step 5: Test Your Bot

1. Open Telegram
2. Find your bot
3. Send `/start`
4. You should receive the welcome message with the play button

---

## 🔍 Verification Commands

### Check if Bot Token is Set in Netlify
```bash
# This will fail if token is not set
curl -X POST https://your-site.netlify.app/telegram/set-final-clean-webhook
```

### Check Current Webhook
```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

### Delete Webhook (if you need to reset)
```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Missing TELEGRAM_BOT_TOKEN" Error

**Solution:** 
- Go to Netlify dashboard → Site settings → Environment variables
- Add `TELEGRAM_BOT_TOKEN` with your bot token
- **Trigger a new deployment** (environment variable changes require redeploy)

### Issue 2: Bot Not Responding on Netlify

**Check:**
1. ✅ Bot token is added to Netlify environment variables
2. ✅ Webhook is set correctly (check with `/getWebhookInfo`)
3. ✅ Site has been redeployed after adding env variables
4. ✅ Netlify function logs show no errors

**Fix:**
```bash
# 1. Delete current webhook
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook

# 2. Set webhook again
curl -X POST https://your-site.netlify.app/telegram/set-final-clean-webhook

# 3. Test bot
# Send /start in Telegram
```

### Issue 3: Works Locally But Not on Netlify

**Reason:** Local uses polling, Netlify uses webhooks.

**Solution:**
1. Ensure webhook is set (Step 3 above)
2. Check Netlify function logs for errors:
   - Netlify dashboard → Functions → `final-clean-webhook` → Logs
3. Verify bot token in Netlify matches your local `.env` token

### Issue 4: Two Bots Responding

**Reason:** Both local bot (polling) and Netlify bot (webhook) are running.

**Solution:**
```bash
# Stop local bot
# Press Ctrl+C in the terminal running npm run dev

# Or use webhook exclusively:
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook
curl -X POST https://your-site.netlify.app/telegram/set-final-clean-webhook
```

---

## 🎮 How Your Bot Works

### Local Development (Current Setup)
- **Mode:** Polling
- **Process:** `scripts/run-telegraf.mjs`
- **Trigger:** `npm run dev`
- **Runs:** While your computer is on
- **Token:** From `.env` file

### Netlify Production (After Deployment)
- **Mode:** Webhook
- **Function:** `netlify/functions/final-clean-webhook.js`
- **Trigger:** Telegram sends updates automatically
- **Runs:** 24/7 on Netlify servers
- **Token:** From Netlify environment variables

### Same Bot, Different Methods
✅ Both use the **same bot token**  
✅ Both handle the **same commands** (`/start`, `/play`, `/help`)  
✅ Both send **identical messages**  
✅ Different only in **how they receive updates** (polling vs webhook)

---

## 📊 Environment Variables Summary

| Variable | Local (.env) | Netlify (Dashboard) | Used By |
|----------|--------------|---------------------|---------|
| `TELEGRAM_BOT_TOKEN` | ✅ Required | ✅ Required | Backend/Bot |
| `VITE_TELEGRAM_BOT_TOKEN` | ✅ Required | ✅ Required | Frontend |
| `VITE_SUPABASE_URL` | ✅ Required | ✅ Required | Database |
| `VITE_SUPABASE_ANON_KEY` | ✅ Required | ✅ Required | Database |

**Critical:** All variables in `.env` must be added to Netlify environment variables.

---

## 🚦 Deployment Status Check

Run these checks after deployment:

### 1. ✅ Netlify Site is Live
```bash
curl https://your-site.netlify.app
# Should return your site HTML
```

### 2. ✅ Webhook Function Exists
```bash
curl https://your-site.netlify.app/.netlify/functions/final-clean-webhook
# Should return: Method Not Allowed (this is good - it means function exists)
```

### 3. ✅ Webhook is Configured
```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
# Should show your Netlify URL
```

### 4. ✅ Bot Responds
- Open Telegram
- Send `/start` to your bot
- Should receive welcome message immediately

---

## 💡 Pro Tips

1. **Keep Local Bot Off During Netlify Testing**
   - Only run `npm run dev:frontend` locally
   - Test bot functionality through Netlify

2. **Monitor Netlify Function Logs**
   - See real-time bot activity
   - Catch errors immediately
   - Track user interactions

3. **Use Different Bots for Dev and Prod**
   - Create a separate test bot for local development
   - Use production bot only on Netlify
   - Prevents conflicts and confusion

4. **Redeploy After Environment Changes**
   - Environment variables changes require redeployment
   - Use: `git commit --allow-empty -m "Trigger redeploy" && git push`

---

## 🎯 Quick Reference Commands

```bash
# Check webhook status
curl https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo

# Set webhook to Netlify
curl -X POST https://your-site.netlify.app/telegram/set-final-clean-webhook

# Delete webhook (for local testing)
curl https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook

# Test Netlify function directly
curl -X POST https://your-site.netlify.app/.netlify/functions/final-clean-webhook \
  -H "Content-Type: application/json" \
  -d '{"message":{"chat":{"id":123},"text":"/start"}}'
```

---

## ✅ Final Verification

Before considering deployment complete:

- [ ] Bot token added to Netlify environment variables
- [ ] Site deployed successfully
- [ ] Webhook set and confirmed via `/getWebhookInfo`
- [ ] `/start` command works in Telegram
- [ ] `/play` command works and opens the game
- [ ] `/help` command shows all commands
- [ ] No errors in Netlify function logs
- [ ] Local bot stopped to avoid conflicts

---

## 🎉 Success!

If all checks pass, your bot is now running on Netlify 24/7 using the same configuration as your local setup!

The bot will:
- ✅ Respond instantly to all users
- ✅ Work 24/7 without your computer running
- ✅ Scale automatically to handle any number of users
- ✅ Use the exact same bot token and commands as local

---

## 📞 Need Help?

1. Check Netlify function logs
2. Verify environment variables are set
3. Confirm webhook is pointing to your Netlify site
4. Review the `NETLIFY_TELEGRAM_SETUP.md` guide
