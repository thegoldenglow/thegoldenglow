# 🤖 Telegram Bot (Golden Glow)

A standalone directory with bot code, webhook handlers, and documentation. Use this to run the Telegram bot locally (polling) and reference production webhook setup.

---

## 📂 Structure

```
telegram-bot/
  ├─ src/
  │  └─ bot.js                      # Telegraf bot logic (polling-friendly)
  ├─ functions/                     # Webhook function handlers (reference)
  │  ├─ telegram-bot-webhook.js     # Full Telegraf webhook handler
  │  ├─ final-clean-webhook.js      # Minimal webhook with verification
  │  ├─ set-bot-webhook.js          # Set webhook endpoint
  │  ├─ set-final-clean-webhook.js  # Set minimal webhook endpoint
  │  ├─ telegram-webhook-info.js    # Check webhook info
  │  └─ verify-telegram-membership.js
  ├─ docs/                          # Docs copied from project
  │  ├─ NETLIFY_TELEGRAM_SETUP.md
  │  ├─ NETLIFY_BOT_DEPLOYMENT_CHECKLIST.md
  │  ├─ NETLIFY_BOT_QUICK_GUIDE.md
  │  ├─ README_BOT_CONFIGURATION.md
  │  ├─ CHANNEL_VERIFICATION_GUIDE.md
  │  ├─ CHANNEL_VERIFICATION_SETUP.md
  │  ├─ TELEGRAM_AUTH_SETUP.md
  │  ├─ TELEGRAM_REFERRAL_TEST_REPORT.md
  │  └─ TELEGRAM_SYNC_SETUP.md
  ├─ run-telegraf.mjs               # Launch bot in polling mode
  └─ .env.example                   # Example env for local runs
```

---

## ✅ Prerequisites

- Node.js 18+
- Dependencies installed at repo root:
  ```bash
  npm install
  ```
- A Telegram Bot token from @BotFather

---

## 🔑 Environment Variables

You can place your env in either location:

- Option A (recommended): project root `.env`
- Option B: `telegram-bot/.env`

Minimal required values:
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCDEF...
TELEGRAM_REQUIRED_CHANNEL=@GoldenGlowGlobal
# TELEGRAM_SKIP_MEMBERSHIP_CHECK=false
```

Tip: Copy template
```bash
# From repo root
copy telegram-bot\.env.example .env   # Windows PowerShell: Copy-Item telegram-bot/.env.example .env
```

---

## ▶️ Run Locally (Polling)

From the project root (loads root .env):
```bash
node telegram-bot/run-telegraf.mjs
```

Or from inside the `telegram-bot/` folder (loads telegram-bot/.env):
```bash
node run-telegraf.mjs
```

Expected output:
```
Telegraf bot launched via long polling
Press Ctrl+C to stop.
```

Stop with Ctrl+C.

---

## 🌐 Webhook (Production reference)

In production (Netlify), use the handlers under `netlify/functions/` in the project root. Copies are included here for reference.

Key endpoints (as configured in `netlify.toml`):
- Set webhook (full bot): `/telegram/set-bot-webhook`
- Webhook info: `/telegram/webhook-info`
- Minimal bot: `/telegram/set-final-clean-webhook`

After deploy, open:
```
https://YOUR-SITE.netlify.app/telegram/set-bot-webhook
```

---

## 👮 Channel Verification

- Users must join `@GoldenGlowGlobal` before playing
- Click “I Joined” to re-check membership
- Set `TELEGRAM_REQUIRED_CHANNEL` to customize
- Set `TELEGRAM_SKIP_MEMBERSHIP_CHECK=true` for testing

---

## 🧪 Quick Test

In Telegram, send to your bot:
- `/start` → Should show welcome + Play button (if member)
- `/play` → Requires membership
- `/help` → Shows help

---

## 📝 Notes

- These files are copies for convenience; production Netlify uses `netlify/functions/*` in the repo root.
- Do not commit real tokens. Use `.env` files locally and hosting platform env vars in production.

---

## 📚 More Docs

See `telegram-bot/docs/` for full guides copied from the project.
