-- ============================================================================
-- Add Equipment Tracking Columns to boat_equipment
-- ============================================================================
-- The EquipmentService expects these columns for proper equipment management,
-- maintenance tracking, and integration with equipment_templates.

-- Add manufacturer and model info
ALTER TABLE boat_equipment ADD COLUMN IF NOT EXISTS manufacturer TEXT;
ALTER TABLE boat_equipment ADD COLUMN IF NOT EXISTS model TEXT;

-- Add purchase/warranty info
ALTER TABLE boat_equipment ADD COLUMN IF NOT EXISTS vendor TEXT;
ALTER TABLE boat_equipment ADD COLUMN IF NOT EXISTS warranty_expiry DATE;
ALTER TABLE boat_equipment ADD COLUMN IF NOT EXISTS installed_date DATE;

-- Add lifespan tracking
ALTER TABLE boat_equipment ADD COLUMN IF NOT EXISTS expected_lifespan_years INTEGER;
ALTER TABLE boat_equipment ADD COLUMN IF NOT EXISTS expected_lifespan_hours INTEGER;
ALTER TABLE boat_equipment ADD COLUMN IF NOT EXISTS current_hours NUMERIC DEFAULT 0;

-- Add maintenance tracking
ALTER TABLE boat_equipment ADD COLUMN IF NOT EXISTS maintenance_interval_days INTEGER;
ALTER TABLE boat_equipment ADD COLUMN IF NOT EXISTS next_maintenance_date DATE;
ALTER TABLE boat_equipment ADD COLUMN IF NOT EXISTS last_maintenance_date DATE;
ALTER TABLE boat_equipment ADD COLUMN IF NOT EXISTS lubrication_type TEXT;

-- Add care instructions and documentation
ALTER TABLE boat_equipment ADD COLUMN IF NOT EXISTS care_instructions TEXT;
ALTER TABLE boat_equipment ADD COLUMN IF NOT EXISTS manufacturer_doc_url TEXT;

-- Add condition rating (1-10 scale)
ALTER TABLE boat_equipment ADD COLUMN IF NOT EXISTS condition_rating INTEGER CHECK (condition_rating IS NULL OR (condition_rating >= 1 AND condition_rating <= 10));

-- Add index for maintenance scheduling queries
CREATE INDEX IF NOT EXISTS idx_boat_equipment_next_maintenance
ON boat_equipment(next_maintenance_date)
WHERE next_maintenance_date IS NOT NULL;

-- Add index for equipment by manufacturer
CREATE INDEX IF NOT EXISTS idx_boat_equipment_manufacturer
ON boat_equipment(manufacturer)
WHERE manufacturer IS NOT NULL;

-- Comment the columns for documentation
COMMENT ON COLUMN boat_equipment.manufacturer IS 'Equipment manufacturer (e.g., Harken, Lewmar)';
COMMENT ON COLUMN boat_equipment.model IS 'Equipment model number or name';
COMMENT ON COLUMN boat_equipment.expected_lifespan_years IS 'Expected lifespan in years from equipment template';
COMMENT ON COLUMN boat_equipment.expected_lifespan_hours IS 'Expected lifespan in usage hours';
COMMENT ON COLUMN boat_equipment.current_hours IS 'Current tracked usage hours';
COMMENT ON COLUMN boat_equipment.maintenance_interval_days IS 'Days between required maintenance';
COMMENT ON COLUMN boat_equipment.next_maintenance_date IS 'Calculated next maintenance due date';
COMMENT ON COLUMN boat_equipment.condition_rating IS 'User-rated condition from 1 (poor) to 10 (excellent)';
