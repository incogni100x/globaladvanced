-- Update schema: Rename id_number to ssn and add email_reference field

-- Step 1: Add new email_reference column
ALTER TABLE verification_submissions 
ADD COLUMN IF NOT EXISTS email_reference VARCHAR(255);

-- Step 2: Rename id_number to ssn
-- Note: This will require dropping and recreating constraints/indexes
ALTER TABLE verification_submissions 
RENAME COLUMN id_number TO ssn;

-- Step 3: Update the index name to match new column name
DROP INDEX IF EXISTS idx_verification_id_number;
CREATE INDEX IF NOT EXISTS idx_verification_ssn 
ON verification_submissions(ssn);

-- Step 4: Create index for email_reference for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_email_reference 
ON verification_submissions(email_reference);

