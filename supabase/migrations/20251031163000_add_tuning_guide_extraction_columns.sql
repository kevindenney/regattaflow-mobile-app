-- Migration: Add extraction columns to tuning_guides table
-- Purpose: Enable storage of extracted rig tuning data from guide documents
-- Adds support for structured sections with settings, extraction status tracking, and content storage

-- Add missing extraction columns
ALTER TABLE tuning_guides
ADD COLUMN IF NOT EXISTS extracted_content TEXT,
ADD COLUMN IF NOT EXISTS extracted_sections JSONB,
ADD COLUMN IF NOT EXISTS extraction_status TEXT CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS extraction_error TEXT,
ADD COLUMN IF NOT EXISTS extracted_at TIMESTAMPTZ;

-- Add index for faster queries on extraction_status
CREATE INDEX IF NOT EXISTS idx_tuning_guides_extraction_status ON tuning_guides(extraction_status);

-- Add comments explaining the columns
COMMENT ON COLUMN tuning_guides.extracted_content IS 'Full text content extracted from the tuning guide document';
COMMENT ON COLUMN tuning_guides.extracted_sections IS 'Structured sections with rig settings extracted from the guide (JSON array of {title, conditions, settings, content})';
COMMENT ON COLUMN tuning_guides.extraction_status IS 'Status of the extraction process: pending, processing, completed, or failed';
COMMENT ON COLUMN tuning_guides.extraction_error IS 'Error message if extraction failed';
COMMENT ON COLUMN tuning_guides.extracted_at IS 'Timestamp when the guide was last extracted';
