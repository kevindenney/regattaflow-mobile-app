-- Complete Boat Data Seeding Script
-- 1. Adds missing columns to regatta_results
-- 2. Creates maintenance_records table
-- 3. Seeds comprehensive test data

-- Step 1: Add missing columns to regatta_results
ALTER TABLE regatta_results
ADD COLUMN IF NOT EXISTS total_boats INTEGER,
ADD COLUMN IF NOT EXISTS race_date DATE;

CREATE INDEX IF NOT EXISTS idx_regatta_results_race_date ON regatta_results(race_date);
CREATE INDEX IF NOT EXISTS idx_regatta_results_sailor_sail ON regatta_results(sailor_id, sail_number);

-- Step 2: Create maintenance_records table
CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES sailor_boats(id) ON DELETE CASCADE,
  sailor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  maintenance_type TEXT NOT NULL,
  description TEXT NOT NULL,
  performed_by TEXT,
  location TEXT,
  cost NUMERIC,
  notes TEXT,
  next_service_due DATE,
  receipts JSONB,
  photos JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_records_boat_id ON maintenance_records(boat_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_sailor_id ON maintenance_records(sailor_id);

-- Step 3: Seed test data
DO $$
DECLARE
  v_sailor_id UUID := '76069517-bf07-485a-b470-4baa9b9c87a7';
  v_boat_class_id UUID := 'd990c19d-dfb9-4896-b041-92705f8a6c0c';
  v_boat_class_name TEXT := 'Etchells';
  v_sail_number TEXT := 'USA-1234';
  v_boat_id UUID;
  v_regatta_ids UUID[] := ARRAY[]::UUID[];
  v_regatta_id UUID;
  v_race_date DATE;
  v_boat_exists BOOLEAN;
BEGIN

  -- Check if boat exists
  SELECT EXISTS(
    SELECT 1 FROM sailor_boats
    WHERE sailor_id = v_sailor_id AND sail_number = v_sail_number
  ) INTO v_boat_exists;

  IF v_boat_exists THEN
    UPDATE sailor_boats
    SET name = v_boat_class_name || ' ' || v_sail_number, updated_at = NOW()
    WHERE sailor_id = v_sailor_id AND sail_number = v_sail_number
    RETURNING id INTO v_boat_id;
    RAISE NOTICE 'Updated existing boat: %', v_boat_id;
  ELSE
    INSERT INTO sailor_boats (
      sailor_id, class_id, sail_number, name, hull_number,
      manufacturer, year_built, hull_material, status, ownership_type,
      storage_location, purchase_date, purchase_price,
      is_owner, is_primary, notes
    ) VALUES (
      v_sailor_id, v_boat_class_id, v_sail_number,
      v_boat_class_name || ' ' || v_sail_number,
      'HULL-5678', 'Etchells Builder', 2018, 'Fiberglass',
      'active', 'owned', 'Newport Harbor YC',
      '2018-06-15', 45000, true, true,
      'Excellent race boat, well maintained'
    ) RETURNING id INTO v_boat_id;
    RAISE NOTICE 'Created new boat: %', v_boat_id;
  END IF;

  -- Create regattas
  FOR i IN 0..7 LOOP
    v_race_date := CURRENT_DATE - INTERVAL '6 months' + (i * INTERVAL '21 days');
    INSERT INTO regattas (name, description, start_date, end_date, status, created_by, class_id, boat_id, number_of_races, metadata)
    VALUES (
      CASE i
        WHEN 0 THEN 'Spring Championship Series'
        WHEN 1 THEN 'Summer Regatta Week'
        WHEN 2 THEN 'Fall Classic'
        WHEN 3 THEN 'Winter Series - Week 1'
        WHEN 4 THEN 'Winter Series - Week 2'
        WHEN 5 THEN 'Memorial Day Regatta'
        WHEN 6 THEN 'Labor Day Challenge'
        WHEN 7 THEN 'Halloween Howler'
      END,
      'Test regatta for boat performance tracking',
      v_race_date, v_race_date, 'completed',
      v_sailor_id, v_boat_class_id, v_boat_id, 3,
      '{"seeded": true}'::jsonb
    ) RETURNING id INTO v_regatta_id;
    v_regatta_ids := array_append(v_regatta_ids, v_regatta_id);
  END LOOP;

  RAISE NOTICE 'Created % regattas', array_length(v_regatta_ids, 1);

  -- Create results (24 total - 8 regattas x 3 races each)
  INSERT INTO regatta_results (
    regatta_id, sailor_id, boat_name, sail_number, boat_class,
    finish_position, total_boats, points, race_number, race_date,
    disqualified, dnf, dns, handicap_rating
  ) VALUES
    -- Spring Championship [5,4,6] - mid-pack
    (v_regatta_ids[1], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 5, 18, 5, 1, CURRENT_DATE - INTERVAL '6 months', false, false, false, 1.0),
    (v_regatta_ids[1], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 4, 18, 4, 2, CURRENT_DATE - INTERVAL '6 months' + INTERVAL '1 day', false, false, false, 1.0),
    (v_regatta_ids[1], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 6, 18, 6, 3, CURRENT_DATE - INTERVAL '6 months' + INTERVAL '2 days', false, false, false, 1.0),
    -- Summer Regatta [3,2,4] - improving
    (v_regatta_ids[2], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 3, 17, 3, 1, CURRENT_DATE - INTERVAL '5 months', false, false, false, 1.0),
    (v_regatta_ids[2], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 2, 17, 2, 2, CURRENT_DATE - INTERVAL '5 months' + INTERVAL '1 day', false, false, false, 1.0),
    (v_regatta_ids[2], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 4, 17, 4, 3, CURRENT_DATE - INTERVAL '5 months' + INTERVAL '2 days', false, false, false, 1.0),
    -- Fall Classic [1,1,2] - great performance!
    (v_regatta_ids[3], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 1, 19, 1, 1, CURRENT_DATE - INTERVAL '4 months', false, false, false, 1.0),
    (v_regatta_ids[3], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 1, 19, 1, 2, CURRENT_DATE - INTERVAL '4 months' + INTERVAL '1 day', false, false, false, 1.0),
    (v_regatta_ids[3], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 2, 19, 2, 3, CURRENT_DATE - INTERVAL '4 months' + INTERVAL '2 days', false, false, false, 1.0),
    -- Winter 1 [2,3,1] - consistent
    (v_regatta_ids[4], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 2, 16, 2, 1, CURRENT_DATE - INTERVAL '3 months', false, false, false, 1.0),
    (v_regatta_ids[4], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 3, 16, 3, 2, CURRENT_DATE - INTERVAL '3 months' + INTERVAL '1 day', false, false, false, 1.0),
    (v_regatta_ids[4], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 1, 16, 1, 3, CURRENT_DATE - INTERVAL '3 months' + INTERVAL '2 days', false, false, false, 1.0),
    -- Winter 2 [4,5,3] - slight dip
    (v_regatta_ids[5], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 4, 15, 4, 1, CURRENT_DATE - INTERVAL '2 months', false, false, false, 1.0),
    (v_regatta_ids[5], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 5, 15, 5, 2, CURRENT_DATE - INTERVAL '2 months' + INTERVAL '1 day', false, false, false, 1.0),
    (v_regatta_ids[5], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 3, 15, 3, 3, CURRENT_DATE - INTERVAL '2 months' + INTERVAL '2 days', false, false, false, 1.0),
    -- Memorial Day [1,2,1] - winning!
    (v_regatta_ids[6], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 1, 20, 1, 1, CURRENT_DATE - INTERVAL '1 month', false, false, false, 1.0),
    (v_regatta_ids[6], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 2, 20, 2, 2, CURRENT_DATE - INTERVAL '1 month' + INTERVAL '1 day', false, false, false, 1.0),
    (v_regatta_ids[6], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 1, 20, 1, 3, CURRENT_DATE - INTERVAL '1 month' + INTERVAL '2 days', false, false, false, 1.0),
    -- Labor Day [2,1,3] - podium finishes
    (v_regatta_ids[7], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 2, 18, 2, 1, CURRENT_DATE - INTERVAL '14 days', false, false, false, 1.0),
    (v_regatta_ids[7], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 1, 18, 1, 2, CURRENT_DATE - INTERVAL '13 days', false, false, false, 1.0),
    (v_regatta_ids[7], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 3, 18, 3, 3, CURRENT_DATE - INTERVAL '12 days', false, false, false, 1.0),
    -- Halloween [1,1,1] - swept the series!
    (v_regatta_ids[8], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 1, 17, 1, 1, CURRENT_DATE - INTERVAL '7 days', false, false, false, 1.0),
    (v_regatta_ids[8], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 1, 17, 1, 2, CURRENT_DATE - INTERVAL '6 days', false, false, false, 1.0),
    (v_regatta_ids[8], v_sailor_id, 'Etchells USA-1234', v_sail_number, v_boat_class_name, 1, 17, 1, 3, CURRENT_DATE - INTERVAL '5 days', false, false, false, 1.0);

  RAISE NOTICE 'Created 24 regatta results';

  -- Crew members
  DELETE FROM boat_crew_members WHERE boat_id = v_boat_id;
  INSERT INTO boat_crew_members (sailor_id, boat_id, crew_name, crew_email, position, is_regular) VALUES
    (v_sailor_id, v_boat_id, 'Sarah Johnson', 'sarah.j@example.com', 'Main Trimmer', true),
    (v_sailor_id, v_boat_id, 'Mike Chen', 'mike.chen@example.com', 'Jib Trimmer', true),
    (v_sailor_id, v_boat_id, 'Alex Rodriguez', 'alex.r@example.com', 'Pit / Tactician', false),
    (v_sailor_id, v_boat_id, 'Emma Davis', 'emma.davis@example.com', 'Bow', true);

  RAISE NOTICE 'Created 4 crew members';

  -- Equipment (sails)
  DELETE FROM boat_equipment WHERE boat_id = v_boat_id;
  INSERT INTO boat_equipment (
    sailor_id, class_id, boat_id, custom_name, category, subcategory,
    serial_number, purchase_date, purchase_price, purchase_location,
    status, condition, total_races_used, last_used_date, specifications, notes
  ) VALUES
    (v_sailor_id, v_boat_class_id, v_boat_id, 'Main - North Sails M-3', 'sail', 'mainsail',
     'NS-M3-2023-1234', '2023-03-15', 4500, 'North Sails Newport',
     'active', 'excellent', 24, CURRENT_DATE,
     '{"material": "Dacron", "weight": "Medium"}'::jsonb, 'Primary race main'),
    (v_sailor_id, v_boat_class_id, v_boat_id, 'Jib #1 - Quantum Racing', 'sail', 'jib',
     'QR-J1-2023-5678', '2023-04-20', 3200, 'Quantum Sails',
     'active', 'good', 22, CURRENT_DATE,
     '{"material": "Mylar"}'::jsonb, 'All-purpose jib for 6-16 knots'),
    (v_sailor_id, v_boat_class_id, v_boat_id, 'Spinnaker - UK Sailmakers', 'sail', 'spinnaker',
     'UK-SPI-2022-9012', '2022-05-10', 2800, 'UK Sailmakers',
     'active', 'good', 45, CURRENT_DATE,
     '{"material": "Nylon"}'::jsonb, 'Reliable all-around kite'),
    (v_sailor_id, v_boat_class_id, v_boat_id, 'Old Main - Practice', 'sail', 'mainsail',
     'NS-M2-2018-3344', '2018-06-15', 3800, 'North Sails',
     'backup', 'fair', 156, '2023-12-01',
     '{"material": "Dacron"}'::jsonb, 'Retired race sail, practice only');

  RAISE NOTICE 'Created 4 equipment items (sails)';

  -- Maintenance records
  DELETE FROM maintenance_records WHERE boat_id = v_boat_id;
  INSERT INTO maintenance_records (
    boat_id, sailor_id, maintenance_date, maintenance_type,
    description, performed_by, cost, notes
  ) VALUES
    (v_boat_id, v_sailor_id, '2024-03-15', 'Inspection',
     'Pre-season rigging inspection', 'Newport Rigging Services', 350,
     'All standing rigging checked, replaced 2 cotter pins'),
    (v_boat_id, v_sailor_id, '2024-05-20', 'Repair',
     'Bottom paint touch-up', 'Self', 125,
     'Touched up minor scratches from dock contact'),
    (v_boat_id, v_sailor_id, '2024-07-10', 'Service',
     'Winch service', 'Harken Service Center', 450,
     'All winches serviced, replaced bearings on #3 jib winch'),
    (v_boat_id, v_sailor_id, '2024-08-05', 'Replacement',
     'New jib sheets', 'Self', 180,
     'Replaced worn jib sheets with New England Ropes'),
    (v_boat_id, v_sailor_id, '2024-09-12', 'Inspection',
     'Hull inspection and survey', 'Marine Surveyor Inc', 500,
     'Annual insurance survey - hull in excellent condition');

  RAISE NOTICE 'Created 5 maintenance records';

  RAISE NOTICE '';
  RAISE NOTICE '=== SEEDING COMPLETE ===';
  RAISE NOTICE 'Boat ID: %', v_boat_id;
  RAISE NOTICE 'View at: /boat/%', v_boat_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - 8 regattas';
  RAISE NOTICE '  - 24 race results';
  RAISE NOTICE '  - 4 crew members';
  RAISE NOTICE '  - 4 sails';
  RAISE NOTICE '  - 5 maintenance records';
  RAISE NOTICE '';
  RAISE NOTICE 'Performance Stats:';
  RAISE NOTICE '  - 9 wins (37.5%% win rate)';
  RAISE NOTICE '  - 19 podiums (79.2%% top-3 rate)';
  RAISE NOTICE '  - ~2.3 average finish';

END $$;
