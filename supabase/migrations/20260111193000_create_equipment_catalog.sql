-- ============================================================================
-- Equipment Catalog: Categories and Templates
-- ============================================================================

-- Equipment Categories
CREATE TABLE IF NOT EXISTS equipment_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  parent_category TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Equipment Templates (catalog of standard equipment)
CREATE TABLE IF NOT EXISTS equipment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES equipment_categories(id),
  subcategory TEXT,
  class_id UUID REFERENCES boat_classes(id),
  default_manufacturer TEXT,
  default_model TEXT,
  default_expected_lifespan_years INTEGER,
  default_expected_lifespan_hours INTEGER,
  default_maintenance_interval_days INTEGER,
  default_lubrication_type TEXT,
  default_care_instructions TEXT,
  ai_care_guide_template JSONB,
  is_standard BOOLEAN DEFAULT true,
  popularity_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_equipment_templates_category
ON equipment_templates(category);

CREATE INDEX IF NOT EXISTS idx_equipment_templates_class
ON equipment_templates(class_id);

-- RLS
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_templates ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read categories"
ON equipment_categories FOR SELECT USING (true);

CREATE POLICY "Anyone can read templates"
ON equipment_templates FOR SELECT USING (true);

-- ============================================================================
-- Seed Equipment Categories
-- ============================================================================

INSERT INTO equipment_categories (id, name, description, sort_order) VALUES
  -- Rig
  ('mast', 'Mast', 'Main mast and mast components', 1),
  ('boom', 'Boom', 'Main boom and boom hardware', 2),
  ('spinnaker_pole', 'Spinnaker Pole', 'Spinnaker poles and reaching struts', 3),

  -- Standing Rigging
  ('forestay', 'Forestay', 'Forestay and furler systems', 10),
  ('backstay', 'Backstay', 'Backstay and tensioners', 11),
  ('shrouds', 'Shrouds', 'Upper and lower shrouds', 12),
  ('spreaders', 'Spreaders', 'Spreader arms and tips', 13),

  -- Running Rigging
  ('halyards', 'Halyards', 'Main, jib, and spinnaker halyards', 20),
  ('sheets', 'Sheets', 'Main, jib, and spinnaker sheets', 21),
  ('control_lines', 'Control Lines', 'Cunningham, outhaul, vang, etc.', 22),

  -- Deck Hardware
  ('winches', 'Winches', 'Sheet and halyard winches', 30),
  ('blocks', 'Blocks', 'Turning blocks, sheet blocks, etc.', 31),
  ('cleats', 'Cleats', 'Cam cleats, horn cleats, etc.', 32),
  ('tracks', 'Tracks', 'Genoa and mainsheet tracks', 33),

  -- Steering
  ('tiller', 'Tiller', 'Tiller and tiller extension', 40),
  ('wheel', 'Wheel', 'Steering wheel and pedestal', 41),
  ('rudder', 'Rudder', 'Rudder and rudder hardware', 42),

  -- Hull & Appendages
  ('keel', 'Keel', 'Keel and keel bolts', 50),
  ('centerboard', 'Centerboard', 'Centerboard/daggerboard', 51),

  -- Electronics
  ('instruments', 'Instruments', 'Wind, speed, depth instruments', 60),
  ('gps', 'GPS', 'GPS and chartplotters', 61),
  ('vhf', 'VHF Radio', 'VHF radio and antenna', 62),
  ('compass', 'Compass', 'Tactical and bulkhead compass', 63),

  -- Safety
  ('life_jackets', 'Life Jackets', 'PFDs and lifejackets', 70),
  ('safety_gear', 'Safety Gear', 'Flares, horn, lights, etc.', 71),
  ('anchor', 'Anchor', 'Anchor and rode', 72),

  -- Other
  ('covers', 'Covers', 'Boat covers and bags', 80),
  ('trailer', 'Trailer', 'Trailer and trailer parts', 81),
  ('other', 'Other', 'Other equipment', 99)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Seed Equipment Templates
-- ============================================================================

INSERT INTO equipment_templates (name, category, default_manufacturer, default_model, default_expected_lifespan_years, default_maintenance_interval_days, is_standard, popularity_score) VALUES
  -- Winches
  ('Harken 40.2 Self-Tailing Winch', 'winches', 'Harken', '40.2 ST', 15, 365, true, 100),
  ('Harken 32.2 Self-Tailing Winch', 'winches', 'Harken', '32.2 ST', 15, 365, true, 90),
  ('Lewmar 30 Standard Winch', 'winches', 'Lewmar', '30 ST', 12, 365, true, 80),
  ('Lewmar 40 Self-Tailing Winch', 'winches', 'Lewmar', '40 ST', 12, 365, true, 85),
  ('Andersen 28 Self-Tailing Winch', 'winches', 'Andersen', '28 ST', 15, 365, true, 70),

  -- Blocks
  ('Harken 57mm Carbo Block', 'blocks', 'Harken', '57mm Carbo', 10, 180, true, 90),
  ('Harken 40mm Carbo Block', 'blocks', 'Harken', '40mm Carbo', 10, 180, true, 85),
  ('Ronstan S40 Block', 'blocks', 'Ronstan', 'S40', 8, 180, true, 75),
  ('Lewmar Size 2 Block', 'blocks', 'Lewmar', 'Size 2', 8, 180, true, 70),

  -- Instruments
  ('B&G Triton2 Speed/Depth', 'instruments', 'B&G', 'Triton2', 10, 365, true, 95),
  ('Garmin GNX Wind Display', 'instruments', 'Garmin', 'GNX Wind', 10, 365, true, 90),
  ('Raymarine i70s Multifunction', 'instruments', 'Raymarine', 'i70s', 10, 365, true, 85),
  ('Velocitek Shift Wind Indicator', 'instruments', 'Velocitek', 'Shift', 8, 365, true, 80),

  -- GPS
  ('Garmin GPSMAP 1243xsv', 'gps', 'Garmin', 'GPSMAP 1243xsv', 8, 365, true, 90),
  ('B&G Zeus3S 9', 'gps', 'B&G', 'Zeus3S 9', 8, 365, true, 85),
  ('Raymarine Axiom Pro 9', 'gps', 'Raymarine', 'Axiom Pro 9', 8, 365, true, 80),

  -- Compass
  ('Tacktick Micro Compass', 'compass', 'Tacktick', 'Micro', 15, 365, true, 95),
  ('Silva 103RE Bulkhead Compass', 'compass', 'Silva', '103RE', 20, 365, true, 85),
  ('Plastimo Contest 130', 'compass', 'Plastimo', 'Contest 130', 15, 365, true, 80),

  -- Life Jackets
  ('Spinlock Deckvest LITE+', 'life_jackets', 'Spinlock', 'Deckvest LITE+', 10, 365, true, 95),
  ('Spinlock Deckvest 6D', 'life_jackets', 'Spinlock', 'Deckvest 6D', 10, 365, true, 90),
  ('Mustang MIT 150', 'life_jackets', 'Mustang', 'MIT 150', 10, 365, true, 85),
  ('Crewsaver ErgoFit', 'life_jackets', 'Crewsaver', 'ErgoFit', 10, 365, true, 80),

  -- Mast
  ('Selden Carbon Mast', 'mast', 'Selden', 'Carbon', 25, 365, true, 90),
  ('Sparcraft Aluminum Mast', 'mast', 'Sparcraft', 'Aluminum', 30, 365, true, 85),
  ('Hall Spars Carbon Mast', 'mast', 'Hall Spars', 'Carbon', 25, 365, true, 80),

  -- Boom
  ('Selden Standard Boom', 'boom', 'Selden', 'Standard', 20, 365, true, 85),
  ('Sparcraft Aluminum Boom', 'boom', 'Sparcraft', 'Aluminum', 25, 365, true, 80),

  -- Tiller
  ('Carbon Fiber Tiller Extension', 'tiller', 'Ronstan', 'Carbon', 10, 180, true, 85),
  ('Aluminum Tiller Extension', 'tiller', 'Generic', 'Aluminum', 15, 180, true, 70),

  -- Safety
  ('ACR ResQLink PLB', 'safety_gear', 'ACR', 'ResQLink', 7, 365, true, 95),
  ('Ocean Signal MOB1', 'safety_gear', 'Ocean Signal', 'MOB1', 7, 365, true, 90),
  ('SOLAS Flare Kit', 'safety_gear', 'Orion', 'SOLAS Kit', 3, 365, true, 85)
ON CONFLICT DO NOTHING;
