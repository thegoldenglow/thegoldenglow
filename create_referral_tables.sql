-- Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

DROP POLICY IF EXISTS "Users can view their own referral codes" ON referral_codes;
CREATE POLICY "Users can view their own referral codes"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own referral codes" ON referral_codes;
CREATE POLICY "Users can insert their own referral codes"
  ON referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own referral codes" ON referral_codes;
CREATE POLICY "Users can update their own referral codes"
  ON referral_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- Add RLS policies for referrals table
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view referrals they made or received" ON referrals;
CREATE POLICY "Users can view referrals they made or received"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "Users can insert referrals" ON referrals;
CREATE POLICY "Users can insert referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_id);

DROP POLICY IF EXISTS "Users can update referrals they received" ON referrals;
CREATE POLICY "Users can update referrals they received"
  ON referrals FOR UPDATE
  USING (auth.uid() = referred_id);

-- Insert some demo data for testing
INSERT INTO referral_codes (user_id, code, total_referrals) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'DEMO001', 25),
  ('00000000-0000-0000-0000-000000000002', 'DEMO002', 18),
  ('00000000-0000-0000-0000-000000000003', 'DEMO003', 12),
  ('00000000-0000-0000-0000-000000000004', 'DEMO004', 8),
  ('00000000-0000-0000-0000-000000000005', 'DEMO005', 5)
ON CONFLICT (code) DO NOTHING;