-- Complete Fix for All RLS Policies
-- Run this ENTIRE block in Supabase SQL Editor

-- ============================================
-- STEP 1: Fix Database Table Policies
-- ============================================

-- Drop ALL existing policies first (clean slate)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow anonymous inserts" ON verification_submissions;
  DROP POLICY IF EXISTS "Allow service role full access" ON verification_submissions;
  DROP POLICY IF EXISTS "Users can view own submissions" ON verification_submissions;
END $$;

-- Recreate the INSERT policy for anonymous users
CREATE POLICY "Allow anonymous inserts" 
ON verification_submissions 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Service role policy (for Edge Functions)
CREATE POLICY "Allow service role full access" 
ON verification_submissions 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE verification_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Fix Storage Bucket Policies
-- ============================================

-- Drop existing storage policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Allow anonymous to view own uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Allow service role full access" ON storage.objects;
END $$;

-- Policy 1: Allow anonymous uploads
CREATE POLICY "Allow anonymous uploads"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'verification-documents'
);

-- Policy 2: Allow anonymous to read
CREATE POLICY "Allow anonymous to view own uploads"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'verification-documents'
);

-- Policy 3: Service role full access
CREATE POLICY "Allow service role full access"
ON storage.objects
FOR ALL
TO service_role
USING (
  bucket_id = 'verification-documents'
)
WITH CHECK (
  bucket_id = 'verification-documents'
);

