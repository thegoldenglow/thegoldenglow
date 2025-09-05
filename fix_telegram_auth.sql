-- Manual SQL script to fix Telegram authentication issues
-- Run this directly in your Supabase SQL editor

-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS telegram_first_name TEXT,
ADD COLUMN IF NOT EXISTS telegram_last_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'regular_user',
ADD COLUMN IF NOT EXISTS bot_authenticated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bot_auth_token TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

-- Create app_settings table for storing application configuration
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default Telegram bot token setting
INSERT INTO app_settings (key, value, description) 
VALUES ('telegram_bot_token', '', 'Telegram bot token for authentication')
ON CONFLICT (key) DO NOTHING;

-- Create RLS policies for app_settings table
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read app settings
DROP POLICY IF EXISTS "Authenticated users can read app settings" ON app_settings;
CREATE POLICY "Authenticated users can read app settings"
ON app_settings
FOR SELECT
USING (true); -- Allow all reads for now

-- Only allow service role to modify app settings
DROP POLICY IF EXISTS "Service role can modify app settings" ON app_settings;
CREATE POLICY "Service role can modify app settings"
ON app_settings
FOR ALL
USING (auth.role() = 'service_role');

-- Update the profiles table to allow anonymous inserts for Telegram users
DROP POLICY IF EXISTS "Allow Telegram user creation" ON profiles;
CREATE POLICY "Allow Telegram user creation"
ON profiles
FOR INSERT
WITH CHECK (true); -- Allow all inserts for now

-- Allow Telegram users to update their own profiles
DROP POLICY IF EXISTS "Telegram users can update own profile" ON profiles;
CREATE POLICY "Telegram users can update own profile"
ON profiles
FOR UPDATE
USING (true); -- Allow all updates for now

-- Allow reading Telegram user profiles
DROP POLICY IF EXISTS "Allow reading Telegram profiles" ON profiles;
CREATE POLICY "Allow reading Telegram profiles"
ON profiles
FOR SELECT
USING (true); -- Allow all reads for now