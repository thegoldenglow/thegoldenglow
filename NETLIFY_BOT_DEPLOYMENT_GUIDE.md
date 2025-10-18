# 🚀 Complete Netlify Telegram Bot Deployment Guide

## ⚠️ **IMPORTANT: Netlify vs Local Differences**

| Aspect | Local (`npm start`) | Netlify Production |
|--------|-------------------|-------------------|
| **Bot Type** | Long Polling | Webhook-based |
| **Process** | Continuous running process | Serverless functions |
| **Startup** | Automatic with `npm start` | Manual webhook setup required |
| **Server** | Your local machine | Netlify's serverless infrastructure |

## 📋 **Step-by-Step Deployment Process**

### **Step 1: Prepare Your Environment Variables**

1. Go to your Netlify Dashboard
2. Select your site
3. Navigate to **Site settings** → **Environment variables**
4. Add these variables:

```env
# REQUIRED
TELEGRAM_BOT_TOKEN=your_bot_token_here

# OPTIONAL (but recommended)
TELEGRAM_REQUIRED_CHANNEL=@GoldenGlowGlobal
TELEGRAM_SKIP_MEMBERSHIP_CHECK=false
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### **Step 2: Deploy Your Site**

#### Option A: Via GitHub (Recommended)
1. Push your code to GitHub
2. Connect your repo to Netlify
3. Netlify will auto-deploy on each push

#### Option B: Manual Deploy
```bash
# Build locally
npm run build

# Deploy using Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### **Step 3: Configure the Telegram Webhook** 🔔

**This is the crucial step that makes your bot work on Netlify!**

After deployment, you need to tell Telegram where to send bot messages:

1. **Open the Setup Page:**
   ```
   https://your-site-name.netlify.app/telegram-setup.html
   ```

2. **Click "Set Bot Webhook"**
   - This configures Telegram to send all bot updates to your Netlify function
   - You should see: "✅ Telegram bot webhook set successfully!"

3. **Verify Setup:**
   - Click "Check Current Webhook"
   - You should see your webhook URL pointing to:
     ```
     https://your-site-name.netlify.app/.netlify/functions/telegram-bot-webhook
     ```

### **Step 4: Test Your Bot**

1. Open Telegram
2. Search for your bot: `@YourBotUsername`
3. Send `/start`
4. The bot should respond with the welcome message!

## 🔧 **How It Works on Netlify**

### **The Webhook Flow:**
```
User sends message → Telegram API → Your Netlify Function → Bot processes → Reply to user
```

### **Key Files:**
- **`netlify/functions/telegram-bot-webhook.js`** - Main bot logic (handles all commands)
- **`netlify/functions/set-bot-webhook.js`** - Sets up the webhook
- **`netlify.toml`** - Routes configuration
- **`public/telegram-setup.html`** - Web interface for webhook management

## 🔍 **Troubleshooting**

### **Bot Not Responding?**

1. **Check Webhook Status:**
   - Visit: `https://your-site.netlify.app/telegram-setup.html`
   - Click "Check Current Webhook"
   - Ensure URL is correct

2. **Verify Environment Variables:**
   - Go to Netlify Dashboard → Site settings → Environment variables
   - Ensure `TELEGRAM_BOT_TOKEN` is set correctly

3. **Check Function Logs:**
   - Netlify Dashboard → Functions tab
   - Look for `telegram-bot-webhook` function
   - Check recent invocations for errors

4. **Re-set the Webhook:**
   ```
   https://your-site.netlify.app/telegram-setup.html
   → Click "Set Bot Webhook"
   ```

### **Common Issues:**

| Problem | Solution |
|---------|----------|
| "Method Not Allowed" | Webhook not set. Run setup from `/telegram-setup.html` |
| "Missing bot token" | Add `TELEGRAM_BOT_TOKEN` to Netlify environment variables |
| Bot works locally but not on Netlify | You need to set the webhook after each deployment |
| "member list is inaccessible" | Add bot as admin to your Telegram channel |

## 📝 **Webhook Management Commands**

### **Via Setup Page:**
- **Set Webhook:** `https://your-site.netlify.app/telegram-setup.html`
- **Check Status:** Click "Check Current Webhook" button
- **Delete Webhook:** Click "Delete Webhook" button

### **Via API (Advanced):**
```bash
# Set webhook manually
curl -X POST https://your-site.netlify.app/.netlify/functions/set-bot-webhook

# Check webhook info
curl -X POST https://your-site.netlify.app/.netlify/functions/telegram-webhook-info
```

## ✅ **Verification Checklist**

- [ ] Environment variables added to Netlify
- [ ] Site deployed successfully
- [ ] Webhook configured via `/telegram-setup.html`
- [ ] Bot responds to `/start` command
- [ ] Channel membership verification working
- [ ] All bot commands functional

## 🔄 **After Each Deployment**

**Important:** The webhook URL remains the same, so you typically don't need to reset it after each deployment. However, if your bot stops working:

1. Visit `/telegram-setup.html`
2. Click "Check Current Webhook" 
3. If needed, click "Set Bot Webhook" again

## 📊 **Monitoring**

- **Function Logs:** Netlify Dashboard → Functions → `telegram-bot-webhook`
- **Bot Status:** Send `/start` to your bot
- **Webhook Info:** `/telegram-setup.html` → "Check Current Webhook"

## 🎯 **Success Indicators**

Your bot is working correctly on Netlify when:
- ✅ Webhook is set to your Netlify function URL
- ✅ Bot responds to all commands
- ✅ Channel verification works
- ✅ No errors in Netlify function logs

---

**Need Help?** 
- Check function logs in Netlify Dashboard
- Verify webhook status at `/telegram-setup.html`
- Ensure all environment variables are set correctly
