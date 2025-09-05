# Telegram User Synchronization Setup Guide

This guide will help you set up proper Telegram user synchronization with your Supabase database to ensure all Telegram users are properly recognized and stored.

## 🚀 Quick Setup

### Step 1: Apply Database Migration

**Option A: Using Supabase Dashboard (Recommended)**

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `GoldenGlow`
3. Go to **SQL Editor**
4. Copy and paste the contents of `apply-migration-direct.sql`
5. Click **Run** to execute the migration

**Option B: Using Supabase CLI**

```bash
# If you have Supabase CLI installed
supabase db push
```

### Step 2: Verify Migration

After running the migration, verify it worked by checking:

1. **Tables** → **profiles** → Check that these columns exist:
   - `telegram_id` (TEXT, UNIQUE)
   - `telegram_username` (TEXT)
   - `telegram_first_name` (TEXT)
   - `telegram_last_name` (TEXT)
   - `telegram_photo_url` (TEXT)
   - `telegram_auth_date` (TIMESTAMP WITH TIME ZONE)
   - `user_source` (TEXT)

2. **Functions** → Check that these functions exist:
   - `sync_telegram_user`
   - `set_telegram_user_context`

### Step 3: Test the Application

1. Start your development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Open your Telegram Mini App
3. Try to authenticate - you should see improved logging in the console
4. Check your Supabase **Table Editor** → **profiles** to see if your user was created/updated

## 🔧 What This Migration Does

### Database Schema Updates

- **Adds Telegram-specific columns** to the `profiles` table
- **Creates indexes** for faster Telegram ID lookups
- **Ensures data integrity** with proper constraints

### New Functions

#### `sync_telegram_user()`
This function handles both user creation and updates:
- Creates new users if they don't exist
- Updates existing users with latest Telegram data
- Handles username and name generation intelligently
- Returns user data and whether the user is new

#### `set_telegram_user_context()`
Sets up proper security context for Telegram users.

### Enhanced Client Code

- **`telegramSync.js`**: New utility for handling Telegram user synchronization
- **Updated `TelegramAuthManager.jsx`**: Now uses the new sync system
- **Better error handling**: More descriptive error messages and logging

## 🐛 Troubleshooting

### Issue: "User not recognized"

**Symptoms:**
- Telegram authentication seems to work
- But user data isn't being saved/retrieved
- Console shows validation errors

**Solutions:**

1. **Check Migration Status:**
   ```sql
   -- Run this in Supabase SQL Editor
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   AND column_name LIKE 'telegram_%';
   ```
   You should see all the telegram_* columns.

2. **Test Sync Function:**
   ```sql
   -- Run this in Supabase SQL Editor
   SELECT sync_telegram_user(
     'test_123',
     'test_user',
     'Test',
     'User',
     NULL,
     'test_user',
     'Test User'
   );
   ```
   This should create a test user.

3. **Check Environment Variables:**
   Ensure your `.env` file has:
   ```env
   REACT_APP_SUPABASE_URL="your-supabase-url"
   VITE_SUPABASE_URL="your-supabase-url"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   VITE_TELEGRAM_BOT_TOKEN="your-bot-token"
   ```

### Issue: "Validation Failed"

**Symptoms:**
- Console shows "Invalid Telegram authentication data"
- User can't authenticate

**Solutions:**

1. **Check Bot Token:**
   - Ensure `VITE_TELEGRAM_BOT_TOKEN` is correct
   - Token should start with a number followed by colon
   - Example: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

2. **Development vs Production:**
   - In development, validation might be bypassed
   - Check `telegramValidation.js` for development mode settings

3. **Check initData:**
   ```javascript
   // Add this to your console for debugging
   console.log('Telegram initData:', window.Telegram?.WebApp?.initData);
   ```

### Issue: "Database Connection Failed"

**Symptoms:**
- Console shows Supabase connection errors
- Functions not found errors

**Solutions:**

1. **Verify Supabase Configuration:**
   ```javascript
   // Test in browser console
   import { supabase } from './src/supabase/supabaseClient';
   console.log('Supabase client:', supabase);
   ```

2. **Check RLS Policies:**
   - Ensure Row Level Security allows Telegram users
   - Check if policies exist for the `profiles` table

3. **Function Permissions:**
   ```sql
   -- Grant permissions if needed
   GRANT EXECUTE ON FUNCTION sync_telegram_user TO authenticated;
   GRANT EXECUTE ON FUNCTION set_telegram_user_context TO authenticated;
   ```

## 📊 Monitoring and Analytics

### User Creation Tracking

Monitor new Telegram users:

```sql
-- Check recent Telegram users
SELECT 
  id,
  name,
  telegram_id,
  telegram_username,
  user_source,
  telegram_auth_date,
  createdat
FROM profiles 
WHERE telegram_id IS NOT NULL 
ORDER BY telegram_auth_date DESC 
LIMIT 10;
```

### Sync Success Rate

```sql
-- Check user source distribution
SELECT 
  user_source,
  COUNT(*) as user_count
FROM profiles 
GROUP BY user_source;
```

## 🔒 Security Considerations

### Production Deployment

1. **Environment Variables:**
   - Never commit real tokens to version control
   - Use different tokens for development/production
   - Store sensitive keys in your hosting platform's environment variables

2. **Server-Side Validation:**
   - Implement proper HMAC-SHA256 validation on your server
   - Don't rely on client-side validation alone
   - See `api/validate-telegram-auth.js` for examples

3. **Rate Limiting:**
   - Implement rate limiting for authentication endpoints
   - Monitor for suspicious authentication patterns

### Data Privacy

- Only store necessary Telegram data
- Respect user privacy settings
- Implement data deletion procedures if needed
- Follow GDPR/privacy regulations

## 📝 Next Steps

1. **Test thoroughly** with real Telegram users
2. **Monitor logs** for any synchronization issues
3. **Implement server-side validation** for production
4. **Set up monitoring** for user authentication metrics
5. **Consider implementing** user profile management features

## 🆘 Getting Help

If you're still experiencing issues:

1. Check the browser console for detailed error messages
2. Verify all migration steps were completed
3. Test with a fresh Telegram session
4. Check Supabase logs in the dashboard
5. Ensure your Telegram Mini App is properly configured

---

**Note:** This setup ensures that every Telegram user who authenticates with your Mini App will be properly synchronized with your Supabase database, eliminating the "user not recognized" issue.