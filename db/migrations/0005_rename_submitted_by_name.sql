-- Migration: Rename submittedByName to firstName/surname
-- This migration splits the single 'submitted_by_name' column into 'submitted_by_first_name' and 'submitted_by_surname'

-- Add new columns
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS submitted_by_first_name TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS submitted_by_surname TEXT;

-- Migrate existing data (split name on first space)
UPDATE ideas
SET
  submitted_by_first_name = SPLIT_PART(submitted_by_name, ' ', 1),
  submitted_by_surname = SUBSTRING(submitted_by_name FROM POSITION(' ' IN submitted_by_name) + 1)
WHERE submitted_by_name IS NOT NULL;

-- Handle cases where there's no space (whole name goes to first name)
UPDATE ideas
SET
  submitted_by_first_name = submitted_by_name,
  submitted_by_surname = ''
WHERE submitted_by_name IS NOT NULL
  AND submitted_by_surname = '';

-- Make columns NOT NULL after migration
ALTER TABLE ideas ALTER COLUMN submitted_by_first_name SET NOT NULL;
ALTER TABLE ideas ALTER COLUMN submitted_by_surname SET NOT NULL;

-- Drop old column
ALTER TABLE ideas DROP COLUMN IF EXISTS submitted_by_name;
