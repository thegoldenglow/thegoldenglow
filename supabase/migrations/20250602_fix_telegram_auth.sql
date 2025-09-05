-- Fix Telegram Authentication Issues
-- This migration adds missing columns and tables needed for Telegram authentication

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
CREATE POLICY "Authenticated users can read app settings"
ON app_settings
FOR SELECT
USING (auth.role() = 'authenticated');

-- Only allow service role to modify app settings
CREATE POLICY "Service role can modify app settings"
ON app_settings
FOR ALL
USING (auth.role() = 'service_role');

-- Update the profiles table to allow anonymous inserts for Telegram users
-- This is needed because Telegram users don't go through Supabase auth
CREATE POLICY "Allow Telegram user creation"
ON profiles
FOR INSERT
WITH CHECK (user_type = 'telegram_user');

-- Allow Telegram users to update their own profiles
CREATE POLICY "Telegram users can update own profile"
ON profiles
FOR UPDATE
USING (user_type = 'telegram_user' AND telegram_id IS NOT NULL);

-- Allow reading Telegram user profiles
CREATE POLICY "Allow reading Telegram profiles"
ON profiles
FOR SELECT
USING (user_type = 'telegram_user' OR auth.uid() = id);