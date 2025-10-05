-- Swan 47 Tuning Guides Migration
-- Populates tuning_guides table with Swan 47 resources from various sources

-- First, ensure we have the Swan 47 class in boat_classes
INSERT INTO boat_classes (name, abbreviation, type, description, metadata)
VALUES (
  'Swan 47',
  'S47',
  'cruiser-racer',
  'Nautor Swan 47 - Classic S&S designed cruiser-racer from 1975. Masthead sloop rig with keel-stepped mast, two sets of unswept spreaders and aluminium spars with discontinuous stainless steel rod rigging.',
  '{"crew_size": "6-8", "designer": "Sparkman & Stephens", "year_designed": 1975, "length": "14.25m", "beam": "4.11m", "draft": "2.44m", "displacement": "14696kg", "sail_area": "95.7m2", "builder": "Nautor Swan", "production_years": "1975-1984", "boats_built": 70}'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Insert tuning guides for Swan 47
WITH swan_47_class AS (
  SELECT id FROM boat_classes WHERE name = 'Swan 47' LIMIT 1
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
  scrape_successful,
  extracted_content
)
SELECT
  swan_47_class.id,
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
  scrape_successful,
  extracted_content
FROM swan_47_class, (VALUES
  (
    'Swan 47 Rig Tuning Guide - Classic Swan Association',
    'Classic Swan Association',
    'https://www.classicswan.org/forum/post_thread.php?thread=2705',
    'https://www.classicswan.org/forum/post_thread.php?thread=2705',
    'link',
    'Forum discussion with detailed Swan 47 rig tuning instructions. Covers mast rake (30-35cm from base with 20kg on halyard), tension sequence (D2 slack, tighten V1-V2/D3, then D2, then D1), and rigging configuration (V1-V2/D3 rod rigging, D1-D1/D2 wire). Essential community knowledge for Swan 47 owners.',
    2024,
    ARRAY['rigging', 'mast-rake', 'rig-tension', 'setup', 'classic-swan'],
    true,
    true,
    true,
    'Swan 47 Rig Tuning Steps:

1. Check mast rake:
   - Attach 20kg weight to main halyard
   - Halyard should be 30-35cm from mast base
   - Ensure mast top is straight (equal distance from toe rails port/starboard)

2. Tension sequence:
   - Slack D2 completely
   - Tighten V1-V2/D3 (first by hand, then with wrench)
   - Tighten D2 (not too tight)
   - Tighten D1 aft-D1 front

3. Rigging Configuration:
   - Original setup: V1-V2/D3 Rod rigging
   - D1-D1 / D2: 1x19 or Dyform wire

4. Measurement Tip:
   - Measure rake with forestay and backstay slack
   - Adjust at mast base

Recommended: Have professional rigger perform final setup, but these guidelines work for self-checking.'
  ),
  (
    'Swan 47 S&S Specifications & Setup',
    'SailboatData.com',
    'https://sailboatdata.com/sailboat/swan-47-ss/',
    'https://sailboatdata.com/sailboat/swan-47-ss/',
    'link',
    'Complete technical specifications for Swan 47 including rig dimensions, displacement, ballast, and sail areas. Sparkman & Stephens design from 1975. Masthead sloop rig with keel-stepped mast, two sets of unswept spreaders, aluminium spars with discontinuous stainless steel rod rigging.',
    2024,
    ARRAY['specifications', 'rig-dimensions', 'technical', 'sparkman-stephens'],
    true,
    true,
    true,
    'Swan 47 (Sparkman & Stephens Design - 1975-1984)

Rig Configuration:
- Type: Masthead sloop
- Mast: Keel-stepped aluminium
- Spreaders: Two sets, unswept
- Rigging: Discontinuous stainless steel rod

Dimensions:
- LOA: 14.25m (46.75 ft)
- LWL: 11.43m (37.5 ft)
- Beam: 4.11m (13.5 ft)
- Draft: 2.44m (8 ft)

Displacement & Ballast:
- Displacement: 14,696 kg (32,400 lbs)
- Ballast: 7,031 kg (15,500 lbs) lead

Sail Areas:
- Mainsail: 47.4 m² (510 sq ft)
- Foretriangle: 48.3 m² (520 sq ft)
- Total: 95.7 m² (1,030 sq ft)
- Spinnaker: 139 m² (1,500 sq ft)

Builder: Oy Nautor AB (Finland)
Production: 1975-1984 (70 boats built)'
  ),
  (
    'Swan 45 Tuning Guide (Similar S&S Design)',
    'North Sails',
    'https://www.yumpu.com/en/document/view/43860192/swan-45-tuning-guide-sailmakerorg',
    'https://www.yumpu.com/en/document/view/43860192/swan-45-tuning-guide-sailmakerorg',
    'pdf',
    'North Sails Swan 45 tuning guide. The Swan 45 is a similar Sparkman & Stephens design from the same era (1972). Many tuning principles apply to Swan 47: rig setup, headsail trim, mainsail trim, spinnaker handling, and target speeds. Useful reference for Swan 47 owners.',
    2024,
    ARRAY['north-sails', 'similar-design', 'rig-setup', 'sail-trim', 'reference'],
    true,
    true,
    true,
    null
  ),
  (
    'Swan 42 Tuning Guide - North Sails',
    'North Sails',
    'https://www.northsails.com/en-us/blogs/north-sails-blog/swan-42-tuning-guide',
    'https://www.northsails.com/en-us/blogs/north-sails-blog/swan-42-tuning-guide',
    'link',
    'North Sails comprehensive tuning guide for Swan 42. While designed for a different Swan model, covers universal tuning principles applicable to Swan 47: mast rake, shroud tension, backstay adjustment, headsail and mainsail trim techniques.',
    2024,
    ARRAY['north-sails', 'swan-series', 'general-tuning', 'reference'],
    true,
    true,
    true,
    null
  ),
  (
    'Classic Swan Owner Resources',
    'Classic Swan Association',
    'https://www.classicswan.org/swan_47.php',
    'https://www.classicswan.org/swan_47.php',
    'link',
    'Classic Swan Association resource page for Swan 47 owners. Includes history, specifications, owner registry, and links to technical discussions. Essential community resource for classic Swan 47 sailors from the 1970s-1980s era.',
    2024,
    ARRAY['community', 'classic-swan', 'owner-resources', 'technical-support'],
    true,
    true,
    true,
    null
  )
) AS guides(title, source, source_url, file_url, file_type, description, year, tags, is_public, auto_scraped, scrape_successful, extracted_content)
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE tuning_guides IS 'Tuning guides for boat classes - now includes Swan 47 resources from Classic Swan Association and North Sails';
