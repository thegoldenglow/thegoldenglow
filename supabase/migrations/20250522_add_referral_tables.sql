-- Create referral_codes table to store unique codes for each user
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  total_referrals INTEGER DEFAULT 0
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
-- Create index on code for faster lookups when someone uses a code
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);

-- Create referrals table to track who referred whom
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_used VARCHAR(20) NOT NULL REFERENCES referral_codes(code),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reward_claimed BOOLEAN DEFAULT FALSE,
  points_awarded INTEGER DEFAULT 0
);

-- Create unique constraint to prevent duplicate referrals
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_referral ON referrals(referrer_id, referred_id);
-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);

-- Add RLS policies for referral_codes table
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral codes"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral codes"
  ON referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes"
  ON referral_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- Add RLS policies for referrals table
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view referrals they made"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals they received"
  ON referrals FOR SELECT
  USING (auth.uid() = referred_id);

CREATE POLICY "Users can insert their own referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update their own referrals"
  ON referrals FOR UPDATE
  USING (auth.uid() = referrer_id);
