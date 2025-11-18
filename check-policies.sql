-- Check current RLS policies on verification_submissions table
-- Run this first to see what policies exist

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'verification_submissions';

