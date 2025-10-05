-- ============================================================================
-- HONG KONG VENUE INTELLIGENCE - Sample Data
-- ============================================================================
-- Populates Hong Kong with comprehensive venue intelligence:
-- Yacht clubs, classes, fleets, races, documents, and services

-- Get Hong Kong venue ID
DO $$
DECLARE
  hk_venue_id TEXT;
BEGIN
  SELECT id INTO hk_venue_id FROM sailing_venues
  WHERE name LIKE '%Hong Kong%' OR id = 'hong-kong'
  LIMIT 1;

  IF hk_venue_id IS NULL THEN
    RAISE EXCEPTION 'Hong Kong venue not found in sailing_venues table';
  END IF;

  -- ============================================================================
  -- YACHT CLUBS
  -- ============================================================================

  -- Royal Hong Kong Yacht Club
  INSERT INTO yacht_clubs (id, venue_id, name, description, website, prestige_level, contact_email, contact_phone)
  VALUES (
    'rhkyc',
    hk_venue_id,
    'Royal Hong Kong Yacht Club',
    'Founded in 1894, RHKYC is one of Asia''s premier yacht clubs with world-class facilities in Kellett Island and Middle Island.',
    'https://www.rhkyc.org.hk',
    'international',
    'office@rhkyc.org.hk',
    '+852 2832 2817'
  ) ON CONFLICT (id) DO NOTHING;

  -- Aberdeen Boat Club
  INSERT INTO yacht_clubs (id, venue_id, name, description, website, prestige_level, contact_email, contact_phone)
  VALUES (
    'abc-hk',
    hk_venue_id,
    'Aberdeen Boat Club',
    'Historic club established in 1967, known for dinghy racing and junior sailing programs.',
    'https://www.abclubhk.com',
    'national',
    'office@abclubhk.com',
    '+852 2555 6216'
  ) ON CONFLICT (id) DO NOTHING;

  -- Hebe Haven Yacht Club
  INSERT INTO yacht_clubs (id, venue_id, name, description, website, prestige_level, contact_email, contact_phone)
  VALUES (
    'hhyc',
    hk_venue_id,
    'Hebe Haven Yacht Club',
    'Located in Pak Sha Wan, HHYC serves the eastern waters with excellent dinghy and keelboat facilities.',
    'https://www.hhyc.org.hk',
    'regional',
    'office@hhyc.org.hk',
    '+852 2719 8200'
  ) ON CONFLICT (id) DO NOTHING;

  -- ============================================================================
  -- CLUB CLASSES
  -- ============================================================================

  -- RHKYC Classes
  INSERT INTO club_classes (club_id, class_name, class_association, active, fleet_size, racing_schedule, website_url)
  VALUES
    ('rhkyc', 'Dragon', 'International Dragon Association', true, 28, 'Wednesday evenings, Sunday mornings', 'https://intdragon.net'),
    ('rhkyc', 'J/80', 'J/80 Class Association', true, 12, 'Saturday afternoons', 'https://j80.org'),
    ('rhkyc', 'J/70', 'J/70 International Class Association', true, 15, 'Sunday mornings', 'https://j70ica.org'),
    ('rhkyc', 'Sports Boat', 'RHKYC Sports Boat Fleet', true, 8, 'Saturday mornings', NULL),
    ('rhkyc', 'IRC', 'Royal Ocean Racing Club', true, 35, 'Weekend races', 'https://rorc.org')
  ON CONFLICT (club_id, class_name) DO NOTHING;

  -- ABC Classes
  INSERT INTO club_classes (club_id, class_name, class_association, active, fleet_size, racing_schedule, website_url)
  VALUES
    ('abc-hk', 'ILCA 7 (Laser)', 'International Laser Class Association', true, 45, 'Wednesday evenings, Sunday mornings', 'https://laserinternational.org'),
    ('abc-hk', 'ILCA 6 (Laser Radial)', 'International Laser Class Association', true, 32, 'Wednesday evenings, Sunday mornings', 'https://laserinternational.org'),
    ('abc-hk', '420', 'International 420 Class Association', true, 18, 'Sunday mornings', 'https://420sailing.org'),
    ('abc-hk', '29er', 'International 29er Class Association', true, 12, 'Saturday afternoons', 'https://29er.org'),
    ('abc-hk', 'Optimist', 'International Optimist Dinghy Association', true, 55, 'Saturday & Sunday mornings', 'https://optiworld.org')
  ON CONFLICT (club_id, class_name) DO NOTHING;

  -- HHYC Classes
  INSERT INTO club_classes (club_id, class_name, class_association, active, fleet_size, racing_schedule, website_url)
  VALUES
    ('hhyc', 'RS Feva', 'RS Feva Class Association', true, 22, 'Sunday mornings', 'https://rsfeva.org'),
    ('hhyc', 'Laser Bahia', NULL, true, 8, 'Wednesday evenings', NULL),
    ('hhyc', 'Hobie 16', 'International Hobie Class Association', true, 6, 'Saturday afternoons', 'https://hobieclass.com')
  ON CONFLICT (club_id, class_name) DO NOTHING;

  -- ============================================================================
  -- CLUB FACILITIES
  -- ============================================================================

  -- RHKYC Facilities
  INSERT INTO club_facilities (club_id, type, name, available, reservation_required, contact_info)
  VALUES
    ('rhkyc', 'boat_ramp', 'Kellett Island Main Ramp', true, false, '{"phone": "+852 2832 2817"}'::jsonb),
    ('rhkyc', 'dock', 'Middle Island Marina', true, true, '{"phone": "+852 2832 2817", "email": "marina@rhkyc.org.hk"}'::jsonb),
    ('rhkyc', 'storage', 'Dry Sail Storage', true, true, '{"email": "storage@rhkyc.org.hk"}'::jsonb),
    ('rhkyc', 'crane', '10-Ton Crane', true, true, '{"phone": "+852 2832 2817"}'::jsonb),
    ('rhkyc', 'workshop', 'Boat Repair Workshop', true, false, '{"hours": "Mon-Fri 9am-6pm"}'::jsonb)
  ON CONFLICT DO NOTHING;

  -- ABC Facilities
  INSERT INTO club_facilities (club_id, type, name, available, reservation_required, contact_info)
  VALUES
    ('abc-hk', 'boat_ramp', 'Aberdeen Main Slipway', true, false, '{"phone": "+852 2555 6216"}'::jsonb),
    ('abc-hk', 'storage', 'Dinghy Storage Racks', true, true, '{"email": "storage@abclubhk.com"}'::jsonb),
    ('abc-hk', 'changing_room', 'Sailors'' Changing Rooms', true, false, NULL),
    ('abc-hk', 'classroom', 'Sailing School Classroom', true, true, '{"email": "sailing@abclubhk.com"}'::jsonb)
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- RACE CALENDAR
  -- ============================================================================

  -- RHKYC Races (upcoming)
  INSERT INTO club_race_calendar (
    club_id, venue_id, event_name, event_type, start_date, end_date,
    registration_deadline, race_format, classes_included, entry_fee, currency,
    nor_url, si_url
  )
  VALUES
    (
      'rhkyc', hk_venue_id, 'Wednesday Night Dragon Series - Spring 2026', 'weeknight_series',
      '2026-03-04', '2026-05-27',
      '2026-02-25 23:59:00+08',
      'Windward-leeward courses, 6-8 races',
      ARRAY['Dragon'],
      800, 'HKD',
      'https://rhkyc.org.hk/sailing/dragon-series-nor.pdf',
      'https://rhkyc.org.hk/sailing/dragon-series-si.pdf'
    ),
    (
      'rhkyc', hk_venue_id, 'J Class Championship 2026', 'championship',
      '2026-04-18', '2026-04-20',
      '2026-04-10 23:59:00+08',
      '6 races over 3 days, drop 1',
      ARRAY['J/70', 'J/80'],
      1500, 'HKD',
      'https://rhkyc.org.hk/sailing/j-class-champs-nor.pdf',
      NULL
    ),
    (
      'rhkyc', hk_venue_id, 'Sunday Morning IRC Racing', 'weekend_regatta',
      '2026-01-11', '2026-12-27',
      NULL,
      'Passage or windward-leeward',
      ARRAY['IRC', 'Sports Boat'],
      2000, 'HKD',
      'https://rhkyc.org.hk/sailing/sunday-series-nor.pdf',
      'https://rhkyc.org.hk/sailing/sunday-series-si.pdf'
    )
  ON CONFLICT DO NOTHING;

  -- ABC Races
  INSERT INTO club_race_calendar (
    club_id, venue_id, event_name, event_type, start_date, end_date,
    registration_deadline, race_format, classes_included, entry_fee, currency,
    nor_url, si_url
  )
  VALUES
    (
      'abc-hk', hk_venue_id, 'Wednesday Evening Dinghy Series', 'weeknight_series',
      '2026-02-04', '2026-11-25',
      NULL,
      'Olympic trapezoid courses',
      ARRAY['ILCA 7 (Laser)', 'ILCA 6 (Laser Radial)', '420'],
      600, 'HKD',
      'https://abclubhk.com/racing/wednesday-series-nor.pdf',
      'https://abclubhk.com/racing/wednesday-series-si.pdf'
    ),
    (
      'abc-hk', hk_venue_id, 'Hong Kong Youth Championship 2026', 'championship',
      '2026-05-16', '2026-05-17',
      '2026-05-08 23:59:00+08',
      '8 races over 2 days',
      ARRAY['Optimist', '420', '29er'],
      500, 'HKD',
      'https://abclubhk.com/racing/youth-champs-nor.pdf',
      NULL
    ),
    (
      'abc-hk', hk_venue_id, 'Learn to Race Clinic', 'clinic',
      '2026-03-14', '2026-03-15',
      '2026-03-07 23:59:00+08',
      '2-day racing clinic for beginners',
      ARRAY['ILCA 7 (Laser)', 'ILCA 6 (Laser Radial)'],
      800, 'HKD',
      NULL,
      NULL
    )
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- CLUB DOCUMENTS
  -- ============================================================================

  -- Get race IDs for document linking
  DECLARE
    dragon_series_id UUID;
    j_champs_id UUID;
    wed_dinghy_id UUID;
    youth_champs_id UUID;
  BEGIN
    SELECT id INTO dragon_series_id FROM club_race_calendar WHERE event_name = 'Wednesday Night Dragon Series - Spring 2026' LIMIT 1;
    SELECT id INTO j_champs_id FROM club_race_calendar WHERE event_name = 'J Class Championship 2026' LIMIT 1;
    SELECT id INTO wed_dinghy_id FROM club_race_calendar WHERE event_name = 'Wednesday Evening Dinghy Series' LIMIT 1;
    SELECT id INTO youth_champs_id FROM club_race_calendar WHERE event_name = 'Hong Kong Youth Championship 2026' LIMIT 1;

    -- RHKYC Documents
    INSERT INTO club_documents (club_id, event_id, document_type, title, url, parsed, publish_date, version)
    VALUES
      ('rhkyc', dragon_series_id, 'nor', 'Dragon Series Notice of Race - Spring 2026', 'https://rhkyc.org.hk/sailing/dragon-series-nor.pdf', false, '2025-12-15', 'v1.0'),
      ('rhkyc', dragon_series_id, 'si', 'Dragon Series Sailing Instructions', 'https://rhkyc.org.hk/sailing/dragon-series-si.pdf', true, '2026-02-28', 'v1.1'),
      ('rhkyc', j_champs_id, 'nor', 'J Class Championship Notice of Race', 'https://rhkyc.org.hk/sailing/j-class-champs-nor.pdf', false, '2026-01-10', 'v1.0'),
      ('rhkyc', NULL, 'club_rules', 'RHKYC Racing Rules and Regulations 2026', 'https://rhkyc.org.hk/rules/racing-rules-2026.pdf', true, '2025-12-01', 'v3.0')
    ON CONFLICT DO NOTHING;

    -- ABC Documents
    INSERT INTO club_documents (club_id, event_id, document_type, title, url, parsed, publish_date, version)
    VALUES
      ('abc-hk', wed_dinghy_id, 'nor', 'Wednesday Dinghy Series NOR', 'https://abclubhk.com/racing/wednesday-series-nor.pdf', true, '2026-01-05', 'v1.0'),
      ('abc-hk', wed_dinghy_id, 'si', 'Wednesday Dinghy Series SIs', 'https://abclubhk.com/racing/wednesday-series-si.pdf', true, '2026-01-30', 'v1.2'),
      ('abc-hk', youth_champs_id, 'nor', 'HK Youth Championship NOR 2026', 'https://abclubhk.com/racing/youth-champs-nor.pdf', false, '2026-03-01', 'v1.0'),
      ('abc-hk', NULL, 'facility_guide', 'Aberdeen Boat Club Facilities Guide', 'https://abclubhk.com/facilities/guide.pdf', true, '2025-11-15', 'v2.0')
    ON CONFLICT DO NOTHING;
  END;

  -- ============================================================================
  -- CLUB SERVICES
  -- ============================================================================

  -- Sailmakers
  INSERT INTO club_services (
    club_id, venue_id, service_type, business_name, contact_name, email, phone, website,
    specialties, classes_supported, price_level, preferred_by_club
  )
  VALUES
    (
      'rhkyc', hk_venue_id, 'sailmaker', 'North Sails Hong Kong', 'Andrew Lam',
      'andrew.lam@northsails.com', '+852 2555 0021', 'https://northsails.com/sailing/en/hong-kong',
      ARRAY['Racing sails', 'Sail repairs', '3DL technology'],
      ARRAY['Dragon', 'J/70', 'J/80', 'IRC'],
      'premium', true
    ),
    (
      'abc-hk', hk_venue_id, 'sailmaker', 'UK Sailmakers Hong Kong', 'David Chan',
      'david@uksailmakers.com.hk', '+852 2873 2668', 'https://uksailmakers.com.hk',
      ARRAY['Custom dinghy sails', 'Cruising sails', 'Repairs'],
      ARRAY['ILCA 7 (Laser)', 'ILCA 6 (Laser Radial)', '420', 'Optimist'],
      'moderate', true
    )
  ON CONFLICT DO NOTHING;

  -- Riggers
  INSERT INTO club_services (
    club_id, venue_id, service_type, business_name, contact_name, email, phone, website,
    specialties, classes_supported, price_level, preferred_by_club
  )
  VALUES
    (
      'rhkyc', hk_venue_id, 'rigger', 'Hong Kong Rigging Services', 'Peter Wong',
      'peter@hkrigging.com', '+852 9123 4567', 'https://hkrigging.com',
      ARRAY['Standing rigging', 'Running rigging', 'Mast work'],
      ARRAY['Dragon', 'J/80', 'IRC', 'Sports Boat'],
      'moderate', true
    ),
    (
      'abc-hk', hk_venue_id, 'rigger', 'Dinghy Rigging Specialists', 'Sarah Lee',
      'sarah@dinghyrigging.hk', '+852 9876 5432', NULL,
      ARRAY['Dinghy rigging', 'Control line optimization'],
      ARRAY['ILCA 7 (Laser)', '420', '29er', 'RS Feva'],
      'moderate', false
    )
  ON CONFLICT DO NOTHING;

  -- Coaches
  INSERT INTO club_services (
    club_id, venue_id, service_type, business_name, contact_name, email, phone, website,
    specialties, classes_supported, price_level, preferred_by_club
  )
  VALUES
    (
      'rhkyc', hk_venue_id, 'coach', 'Dragon Racing Coach - Nick Rogers', 'Nick Rogers',
      'nick@dragoncoaching.com', '+852 9111 2222', 'https://nickrogerscoaching.com',
      ARRAY['Olympic sailing', 'Dragon tactics', 'Match racing'],
      ARRAY['Dragon', 'J/70'],
      'premium', true
    ),
    (
      'abc-hk', hk_venue_id, 'coach', 'ABC Sailing School', 'coaching@abclubhk.com',
      'ABC Coaching Team', 'coaching@abclubhk.com', '+852 2555 6216', 'https://abclubhk.com/sailing',
      ARRAY['Youth development', 'Race training', 'RYA courses'],
      ARRAY['Optimist', 'ILCA 7 (Laser)', 'ILCA 6 (Laser Radial)', '420'],
      'moderate', true
    ),
    (
      'hhyc', hk_venue_id, 'coach', 'Performance Sailing HK', 'James Chen',
      'james@performancesailinghk.com', '+852 9333 4444', 'https://performancesailinghk.com',
      ARRAY['One-on-one coaching', 'Video analysis', 'Fitness training'],
      ARRAY['ILCA 7 (Laser)', 'RS Feva', 'Hobie 16'],
      'premium', false
    )
  ON CONFLICT DO NOTHING;

  -- Repair Services
  INSERT INTO club_services (
    club_id, venue_id, service_type, business_name, contact_name, email, phone, website,
    specialties, classes_supported, price_level, preferred_by_club
  )
  VALUES
    (
      'rhkyc', hk_venue_id, 'repair', 'Marine Composites HK', 'Tony Leung',
      'tony@marinecomposites.hk', '+852 2873 9999', 'https://marinecomposites.hk',
      ARRAY['Fiberglass repair', 'Carbon work', 'Gelcoat'],
      ARRAY['Dragon', 'J/80', 'IRC'],
      'premium', true
    ),
    (
      'abc-hk', hk_venue_id, 'repair', 'ABC Boat Repair Workshop', 'Workshop Team',
      'workshop@abclubhk.com', '+852 2555 6216', NULL,
      ARRAY['Dinghy repairs', 'Hull work', 'Foil repairs'],
      ARRAY['Optimist', 'ILCA 7 (Laser)', '420', '29er'],
      'moderate', true
    )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Hong Kong venue intelligence data seeded successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - 3 Yacht Clubs (RHKYC, ABC, HHYC)';
  RAISE NOTICE '  - 18 Boat Classes across clubs';
  RAISE NOTICE '  - 9 Club Facilities';
  RAISE NOTICE '  - 6 Upcoming Races/Series';
  RAISE NOTICE '  - 8 Club Documents';
  RAISE NOTICE '  - 8 Local Services (sailmakers, riggers, coaches, repairs)';
  RAISE NOTICE '';
  RAISE NOTICE '🌍 Visit the Venue Intelligence tab to see the data!';
END $$;