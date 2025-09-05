-- Fix Schema Mismatch for Point Synchronization
-- The current database has a different profiles table structure than expected

-- First, let's check what we have and what we need

-- Current table structure (based on debug output):
-- profiles table with:
--   id: integer (not UUID)
--   user_id: UUID (nullable)
--   username: text
--   points: integer
--   ... other telegram-related fields

-- Expected structure (from code):
-- profiles table with:
--   id: UUID (primary key, references auth.users)
--   name: text
--   points: integer
--   ... other fields

-- SOLUTION: Create a migration to align the schema

-- Step 1: Backup existing data
CREATE TABLE profiles_backup AS SELECT * FROM profiles;

-- Step 2: Drop the existing profiles table
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 3: Create the correct profiles table structure
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lastName TEXT,
  username TEXT,
  avatar TEXT,
  points INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  achievements JSONB DEFAULT '[]'::JSONB,
  badges JSONB DEFAULT '[]'::JSONB,
  titles JSONB DEFAULT '[]'::JSONB,
  profileFrames JSONB DEFAULT '[]'::JSONB,
  cosmetics JSONB DEFAULT '[]'::JSONB,
  selectedTitle TEXT,
  selectedFrame TEXT,
  selectedBadge TEXT,
  customStatus TEXT,
  prestige INTEGER DEFAULT 0,
  stats JSONB DEFAULT '{
    "gamesPlayed": 0,
    "highestScore": 0,
    "totalTimePlayed": 0,
    "loginStreak": 0,
    "longestLoginStreak": 0,
    "lastLogin": null,
    "gameStats": {}
  }'::JSONB,
  -- Additional fields for compatibility
  telegram_id BIGINT,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  telegram_photo_url TEXT,
  telegram_auth_date TIMESTAMP WITH TIME ZONE,
  telegram_hash TEXT,
  avatar_url TEXT,
  user_type TEXT DEFAULT 'user',
  evm_address TEXT,
  solana_address TEXT,
  ton_address TEXT,
  wallet_type TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  bio TEXT
);

-- Step 4: Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Step 5: Migrate existing data (if any users exist)
-- Note: This assumes you have auth.users with UUIDs
-- You may need to adjust this based on your actual auth setup

-- If you have existing users in auth.users, create profiles for them
INSERT INTO profiles (id, name, username, points)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email, 'User') as name,
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)) as username,
  0 as points
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);

-- Step 6: Create other required tables if they don't exist

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  points_awarded INTEGER DEFAULT 0,
  UNIQUE (referrer_id, referee_id)
);

-- Create RLS policies for referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their referrals"
ON referrals
FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can create referrals as referrer"
ON referrals
FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 0, -- in seconds
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  data JSONB DEFAULT '{}'::JSONB
);

-- Create RLS policies for game_sessions
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own game sessions"
ON game_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own game sessions"
ON game_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game sessions"
ON game_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_type ON game_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id);

-- Step 8: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'Schema migration completed successfully!' as status;