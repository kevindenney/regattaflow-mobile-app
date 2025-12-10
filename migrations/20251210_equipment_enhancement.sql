-- ============================================================================
-- Equipment Enhancement Migration
-- Extends boat_equipment table with comprehensive tracking for maintenance,
-- manufacturer info, and AI-powered care guides
-- ============================================================================

-- Step 1: Add new columns to boat_equipment table
-- These columns enable detailed equipment tracking, maintenance scheduling,
-- and AI-powered care recommendations

ALTER TABLE boat_equipment 
ADD COLUMN IF NOT EXISTS manufacturer TEXT,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS expected_lifespan_years INTEGER,
ADD COLUMN IF NOT EXISTS expected_lifespan_hours INTEGER,
ADD COLUMN IF NOT EXISTS current_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS maintenance_interval_days INTEGER,
ADD COLUMN IF NOT EXISTS last_maintenance_date DATE,
ADD COLUMN IF NOT EXISTS next_maintenance_date DATE,
ADD COLUMN IF NOT EXISTS lubrication_type TEXT,
ADD COLUMN IF NOT EXISTS care_instructions TEXT,
ADD COLUMN IF NOT EXISTS manufacturer_doc_url TEXT,
ADD COLUMN IF NOT EXISTS ai_care_guide JSONB,
ADD COLUMN IF NOT EXISTS condition_rating INTEGER,
ADD COLUMN IF NOT EXISTS replacement_priority TEXT,
ADD COLUMN IF NOT EXISTS installed_date DATE,
ADD COLUMN IF NOT EXISTS retired_date DATE,
ADD COLUMN IF NOT EXISTS retirement_reason TEXT,
ADD COLUMN IF NOT EXISTS photos TEXT[],
ADD COLUMN IF NOT EXISTS vendor TEXT,
ADD COLUMN IF NOT EXISTS vendor_contact TEXT;

-- Add check constraints
DO $$
BEGIN
    -- Add condition_rating check if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'boat_equipment_condition_rating_check'
    ) THEN
        ALTER TABLE boat_equipment 
        ADD CONSTRAINT boat_equipment_condition_rating_check 
        CHECK (condition_rating IS NULL OR (condition_rating >= 0 AND condition_rating <= 100));
    END IF;
    
    -- Add replacement_priority check if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'boat_equipment_replacement_priority_check'
    ) THEN
        ALTER TABLE boat_equipment 
        ADD CONSTRAINT boat_equipment_replacement_priority_check 
        CHECK (replacement_priority IS NULL OR replacement_priority IN ('low', 'medium', 'high', 'critical'));
    END IF;
END $$;

-- Step 2: Create equipment categories lookup table for standardization
CREATE TABLE IF NOT EXISTS equipment_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    parent_category TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed equipment categories
INSERT INTO equipment_categories (id, name, description, icon, parent_category, sort_order) VALUES
    -- Rig components
    ('mast', 'Mast', 'Main vertical spar', 'git-network', NULL, 10),
    ('boom', 'Boom', 'Horizontal spar attached to mast', 'remove-outline', NULL, 20),
    ('spinnaker_pole', 'Spinnaker Pole', 'Pole for flying spinnaker', 'remove-outline', NULL, 25),
    
    -- Standing rigging
    ('forestay', 'Forestay', 'Forward stay supporting mast', 'trending-up', NULL, 30),
    ('backstay', 'Backstay', 'Aft stay supporting mast', 'trending-down', NULL, 40),
    ('shrouds', 'Shrouds', 'Side stays supporting mast', 'git-branch', NULL, 50),
    ('spreaders', 'Spreaders', 'Horizontal struts holding shrouds', 'expand-outline', NULL, 60),
    
    -- Running rigging
    ('halyards', 'Halyards', 'Lines for raising sails', 'arrow-up', NULL, 70),
    ('sheets', 'Sheets', 'Lines for trimming sails', 'swap-horizontal', NULL, 80),
    ('control_lines', 'Control Lines', 'Cunningham, outhaul, vang, etc.', 'options', NULL, 90),
    
    -- Sails
    ('mainsail', 'Mainsail', 'Primary driving sail', 'flag', 'sail', 100),
    ('jib', 'Jib', 'Headsail forward of mast', 'flag-outline', 'sail', 110),
    ('genoa', 'Genoa', 'Large overlapping headsail', 'flag-outline', 'sail', 115),
    ('spinnaker', 'Spinnaker', 'Downwind sail', 'balloon', 'sail', 120),
    ('code_zero', 'Code Zero', 'Reaching sail', 'flag-outline', 'sail', 125),
    
    -- Deck hardware
    ('winches', 'Winches', 'Mechanical advantage devices', 'sync-circle', NULL, 130),
    ('blocks', 'Blocks', 'Pulleys for routing lines', 'ellipse', NULL, 140),
    ('cleats', 'Cleats', 'Line securing devices', 'remove', NULL, 150),
    ('tracks', 'Tracks', 'Adjustable lead positions', 'reorder-four', NULL, 160),
    
    -- Steering
    ('tiller', 'Tiller', 'Steering lever', 'resize', NULL, 170),
    ('wheel', 'Wheel', 'Steering wheel', 'radio-button-on', NULL, 175),
    ('rudder', 'Rudder', 'Underwater steering foil', 'navigate', NULL, 180),
    
    -- Hull & appendages  
    ('keel', 'Keel', 'Fixed ballast and foil', 'caret-down', NULL, 190),
    ('centerboard', 'Centerboard', 'Retractable foil', 'chevron-down', NULL, 195),
    
    -- Electronics
    ('instruments', 'Instruments', 'Speed, wind, depth displays', 'speedometer', 'electronics', 200),
    ('gps', 'GPS/Chartplotter', 'Navigation electronics', 'location', 'electronics', 210),
    ('vhf', 'VHF Radio', 'Communication radio', 'radio', 'electronics', 220),
    ('compass', 'Compass', 'Magnetic heading reference', 'compass', 'electronics', 225),
    
    -- Safety
    ('life_jackets', 'Life Jackets/PFDs', 'Personal flotation devices', 'shield-checkmark', 'safety', 230),
    ('safety_gear', 'Safety Gear', 'Flares, fire extinguisher, etc.', 'medkit', 'safety', 240),
    ('anchor', 'Anchor & Rode', 'Ground tackle', 'boat', 'safety', 250),
    
    -- Other
    ('covers', 'Covers', 'Boat and sail covers', 'umbrella', NULL, 260),
    ('trailer', 'Trailer', 'Road transport equipment', 'car', NULL, 270),
    ('other', 'Other', 'Miscellaneous equipment', 'ellipsis-horizontal', NULL, 999)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create equipment maintenance logs table
CREATE TABLE IF NOT EXISTS equipment_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES boat_equipment(id) ON DELETE CASCADE,
    boat_id UUID NOT NULL REFERENCES sailor_boats(id) ON DELETE CASCADE,
    sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Maintenance details
    maintenance_date DATE NOT NULL,
    maintenance_type TEXT NOT NULL CHECK (maintenance_type IN (
        'inspection',
        'cleaning',
        'lubrication',
        'adjustment',
        'repair',
        'replacement',
        'service',
        'certification',
        'other'
    )),
    
    -- Work performed
    description TEXT NOT NULL,
    work_performed TEXT[],
    parts_replaced TEXT[],
    
    -- Service provider
    performed_by TEXT,
    service_provider TEXT,
    service_provider_contact TEXT,
    
    -- Costs
    labor_cost NUMERIC,
    parts_cost NUMERIC,
    total_cost NUMERIC,
    
    -- Documentation
    notes TEXT,
    before_condition INTEGER CHECK (before_condition >= 0 AND before_condition <= 100),
    after_condition INTEGER CHECK (after_condition >= 0 AND after_condition <= 100),
    photos TEXT[],
    receipts TEXT[],
    
    -- Hours tracking
    hours_at_service INTEGER,
    
    -- Next service
    next_service_date DATE,
    next_service_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_equipment ON equipment_maintenance_logs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_boat ON equipment_maintenance_logs(boat_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_sailor ON equipment_maintenance_logs(sailor_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_date ON equipment_maintenance_logs(maintenance_date DESC);

-- Step 4: Create equipment templates table for quick-add functionality
CREATE TABLE IF NOT EXISTS equipment_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template identification
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    
    -- Associated boat class (optional - for class-specific templates)
    class_id UUID REFERENCES boat_classes(id) ON DELETE SET NULL,
    
    -- Default values
    default_manufacturer TEXT,
    default_model TEXT,
    default_expected_lifespan_years INTEGER,
    default_expected_lifespan_hours INTEGER,
    default_maintenance_interval_days INTEGER,
    default_lubrication_type TEXT,
    default_care_instructions TEXT,
    
    -- AI-generated care guide template
    ai_care_guide_template JSONB,
    
    -- Metadata
    is_standard BOOLEAN DEFAULT FALSE,  -- Built-in template vs user-created
    popularity_score INTEGER DEFAULT 0, -- For sorting suggestions
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_templates_category ON equipment_templates(category);
CREATE INDEX IF NOT EXISTS idx_equipment_templates_class ON equipment_templates(class_id);

-- Step 5: Seed standard equipment templates for common boat classes
INSERT INTO equipment_templates (name, category, subcategory, default_expected_lifespan_years, default_maintenance_interval_days, default_lubrication_type, is_standard) VALUES
    -- Rig components
    ('Aluminum Mast', 'mast', NULL, 25, 365, NULL, TRUE),
    ('Carbon Mast', 'mast', NULL, 30, 365, NULL, TRUE),
    ('Aluminum Boom', 'boom', NULL, 25, 365, NULL, TRUE),
    ('Carbon Boom', 'boom', NULL, 30, 365, NULL, TRUE),
    
    -- Standing rigging
    ('Stainless Steel Forestay', 'forestay', NULL, 10, 365, NULL, TRUE),
    ('Rod Forestay', 'forestay', NULL, 15, 365, NULL, TRUE),
    ('Stainless Steel Backstay', 'backstay', NULL, 10, 365, NULL, TRUE),
    ('Upper Shrouds', 'shrouds', 'upper', 10, 365, NULL, TRUE),
    ('Lower Shrouds', 'shrouds', 'lower', 10, 365, NULL, TRUE),
    ('Spreaders', 'spreaders', NULL, 20, 365, NULL, TRUE),
    
    -- Running rigging
    ('Main Halyard', 'halyards', 'main', 5, 180, NULL, TRUE),
    ('Jib Halyard', 'halyards', 'jib', 5, 180, NULL, TRUE),
    ('Spinnaker Halyard', 'halyards', 'spinnaker', 5, 180, NULL, TRUE),
    ('Main Sheet', 'sheets', 'main', 3, 90, NULL, TRUE),
    ('Jib Sheets', 'sheets', 'jib', 3, 90, NULL, TRUE),
    ('Spinnaker Sheets', 'sheets', 'spinnaker', 3, 90, NULL, TRUE),
    ('Cunningham', 'control_lines', 'cunningham', 5, 180, NULL, TRUE),
    ('Outhaul', 'control_lines', 'outhaul', 5, 180, NULL, TRUE),
    ('Vang/Kicker', 'control_lines', 'vang', 5, 180, NULL, TRUE),
    
    -- Deck hardware
    ('Primary Winch', 'winches', 'primary', 20, 90, 'Harken winch grease', TRUE),
    ('Secondary Winch', 'winches', 'secondary', 20, 90, 'Harken winch grease', TRUE),
    ('Mainsheet Block', 'blocks', 'mainsheet', 15, 180, 'McLube or similar', TRUE),
    ('Cam Cleat', 'cleats', 'cam', 10, 90, 'Light oil', TRUE),
    ('Genoa Track', 'tracks', 'genoa', 20, 365, 'McLube', TRUE),
    
    -- Steering
    ('Tiller', 'tiller', NULL, 15, 365, NULL, TRUE),
    ('Tiller Extension', 'tiller', 'extension', 8, 365, NULL, TRUE),
    ('Rudder', 'rudder', NULL, 20, 365, NULL, TRUE),
    ('Rudder Bearings', 'rudder', 'bearings', 5, 180, 'Marine grease', TRUE),
    
    -- Electronics
    ('Wind Instrument', 'instruments', 'wind', 10, 365, NULL, TRUE),
    ('Speed/Depth', 'instruments', 'speed_depth', 10, 365, NULL, TRUE),
    ('Compass', 'compass', NULL, 15, 365, NULL, TRUE),
    
    -- Safety
    ('Life Jacket/PFD', 'life_jackets', NULL, 10, 365, NULL, TRUE),
    ('Fire Extinguisher', 'safety_gear', 'fire', 5, 365, NULL, TRUE)
ON CONFLICT DO NOTHING;

-- Step 6: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_boat_equipment_maintenance_due ON boat_equipment(next_maintenance_date) 
    WHERE next_maintenance_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_boat_equipment_condition ON boat_equipment(condition_rating) 
    WHERE condition_rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_boat_equipment_category ON boat_equipment(category);
CREATE INDEX IF NOT EXISTS idx_boat_equipment_manufacturer ON boat_equipment(manufacturer) 
    WHERE manufacturer IS NOT NULL;

-- Step 7: Create view for equipment requiring attention
CREATE OR REPLACE VIEW equipment_requiring_attention AS
SELECT 
    be.*,
    sb.name as boat_name,
    sb.sail_number,
    bc.name as class_name,
    CASE 
        WHEN be.next_maintenance_date < CURRENT_DATE THEN 'overdue'
        WHEN be.next_maintenance_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'due_soon'
        WHEN be.condition_rating IS NOT NULL AND be.condition_rating < 50 THEN 'poor_condition'
        WHEN be.replacement_priority = 'critical' THEN 'critical'
        WHEN be.replacement_priority = 'high' THEN 'high_priority'
        ELSE 'normal'
    END as attention_level,
    CASE 
        WHEN be.next_maintenance_date IS NOT NULL 
        THEN be.next_maintenance_date - CURRENT_DATE 
        ELSE NULL 
    END as days_until_maintenance
FROM boat_equipment be
JOIN sailor_boats sb ON sb.id = be.boat_id
LEFT JOIN boat_classes bc ON bc.id = be.class_id
WHERE 
    be.status = 'active'
    AND (
        be.next_maintenance_date <= CURRENT_DATE + INTERVAL '30 days'
        OR (be.condition_rating IS NOT NULL AND be.condition_rating < 60)
        OR be.replacement_priority IN ('critical', 'high')
    );

-- Step 8: Create function to calculate equipment health score for a boat
CREATE OR REPLACE FUNCTION get_boat_equipment_health(p_boat_id UUID)
RETURNS TABLE (
    total_equipment INTEGER,
    overdue_maintenance INTEGER,
    due_soon INTEGER,
    poor_condition INTEGER,
    critical_items INTEGER,
    health_score INTEGER,
    race_ready BOOLEAN
) AS $$
DECLARE
    v_total INTEGER;
    v_overdue INTEGER;
    v_due_soon INTEGER;
    v_poor INTEGER;
    v_critical INTEGER;
    v_score INTEGER;
BEGIN
    -- Count total active equipment
    SELECT COUNT(*) INTO v_total
    FROM boat_equipment
    WHERE boat_id = p_boat_id AND status = 'active';
    
    -- Count overdue maintenance
    SELECT COUNT(*) INTO v_overdue
    FROM boat_equipment
    WHERE boat_id = p_boat_id 
        AND status = 'active'
        AND next_maintenance_date < CURRENT_DATE;
    
    -- Count due soon (within 14 days)
    SELECT COUNT(*) INTO v_due_soon
    FROM boat_equipment
    WHERE boat_id = p_boat_id 
        AND status = 'active'
        AND next_maintenance_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '14 days';
    
    -- Count poor condition
    SELECT COUNT(*) INTO v_poor
    FROM boat_equipment
    WHERE boat_id = p_boat_id 
        AND status = 'active'
        AND condition_rating IS NOT NULL 
        AND condition_rating < 50;
    
    -- Count critical items
    SELECT COUNT(*) INTO v_critical
    FROM boat_equipment
    WHERE boat_id = p_boat_id 
        AND status = 'active'
        AND replacement_priority = 'critical';
    
    -- Calculate health score (0-100)
    IF v_total = 0 THEN
        v_score := 100;
    ELSE
        v_score := GREATEST(0, 100 - (v_overdue * 15) - (v_due_soon * 5) - (v_poor * 10) - (v_critical * 20));
    END IF;
    
    RETURN QUERY SELECT 
        v_total,
        v_overdue,
        v_due_soon,
        v_poor,
        v_critical,
        v_score,
        (v_critical = 0 AND v_overdue = 0 AND v_poor = 0)::BOOLEAN;
END;
$$ LANGUAGE plpgsql;

-- Step 9: RLS policies
ALTER TABLE equipment_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;

-- Equipment maintenance logs: users can only see/manage their own
CREATE POLICY "Users can manage their own equipment maintenance logs"
    ON equipment_maintenance_logs FOR ALL
    USING (sailor_id = auth.uid());

-- Equipment templates: everyone can read, only admins can write
CREATE POLICY "Anyone can read equipment templates"
    ON equipment_templates FOR SELECT
    TO authenticated
    USING (TRUE);

-- Equipment categories: everyone can read
CREATE POLICY "Anyone can read equipment categories"
    ON equipment_categories FOR SELECT
    TO authenticated
    USING (TRUE);

-- Step 10: Grants
GRANT ALL ON equipment_maintenance_logs TO authenticated;
GRANT SELECT ON equipment_templates TO authenticated;
GRANT SELECT ON equipment_categories TO authenticated;
GRANT SELECT ON equipment_requiring_attention TO authenticated;
GRANT EXECUTE ON FUNCTION get_boat_equipment_health TO authenticated;

-- Step 11: Update triggers
CREATE OR REPLACE FUNCTION update_equipment_maintenance_log_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_equipment_maintenance_logs_updated_at
    BEFORE UPDATE ON equipment_maintenance_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_equipment_maintenance_log_timestamp();

-- Update boat_equipment after maintenance log
CREATE OR REPLACE FUNCTION update_equipment_after_maintenance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE boat_equipment
    SET 
        last_maintenance_date = NEW.maintenance_date,
        next_maintenance_date = COALESCE(NEW.next_service_date, NEW.maintenance_date + (maintenance_interval_days || ' days')::INTERVAL),
        condition_rating = COALESCE(NEW.after_condition, condition_rating),
        current_hours = COALESCE(NEW.hours_at_service, current_hours),
        updated_at = NOW()
    WHERE id = NEW.equipment_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_equipment_on_maintenance
    AFTER INSERT ON equipment_maintenance_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_equipment_after_maintenance();

COMMENT ON TABLE equipment_maintenance_logs IS 'Detailed maintenance history for each piece of boat equipment';
COMMENT ON TABLE equipment_templates IS 'Pre-defined equipment templates for quick-add functionality';
COMMENT ON TABLE equipment_categories IS 'Standardized equipment category definitions';
COMMENT ON VIEW equipment_requiring_attention IS 'Equipment items that need maintenance or replacement';
COMMENT ON FUNCTION get_boat_equipment_health IS 'Calculate overall equipment health score for a boat';

