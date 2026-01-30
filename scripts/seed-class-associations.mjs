#!/usr/bin/env node
/**
 * Seed Class Associations and Boat Classes
 *
 * Imports class data from international sailing class associations:
 * - International Dragon Association (IDA)
 * - International Etchells Class Association (IECA)
 * - Other major one-design and Olympic classes
 *
 * Run: node scripts/seed-class-associations.mjs
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================================
// BOAT CLASSES DATA
// ============================================================================

const BOAT_CLASSES = [
  // === KEELBOATS ===
  {
    name: 'Dragon',
    type: 'keelboat',
    crew_size: 3,
    description: 'Classic one-design keelboat with a rich Olympic and championship history. Known for tactical racing and strong international fleet.',
    specifications: {
      loa: 8.9,
      lwl: 5.66,
      beam: 1.93,
      draft: 1.2,
      displacement: 1700,
      sail_area: 27.7,
      spinnaker_area: 23.7,
      designer: 'Johan Anker',
      year_designed: 1929,
    },
    class_rules_url: 'https://intdragon.net/class-rules',
    website: 'https://intdragon.net',
    international_association: 'International Dragon Association',
    olympic_class: true,
    olympic_years: '1948-1972',
    world_sailing_recognized: true,
    active_fleets_worldwide: 150,
    estimated_boats_worldwide: 1500,
  },
  {
    name: 'Etchells',
    type: 'keelboat',
    crew_size: 3,
    description: 'High-performance one-design keelboat designed by Skip Etchells. Known for competitive racing and strong class management.',
    specifications: {
      loa: 9.3,
      lwl: 7.1,
      beam: 2.13,
      draft: 1.37,
      displacement: 1500,
      sail_area: 27.0,
      spinnaker_area: 39.0,
      designer: 'E.W. "Skip" Etchells',
      year_designed: 1966,
    },
    class_rules_url: 'https://etchells.org/class-rules',
    website: 'https://etchells.org',
    international_association: 'International Etchells Class Association',
    world_sailing_recognized: true,
    active_fleets_worldwide: 85,
    estimated_boats_worldwide: 1500,
  },
  {
    name: 'J/70',
    type: 'keelboat',
    crew_size: 4,
    description: 'Modern one-design sportboat with asymmetric spinnaker. Fast-growing international fleet.',
    specifications: {
      loa: 6.93,
      lwl: 6.32,
      beam: 2.25,
      draft: 1.35,
      displacement: 794,
      sail_area: 18.3,
      spinnaker_area: 38.0,
      designer: 'J/Boats',
      year_designed: 2012,
    },
    class_rules_url: 'https://j70class.com/rules',
    website: 'https://j70class.com',
    international_association: 'International J/70 Class Association',
    world_sailing_recognized: true,
    active_fleets_worldwide: 200,
    estimated_boats_worldwide: 1800,
  },
  {
    name: 'Melges 24',
    type: 'keelboat',
    crew_size: 5,
    description: 'Sport boat designed for exciting tactical racing. Strong international circuit.',
    specifications: {
      loa: 7.32,
      lwl: 6.71,
      beam: 2.49,
      draft: 1.52,
      displacement: 885,
      sail_area: 23.3,
      spinnaker_area: 55.7,
      designer: 'Reichel/Pugh',
      year_designed: 1992,
    },
    website: 'https://melges24.com',
    international_association: 'International Melges 24 Class Association',
    world_sailing_recognized: true,
    active_fleets_worldwide: 70,
    estimated_boats_worldwide: 850,
  },
  {
    name: 'Star',
    type: 'keelboat',
    crew_size: 2,
    description: 'Classic two-person keelboat with long Olympic history. Demands precise sailing technique.',
    specifications: {
      loa: 6.92,
      lwl: 4.72,
      beam: 1.73,
      draft: 1.02,
      displacement: 671,
      sail_area: 26.5,
      designer: 'Francis Sweisguth',
      year_designed: 1911,
    },
    website: 'https://starclass.org',
    international_association: 'International Star Class Yacht Racing Association',
    olympic_class: true,
    olympic_years: '1932-2012',
    world_sailing_recognized: true,
    active_fleets_worldwide: 100,
    estimated_boats_worldwide: 8000,
  },

  // === OLYMPIC DINGHIES ===
  {
    name: 'ILCA 7 (Laser)',
    type: 'dinghy',
    crew_size: 1,
    description: 'Olympic single-handed dinghy. The world\'s most popular racing dinghy.',
    specifications: {
      loa: 4.23,
      beam: 1.42,
      sail_area: 7.06,
      weight: 59,
      designer: 'Bruce Kirby',
      year_designed: 1970,
    },
    website: 'https://laser.org',
    international_association: 'International Laser Class Association',
    olympic_class: true,
    olympic_years: '1996-present',
    world_sailing_recognized: true,
    active_fleets_worldwide: 500,
    estimated_boats_worldwide: 200000,
  },
  {
    name: 'ILCA 6 (Laser Radial)',
    type: 'dinghy',
    crew_size: 1,
    description: 'Olympic single-handed dinghy for lighter sailors. Same hull as ILCA 7 with smaller rig.',
    specifications: {
      loa: 4.23,
      beam: 1.42,
      sail_area: 5.76,
      weight: 59,
      designer: 'Bruce Kirby',
      year_designed: 1970,
    },
    website: 'https://laser.org',
    international_association: 'International Laser Class Association',
    olympic_class: true,
    olympic_years: '2008-present',
    world_sailing_recognized: true,
  },
  {
    name: '470',
    type: 'dinghy',
    crew_size: 2,
    description: 'Olympic two-person dinghy requiring excellent teamwork and tactical skills.',
    specifications: {
      loa: 4.7,
      beam: 1.69,
      sail_area: 12.7,
      spinnaker_area: 13.0,
      weight: 120,
      designer: 'André Cornu',
      year_designed: 1963,
    },
    website: 'https://470.org',
    international_association: 'International 470 Class Association',
    olympic_class: true,
    olympic_years: '1976-present',
    world_sailing_recognized: true,
    active_fleets_worldwide: 200,
    estimated_boats_worldwide: 50000,
  },
  {
    name: '49er',
    type: 'skiff',
    crew_size: 2,
    description: 'High-performance Olympic skiff. Exciting, athletic sailing requiring skilled crew work.',
    specifications: {
      loa: 4.995,
      beam: 2.9,
      sail_area: 21.2,
      spinnaker_area: 38.0,
      weight: 94,
      designer: 'Julian Bethwaite',
      year_designed: 1995,
    },
    website: 'https://49er.org',
    international_association: 'International 49er Class Association',
    olympic_class: true,
    olympic_years: '2000-present',
    world_sailing_recognized: true,
    active_fleets_worldwide: 80,
    estimated_boats_worldwide: 4500,
  },
  {
    name: '49erFX',
    type: 'skiff',
    crew_size: 2,
    description: 'Women\'s Olympic skiff version of the 49er with smaller rig.',
    specifications: {
      loa: 4.995,
      beam: 2.9,
      sail_area: 16.0,
      spinnaker_area: 28.0,
      weight: 93,
      designer: 'Julian Bethwaite',
      year_designed: 2012,
    },
    website: 'https://49er.org',
    international_association: 'International 49er Class Association',
    olympic_class: true,
    olympic_years: '2016-present',
    world_sailing_recognized: true,
  },
  {
    name: 'Finn',
    type: 'dinghy',
    crew_size: 1,
    description: 'Classic Olympic single-handed dinghy for heavier sailors. Physically demanding.',
    specifications: {
      loa: 4.5,
      beam: 1.51,
      sail_area: 10.6,
      weight: 107,
      designer: 'Rickard Sarby',
      year_designed: 1949,
    },
    website: 'https://finnclass.org',
    international_association: 'International Finn Association',
    olympic_class: true,
    olympic_years: '1952-2020',
    world_sailing_recognized: true,
    active_fleets_worldwide: 120,
    estimated_boats_worldwide: 4500,
  },
  {
    name: 'Nacra 17',
    type: 'multihull',
    crew_size: 2,
    description: 'Olympic mixed multihull with foiling capability.',
    specifications: {
      loa: 5.25,
      beam: 2.59,
      sail_area: 16.1,
      spinnaker_area: 17.6,
      weight: 163,
      designer: 'Nacra Sailing',
      year_designed: 2011,
    },
    website: 'https://nacra17.org',
    international_association: 'Nacra 17 Class Association',
    olympic_class: true,
    olympic_years: '2016-present',
    world_sailing_recognized: true,
    active_fleets_worldwide: 50,
    estimated_boats_worldwide: 500,
  },
  {
    name: 'iQFOiL',
    type: 'windsurfer',
    crew_size: 1,
    description: 'Olympic foiling windsurfer class.',
    specifications: {
      board_length: 2.2,
      sail_area: 9.0,
      weight: 25,
      designer: 'Starboard',
      year_designed: 2019,
    },
    website: 'https://iqfoilclass.org',
    international_association: 'iQFOiL International Class Association',
    olympic_class: true,
    olympic_years: '2024-present',
    world_sailing_recognized: true,
  },
  {
    name: 'Formula Kite',
    type: 'kite',
    crew_size: 1,
    description: 'Olympic kitefoiling class for Paris 2024.',
    specifications: {
      board_length: 1.35,
      kite_sizes: '9-21 sqm',
      designer: 'Various',
    },
    website: 'https://formulakite.org',
    international_association: 'Formula Kite Class',
    olympic_class: true,
    olympic_years: '2024-present',
    world_sailing_recognized: true,
  },

  // === YOUTH CLASSES ===
  {
    name: 'Optimist',
    type: 'dinghy',
    crew_size: 1,
    description: 'The world\'s largest youth sailing class. Gateway to competitive sailing for children.',
    specifications: {
      loa: 2.31,
      beam: 1.13,
      sail_area: 3.5,
      weight: 35,
      designer: 'Clark Mills',
      year_designed: 1947,
    },
    website: 'https://optiworld.org',
    international_association: 'International Optimist Dinghy Association',
    world_sailing_recognized: true,
    active_fleets_worldwide: 1000,
    estimated_boats_worldwide: 150000,
    age_range: '8-15',
  },
  {
    name: '29er',
    type: 'skiff',
    crew_size: 2,
    description: 'Youth skiff providing pathway to 49er. Fast and exciting racing.',
    specifications: {
      loa: 4.45,
      beam: 1.77,
      sail_area: 12.5,
      spinnaker_area: 14.5,
      weight: 65,
      designer: 'Julian Bethwaite',
      year_designed: 1998,
    },
    website: 'https://29er.org',
    international_association: 'International 29er Class Association',
    world_sailing_recognized: true,
    age_range: '14-18',
  },
  {
    name: 'RS Feva',
    type: 'dinghy',
    crew_size: 2,
    description: 'Popular youth double-handed dinghy with asymmetric spinnaker.',
    specifications: {
      loa: 3.64,
      beam: 1.42,
      sail_area: 7.87,
      spinnaker_area: 6.5,
      weight: 63,
      designer: 'Paul Handley',
      year_designed: 2002,
    },
    website: 'https://www.rssailing.com/project/rs-feva/',
    world_sailing_recognized: true,
    age_range: '12-18',
  },

  // === OTHER POPULAR CLASSES ===
  {
    name: 'J/22',
    type: 'keelboat',
    crew_size: 3,
    description: 'One-design keelboat popular for club racing and collegiate sailing.',
    specifications: {
      loa: 6.86,
      lwl: 5.89,
      beam: 2.44,
      draft: 1.22,
      displacement: 795,
      sail_area: 21.8,
      spinnaker_area: 31.6,
      designer: 'Rod Johnstone',
      year_designed: 1983,
    },
    website: 'https://j22.org',
    international_association: 'J/22 Class Association',
    world_sailing_recognized: true,
    active_fleets_worldwide: 75,
    estimated_boats_worldwide: 1600,
  },
  {
    name: 'J/24',
    type: 'keelboat',
    crew_size: 5,
    description: 'One of the most popular one-design keelboats worldwide.',
    specifications: {
      loa: 7.32,
      lwl: 6.1,
      beam: 2.72,
      draft: 1.22,
      displacement: 1406,
      sail_area: 23.1,
      spinnaker_area: 40.9,
      designer: 'Rod Johnstone',
      year_designed: 1977,
    },
    website: 'https://j24class.org',
    international_association: 'International J/24 Class Association',
    world_sailing_recognized: true,
    active_fleets_worldwide: 150,
    estimated_boats_worldwide: 5300,
  },
  {
    name: 'Snipe',
    type: 'dinghy',
    crew_size: 2,
    description: 'Classic two-person racing dinghy with strong international following.',
    specifications: {
      loa: 4.72,
      beam: 1.52,
      sail_area: 11.43,
      weight: 172,
      designer: 'William Crosby',
      year_designed: 1931,
    },
    website: 'https://snipe.org',
    international_association: 'Snipe Class International Racing Association',
    world_sailing_recognized: true,
    active_fleets_worldwide: 200,
    estimated_boats_worldwide: 30000,
  },
  {
    name: 'Lightning',
    type: 'dinghy',
    crew_size: 3,
    description: 'Classic three-person centerboard dinghy with active racing worldwide.',
    specifications: {
      loa: 5.79,
      beam: 1.98,
      sail_area: 16.54,
      spinnaker_area: 26.9,
      weight: 318,
      designer: 'Sparkman & Stephens',
      year_designed: 1938,
    },
    website: 'https://lightningclass.org',
    international_association: 'International Lightning Class Association',
    world_sailing_recognized: true,
    active_fleets_worldwide: 100,
    estimated_boats_worldwide: 15000,
  },
  {
    name: 'Hobie 16',
    type: 'multihull',
    crew_size: 2,
    description: 'The world\'s most popular catamaran. Beach-launched and exciting.',
    specifications: {
      loa: 5.11,
      beam: 2.41,
      sail_area: 16.26,
      weight: 145,
      designer: 'Hobie Alter',
      year_designed: 1969,
    },
    website: 'https://www.hobieclassassociation.com',
    international_association: 'Hobie Class Association',
    world_sailing_recognized: true,
    active_fleets_worldwide: 200,
    estimated_boats_worldwide: 100000,
  },
];

// ============================================================================
// CLASS ASSOCIATIONS DATA
// ============================================================================

const CLASS_ASSOCIATIONS = [
  {
    name: 'International Dragon Association',
    short_name: 'IDA',
    description: 'The governing body for the Dragon class worldwide. Manages class rules, international championships, and fleet development.',
    website: 'https://intdragon.net',
    region: 'International',
    class_name: 'Dragon',
    founded_year: 1929,
    headquarters: 'Europe',
    racing_rules_url: 'https://intdragon.net/class-rules',
    world_championship_info: 'Annual Gold Cup and World Championship',
  },
  {
    name: 'International Etchells Class Association',
    short_name: 'IECA',
    description: 'The worldwide governing body for the Etchells class. Organizes World Championship and supports fleet growth.',
    website: 'https://etchells.org',
    region: 'International',
    class_name: 'Etchells',
    founded_year: 1967,
    headquarters: 'USA',
    racing_rules_url: 'https://etchells.org/class-rules',
    world_championship_info: 'Annual World Championship rotates between fleets',
  },
  {
    name: 'International J/70 Class Association',
    short_name: 'IJ70CA',
    description: 'Global one-design class association for the J/70 sportboat.',
    website: 'https://j70class.com',
    region: 'International',
    class_name: 'J/70',
    founded_year: 2012,
    headquarters: 'USA',
    racing_rules_url: 'https://j70class.com/rules',
  },
  {
    name: 'International Laser Class Association',
    short_name: 'ILCA',
    description: 'Governing body for the world\'s largest one-design sailing class.',
    website: 'https://laser.org',
    region: 'International',
    class_name: 'ILCA 7 (Laser)',
    founded_year: 1974,
    headquarters: 'UK',
    racing_rules_url: 'https://laser.org/class-rules',
  },
  {
    name: 'International Optimist Dinghy Association',
    short_name: 'IODA',
    description: 'Governing body for the world\'s largest youth sailing class.',
    website: 'https://optiworld.org',
    region: 'International',
    class_name: 'Optimist',
    founded_year: 1965,
    headquarters: 'Italy',
    racing_rules_url: 'https://optiworld.org/rules',
  },
  {
    name: 'International 470 Class Association',
    short_name: 'I470CA',
    description: 'Governing body for the Olympic 470 dinghy class.',
    website: 'https://470.org',
    region: 'International',
    class_name: '470',
    founded_year: 1969,
    headquarters: 'UK',
    racing_rules_url: 'https://470.org/class-rules',
  },
  {
    name: 'International 49er Class Association',
    short_name: 'I49CA',
    description: 'Governing body for the Olympic 49er and 49erFX skiff classes.',
    website: 'https://49er.org',
    region: 'International',
    class_name: '49er',
    founded_year: 1996,
    headquarters: 'Australia',
    racing_rules_url: 'https://49er.org/class-rules',
  },
  {
    name: 'International Star Class',
    short_name: 'ISCYRA',
    description: 'One of the oldest one-design keelboat classes, with a rich Olympic history.',
    website: 'https://starclass.org',
    region: 'International',
    class_name: 'Star',
    founded_year: 1922,
    headquarters: 'USA',
    racing_rules_url: 'https://starclass.org/rules',
  },
  {
    name: 'International Melges 24 Class Association',
    short_name: 'IM24CA',
    description: 'Governing body for the Melges 24 sportboat.',
    website: 'https://melges24.com',
    region: 'International',
    class_name: 'Melges 24',
    founded_year: 1993,
    headquarters: 'USA',
  },
  {
    name: 'International Finn Association',
    short_name: 'IFA',
    description: 'Governing body for the Finn dinghy, former Olympic class.',
    website: 'https://finnclass.org',
    region: 'International',
    class_name: 'Finn',
    founded_year: 1956,
    headquarters: 'Denmark',
    racing_rules_url: 'https://finnclass.org/rules',
  },
];

// ============================================================================
// MAIN SEEDING FUNCTIONS
// ============================================================================

async function seedBoatClasses() {
  console.log('\n⛵ Seeding Boat Classes...\n');

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const boatClass of BOAT_CLASSES) {
    try {
      // Check if class exists
      const { data: existing } = await supabase
        .from('boat_classes')
        .select('id, name')
        .ilike('name', boatClass.name)
        .maybeSingle();

      if (existing) {
        // Update existing class
        const { error: updateError } = await supabase
          .from('boat_classes')
          .update({
            type: boatClass.type,
            crew_size: boatClass.crew_size,
            description: boatClass.description,
            specifications: boatClass.specifications,
            class_rules_url: boatClass.class_rules_url,
            website: boatClass.website,
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`❌ Error updating ${boatClass.name}:`, updateError.message);
          errors++;
        } else {
          console.log(`🔄 Updated: ${boatClass.name}`);
          updated++;
        }
      } else {
        // Insert new class
        const { error: insertError } = await supabase
          .from('boat_classes')
          .insert({
            name: boatClass.name,
            type: boatClass.type,
            crew_size: boatClass.crew_size,
            description: boatClass.description,
            specifications: boatClass.specifications,
            class_rules_url: boatClass.class_rules_url,
            website: boatClass.website,
          });

        if (insertError) {
          console.error(`❌ Error inserting ${boatClass.name}:`, insertError.message);
          errors++;
        } else {
          console.log(`✅ Inserted: ${boatClass.name}`);
          inserted++;
        }
      }
    } catch (err) {
      console.error(`❌ Exception for ${boatClass.name}:`, err.message);
      errors++;
    }
  }

  console.log('\n' + '-'.repeat(40));
  console.log('Boat Classes Summary:');
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   🔄 Updated:  ${updated}`);
  console.log(`   ❌ Errors:   ${errors}`);
}

async function seedClassAssociations() {
  console.log('\n🏛️ Seeding Class Associations...\n');

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const assoc of CLASS_ASSOCIATIONS) {
    try {
      // Get the boat class ID
      const { data: boatClass } = await supabase
        .from('boat_classes')
        .select('id')
        .ilike('name', assoc.class_name)
        .maybeSingle();

      // Check if association exists
      const { data: existing } = await supabase
        .from('class_associations')
        .select('id')
        .ilike('name', assoc.name)
        .maybeSingle();

      if (existing) {
        console.log(`⏭️  Skipped (exists): ${assoc.name}`);
        skipped++;
        continue;
      }

      // Insert association
      const { error } = await supabase
        .from('class_associations')
        .insert({
          name: assoc.name,
          class_id: boatClass?.id,
          website: assoc.website,
          racing_rules_url: assoc.racing_rules_url,
          region: assoc.region,
        });

      if (error) {
        console.error(`❌ Error inserting ${assoc.name}:`, error.message);
        errors++;
      } else {
        console.log(`✅ Inserted: ${assoc.name}`);
        inserted++;
      }
    } catch (err) {
      console.error(`❌ Exception for ${assoc.name}:`, err.message);
      errors++;
    }
  }

  console.log('\n' + '-'.repeat(40));
  console.log('Class Associations Summary:');
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ⏭️  Skipped:  ${skipped}`);
  console.log(`   ❌ Errors:   ${errors}`);
}

// ============================================================================
// RUN
// ============================================================================

async function main() {
  console.log('=' .repeat(50));
  console.log('🌊 Seeding Class Associations and Boat Classes');
  console.log('='.repeat(50));

  await seedBoatClasses();
  await seedClassAssociations();

  // Get final counts
  const { count: classCount } = await supabase
    .from('boat_classes')
    .select('*', { count: 'exact', head: true });

  const { count: assocCount } = await supabase
    .from('class_associations')
    .select('*', { count: 'exact', head: true });

  console.log('\n' + '='.repeat(50));
  console.log('📊 Final Database Counts:');
  console.log(`   ⛵ Boat Classes:       ${classCount}`);
  console.log(`   🏛️  Class Associations: ${assocCount}`);
  console.log('='.repeat(50));
}

main().catch(console.error);
