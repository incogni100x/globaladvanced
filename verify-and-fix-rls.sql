-- VERIFY AND FIX RLS POLICIES
-- Run this to check and fix all RLS issues

-- ============================================
-- STEP 1: Check if policies exist
-- ============================================
SELECT 
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'verification_submissions';

-- ============================================
-- STEP 2: Check RLS is enabled
-- ============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'verification_submissions';

-- ============================================
-- STEP 3: Force drop and recreate policies
-- ============================================

-- Drop policies with CASCADE to handle dependencies
DROP POLICY IF EXISTS "Allow anonymous inserts" ON verification_submissions CASCADE;
DROP POLICY IF EXISTS "Allow service role full access" ON verification_submissions CASCADE;
DROP POLICY IF EXISTS "Users can view own submissions" ON verification_submissions CASCADE;

-- Create INSERT policy for anonymous users
-- This MUST have WITH CHECK (true) for inserts to work
CREATE POLICY "Allow anonymous inserts" 
ON verification_submissions 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Create service role policy
CREATE POLICY "Allow service role full access" 
ON verification_submissions 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure RLS is definitely enabled
ALTER TABLE verification_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Verify policies are created
-- ============================================
SELECT 
  policyname,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'verification_submissions';

