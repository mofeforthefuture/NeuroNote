-- Add missing INSERT policy for user_profiles table
-- This allows users to create their own profile during signup

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create INSERT policy: Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

