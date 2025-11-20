-- Multi-Project Support Schema
-- Run this in Supabase SQL Editor

-- Step 1: Create projects configuration table
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  subdomain VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Step 2: Insert all projects FIRST (must exist before foreign key)
INSERT INTO projects (id, name, admin_email, subdomain) 
VALUES 
  (
    'capirocket', 
    'Capirocket Verification', 
    'verify@capirocket.net',
    'verify.capirocket.net'  -- Update with actual subdomain if different
  ),
  (
    'tradecenfxvip', 
    'TradeCenFX VIP Verification', 
    'verify@tradecenfxvip.com',
    'verify.tradecenfxvip.com'  -- Update with actual subdomain if different
  ),
  (
    'globalpremiumfin', 
    'Global Premium Fin Verification', 
    'verify@globalpremiumfin.com',
    'verify.globalpremiumfin.com'  -- Update with actual subdomain if different
  )
ON CONFLICT (id) DO UPDATE 
SET admin_email = EXCLUDED.admin_email,
    subdomain = EXCLUDED.subdomain,
    name = EXCLUDED.name;

-- Step 3: Add project_id column to verification_submissions (adds to existing table)
ALTER TABLE verification_submissions 
ADD COLUMN IF NOT EXISTS project_id VARCHAR(50);

-- Step 4: Update existing records to have a default project_id (if any exist)
-- Now safe because projects table exists and has 'globalpremiumfin'
UPDATE verification_submissions 
SET project_id = 'globalpremiumfin' 
WHERE project_id IS NULL;

-- Step 5: Create index for faster lookups (before foreign key)
CREATE INDEX IF NOT EXISTS idx_verification_project_id 
ON verification_submissions(project_id);

CREATE INDEX IF NOT EXISTS idx_projects_active 
ON projects(active) WHERE active = true;

-- Step 6: Create foreign key relationship (now safe since projects exist and records updated)
-- First drop if exists to avoid errors on re-run
ALTER TABLE verification_submissions
DROP CONSTRAINT IF EXISTS fk_verification_project;

ALTER TABLE verification_submissions
ADD CONSTRAINT fk_verification_project 
FOREIGN KEY (project_id) 
REFERENCES projects(id)
ON DELETE RESTRICT;

-- Step 7: Add trigger for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE projects IS 'Configuration table for multi-project support. Maps project_id to admin_email and subdomain.';
COMMENT ON COLUMN verification_submissions.project_id IS 'Links verification submission to a project for email routing.';

