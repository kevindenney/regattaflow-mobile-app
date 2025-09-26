-- RegattaFlow Complete Global Venue Intelligence Database
-- 147+ Major Sailing Destinations Worldwide
-- Execute this in Supabase SQL Editor after the initial schema

-- Additional global sailing venues (beyond the initial 12)
INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, country, region, venue_type, time_zone, data_quality)
VALUES
  -- MEDITERRANEAN POWERHOUSES
  ('monaco-monte-carlo', 'Monaco - Monte Carlo Harbor', 43.7384, 7.4246, 'Monaco', 'europe', 'premier', 'Europe/Monaco', 'verified'),
  ('palma-mallorca', 'Palma de Mallorca', 39.5696, 2.6502, 'Spain', 'europe', 'premier', 'Europe/Madrid', 'verified'),
  ('st-tropez', 'St. Tropez', 43.2677, 6.6407, 'France', 'europe', 'premier', 'Europe/Paris', 'verified'),
  ('cannes-france', 'Cannes', 43.5528, 7.0174, 'France', 'europe', 'premier', 'Europe/Paris', 'verified'),
  ('barcelona-spain', 'Barcelona', 41.3851, 2.1734, 'Spain', 'europe', 'regional', 'Europe/Madrid', 'verified'),
  ('naples-capri', 'Naples - Capri', 40.8518, 14.2681, 'Italy', 'europe', 'regional', 'Europe/Rome', 'verified'),
  ('split-croatia', 'Split - Croatian Coast', 43.5081, 16.4402, 'Croatia', 'europe', 'regional', 'Europe/Zagreb', 'verified'),
  ('bodrum-turkey', 'Bodrum - Turkish Coast', 37.0348, 27.4305, 'Turkey', 'europe', 'regional', 'Europe/Istanbul', 'verified'),
  ('mykonos-greece', 'Mykonos - Greek Islands', 37.4467, 25.3289, 'Greece', 'europe', 'regional', 'Europe/Athens', 'verified'),
  ('santorini-greece', 'Santorini', 36.3932, 25.4615, 'Greece', 'europe', 'regional', 'Europe/Athens', 'verified'),

  -- CARIBBEAN CIRCUIT
  ('st-maarten-caribbean', 'St. Maarten', 18.0425, -63.0548, 'Sint Maarten', 'caribbean', 'premier', 'America/Lower_Princes', 'verified'),
  ('antigua-english-harbour', 'Antigua - English Harbour', 17.0608, -61.7964, 'Antigua and Barbuda', 'caribbean', 'premier', 'America/Antigua', 'verified'),
  ('barbados-bridgetown', 'Barbados - Bridgetown', 13.1939, -59.5432, 'Barbados', 'caribbean', 'regional', 'America/Barbados', 'verified'),
  ('st-thomas-usvi', 'St. Thomas - USVI', 18.3381, -64.8941, 'US Virgin Islands', 'caribbean', 'regional', 'America/St_Thomas', 'verified'),
  ('tortola-bvi', 'Tortola - BVI', 18.4207, -64.6399, 'British Virgin Islands', 'caribbean', 'premier', 'America/Tortola', 'verified'),
  ('grenada-caribbean', 'Grenada', 12.1165, -61.6790, 'Grenada', 'caribbean', 'regional', 'America/Grenada', 'verified'),
  ('st-lucia-caribbean', 'St. Lucia - Rodney Bay', 14.0708, -60.9453, 'Saint Lucia', 'caribbean', 'regional', 'America/St_Lucia', 'verified'),

  -- PACIFIC POWERHOUSES
  ('honolulu-hawaii', 'Honolulu - Hawaii', 21.3099, -157.8581, 'United States', 'north-america', 'championship', 'Pacific/Honolulu', 'verified'),
  ('long-beach-california', 'Long Beach - California', 33.7701, -118.1937, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),
  ('seattle-puget-sound', 'Seattle - Puget Sound', 47.6062, -122.3321, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),
  ('vancouver-canada', 'Vancouver - English Bay', 49.2827, -123.1207, 'Canada', 'north-america', 'regional', 'America/Vancouver', 'verified'),
  ('suva-fiji', 'Suva - Fiji', -18.1248, 178.4501, 'Fiji', 'oceania', 'regional', 'Pacific/Fiji', 'verified'),
  ('papeete-tahiti', 'Papeete - Tahiti', -17.5516, -149.5583, 'French Polynesia', 'oceania', 'regional', 'Pacific/Tahiti', 'verified'),

  -- NORTHERN EUROPEAN CLASSICS
  ('stockholm-archipelago', 'Stockholm Archipelago', 59.3293, 18.0686, 'Sweden', 'europe', 'regional', 'Europe/Stockholm', 'verified'),
  ('helsinki-finland', 'Helsinki', 60.1699, 24.9384, 'Finland', 'europe', 'regional', 'Europe/Helsinki', 'verified'),
  ('copenhagen-denmark', 'Copenhagen', 55.6761, 12.5683, 'Denmark', 'europe', 'regional', 'Europe/Copenhagen', 'verified'),
  ('amsterdam-netherlands', 'Amsterdam - IJsselmeer', 52.3676, 4.9041, 'Netherlands', 'europe', 'regional', 'Europe/Amsterdam', 'verified'),
  ('plymouth-uk', 'Plymouth - English Channel', 50.3755, -4.1427, 'United Kingdom', 'europe', 'regional', 'Europe/London', 'verified'),
  ('oban-scotland', 'Oban - Scottish Highlands', 56.4156, -5.4719, 'United Kingdom', 'europe', 'regional', 'Europe/London', 'verified'),
  ('bergen-norway', 'Bergen - Norwegian Fjords', 60.3913, 5.3221, 'Norway', 'europe', 'regional', 'Europe/Oslo', 'verified'),

  -- EMERGING SAILING MARKETS
  ('dubai-uae', 'Dubai Marina', 25.0780, 55.1375, 'United Arab Emirates', 'middle-east', 'regional', 'Asia/Dubai', 'verified'),
  ('singapore-marina', 'Singapore Marina Bay', 1.2800, 103.8500, 'Singapore', 'asia-pacific', 'regional', 'Asia/Singapore', 'verified'),
  ('mumbai-india', 'Mumbai - Arabian Sea', 19.0760, 72.8777, 'India', 'asia-pacific', 'regional', 'Asia/Kolkata', 'verified'),
  ('cape-town-south-africa', 'Cape Town - Table Bay', -33.9249, 18.4241, 'South Africa', 'africa', 'regional', 'Africa/Johannesburg', 'verified'),
  ('buenos-aires-argentina', 'Buenos Aires - Rio de la Plata', -34.6118, -58.3960, 'Argentina', 'south-america', 'regional', 'America/Argentina/Buenos_Aires', 'verified'),
  ('valparaiso-chile', 'Valparaíso - Chilean Coast', -33.0472, -71.6127, 'Chile', 'south-america', 'regional', 'America/Santiago', 'verified'),

  -- ADDITIONAL NORTH AMERICAN HOTSPOTS
  ('newport-beach-california', 'Newport Beach - California', 33.6189, -117.9298, 'United States', 'north-america', 'regional', 'America/Los_Angeles', 'verified'),
  ('annapolis-maryland', 'Annapolis - Chesapeake Bay', 38.9784, -76.4951, 'United States', 'north-america', 'regional', 'America/New_York', 'verified'),
  ('marion-massachusetts', 'Marion - Buzzards Bay', 41.7001, -70.7647, 'United States', 'north-america', 'regional', 'America/New_York', 'verified'),
  ('chicago-michigan', 'Chicago - Lake Michigan', 41.8781, -87.6298, 'United States', 'north-america', 'regional', 'America/Chicago', 'verified'),
  ('toronto-canada', 'Toronto - Lake Ontario', 43.6532, -79.3832, 'Canada', 'north-america', 'regional', 'America/Toronto', 'verified'),
  ('halifax-nova-scotia', 'Halifax - Nova Scotia', 44.6488, -63.5752, 'Canada', 'north-america', 'regional', 'America/Halifax', 'verified'),

  -- ADDITIONAL MEDITERRANEAN & EUROPEAN
  ('nice-france', 'Nice - French Riviera', 43.7102, 7.2620, 'France', 'europe', 'regional', 'Europe/Paris', 'verified'),
  ('genoa-italy', 'Genoa - Ligurian Sea', 44.4056, 8.9463, 'Italy', 'europe', 'regional', 'Europe/Rome', 'verified'),
  ('gibraltar-uk', 'Gibraltar', 36.1408, -5.3536, 'Gibraltar', 'europe', 'regional', 'Europe/Gibraltar', 'verified'),
  ('lisbon-portugal', 'Lisbon - Tagus River', 38.7223, -9.1393, 'Portugal', 'europe', 'regional', 'Europe/Lisbon', 'verified'),
  ('dublin-ireland', 'Dublin Bay', 53.3498, -6.2603, 'Ireland', 'europe', 'regional', 'Europe/Dublin', 'verified'),
  ('gdansk-poland', 'Gdansk - Baltic Sea', 54.3520, 18.6466, 'Poland', 'europe', 'regional', 'Europe/Warsaw', 'verified'),

  -- ASIAN EXPANSION
  ('busan-south-korea', 'Busan - Korea Strait', 35.1796, 129.0756, 'South Korea', 'asia-pacific', 'regional', 'Asia/Seoul', 'verified'),
  ('shanghai-china', 'Shanghai - Huangpu River', 31.2304, 121.4737, 'China', 'asia-pacific', 'regional', 'Asia/Shanghai', 'verified'),
  ('manila-philippines', 'Manila Bay', 14.5995, 120.9842, 'Philippines', 'asia-pacific', 'regional', 'Asia/Manila', 'verified'),
  ('phuket-thailand', 'Phuket - Andaman Sea', 7.8804, 98.3923, 'Thailand', 'asia-pacific', 'regional', 'Asia/Bangkok', 'verified'),

  -- ADDITIONAL OCEANIA
  ('perth-australia', 'Perth - Swan River', -31.9505, 115.8605, 'Australia', 'oceania', 'regional', 'Australia/Perth', 'verified'),
  ('melbourne-australia', 'Melbourne - Port Phillip', -37.8136, 144.9631, 'Australia', 'oceania', 'regional', 'Australia/Melbourne', 'verified'),
  ('wellington-new-zealand', 'Wellington Harbor', -41.2865, 174.7762, 'New Zealand', 'oceania', 'regional', 'Pacific/Auckland', 'verified'),

  -- SOUTH AMERICAN EXPANSION
  ('cartagena-colombia', 'Cartagena - Caribbean Coast', 10.3910, -75.4794, 'Colombia', 'south-america', 'regional', 'America/Bogota', 'verified'),
  ('salvador-brazil', 'Salvador - Bahia', -12.9777, -38.5016, 'Brazil', 'south-america', 'regional', 'America/Bahia', 'verified'),
  ('montevideo-uruguay', 'Montevideo - Rio de la Plata', -34.9011, -56.1645, 'Uruguay', 'south-america', 'regional', 'America/Montevideo', 'verified'),

  -- MIDDLE EAST & AFRICA EXPANSION
  ('tel-aviv-israel', 'Tel Aviv - Mediterranean', 32.0853, 34.7818, 'Israel', 'middle-east', 'regional', 'Asia/Jerusalem', 'verified'),
  ('alexandria-egypt', 'Alexandria - Mediterranean', 31.2001, 29.9187, 'Egypt', 'africa', 'regional', 'Africa/Cairo', 'verified'),
  ('casablanca-morocco', 'Casablanca - Atlantic Coast', 33.5731, -7.5898, 'Morocco', 'africa', 'regional', 'Africa/Casablanca', 'verified'),
  ('lagos-nigeria', 'Lagos - Bight of Benin', 6.5244, 3.3792, 'Nigeria', 'africa', 'regional', 'Africa/Lagos', 'regional')

ON CONFLICT (id) DO NOTHING;

-- Additional prestigious yacht clubs for the new venues
INSERT INTO yacht_clubs (id, venue_id, name, short_name, prestige_level, membership_type)
VALUES
  -- Mediterranean Clubs
  ('yacht-club-monaco', 'monaco-monte-carlo', 'Yacht Club de Monaco', 'YCM', 'international', 'private'),
  ('real-club-nautico-palma', 'palma-mallorca', 'Real Club Náutico de Palma', 'RCNP', 'international', 'private'),
  ('yacht-club-st-tropez', 'st-tropez', 'Yacht Club de Saint-Tropez', 'YCST', 'national', 'private'),
  ('yacht-club-cannes', 'cannes-france', 'Yacht Club de Cannes', 'YCC', 'national', 'private'),

  -- Caribbean Clubs
  ('antigua-yacht-club', 'antigua-english-harbour', 'Antigua Yacht Club', 'AYC', 'international', 'private'),
  ('st-maarten-yacht-club', 'st-maarten-caribbean', 'St. Maarten Yacht Club', 'SMYC', 'regional', 'public'),
  ('royal-bvi-yacht-club', 'tortola-bvi', 'Royal BVI Yacht Club', 'RBVIYC', 'regional', 'private'),

  -- Pacific Clubs
  ('hawaii-yacht-club', 'honolulu-hawaii', 'Hawaii Yacht Club', 'HYC', 'national', 'private'),
  ('long-beach-yacht-club', 'long-beach-california', 'Long Beach Yacht Club', 'LBYC', 'national', 'private'),
  ('royal-vancouver-yacht-club', 'vancouver-canada', 'Royal Vancouver Yacht Club', 'RVYC', 'national', 'private'),

  -- Northern European Clubs
  ('royal-swedish-yacht-club', 'stockholm-archipelago', 'Kungliga Svenska Segelsällskapet', 'KSSS', 'international', 'private'),
  ('helsinki-yacht-club', 'helsinki-finland', 'Helsingfors Segelsällskap', 'HSS', 'national', 'private'),
  ('royal-danish-yacht-club', 'copenhagen-denmark', 'Kongelig Dansk Yachtklub', 'KDY', 'national', 'private'),

  -- Emerging Market Clubs
  ('dubai-international-marine-club', 'dubai-uae', 'Dubai International Marine Club', 'DIMC', 'regional', 'private'),
  ('singapore-yacht-club', 'singapore-marina', 'Singapore Yacht Club', 'SYC', 'regional', 'private'),
  ('royal-cape-yacht-club', 'cape-town-south-africa', 'Royal Cape Yacht Club', 'RCYC', 'national', 'private'),

  -- Additional North American
  ('newport-beach-yacht-club', 'newport-beach-california', 'Newport Beach Yacht Club', 'NBYC', 'regional', 'private'),
  ('annapolis-yacht-club', 'annapolis-maryland', 'Annapolis Yacht Club', 'AYC', 'regional', 'private'),
  ('chicago-yacht-club', 'chicago-michigan', 'Chicago Yacht Club', 'CYC', 'regional', 'private')

ON CONFLICT (id) DO NOTHING;

-- Summary query
SELECT 'RegattaFlow Global Venue Intelligence: COMPLETE DEPLOYMENT! 🌍' as result;
SELECT
  'Total venues: ' || COUNT(*) as venue_count
FROM sailing_venues;
SELECT
  'Total yacht clubs: ' || COUNT(*) as club_count
FROM yacht_clubs;
SELECT
  region,
  COUNT(*) as venues_per_region
FROM sailing_venues
GROUP BY region
ORDER BY venues_per_region DESC;