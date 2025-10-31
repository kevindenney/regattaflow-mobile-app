-- Add missing columns to regatta_results table
-- These columns are expected by useBoatPerformanceStats hook

ALTER TABLE regatta_results
ADD COLUMN IF NOT EXISTS total_boats INTEGER,
ADD COLUMN IF NOT EXISTS race_date DATE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_regatta_results_race_date ON regatta_results(race_date);
CREATE INDEX IF NOT EXISTS idx_regatta_results_sailor_sail ON regatta_results(sailor_id, sail_number);
