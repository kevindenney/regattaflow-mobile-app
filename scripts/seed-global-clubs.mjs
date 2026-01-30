#!/usr/bin/env node
/**
 * Seed Global Clubs Directory
 *
 * Populates the global_clubs table with yacht clubs from around the world.
 * Sources: Manual curation + public sailing club directories
 *
 * Run: node scripts/seed-global-clubs.mjs
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================================
// CLUB DATA - Curated list of notable sailing clubs worldwide
// ============================================================================

const GLOBAL_CLUBS = [
  // ============== UNITED STATES ==============
  {
    name: 'New York Yacht Club',
    short_name: 'NYYC',
    country: 'United States',
    country_code: 'US',
    region: 'New York',
    city: 'Newport',
    club_type: 'yacht_club',
    established_year: 1844,
    website: 'https://nyyc.org',
    description: 'One of the world\'s most prestigious yacht clubs, founded in 1844. Home of the America\'s Cup for 132 years.',
    typical_classes: ['J/70', 'IC37', 'Swan', 'Maxi'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'race_committee'],
  },
  {
    name: 'St. Francis Yacht Club',
    short_name: 'StFYC',
    country: 'United States',
    country_code: 'US',
    region: 'California',
    city: 'San Francisco',
    club_type: 'yacht_club',
    established_year: 1927,
    website: 'https://stfyc.com',
    description: 'Premier yacht club on San Francisco Bay, known for world-class racing conditions.',
    typical_classes: ['J/105', 'J/70', 'Knarr', 'Express 37'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'sailing_school'],
  },
  {
    name: 'San Diego Yacht Club',
    short_name: 'SDYC',
    country: 'United States',
    country_code: 'US',
    region: 'California',
    city: 'San Diego',
    club_type: 'yacht_club',
    established_year: 1886,
    website: 'https://sdyc.org',
    description: 'Historic yacht club, home to multiple America\'s Cup winning syndicates.',
    typical_classes: ['J/70', 'Etchells', 'Star', 'Optimist'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'junior_program'],
  },
  {
    name: 'Chicago Yacht Club',
    short_name: 'CYC',
    country: 'United States',
    country_code: 'US',
    region: 'Illinois',
    city: 'Chicago',
    club_type: 'yacht_club',
    established_year: 1875,
    website: 'https://chicagoyachtclub.org',
    description: 'Premier Great Lakes yacht club, organizer of the Chicago-Mackinac Race.',
    typical_classes: ['J/105', 'Tartan 10', 'Beneteau 36.7'],
    facilities: ['clubhouse', 'marina', 'restaurant'],
  },
  {
    name: 'Annapolis Yacht Club',
    short_name: 'AYC',
    country: 'United States',
    country_code: 'US',
    region: 'Maryland',
    city: 'Annapolis',
    club_type: 'yacht_club',
    established_year: 1886,
    website: 'https://annapolisyc.org',
    description: 'Located in America\'s sailing capital, host of major Chesapeake Bay regattas.',
    typical_classes: ['J/22', 'J/30', 'Lightning'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'sailing_school'],
  },
  {
    name: 'Coral Reef Yacht Club',
    short_name: 'CRYC',
    country: 'United States',
    country_code: 'US',
    region: 'Florida',
    city: 'Miami',
    club_type: 'yacht_club',
    established_year: 1955,
    website: 'https://coralreefyachtclub.org',
    description: 'South Florida\'s premier sailing club, known for winter racing series.',
    typical_classes: ['J/70', 'Melges 24', 'Star', 'Snipe'],
    facilities: ['clubhouse', 'marina', 'restaurant'],
  },
  {
    name: 'Seattle Yacht Club',
    short_name: 'SYC',
    country: 'United States',
    country_code: 'US',
    region: 'Washington',
    city: 'Seattle',
    club_type: 'yacht_club',
    established_year: 1892,
    website: 'https://seattleyachtclub.org',
    description: 'Pacific Northwest\'s oldest yacht club, gateway to Puget Sound sailing.',
    typical_classes: ['Melges 24', 'J/105', '6 Metre'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'outstation'],
  },
  {
    name: 'Larchmont Yacht Club',
    short_name: 'LYC',
    country: 'United States',
    country_code: 'US',
    region: 'New York',
    city: 'Larchmont',
    club_type: 'yacht_club',
    established_year: 1880,
    website: 'https://larchmontyc.org',
    description: 'Historic Long Island Sound yacht club with active racing program.',
    typical_classes: ['J/70', 'J/109', 'Lightning', 'Optimist'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'junior_program'],
  },
  {
    name: 'Bayview Yacht Club',
    short_name: 'BYC',
    country: 'United States',
    country_code: 'US',
    region: 'Michigan',
    city: 'Detroit',
    club_type: 'yacht_club',
    established_year: 1915,
    website: 'https://byc.com',
    description: 'Organizer of the Port Huron to Mackinac Race, one of the longest freshwater races.',
    typical_classes: ['J/35', 'Beneteau 40.7', 'Farr 40'],
    facilities: ['clubhouse', 'marina', 'restaurant'],
  },
  {
    name: 'Houston Yacht Club',
    short_name: 'HYC',
    country: 'United States',
    country_code: 'US',
    region: 'Texas',
    city: 'Houston',
    club_type: 'yacht_club',
    established_year: 1897,
    website: 'https://houstonyachtclub.com',
    description: 'Premier Gulf Coast yacht club on Galveston Bay.',
    typical_classes: ['J/22', 'Laser', 'Catalina 22'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'sailing_school'],
  },

  // ============== UNITED KINGDOM ==============
  {
    name: 'Royal Yacht Squadron',
    short_name: 'RYS',
    country: 'United Kingdom',
    country_code: 'GB',
    region: 'Isle of Wight',
    city: 'Cowes',
    club_type: 'yacht_club',
    established_year: 1815,
    website: 'https://rys.org.uk',
    description: 'One of the most prestigious yacht clubs in the world, home of Cowes Week.',
    typical_classes: ['XOD', 'Darings', 'J/70'],
    facilities: ['clubhouse', 'castle', 'restaurant', 'starting_platform'],
  },
  {
    name: 'Royal Ocean Racing Club',
    short_name: 'RORC',
    country: 'United Kingdom',
    country_code: 'GB',
    city: 'London',
    club_type: 'racing_organization',
    established_year: 1925,
    website: 'https://rorc.org',
    description: 'Premier offshore racing organization, organizes the Fastnet Race.',
    typical_classes: ['IRC', 'IMOCA', 'Class40'],
    facilities: ['clubhouse', 'race_office'],
  },
  {
    name: 'Royal Thames Yacht Club',
    short_name: 'RTYC',
    country: 'United Kingdom',
    country_code: 'GB',
    city: 'London',
    club_type: 'yacht_club',
    established_year: 1775,
    website: 'https://royalthames.com',
    description: 'The oldest yacht club in the world, founded in 1775.',
    typical_classes: ['Etchells', 'J/70', 'Dragon'],
    facilities: ['clubhouse', 'restaurant'],
  },
  {
    name: 'Royal Southern Yacht Club',
    short_name: 'RSrnYC',
    country: 'United Kingdom',
    country_code: 'GB',
    region: 'Hampshire',
    city: 'Hamble',
    club_type: 'yacht_club',
    established_year: 1837,
    website: 'https://royal-southern.co.uk',
    description: 'Active racing club on the Solent with extensive junior program.',
    typical_classes: ['J/70', 'J/109', 'RS21'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'sailing_school'],
  },
  {
    name: 'Royal Lymington Yacht Club',
    short_name: 'RLymYC',
    country: 'United Kingdom',
    country_code: 'GB',
    region: 'Hampshire',
    city: 'Lymington',
    club_type: 'yacht_club',
    established_year: 1922,
    website: 'https://rlymyc.org.uk',
    description: 'Family-friendly club with strong dinghy and keelboat racing.',
    typical_classes: ['XOD', 'Laser', 'RS200'],
    facilities: ['clubhouse', 'slipway', 'restaurant'],
  },

  // ============== AUSTRALIA ==============
  {
    name: 'Cruising Yacht Club of Australia',
    short_name: 'CYCA',
    country: 'Australia',
    country_code: 'AU',
    region: 'New South Wales',
    city: 'Sydney',
    club_type: 'yacht_club',
    established_year: 1944,
    website: 'https://cyca.com.au',
    description: 'Organizer of the Sydney to Hobart Yacht Race, one of sailing\'s great ocean races.',
    typical_classes: ['TP52', 'IRC', 'Super Maxi'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'race_office'],
  },
  {
    name: 'Royal Sydney Yacht Squadron',
    short_name: 'RSYS',
    country: 'Australia',
    country_code: 'AU',
    region: 'New South Wales',
    city: 'Sydney',
    club_type: 'yacht_club',
    established_year: 1862,
    website: 'https://rsys.com.au',
    description: 'Historic yacht club in Kirribilli with stunning harbour views.',
    typical_classes: ['Etchells', 'J/70', 'MC38'],
    facilities: ['clubhouse', 'marina', 'restaurant'],
  },
  {
    name: 'Royal Perth Yacht Club',
    short_name: 'RPYC',
    country: 'Australia',
    country_code: 'AU',
    region: 'Western Australia',
    city: 'Perth',
    club_type: 'yacht_club',
    established_year: 1865,
    website: 'https://rpyc.com.au',
    description: 'Winner of the 1983 America\'s Cup, ending the NYYC\'s 132-year winning streak.',
    typical_classes: ['Etchells', 'Foundation 36', 'S80'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'sailing_school'],
  },
  {
    name: 'Royal Queensland Yacht Squadron',
    short_name: 'RQYS',
    country: 'Australia',
    country_code: 'AU',
    region: 'Queensland',
    city: 'Brisbane',
    club_type: 'yacht_club',
    established_year: 1885,
    website: 'https://rqys.com.au',
    description: 'Queensland\'s premier yacht club on Moreton Bay.',
    typical_classes: ['Etchells', 'Adams 10', 'Sports Boats'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'sailing_school'],
  },

  // ============== NEW ZEALAND ==============
  {
    name: 'Royal New Zealand Yacht Squadron',
    short_name: 'RNZYS',
    country: 'New Zealand',
    country_code: 'NZ',
    region: 'Auckland',
    city: 'Auckland',
    club_type: 'yacht_club',
    established_year: 1871,
    website: 'https://rnzys.org.nz',
    description: 'Home of Team New Zealand, multiple America\'s Cup winners.',
    typical_classes: ['Elliott 6m', 'MRX', 'Young 88'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'haul_out'],
  },
  {
    name: 'Royal Akarana Yacht Club',
    short_name: 'RAYC',
    country: 'New Zealand',
    country_code: 'NZ',
    region: 'Auckland',
    city: 'Auckland',
    club_type: 'yacht_club',
    established_year: 1894,
    website: 'https://rayc.co.nz',
    description: 'Active racing club in Auckland with strong offshore program.',
    typical_classes: ['Young 88', 'Ross 930', 'Farr 1020'],
    facilities: ['clubhouse', 'marina', 'restaurant'],
  },

  // ============== EUROPE ==============
  {
    name: 'Real Club Náutico de Barcelona',
    short_name: 'RCNB',
    country: 'Spain',
    country_code: 'ES',
    region: 'Catalonia',
    city: 'Barcelona',
    club_type: 'yacht_club',
    established_year: 1876,
    website: 'https://rcnb.com',
    description: 'Historic Mediterranean yacht club, host of the 2024 America\'s Cup.',
    typical_classes: ['J/80', 'Dragon', 'ORC'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'sailing_school'],
  },
  {
    name: 'Yacht Club de Monaco',
    short_name: 'YCM',
    country: 'Monaco',
    country_code: 'MC',
    city: 'Monaco',
    club_type: 'yacht_club',
    established_year: 1953,
    website: 'https://yacht-club-monaco.mc',
    description: 'Exclusive Mediterranean yacht club hosting prestigious regattas.',
    typical_classes: ['Smeralda 888', 'J/70', 'Wallys'],
    facilities: ['clubhouse', 'marina', 'restaurant'],
  },
  {
    name: 'Yacht Club Costa Smeralda',
    short_name: 'YCCS',
    country: 'Italy',
    country_code: 'IT',
    region: 'Sardinia',
    city: 'Porto Cervo',
    club_type: 'yacht_club',
    established_year: 1967,
    website: 'https://yccs.com',
    description: 'World-renowned yacht club in Sardinia, hosts Maxi Yacht Rolex Cup.',
    typical_classes: ['Maxi', 'Swan', 'Wally'],
    facilities: ['clubhouse', 'marina', 'restaurant'],
  },
  {
    name: 'Société Nautique de Genève',
    short_name: 'SNG',
    country: 'Switzerland',
    country_code: 'CH',
    region: 'Geneva',
    city: 'Geneva',
    club_type: 'yacht_club',
    established_year: 1872,
    website: 'https://nautique.org',
    description: 'Lake Geneva yacht club, home of Alinghi America\'s Cup team.',
    typical_classes: ['Surprise', 'Lacustre', 'D35'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'sailing_school'],
  },
  {
    name: 'Koninklijke Nederlandse Zeil- en Roeivereniging',
    short_name: 'KNZ&RV',
    country: 'Netherlands',
    country_code: 'NL',
    city: 'Muiden',
    club_type: 'yacht_club',
    established_year: 1847,
    website: 'https://knzrv.nl',
    description: 'Oldest yacht club in the Netherlands.',
    typical_classes: ['Dragon', 'Yngling', 'J/22'],
    facilities: ['clubhouse', 'marina', 'restaurant'],
  },
  {
    name: 'Norddeutscher Regatta Verein',
    short_name: 'NRV',
    country: 'Germany',
    country_code: 'DE',
    city: 'Hamburg',
    club_type: 'yacht_club',
    established_year: 1868,
    website: 'https://nrv.de',
    description: 'Premier German yacht club, organizer of major Baltic regattas.',
    typical_classes: ['Dragon', 'J/70', 'ORC'],
    facilities: ['clubhouse', 'marina', 'restaurant'],
  },
  {
    name: 'Yacht Club de France',
    short_name: 'YCF',
    country: 'France',
    country_code: 'FR',
    city: 'Paris',
    club_type: 'yacht_club',
    established_year: 1867,
    website: 'https://ycf-paris.com',
    description: 'Historic French yacht club with national membership.',
    typical_classes: ['Figaro', 'Class40', 'IMOCA'],
    facilities: ['clubhouse', 'restaurant'],
  },
  {
    name: 'Kungliga Svenska Segel Sällskapet',
    short_name: 'KSSS',
    country: 'Sweden',
    country_code: 'SE',
    city: 'Stockholm',
    club_type: 'yacht_club',
    established_year: 1830,
    website: 'https://ksss.se',
    description: 'Royal Swedish Yacht Club, one of the oldest in the world.',
    typical_classes: ['Dragon', 'IF', 'ORC'],
    facilities: ['clubhouse', 'marina', 'restaurant'],
  },

  // ============== ASIA ==============
  {
    name: 'Royal Hong Kong Yacht Club',
    short_name: 'RHKYC',
    country: 'Hong Kong',
    country_code: 'HK',
    city: 'Hong Kong',
    club_type: 'yacht_club',
    established_year: 1849,
    website: 'https://rhkyc.org.hk',
    description: 'Asia\'s premier yacht club with multiple locations around Hong Kong.',
    typical_classes: ['Dragon', 'Sportsboat', 'IRC'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'sailing_school'],
  },
  {
    name: 'Singapore Sailing Federation',
    short_name: 'SSF',
    country: 'Singapore',
    country_code: 'SG',
    city: 'Singapore',
    club_type: 'sailing_club',
    established_year: 1952,
    website: 'https://sailing.org.sg',
    description: 'National sailing authority of Singapore.',
    typical_classes: ['Laser', '470', '49er', 'Optimist'],
    facilities: ['clubhouse', 'marina', 'sailing_school'],
  },
  {
    name: 'Japan Sailing Federation',
    short_name: 'JSAF',
    country: 'Japan',
    country_code: 'JP',
    city: 'Tokyo',
    club_type: 'sailing_club',
    established_year: 1932,
    website: 'https://jsaf.or.jp',
    description: 'National sailing federation of Japan, hosted 2020 Olympic sailing.',
    typical_classes: ['470', 'Laser', '49er'],
    facilities: ['national_center', 'sailing_school'],
  },
  {
    name: 'Hebe Haven Yacht Club',
    short_name: 'HHYC',
    country: 'Hong Kong',
    country_code: 'HK',
    city: 'Sai Kung',
    club_type: 'yacht_club',
    established_year: 1963,
    website: 'https://hhyc.org.hk',
    description: 'Family-oriented yacht club in Hong Kong\'s New Territories.',
    typical_classes: ['Laser', 'Optimist', 'Cruiser'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'sailing_school'],
  },

  // ============== SOUTH AFRICA ==============
  {
    name: 'Royal Cape Yacht Club',
    short_name: 'RCYC',
    country: 'South Africa',
    country_code: 'ZA',
    region: 'Western Cape',
    city: 'Cape Town',
    club_type: 'yacht_club',
    established_year: 1905,
    website: 'https://rcyc.co.za',
    description: 'Premier South African yacht club, gateway to Cape Town\'s waters.',
    typical_classes: ['L26', 'Cape 31', 'IRC'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'haul_out'],
  },

  // ============== CARIBBEAN ==============
  {
    name: 'Antigua Yacht Club',
    short_name: 'AYC',
    country: 'Antigua and Barbuda',
    country_code: 'AG',
    city: 'English Harbour',
    club_type: 'yacht_club',
    established_year: 1967,
    website: 'https://antiguayachtclub.com',
    description: 'Host of Antigua Sailing Week, one of the Caribbean\'s top regattas.',
    typical_classes: ['IRC', 'CSA', 'Bareboat'],
    facilities: ['clubhouse', 'marina', 'restaurant'],
  },
  {
    name: 'St. Maarten Yacht Club',
    short_name: 'SMYC',
    country: 'Sint Maarten',
    country_code: 'SX',
    city: 'Simpson Bay',
    club_type: 'yacht_club',
    established_year: 1980,
    website: 'https://smyc.com',
    description: 'Organizer of the Heineken Regatta, a Caribbean classic.',
    typical_classes: ['IRC', 'CSA', 'Multihull'],
    facilities: ['clubhouse', 'marina', 'restaurant'],
  },

  // ============== SOUTH AMERICA ==============
  {
    name: 'Yacht Club Argentino',
    short_name: 'YCA',
    country: 'Argentina',
    country_code: 'AR',
    city: 'Buenos Aires',
    club_type: 'yacht_club',
    established_year: 1883,
    website: 'https://yca.org.ar',
    description: 'Argentina\'s premier yacht club on the Río de la Plata.',
    typical_classes: ['Lightning', 'J/24', 'Cruiser'],
    facilities: ['clubhouse', 'marina', 'restaurant'],
  },
  {
    name: 'Iate Clube do Rio de Janeiro',
    short_name: 'ICRJ',
    country: 'Brazil',
    country_code: 'BR',
    region: 'Rio de Janeiro',
    city: 'Rio de Janeiro',
    club_type: 'yacht_club',
    established_year: 1920,
    website: 'https://icrj.com.br',
    description: 'Host of 2016 Olympic sailing events in Guanabara Bay.',
    typical_classes: ['Star', 'Snipe', 'Laser'],
    facilities: ['clubhouse', 'marina', 'restaurant', 'sailing_school'],
  },

  // ============== CLASS ASSOCIATIONS ==============
  {
    name: 'International Dragon Association',
    short_name: 'IDA',
    country: 'International',
    country_code: null,
    club_type: 'class_association',
    website: 'https://intdragon.net',
    description: 'International class association for the Dragon keelboat.',
    typical_classes: ['Dragon'],
  },
  {
    name: 'International J/70 Class Association',
    short_name: 'IJ70CA',
    country: 'International',
    country_code: null,
    club_type: 'class_association',
    website: 'https://j70class.com',
    description: 'One-design class association for the popular J/70.',
    typical_classes: ['J/70'],
  },
  {
    name: 'International Laser Class Association',
    short_name: 'ILCA',
    country: 'International',
    country_code: null,
    club_type: 'class_association',
    website: 'https://laser.org',
    description: 'Largest one-design sailboat class in the world.',
    typical_classes: ['ILCA 4', 'ILCA 6', 'ILCA 7'],
  },
  {
    name: 'International Optimist Dinghy Association',
    short_name: 'IODA',
    country: 'International',
    country_code: null,
    club_type: 'class_association',
    website: 'https://optiworld.org',
    description: 'The world\'s largest youth sailing class.',
    typical_classes: ['Optimist'],
  },
  {
    name: 'International 470 Class Association',
    short_name: 'I470CA',
    country: 'International',
    country_code: null,
    club_type: 'class_association',
    website: 'https://470.org',
    description: 'Olympic two-person dinghy class.',
    typical_classes: ['470'],
  },
  {
    name: 'International 49er Class Association',
    short_name: 'I49CA',
    country: 'International',
    country_code: null,
    club_type: 'class_association',
    website: 'https://49er.org',
    description: 'High-performance Olympic skiff class.',
    typical_classes: ['49er', '49erFX'],
  },
  {
    name: 'International Etchells Class Association',
    short_name: 'IECA',
    country: 'International',
    country_code: null,
    club_type: 'class_association',
    website: 'https://etchells.org',
    description: 'Premier one-design keelboat class.',
    typical_classes: ['Etchells'],
  },
  {
    name: 'International Melges 24 Class Association',
    short_name: 'IM24CA',
    country: 'International',
    country_code: null,
    club_type: 'class_association',
    website: 'https://melges24.com',
    description: 'One-design sportboat class with strong international fleet.',
    typical_classes: ['Melges 24'],
  },
];

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedGlobalClubs() {
  console.log('🌍 Seeding Global Clubs Directory...\n');

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const club of GLOBAL_CLUBS) {
    try {
      // Check if club already exists by name
      const { data: existing } = await supabase
        .from('global_clubs')
        .select('id, name')
        .ilike('name', club.name)
        .maybeSingle();

      if (existing) {
        console.log(`⏭️  Skipped (exists): ${club.name}`);
        skipped++;
        continue;
      }

      // Insert the club
      const { data, error } = await supabase
        .from('global_clubs')
        .insert({
          name: club.name,
          short_name: club.short_name,
          description: club.description,
          club_type: club.club_type,
          country: club.country,
          country_code: club.country_code,
          region: club.region,
          city: club.city,
          website: club.website,
          established_year: club.established_year,
          typical_classes: club.typical_classes,
          facilities: club.facilities,
          source: 'manual',
          verified: true,  // Curated data is pre-verified
        })
        .select('id, name')
        .single();

      if (error) {
        console.error(`❌ Error inserting ${club.name}:`, error.message);
        errors++;
      } else {
        console.log(`✅ Inserted: ${club.name}`);
        inserted++;
      }
    } catch (err) {
      console.error(`❌ Exception for ${club.name}:`, err.message);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Seeding Summary:');
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ⏭️  Skipped:  ${skipped}`);
  console.log(`   ❌ Errors:   ${errors}`);
  console.log(`   📝 Total:    ${GLOBAL_CLUBS.length}`);
  console.log('='.repeat(50));

  // Get final count
  const { count } = await supabase
    .from('global_clubs')
    .select('*', { count: 'exact', head: true });

  console.log(`\n🌍 Total clubs in global_clubs: ${count}`);
}

// Run the seeder
seedGlobalClubs().catch(console.error);
