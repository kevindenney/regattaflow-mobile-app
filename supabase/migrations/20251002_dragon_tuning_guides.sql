-- Dragon Sailboat Tuning Guides Migration
-- Populates tuning_guides table with Dragon class tuning guides from major manufacturers

-- First, ensure we have the Dragon class in boat_classes
-- If it doesn't exist, create it
INSERT INTO boat_classes (name, abbreviation, type, description, metadata)
VALUES (
  'Dragon',
  'DRA',
  'keelboat',
  'International Dragon Class - Classic 29-foot Olympic keelboat designed by Johan Anker in 1929',
  '{"crew_size": 3, "designer": "Johan Anker", "year_designed": 1929, "length": "8.9m", "beam": "1.95m", "draft": "1.2m", "displacement": "1700kg", "sail_area": "27.7m2"}'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Insert tuning guides for Dragon class
WITH dragon_class AS (
  SELECT id FROM boat_classes WHERE name = 'Dragon' LIMIT 1
)
INSERT INTO tuning_guides (
  class_id,
  title,
  source,
  source_url,
  file_url,
  file_type,
  description,
  year,
  tags,
  is_public,
  auto_scraped,
  scrape_successful
)
SELECT
  dragon_class.id,
  title,
  source,
  source_url,
  file_url,
  file_type,
  description,
  year,
  tags,
  is_public,
  auto_scraped,
  scrape_successful
FROM dragon_class, (VALUES
  (
    'North Sails Dragon Tuning Guide',
    'North Sails',
    'https://www.northsails.com/sailing/en/resources/dragon-tuning-guide',
    'https://www.vanerp.nl/file/repository/Dragon_Tuning_Guide_EN_08_2017_North_Sails.pdf',
    'pdf',
    'Comprehensive Dragon tuning guide compiled by Jørgen Schönherr, Poul Richard Høj Jensen and Theis Palm. Covers rig setup, shroud tensions, sail trim, and performance optimization for North Sails Dragon sails.',
    2017,
    ARRAY['rigging', 'sail-trim', 'rig-tension', 'all-conditions', 'north-sails'],
    true,
    true,
    true
  ),
  (
    'North Sails Dragon Tuning Guide (2012)',
    'North Sails',
    'https://www.northsails.com/sailing/en/resources/dragon-tuning-guide',
    'https://petticrows.com/wp-content/uploads/2020/10/N.Sails-Dragon-tuning-guide2012.pdf',
    'pdf',
    'North Sails Dragon tuning guide from 2012, hosted by Petticrows. Includes detailed rig settings and sail trim recommendations.',
    2012,
    ARRAY['rigging', 'sail-trim', 'rig-tension', 'north-sails'],
    true,
    true,
    true
  ),
  (
    'North Sails Dragon Speed Guide',
    'North Sails',
    'https://www.northsails.com/en-us/blogs/north-sails-blog/dragon-speed-guide',
    'https://www.northsails.com/en-us/blogs/north-sails-blog/dragon-speed-guide',
    'link',
    'North Sails Dragon Speed Guide covering boat speed optimization, sail trim techniques, tactical tips, rig tuning, and performance tips for different wind and sea conditions.',
    2024,
    ARRAY['speed', 'sail-trim', 'tactics', 'performance', 'north-sails'],
    true,
    true,
    true
  ),
  (
    'Fritz Dragon Tuning Manual',
    'Fritz Sails',
    'https://www.fritz-segel.com/service/pdf2/trimm/dragontuning_engl.pdf',
    'https://www.ussailing.org/wp-content/uploads/2020/07/Fritz-Dragon-Tuning-V04-1.pdf',
    'pdf',
    'Comprehensive Dragon tuning manual by Vincent Hoesch and Werner Fritz. 30-page guide covering Dragon experiences, rig setup, sail trim, and tuning for all conditions. One of the most detailed Dragon tuning resources available.',
    2020,
    ARRAY['rigging', 'sail-trim', 'rig-tension', 'all-conditions', 'fritz-sails', 'comprehensive'],
    true,
    true,
    true
  ),
  (
    'Fritz Dragon Tuning Manual (Fritz Segel)',
    'Fritz Sails',
    'https://www.fritz-segel.com/',
    'https://www.fritz-segel.com/service/pdf2/trimm/dragontuning_engl.pdf',
    'pdf',
    'Fritz Dragon Tuning Manual hosted on Fritz Segel official website. Detailed tuning guide for Fritz Dragon sails.',
    2024,
    ARRAY['rigging', 'sail-trim', 'fritz-sails'],
    true,
    true,
    true
  ),
  (
    'Petticrows Dragon Setup Guide',
    'Petticrows',
    'https://petticrows.com/setting-up-your-dragon/',
    'https://petticrows.com/setting-up-your-dragon/',
    'link',
    'Basic Dragon setup instructions from Petticrows, the premier Dragon builder. Covers jumper tension (8 on Loos gauge), forestay positioning (81cm mark, 121cm average rake), shroud positioning (upper: 82cm, lower: 85cm from station 4), mast ram and prebend (0-10mm), and runner tension (max 32 on forestay gauge). Essential baseline setup guide.',
    2024,
    ARRAY['rigging', 'setup', 'baseline', 'measurements', 'petticrows'],
    true,
    true,
    true
  ),
  (
    'Seldén Dragon Rigging Guide',
    'Seldén Mast',
    'https://support.seldenmast.com/',
    'https://support.seldenmast.com/files/595-540-E.pdf',
    'pdf',
    'Seldén mast rigging and tuning guide. Covers forestay setup, shroud tensioning (15% of breaking strength for upper shrouds, 5-10% general tension), and general rigging principles for Seldén masts on Dragons.',
    2024,
    ARRAY['rigging', 'mast', 'selden', 'shroud-tension'],
    true,
    true,
    true
  ),
  (
    'International Dragon Class Official Rules',
    'International Dragon Association',
    'https://internationaldragonsailing.net/',
    'https://www.sailing.org/tools/documents/DRA2021CR201221-%5B26851%5D.pdf',
    'pdf',
    'Official International Dragon Class Rules from World Sailing. Essential reference for class-legal rig setup, measurements, and equipment specifications.',
    2021,
    ARRAY['class-rules', 'official', 'measurements', 'specifications'],
    true,
    true,
    true
  )
) AS guides(title, source, source_url, file_url, file_type, description, year, tags, is_public, auto_scraped, scrape_successful)
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE tuning_guides IS 'Tuning guides for boat classes - now populated with Dragon class guides from major manufacturers';
