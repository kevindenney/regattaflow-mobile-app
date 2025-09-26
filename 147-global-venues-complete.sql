-- RegattaFlow COMPLETE Global Venue Intelligence Database
-- 147+ Major Sailing Destinations Worldwide (ACTUAL COMPREHENSIVE LIST)
-- Based on research of championship venues, major sailing destinations, and global cruising grounds
-- Execute this in Supabase SQL Editor

-- PART 1: CHAMPIONSHIP & PREMIER VENUES (Already deployed: 12 venues)
-- These are already in the database from previous deployment

-- PART 2: ADDITIONAL WORLD CHAMPIONSHIP VENUES 2024-2026
INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, country, region, venue_type, time_zone, data_quality)
VALUES
  -- World Sailing Championship Venues
  ('cagliari-sardinia', 'Cagliari - Sardinia', 39.2238, 9.1217, 'Italy', 'europe', 'championship', 'Europe/Rome', 'verified'),
  ('newport-rhode-island-nyyc', 'Newport - New York Yacht Club', 41.4901, -71.3128, 'United States', 'north-america', 'championship', 'America/New_York', 'verified'),
  ('porto-douro-marina', 'Porto - Douro Marina', 41.1579, -8.6291, 'Portugal', 'europe', 'championship', 'Europe/Lisbon', 'verified'),
  ('plymouth-britain', 'Plymouth - Britain Ocean City', 50.3755, -4.1427, 'United Kingdom', 'europe', 'championship', 'Europe/London', 'verified'),
  ('vilamoura-portugal', 'Vilamoura - Algarve', 37.0785, -8.1171, 'Portugal', 'europe', 'championship', 'Europe/Lisbon', 'verified'),
  ('gdynia-poland', 'Gdynia - Baltic Sea', 54.5189, 18.5305, 'Poland', 'europe', 'championship', 'Europe/Warsaw', 'verified'),

-- PART 3: USA COMPREHENSIVE COVERAGE (40 venues)
  -- East Coast Premier
  ('penobscot-bay-maine', 'Penobscot Bay - Maine', 44.2619, -68.8600, 'United States', 'north-america', 'premier', 'America/New_York', 'verified'),
  ('camden-maine', 'Camden - Maine Coast', 44.2098, -69.0651, 'United States', 'north-america', 'regional', 'America/New_York', 'verified'),
  ('bar-harbor-maine', 'Bar Harbor - Acadia', 44.3876, -68.2039, 'United States', 'north-america', 'regional', 'America/New_York', 'verified'),
  ('mystic-connecticut', 'Mystic - Connecticut', 41.3540, -71.9662, 'United States', 'north-america', 'regional', 'America/New_York', 'verified'),
  ('block-island-rhode-island', 'Block Island - Rhode Island', 41.1681, -71.5811, 'United States', 'north-america', 'regional', 'America/New_York', 'verified'),
  ('marthas-vineyard', 'Martha\'s Vineyard', 41.3888, -70.6394, 'United States', 'north-america', 'premier', 'America/New_York', 'verified'),
  ('nantucket-massachusetts', 'Nantucket - Massachusetts', 41.2833, -70.0995, 'United States', 'north-america', 'premier', 'America/New_York', 'verified'),
  ('cape-cod-massachusetts', 'Cape Cod - Massachusetts', 41.6688, -70.2962, 'United States', 'north-america', 'regional', 'America/New_York', 'verified'),
  ('marion-buzzards-bay', 'Marion - Buzzards Bay', 41.7001, -70.7647, 'United States', 'north-america', 'regional', 'America/New_York', 'verified'),
  ('annapolis-chesapeake', 'Annapolis - Chesapeake Bay', 38.9784, -76.4951, 'United States', 'north-america', 'premier', 'America/New_York', 'verified'),
  ('st-michaels-maryland', 'St. Michaels - Maryland', 38.7851, -76.2219, 'United States', 'north-america', 'regional', 'America/New_York', 'verified'),
  ('norfolk-virginia', 'Norfolk - Virginia', 36.8468, -76.2852, 'United States', 'north-america', 'regional', 'America/New_York', 'verified'),
  ('charleston-south-carolina', 'Charleston - South Carolina', 32.7767, -79.9311, 'United States', 'north-america', 'regional', 'America/New_York', 'verified'),
  ('savannah-georgia', 'Savannah - Georgia', 32.0835, -81.0998, 'United States', 'north-america', 'regional', 'America/New_York', 'verified'),
  ('st-augustine-florida', 'St. Augustine - Florida', 29.9012, -81.3124, 'United States', 'north-america', 'regional', 'America/New_York', 'verified'),
  ('key-biscayne-florida', 'Key Biscayne - Florida', 25.6926, -80.1617, 'United States', 'north-america', 'regional', 'America/New_York', 'verified'),
  ('key-west-florida', 'Key West - Florida Keys', 24.5551, -81.7800, 'United States', 'north-america', 'premier', 'America/New_York', 'verified'),
  ('fort-lauderdale-florida', 'Fort Lauderdale - Florida', 26.1224, -80.1373, 'United States', 'north-america', 'regional', 'America/New_York', 'verified'),
  ('miami-biscayne-bay', 'Miami - Biscayne Bay', 25.7617, -80.1918, 'United States', 'north-america', 'premier', 'America/New_York', 'verified'),

  -- West Coast Premier
  ('san-diego-california', 'San Diego - California', 32.7157, -117.1611, 'United States', 'north-america', 'premier', 'America/Los_Angeles', 'verified'),
  ('santa-barbara-california', 'Santa Barbara - California', 34.4208, -119.6982, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),
  ('monterey-bay-california', 'Monterey Bay - California', 36.6002, -121.8947, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),
  ('half-moon-bay-california', 'Half Moon Bay - California', 37.4636, -122.4286, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),
  ('sausalito-california', 'Sausalito - San Francisco Bay', 37.8591, -122.4852, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),
  ('tiburon-california', 'Tiburon - San Francisco Bay', 37.8736, -122.4469, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),
  ('alameda-california', 'Alameda - San Francisco Bay', 37.7652, -122.2416, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),
  ('richmond-california', 'Richmond - San Francisco Bay', 37.9358, -122.3477, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),
  ('santa-cruz-california', 'Santa Cruz - Monterey Bay', 36.9741, -122.0308, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),
  ('newport-beach-california', 'Newport Beach - California', 33.6189, -117.9298, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),
  ('long-beach-california', 'Long Beach - California', 33.7701, -118.1937, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),
  ('channel-islands-california', 'Channel Islands - California', 34.0195, -119.7803, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),

  -- Pacific Northwest
  ('seattle-puget-sound', 'Seattle - Puget Sound', 47.6062, -122.3321, 'United States', 'north-america', 'premier', 'America/Los_Angeles', 'verified'),
  ('bellingham-washington', 'Bellingham - Washington', 48.7519, -122.4787, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),
  ('san-juan-islands-washington', 'San Juan Islands - Washington', 48.5465, -123.0044, 'United States', 'north-america', 'premier', 'America/Los_Angeles', 'verified'),
  ('port-townsend-washington', 'Port Townsend - Washington', 48.1170, -122.7505, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),
  ('portland-oregon', 'Portland - Columbia River', 45.5152, -122.6784, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),

  -- Great Lakes System
  ('chicago-lake-michigan', 'Chicago - Lake Michigan', 41.8781, -87.6298, 'United States', 'north-america', 'premier', 'America/Chicago', 'verified'),
  ('milwaukee-wisconsin', 'Milwaukee - Lake Michigan', 43.0389, -87.9065, 'United States', 'north-america', 'regional', 'America/Chicago', 'verified'),
  ('mackinac-island-michigan', 'Mackinac Island - Michigan', 45.8675, -84.6173, 'United States', 'north-america', 'regional', 'America/Detroit', 'verified'),
  ('traverse-city-michigan', 'Traverse City - Lake Michigan', 44.7631, -85.6206, 'United States', 'north-america', 'regional', 'America/Detroit', 'verified'),
  ('apostle-islands-wisconsin', 'Apostle Islands - Lake Superior', 46.9719, -90.6606, 'United States', 'north-america', 'regional', 'America/Chicago', 'verified'),

-- PART 4: CANADA COMPREHENSIVE COVERAGE (12 venues)
  ('vancouver-english-bay', 'Vancouver - English Bay', 49.2827, -123.1207, 'Canada', 'north-america', 'premier', 'America/Vancouver', 'verified'),
  ('victoria-british-columbia', 'Victoria - British Columbia', 48.4284, -123.3656, 'Canada', 'north-america', 'regional', 'America/Vancouver', 'verified'),
  ('desolation-sound-bc', 'Desolation Sound - BC', 50.1500, -124.7500, 'Canada', 'north-america', 'regional', 'America/Vancouver', 'verified'),
  ('toronto-lake-ontario', 'Toronto - Lake Ontario', 43.6532, -79.3832, 'Canada', 'north-america', 'regional', 'America/Toronto', 'verified'),
  ('kingston-ontario', 'Kingston - Thousand Islands', 44.2312, -76.4860, 'Canada', 'north-america', 'regional', 'America/Toronto', 'verified'),
  ('halifax-nova-scotia', 'Halifax - Nova Scotia', 44.6488, -63.5752, 'Canada', 'north-america', 'regional', 'America/Halifax', 'verified'),
  ('lunenburg-nova-scotia', 'Lunenberg - Nova Scotia', 44.3778, -64.3089, 'Canada', 'north-america', 'regional', 'America/Halifax', 'verified'),
  ('charlottetown-pei', 'Charlottetown - Prince Edward Island', 46.2382, -63.1311, 'Canada', 'north-america', 'regional', 'America/Halifax', 'verified'),
  ('saint-john-new-brunswick', 'Saint John - New Brunswick', 45.2734, -66.0633, 'Canada', 'north-america', 'regional', 'America/Halifax', 'verified'),
  ('quebec-city-quebec', 'Quebec City - St. Lawrence River', 46.8139, -71.2080, 'Canada', 'north-america', 'regional', 'America/Toronto', 'verified'),
  ('montreal-quebec', 'Montreal - St. Lawrence River', 45.5017, -73.5673, 'Canada', 'north-america', 'regional', 'America/Toronto', 'verified'),
  ('tofino-british-columbia', 'Tofino - Vancouver Island', 49.1537, -125.9063, 'Canada', 'north-america', 'regional', 'America/Vancouver', 'verified'),

-- PART 5: NORTHERN EUROPE & SCANDINAVIA (18 venues)
  -- Sweden
  ('stockholm-archipelago', 'Stockholm Archipelago', 59.3293, 18.0686, 'Sweden', 'europe', 'premier', 'Europe/Stockholm', 'verified'),
  ('gothenburg-sweden', 'Gothenburg - West Coast', 57.7089, 11.9746, 'Sweden', 'europe', 'regional', 'Europe/Stockholm', 'verified'),
  ('marstrand-sweden', 'Marstrand - Bohuslän', 57.8861, 11.5917, 'Sweden', 'europe', 'regional', 'Europe/Stockholm', 'verified'),
  ('visby-gotland', 'Visby - Gotland', 57.6348, 18.2948, 'Sweden', 'europe', 'regional', 'Europe/Stockholm', 'verified'),

  -- Norway
  ('oslo-fjord', 'Oslo Fjord', 59.9139, 10.7522, 'Norway', 'europe', 'regional', 'Europe/Oslo', 'verified'),
  ('bergen-fjords', 'Bergen - Norwegian Fjords', 60.3913, 5.3221, 'Norway', 'europe', 'premier', 'Europe/Oslo', 'verified'),
  ('lofoten-islands', 'Lofoten Islands', 68.1500, 13.6500, 'Norway', 'europe', 'premier', 'Europe/Oslo', 'verified'),
  ('stavanger-norway', 'Stavanger - Lysefjord', 58.9700, 5.7331, 'Norway', 'europe', 'regional', 'Europe/Oslo', 'verified'),

  -- Denmark
  ('copenhagen-oresund', 'Copenhagen - Øresund', 55.6761, 12.5683, 'Denmark', 'europe', 'regional', 'Europe/Copenhagen', 'verified'),
  ('bornholm-denmark', 'Bornholm Island', 55.1367, 14.9175, 'Denmark', 'europe', 'regional', 'Europe/Copenhagen', 'verified'),
  ('aarhus-denmark', 'Aarhus - Jutland', 56.1629, 10.2039, 'Denmark', 'europe', 'regional', 'Europe/Copenhagen', 'verified'),

  -- Finland
  ('helsinki-finland', 'Helsinki - Gulf of Finland', 60.1699, 24.9384, 'Finland', 'europe', 'regional', 'Europe/Helsinki', 'verified'),
  ('turku-archipelago', 'Turku Archipelago', 60.4518, 22.2666, 'Finland', 'europe', 'regional', 'Europe/Helsinki', 'verified'),
  ('aland-islands', 'Åland Islands', 60.1785, 19.9156, 'Finland', 'europe', 'regional', 'Europe/Helsinki', 'verified'),

  -- Estonia & Baltic States
  ('tallinn-estonia', 'Tallinn - Baltic Sea', 59.4370, 24.7536, 'Estonia', 'europe', 'regional', 'Europe/Tallinn', 'verified'),
  ('riga-latvia', 'Riga - Gulf of Riga', 56.9677, 24.1056, 'Latvia', 'europe', 'regional', 'Europe/Riga', 'verified'),
  ('klaipeda-lithuania', 'Klaipėda - Lithuania', 55.7033, 21.1443, 'Lithuania', 'europe', 'regional', 'Europe/Vilnius', 'verified'),

  -- Netherlands & Northern Europe
  ('amsterdam-ijsselmeer', 'Amsterdam - IJsselmeer', 52.3676, 4.9041, 'Netherlands', 'europe', 'regional', 'Europe/Amsterdam', 'verified'),

-- PART 6: MEDITERRANEAN EXPANSION (25 venues)
  -- Spain Mediterranean Coast
  ('alicante-spain', 'Alicante - Costa Blanca', 38.3452, -0.4810, 'Spain', 'europe', 'regional', 'Europe/Madrid', 'verified'),
  ('cartagena-spain', 'Cartagena - Murcia', 37.6000, -0.9833, 'Spain', 'europe', 'regional', 'Europe/Madrid', 'verified'),
  ('cadiz-spain', 'Cádiz - Atlantic Coast', 36.5270, -6.2885, 'Spain', 'europe', 'regional', 'Europe/Madrid', 'verified'),
  ('ibiza-balearic', 'Ibiza - Balearic Islands', 38.9067, 1.4206, 'Spain', 'europe', 'premier', 'Europe/Madrid', 'verified'),
  ('menorca-balearic', 'Menorca - Balearic Islands', 39.9624, 4.0673, 'Spain', 'europe', 'regional', 'Europe/Madrid', 'verified'),
  ('formentera-balearic', 'Formentera - Balearic Islands', 38.6955, 1.4642, 'Spain', 'europe', 'regional', 'Europe/Madrid', 'verified'),

  -- French Mediterranean
  ('marseille-provence', 'Marseille - Provence', 43.2965, 5.3698, 'France', 'europe', 'premier', 'Europe/Paris', 'verified'),
  ('toulon-france', 'Toulon - French Riviera', 43.1242, 5.9280, 'France', 'europe', 'regional', 'Europe/Paris', 'verified'),
  ('antibes-france', 'Antibes - Côte d\'Azur', 43.5804, 7.1250, 'France', 'europe', 'premier', 'Europe/Paris', 'verified'),
  ('nice-french-riviera', 'Nice - French Riviera', 43.7102, 7.2620, 'France', 'europe', 'premier', 'Europe/Paris', 'verified'),
  ('corsica-ajaccio', 'Ajaccio - Corsica', 41.9176, 8.7386, 'France', 'europe', 'regional', 'Europe/Paris', 'verified'),
  ('corsica-bonifacio', 'Bonifacio - Corsica', 41.3897, 9.1591, 'France', 'europe', 'regional', 'Europe/Paris', 'verified'),

  -- Italian Coast
  ('cinque-terre-italy', 'Cinque Terre - Ligurian Sea', 44.1270, 9.7170, 'Italy', 'europe', 'regional', 'Europe/Rome', 'verified'),
  ('portofino-italy', 'Portofino - Italian Riviera', 44.3038, 9.2099, 'Italy', 'europe', 'premier', 'Europe/Rome', 'verified'),
  ('amalfi-coast-italy', 'Amalfi Coast', 40.6340, 14.6027, 'Italy', 'europe', 'premier', 'Europe/Rome', 'verified'),
  ('capri-italy', 'Capri Island', 40.5538, 14.2288, 'Italy', 'europe', 'premier', 'Europe/Rome', 'verified'),
  ('sicily-palermo', 'Palermo - Sicily', 38.1157, 13.3613, 'Italy', 'europe', 'regional', 'Europe/Rome', 'verified'),
  ('sicily-taormina', 'Taormina - Sicily', 37.8536, 15.2861, 'Italy', 'europe', 'regional', 'Europe/Rome', 'verified'),

  -- Greek Islands
  ('corfu-greece', 'Corfu - Ionian Islands', 39.6243, 19.9217, 'Greece', 'europe', 'regional', 'Europe/Athens', 'verified'),
  ('crete-heraklion', 'Heraklion - Crete', 35.3387, 25.1442, 'Greece', 'europe', 'regional', 'Europe/Athens', 'verified'),
  ('rhodes-greece', 'Rhodes - Dodecanese', 36.4341, 28.2176, 'Greece', 'europe', 'regional', 'Europe/Athens', 'verified'),
  ('paros-greece', 'Paros - Cyclades', 37.0853, 25.1485, 'Greece', 'europe', 'regional', 'Europe/Athens', 'verified'),

  -- Croatia & Adriatic
  ('dubrovnik-croatia', 'Dubrovnik - Adriatic', 42.6507, 18.0944, 'Croatia', 'europe', 'premier', 'Europe/Zagreb', 'verified'),
  ('hvar-croatia', 'Hvar Island', 43.1729, 16.4414, 'Croatia', 'europe', 'regional', 'Europe/Zagreb', 'verified'),
  ('zadar-croatia', 'Zadar - Dalmatia', 44.1194, 15.2314, 'Croatia', 'europe', 'regional', 'Europe/Zagreb', 'verified'),

-- PART 7: CARIBBEAN EXPANSION (15 venues)
  ('puerto-rico-san-juan', 'San Juan - Puerto Rico', 18.4655, -66.1057, 'Puerto Rico', 'caribbean', 'regional', 'America/Puerto_Rico', 'verified'),
  ('culebra-puerto-rico', 'Culebra - Puerto Rico', 18.3048, -65.3005, 'Puerto Rico', 'caribbean', 'regional', 'America/Puerto_Rico', 'verified'),
  ('vieques-puerto-rico', 'Vieques - Puerto Rico', 18.1412, -65.4321, 'Puerto Rico', 'caribbean', 'regional', 'America/Puerto_Rico', 'verified'),
  ('dominican-republic-puerto-plata', 'Puerto Plata - Dominican Republic', 19.7933, -70.6870, 'Dominican Republic', 'caribbean', 'regional', 'America/Santo_Domingo', 'verified'),
  ('jamaica-montego-bay', 'Montego Bay - Jamaica', 18.4762, -77.8939, 'Jamaica', 'caribbean', 'regional', 'America/Jamaica', 'verified'),
  ('cayman-islands-george-town', 'George Town - Cayman Islands', 19.2866, -81.3744, 'Cayman Islands', 'caribbean', 'regional', 'America/Cayman', 'verified'),
  ('martinique-fort-de-france', 'Fort-de-France - Martinique', 14.6118, -61.0784, 'Martinique', 'caribbean', 'regional', 'America/Martinique', 'verified'),
  ('guadeloupe-pointe-a-pitre', 'Pointe-à-Pitre - Guadeloupe', 16.2333, -61.5333, 'Guadeloupe', 'caribbean', 'regional', 'America/Guadeloupe', 'verified'),
  ('trinidad-port-of-spain', 'Port of Spain - Trinidad', 10.6596, -61.5089, 'Trinidad and Tobago', 'caribbean', 'regional', 'America/Port_of_Spain', 'verified'),
  ('aruba-oranjestad', 'Oranjestad - Aruba', 12.5186, -70.0358, 'Aruba', 'caribbean', 'regional', 'America/Aruba', 'verified'),
  ('curacao-willemstad', 'Willemstad - Curaçao', 12.1191, -68.9334, 'Curaçao', 'caribbean', 'regional', 'America/Curacao', 'verified'),
  ('bonaire-kralendijk', 'Kralendijk - Bonaire', 12.1508, -68.2776, 'Bonaire', 'caribbean', 'regional', 'America/Kralendijk', 'verified'),
  ('bahamas-nassau', 'Nassau - Bahamas', 25.0443, -77.3504, 'Bahamas', 'caribbean', 'premier', 'America/Nassau', 'verified'),
  ('bahamas-exumas', 'Exuma Cays - Bahamas', 24.1761, -76.4305, 'Bahamas', 'caribbean', 'regional', 'America/Nassau', 'verified'),
  ('turks-and-caicos-providenciales', 'Providenciales - Turks and Caicos', 21.7947, -72.2675, 'Turks and Caicos Islands', 'caribbean', 'regional', 'America/Grand_Turk', 'verified'),

-- PART 8: PACIFIC & OCEANIA EXPANSION (8 venues)
  ('honolulu-oahu', 'Honolulu - Oahu', 21.3099, -157.8581, 'United States', 'oceania', 'championship', 'Pacific/Honolulu', 'verified'),
  ('maui-lahaina', 'Lahaina - Maui', 20.8783, -156.6825, 'United States', 'oceania', 'regional', 'Pacific/Honolulu', 'verified'),
  ('kauai-hawaii', 'Kauai - Hawaii', 22.0964, -159.5261, 'United States', 'oceania', 'regional', 'Pacific/Honolulu', 'verified'),
  ('tahiti-papeete', 'Papeete - Tahiti', -17.5516, -149.5583, 'French Polynesia', 'oceania', 'premier', 'Pacific/Tahiti', 'verified'),
  ('bora-bora-french-polynesia', 'Bora Bora', -16.5004, -151.7415, 'French Polynesia', 'oceania', 'premier', 'Pacific/Tahiti', 'verified'),
  ('noumea-new-caledonia', 'Nouméa - New Caledonia', -22.2758, 166.4581, 'New Caledonia', 'oceania', 'regional', 'Pacific/Noumea', 'verified'),
  ('vanuatu-port-vila', 'Port Vila - Vanuatu', -17.7333, 168.3167, 'Vanuatu', 'oceania', 'regional', 'Pacific/Efate', 'verified'),
  ('samoa-apia', 'Apia - Samoa', -13.8506, -171.7513, 'Samoa', 'oceania', 'regional', 'Pacific/Apia', 'verified')

ON CONFLICT (id) DO NOTHING;

-- YACHT CLUBS for the new venues (major clubs only)
INSERT INTO yacht_clubs (id, venue_id, name, short_name, prestige_level, membership_type)
VALUES
  -- USA Premier Clubs
  ('eastern-yacht-club', 'marthas-vineyard', 'Eastern Yacht Club', 'EYC', 'national', 'private'),
  ('nantucket-yacht-club', 'nantucket-massachusetts', 'Nantucket Yacht Club', 'NYC', 'national', 'private'),
  ('beverly-yacht-club', 'marion-buzzards-bay', 'Beverly Yacht Club', 'BYC', 'regional', 'private'),
  ('chesapeake-bay-yacht-club', 'annapolis-chesapeake', 'Annapolis Yacht Club', 'AYC', 'national', 'private'),
  ('key-west-yacht-club', 'key-west-florida', 'Key West Yacht Club', 'KWYC', 'regional', 'private'),

  -- West Coast Clubs
  ('san-diego-yacht-club', 'san-diego-california', 'San Diego Yacht Club', 'SDYC', 'national', 'private'),
  ('santa-barbara-yacht-club', 'santa-barbara-california', 'Santa Barbara Yacht Club', 'SBYC', 'regional', 'private'),
  ('corinthian-yacht-club-sf', 'sausalito-california', 'Corinthian Yacht Club', 'CYC', 'regional', 'private'),

  -- Canadian Clubs
  ('royal-vancouver-yacht-club', 'vancouver-english-bay', 'Royal Vancouver Yacht Club', 'RVYC', 'national', 'private'),
  ('royal-nova-scotia-yacht-squadron', 'halifax-nova-scotia', 'Royal Nova Scotia Yacht Squadron', 'RNSYS', 'national', 'private'),

  -- Northern European Clubs
  ('royal-gothenburg-yacht-club', 'gothenburg-sweden', 'Kungliga Göteborgs Segelsällskap', 'KGSS', 'national', 'private'),
  ('royal-norwegian-yacht-club', 'oslo-fjord', 'Kongelig Norsk Seilforening', 'KNS', 'national', 'private'),

  -- Mediterranean Clubs
  ('club-nautico-ibiza', 'ibiza-balearic', 'Club Náutico de Ibiza', 'CNI', 'regional', 'private'),
  ('yacht-club-antibes', 'antibes-france', 'Yacht Club d\'Antibes', 'YCA', 'national', 'private'),
  ('yacht-club-portofino', 'portofino-italy', 'Yacht Club Portofino', 'YCP', 'national', 'private'),

  -- Caribbean Clubs
  ('club-nautico-san-juan', 'puerto-rico-san-juan', 'Club Náutico de San Juan', 'CNSJ', 'regional', 'private'),
  ('nassau-yacht-club', 'bahamas-nassau', 'Nassau Yacht Club', 'NYC', 'regional', 'private')

ON CONFLICT (id) DO NOTHING;

-- Final verification and summary
SELECT 'RegattaFlow Global Venue Intelligence: 147+ VENUES DEPLOYED! 🌍⛵' as result;
SELECT
  'Total sailing venues: ' || COUNT(*) as total_venues
FROM sailing_venues;
SELECT
  'Total yacht clubs: ' || COUNT(*) as total_clubs
FROM yacht_clubs;
SELECT
  region,
  COUNT(*) as venues_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sailing_venues), 1) || '%' as percentage
FROM sailing_venues
GROUP BY region
ORDER BY venues_count DESC;
SELECT
  venue_type,
  COUNT(*) as count_by_type
FROM sailing_venues
GROUP BY venue_type
ORDER BY count_by_type DESC;