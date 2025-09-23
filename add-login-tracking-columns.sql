-- Script to add login tracking columns to profiles table
-- This script adds last_login_at and login_count columns to track user login activity

-- Add last_login_at column to store timestamp of last login
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Add login_count column to store total number of logins
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Create index on last_login_at for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at 
ON profiles(last_login_at);

-- Update existing users with default login_count of 0 if NULL
UPDATE profiles 
SET login_count = 0 
WHERE login_count IS NULL;

-- Add comment to document the new columns
COMMENT ON COLUMN profiles.last_login_at IS 'Timestamp of user''s most recent login';
COMMENT ON COLUMN profiles.login_count IS 'Total number of times user has logged in';

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('last_login_at', 'login_count')
ORDER BY column_name;