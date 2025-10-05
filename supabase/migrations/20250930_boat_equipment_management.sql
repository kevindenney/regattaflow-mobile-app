-- Boat Equipment Management System Migration
-- Physical boat tracking, equipment inventory, maintenance logs, and tuning optimization

-- ==========================================
-- EQUIPMENT CATEGORIES & MANUFACTURERS
-- ==========================================

-- Equipment manufacturers and product specs
CREATE TABLE IF NOT EXISTS equipment_manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'sails', 'masts', 'hardware', 'bottom_paint', 'rigging', 'electronics'
  website TEXT,
  support_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product catalog with lifecycle data
CREATE TABLE IF NOT EXISTS equipment_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID REFERENCES equipment_manufacturers(id) ON DELETE CASCADE,

  -- Product Info
  name TEXT NOT NULL,
  model_number TEXT,
  category TEXT NOT NULL, -- 'mainsail', 'jib', 'spinnaker', 'mast', 'boom', 'bottom_paint', 'vang', 'sheet', 'block'
  subcategory TEXT, -- 'all_purpose', 'heavy_air', 'light_air', 'racing', 'cruising'

  -- Lifecycle Data
  expected_lifespan_hours INTEGER, -- Racing hours before replacement recommended
  expected_lifespan_months INTEGER, -- Calendar months before replacement
  maintenance_interval_hours INTEGER, -- Service interval
  maintenance_interval_months INTEGER,

  -- Specifications
  specifications JSONB DEFAULT '{}', -- Weight, dimensions, materials, etc.
  optimal_conditions JSONB DEFAULT '{}', -- Wind ranges, temperatures, venues

  -- Documentation
  manual_url TEXT,
  tuning_guide_url TEXT,
  warranty_months INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_products_manufacturer ON equipment_products(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_equipment_products_category ON equipment_products(category);

-- ==========================================
-- BOAT EQUIPMENT INVENTORY
-- ==========================================

-- Physical equipment items owned by sailor for specific boat
CREATE TABLE IF NOT EXISTS boat_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES boat_classes(id) ON DELETE CASCADE,

  -- Equipment Identity
  product_id UUID REFERENCES equipment_products(id) ON DELETE SET NULL,
  custom_name TEXT NOT NULL, -- "Main #1", "Jib Heavy Air", "Mast - Original"
  category TEXT NOT NULL,
  subcategory TEXT,

  -- Physical Details
  serial_number TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  purchase_location TEXT,

  -- Current Status
  status TEXT NOT NULL CHECK (status IN ('active', 'backup', 'retired', 'repair', 'lost')) DEFAULT 'active',
  condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'needs_replacement')),

  -- Usage Tracking
  total_usage_hours DECIMAL(8,2) DEFAULT 0,
  total_races_used INTEGER DEFAULT 0,
  last_used_date DATE,

  -- Specifications (if custom/modified)
  specifications JSONB DEFAULT '{}',

  -- Documents & Photos
  documents JSONB DEFAULT '[]', -- Array of {type, url, name, uploaded_at}
  photos JSONB DEFAULT '[]', -- Array of {url, caption, uploaded_at}

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boat_equipment_sailor ON boat_equipment(sailor_id);
CREATE INDEX IF NOT EXISTS idx_boat_equipment_class ON boat_equipment(class_id);
CREATE INDEX IF NOT EXISTS idx_boat_equipment_category ON boat_equipment(category);
CREATE INDEX IF NOT EXISTS idx_boat_equipment_status ON boat_equipment(status);

-- ==========================================
-- MAINTENANCE LOGS
-- ==========================================

-- Historical maintenance and service records
CREATE TABLE IF NOT EXISTS equipment_maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES boat_equipment(id) ON DELETE CASCADE,
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Maintenance Event
  maintenance_date DATE NOT NULL,
  maintenance_type TEXT NOT NULL, -- 'installation', 'repair', 'service', 'replacement', 'inspection', 'modification'

  -- Details
  description TEXT NOT NULL,
  performed_by TEXT, -- Service provider or self
  location TEXT,
  cost DECIMAL(10,2),

  -- Part/Product Changes
  parts_replaced JSONB DEFAULT '[]', -- Array of {part_name, part_number, cost}
  vendor TEXT,

  -- Condition Assessment
  condition_before TEXT,
  condition_after TEXT,
  issues_found TEXT[],
  recommendations TEXT,

  -- Next Service Prediction
  next_service_due_date DATE,
  next_service_due_hours DECIMAL(8,2),

  -- Documents
  receipts JSONB DEFAULT '[]', -- Array of {url, amount, vendor}
  photos JSONB DEFAULT '[]',
  warranty_info JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_logs_equipment ON equipment_maintenance_logs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_sailor ON equipment_maintenance_logs(sailor_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_date ON equipment_maintenance_logs(maintenance_date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_type ON equipment_maintenance_logs(maintenance_type);

-- ==========================================
-- TUNING SETTINGS
-- ==========================================

-- Rig and sail tuning configurations
CREATE TABLE IF NOT EXISTS boat_tuning_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES boat_classes(id) ON DELETE CASCADE,

  -- Setting Identity
  name TEXT NOT NULL, -- "Heavy Air Setup", "Light Wind Hong Kong", "Championship Tune"
  description TEXT,

  -- Conditions
  wind_min INTEGER, -- Knots
  wind_max INTEGER,
  wave_conditions TEXT[], -- 'flat', 'chop', 'swell'
  venue_id TEXT REFERENCES sailing_venues(id),

  -- Rig Settings
  rig_settings JSONB DEFAULT '{}', -- {mast_rake: "28", shroud_tension: "300lbs", forestay: "tight"}
  sail_settings JSONB DEFAULT '{}', -- {outhaul: "max", cunningham: "medium", vang: "light"}

  -- Equipment Used
  equipment_ids UUID[], -- Array of boat_equipment IDs used in this setup

  -- Performance Data
  times_used INTEGER DEFAULT 0,
  avg_finish_position DECIMAL(5,2),
  best_finish INTEGER,
  worst_finish INTEGER,
  total_races_with_setup INTEGER DEFAULT 0,

  -- Validation
  validated BOOLEAN DEFAULT false,
  validated_by TEXT, -- Coach name or source
  validation_notes TEXT,

  -- Status
  is_favorite BOOLEAN DEFAULT false,
  last_used_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tuning_settings_sailor ON boat_tuning_settings(sailor_id);
CREATE INDEX IF NOT EXISTS idx_tuning_settings_class ON boat_tuning_settings(class_id);
CREATE INDEX IF NOT EXISTS idx_tuning_settings_venue ON boat_tuning_settings(venue_id);
CREATE INDEX IF NOT EXISTS idx_tuning_settings_wind ON boat_tuning_settings(wind_min, wind_max);

-- ==========================================
-- EQUIPMENT USAGE TRACKING
-- ==========================================

-- Track which equipment was used in which races
CREATE TABLE IF NOT EXISTS equipment_race_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES boat_equipment(id) ON DELETE CASCADE,
  regatta_id UUID REFERENCES regattas(id) ON DELETE CASCADE,
  race_number INTEGER,

  -- Usage Details
  usage_date DATE NOT NULL,
  usage_hours DECIMAL(5,2) DEFAULT 1.0,
  tuning_setting_id UUID REFERENCES boat_tuning_settings(id) ON DELETE SET NULL,

  -- Performance
  finish_position INTEGER,
  notes TEXT,

  -- Conditions
  wind_speed_min INTEGER,
  wind_speed_max INTEGER,
  venue_id TEXT REFERENCES sailing_venues(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_usage_equipment ON equipment_race_usage(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_usage_regatta ON equipment_race_usage(regatta_id);
CREATE INDEX IF NOT EXISTS idx_equipment_usage_date ON equipment_race_usage(usage_date DESC);

-- ==========================================
-- EQUIPMENT ALERTS & RECOMMENDATIONS
-- ==========================================

-- AI-generated alerts for maintenance and optimization
CREATE TABLE IF NOT EXISTS equipment_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES boat_equipment(id) ON DELETE CASCADE,

  -- Alert Details
  alert_type TEXT NOT NULL, -- 'maintenance_due', 'replacement_recommended', 'performance_degradation', 'optimization_opportunity'
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'urgent')) DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- AI Context
  ai_generated BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(3,2), -- 0.00 to 1.00
  ai_reasoning TEXT,

  -- Action Items
  recommended_action TEXT,
  estimated_cost DECIMAL(10,2),
  due_date DATE,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('active', 'dismissed', 'completed')) DEFAULT 'active',
  dismissed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_alerts_sailor ON equipment_alerts(sailor_id);
CREATE INDEX IF NOT EXISTS idx_equipment_alerts_equipment ON equipment_alerts(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_alerts_status ON equipment_alerts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_equipment_alerts_severity ON equipment_alerts(severity);

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Equipment Manufacturers (public read)
ALTER TABLE equipment_manufacturers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view manufacturers" ON equipment_manufacturers;
CREATE POLICY "Anyone can view manufacturers" ON equipment_manufacturers FOR SELECT USING (true);

-- Equipment Products (public read)
ALTER TABLE equipment_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view products" ON equipment_products;
CREATE POLICY "Anyone can view products" ON equipment_products FOR SELECT USING (true);

-- Boat Equipment (private to sailor)
ALTER TABLE boat_equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sailors can view their own equipment" ON boat_equipment;
CREATE POLICY "Sailors can view their own equipment" ON boat_equipment FOR SELECT USING (auth.uid() = sailor_id);
DROP POLICY IF EXISTS "Sailors can manage their own equipment" ON boat_equipment;
CREATE POLICY "Sailors can manage their own equipment" ON boat_equipment FOR ALL USING (auth.uid() = sailor_id);

-- Maintenance Logs (private to sailor)
ALTER TABLE equipment_maintenance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sailors can view their own maintenance logs" ON equipment_maintenance_logs;
CREATE POLICY "Sailors can view their own maintenance logs" ON equipment_maintenance_logs FOR SELECT USING (auth.uid() = sailor_id);
DROP POLICY IF EXISTS "Sailors can manage their own maintenance logs" ON equipment_maintenance_logs;
CREATE POLICY "Sailors can manage their own maintenance logs" ON equipment_maintenance_logs FOR ALL USING (auth.uid() = sailor_id);

-- Tuning Settings (private to sailor)
ALTER TABLE boat_tuning_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sailors can view their own tuning settings" ON boat_tuning_settings;
CREATE POLICY "Sailors can view their own tuning settings" ON boat_tuning_settings FOR SELECT USING (auth.uid() = sailor_id);
DROP POLICY IF EXISTS "Sailors can manage their own tuning settings" ON boat_tuning_settings;
CREATE POLICY "Sailors can manage their own tuning settings" ON boat_tuning_settings FOR ALL USING (auth.uid() = sailor_id);

-- Equipment Usage (private to sailor via equipment)
ALTER TABLE equipment_race_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sailors can view their equipment usage" ON equipment_race_usage;
CREATE POLICY "Sailors can view their equipment usage" ON equipment_race_usage FOR SELECT
  USING (equipment_id IN (SELECT id FROM boat_equipment WHERE sailor_id = auth.uid()));
DROP POLICY IF EXISTS "Sailors can manage their equipment usage" ON equipment_race_usage;
CREATE POLICY "Sailors can manage their equipment usage" ON equipment_race_usage FOR ALL
  USING (equipment_id IN (SELECT id FROM boat_equipment WHERE sailor_id = auth.uid()));

-- Equipment Alerts (private to sailor)
ALTER TABLE equipment_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sailors can view their own alerts" ON equipment_alerts;
CREATE POLICY "Sailors can view their own alerts" ON equipment_alerts FOR SELECT USING (auth.uid() = sailor_id);
DROP POLICY IF EXISTS "Sailors can manage their own alerts" ON equipment_alerts;
CREATE POLICY "Sailors can manage their own alerts" ON equipment_alerts FOR ALL USING (auth.uid() = sailor_id);

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Update equipment usage hours when race usage is logged
CREATE OR REPLACE FUNCTION update_equipment_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE boat_equipment
  SET
    total_usage_hours = total_usage_hours + NEW.usage_hours,
    total_races_used = total_races_used + 1,
    last_used_date = NEW.usage_date,
    updated_at = NOW()
  WHERE id = NEW.equipment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_equipment_usage_trigger ON equipment_race_usage;
CREATE TRIGGER update_equipment_usage_trigger
  AFTER INSERT ON equipment_race_usage
  FOR EACH ROW EXECUTE FUNCTION update_equipment_usage();

-- Update tuning settings performance when used
CREATE OR REPLACE FUNCTION update_tuning_performance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tuning_setting_id IS NOT NULL AND NEW.finish_position IS NOT NULL THEN
    UPDATE boat_tuning_settings
    SET
      times_used = times_used + 1,
      total_races_with_setup = total_races_with_setup + 1,
      last_used_date = NEW.usage_date,
      best_finish = LEAST(COALESCE(best_finish, 999), NEW.finish_position),
      worst_finish = GREATEST(COALESCE(worst_finish, 0), NEW.finish_position),
      avg_finish_position = (
        SELECT AVG(finish_position)::DECIMAL(5,2)
        FROM equipment_race_usage
        WHERE tuning_setting_id = NEW.tuning_setting_id
          AND finish_position IS NOT NULL
      ),
      updated_at = NOW()
    WHERE id = NEW.tuning_setting_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tuning_performance_trigger ON equipment_race_usage;
CREATE TRIGGER update_tuning_performance_trigger
  AFTER INSERT OR UPDATE ON equipment_race_usage
  FOR EACH ROW EXECUTE FUNCTION update_tuning_performance();

-- Generate maintenance alerts based on lifecycle data
CREATE OR REPLACE FUNCTION check_equipment_maintenance_due()
RETURNS TRIGGER AS $$
DECLARE
  product_record RECORD;
  months_since_purchase INTEGER;
  alert_exists BOOLEAN;
BEGIN
  -- Only check for active equipment
  IF NEW.status != 'active' THEN
    RETURN NEW;
  END IF;

  -- Get product lifecycle data
  SELECT * INTO product_record
  FROM equipment_products
  WHERE id = NEW.product_id;

  IF product_record IS NOT NULL THEN
    -- Check usage hours
    IF product_record.expected_lifespan_hours IS NOT NULL
       AND NEW.total_usage_hours >= product_record.expected_lifespan_hours * 0.8 THEN

      SELECT EXISTS(
        SELECT 1 FROM equipment_alerts
        WHERE equipment_id = NEW.id
          AND alert_type = 'replacement_recommended'
          AND status = 'active'
      ) INTO alert_exists;

      IF NOT alert_exists THEN
        INSERT INTO equipment_alerts (
          sailor_id, equipment_id, alert_type, severity, title, message, ai_generated, recommended_action
        ) VALUES (
          NEW.sailor_id,
          NEW.id,
          'replacement_recommended',
          'warning',
          NEW.custom_name || ' nearing end of life',
          'This equipment has ' || NEW.total_usage_hours || ' racing hours. Manufacturer recommends replacement at ' || product_record.expected_lifespan_hours || ' hours.',
          true,
          'Consider inspecting or replacing before next major regatta'
        );
      END IF;
    END IF;

    -- Check age in months
    IF product_record.expected_lifespan_months IS NOT NULL AND NEW.purchase_date IS NOT NULL THEN
      months_since_purchase := EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.purchase_date)) * 12
                              + EXTRACT(MONTH FROM AGE(CURRENT_DATE, NEW.purchase_date));

      IF months_since_purchase >= product_record.expected_lifespan_months * 0.8 THEN
        SELECT EXISTS(
          SELECT 1 FROM equipment_alerts
          WHERE equipment_id = NEW.id
            AND alert_type = 'maintenance_due'
            AND status = 'active'
        ) INTO alert_exists;

        IF NOT alert_exists THEN
          INSERT INTO equipment_alerts (
            sailor_id, equipment_id, alert_type, severity, title, message, ai_generated, recommended_action
          ) VALUES (
            NEW.sailor_id,
            NEW.id,
            'maintenance_due',
            'warning',
            NEW.custom_name || ' age-based maintenance due',
            'This equipment is ' || months_since_purchase || ' months old. Consider inspection or replacement.',
            true,
            'Schedule maintenance or replacement'
          );
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_equipment_maintenance_trigger ON boat_equipment;
CREATE TRIGGER check_equipment_maintenance_trigger
  AFTER INSERT OR UPDATE OF total_usage_hours, status ON boat_equipment
  FOR EACH ROW EXECUTE FUNCTION check_equipment_maintenance_due();

-- Standard updated_at triggers
DROP TRIGGER IF EXISTS update_equipment_products_updated_at ON equipment_products;
CREATE TRIGGER update_equipment_products_updated_at BEFORE UPDATE ON equipment_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_boat_equipment_updated_at ON boat_equipment;
CREATE TRIGGER update_boat_equipment_updated_at BEFORE UPDATE ON boat_equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_logs_updated_at ON equipment_maintenance_logs;
CREATE TRIGGER update_maintenance_logs_updated_at BEFORE UPDATE ON equipment_maintenance_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tuning_settings_updated_at ON boat_tuning_settings;
CREATE TRIGGER update_tuning_settings_updated_at BEFORE UPDATE ON boat_tuning_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- SAMPLE DATA
-- ==========================================

-- Insert common manufacturers
INSERT INTO equipment_manufacturers (name, category, website) VALUES
  ('North Sails', 'sails', 'https://northsails.com'),
  ('Quantum Sails', 'sails', 'https://quantumsails.com'),
  ('Doyle Sails', 'sails', 'https://doylesails.com'),
  ('Seldén Mast', 'masts', 'https://seldenmast.com'),
  ('Harken', 'hardware', 'https://harken.com'),
  ('Ronstan', 'hardware', 'https://ronstan.com'),
  ('Spinlock', 'hardware', 'https://spinlock.co.uk'),
  ('Akzo Nobel', 'bottom_paint', 'https://international-marine.com'),
  ('Interlux', 'bottom_paint', 'https://yachtpaint.com'),
  ('Navtec', 'rigging', 'https://navtec.net')
ON CONFLICT (name) DO NOTHING;

-- Grant permissions
GRANT ALL ON equipment_manufacturers TO authenticated;
GRANT ALL ON equipment_products TO authenticated;
GRANT ALL ON boat_equipment TO authenticated;
GRANT ALL ON equipment_maintenance_logs TO authenticated;
GRANT ALL ON boat_tuning_settings TO authenticated;
GRANT ALL ON equipment_race_usage TO authenticated;
GRANT ALL ON equipment_alerts TO authenticated;

COMMENT ON TABLE boat_equipment IS 'Physical equipment inventory for sailor boats - sails, rigs, hardware';
COMMENT ON TABLE equipment_maintenance_logs IS 'Historical maintenance records and service logs';
COMMENT ON TABLE boat_tuning_settings IS 'Rig and sail tuning configurations with performance tracking';
COMMENT ON TABLE equipment_race_usage IS 'Track equipment usage across races for performance correlation';
COMMENT ON TABLE equipment_alerts IS 'AI-generated maintenance alerts and optimization recommendations';