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

async function seedDragonTuningGuides() {
  console.log('Starting Dragon tuning guides seed...');

  // First, ensure we have the Dragon class
  const { data: existingClass, error: classError } = await supabase
    .from('boat_classes')
    .select('id, name')
    .eq('name', 'Dragon')
    .single();

  let dragonClassId: string;

  if (existingClass) {
    console.log(`Found existing Dragon class: ${existingClass.id}`);
    dragonClassId = existingClass.id;
  } else {
    console.log('Creating Dragon class...');
    const { data: newClass, error: insertClassError } = await supabase
      .from('boat_classes')
      .insert({
        name: 'Dragon',
        abbreviation: 'DRA',
        type: 'keelboat',
        description: 'International Dragon Class - Classic 29-foot Olympic keelboat designed by Johan Anker in 1929',
        metadata: {
          crew_size: 3,
          designer: 'Johan Anker',
          year_designed: 1929,
          length: '8.9m',
          beam: '1.95m',
          draft: '1.2m',
          displacement: '1700kg',
          sail_area: '27.7m2'
        }
      })
      .select('id')
      .single();

    if (insertClassError) {
      console.error('Error creating Dragon class:', insertClassError);
      process.exit(1);
    }

    dragonClassId = newClass!.id;
    console.log(`Created Dragon class: ${dragonClassId}`);
  }

  // Define tuning guides
  const tuningGuides = [
    {
      class_id: dragonClassId,
      title: 'North Sails Dragon Tuning Guide',
      source: 'North Sails',
      source_url: 'https://www.northsails.com/sailing/en/resources/dragon-tuning-guide',
      file_url: 'https://www.vanerp.nl/file/repository/Dragon_Tuning_Guide_EN_08_2017_North_Sails.pdf',
      file_type: 'pdf',
      description: 'Comprehensive Dragon tuning guide compiled by Jørgen Schönherr, Poul Richard Høj Jensen and Theis Palm. Covers rig setup, shroud tensions, sail trim, and performance optimization for North Sails Dragon sails.',
      year: 2017,
      tags: ['rigging', 'sail-trim', 'rig-tension', 'all-conditions', 'north-sails'],
      is_public: true,
      auto_scraped: true,
      scrape_successful: true
    },
    {
      class_id: dragonClassId,
      title: 'North Sails Dragon Tuning Guide (2012)',
      source: 'North Sails',
      source_url: 'https://www.northsails.com/sailing/en/resources/dragon-tuning-guide',
      file_url: 'https://petticrows.com/wp-content/uploads/2020/10/N.Sails-Dragon-tuning-guide2012.pdf',
      file_type: 'pdf',
      description: 'North Sails Dragon tuning guide from 2012, hosted by Petticrows. Includes detailed rig settings and sail trim recommendations.',
      year: 2012,
      tags: ['rigging', 'sail-trim', 'rig-tension', 'north-sails'],
      is_public: true,
      auto_scraped: true,
      scrape_successful: true
    },
    {
      class_id: dragonClassId,
      title: 'North Sails Dragon Speed Guide',
      source: 'North Sails',
      source_url: 'https://www.northsails.com/en-us/blogs/north-sails-blog/dragon-speed-guide',
      file_url: 'https://www.northsails.com/en-us/blogs/north-sails-blog/dragon-speed-guide',
      file_type: 'link',
      description: 'North Sails Dragon Speed Guide covering boat speed optimization, sail trim techniques, tactical tips, rig tuning, and performance tips for different wind and sea conditions.',
      year: 2024,
      tags: ['speed', 'sail-trim', 'tactics', 'performance', 'north-sails'],
      is_public: true,
      auto_scraped: true,
      scrape_successful: true
    },
    {
      class_id: dragonClassId,
      title: 'Fritz Dragon Tuning Manual',
      source: 'Fritz Sails',
      source_url: 'https://www.fritz-segel.com/service/pdf2/trimm/dragontuning_engl.pdf',
      file_url: 'https://www.ussailing.org/wp-content/uploads/2020/07/Fritz-Dragon-Tuning-V04-1.pdf',
      file_type: 'pdf',
      description: 'Comprehensive Dragon tuning manual by Vincent Hoesch and Werner Fritz. 30-page guide covering Dragon experiences, rig setup, sail trim, and tuning for all conditions. One of the most detailed Dragon tuning resources available.',
      year: 2020,
      tags: ['rigging', 'sail-trim', 'rig-tension', 'all-conditions', 'fritz-sails', 'comprehensive'],
      is_public: true,
      auto_scraped: true,
      scrape_successful: true
    },
    {
      class_id: dragonClassId,
      title: 'Fritz Dragon Tuning Manual (Fritz Segel)',
      source: 'Fritz Sails',
      source_url: 'https://www.fritz-segel.com/',
      file_url: 'https://www.fritz-segel.com/service/pdf2/trimm/dragontuning_engl.pdf',
      file_type: 'pdf',
      description: 'Fritz Dragon Tuning Manual hosted on Fritz Segel official website. Detailed tuning guide for Fritz Dragon sails.',
      year: 2024,
      tags: ['rigging', 'sail-trim', 'fritz-sails'],
      is_public: true,
      auto_scraped: true,
      scrape_successful: true
    },
    {
      class_id: dragonClassId,
      title: 'Petticrows Dragon Setup Guide',
      source: 'Petticrows',
      source_url: 'https://petticrows.com/setting-up-your-dragon/',
      file_url: 'https://petticrows.com/setting-up-your-dragon/',
      file_type: 'link',
      description: 'Basic Dragon setup instructions from Petticrows, the premier Dragon builder. Covers jumper tension (8 on Loos gauge), forestay positioning (81cm mark, 121cm average rake), shroud positioning (upper: 82cm, lower: 85cm from station 4), mast ram and prebend (0-10mm), and runner tension (max 32 on forestay gauge). Essential baseline setup guide.',
      year: 2024,
      tags: ['rigging', 'setup', 'baseline', 'measurements', 'petticrows'],
      is_public: true,
      auto_scraped: true,
      scrape_successful: true
    },
    {
      class_id: dragonClassId,
      title: 'Seldén Dragon Rigging Guide',
      source: 'Seldén Mast',
      source_url: 'https://support.seldenmast.com/',
      file_url: 'https://support.seldenmast.com/files/595-540-E.pdf',
      file_type: 'pdf',
      description: 'Seldén mast rigging and tuning guide. Covers forestay setup, shroud tensioning (15% of breaking strength for upper shrouds, 5-10% general tension), and general rigging principles for Seldén masts on Dragons.',
      year: 2024,
      tags: ['rigging', 'mast', 'selden', 'shroud-tension'],
      is_public: true,
      auto_scraped: true,
      scrape_successful: true
    },
    {
      class_id: dragonClassId,
      title: 'International Dragon Class Official Rules',
      source: 'International Dragon Association',
      source_url: 'https://internationaldragonsailing.net/',
      file_url: 'https://www.sailing.org/tools/documents/DRA2021CR201221-%5B26851%5D.pdf',
      file_type: 'pdf',
      description: 'Official International Dragon Class Rules from World Sailing. Essential reference for class-legal rig setup, measurements, and equipment specifications.',
      year: 2021,
      tags: ['class-rules', 'official', 'measurements', 'specifications'],
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

  console.log('\nDragon tuning guides seeding complete!');

  // Query and display results
  const { data: guides, error: queryError } = await supabase
    .from('tuning_guides')
    .select('id, title, source, year')
    .eq('class_id', dragonClassId)
    .order('year', { ascending: false });

  if (queryError) {
    console.error('Error querying guides:', queryError);
  } else {
    console.log(`\nTotal Dragon tuning guides in database: ${guides?.length}`);
    guides?.forEach(g => {
      console.log(`  - ${g.title} (${g.source}, ${g.year})`);
    });
  }
}

seedDragonTuningGuides()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
