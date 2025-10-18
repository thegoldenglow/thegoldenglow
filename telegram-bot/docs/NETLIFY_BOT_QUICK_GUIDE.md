# 🚀 Netlify Bot Deployment - Quick Guide

## ⚡ 3-Minute Setup

### 1️⃣ Add Bot Token to Netlify (2 min)

1. Go to: **Netlify Dashboard** → **Your Site** → **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Add these two variables:

```
TELEGRAM_BOT_TOKEN = <copy from your .env file>
VITE_TELEGRAM_BOT_TOKEN = <copy from your .env file>
```

4. Click **Save**

### 2️⃣ Push to GitHub (30 sec)

```bash
git push origin main
```

Your site will automatically deploy.

### 3️⃣ Set Webhook (30 sec)

After deployment completes, visit:
```
https://your-site.netlify.app/telegram/set-final-clean-webhook
```

Click the link or make a POST request.

### 4️⃣ Test Bot (immediate)

Open Telegram → Find your bot → Send: `/start`

✅ **Done!** Your bot is now live 24/7 on Netlify!

---

## 🔧 Commands Reference

| Action | Command |
|--------|---------|
| **Set webhook** | `POST https://your-site.netlify.app/telegram/set-final-clean-webhook` |
| **Check webhook** | `GET https://api.telegram.org/bot<TOKEN>/getWebhookInfo` |
| **Delete webhook** | `GET https://api.telegram.org/bot<TOKEN>/deleteWebhook` |
| **Run setup helper** | `.\setup-netlify-bot.ps1` |

---

## ⚠️ Important Notes

### Same Bot Token
✅ Use the **exact same bot token** from your `.env` file in Netlify  
✅ This ensures it's the same bot running locally and on Netlify  

### Local vs Production
- **Local:** Bot uses polling (`npm run dev`)
- **Netlify:** Bot uses webhooks (automatic)
- **Same bot, different methods!**

### After Adding Environment Variables
⚠️ **Must redeploy** for changes to take effect:
```bash
git commit --allow-empty -m "Update env vars" && git push
```

### Stop Local Bot When Testing Netlify
To avoid conflicts:
```bash
# Only run frontend locally
npm run dev:frontend
```

---

## 🎯 Verification Checklist

- [ ] Bot token added to Netlify environment variables
- [ ] Site deployed/redeployed after adding env vars
- [ ] Webhook set via `/telegram/set-final-clean-webhook`
- [ ] Bot responds to `/start` in Telegram
- [ ] Netlify function logs show no errors

---

## 🆘 Quick Troubleshooting

### Bot not responding?
1. Check env vars are set in Netlify ✓
2. Redeploy after adding env vars ✓
3. Set webhook again ✓
4. Check Netlify function logs ✓

### "Missing TELEGRAM_BOT_TOKEN" error?
- Add the variable in Netlify dashboard
- **Trigger a redeploy** (env changes need redeploy)

### Want to reset webhook?
```bash
# Delete webhook
curl https://api.telegram.org/bot<YOUR_TOKEN>/deleteWebhook

# Set it again
curl -X POST https://your-site.netlify.app/telegram/set-final-clean-webhook
```

---

## 📚 More Info

- **Detailed Guide:** `NETLIFY_BOT_DEPLOYMENT_CHECKLIST.md`
- **Full Setup:** `NETLIFY_TELEGRAM_SETUP.md`
- **Helper Script:** `setup-netlify-bot.ps1`

---

**Your bot will run 24/7 on Netlify with zero maintenance! 🎉`
