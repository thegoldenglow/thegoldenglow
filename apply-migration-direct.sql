-- Direct SQL migration for Telegram synchronization
-- Execute this in your Supabase SQL Editor

-- Ensure Telegram fields exist in profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS telegram_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS telegram_first_name TEXT,
ADD COLUMN IF NOT EXISTS telegram_last_name TEXT,
ADD COLUMN IF NOT EXISTS telegram_photo_url TEXT,
ADD COLUMN IF NOT EXISTS telegram_auth_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS user_source TEXT DEFAULT 'web_user';

-- Create index on telegram_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON profiles(telegram_id);

-- Create or replace function to sync Telegram user data
CREATE OR REPLACE FUNCTION sync_telegram_user(
  p_telegram_id TEXT,
  p_telegram_username TEXT DEFAULT NULL,
  p_telegram_first_name TEXT DEFAULT NULL,
  p_telegram_last_name TEXT DEFAULT NULL,
  p_telegram_photo_url TEXT DEFAULT NULL,
  p_username TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL
)
RETURNS TABLE(
  user_id UUID,
  is_new_user BOOLEAN,
  user_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_existing_user RECORD;
  v_is_new_user BOOLEAN := FALSE;
  v_final_username TEXT;
  v_final_name TEXT;
BEGIN
  -- Check if user exists by telegram_id
  SELECT * INTO v_existing_user 
  FROM profiles 
  WHERE telegram_id = p_telegram_id;
  
  IF v_existing_user IS NULL THEN
    -- User doesn't exist, create new user
    v_is_new_user := TRUE;
    v_user_id := gen_random_uuid();
    
    -- Generate username if not provided
    v_final_username := COALESCE(
      p_username,
      p_telegram_username,
      'user' || p_telegram_id
    );
    
    -- Generate name if not provided
    v_final_name := COALESCE(
      p_name,
      TRIM(CONCAT(p_telegram_first_name, ' ', p_telegram_last_name)),
      p_telegram_username,
      'User ' || p_telegram_id
    );
    
    -- Insert new user
    INSERT INTO profiles (
      id,
      name,
      username,
      telegram_id,
      telegram_username,
      telegram_first_name,
      telegram_last_name,
      telegram_photo_url,
      telegram_auth_date,
      user_source,
      points,
      role
    ) VALUES (
      v_user_id,
      v_final_name,
      v_final_username,
      p_telegram_id,
      p_telegram_username,
      p_telegram_first_name,
      p_telegram_last_name,
      p_telegram_photo_url,
      NOW(),
      'telegram_user',
      0,
      'user'
    );
    
  ELSE
    -- User exists, update with latest Telegram data
    v_user_id := v_existing_user.id;
    
    -- Update existing user
    UPDATE profiles SET
      telegram_username = COALESCE(p_telegram_username, telegram_username),
      telegram_first_name = COALESCE(p_telegram_first_name, telegram_first_name),
      telegram_last_name = COALESCE(p_telegram_last_name, telegram_last_name),
      telegram_photo_url = COALESCE(p_telegram_photo_url, telegram_photo_url),
      telegram_auth_date = NOW(),
      user_source = CASE 
        WHEN user_source = 'web_user' OR user_source IS NULL 
        THEN 'telegram_user' 
        ELSE user_source 
      END,
      -- Update username if it's a generated one or not set
      username = CASE 
        WHEN (username IS NULL OR username LIKE 'user%') AND p_telegram_username IS NOT NULL 
        THEN p_telegram_username 
        ELSE username 
      END,
      -- Update name if it's a generated one or not set
      name = CASE 
        WHEN (name IS NULL OR name LIKE 'User %') AND (p_telegram_first_name IS NOT NULL OR p_telegram_last_name IS NOT NULL)
        THEN TRIM(CONCAT(COALESCE(p_telegram_first_name, ''), ' ', COALESCE(p_telegram_last_name, '')))
        ELSE name 
      END
    WHERE id = v_user_id;
  END IF;
  
  -- Return user data
  RETURN QUERY
  SELECT 
    v_user_id as user_id,
    v_is_new_user as is_new_user,
    row_to_json(p.*)::jsonb as user_data
  FROM profiles p
  WHERE p.id = v_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION sync_telegram_user TO authenticated;

-- Create function to set Telegram user context
CREATE OR REPLACE FUNCTION set_telegram_user_context(telegram_user_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.telegram_user_id', telegram_user_id, true);
END;
$$;

GRANT EXECUTE ON FUNCTION set_telegram_user_context TO authenticated;