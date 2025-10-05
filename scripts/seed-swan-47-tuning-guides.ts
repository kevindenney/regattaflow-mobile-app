import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedSwan47TuningGuides() {
  console.log('Starting Swan 47 tuning guides seed...');

  // First, ensure we have the Swan 47 class
  const { data: existingClass, error: classError } = await supabase
    .from('boat_classes')
    .select('id, name')
    .eq('name', 'Swan 47')
    .single();

  let swan47ClassId: string;

  if (existingClass) {
    console.log(`Found existing Swan 47 class: ${existingClass.id}`);
    swan47ClassId = existingClass.id;
  } else {
    console.log('Creating Swan 47 class...');
    const { data: newClass, error: insertClassError } = await supabase
      .from('boat_classes')
      .insert({
        name: 'Swan 47',
        abbreviation: 'S47',
        type: 'cruiser-racer',
        description: 'Nautor Swan 47 - Classic S&S designed cruiser-racer from 1975. Masthead sloop rig with keel-stepped mast, two sets of unswept spreaders and aluminium spars with discontinuous stainless steel rod rigging.',
        metadata: {
          crew_size: '6-8',
          designer: 'Sparkman & Stephens',
          year_designed: 1975,
          length: '14.25m',
          beam: '4.11m',
          draft: '2.44m',
          displacement: '14696kg',
          sail_area: '95.7m2',
          builder: 'Nautor Swan',
          production_years: '1975-1984',
          boats_built: 70
        }
      })
      .select('id')
      .single();

    if (insertClassError) {
      console.error('Error creating Swan 47 class:', insertClassError);
      process.exit(1);
    }

    swan47ClassId = newClass!.id;
    console.log(`Created Swan 47 class: ${swan47ClassId}`);
  }

  // Define tuning guides
  const tuningGuides = [
    {
      class_id: swan47ClassId,
      title: 'Swan 47 Rig Tuning Guide - Classic Swan Association',
      source: 'Classic Swan Association',
      source_url: 'https://www.classicswan.org/forum/post_thread.php?thread=2705',
      file_url: 'https://www.classicswan.org/forum/post_thread.php?thread=2705',
      file_type: 'link',
      description: 'Forum discussion with detailed Swan 47 rig tuning instructions. Covers mast rake (30-35cm from base with 20kg on halyard), tension sequence (D2 slack, tighten V1-V2/D3, then D2, then D1), and rigging configuration (V1-V2/D3 rod rigging, D1-D1/D2 wire). Essential community knowledge for Swan 47 owners.',
      year: 2024,
      tags: ['rigging', 'mast-rake', 'rig-tension', 'setup', 'classic-swan'],
      is_public: true,
      auto_scraped: true,
      scrape_successful: true,
      extracted_content: `Swan 47 Rig Tuning Steps:

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

Recommended: Have professional rigger perform final setup, but these guidelines work for self-checking.`,
      extraction_status: 'completed'
    },
    {
      class_id: swan47ClassId,
      title: 'Swan 47 S&S Specifications & Setup',
      source: 'SailboatData.com',
      source_url: 'https://sailboatdata.com/sailboat/swan-47-ss/',
      file_url: 'https://sailboatdata.com/sailboat/swan-47-ss/',
      file_type: 'link',
      description: 'Complete technical specifications for Swan 47 including rig dimensions, displacement, ballast, and sail areas. Sparkman & Stephens design from 1975. Masthead sloop rig with keel-stepped mast, two sets of unswept spreaders, aluminium spars with discontinuous stainless steel rod rigging.',
      year: 2024,
      tags: ['specifications', 'rig-dimensions', 'technical', 'sparkman-stephens'],
      is_public: true,
      auto_scraped: true,
      scrape_successful: true,
      extracted_content: `Swan 47 (Sparkman & Stephens Design - 1975-1984)

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
Production: 1975-1984 (70 boats built)`,
      extraction_status: 'completed'
    },
    {
      class_id: swan47ClassId,
      title: 'Swan 45 Tuning Guide (Similar S&S Design)',
      source: 'North Sails',
      source_url: 'https://www.yumpu.com/en/document/view/43860192/swan-45-tuning-guide-sailmakerorg',
      file_url: 'https://www.yumpu.com/en/document/view/43860192/swan-45-tuning-guide-sailmakerorg',
      file_type: 'pdf',
      description: 'North Sails Swan 45 tuning guide. The Swan 45 is a similar Sparkman & Stephens design from the same era (1972). Many tuning principles apply to Swan 47: rig setup, headsail trim, mainsail trim, spinnaker handling, and target speeds. Useful reference for Swan 47 owners.',
      year: 2024,
      tags: ['north-sails', 'similar-design', 'rig-setup', 'sail-trim', 'reference'],
      is_public: true,
      auto_scraped: true,
      scrape_successful: true
    },
    {
      class_id: swan47ClassId,
      title: 'Swan 42 Tuning Guide - North Sails',
      source: 'North Sails',
      source_url: 'https://www.northsails.com/en-us/blogs/north-sails-blog/swan-42-tuning-guide',
      file_url: 'https://www.northsails.com/en-us/blogs/north-sails-blog/swan-42-tuning-guide',
      file_type: 'link',
      description: 'North Sails comprehensive tuning guide for Swan 42. While designed for a different Swan model, covers universal tuning principles applicable to Swan 47: mast rake, shroud tension, backstay adjustment, headsail and mainsail trim techniques.',
      year: 2024,
      tags: ['north-sails', 'swan-series', 'general-tuning', 'reference'],
      is_public: true,
      auto_scraped: true,
      scrape_successful: true
    },
    {
      class_id: swan47ClassId,
      title: 'Classic Swan Owner Resources',
      source: 'Classic Swan Association',
      source_url: 'https://www.classicswan.org/swan_47.php',
      file_url: 'https://www.classicswan.org/swan_47.php',
      file_type: 'link',
      description: 'Classic Swan Association resource page for Swan 47 owners. Includes history, specifications, owner registry, and links to technical discussions. Essential community resource for classic Swan 47 sailors from the 1970s-1980s era.',
      year: 2024,
      tags: ['community', 'classic-swan', 'owner-resources', 'technical-support'],
      is_public: true,
      auto_scraped: true,
      scrape_successful: true
    }
  ];

  console.log(`Inserting ${tuningGuides.length} tuning guides...`);

  // Insert tuning guides (check for duplicates manually)
  for (const guide of tuningGuides) {
    // Check if guide already exists
    const { data: existing } = await supabase
      .from('tuning_guides')
      .select('id')
      .eq('class_id', guide.class_id)
      .eq('title', guide.title)
      .single();

    if (existing) {
      console.log(`⊘ Skipping (exists): ${guide.title}`);
      continue;
    }

    // Insert new guide
    const { data, error } = await supabase
      .from('tuning_guides')
      .insert(guide)
      .select();

    if (error) {
      console.error(`✗ Error inserting "${guide.title}":`, error.message);
    } else {
      console.log(`✓ Inserted: ${guide.title}`);
    }
  }

  console.log('\nSwan 47 tuning guides seeding complete!');

  // Query and display results
  const { data: guides, error: queryError } = await supabase
    .from('tuning_guides')
    .select('id, title, source, year')
    .eq('class_id', swan47ClassId)
    .order('year', { ascending: false });

  if (queryError) {
    console.error('Error querying guides:', queryError);
  } else {
    console.log(`\nTotal Swan 47 tuning guides in database: ${guides?.length}`);
    guides?.forEach(g => {
      console.log(`  - ${g.title} (${g.source}, ${g.year})`);
    });
  }
}

seedSwan47TuningGuides()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
