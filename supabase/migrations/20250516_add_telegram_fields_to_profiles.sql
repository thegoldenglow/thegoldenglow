-- Add Telegram user fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS telegram_id TEXT,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS telegram_photo_url TEXT,
ADD COLUMN IF NOT EXISTS user_source TEXT DEFAULT 'non_telegram_user',
ADD COLUMN IF NOT EXISTS telegram_auth_date TIMESTAMP;
