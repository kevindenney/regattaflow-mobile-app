-- ============================================================================
-- Seed catalog_races with 40+ major regattas worldwide
-- ============================================================================

INSERT INTO catalog_races (name, short_name, slug, description, race_type, boat_classes, level, recurrence, typical_month, typical_duration_days, country, region, organizing_authority, website_url, is_featured) VALUES

-- ================================
-- OCEANIA / AUSTRALIA
-- ================================
('Rolex Sydney Hobart Yacht Race', 'Sydney Hobart', 'sydney-hobart',
 'Iconic 628nm ocean race from Sydney to Hobart, Tasmania.',
 'offshore', ARRAY['IRC', 'ORCi', 'PHS'], 'national', 'annual', 12, 5,
 'Australia', 'New South Wales', 'Cruising Yacht Club of Australia', 'https://www.rolexsydneyhobart.com', true),

('Sydney to Gold Coast Yacht Race', 'Sydney Gold Coast', 'sydney-gold-coast',
 'Category 2 ocean race up the east coast.',
 'offshore', ARRAY['IRC', 'PHS'], 'national', 'annual', 7, 4,
 'Australia', 'New South Wales', 'Cruising Yacht Club of Australia', NULL, false),

('Hamilton Island Race Week', 'HIRW', 'hamilton-island-race-week',
 'Major tropical regatta in the Whitsundays.',
 'fleet', ARRAY['IRC', 'PHS', 'Multihull'], 'national', 'annual', 8, 7,
 'Australia', 'Queensland', 'Hamilton Island Yacht Club', 'https://www.hamiltonislandraceweek.com.au', false),

('Airlie Beach Race Week', NULL, 'airlie-beach-race-week',
 'Festival of sailing in the Whitsundays.',
 'fleet', ARRAY['IRC', 'PHS', 'Multihull'], 'national', 'annual', 8, 6,
 'Australia', 'Queensland', 'Whitsunday Sailing Club', NULL, false),

-- ================================
-- NEW ZEALAND
-- ================================
('Auckland Regatta', NULL, 'auckland-regatta',
 'Annual Anniversary Day regatta in Auckland.',
 'fleet', ARRAY['Keelboat', 'Dinghy', 'Multihull'], 'national', 'annual', 1, 1,
 'New Zealand', 'Auckland', 'Royal New Zealand Yacht Squadron', NULL, false),

-- ================================
-- ASIA / HONG KONG
-- ================================
('RHKYC Around the Island Race', 'Around the Island', 'rhkyc-around-the-island',
 'Classic race circumnavigating Hong Kong Island.',
 'distance', ARRAY['IRC', 'HKPN'], 'regional', 'annual', 11, 1,
 'Hong Kong', 'Hong Kong', 'Royal Hong Kong Yacht Club', 'https://www.rhkyc.org.hk', false),

('China Sea Race', NULL, 'china-sea-race',
 'Biennial ocean race from Hong Kong to Manila.',
 'offshore', ARRAY['IRC'], 'regional', 'biennial', 4, 5,
 'Hong Kong', 'Hong Kong', 'Royal Hong Kong Yacht Club', NULL, false),

('Phuket King''s Cup Regatta', 'Kings Cup', 'phuket-kings-cup',
 'Asia''s premier sailing event held annually in Phuket.',
 'fleet', ARRAY['IRC', 'Multihull', 'Dinghy'], 'regional', 'annual', 12, 5,
 'Thailand', 'Phuket', 'Phuket King''s Cup Regatta Organizing Committee', NULL, false),

-- ================================
-- EUROPE / UK
-- ================================
('Rolex Fastnet Race', 'Fastnet', 'rolex-fastnet',
 'Legendary 695nm race from Cowes to Cherbourg via Fastnet Rock.',
 'offshore', ARRAY['IRC'], 'continental', 'biennial', 8, 5,
 'United Kingdom', 'England', 'Royal Ocean Racing Club', 'https://www.rolexfastnetrace.com', true),

('Cowes Week', NULL, 'cowes-week',
 'The world''s oldest and largest annual sailing regatta.',
 'fleet', ARRAY['IRC', 'HP30', 'Sportsboat', 'Dinghy'], 'national', 'annual', 8, 8,
 'United Kingdom', 'England', 'Cowes Week Ltd', 'https://www.cowesweek.co.uk', true),

('Round the Island Race', 'RTI Race', 'round-the-island-race',
 'One-day race around the Isle of Wight, one of the largest.',
 'distance', ARRAY['IRC', 'ISC'], 'national', 'annual', 6, 1,
 'United Kingdom', 'England', 'Island Sailing Club', 'https://www.roundtheisland.org.uk', false),

('Lendy Cowes Week', NULL, 'lendy-cowes-week',
 'Eight days of competitive racing in the Solent.',
 'fleet', ARRAY['IRC'], 'national', 'annual', 8, 8,
 'United Kingdom', 'England', 'Cowes Combined Clubs', NULL, false),

('Three Peaks Yacht Race', 'Three Peaks', 'three-peaks-yacht-race',
 'Sailing and fell running combined endurance event.',
 'offshore', ARRAY['Cruiser'], 'national', 'annual', 6, 4,
 'United Kingdom', 'Wales', 'Three Peaks Yacht Race Committee', NULL, false),

-- ================================
-- EUROPE / FRANCE
-- ================================
('Vendee Globe', NULL, 'vendee-globe',
 'Non-stop solo around the world race, the Everest of sailing.',
 'offshore', ARRAY['IMOCA 60'], 'world_championship', 'quadrennial', 11, 80,
 'France', 'Vendee', 'SAEM Vendee', 'https://www.vendeglobe.org', true),

('Solitaire du Figaro', NULL, 'solitaire-du-figaro',
 'Solo multistage race along European Atlantic coast.',
 'offshore', ARRAY['Figaro 3'], 'continental', 'annual', 8, 30,
 'France', 'Brittany', 'OC Sport Pen Duick', NULL, false),

('Tour de France a la Voile', NULL, 'tour-de-france-voile',
 'Multi-stage team sailing race around France.',
 'coastal', ARRAY['Diam 24'], 'national', 'annual', 7, 21,
 'France', NULL, 'ASO', NULL, false),

-- ================================
-- EUROPE / ITALY
-- ================================
('Barcolana', NULL, 'barcolana',
 'The world''s largest sailing regatta by number of boats.',
 'fleet', ARRAY['ORC', 'IRC'], 'national', 'annual', 10, 1,
 'Italy', 'Friuli Venezia Giulia', 'Societa Velica di Barcola e Grignano', 'https://www.barcolana.it', false),

('Giraglia Rolex Cup', 'Giraglia', 'giraglia-rolex-cup',
 'Offshore race from Saint-Tropez to Genoa via Giraglia Rock.',
 'offshore', ARRAY['IRC', 'ORC'], 'continental', 'annual', 6, 6,
 'Italy', 'Liguria', 'Yacht Club Italiano', NULL, false),

-- ================================
-- EUROPE / NORDIC
-- ================================
('Gotland Runt', NULL, 'gotland-runt',
 'Sweden''s classic offshore race around the island of Gotland.',
 'offshore', ARRAY['SRS', 'ORC'], 'national', 'annual', 7, 3,
 'Sweden', 'Stockholm', 'Royal Swedish Yacht Club', NULL, false),

('Sjaelland Rundt', NULL, 'sjaelland-rundt',
 'Around Zealand race, one of the biggest in Scandinavia.',
 'distance', ARRAY['DH', 'IRC'], 'national', 'annual', 6, 2,
 'Denmark', 'Zealand', 'Helsingor Sejlklub', NULL, false),

-- ================================
-- EUROPE / MEDITERRANEAN
-- ================================
('Maxi Yacht Rolex Cup', 'Maxi Cup', 'maxi-yacht-rolex-cup',
 'Superyacht racing off Porto Cervo, Sardinia.',
 'fleet', ARRAY['Maxi', 'IRC'], 'world_championship', 'annual', 9, 5,
 'Italy', 'Sardinia', 'Yacht Club Costa Smeralda', NULL, false),

('Les Voiles de Saint-Tropez', NULL, 'voiles-saint-tropez',
 'Classic and modern yacht regatta in Saint-Tropez.',
 'fleet', ARRAY['IRC', 'Classic'], 'continental', 'annual', 10, 7,
 'France', 'Provence', 'Societe Nautique de Saint-Tropez', NULL, false),

('Rolex Middle Sea Race', 'Middle Sea', 'rolex-middle-sea-race',
 '606nm race from Malta around Sicily and back.',
 'offshore', ARRAY['IRC'], 'continental', 'annual', 10, 5,
 'Malta', NULL, 'Royal Malta Yacht Club', 'https://www.rolexmiddlesearace.com', true),

-- ================================
-- AMERICAS / USA
-- ================================
('Newport Bermuda Race', NULL, 'newport-bermuda',
 '635nm ocean race from Newport RI to Bermuda.',
 'offshore', ARRAY['IRC', 'ORC', 'PHRF'], 'national', 'biennial', 6, 4,
 'United States', 'Rhode Island', 'Cruising Club of America', 'https://www.bermudarace.com', true),

('Chicago Mackinac Race', 'Mac Race', 'chicago-mackinac',
 'Freshwater classic on Lake Michigan, 333 statute miles.',
 'distance', ARRAY['PHRF', 'IRC', 'Multihull'], 'national', 'annual', 7, 3,
 'United States', 'Illinois', 'Chicago Yacht Club', 'https://www.cycracetomackinac.com', false),

('Transpac', NULL, 'transpac',
 '2,225nm race from Los Angeles to Honolulu.',
 'offshore', ARRAY['IRC', 'ORR'], 'national', 'biennial', 7, 10,
 'United States', 'California', 'Transpacific Yacht Club', 'https://www.transpacyc.com', false),

('St. Petersburg - Habana Race', NULL, 'st-pete-habana',
 'Offshore race from Florida to Cuba.',
 'offshore', ARRAY['PHRF', 'IRC'], 'national', 'annual', 3, 3,
 'United States', 'Florida', 'St. Petersburg Yacht Club', NULL, false),

('Block Island Race Week', NULL, 'block-island-race-week',
 'Biennial event off Block Island, Rhode Island.',
 'fleet', ARRAY['IRC', 'ORC', 'J-Boat'], 'national', 'biennial', 6, 5,
 'United States', 'Rhode Island', 'Storm Trysail Club', NULL, false),

('Key West Race Week', NULL, 'key-west-race-week',
 'Premier winter regatta in the Florida Keys.',
 'fleet', ARRAY['IRC', 'ORC', 'PHRF'], 'national', 'annual', 1, 5,
 'United States', 'Florida', 'Storm Trysail Club', NULL, false),

('Charleston Race Week', NULL, 'charleston-race-week',
 'Largest keelboat regatta in the Western Hemisphere.',
 'fleet', ARRAY['IRC', 'PHRF', 'One-Design'], 'national', 'annual', 4, 3,
 'United States', 'South Carolina', 'Charleston Ocean Racing Association', NULL, false),

-- ================================
-- AMERICAS / CARIBBEAN
-- ================================
('Antigua Sailing Week', NULL, 'antigua-sailing-week',
 'Premier Caribbean regatta.',
 'fleet', ARRAY['CSA', 'IRC'], 'regional', 'annual', 4, 5,
 'Antigua and Barbuda', 'Antigua', 'Antigua Sailing Week', 'https://www.sailingweek.com', false),

('RORC Caribbean 600', 'Caribbean 600', 'rorc-caribbean-600',
 '600nm non-stop race around 11 Caribbean islands.',
 'offshore', ARRAY['IRC'], 'continental', 'annual', 2, 3,
 'Antigua and Barbuda', 'Antigua', 'Royal Ocean Racing Club', NULL, false),

('St. Maarten Heineken Regatta', NULL, 'st-maarten-heineken-regatta',
 'Caribbean''s largest annual regatta.',
 'fleet', ARRAY['CSA', 'Multihull', 'Bareboat'], 'regional', 'annual', 3, 3,
 'Sint Maarten', NULL, 'St. Maarten Yacht Club', NULL, false),

('Les Voiles de St. Barth', NULL, 'voiles-st-barth',
 'Prestigious Caribbean regatta with fleet and offshore racing.',
 'fleet', ARRAY['IRC', 'CSA'], 'regional', 'annual', 4, 4,
 'Saint Barthelemy', NULL, 'Saint Barth Yacht Club', NULL, false),

-- ================================
-- AMERICAS / OTHER
-- ================================
('Buenos Aires - Rio de Janeiro Race', 'BA Rio', 'buenos-aires-rio',
 '1,200nm South Atlantic ocean race.',
 'offshore', ARRAY['IRC', 'ORC'], 'continental', 'biennial', 1, 8,
 'Argentina', 'Buenos Aires', 'Yacht Club Argentino', NULL, false),

-- ================================
-- GLOBAL / MULTI-LEG
-- ================================
('The Ocean Race', NULL, 'the-ocean-race',
 'Around the world crewed race, formerly Volvo Ocean Race.',
 'offshore', ARRAY['IMOCA 60', 'VO65'], 'world_championship', 'quadrennial', 1, 180,
 NULL, NULL, 'The Ocean Race SLU', 'https://www.theoceanrace.com', true),

('SailGP', NULL, 'sailgp',
 'Global championship league featuring F50 foiling catamarans.',
 'match', ARRAY['F50'], 'world_championship', 'annual', 2, 300,
 NULL, NULL, 'SailGP', 'https://www.sailgp.com', true),

('America''s Cup', NULL, 'americas-cup',
 'The oldest international sporting trophy, first raced in 1851.',
 'match', ARRAY['AC75'], 'world_championship', 'quadrennial', 10, 30,
 NULL, NULL, 'America''s Cup Event', 'https://www.americascup.com', true),

('Rolex Swan Cup', NULL, 'rolex-swan-cup',
 'Biennial gathering of Nautor''s Swan yachts in Porto Cervo.',
 'fleet', ARRAY['Swan'], 'world_championship', 'biennial', 9, 5,
 'Italy', 'Sardinia', 'Yacht Club Costa Smeralda', NULL, false),

('52 Super Series', NULL, '52-super-series',
 'World''s leading grand prix monohull racing circuit.',
 'fleet', ARRAY['TP52'], 'world_championship', 'annual', 3, 250,
 NULL, NULL, '52 Super Series', 'https://www.52superseries.com', false),

-- ================================
-- AFRICA / SOUTH AFRICA
-- ================================
('Cape to Rio Race', NULL, 'cape-to-rio',
 'Transatlantic race from Cape Town to Rio de Janeiro.',
 'offshore', ARRAY['IRC', 'ORC'], 'continental', 'biennial', 1, 20,
 'South Africa', 'Western Cape', 'Royal Cape Yacht Club', NULL, false),

('Vasco da Gama Ocean Race', NULL, 'vasco-da-gama',
 'South African offshore classic from Durban to East London.',
 'offshore', ARRAY['IRC', 'ORC'], 'national', 'annual', 7, 3,
 'South Africa', 'KwaZulu-Natal', 'Point Yacht Club', NULL, false);
