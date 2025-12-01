-- Link club_race_calendar to regattas table
-- This allows race participants to reference the regatta while calendar shows club-specific details

-- Add regatta_id column to club_race_calendar
ALTER TABLE club_race_calendar
ADD COLUMN IF NOT EXISTS regatta_id UUID REFERENCES regattas(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_club_race_calendar_regatta_id
ON club_race_calendar(regatta_id);

-- Add comment
COMMENT ON COLUMN club_race_calendar.regatta_id IS 'Links to the main regatta that this calendar entry represents';
