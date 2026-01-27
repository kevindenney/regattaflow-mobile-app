-- Add club_id column to regattas table
-- This fixes 400 errors in ClubDocumentService.getClubIdForRace()

ALTER TABLE regattas
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES clubs(id) ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_regattas_club_id ON regattas(club_id);

-- Add comment for documentation
COMMENT ON COLUMN regattas.club_id IS 'Reference to the organizing club for this regatta';
