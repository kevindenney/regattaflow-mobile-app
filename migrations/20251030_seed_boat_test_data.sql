-- Boat Performance Data Seeding Migration
-- Seeds test data for boat detail enhancements

-- Configuration variables (update the user ID to match your test user)
DO $$
DECLARE
  v_sailor_id UUID := '76069517-bf07-485a-b470-4baa9b9c87a7'; -- User s17
  v_boat_class_id UUID := 'd990c19d-dfb9-4896-b041-92705f8a6c0c'; -- Etchells
  v_boat_class_name TEXT := 'Etchells';
  v_sail_number TEXT := 'USA-1234';
  v_boat_id UUID;
  v_regatta_ids UUID[] := ARRAY[]::UUID[];
  v_regatta_id UUID;
  v_equipment_id UUID;
  v_race_date DATE;
BEGIN

  -- Step 1: Create maintenance_records table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_records') THEN
    CREATE TABLE maintenance_records (
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

    CREATE INDEX idx_maintenance_records_boat_id ON maintenance_records(boat_id);
    CREATE INDEX idx_maintenance_records_sailor_id ON maintenance_records(sailor_id);

    RAISE NOTICE 'Created maintenance_records table';
  END IF;

  -- Step 2: Create or update test boat
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
  )
  ON CONFLICT (sailor_id, sail_number)
  DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW()
  RETURNING id INTO v_boat_id;

  RAISE NOTICE 'Boat created/updated: %', v_boat_id;

  -- Step 3: Create test regattas
  FOR i IN 0..7 LOOP
    v_race_date := CURRENT_DATE - INTERVAL '6 months' + (i * INTERVAL '21 days');

    INSERT INTO regattas (
      name, description, start_date, end_date, status,
      created_by, class_id, boat_id, number_of_races,
      metadata
    ) VALUES (
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
      '{"seeded": true, "test_data": true}'::jsonb
    ) RETURNING id INTO v_regatta_id;

    v_regatta_ids := array_append(v_regatta_ids, v_regatta_id);
  END LOOP;

  RAISE NOTICE 'Created % regattas', array_length(v_regatta_ids, 1);

  -- Step 4: Create regatta results with varied performance
  -- Regatta 0: Spring Championship - mid-pack [5,4,6]
  INSERT INTO regatta_results (regatta_id, sailor_id, boat_name, sail_number, boat_class, finish_position, total_boats, points, race_number, race_date, disqualified, dnf, dns, handicap_rating)
  VALUES
    (v_regatta_ids[1], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 5, 18, 5, 1, CURRENT_DATE - INTERVAL '6 months', false, false, false, 1.0),
    (v_regatta_ids[1], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 4, 18, 4, 2, CURRENT_DATE - INTERVAL '6 months' + INTERVAL '1 day', false, false, false, 1.0),
    (v_regatta_ids[1], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 6, 18, 6, 3, CURRENT_DATE - INTERVAL '6 months' + INTERVAL '2 days', false, false, false, 1.0);

  -- Regatta 1: Summer Regatta - improving [3,2,4]
  INSERT INTO regatta_results (regatta_id, sailor_id, boat_name, sail_number, boat_class, finish_position, total_boats, points, race_number, race_date, disqualified, dnf, dns, handicap_rating)
  VALUES
    (v_regatta_ids[2], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 3, 17, 3, 1, CURRENT_DATE - INTERVAL '5 months', false, false, false, 1.0),
    (v_regatta_ids[2], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 2, 17, 2, 2, CURRENT_DATE - INTERVAL '5 months' + INTERVAL '1 day', false, false, false, 1.0),
    (v_regatta_ids[2], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 4, 17, 4, 3, CURRENT_DATE - INTERVAL '5 months' + INTERVAL '2 days', false, false, false, 1.0);

  -- Regatta 2: Fall Classic - great performance! [1,1,2]
  INSERT INTO regatta_results (regatta_id, sailor_id, boat_name, sail_number, boat_class, finish_position, total_boats, points, race_number, race_date, disqualified, dnf, dns, handicap_rating)
  VALUES
    (v_regatta_ids[3], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 1, 19, 1, 1, CURRENT_DATE - INTERVAL '4 months', false, false, false, 1.0),
    (v_regatta_ids[3], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 1, 19, 1, 2, CURRENT_DATE - INTERVAL '4 months' + INTERVAL '1 day', false, false, false, 1.0),
    (v_regatta_ids[3], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 2, 19, 2, 3, CURRENT_DATE - INTERVAL '4 months' + INTERVAL '2 days', false, false, false, 1.0);

  -- Regatta 3: Winter 1 - consistent [2,3,1]
  INSERT INTO regatta_results (regatta_id, sailor_id, boat_name, sail_number, boat_class, finish_position, total_boats, points, race_number, race_date, disqualified, dnf, dns, handicap_rating)
  VALUES
    (v_regatta_ids[4], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 2, 16, 2, 1, CURRENT_DATE - INTERVAL '3 months', false, false, false, 1.0),
    (v_regatta_ids[4], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 3, 16, 3, 2, CURRENT_DATE - INTERVAL '3 months' + INTERVAL '1 day', false, false, false, 1.0),
    (v_regatta_ids[4], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 1, 16, 1, 3, CURRENT_DATE - INTERVAL '3 months' + INTERVAL '2 days', false, false, false, 1.0);

  -- Regatta 4: Winter 2 - slight dip [4,5,3]
  INSERT INTO regatta_results (regatta_id, sailor_id, boat_name, sail_number, boat_class, finish_position, total_boats, points, race_number, race_date, disqualified, dnf, dns, handicap_rating)
  VALUES
    (v_regatta_ids[5], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 4, 15, 4, 1, CURRENT_DATE - INTERVAL '2 months', false, false, false, 1.0),
    (v_regatta_ids[5], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 5, 15, 5, 2, CURRENT_DATE - INTERVAL '2 months' + INTERVAL '1 day', false, false, false, 1.0),
    (v_regatta_ids[5], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 3, 15, 3, 3, CURRENT_DATE - INTERVAL '2 months' + INTERVAL '2 days', false, false, false, 1.0);

  -- Regatta 5: Memorial Day - winning! [1,2,1]
  INSERT INTO regatta_results (regatta_id, sailor_id, boat_name, sail_number, boat_class, finish_position, total_boats, points, race_number, race_date, disqualified, dnf, dns, handicap_rating)
  VALUES
    (v_regatta_ids[6], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 1, 20, 1, 1, CURRENT_DATE - INTERVAL '1 month', false, false, false, 1.0),
    (v_regatta_ids[6], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 2, 20, 2, 2, CURRENT_DATE - INTERVAL '1 month' + INTERVAL '1 day', false, false, false, 1.0),
    (v_regatta_ids[6], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 1, 20, 1, 3, CURRENT_DATE - INTERVAL '1 month' + INTERVAL '2 days', false, false, false, 1.0);

  -- Regatta 6: Labor Day - podium finishes [2,1,3]
  INSERT INTO regatta_results (regatta_id, sailor_id, boat_name, sail_number, boat_class, finish_position, total_boats, points, race_number, race_date, disqualified, dnf, dns, handicap_rating)
  VALUES
    (v_regatta_ids[7], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 2, 18, 2, 1, CURRENT_DATE - INTERVAL '14 days', false, false, false, 1.0),
    (v_regatta_ids[7], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 1, 18, 1, 2, CURRENT_DATE - INTERVAL '13 days', false, false, false, 1.0),
    (v_regatta_ids[7], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 3, 18, 3, 3, CURRENT_DATE - INTERVAL '12 days', false, false, false, 1.0);

  -- Regatta 7: Halloween - swept the series! [1,1,1]
  INSERT INTO regatta_results (regatta_id, sailor_id, boat_name, sail_number, boat_class, finish_position, total_boats, points, race_number, race_date, disqualified, dnf, dns, handicap_rating)
  VALUES
    (v_regatta_ids[8], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 1, 17, 1, 1, CURRENT_DATE - INTERVAL '7 days', false, false, false, 1.0),
    (v_regatta_ids[8], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 1, 17, 1, 2, CURRENT_DATE - INTERVAL '6 days', false, false, false, 1.0),
    (v_regatta_ids[8], v_sailor_id, v_boat_class_name || ' ' || v_sail_number, v_sail_number, v_boat_class_name, 1, 17, 1, 3, CURRENT_DATE - INTERVAL '5 days', false, false, false, 1.0);

  RAISE NOTICE 'Created 24 regatta results (8 regattas x 3 races each)';

  -- Step 5: Create boat crew members
  INSERT INTO boat_crew_members (sailor_id, boat_id, crew_name, crew_email, position, is_regular)
  VALUES
    (v_sailor_id, v_boat_id, 'Sarah Johnson', 'sarah.j@example.com', 'Main Trimmer', true),
    (v_sailor_id, v_boat_id, 'Mike Chen', 'mike.chen@example.com', 'Jib Trimmer', true),
    (v_sailor_id, v_boat_id, 'Alex Rodriguez', 'alex.r@example.com', 'Pit / Tactician', false),
    (v_sailor_id, v_boat_id, 'Emma Davis', 'emma.davis@example.com', 'Bow', true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Created 4 crew members';

  -- Step 6: Create boat equipment (sails)
  INSERT INTO boat_equipment (
    sailor_id, class_id, boat_id, custom_name, category, subcategory,
    serial_number, purchase_date, purchase_price, purchase_location,
    status, condition, total_races_used, last_used_date, specifications, notes
  ) VALUES
    (v_sailor_id, v_boat_class_id, v_boat_id, 'Main - North Sails M-3', 'sail', 'mainsail',
     'NS-M3-2023-1234', '2023-03-15', 4500, 'North Sails Newport',
     'active', 'excellent', 24, CURRENT_DATE,
     '{"material": "Dacron", "weight": "Medium", "cut": "Cross-cut", "reef_points": 2}'::jsonb,
     'Primary race main, excellent shape retention'),
    (v_sailor_id, v_boat_class_id, v_boat_id, 'Jib #1 - Quantum Racing', 'sail', 'jib',
     'QR-J1-2023-5678', '2023-04-20', 3200, 'Quantum Sails',
     'active', 'good', 22, CURRENT_DATE,
     '{"material": "Mylar", "weight": "Light-Medium", "cut": "Tri-radial"}'::jsonb,
     'All-purpose jib for 6-16 knots'),
    (v_sailor_id, v_boat_class_id, v_boat_id, 'Spinnaker - UK Sailmakers', 'sail', 'spinnaker',
     'UK-SPI-2022-9012', '2022-05-10', 2800, 'UK Sailmakers',
     'active', 'good', 45, CURRENT_DATE,
     '{"material": "Nylon", "area_sqft": 650, "cut": "Tri-radial"}'::jsonb,
     'Reliable all-around kite'),
    (v_sailor_id, v_boat_class_id, v_boat_id, 'Old Main - Practice', 'sail', 'mainsail',
     'NS-M2-2018-3344', '2018-06-15', 3800, 'North Sails',
     'backup', 'fair', 156, '2023-12-01',
     '{"material": "Dacron", "weight": "Heavy", "cut": "Cross-cut", "reef_points": 2}'::jsonb,
     'Retired race sail, now used for practice')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Created 4 equipment items (sails)';

  -- Step 7: Create maintenance records
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
     'Annual insurance survey - hull in excellent condition')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Created 5 maintenance records';

  RAISE NOTICE '';
  RAISE NOTICE '=== Seeding Complete ===';
  RAISE NOTICE 'Boat ID: %', v_boat_id;
  RAISE NOTICE 'Regattas: 8';
  RAISE NOTICE 'Results: 24 (8 regattas x 3 races)';
  RAISE NOTICE 'Crew: 4';
  RAISE NOTICE 'Equipment: 4 sails';
  RAISE NOTICE 'Maintenance: 5 records';
  RAISE NOTICE '';
  RAISE NOTICE 'Performance Summary:';
  RAISE NOTICE '- Total Races: 24';
  RAISE NOTICE '- Wins: 9 (37.5%% win rate)';
  RAISE NOTICE '- Podiums: 19 (79.2%% top-3 rate)';
  RAISE NOTICE '- Average Finish: ~2.3';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now view this boat at: /boat/%', v_boat_id;

END $$;
