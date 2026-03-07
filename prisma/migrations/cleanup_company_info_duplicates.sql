-- Migration to ensure only one CompanyInfo record exists
-- This script will:
-- 1. Keep the first CompanyInfo record and set its id to 1
-- 2. Delete all other CompanyInfo records
-- 3. Reset the sequence for the id column

BEGIN;

-- Step 1: Check if there are any CompanyInfo records
DO $$
DECLARE
  record_count INTEGER;
  first_record_id INTEGER;
BEGIN
  -- Count total records
  SELECT COUNT(*) INTO record_count FROM "CompanyInfo";
  
  IF record_count > 0 THEN
    -- Get the id of the first record (oldest by createdAt)
    SELECT id INTO first_record_id FROM "CompanyInfo" ORDER BY "createdAt" ASC LIMIT 1;
    
    RAISE NOTICE 'Found % CompanyInfo record(s). First record id: %', record_count, first_record_id;
    
    -- If the first record is not id=1, we need to handle it
    IF first_record_id != 1 THEN
      -- Check if id=1 already exists
      IF EXISTS (SELECT 1 FROM "CompanyInfo" WHERE id = 1) THEN
        -- Delete the record with id=1 (it's not the first one)
        DELETE FROM "CompanyInfo" WHERE id = 1;
        RAISE NOTICE 'Deleted existing record with id=1';
      END IF;
      
      -- Update the first record to have id=1
      UPDATE "CompanyInfo" SET id = 1 WHERE id = first_record_id;
      RAISE NOTICE 'Updated first record (id: %) to id=1', first_record_id;
    END IF;
    
    -- Delete all records except id=1
    DELETE FROM "CompanyInfo" WHERE id != 1;
    RAISE NOTICE 'Deleted all duplicate records';
    
  ELSE
    RAISE NOTICE 'No CompanyInfo records found. Nothing to clean up.';
  END IF;
END $$;

-- Step 2: Alter the table to use a fixed id default
-- Note: This will be handled by Prisma migration when you run `prisma migrate dev`

COMMIT;
