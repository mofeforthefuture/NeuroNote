-- QUICK FIX: Add INSERT policy for user_profiles
-- Copy and paste this into Supabase SQL Editor and run it

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create INSERT policy: Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Verify the policy was created
SELECT 
  schemaname, 
  tablename, 
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

