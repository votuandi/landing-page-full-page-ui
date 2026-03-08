-- Migration: Replace whyChooseUsTitle and whyChooseUsDetail with whyChooseUs JSON array
-- This migration converts the old two-column format to the new array format

-- Step 1: Add the new whyChooseUs column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CompanyInfo' AND column_name = 'whyChooseUs'
    ) THEN
        ALTER TABLE "CompanyInfo" ADD COLUMN "whyChooseUs" JSONB;
    END IF;
END $$;

-- Step 2: Migrate existing data from old columns to new format
UPDATE "CompanyInfo"
SET "whyChooseUs" = CASE
    WHEN "whyChooseUsTitle" IS NOT NULL OR "whyChooseUsDetail" IS NOT NULL THEN
        jsonb_build_array(
            jsonb_build_object(
                'title', COALESCE("whyChooseUsTitle", ''),
                'detail', COALESCE("whyChooseUsDetail", '')
            )
        )
    ELSE NULL
END
WHERE "whyChooseUs" IS NULL 
  AND ("whyChooseUsTitle" IS NOT NULL OR "whyChooseUsDetail" IS NOT NULL);

-- Step 3: Set default empty array if both old columns are null and new column is null
UPDATE "CompanyInfo"
SET "whyChooseUs" = '[]'::jsonb
WHERE "whyChooseUs" IS NULL;

-- Step 4: Drop the old columns after migration is complete
ALTER TABLE "CompanyInfo" DROP COLUMN IF EXISTS "whyChooseUsTitle";
ALTER TABLE "CompanyInfo" DROP COLUMN IF EXISTS "whyChooseUsDetail";
