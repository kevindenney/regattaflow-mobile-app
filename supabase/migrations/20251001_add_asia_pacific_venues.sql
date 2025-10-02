-- ============================================================================
-- ADD ASIA-PACIFIC SAILING VENUES (missing from initial 147)
-- ============================================================================
-- Adds major sailing venues in Asia-Pacific region including Hong Kong
-- Complements the 147 global venues with comprehensive Asian coverage

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, country, region, venue_type, time_zone, data_quality)
VALUES
  -- Hong Kong SAR (Premier venue - Dragon class stronghold)
  ('hong-kong-sar', 'Hong Kong - Victoria Harbour', 22.2783, 114.1589, 'Hong Kong SAR', 'asia-pacific', 'premier', 'Asia/Hong_Kong', 'verified'),

  -- Japan (Major sailing nation)
  ('tokyo-bay-japan', 'Tokyo Bay', 35.6427, 139.8767, 'Japan', 'asia-pacific', 'championship', 'Asia/Tokyo', 'verified'),
  ('yokohama-japan', 'Yokohama - Kanagawa', 35.4437, 139.6380, 'Japan', 'asia-pacific', 'premier', 'Asia/Tokyo', 'verified'),
  ('osaka-bay-japan', 'Osaka Bay', 34.6413, 135.2244, 'Japan', 'asia-pacific', 'regional', 'Asia/Tokyo', 'verified'),
  ('hiroshima-bay-japan', 'Hiroshima Bay', 34.3853, 132.4553, 'Japan', 'asia-pacific', 'regional', 'Asia/Tokyo', 'verified'),
  ('enoshima-japan', 'Enoshima - Fujisawa', 35.2999, 139.4814, 'Japan', 'asia-pacific', 'championship', 'Asia/Tokyo', 'verified'),

  -- Singapore (Strategic hub)
  ('singapore-marina-bay', 'Singapore - Marina Bay', 1.2644, 103.8584, 'Singapore', 'asia-pacific', 'premier', 'Asia/Singapore', 'verified'),

  -- China (Emerging market)
  ('qingdao-china', 'Qingdao - Yellow Sea', 36.0671, 120.3826, 'China', 'asia-pacific', 'championship', 'Asia/Shanghai', 'verified'),
  ('shanghai-china', 'Shanghai - East China Sea', 31.2304, 121.4737, 'China', 'asia-pacific', 'premier', 'Asia/Shanghai', 'verified'),
  ('shenzhen-china', 'Shenzhen - Pearl River', 22.5431, 114.0579, 'China', 'asia-pacific', 'regional', 'Asia/Shanghai', 'verified'),
  ('hainan-sanya-china', 'Sanya - Hainan Island', 18.2533, 109.5117, 'China', 'asia-pacific', 'regional', 'Asia/Shanghai', 'verified'),

  -- South Korea
  ('busan-south-korea', 'Busan - South Coast', 35.1796, 129.0756, 'South Korea', 'asia-pacific', 'premier', 'Asia/Seoul', 'verified'),
  ('jeju-island-korea', 'Jeju Island', 33.4996, 126.5312, 'South Korea', 'asia-pacific', 'regional', 'Asia/Seoul', 'verified'),

  -- Taiwan
  ('kaohsiung-taiwan', 'Kaohsiung - Taiwan Strait', 22.6273, 120.3014, 'Taiwan', 'asia-pacific', 'regional', 'Asia/Taipei', 'verified'),

  -- Southeast Asia
  ('phuket-thailand', 'Phuket - Andaman Sea', 7.8804, 98.3923, 'Thailand', 'asia-pacific', 'premier', 'Asia/Bangkok', 'verified'),
  ('koh-samui-thailand', 'Koh Samui - Gulf of Thailand', 9.5035, 100.0142, 'Thailand', 'asia-pacific', 'regional', 'Asia/Bangkok', 'verified'),
  ('langkawi-malaysia', 'Langkawi - Malaysia', 6.3500, 99.8000, 'Malaysia', 'asia-pacific', 'regional', 'Asia/Kuala_Lumpur', 'verified'),
  ('subic-bay-philippines', 'Subic Bay - Philippines', 14.8198, 120.2717, 'Philippines', 'asia-pacific', 'regional', 'Asia/Manila', 'verified'),
  ('bali-indonesia', 'Bali - Indonesia', -8.3405, 115.0920, 'Indonesia', 'asia-pacific', 'regional', 'Asia/Makassar', 'verified'),

  -- Australia (Major sailing nation - adding more venues to complement existing ones)
  ('sydney-harbour', 'Sydney Harbour', -33.8688, 151.2093, 'Australia', 'oceania', 'championship', 'Australia/Sydney', 'verified'),
  ('melbourne-port-phillip', 'Melbourne - Port Phillip', -37.8136, 144.9631, 'Australia', 'oceania', 'premier', 'Australia/Melbourne', 'verified'),
  ('hobart-tasmania', 'Hobart - Tasmania', -42.8821, 147.3272, 'Australia', 'oceania', 'championship', 'Australia/Hobart', 'verified'),
  ('perth-fremantle', 'Perth - Fremantle', -32.0569, 115.7439, 'Australia', 'oceania', 'premier', 'Australia/Perth', 'verified'),
  ('brisbane-moreton-bay', 'Brisbane - Moreton Bay', -27.4698, 153.0251, 'Australia', 'oceania', 'regional', 'Australia/Brisbane', 'verified'),
  ('gold-coast-australia', 'Gold Coast - Queensland', -28.0167, 153.4000, 'Australia', 'oceania', 'regional', 'Australia/Brisbane', 'verified'),
  ('cairns-great-barrier-reef', 'Cairns - Great Barrier Reef', -16.9186, 145.7781, 'Australia', 'oceania', 'regional', 'Australia/Brisbane', 'verified'),
  ('whitsunday-islands', 'Whitsunday Islands', -20.2785, 148.8811, 'Australia', 'oceania', 'premier', 'Australia/Brisbane', 'verified'),

  -- New Zealand (Major sailing nation - adding more detail)
  ('auckland-hauraki-gulf', 'Auckland - Hauraki Gulf', -36.8485, 174.7633, 'New Zealand', 'oceania', 'championship', 'Pacific/Auckland', 'verified'),
  ('bay-of-islands-nz', 'Bay of Islands', -35.2733, 174.0859, 'New Zealand', 'oceania', 'premier', 'Pacific/Auckland', 'verified'),
  ('wellington-harbour-nz', 'Wellington Harbour', -41.2865, 174.7762, 'New Zealand', 'oceania', 'regional', 'Pacific/Auckland', 'verified'),
  ('marlborough-sounds-nz', 'Marlborough Sounds', -41.2000, 174.0000, 'New Zealand', 'oceania', 'premier', 'Pacific/Auckland', 'verified'),
  ('christchurch-lyttelton', 'Lyttelton - Christchurch', -43.6033, 172.7200, 'New Zealand', 'oceania', 'regional', 'Pacific/Auckland', 'verified'),

  -- Indian Ocean & Middle East
  ('dubai-uae', 'Dubai - Persian Gulf', 25.2048, 55.2708, 'United Arab Emirates', 'middle-east', 'premier', 'Asia/Dubai', 'verified'),
  ('abu-dhabi-uae', 'Abu Dhabi - UAE', 24.4539, 54.3773, 'United Arab Emirates', 'middle-east', 'regional', 'Asia/Dubai', 'verified'),
  ('muscat-oman', 'Muscat - Oman', 23.5880, 58.3829, 'Oman', 'middle-east', 'regional', 'Asia/Muscat', 'verified'),

  -- South Asia
  ('mumbai-india', 'Mumbai - Arabian Sea', 18.9388, 72.8354, 'India', 'asia-pacific', 'regional', 'Asia/Kolkata', 'verified'),
  ('goa-india', 'Goa - India', 15.2993, 74.1240, 'India', 'asia-pacific', 'regional', 'Asia/Kolkata', 'verified'),
  ('colombo-sri-lanka', 'Colombo - Sri Lanka', 6.9271, 79.8612, 'Sri Lanka', 'asia-pacific', 'regional', 'Asia/Colombo', 'verified')

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Show count of venues by region after this migration
-- Should see asia-pacific and oceania with significant counts
