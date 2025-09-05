-- Create profiles table
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
  }'::JSONB
);

-- Create RLS policies for the profiles table
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

-- Create referrals table
CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  points_awarded INTEGER DEFAULT 0,
  UNIQUE (referrer_id, referee_id)
);

-- Create RLS policies for the referrals table
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Allow users to read referrals they're involved in
CREATE POLICY "Users can read their referrals"
ON referrals
FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Allow users to create referrals where they are the referrer
CREATE POLICY "Users can create referrals as referrer"
ON referrals
FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

-- Create games table for storing game history
CREATE TABLE game_sessions (
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

-- Create RLS policies for the game_sessions table
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own game sessions
CREATE POLICY "Users can read own game sessions"
ON game_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to create their own game sessions
CREATE POLICY "Users can create own game sessions"
ON game_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own game sessions
CREATE POLICY "Users can update own game sessions"
ON game_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create a view to show users their referral stats
CREATE VIEW user_referral_stats AS
SELECT 
  profiles.id,
  profiles.name,
  profiles.username,
  COUNT(referrals.id) AS total_referrals,
  SUM(referrals.points_awarded) AS total_points_earned_from_referrals
FROM 
  profiles
LEFT JOIN 
  referrals ON profiles.id = referrals.referrer_id
GROUP BY 
  profiles.id, profiles.name, profiles.username;

-- Create a leaderboard view for points
CREATE VIEW points_leaderboard AS
SELECT 
  id,
  name,
  username,
  points,
  prestige,
  RANK() OVER (ORDER BY points DESC, prestige DESC) as rank
FROM 
  profiles
ORDER BY 
  points DESC, prestige DESC
LIMIT 100;

-- Add admin role helper function
CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET role = 'admin'
  FROM auth.users
  WHERE auth.users.email = user_email
  AND profiles.id = auth.users.id;
END;
$$; 