-- FINAL FIX: Database RLS Policy
-- Copy and paste this ENTIRE block into Supabase SQL Editor

-- Step 1: Drop all existing policies on this table
DROP POLICY IF EXISTS "Allow anonymous inserts" ON verification_submissions CASCADE;
DROP POLICY IF EXISTS "Allow service role full access" ON verification_submissions CASCADE;
DROP POLICY IF EXISTS "Users can view own submissions" ON verification_submissions CASCADE;

-- Step 2: Verify RLS is enabled
ALTER TABLE verification_submissions ENABLE ROW LEVEL SECURITY;

-- Step 3: Create the anonymous INSERT policy
-- CRITICAL: Must use WITH CHECK (true) for INSERT operations
CREATE POLICY "Allow anonymous inserts" 
ON verification_submissions 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Step 4: Create service role policy for Edge Functions
CREATE POLICY "Allow service role full access" 
ON verification_submissions 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Step 5: Verify the policy was created
SELECT 
  policyname,
  roles,
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'verification_submissions';

-- You should see:
-- policyname: "Allow anonymous inserts"
-- roles: {anon}
-- cmd: INSERT
-- with_check: true

