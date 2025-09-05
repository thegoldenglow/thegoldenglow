# Telegram Mini App Authentication Setup Guide

## Overview

This guide explains how to properly configure and secure Telegram Mini App authentication in your React application.

## 🔧 Configuration Steps

### 1. Environment Variables Setup

Update your `.env` file with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_actual_supabase_url
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key

# Telegram Bot Configuration
VITE_TELEGRAM_BOT_TOKEN=your_actual_telegram_bot_token

# WalletConnect (Get from https://cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_actual_walletconnect_project_id
```

### 2. Get Your Telegram Bot Token

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create a new bot with `/newbot`
3. Follow the instructions to get your bot token
4. Set up your Mini App with `/newapp`
5. Configure the web app URL to point to your application

### 3. Database Setup

Ensure your Supabase database has the required tables and columns:

```sql
-- Add Telegram fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_id TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_last_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_photo_url TEXT;

-- Add bot token storage (optional, for server-side validation)
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔒 Security Implementation

### Current Implementation Status

✅ **Fixed Issues:**
- Environment variables properly configured
- Secure validation utility created (`src/utils/telegramValidation.js`)
- Client-side validation updated to use proper checks
- Server-side validation example provided

⚠️ **Important Security Notes:**

1. **Development vs Production:**
   - Current implementation uses client-side validation for development
   - **MUST** implement server-side validation for production

2. **Bot Token Security:**
   - Bot token is currently exposed on client-side
   - **MUST** move validation to server-side for production

### Production Security Checklist

- [ ] Implement server-side validation endpoint
- [ ] Move bot token to server environment only
- [ ] Remove `VITE_TELEGRAM_BOT_TOKEN` from client environment
- [ ] Add rate limiting to validation endpoint
- [ ] Implement proper error handling
- [ ] Add logging for security events

## 🚀 Implementation Guide

### Server-Side Validation (Required for Production)

#### Option 1: Supabase Edge Functions

1. Create `supabase/functions/validate-telegram-auth/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateTelegramInitData } from './telegramValidation.ts'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { initData } = await req.json()
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  
  const result = validateTelegramInitData(initData, botToken)
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

2. Deploy the function:
```bash
supabase functions deploy validate-telegram-auth
```

3. Set the bot token as a secret:
```bash
supabase secrets set TELEGRAM_BOT_TOKEN=your_bot_token
```

#### Option 2: Express.js/Node.js Backend

See `api/validate-telegram-auth.js` for a complete example.

### Client-Side Updates for Production

Update `src/utils/telegramValidation.js` to use your server endpoint:

```javascript
// In production, update the server URL
const response = await fetch('https://your-project.supabase.co/functions/v1/validate-telegram-auth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`
  },
  body: JSON.stringify({ initData })
});
```

## 🧪 Testing

### Development Testing

1. **In Telegram:**
   - Open your bot
   - Launch the Mini App
   - Check browser console for validation logs

2. **Local Development:**
   - Use Telegram Web or Desktop app
   - Open Developer Tools
   - Monitor network requests and console logs

### Production Testing

1. Test with real Telegram users
2. Monitor server logs for validation attempts
3. Test edge cases (expired tokens, invalid data)
4. Verify rate limiting works

## 🐛 Troubleshooting

### Common Issues

1. **"Missing hash in initData"**
   - Ensure app is launched from Telegram
   - Check if running in proper Telegram WebApp environment

2. **"InitData has expired"**
   - Check system time synchronization
   - Verify auth_date is recent (within 24 hours)

3. **"Hash validation failed"**
   - Verify bot token is correct
   - Check if initData was modified
   - Ensure proper HMAC-SHA256 implementation

4. **"Server configuration error"**
   - Verify bot token is set in server environment
   - Check server-side validation endpoint is deployed

### Debug Mode

Enable debug logging by setting:
```javascript
// In development
console.log('Telegram WebApp object:', window.Telegram?.WebApp);
console.log('InitData:', window.Telegram?.WebApp?.initData);
```

## 📚 Additional Resources

- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Validating Data Received via Web App](https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## 🔄 Migration from Current Setup

1. **Immediate (Development):**
   - Update `.env` with real values
   - Test with actual Telegram bot

2. **Before Production:**
   - Implement server-side validation
   - Remove client-side bot token
   - Add proper error handling
   - Set up monitoring and logging

3. **Production Deployment:**
   - Deploy validation endpoint
   - Update client to use server validation
   - Test thoroughly
   - Monitor for security issues