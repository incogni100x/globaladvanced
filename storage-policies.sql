-- Storage Bucket Policies for verification-documents
-- Run this AFTER creating the bucket in Supabase Storage UI

-- First, make sure the bucket exists
-- Create it in Supabase Dashboard: Storage > New bucket > Name: "verification-documents" > Private

-- Policy 1: Allow anonymous users to INSERT (upload) files
CREATE POLICY "Allow anonymous uploads"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'verification-documents'
);

-- Policy 2: Allow anonymous users to SELECT (read) their own files
-- This allows them to verify uploads succeeded
CREATE POLICY "Allow anonymous to view own uploads"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'verification-documents'
);

-- Policy 3: Allow service role full access (for Edge Functions and admin)
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

-- Policy 4: Allow authenticated users full access (if you add auth later)
-- Uncomment if needed:
-- CREATE POLICY "Allow authenticated users full access"
-- ON storage.objects
-- FOR ALL
-- TO authenticated
-- USING (
--   bucket_id = 'verification-documents'
-- )
-- WITH CHECK (
--   bucket_id = 'verification-documents'
-- );

