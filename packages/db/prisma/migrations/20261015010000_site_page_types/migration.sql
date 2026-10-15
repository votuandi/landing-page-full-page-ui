-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "pageTypes" TEXT[] DEFAULT ARRAY['home', 'contact', 'policy']::TEXT[];


-- Existing sites keep every route they served before structure became data (E5-S11).
UPDATE "Site" SET "pageTypes" = ARRAY['home', 'about', 'services', 'projects', 'products', 'news', 'guides', 'contact', 'policy']::TEXT[];
