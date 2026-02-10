#!/usr/bin/env node

/**
 * Complete Demo Data Seed Script
 * Creates users, clubs, fleets, memberships, events, and race history
 *
 * Run: node scripts/seed-complete-demo-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEMO_PASSWORD = process.env.DEMO_PASSWORD;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}
if (!DEMO_PASSWORD) {
  console.error('❌ DEMO_PASSWORD environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// =====================================================
// Mock Users Data
// =====================================================

const MOCK_USERS = [
  {
    email: 'sarah.chen@sailing.com',
    password: DEMO_PASSWORD,
    full_name: 'Sarah Chen',
    user_type: 'sailor',
    profile: {
      home_port: 'Hong Kong',
      sailing_since: 2015,
      skill_level: 'advanced',
      preferred_classes: ['Dragon', 'J/70'],
    }
  },
  {
    email: 'mike.thompson@racing.com',
    password: DEMO_PASSWORD,
    full_name: 'Mike Thompson',
    user_type: 'sailor',
    profile: {
      home_port: 'San Francisco',
      sailing_since: 2010,
      skill_level: 'expert',
      preferred_classes: ['Laser', '420'],
    }
  },
  {
    email: 'emma.wilson@yacht.club',
    password: DEMO_PASSWORD,
    full_name: 'Emma Wilson',
    user_type: 'sailor',
    profile: {
      home_port: 'Sydney',
      sailing_since: 2018,
      skill_level: 'intermediate',
      preferred_classes: ['Optimist', 'Laser'],
    }
  },
  {
    email: 'james.rodriguez@fleet.com',
    password: DEMO_PASSWORD,
    full_name: 'James Rodriguez',
    user_type: 'sailor',
    profile: {
      home_port: 'Miami',
      sailing_since: 2012,
      skill_level: 'advanced',
      preferred_classes: ['Dragon', 'J/70'],
    }
  },
  {
    email: 'coach.anderson@sailing.com',
    password: DEMO_PASSWORD,
    full_name: 'Coach Anderson',
    user_type: 'coach',
    profile: {
      coaching_since: 2005,
      specialties: ['Race tactics', 'Boat speed', 'Starts'],
    }
  },
];

// =====================================================
// Mock Clubs Data
// =====================================================

const MOCK_CLUBS = [
  {
    name: 'Royal Hong Kong Yacht Club',
    slug: 'rhkyc',
    description: 'Premier yacht club in Hong Kong with over 150 years of sailing tradition',
    location: 'Hong Kong',
    coordinates: { lat: 22.2793, lng: 114.1628 },
    website: 'https://rhkyc.org.hk',
    established: 1849,
    member_count: 2500,
    facilities: ['Marina', 'Race Office', 'Training Center', 'Restaurant'],
    classes_supported: ['Dragon', 'J/70', 'Laser', 'Optimist'],
  },
  {
    name: 'San Francisco Yacht Club',
    slug: 'sfyc',
    description: 'Historic yacht club on the San Francisco Bay',
    location: 'San Francisco, CA',
    coordinates: { lat: 37.8651, lng: -122.4822 },
    website: 'https://sfyc.org',
    established: 1869,
    member_count: 1800,
    facilities: ['Full Service Marina', 'Racing Program', 'Junior Sailing'],
    classes_supported: ['Dragon', 'J/70', 'Laser', '420'],
  },
  {
    name: 'Royal Sydney Yacht Squadron',
    slug: 'rsys',
    description: 'Australia\'s premier yacht club located in Sydney Harbour',
    location: 'Sydney, Australia',
    coordinates: { lat: -33.8523, lng: 151.2402 },
    website: 'https://rsys.com.au',
    established: 1862,
    member_count: 2000,
    facilities: ['Marina Berths', 'Sailing School', 'Race Management'],
    classes_supported: ['Laser', 'Optimist', '420', 'Dragon'],
  },
  {
    name: 'Miami Yacht Club',
    slug: 'myc',
    description: 'South Florida\'s leading sailing and social club',
    location: 'Miami, FL',
    coordinates: { lat: 25.7617, lng: -80.1918 },
    website: 'https://miamiyachtclub.org',
    established: 1900,
    member_count: 1500,
    facilities: ['Wet Slips', 'Race Committee', 'Youth Program'],
    classes_supported: ['J/70', 'Laser', 'Optimist'],
  },
];

// =====================================================
// Mock Fleets Data (per club)
// =====================================================

const MOCK_FLEETS = [
  // RHKYC Fleets
  {
    clubSlug: 'rhkyc',
    name: 'RHKYC Dragon Fleet',
    slug: 'rhkyc-dragon',
    className: 'Dragon',
    description: 'Competitive Dragon fleet racing every weekend',
    visibility: 'public',
  },
  {
    clubSlug: 'rhkyc',
    name: 'RHKYC J/70 Fleet',
    slug: 'rhkyc-j70',
    className: 'J/70',
    description: 'Fast-paced one-design racing',
    visibility: 'public',
  },
  {
    clubSlug: 'rhkyc',
    name: 'RHKYC Laser Fleet',
    slug: 'rhkyc-laser',
    className: 'Laser',
    description: 'Single-handed dinghy racing',
    visibility: 'public',
  },

  // SFYC Fleets
  {
    clubSlug: 'sfyc',
    name: 'SFYC Dragon Fleet',
    slug: 'sfyc-dragon',
    className: 'Dragon',
    description: 'San Francisco Bay Dragon racing',
    visibility: 'public',
  },
  {
    clubSlug: 'sfyc',
    name: 'SFYC 420 Fleet',
    slug: 'sfyc-420',
    className: '420',
    description: 'Youth and adult 420 racing',
    visibility: 'public',
  },

  // RSYS Fleets
  {
    clubSlug: 'rsys',
    name: 'RSYS Laser Fleet',
    slug: 'rsys-laser',
    className: 'Laser',
    description: 'Sydney Harbour Laser racing',
    visibility: 'public',
  },
  {
    clubSlug: 'rsys',
    name: 'RSYS Optimist Fleet',
    slug: 'rsys-optimist',
    className: 'Optimist',
    description: 'Junior sailing program',
    visibility: 'club',
  },

  // MYC Fleets
  {
    clubSlug: 'myc',
    name: 'Miami J/70 Fleet',
    slug: 'myc-j70',
    className: 'J/70',
    description: 'South Florida J/70 circuit',
    visibility: 'public',
  },
];

// =====================================================
// Helper Functions
// =====================================================

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDate(date) {
  return date.toISOString();
}

// =====================================================
// Seed Functions
// =====================================================

async function createUsers() {
  console.log('\n🧑‍🤝‍🧑 Creating mock users...');

  const createdUsers = [];

  for (const userData of MOCK_USERS) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
        },
      });

      if (authError) {
        // User might already exist, try to get them
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === userData.email);

        if (existingUser) {
          console.log(`  ✓ User already exists: ${userData.email}`);
          createdUsers.push({ ...userData, id: existingUser.id });
          continue;
        } else {
          throw authError;
        }
      }

      // Update user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .update({
          full_name: userData.full_name,
          user_type: userData.user_type,
          onboarding_step: 'completed',
          metadata: userData.profile,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error(`  ❌ Error updating profile for ${userData.email}:`, profileError.message);
      }

      console.log(`  ✓ Created user: ${userData.email} (${userData.full_name})`);
      createdUsers.push({ ...userData, id: authData.user.id });

    } catch (error) {
      console.error(`  ❌ Error creating user ${userData.email}:`, error.message);
    }
  }

  return createdUsers;
}

async function createClubs() {
  console.log('\n⛵ Creating mock clubs...');

  const createdClubs = [];

  for (const clubData of MOCK_CLUBS) {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .upsert({
          name: clubData.name,
          slug: clubData.slug,
          description: clubData.description,
          location: clubData.location,
          website: clubData.website,
          metadata: {
            established: clubData.established,
            member_count: clubData.member_count,
            facilities: clubData.facilities,
            classes_supported: clubData.classes_supported,
            coordinates: clubData.coordinates,
          },
          is_verified: true,
        }, { onConflict: 'slug' })
        .select()
        .single();

      if (error) throw error;

      console.log(`  ✓ Created club: ${clubData.name}`);
      createdClubs.push({ ...clubData, id: data.id });

    } catch (error) {
      console.error(`  ❌ Error creating club ${clubData.name}:`, error.message);
    }
  }

  return createdClubs;
}

async function createFleets(clubs) {
  console.log('\n🚤 Creating mock fleets...');

  const createdFleets = [];

  // Get boat class IDs
  const { data: boatClasses } = await supabase.from('boat_classes').select('id, name');
  const classMap = new Map(boatClasses?.map(c => [c.name, c.id]) || []);

  for (const fleetData of MOCK_FLEETS) {
    try {
      const club = clubs.find(c => c.slug === fleetData.clubSlug);
      if (!club) {
        console.log(`  ⚠️  Club not found for fleet: ${fleetData.name}`);
        continue;
      }

      const classId = classMap.get(fleetData.className);

      const { data, error } = await supabase
        .from('fleets')
        .upsert({
          name: fleetData.name,
          slug: fleetData.slug,
          description: fleetData.description,
          club_id: club.id,
          class_id: classId,
          visibility: fleetData.visibility,
          metadata: {
            boat_class_name: fleetData.className,
          },
        }, { onConflict: 'slug' })
        .select()
        .single();

      if (error) throw error;

      console.log(`  ✓ Created fleet: ${fleetData.name}`);
      createdFleets.push({ ...fleetData, id: data.id, clubId: club.id, classId });

    } catch (error) {
      console.error(`  ❌ Error creating fleet ${fleetData.name}:`, error.message);
    }
  }

  return createdFleets;
}

async function createMemberships(users, clubs, fleets) {
  console.log('\n👥 Creating club and fleet memberships...');

  // Sarah Chen - RHKYC member, Dragon and J/70 fleets
  const sarah = users.find(u => u.email === 'sarah.chen@sailing.com');
  const rhkyc = clubs.find(c => c.slug === 'rhkyc');
  const rhkycDragon = fleets.find(f => f.slug === 'rhkyc-dragon');
  const rhkycJ70 = fleets.find(f => f.slug === 'rhkyc-j70');

  if (sarah && rhkyc) {
    await createClubMembership(sarah.id, rhkyc.id, 'member');
    if (rhkycDragon) await createFleetMembership(sarah.id, rhkycDragon.id, 'member');
    if (rhkycJ70) await createFleetMembership(sarah.id, rhkycJ70.id, 'captain');
  }

  // Mike Thompson - SFYC member, Dragon and 420 fleets
  const mike = users.find(u => u.email === 'mike.thompson@racing.com');
  const sfyc = clubs.find(c => c.slug === 'sfyc');
  const sfycDragon = fleets.find(f => f.slug === 'sfyc-dragon');
  const sfyc420 = fleets.find(f => f.slug === 'sfyc-420');

  if (mike && sfyc) {
    await createClubMembership(mike.id, sfyc.id, 'admin');
    if (sfycDragon) await createFleetMembership(mike.id, sfycDragon.id, 'owner');
    if (sfyc420) await createFleetMembership(mike.id, sfyc420.id, 'member');
  }

  // Emma Wilson - RSYS member, Laser and Optimist fleets
  const emma = users.find(u => u.email === 'emma.wilson@yacht.club');
  const rsys = clubs.find(c => c.slug === 'rsys');
  const rsysLaser = fleets.find(f => f.slug === 'rsys-laser');
  const rsysOpti = fleets.find(f => f.slug === 'rsys-optimist');

  if (emma && rsys) {
    await createClubMembership(emma.id, rsys.id, 'member');
    if (rsysLaser) await createFleetMembership(emma.id, rsysLaser.id, 'member');
    if (rsysOpti) await createFleetMembership(emma.id, rsysOpti.id, 'coach');
  }

  // James Rodriguez - MYC and RHKYC member, J/70 fleets
  const james = users.find(u => u.email === 'james.rodriguez@fleet.com');
  const myc = clubs.find(c => c.slug === 'myc');
  const mycJ70 = fleets.find(f => f.slug === 'myc-j70');

  if (james) {
    if (myc) await createClubMembership(james.id, myc.id, 'member');
    if (rhkyc) await createClubMembership(james.id, rhkyc.id, 'member');
    if (mycJ70) await createFleetMembership(james.id, mycJ70.id, 'member');
    if (rhkycJ70) await createFleetMembership(james.id, rhkycJ70.id, 'member');
  }

  // Coach Anderson - SFYC and RHKYC
  const coach = users.find(u => u.email === 'coach.anderson@sailing.com');
  if (coach) {
    if (sfyc) await createClubMembership(coach.id, sfyc.id, 'coach');
    if (rhkyc) await createClubMembership(coach.id, rhkyc.id, 'coach');
  }
}

async function createClubMembership(userId, clubId, role) {
  try {
    const { error } = await supabase
      .from('club_members')
      .upsert({
        user_id: userId,
        club_id: clubId,
        role: role,
        is_active: true,
        joined_at: new Date().toISOString(),
      }, { onConflict: 'user_id,club_id' });

    if (error) throw error;
    console.log(`  ✓ Added club membership: ${role}`);
  } catch (error) {
    console.error(`  ❌ Error creating club membership:`, error.message);
  }
}

async function createFleetMembership(userId, fleetId, role) {
  try {
    const { error } = await supabase
      .from('fleet_members')
      .upsert({
        user_id: userId,
        fleet_id: fleetId,
        role: role,
        status: 'active',
        joined_at: new Date().toISOString(),
      }, { onConflict: 'user_id,fleet_id' });

    if (error) throw error;
    console.log(`  ✓ Added fleet membership: ${role}`);
  } catch (error) {
    console.error(`  ❌ Error creating fleet membership:`, error.message);
  }
}

async function createClubEvents(clubs, users) {
  console.log('\n📅 Creating upcoming club events...');

  const now = new Date();
  const events = [];

  // RHKYC Events
  const rhkyc = clubs.find(c => c.slug === 'rhkyc');
  if (rhkyc) {
    events.push({
      club_id: rhkyc.id,
      title: 'Spring Dragon Championship 2025',
      description: 'Annual spring championship for Dragon class',
      event_type: 'regatta',
      start_date: formatDate(addMonths(now, 1)),
      end_date: formatDate(addMonths(now, 1)),
      venue_id: null,
      location_name: 'Victoria Harbour',
      location_coordinates: { lat: 22.2793, lng: 114.1628 },
      boat_classes: ['Dragon'],
      status: 'registration_open',
      visibility: 'public',
      registration_fee: 500,
      created_by: users[0]?.id,
    });

    events.push({
      club_id: rhkyc.id,
      title: 'J/70 Winter Series - Race 3',
      description: 'Third race of the winter series',
      event_type: 'race_series',
      start_date: formatDate(addMonths(now, 0.5)),
      end_date: formatDate(addMonths(now, 0.5)),
      location_name: 'Hong Kong Waters',
      boat_classes: ['J/70'],
      status: 'published',
      visibility: 'public',
      created_by: users[0]?.id,
    });
  }

  // SFYC Events
  const sfyc = clubs.find(c => c.slug === 'sfyc');
  if (sfyc) {
    events.push({
      club_id: sfyc.id,
      title: 'Bay Challenge Regatta',
      description: 'Multi-class regatta on San Francisco Bay',
      event_type: 'regatta',
      start_date: formatDate(addMonths(now, 2)),
      end_date: formatDate(addMonths(now, 2)),
      location_name: 'San Francisco Bay',
      location_coordinates: { lat: 37.8651, lng: -122.4822 },
      boat_classes: ['Dragon', 'J/70', 'Laser'],
      status: 'published',
      visibility: 'public',
      registration_fee: 350,
      created_by: users[1]?.id,
    });
  }

  // RSYS Events
  const rsys = clubs.find(c => c.slug === 'rsys');
  if (rsys) {
    events.push({
      club_id: rsys.id,
      title: 'Sydney Harbour Sprint Series',
      description: 'Fast-paced Laser racing',
      event_type: 'race_series',
      start_date: formatDate(addMonths(now, 1.5)),
      end_date: formatDate(addMonths(now, 1.5)),
      location_name: 'Sydney Harbour',
      boat_classes: ['Laser'],
      status: 'registration_open',
      visibility: 'public',
      created_by: users[2]?.id,
    });
  }

  // MYC Events
  const myc = clubs.find(c => c.slug === 'myc');
  if (myc) {
    events.push({
      club_id: myc.id,
      title: 'Miami J/70 Midwinters',
      description: 'Premier J/70 winter regatta',
      event_type: 'regatta',
      start_date: formatDate(addMonths(now, 3)),
      end_date: formatDate(addMonths(now, 3)),
      location_name: 'Biscayne Bay',
      boat_classes: ['J/70'],
      status: 'published',
      visibility: 'public',
      registration_fee: 450,
      created_by: users[3]?.id,
    });
  }

  for (const eventData of events) {
    try {
      const { error } = await supabase
        .from('club_events')
        .insert(eventData);

      if (error) throw error;
      console.log(`  ✓ Created event: ${eventData.title}`);
    } catch (error) {
      console.error(`  ❌ Error creating event:`, error.message);
    }
  }
}

async function createRaceHistory(users) {
  console.log('\n🏁 Creating race history for pattern detection...');

  const now = new Date();
  const races = [];

  // Sarah's race history (Dragon and J/70, mostly RHKYC)
  const sarah = users.find(u => u.email === 'sarah.chen@sailing.com');
  if (sarah) {
    // Spring Championships (annual pattern)
    for (let year = 0; year < 3; year++) {
      races.push({
        name: 'Spring Dragon Championship',
        created_by: sarah.id,
        start_date: formatDate(new Date(now.getFullYear() - year, 3, 15)), // April
        metadata: {
          venue_name: 'Victoria Harbour',
          class: 'Dragon',
          venue_coordinates: { lat: 22.2793, lng: 114.1628 },
        },
        status: 'completed',
      });
    }

    // Regular J/70 racing (venue preference)
    for (let i = 0; i < 5; i++) {
      races.push({
        name: `J/70 Race Day ${i + 1}`,
        created_by: sarah.id,
        start_date: formatDate(addMonths(now, -i * 0.5)),
        metadata: {
          venue_name: 'Hong Kong Waters',
          class: 'J/70',
        },
        status: 'completed',
      });
    }
  }

  // Mike's race history (Laser and 420, SFYC)
  const mike = users.find(u => u.email === 'mike.thompson@racing.com');
  if (mike) {
    // Bay Challenge (annual pattern)
    for (let year = 0; year < 2; year++) {
      races.push({
        name: 'Bay Challenge Regatta',
        created_by: mike.id,
        start_date: formatDate(new Date(now.getFullYear() - year, 5, 20)), // June
        metadata: {
          venue_name: 'San Francisco Bay',
          class: 'Dragon',
        },
        status: 'completed',
      });
    }

    // Regular 420 racing
    for (let i = 0; i < 4; i++) {
      races.push({
        name: `420 Club Race`,
        created_by: mike.id,
        start_date: formatDate(addMonths(now, -i)),
        metadata: {
          venue_name: 'San Francisco Bay',
          class: '420',
        },
        status: 'completed',
      });
    }
  }

  // Emma's race history (Laser, RSYS)
  const emma = users.find(u => u.email === 'emma.wilson@yacht.club');
  if (emma) {
    for (let i = 0; i < 6; i++) {
      races.push({
        name: `Laser Race ${i + 1}`,
        created_by: emma.id,
        start_date: formatDate(addMonths(now, -i * 0.3)),
        metadata: {
          venue_name: 'Sydney Harbour',
          class: 'Laser',
        },
        status: 'completed',
      });
    }
  }

  for (const raceData of races) {
    try {
      const { error } = await supabase
        .from('regattas')
        .insert(raceData);

      if (error) throw error;
    } catch (error) {
      console.error(`  ❌ Error creating race:`, error.message);
    }
  }

  console.log(`  ✓ Created ${races.length} historical races`);
}

// =====================================================
// Main Execution
// =====================================================

async function main() {
  console.log('🚀 Starting complete demo data seed...\n');
  console.log('This will create:');
  console.log('  - 5 mock users with authentication');
  console.log('  - 4 yacht clubs');
  console.log('  - 8 fleets across clubs');
  console.log('  - Club and fleet memberships');
  console.log('  - Upcoming club events');
  console.log('  - Historical race data for patterns\n');

  try {
    const users = await createUsers();
    const clubs = await createClubs();
    const fleets = await createFleets(clubs);
    await createMemberships(users, clubs, fleets);
    await createClubEvents(clubs, users);
    await createRaceHistory(users);

    console.log('\n✅ Demo data seed complete!\n');
    console.log('📧 Mock User Logins:');
    console.log('─'.repeat(60));
    MOCK_USERS.forEach(user => {
      console.log(`  ${user.full_name.padEnd(20)} ${user.email.padEnd(30)} ${user.password}`);
    });
    console.log('─'.repeat(60));
    console.log('\n💡 Use these credentials on the login page');
    console.log('💡 Run: npx supabase functions invoke refresh-race-suggestions');
    console.log('   to generate suggestions for these users\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
