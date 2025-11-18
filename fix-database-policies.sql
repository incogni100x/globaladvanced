-- Fix Database RLS Policies for verification_submissions table
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous inserts" ON verification_submissions;
DROP POLICY IF EXISTS "Allow service role full access" ON verification_submissions;

-- Policy 1: Allow anonymous users to INSERT (create submissions)
CREATE POLICY "Allow anonymous inserts" 
ON verification_submissions 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Policy 2: Allow service role full access (for Edge Functions)
CREATE POLICY "Allow service role full access" 
ON verification_submissions 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE verification_submissions ENABLE ROW LEVEL SECURITY;

