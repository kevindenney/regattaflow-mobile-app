-- ============================================================================
-- Add replacement_priority column to boat_equipment
-- ============================================================================
-- This column was defined in the EquipmentService but missing from the database.
-- It tracks the priority level for replacing equipment items.

-- Add the replacement_priority column
ALTER TABLE boat_equipment
ADD COLUMN IF NOT EXISTS replacement_priority TEXT;

-- Add check constraint to ensure valid values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'boat_equipment_replacement_priority_check'
    ) THEN
        ALTER TABLE boat_equipment
        ADD CONSTRAINT boat_equipment_replacement_priority_check
        CHECK (replacement_priority IS NULL OR replacement_priority IN ('low', 'medium', 'high', 'critical'));
    END IF;
END $$;

-- Add index for queries filtering by replacement priority
CREATE INDEX IF NOT EXISTS idx_boat_equipment_replacement_priority
ON boat_equipment(replacement_priority)
WHERE replacement_priority IS NOT NULL;

COMMENT ON COLUMN boat_equipment.replacement_priority IS 'Priority level for replacing this equipment: low, medium, high, or critical';
