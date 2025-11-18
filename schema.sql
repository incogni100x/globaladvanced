-- Create verification_submissions table
CREATE TABLE IF NOT EXISTS verification_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  
  -- User Information
  id_number VARCHAR(100) NOT NULL,
  
  -- File Storage Paths (Supabase Storage URLs)
  selfie_path TEXT NOT NULL,
  id_front_path TEXT NOT NULL,
  id_back_path TEXT NOT NULL,
  
  -- Status Tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')) NOT NULL,
  
  -- Email Tracking
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  admin_email VARCHAR(255),
  
  -- Optional: Store additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Optional: Admin review notes
  review_notes TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_submissions(status);
CREATE INDEX IF NOT EXISTS idx_verification_created_at ON verification_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_id_number ON verification_submissions(id_number);
CREATE INDEX IF NOT EXISTS idx_verification_email_sent ON verification_submissions(email_sent);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at
DROP TRIGGER IF EXISTS update_verification_submissions_updated_at ON verification_submissions;
CREATE TRIGGER update_verification_submissions_updated_at
  BEFORE UPDATE ON verification_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE verification_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
-- Allow anonymous inserts (for public verification form)
CREATE POLICY "Allow anonymous inserts" 
  ON verification_submissions 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Allow service role full access (for backend operations)
CREATE POLICY "Allow service role full access" 
  ON verification_submissions 
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Allow authenticated users to read their own submissions
-- CREATE POLICY "Users can view own submissions" 
--   ON verification_submissions 
--   FOR SELECT 
--   TO authenticated
--   USING (auth.uid()::text = metadata->>'user_id');

-- Storage bucket for verification documents
-- Run this in Supabase Storage section or via SQL:
-- You'll need to create a bucket called 'verification-documents' in Supabase Storage UI
-- Then set up these policies:

/*
Bucket name: verification-documents
Public: false

Storage Policies:
1. Allow anonymous uploads:
   INSERT policy for anon role

2. Allow service role to manage files:
   ALL policy for service_role
*/

-- Comments for storage setup (to be done in Supabase Dashboard or via API)
COMMENT ON TABLE verification_submissions IS 'Stores verification submission records with file paths from Supabase Storage';

