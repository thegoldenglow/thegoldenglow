-- Add wallet authentication fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS evm_address TEXT,
ADD COLUMN IF NOT EXISTS solana_address TEXT, 
ADD COLUMN IF NOT EXISTS ton_address TEXT,
ADD COLUMN IF NOT EXISTS wallet_type TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_evm_address ON profiles(evm_address);
CREATE INDEX IF NOT EXISTS idx_profiles_solana_address ON profiles(solana_address);
CREATE INDEX IF NOT EXISTS idx_profiles_ton_address ON profiles(ton_address);
