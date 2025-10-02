-- Create yacht clubs for venues that have intelligence data
-- This fixes the missing clubs issue

INSERT INTO yacht_clubs (id, name, short_name, venue_id, founded, website)
VALUES
  ('rhkyc', 'Royal Hong Kong Yacht Club', 'RHKYC', 'hong-kong-victoria-harbor', 1894, 'https://www.rhkyc.org.hk'),
  ('nyyc', 'New York Yacht Club', 'NYYC', 'newport-rhode-island', 1844, 'https://www.nyyc.org'),
  ('cyca', 'Cruising Yacht Club of Australia', 'CYCA', 'sydney-harbor', 1944, 'https://www.cyca.com.au'),
  ('sfyc', 'St. Francis Yacht Club', 'StFYC', 'san-francisco-bay', 1927, 'https://www.stfyc.com'),
  ('rys', 'Royal Yacht Squadron', 'RYS', 'cowes-solent', 1815, 'https://www.rys.org.uk'),
  ('rnzys', 'Royal New Zealand Yacht Squadron', 'RNZYS', 'auckland-hauraki-gulf', 1871, 'https://www.rnzys.org.nz')
ON CONFLICT (id) DO UPDATE SET
  venue_id = EXCLUDED.venue_id,
  name = EXCLUDED.name,
  founded = EXCLUDED.founded,
  website = EXCLUDED.website;
