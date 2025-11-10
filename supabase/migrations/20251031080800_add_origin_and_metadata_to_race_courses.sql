-- Add missing columns to race_courses table for course library seeding
ALTER TABLE race_courses
ADD COLUMN IF NOT EXISTS origin TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add helpful comments
COMMENT ON COLUMN race_courses.origin IS 'Source of the course data (e.g., seeded-json, user-created, imported)';
COMMENT ON COLUMN race_courses.metadata IS 'Additional course metadata including region, source file, associated clubs, etc.';
