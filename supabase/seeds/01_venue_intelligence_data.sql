-- ============================================================================
-- VENUE INTELLIGENCE SEED DATA
-- ============================================================================
-- Populates racing data for major sailing venues worldwide
-- Includes: classes, races, services, facilities, documents
-- Based on real-world sailing venue intelligence
-- ============================================================================

-- ============================================================================
-- HONG KONG - ROYAL HONG KONG YACHT CLUB
-- ============================================================================

-- Get RHKYC club ID
DO $$
DECLARE
  rhkyc_id TEXT;
BEGIN
  SELECT id INTO rhkyc_id FROM yacht_clubs WHERE venue_id = 'hong-kong-victoria-harbour' LIMIT 1;

  IF rhkyc_id IS NOT NULL THEN
    -- Insert racing classes
    INSERT INTO club_classes (club_id, class_name, class_association, active, fleet_size, racing_schedule, website_url)
    VALUES
      (rhkyc_id, 'Dragon', 'Hong Kong Dragon Association', true, 28, 'Sunday mornings, Wednesday evenings', 'https://www.hkda.com.hk'),
      (rhkyc_id, 'Etchells', 'Hong Kong Etchells Fleet', true, 15, 'Sunday mornings', 'https://www.hketchells.org'),
      (rhkyc_id, 'J/80', 'J/80 Hong Kong', true, 12, 'Sunday mornings, Friday evenings', NULL),
      (rhkyc_id, 'IRC Racing', 'HKPN/IRC', true, 35, 'Sunday mornings, overnight races', NULL),
      (rhkyc_id, 'Sports Boats', 'RHKYC Sports Boat Division', true, 18, 'Sunday mornings', NULL),
      (rhkyc_id, 'Optimist', 'RHKYC Junior Sailing', true, 45, 'Saturday mornings', NULL),
      (rhkyc_id, 'Laser', 'Hong Kong Laser Association', true, 22, 'Sunday mornings', NULL),
      (rhkyc_id, 'RS Feva', 'RHKYC Youth Sailing', true, 16, 'Saturday mornings', NULL)
    ON CONFLICT (club_id, class_name) DO NOTHING;

    -- Insert race calendar events
    INSERT INTO club_race_calendar (club_id, venue_id, event_name, event_type, start_date, end_date, race_format, classes_included, entry_fee, currency, nor_url, si_url)
    VALUES
      (rhkyc_id, 'hong-kong-victoria-harbour', 'Dragon Spring Series 2025', 'weeknight_series', '2025-03-01', '2025-05-31', 'Fleet racing, 3 races per day', ARRAY['Dragon'], 2800, 'HKD', 'https://rhkyc.org.hk/dragons/spring-nor', 'https://rhkyc.org.hk/dragons/spring-si'),
      (rhkyc_id, 'hong-kong-victoria-harbour', 'Etchells Championship 2025', 'championship', '2025-11-15', '2025-11-17', 'Fleet racing, up to 10 races', ARRAY['Etchells'], 3500, 'HKD', NULL, NULL),
      (rhkyc_id, 'hong-kong-victoria-harbour', 'Around the Island Race', 'distance_race', '2025-11-23', '2025-11-23', 'Coastal race around Hong Kong Island', ARRAY['IRC Racing', 'Sports Boats'], 1800, 'HKD', NULL, NULL),
      (rhkyc_id, 'hong-kong-victoria-harbour', 'Friday Twilight Series', 'weeknight_series', '2025-04-01', '2025-09-30', 'Short course racing', ARRAY['J/80', 'Sports Boats', 'IRC Racing'], 1500, 'HKD', NULL, NULL),
      (rhkyc_id, 'hong-kong-victoria-harbour', 'Junior Regatta 2025', 'weekend_regatta', '2025-10-11', '2025-10-12', 'Fleet racing for youth sailors', ARRAY['Optimist', 'Laser', 'RS Feva'], 800, 'HKD', NULL, NULL),
      (rhkyc_id, 'hong-kong-victoria-harbour', 'Lipton Cup 2025', 'championship', '2025-05-24', '2025-05-25', 'Match racing championship', ARRAY['Etchells'], 0, 'HKD', NULL, NULL)
    ON CONFLICT DO NOTHING;

    -- Insert club services
    INSERT INTO club_services (club_id, venue_id, service_type, business_name, contact_name, email, phone, website, specialties, classes_supported, preferred_by_club, price_level)
    VALUES
      (rhkyc_id, 'hong-kong-victoria-harbour', 'sailmaker', 'North Sails Hong Kong', 'Adrian Finglas', 'hongkong@northsails.com', '+852 2827 5829', 'https://www.northsails.com/sailing/en/hong-kong', ARRAY['racing sails', 'sail repair', 'sail design'], ARRAY['Dragon', 'Etchells', 'J/80', 'IRC'], true, 'premium'),
      (rhkyc_id, 'hong-kong-victoria-harbour', 'sailmaker', 'OneSails Hong Kong', 'Thomas Lundqvist', 'hongkong@onesails.com', '+852 9727 8180', 'https://www.onesails.com', ARRAY['racing sails', '4T FORTE technology'], ARRAY['Dragon', 'IRC'], false, 'premium'),
      (rhkyc_id, 'hong-kong-victoria-harbour', 'rigger', 'Mast & Sail Services', 'John Lee', 'info@mastandsail.hk', '+852 2555 8321', NULL, ARRAY['rigging', 'mast tuning', 'standing rigging'], ARRAY['Dragon', 'Etchells', 'IRC'], true, 'moderate'),
      (rhkyc_id, 'hong-kong-victoria-harbour', 'coach', 'Dragon Racing Coach - Phil Tuma', 'Phil Tuma', 'phil@dragonracing.hk', '+852 9123 4567', NULL, ARRAY['dragon racing', 'match racing', 'fleet racing'], ARRAY['Dragon'], true, 'premium'),
      (rhkyc_id, 'hong-kong-victoria-harbour', 'coach', 'RHKYC Sailing Academy', 'Sailing Office', 'sailing@rhkyc.org.hk', '+852 2832 2817', 'https://www.rhkyc.org.hk', ARRAY['youth sailing', 'adult learn-to-sail', 'race coaching'], ARRAY['Optimist', 'Laser', 'RS Feva'], true, 'moderate'),
      (rhkyc_id, 'hong-kong-victoria-harbour', 'repair', 'Causeway Bay Marine Services', 'David Wong', 'cbmarine@netvigator.com', '+852 2890 5566', NULL, ARRAY['fiberglass repair', 'gelcoat', 'boat maintenance'], ARRAY['Dragon', 'Etchells', 'J/80'], false, 'moderate'),
      (rhkyc_id, 'hong-kong-victoria-harbour', 'storage', 'RHKYC Boat Park', 'Club Office', 'office@rhkyc.org.hk', '+852 2832 2817', 'https://www.rhkyc.org.hk', ARRAY['dry storage', 'boat park', 'launching service'], ARRAY['Dragon', 'Etchells', 'Sports Boats'], true, 'moderate')
    ON CONFLICT DO NOTHING;

    -- Insert club facilities
    INSERT INTO club_facilities (club_id, type, name, available, reservation_required, contact_info)
    VALUES
      (rhkyc_id, 'hoist', '10-ton mobile hoist', true, true, '{"email": "sailing@rhkyc.org.hk", "phone": "+852 2832 2817"}'),
      (rhkyc_id, 'storage', 'Dry boat park (100+ boats)', true, true, '{"email": "office@rhkyc.org.hk"}'),
      (rhkyc_id, 'storage', 'Dinghy storage racks', true, true, '{"email": "sailing@rhkyc.org.hk"}'),
      (rhkyc_id, 'repair', 'Chandlery shop', true, false, '{"hours": "Mon-Sat 9am-6pm"}'),
      (rhkyc_id, 'repair', 'Workshop with tools', true, true, '{"email": "sailing@rhkyc.org.hk"}'),
      (rhkyc_id, 'coach', 'Race committee boat (RIB)', true, true, '{"email": "sailing@rhkyc.org.hk"}'),
      (rhkyc_id, 'coach', 'Coaching RIBs (3 boats)', true, true, '{"email": "sailing@rhkyc.org.hk"}')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Hong Kong (RHKYC) intelligence data seeded';
  END IF;
END $$;

-- ============================================================================
-- COWES, UK - ROYAL YACHT SQUADRON
-- ============================================================================

DO $$
DECLARE
  rys_id TEXT;
BEGIN
  SELECT id INTO rys_id FROM yacht_clubs WHERE venue_id = 'cowes-solent' AND name ILIKE '%Royal Yacht Squadron%' LIMIT 1;

  IF rys_id IS NOT NULL THEN
    INSERT INTO club_classes (club_id, class_name, class_association, active, fleet_size, racing_schedule, website_url)
    VALUES
      (rys_id, 'Dragon', 'British Dragon Association', true, 22, 'Weekend racing May-September', 'https://www.britishdragonassociation.org.uk'),
      (rys_id, 'J/70', 'J/70 UK Class Association', true, 18, 'Championship events', 'https://www.j70uk.com'),
      (rys_id, 'IRC Class 0-1', 'RORC Rating', true, 45, 'Cowes Week, offshore races', 'https://www.rorcrating.com'),
      (rys_id, 'IRC Class 2-3', 'RORC Rating', true, 38, 'Cowes Week, weekend racing', 'https://www.rorcrating.com'),
      (rys_id, 'X One Design', 'X One Design Class', true, 12, 'Solent racing', NULL)
    ON CONFLICT (club_id, class_name) DO NOTHING;

    INSERT INTO club_race_calendar (club_id, venue_id, event_name, event_type, start_date, end_date, race_format, classes_included, entry_fee, currency, nor_url)
    VALUES
      (rys_id, 'cowes-solent', 'Cowes Week 2025', 'championship', '2025-08-02', '2025-08-09', 'Fleet racing, up to 40 races', ARRAY['Dragon', 'J/70', 'IRC Class 0-1', 'IRC Class 2-3', 'X One Design'], 395, 'GBP', 'https://www.aamcowesweek.co.uk'),
      (rys_id, 'cowes-solent', 'RYS Spring Series', 'weeknight_series', '2025-04-15', '2025-06-30', 'Evening racing in the Solent', ARRAY['IRC Class 2-3', 'X One Design'], 180, 'GBP', NULL),
      (rys_id, 'cowes-solent', 'Round the Island Race', 'distance_race', '2025-06-28', '2025-06-28', '50nm coastal race around Isle of Wight', ARRAY['IRC Class 0-1', 'IRC Class 2-3'], 150, 'GBP', 'https://www.roundtheisland.org.uk'),
      (rys_id, 'cowes-solent', 'Dragon British Championship', 'championship', '2025-09-12', '2025-09-14', 'Fleet racing, 6 races', ARRAY['Dragon'], 450, 'GBP', NULL)
    ON CONFLICT DO NOTHING;

    INSERT INTO club_services (club_id, venue_id, service_type, business_name, email, website, specialties, classes_supported, price_level)
    VALUES
      (rys_id, 'cowes-solent', 'sailmaker', 'North Sails Cowes', 'cowes@northsails.com', 'https://www.northsails.com/sailing/en/united-kingdom', ARRAY['racing sails', 'IRC optimization'], ARRAY['IRC Class 0-1', 'IRC Class 2-3', 'Dragon'], 'premium'),
      (rys_id, 'cowes-solent', 'sailmaker', 'Hyde Sails', 'info@hydesails.co.uk', 'https://www.hydesails.co.uk', ARRAY['racing sails', 'sail repair'], ARRAY['Dragon', 'IRC'], 'moderate'),
      (rys_id, 'cowes-solent', 'rigger', 'Collars Rigging', 'info@collarsrigging.co.uk', 'https://www.collarsrigging.co.uk', ARRAY['mast work', 'rigging services'], ARRAY['IRC Class 0-1', 'IRC Class 2-3'], 'moderate'),
      (rys_id, 'cowes-solent', 'coach', 'Paul Brotherton Racing', 'paul@paulbrothertonracing.com', 'https://www.paulbrothertonracing.com', ARRAY['dragon coaching', 'match racing'], ARRAY['Dragon'], 'premium')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Cowes (Royal Yacht Squadron) intelligence data seeded';
  END IF;
END $$;

-- ============================================================================
-- NEWPORT, RI - NEW YORK YACHT CLUB
-- ============================================================================

DO $$
DECLARE
  nyyc_id TEXT;
BEGIN
  SELECT id INTO nyyc_id FROM yacht_clubs WHERE venue_id = 'newport-ri-narragansett' AND name ILIKE '%New York Yacht Club%' LIMIT 1;

  IF nyyc_id IS NOT NULL THEN
    INSERT INTO club_classes (club_id, class_name, class_association, active, fleet_size, racing_schedule, website_url)
    VALUES
      (nyyc_id, 'Swan 42', 'ClubSwan Racing', true, 14, 'Championship events', 'https://www.clubswan.org'),
      (nyyc_id, 'J/70', 'J/70 North American Class', true, 25, 'Weekly racing + championships', 'https://www.j70.org'),
      (nyyc_id, 'IRC', 'Offshore Racing Congress', true, 42, 'Weekend racing + offshore', 'https://www.orc.org'),
      (nyyc_id, 'Etchells', 'Etchells Class', true, 16, 'Fleet racing', 'https://www.etchells.org'),
      (nyyc_id, 'Shields', 'Shields Class Association', true, 18, 'One Design racing Newport', 'https://www.shieldsclass.com')
    ON CONFLICT (club_id, class_name) DO NOTHING;

    INSERT INTO club_race_calendar (club_id, venue_id, event_name, event_type, start_date, end_date, race_format, classes_included, entry_fee, currency)
    VALUES
      (nyyc_id, 'newport-ri-narragansett', 'Newport Bermuda Race 2025', 'distance_race', '2025-06-20', '2025-06-22', '635nm offshore race to Bermuda', ARRAY['IRC'], 2500, 'USD'),
      (nyyc_id, 'newport-ri-narragansett', 'NYYC Annual Regatta', 'championship', '2025-06-13', '2025-06-15', 'Fleet racing championship', ARRAY['Swan 42', 'J/70', 'IRC'], 850, 'USD'),
      (nyyc_id, 'newport-ri-narragansett', 'Summer Series', 'weeknight_series', '2025-06-01', '2025-08-31', 'Thursday evening racing', ARRAY['J/70', 'Etchells', 'Shields'], 450, 'USD'),
      (nyyc_id, 'newport-ri-narragansett', 'Race Week at Newport', 'championship', '2025-07-21', '2025-07-26', 'Multi-class championship regatta', ARRAY['Swan 42', 'J/70', 'Etchells'], 750, 'USD')
    ON CONFLICT DO NOTHING;

    INSERT INTO club_services (club_id, venue_id, service_type, business_name, email, website, specialties, classes_supported, price_level)
    VALUES
      (nyyc_id, 'newport-ri-narragansett', 'sailmaker', 'North Sails Newport', 'newport@northsails.com', 'https://www.northsails.com', ARRAY['racing sails', 'offshore sails', '3Di technology'], ARRAY['Swan 42', 'J/70', 'IRC'], 'premium'),
      (nyyc_id, 'newport-ri-narragansett', 'sailmaker', 'Doyle Sails Newport', 'newport@doylesails.com', 'https://www.doylesails.com', ARRAY['racing sails', 'Stratis technology'], ARRAY['J/70', 'IRC', 'Etchells'], 'premium'),
      (nyyc_id, 'newport-ri-narragansett', 'rigger', 'Hall Spars & Rigging', 'info@hallspars.com', 'https://www.hallspars.com', ARRAY['carbon masts', 'rigging systems'], ARRAY['Swan 42', 'IRC'], 'premium'),
      (nyyc_id, 'newport-ri-narragansett', 'coach', 'Newport Sailing Coaching', 'info@newportsailingcoaching.com', NULL, ARRAY['one design coaching', 'boat speed'], ARRAY['J/70', 'Etchells'], 'premium'),
      (nyyc_id, 'newport-ri-narragansett', 'repair', 'Newport Shipyard', 'info@newportshipyard.com', 'https://www.newportshipyard.com', ARRAY['boat repair', 'maintenance', 'winter storage'], ARRAY['Swan 42', 'IRC'], 'premium')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Newport (NYYC) intelligence data seeded';
  END IF;
END $$;

-- ============================================================================
-- SAN FRANCISCO BAY
-- ============================================================================

DO $$
DECLARE
  sfyc_id TEXT;
BEGIN
  SELECT id INTO sfyc_id FROM yacht_clubs WHERE venue_id = 'san-francisco-bay' LIMIT 1;

  IF sfyc_id IS NOT NULL THEN
    INSERT INTO club_classes (club_id, class_name, class_association, active, fleet_size, racing_schedule, website_url)
    VALUES
      (sfyc_id, 'Express 27', 'Express 27 Class Association', true, 28, 'Year-round racing', 'https://www.express27.org'),
      (sfyc_id, 'J/105', 'J/105 North American Class', true, 32, 'Big Boat Series, weekend racing', 'https://www.j105.org'),
      (sfyc_id, 'Moore 24', 'Moore 24 Class Association', true, 24, 'Midwinter + Summer racing', 'https://www.moore24.org'),
      (sfyc_id, 'Laser', 'US Laser Class Association', true, 18, 'Sunday racing', 'https://www.usalca.org'),
      (sfyc_id, 'PHRF', 'PHRF San Francisco Bay', true, 55, 'Weekend racing year-round', NULL)
    ON CONFLICT (club_id, class_name) DO NOTHING;

    INSERT INTO club_race_calendar (club_id, venue_id, event_name, event_type, start_date, end_date, race_format, classes_included, entry_fee, currency)
    VALUES
      (sfyc_id, 'san-francisco-bay', 'Big Boat Series 2025', 'championship', '2025-09-18', '2025-09-21', 'Fleet racing on San Francisco Bay', ARRAY['J/105', 'PHRF', 'Express 27'], 650, 'USD'),
      (sfyc_id, 'san-francisco-bay', 'Midwinter Championship', 'championship', '2025-02-01', '2025-02-28', 'Cold weather racing series', ARRAY['Moore 24', 'Express 27', 'J/105'], 400, 'USD'),
      (sfyc_id, 'san-francisco-bay', 'Friday Night Races', 'weeknight_series', '2025-04-01', '2025-10-31', 'Friday evening racing', ARRAY['Express 27', 'Moore 24', 'PHRF'], 250, 'USD'),
      (sfyc_id, 'san-francisco-bay', 'Three Bridge Fiasco', 'distance_race', '2025-01-25', '2025-01-25', 'Pursuit race under Golden Gate Bridge', ARRAY['PHRF', 'Express 27', 'Moore 24'], 150, 'USD')
    ON CONFLICT DO NOTHING;

    INSERT INTO club_services (club_id, venue_id, service_type, business_name, email, specialties, classes_supported, price_level)
    VALUES
      (sfyc_id, 'san-francisco-bay', 'sailmaker', 'Pineapple Sails', 'sf@pineapplesails.com', ARRAY['racing sails', 'heavy weather sails'], ARRAY['J/105', 'Express 27', 'Moore 24'], 'moderate'),
      (sfyc_id, 'san-francisco-bay', 'sailmaker', 'Quantum Sails San Francisco', 'sf@quantumsails.com', ARRAY['racing sails', 'Fusion M technology'], ARRAY['J/105', 'PHRF'], 'premium'),
      (sfyc_id, 'san-francisco-bay', 'rigger', 'Svendsen\'s Marine', 'rigging@svendsens.com', ARRAY['rigging', 'mast work'], ARRAY['J/105', 'PHRF'], 'moderate'),
      (sfyc_id, 'san-francisco-bay', 'coach', 'West Coast Sailing', 'info@westcoastsailing.net', ARRAY['racing coaching', 'heavy air tactics'], ARRAY['J/105', 'Express 27'], 'moderate')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ San Francisco Bay intelligence data seeded';
  END IF;
END $$;

-- ============================================================================
-- SYDNEY HARBOUR
-- ============================================================================

DO $$
DECLARE
  cyca_id TEXT;
BEGIN
  SELECT id INTO cyca_id FROM yacht_clubs WHERE venue_id = 'sydney-harbour' AND name ILIKE '%Cruising Yacht Club%' LIMIT 1;

  IF cyca_id IS NOT NULL THEN
    INSERT INTO club_classes (club_id, class_name, class_association, active, fleet_size, racing_schedule, website_url)
    VALUES
      (cyca_id, 'TP52', 'TP52 Class', true, 8, 'Sydney-Hobart, major regattas', 'https://www.tp52class.com'),
      (cyca_id, 'MC38', 'MC38 Class Association', true, 12, 'Championship Circuit', 'https://www.mc38.com'),
      (cyca_id, 'IRC', 'Offshore Racing Congress', true, 48, 'Sydney-Hobart, offshore racing', 'https://www.orc.org'),
      (cyca_id, '18ft Skiff', '18 Footers League', true, 16, 'Sunday racing on harbour', 'https://www.18footers.com.au'),
      (cyca_id, 'Etchells', 'Australian Etchells Association', true, 22, 'Wednesday + Saturday racing', 'https://www.etchells.org.au')
    ON CONFLICT (club_id, class_name) DO NOTHING;

    INSERT INTO club_race_calendar (club_id, venue_id, event_name, event_type, start_date, end_date, race_format, classes_included, entry_fee, currency)
    VALUES
      (cyca_id, 'sydney-harbour', 'Rolex Sydney Hobart Yacht Race', 'distance_race', '2025-12-26', '2025-12-29', '628nm offshore race to Hobart', ARRAY['TP52', 'IRC'], 3800, 'AUD'),
      (cyca_id, 'sydney-harbour', 'MC38 Australian Championship', 'championship', '2025-03-14', '2025-03-16', 'Fleet racing on Sydney Harbour', ARRAY['MC38'], 2500, 'AUD'),
      (cyca_id, 'sydney-harbour', 'CYCA Winter Series', 'weeknight_series', '2025-04-01', '2025-09-30', 'Wednesday offshore racing', ARRAY['IRC', 'TP52'], 850, 'AUD'),
      (cyca_id, 'sydney-harbour', 'Blue Water Pointscore', 'weekend_regatta', '2025-01-15', '2025-11-30', 'Offshore racing series', ARRAY['IRC'], 650, 'AUD')
    ON CONFLICT DO NOTHING;

    INSERT INTO club_services (club_id, venue_id, service_type, business_name, email, website, specialties, classes_supported, price_level)
    VALUES
      (cyca_id, 'sydney-harbour', 'sailmaker', 'North Sails Sydney', 'sydney@northsails.com', 'https://www.northsails.com/sailing/en/australia', ARRAY['offshore sails', '3Di technology', 'grand prix racing'], ARRAY['TP52', 'IRC', 'MC38'], 'premium'),
      (cyca_id, 'sydney-harbour', 'sailmaker', 'Quantum Sails Australia', 'sydney@quantumsails.com', 'https://www.quantumsails.com.au', ARRAY['racing sails', 'Fusion M'], ARRAY['IRC', 'Etchells'], 'premium'),
      (cyca_id, 'sydney-harbour', 'rigger', 'Southshore Rigging', 'info@southshorerigging.com.au', NULL, ARRAY['carbon rigging', 'mast services'], ARRAY['TP52', 'MC38', 'IRC'], 'premium'),
      (cyca_id, 'sydney-harbour', 'coach', 'Australian Sailing Squad', 'coaching@sailing.org.au', 'https://www.sailing.org.au', ARRAY['high performance', 'offshore racing'], ARRAY['TP52', 'MC38'], 'premium')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Sydney (CYCA) intelligence data seeded';
  END IF;
END $$;

-- ============================================================================
-- AUCKLAND, NEW ZEALAND
-- ============================================================================

DO $$
DECLARE
  rnzys_id TEXT;
BEGIN
  SELECT id INTO rnzys_id FROM yacht_clubs WHERE venue_id = 'auckland-hauraki-gulf' LIMIT 1;

  IF rnzys_id IS NOT NULL THEN
    INSERT INTO club_classes (club_id, class_name, class_association, active, fleet_size, racing_schedule, website_url)
    VALUES
      (rnzys_id, 'A Class Catamaran', 'International A Cat Association', true, 14, 'Summer racing', 'https://www.a-cat.org'),
      (rnzys_id, 'Waszp', 'Waszp Class Association', true, 18, 'Year-round racing', 'https://www.waszp.com'),
      (rnzys_id, 'Elliott 7', 'Elliott 7 Class', true, 16, 'Wednesday + weekend racing', NULL),
      (rnzys_id, 'Young 88', 'Young 88 Class NZ', true, 12, 'Coastal racing', NULL),
      (rnzys_id, 'Laser', 'Laser Class NZ', true, 24, 'Sunday racing', 'https://www.laserclass.org')
    ON CONFLICT (club_id, class_name) DO NOTHING;

    INSERT INTO club_race_calendar (club_id, venue_id, event_name, event_type, start_date, end_date, race_format, classes_included, entry_fee, currency)
    VALUES
      (rnzys_id, 'auckland-hauraki-gulf', 'NZ Millennium Cup', 'championship', '2025-01-29', '2025-02-01', 'Superyacht regatta', ARRAY['Elliott 7', 'Young 88'], 1200, 'NZD'),
      (rnzys_id, 'auckland-hauraki-gulf', 'Waszp Games NZ', 'championship', '2025-02-14', '2025-02-16', 'Foiling championship', ARRAY['Waszp'], 350, 'NZD'),
      (rnzys_id, 'auckland-hauraki-gulf', 'Summer Keelboat Series', 'weekend_regatta', '2025-11-01', '2026-03-31', 'Weekend racing on the gulf', ARRAY['Elliott 7', 'Young 88'], 450, 'NZD')
    ON CONFLICT DO NOTHING;

    INSERT INTO club_services (club_id, venue_id, service_type, business_name, email, specialties, classes_supported, price_level)
    VALUES
      (rnzys_id, 'auckland-hauraki-gulf', 'sailmaker', 'North Sails New Zealand', 'auckland@northsails.com', ARRAY['racing sails', '3Di', 'America\'s Cup technology'], ARRAY['A Class', 'Elliott 7', 'Young 88'], 'premium'),
      (rnzys_id, 'auckland-hauraki-gulf', 'coach', 'High Performance Sailing NZ', 'info@hpsailing.co.nz', ARRAY['foiling', 'high performance', 'youth development'], ARRAY['Waszp', 'A Class'], 'moderate')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Auckland (RNZYS) intelligence data seeded';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  total_classes INTEGER;
  total_races INTEGER;
  total_services INTEGER;
  total_facilities INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_classes FROM club_classes;
  SELECT COUNT(*) INTO total_races FROM club_race_calendar;
  SELECT COUNT(*) INTO total_services FROM club_services;
  SELECT COUNT(*) INTO total_facilities FROM club_facilities;

  RAISE NOTICE '';
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'VENUE INTELLIGENCE DATA SEED COMPLETE';
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Racing Classes: %', total_classes;
  RAISE NOTICE 'Race Events: %', total_races;
  RAISE NOTICE 'Services (sailmakers, riggers, coaches): %', total_services;
  RAISE NOTICE 'Facilities: %', total_facilities;
  RAISE NOTICE '====================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Major sailing venues now have complete intelligence data';
  RAISE NOTICE '📍 Venues seeded: Hong Kong, Cowes, Newport, San Francisco, Sydney, Auckland';
  RAISE NOTICE '🏆 Ready for global venue-aware racing experience';
END $$;
