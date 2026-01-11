-- ============================================================================
-- Sail Products Catalog
-- Stores known sail models from sailmakers by boat class
-- Enables smart sail selection when adding sails to inventory
-- ============================================================================

-- Create sail_products table
CREATE TABLE IF NOT EXISTS sail_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_class_id UUID REFERENCES boat_classes(id) ON DELETE SET NULL,
  boat_class_name TEXT NOT NULL,
  sailmaker TEXT NOT NULL,
  sail_type TEXT NOT NULL,
  model_name TEXT NOT NULL,
  description TEXT,
  optimal_wind_range_min INTEGER,
  optimal_wind_range_max INTEGER,
  material TEXT,
  construction_type TEXT,
  weight_category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT sail_type_check CHECK (sail_type IN ('mainsail', 'jib', 'genoa', 'spinnaker', 'code_zero')),
  CONSTRAINT weight_category_check CHECK (weight_category IN ('light', 'medium', 'heavy', 'allround'))
);

-- Index for quick lookups by class and sailmaker
CREATE INDEX IF NOT EXISTS idx_sail_products_class_maker
ON sail_products(boat_class_name, sailmaker, sail_type);

-- Index for active products
CREATE INDEX IF NOT EXISTS idx_sail_products_active
ON sail_products(is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE sail_products ENABLE ROW LEVEL SECURITY;

-- Public read access (catalog is public knowledge)
CREATE POLICY "sail_products_read_all" ON sail_products
  FOR SELECT USING (TRUE);

-- Only admins can insert/update (future: community contributions)
CREATE POLICY "sail_products_insert_admin" ON sail_products
  FOR INSERT WITH CHECK (FALSE);

CREATE POLICY "sail_products_update_admin" ON sail_products
  FOR UPDATE USING (FALSE);

-- ============================================================================
-- Seed Data: Dragon Class Sails
-- Based on tuning guides and common knowledge
-- ============================================================================

-- Get Dragon class ID
DO $$
DECLARE
  dragon_class_id UUID;
BEGIN
  SELECT id INTO dragon_class_id FROM boat_classes WHERE name ILIKE '%dragon%' LIMIT 1;

  -- North Sails - Mainsails
  INSERT INTO sail_products (boat_class_id, boat_class_name, sailmaker, sail_type, model_name, description, optimal_wind_range_min, optimal_wind_range_max, material, construction_type, weight_category)
  VALUES
    (dragon_class_id, 'Dragon', 'North Sails', 'mainsail', 'A-7+', 'Light air racing main, excellent pointing', 0, 12, 'Dacron', 'Cross-cut', 'light'),
    (dragon_class_id, 'Dragon', 'North Sails', 'mainsail', 'MG-15', 'Medium to heavy air main, good power', 10, 20, 'Dacron', 'Cross-cut', 'medium'),
    (dragon_class_id, 'Dragon', 'North Sails', 'mainsail', 'A-8', 'All-round racing main', 5, 15, 'Dacron', 'Cross-cut', 'allround');

  -- North Sails - Jibs
  INSERT INTO sail_products (boat_class_id, boat_class_name, sailmaker, sail_type, model_name, description, optimal_wind_range_min, optimal_wind_range_max, material, construction_type, weight_category)
  VALUES
    (dragon_class_id, 'Dragon', 'North Sails', 'jib', 'J-9', 'Light air jib, soft entry', 0, 10, 'Dacron', 'Cross-cut', 'light'),
    (dragon_class_id, 'Dragon', 'North Sails', 'jib', 'J-22', 'Medium air jib, versatile', 8, 18, 'Dacron', 'Cross-cut', 'medium'),
    (dragon_class_id, 'Dragon', 'North Sails', 'jib', 'J-6', 'Heavy air jib, flat shape', 15, 25, 'Dacron', 'Cross-cut', 'heavy');

  -- North Sails - Spinnakers
  INSERT INTO sail_products (boat_class_id, boat_class_name, sailmaker, sail_type, model_name, description, optimal_wind_range_min, optimal_wind_range_max, material, construction_type, weight_category)
  VALUES
    (dragon_class_id, 'Dragon', 'North Sails', 'spinnaker', 'S-2', 'All-purpose spinnaker', 6, 16, 'Nylon', 'Radial', 'allround'),
    (dragon_class_id, 'Dragon', 'North Sails', 'spinnaker', 'S-1', 'Light air runner', 4, 10, 'Nylon', 'Radial', 'light'),
    (dragon_class_id, 'Dragon', 'North Sails', 'spinnaker', 'S-3', 'Heavy air spinnaker', 12, 22, 'Nylon', 'Radial', 'heavy');

  -- Petticrows - Mainsails
  INSERT INTO sail_products (boat_class_id, boat_class_name, sailmaker, sail_type, model_name, description, optimal_wind_range_min, optimal_wind_range_max, material, construction_type, weight_category)
  VALUES
    (dragon_class_id, 'Dragon', 'Petticrows', 'mainsail', 'M1', 'Light air main', 0, 12, 'Dacron', 'Cross-cut', 'light'),
    (dragon_class_id, 'Dragon', 'Petticrows', 'mainsail', 'M3', 'Medium/heavy main', 10, 20, 'Dacron', 'Cross-cut', 'medium'),
    (dragon_class_id, 'Dragon', 'Petticrows', 'mainsail', 'M2', 'All-round racing main', 6, 16, 'Dacron', 'Cross-cut', 'allround');

  -- Petticrows - Jibs
  INSERT INTO sail_products (boat_class_id, boat_class_name, sailmaker, sail_type, model_name, description, optimal_wind_range_min, optimal_wind_range_max, material, construction_type, weight_category)
  VALUES
    (dragon_class_id, 'Dragon', 'Petticrows', 'jib', 'J1', 'Light air jib', 0, 10, 'Dacron', 'Cross-cut', 'light'),
    (dragon_class_id, 'Dragon', 'Petticrows', 'jib', 'J3', 'Heavy air jib', 12, 22, 'Dacron', 'Cross-cut', 'heavy');

  -- Petticrows - Spinnakers
  INSERT INTO sail_products (boat_class_id, boat_class_name, sailmaker, sail_type, model_name, description, optimal_wind_range_min, optimal_wind_range_max, material, construction_type, weight_category)
  VALUES
    (dragon_class_id, 'Dragon', 'Petticrows', 'spinnaker', 'S1', 'Racing spinnaker', 6, 16, 'Nylon', 'Radial', 'allround');

  -- Quantum Sails - Mainsails
  INSERT INTO sail_products (boat_class_id, boat_class_name, sailmaker, sail_type, model_name, description, optimal_wind_range_min, optimal_wind_range_max, material, construction_type, weight_category)
  VALUES
    (dragon_class_id, 'Dragon', 'Quantum', 'mainsail', 'Q1', 'All-round racing main', 0, 15, 'Dacron', 'Cross-cut', 'allround'),
    (dragon_class_id, 'Dragon', 'Quantum', 'mainsail', 'Q2', 'Heavy air main', 12, 22, 'Dacron', 'Cross-cut', 'heavy');

  -- Quantum - Jibs
  INSERT INTO sail_products (boat_class_id, boat_class_name, sailmaker, sail_type, model_name, description, optimal_wind_range_min, optimal_wind_range_max, material, construction_type, weight_category)
  VALUES
    (dragon_class_id, 'Dragon', 'Quantum', 'jib', 'QJ1', 'All-round racing jib', 5, 15, 'Dacron', 'Cross-cut', 'allround');

  -- Doyle Sails - Mainsails
  INSERT INTO sail_products (boat_class_id, boat_class_name, sailmaker, sail_type, model_name, description, optimal_wind_range_min, optimal_wind_range_max, material, construction_type, weight_category)
  VALUES
    (dragon_class_id, 'Dragon', 'Doyle', 'mainsail', 'D1', 'Light air main', 0, 12, 'Dacron', 'Cross-cut', 'light'),
    (dragon_class_id, 'Dragon', 'Doyle', 'mainsail', 'D2', 'Medium air main', 8, 18, 'Dacron', 'Cross-cut', 'medium');

  -- Doyle - Jibs
  INSERT INTO sail_products (boat_class_id, boat_class_name, sailmaker, sail_type, model_name, description, optimal_wind_range_min, optimal_wind_range_max, material, construction_type, weight_category)
  VALUES
    (dragon_class_id, 'Dragon', 'Doyle', 'jib', 'DJ1', 'All-round jib', 5, 15, 'Dacron', 'Cross-cut', 'allround');

END $$;

-- Comment on table
COMMENT ON TABLE sail_products IS 'Catalog of known sail models by sailmaker and boat class. Used to provide smart sail selection when adding sails to inventory.';
