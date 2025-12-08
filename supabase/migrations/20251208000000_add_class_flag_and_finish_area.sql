-- Add class_flag to start sequence and finish_area fields
-- This migration adds fields for race prep workflow improvements

ALTER TABLE regattas
  -- Finish Area Information
  ADD COLUMN IF NOT EXISTS finish_area_name text,
  ADD COLUMN IF NOT EXISTS finish_area_description text,
  ADD COLUMN IF NOT EXISTS finish_area_coordinates jsonb;
  -- Structure: { "lat": 22.2854, "lng": 114.1577 }

-- Add helpful comments
COMMENT ON COLUMN regattas.finish_area_name IS 'Name or designation of the finish area (e.g., "Finish Area Alpha")';
COMMENT ON COLUMN regattas.finish_area_description IS 'Detailed description of finish line location and procedure';
COMMENT ON COLUMN regattas.finish_area_coordinates IS 'GPS coordinates of finish area center point';

-- Note: The start_sequence_details jsonb column already exists and can store flag info
-- The structure will be updated to: [{ class: string, warning: string, start: string, flag: string }]
-- No schema change needed for this as jsonb is flexible

-- Create index for faster lookups on finish area
CREATE INDEX IF NOT EXISTS idx_regattas_finish_area_name ON regattas(finish_area_name) WHERE finish_area_name IS NOT NULL;

