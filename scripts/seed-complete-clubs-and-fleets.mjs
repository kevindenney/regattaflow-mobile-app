#!/usr/bin/env node

/**
 * Complete Clubs and Fleets Seed Script
 * Creates clubs, fleets, memberships, and club events for demo users
 *
 * Run: node scripts/seed-complete-clubs-and-fleets.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// =====================================================
// CLUB DATA
// =====================================================

const CLUBS = [
  {
    name: 'Royal Hong Kong Yacht Club',
    short_name: 'RHKYC',
    description: 'Founded in 1849, the Royal Hong Kong Yacht Club is one of the oldest and most prestigious yacht clubs in Asia.',
    address: 'Kellett Island, Causeway Bay, Hong Kong',
    phone: '+852 2832 2817',
    email: 'info@rhkyc.org.hk',
    website: 'https://rhkyc.org.hk',
    contact_person: 'Race Officer',
    membership_type: 'private',
    club_type: 'yacht_club',
    timezone: 'Asia/Hong_Kong',
    is_active: true,
  },
  {
    name: 'San Francisco Yacht Club',
    short_name: 'SFYC',
    description: 'Established in 1869, SFYC is one of the oldest yacht clubs on the Pacific Coast.',
    address: '98 Beach Road, Belvedere, CA 94920',
    phone: '+1 415-435-9133',
    email: 'office@sfyc.org',
    website: 'https://sfyc.org',
    contact_person: 'Commodore',
    membership_type: 'private',
    club_type: 'yacht_club',
    timezone: 'America/Los_Angeles',
    is_active: true,
  },
  {
    name: 'Royal Sydney Yacht Squadron',
    short_name: 'RSYS',
    description: 'Founded in 1862, RSYS is one of Australia\'s most distinguished yacht clubs.',
    address: '33 Paget Street, Kirribilli NSW 2061',
    phone: '+61 2 9955 8350',
    email: 'admin@rsys.com.au',
    website: 'https://rsys.com.au',
    contact_person: 'Sailing Manager',
    membership_type: 'private',
    club_type: 'yacht_club',
    timezone: 'Australia/Sydney',
    is_active: true,
  },
  {
    name: 'Miami Yacht Club',
    short_name: 'MYC',
    description: 'Established in 1900, serving South Florida\'s boating community for over a century.',
    address: '1000 S. Bayshore Drive, Miami, FL 33131',
    phone: '+1 305-579-3600',
    email: 'info@miamiyachtclub.org',
    website: 'https://miamiyachtclub.org',
    contact_person: 'Club Manager',
    membership_type: 'private',
    club_type: 'yacht_club',
    timezone: 'America/New_York',
    is_active: true,
  },
];

// =====================================================
// FLEET DATA (by club)
// =====================================================

const FLEETS = {
  RHKYC: [
    {
      name: 'RHKYC Dragon Fleet',
      description: 'Premier Dragon class racing in Hong Kong waters',
      class_id: null,
      region: 'Hong Kong',
      visibility: 'public',
      metadata: { class: 'Dragon', established: '1970' },
    },
    {
      name: 'RHKYC J/70 Fleet',
      description: 'Fast-growing J/70 one-design fleet',
      class_id: null,
      region: 'Hong Kong',
      visibility: 'public',
      metadata: { class: 'J/70', established: '2015' },
    },
    {
      name: 'RHKYC Laser Fleet',
      description: 'Active Laser dinghy racing program',
      class_id: null,
      region: 'Hong Kong',
      visibility: 'public',
      metadata: { class: 'Laser', established: '1980' },
    },
  ],
  SFYC: [
    {
      name: 'SFYC Dragon Fleet',
      description: 'Dragon class racing on San Francisco Bay',
      class_id: null,
      region: 'San Francisco Bay',
      visibility: 'public',
      metadata: { class: 'Dragon', established: '1965' },
    },
    {
      name: 'SFYC 420 Fleet',
      description: 'Youth and adult 420 racing program',
      class_id: null,
      region: 'San Francisco Bay',
      visibility: 'public',
      metadata: { class: '420', established: '1975' },
    },
  ],
  RSYS: [
    {
      name: 'RSYS Laser Fleet',
      description: 'Competitive Laser fleet on Sydney Harbour',
      class_id: null,
      region: 'Sydney Harbour',
      visibility: 'public',
      metadata: { class: 'Laser', established: '1985' },
    },
    {
      name: 'RSYS Optimist Fleet',
      description: 'Junior Optimist training and racing',
      class_id: null,
      region: 'Sydney Harbour',
      visibility: 'public',
      metadata: { class: 'Optimist', established: '1990' },
    },
  ],
  MYC: [
    {
      name: 'Miami J/70 Fleet',
      description: 'Competitive J/70 racing in Biscayne Bay',
      class_id: null,
      region: 'Miami',
      visibility: 'public',
      metadata: { class: 'J/70', established: '2013' },
    },
  ],
};

// =====================================================
// USER MAPPINGS
// =====================================================

const USER_CLUB_MEMBERSHIPS = {
  'sarah.chen@sailing.com': {
    clubs: ['RHKYC'],
    fleets: ['RHKYC Dragon Fleet', 'RHKYC J/70 Fleet'],
    roles: { RHKYC: 'member' },
  },
  'mike.thompson@racing.com': {
    clubs: ['SFYC'],
    fleets: ['SFYC Dragon Fleet', 'SFYC 420 Fleet'],
    roles: { SFYC: 'admin' },
  },
  'emma.wilson@yacht.club': {
    clubs: ['RSYS'],
    fleets: ['RSYS Laser Fleet', 'RSYS Optimist Fleet'],
    roles: { RSYS: 'member' },
  },
  'james.rodriguez@fleet.com': {
    clubs: ['MYC', 'RHKYC'],
    fleets: ['Miami J/70 Fleet'],
    roles: { MYC: 'member', RHKYC: 'member' },
  },
  'coach.anderson@sailing.com': {
    clubs: ['SFYC', 'RHKYC'],
    fleets: [],
    roles: { SFYC: 'member', RHKYC: 'member' },
  },
};

// =====================================================
// CLUB EVENTS
// =====================================================

function getUpcomingDate(monthsFromNow, day = 15) {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsFromNow);
  date.setDate(day);
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

const CLUB_EVENTS = {
  RHKYC: [
    {
      title: 'Spring Dragon Championship 2025',
      description: 'Annual spring championship for the Dragon class fleet',
      event_type: 'regatta',
      start_date: getUpcomingDate(1, 15),
      end_date: getUpcomingDate(1, 17),
      registration_opens: getUpcomingDate(0, 1),
      registration_closes: getUpcomingDate(1, 10),
      location_name: 'Victoria Harbour',
      location_coordinates: { lat: 22.2793, lng: 114.1628 },
      max_participants: 30,
      registration_fee: 500.00,
      currency: 'HKD',
      payment_required: true,
      status: 'registration_open',
      visibility: 'public',
      boat_classes: ['Dragon'],
    },
    {
      title: 'J/70 Winter Series - Race 3',
      description: 'Third race in the winter series',
      event_type: 'race_series',
      start_date: getUpcomingDate(0, 20),
      end_date: getUpcomingDate(0, 20),
      location_name: 'Hong Kong Waters',
      location_coordinates: { lat: 22.28, lng: 114.17 },
      status: 'published',
      visibility: 'public',
      boat_classes: ['J/70'],
    },
  ],
  SFYC: [
    {
      title: 'Bay Challenge Regatta',
      description: 'Annual multi-class regatta on San Francisco Bay',
      event_type: 'regatta',
      start_date: getUpcomingDate(2, 20),
      end_date: getUpcomingDate(2, 22),
      registration_opens: getUpcomingDate(1, 1),
      registration_closes: getUpcomingDate(2, 15),
      location_name: 'San Francisco Bay',
      location_coordinates: { lat: 37.8651, lng: -122.4822 },
      max_participants: 50,
      registration_fee: 350.00,
      currency: 'USD',
      payment_required: true,
      status: 'published',
      visibility: 'public',
      boat_classes: ['Dragon', 'J/70', 'Laser'],
    },
  ],
  RSYS: [
    {
      title: 'Sydney Harbour Sprint Series',
      description: 'Fast-paced sprint racing series for Laser class',
      event_type: 'race_series',
      start_date: getUpcomingDate(1, 25),
      end_date: getUpcomingDate(2, 5),
      registration_opens: getUpcomingDate(0, 15),
      registration_closes: getUpcomingDate(1, 20),
      location_name: 'Sydney Harbour',
      location_coordinates: { lat: -33.8523, lng: 151.2402 },
      status: 'registration_open',
      visibility: 'public',
      boat_classes: ['Laser'],
    },
  ],
  MYC: [
    {
      title: 'Miami J/70 Midwinters',
      description: 'Winter championship for J/70 fleet',
      event_type: 'regatta',
      start_date: getUpcomingDate(3, 10),
      end_date: getUpcomingDate(3, 12),
      registration_opens: getUpcomingDate(2, 1),
      registration_closes: getUpcomingDate(3, 5),
      location_name: 'Biscayne Bay',
      location_coordinates: { lat: 25.7617, lng: -80.1918 },
      max_participants: 40,
      registration_fee: 450.00,
      currency: 'USD',
      payment_required: true,
      status: 'published',
      visibility: 'public',
      boat_classes: ['J/70'],
    },
  ],
};

// =====================================================
// MAIN FUNCTIONS
// =====================================================

async function getUsers() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  const userMap = {};
  for (const user of users) {
    userMap[user.email] = user.id;
  }

  console.log('  ✅ Found', users.length, 'users');
  return userMap;
}

async function createClubs() {
  console.log('\n🏛️  Creating clubs...\n');

  const clubMap = {};

  for (const clubData of CLUBS) {
    try {
      // First check if club already exists
      const { data: existing, error: checkError } = await supabase
        .from('clubs')
        .select('id, short_name')
        .eq('name', clubData.name)
        .maybeSingle();

      if (existing) {
        console.log(`  ℹ️  Club already exists: ${clubData.short_name}`);
        clubMap[clubData.short_name] = existing.id;
        continue;
      }

      // Create new club
      const { data, error } = await supabase
        .from('clubs')
        .insert(clubData)
        .select()
        .single();

      if (error) {
        console.error(`  ❌ Error creating club ${clubData.short_name}:`, error.message);
        continue;
      }

      console.log(`  ✅ Created: ${clubData.short_name.padEnd(10)} ${clubData.name}`);
      clubMap[clubData.short_name] = data.id;

    } catch (error) {
      console.error(`  ❌ Exception creating club ${clubData.short_name}:`, error.message);
    }
  }

  return clubMap;
}

async function createFleets(clubMap) {
  console.log('\n⛵ Creating fleets...\n');

  const fleetMap = {};

  for (const [clubShortName, fleetList] of Object.entries(FLEETS)) {
    const clubId = clubMap[clubShortName];
    if (!clubId) {
      console.log(`  ⚠️  No club ID found for ${clubShortName}, skipping fleets`);
      continue;
    }

    for (const fleetData of fleetList) {
      try {
        // Check if fleet already exists
        const { data: existing } = await supabase
          .from('fleets')
          .select('id, name')
          .eq('name', fleetData.name)
          .eq('club_id', clubId)
          .maybeSingle();

        if (existing) {
          console.log(`  ℹ️  Fleet already exists: ${fleetData.name}`);
          fleetMap[fleetData.name] = existing.id;
          continue;
        }

        // Create new fleet
        const { data, error } = await supabase
          .from('fleets')
          .insert({
            ...fleetData,
            club_id: clubId,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        console.log(`  ✅ Created: ${fleetData.name}`);
        fleetMap[data.name] = data.id;

      } catch (error) {
        console.error(`  ❌ Error creating fleet ${fleetData.name}:`, error.message);
      }
    }
  }

  return fleetMap;
}

async function createMemberships(userMap, clubMap, fleetMap) {
  console.log('\n👥 Creating memberships...\n');

  for (const [email, membership] of Object.entries(USER_CLUB_MEMBERSHIPS)) {
    const userId = userMap[email];
    if (!userId) {
      console.log(`  ⚠️  User not found: ${email}`);
      continue;
    }

    console.log(`\n  User: ${email}`);

    // Create club memberships
    for (const clubShortName of membership.clubs) {
      const clubId = clubMap[clubShortName];
      if (!clubId) {
        console.log(`    ⚠️  Club not found: ${clubShortName}`);
        continue;
      }

      const role = membership.roles[clubShortName] || 'member';

      try {
        const { error } = await supabase
          .from('club_members')
          .insert({
            club_id: clubId,
            user_id: userId,
            role: role,
            is_active: true,
          });

        if (error && !error.message.includes('unique') && !error.message.includes('duplicate')) {
          throw error;
        }

        console.log(`    ✅ ${clubShortName} membership (${role})`);

      } catch (error) {
        console.error(`    ❌ Error creating club membership:`, error.message);
      }
    }

    // Create fleet memberships
    for (const fleetName of membership.fleets) {
      const fleetId = fleetMap[fleetName];
      if (!fleetId) {
        console.log(`    ⚠️  Fleet not found: ${fleetName}`);
        continue;
      }

      try {
        const { error } = await supabase
          .from('fleet_members')
          .insert({
            fleet_id: fleetId,
            user_id: userId,
            role: 'member',
            status: 'active',
          });

        if (error && !error.message.includes('unique') && !error.message.includes('duplicate')) {
          throw error;
        }

        console.log(`    ✅ ${fleetName} membership`);

      } catch (error) {
        console.error(`    ❌ Error creating fleet membership:`, error.message);
      }
    }
  }
}

async function createEvents(clubMap, userMap) {
  console.log('\n📅 Creating club events...\n');

  for (const [clubShortName, events] of Object.entries(CLUB_EVENTS)) {
    const clubId = clubMap[clubShortName];
    if (!clubId) {
      console.log(`  ⚠️  No club ID found for ${clubShortName}`);
      continue;
    }

    console.log(`\n  ${clubShortName} Events:`);

    for (const eventData of events) {
      try {
        const { data, error } = await supabase
          .from('club_events')
          .insert({
            ...eventData,
            club_id: clubId,
            created_by: Object.values(userMap)[0], // Use first user as creator
          })
          .select()
          .single();

        if (error) {
          if (error.message.includes('unique') || error.message.includes('duplicate')) {
            console.log(`    ℹ️  Event already exists: ${eventData.title}`);
            continue;
          }
          throw error;
        }

        console.log(`    ✅ ${eventData.title}`);

      } catch (error) {
        console.error(`    ❌ Error creating event ${eventData.title}:`, error.message);
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting complete clubs and fleets seed...');
  console.log('══════════════════════════════════════════════════════════\n');

  try {
    const userMap = await getUsers();
    const clubMap = await createClubs();
    const fleetMap = await createFleets(clubMap);
    await createMemberships(userMap, clubMap, fleetMap);
    await createEvents(clubMap, userMap);

    console.log('\n══════════════════════════════════════════════════════════');
    console.log('✅ Complete clubs and fleets data created successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • ${Object.keys(clubMap).length} clubs created`);
    console.log(`   • ${Object.keys(fleetMap).length} fleets created`);
    console.log(`   • Memberships for ${Object.keys(USER_CLUB_MEMBERSHIPS).length} users`);
    console.log(`   • ${Object.values(CLUB_EVENTS).flat().length} upcoming events\n`);
    console.log('💡 Next Steps:');
    console.log('   1. Login as any demo user');
    console.log('   2. Go to Add Race screen');
    console.log('   3. See club and fleet race suggestions!\n');
    console.log('🔄 To generate suggestions:');
    console.log('   npx supabase functions invoke refresh-race-suggestions\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
