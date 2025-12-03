#!/usr/bin/env node

/**
 * Comprehensive Dragon Fleet Demo Data Seed Script
 *
 * Creates:
 * - Demo users (Sarah Chen + 10 Dragon sailors)
 * - Fleet memberships for RHKYC Dragon Fleet
 * - Upcoming Dragon races
 * - Race entries and participants
 * - Makes Fleet Competitors card functional
 *
 * Run: node scripts/seed-dragon-fleet-demo.mjs
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
// CONSTANTS
// =====================================================

const DRAGON_CLASS_ID = '130829e3-05dd-4ab3-bea2-e0231c12064a';
const RHKYC_CLUB_ID = 'rhkyc';
const RHKYC_DRAGON_FLEET_ID = '63422b6f-429a-4557-aab9-2a928316cbe5';

// =====================================================
// DEMO USERS
// =====================================================

const DEMO_USERS = [
  {
    email: 'sarah.chen@sailing.com',
    name: 'Sarah Chen',
    password: 'demo1234',
    boat_name: 'Phoenix Rising',
    sail_number: 'HKG 111',
    role: 'Skipper',
  },
  {
    email: 'marcus.thompson@racing.com',
    name: 'Marcus Thompson',
    password: 'demo1234',
    boat_name: 'Thunder',
    sail_number: 'HKG 888',
    role: 'Skipper',
  },
  {
    email: 'emma.wilson@yacht.club',
    name: 'Emma Wilson',
    password: 'demo1234',
    boat_name: 'Lightning Strike',
    sail_number: 'HKG 999',
    role: 'Skipper',
  },
  {
    email: 'david.lee@dragon.hk',
    name: 'David Lee',
    password: 'demo1234',
    boat_name: 'Dragon Master',
    sail_number: 'HKG 777',
    role: 'Skipper',
  },
  {
    email: 'linda.chang@sailing.hk',
    name: 'Linda Chang',
    password: 'demo1234',
    boat_name: 'Sea Spirit',
    sail_number: 'HKG 555',
    role: 'Skipper',
  },
  {
    email: 'michael.wong@dragon.racing',
    name: 'Michael Wong',
    password: 'demo1234',
    boat_name: 'Victory',
    sail_number: 'HKG 444',
    role: 'Skipper',
  },
  {
    email: 'jennifer.tan@yacht.hk',
    name: 'Jennifer Tan',
    password: 'demo1234',
    boat_name: 'Blue Dragon',
    sail_number: 'HKG 333',
    role: 'Skipper',
  },
  {
    email: 'robert.kim@sailing.com',
    name: 'Robert Kim',
    password: 'demo1234',
    boat_name: 'Tsunami',
    sail_number: 'HKG 222',
    role: 'Skipper',
  },
  {
    email: 'amy.patel@dragon.hk',
    name: 'Amy Patel',
    password: 'demo1234',
    boat_name: 'Storm Chaser',
    sail_number: 'HKG 666',
    role: 'Skipper',
  },
  {
    email: 'james.rodriguez@racing.com',
    name: 'James Rodriguez',
    password: 'demo1234',
    boat_name: 'Wind Dancer',
    sail_number: 'HKG 123',
    role: 'Skipper',
  },
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getUpcomingDate(daysFromNow, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

async function createUser(userData) {
  try {
    // Check if user already exists
    const { data: existingAuth, error: checkError } = await supabase.auth.admin.listUsers();

    const existing = existingAuth?.users?.find(u => u.email === userData.email);

    if (existing) {
      console.log(`  ℹ️  User already exists: ${userData.email}`);
      return existing.id;
    }

    // Create auth user with metadata
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.name,
      },
    });

    if (authError) {
      console.error(`  ❌ Auth error for ${userData.email}:`, authError.message);
      return null;
    }

    // Create sailor profile
    const { error: profileError } = await supabase
      .from('sailor_profiles')
      .upsert({
        user_id: authData.user.id,
        home_club: RHKYC_CLUB_ID,
        boat_class_preferences: [DRAGON_CLASS_ID],
        experience_level: 'intermediate',
        sailing_since: new Date().getFullYear() - 5,
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error(`  ❌ Profile error for ${userData.email}:`, profileError.message);
      return null;
    }

    console.log(`  ✅ Created user: ${userData.name} (${userData.email})`);
    return authData.user.id;
  } catch (error) {
    console.error(`  ❌ Error creating user ${userData.email}:`, error.message);
    return null;
  }
}

async function createBoat(userId, userData) {
  try {
    const { data: boat, error } = await supabase
      .from('sailor_boats')
      .insert({
        sailor_id: userId,
        name: userData.boat_name,
        sail_number: userData.sail_number,
        class_id: DRAGON_CLASS_ID,
        status: 'active',
        is_primary: true,
      })
      .select()
      .single();

    if (error) {
      console.error(`  ❌ Boat error for ${userData.name}:`, error.message);
      return null;
    }

    console.log(`  ✅ Created boat: ${userData.boat_name} (${userData.sail_number})`);
    return boat.id;
  } catch (error) {
    console.error(`  ❌ Error creating boat for ${userData.name}:`, error.message);
    return null;
  }
}

async function addToFleet(userId, fleetId) {
  try {
    // Check if already a member
    const { data: existing } = await supabase
      .from('fleet_members')
      .select('id')
      .eq('user_id', userId)
      .eq('fleet_id', fleetId)
      .single();

    if (existing) {
      return true;
    }

    const { error } = await supabase
      .from('fleet_members')
      .insert({
        fleet_id: fleetId,
        user_id: userId,
        role: 'member',
        status: 'active',
        joined_at: new Date().toISOString(),
      });

    if (error) {
      console.error(`  ❌ Fleet membership error:`, error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`  ❌ Error adding to fleet:`, error.message);
    return false;
  }
}

// =====================================================
// MAIN SEED FUNCTION
// =====================================================

async function seedDragonFleetDemo() {
  console.log('\n🏁 Starting Dragon Fleet Demo Data Seed\n');
  console.log('=' .repeat(60));

  const userMapping = new Map(); // email -> { userId, boatId }

  // =====================================================
  // STEP 1: Create Users and Boats
  // =====================================================

  console.log('\n📝 Step 1: Creating Demo Users and Boats\n');

  for (const userData of DEMO_USERS) {
    const userId = await createUser(userData);
    if (!userId) continue;

    const boatId = await createBoat(userId, userData);

    userMapping.set(userData.email, { userId, boatId, userData });
  }

  console.log(`\n✅ Created ${userMapping.size} users with boats`);

  // =====================================================
  // STEP 2: Add Users to RHKYC Dragon Fleet
  // =====================================================

  console.log('\n🚢 Step 2: Adding Users to RHKYC Dragon Fleet\n');

  let fleetMemberCount = 0;
  for (const [email, data] of userMapping) {
    const success = await addToFleet(data.userId, RHKYC_DRAGON_FLEET_ID);
    if (success) {
      fleetMemberCount++;
      console.log(`  ✅ Added ${data.userData.name} to RHKYC Dragon Fleet`);
    }
  }

  console.log(`\n✅ Added ${fleetMemberCount} members to fleet`);

  // =====================================================
  // STEP 3: Create Upcoming Dragon Races
  // =====================================================

  console.log('\n🏆 Step 3: Creating Upcoming Dragon Races\n');

  const races = [
    {
      event_name: 'Spring Dragon Championship 2025',
      event_type: 'championship',
      start_date: getUpcomingDate(30),
      end_date: getUpcomingDate(32),
      registration_opens: getUpcomingDate(0),
      registration_deadline: getUpcomingDate(25),
      entry_fee: 500.00,
      currency: 'HKD',
      max_entries: 30,
    },
    {
      event_name: 'Hong Kong Dragon Regatta - Race 1',
      event_type: 'weekend_regatta',
      start_date: getUpcomingDate(15),
      end_date: getUpcomingDate(15),
      registration_opens: getUpcomingDate(0),
      registration_deadline: getUpcomingDate(12),
      entry_fee: 200.00,
      currency: 'HKD',
      max_entries: 20,
    },
    {
      event_name: 'Victoria Harbour Dragon Cup',
      event_type: 'championship',
      start_date: getUpcomingDate(45),
      end_date: getUpcomingDate(47),
      registration_opens: getUpcomingDate(0),
      registration_deadline: getUpcomingDate(40),
      entry_fee: 800.00,
      currency: 'HKD',
      max_entries: 25,
    },
  ];

  const createdRaces = [];

  // Get first user ID for created_by
  const firstUserId = Array.from(userMapping.values())[0]?.userId;

  if (!firstUserId) {
    console.log('⚠️  No users found, cannot create races');
    return;
  }

  for (const raceData of races) {
    try {
      // First create regatta entry (needed for race_participants foreign key)
      const { data: regatta, error: regattaError } = await supabase
        .from('regattas')
        .insert({
          name: raceData.event_name,
          start_date: raceData.start_date,
          end_date: raceData.end_date,
          created_by: firstUserId,
        })
        .select()
        .single();

      if (regattaError) {
        console.error(`  ❌ Error creating regatta ${raceData.event_name}:`, regattaError.message);
        continue;
      }

      // Then create club_race_calendar entry
      const { data: race, error } = await supabase
        .from('club_race_calendar')
        .insert({
          club_id: RHKYC_CLUB_ID,
          event_name: raceData.event_name,
          event_type: raceData.event_type,
          start_date: raceData.start_date,
          end_date: raceData.end_date,
          registration_opens: raceData.registration_opens,
          registration_deadline: raceData.registration_deadline,
          entry_fee: raceData.entry_fee,
          currency: raceData.currency,
          max_entries: raceData.max_entries,
          classes_included: ['Dragon'],
        })
        .select()
        .single();

      if (error) {
        console.error(`  ❌ Error creating calendar entry ${raceData.event_name}:`, error.message);
        continue;
      }

      // Store both IDs (calendar for UI, regatta for participants)
      createdRaces.push({
        ...race,
        regattaId: regatta.id,
      });
      console.log(`  ✅ Created race: ${raceData.event_name}`);
    } catch (error) {
      console.error(`  ❌ Error:`, error.message);
    }
  }

  console.log(`\n✅ Created ${createdRaces.length} races`);

  // =====================================================
  // STEP 4: Create Race Entries
  // =====================================================

  console.log('\n📋 Step 4: Creating Race Entries and Participants\n');

  if (createdRaces.length === 0) {
    console.log('⚠️  No races created, skipping entries');
  } else {
    // Register first 8 users for the Spring Championship
    const mainRace = createdRaces[0];
    const usersToRegister = Array.from(userMapping.values()).slice(0, 8);

    // Get first user ID for created_by field
    const firstUser = Array.from(userMapping.values())[0];

    const statuses = ['confirmed', 'confirmed', 'confirmed', 'confirmed', 'registered', 'registered', 'tentative', 'tentative'];
    const visibilities = ['public', 'public', 'public', 'public', 'public', 'public', 'fleet', 'fleet'];

    for (let i = 0; i < usersToRegister.length; i++) {
      const { userId, boatId, userData } = usersToRegister[i];
      const status = statuses[i];
      const visibility = visibilities[i];

      try {
        // Create race participant (for Fleet Competitors visibility)
        // Use regattaId (from regattas table) not race.id (from club_race_calendar)
        const { error: participantError } = await supabase
          .from('race_participants')
          .insert({
            regatta_id: mainRace.regattaId,
            user_id: userId,
            fleet_id: RHKYC_DRAGON_FLEET_ID,
            boat_name: userData.boat_name,
            sail_number: userData.sail_number,
            status: status,
            visibility: visibility,
            registered_at: new Date().toISOString(),
          });

        if (participantError) {
          console.error(`  ❌ Participant error for ${userData.name}:`, participantError.message);
          continue;
        }

        console.log(`  ✅ Registered ${userData.name} - ${userData.boat_name} (${status})`);
      } catch (error) {
        console.error(`  ❌ Error registering ${userData.name}:`, error.message);
      }
    }

    console.log(`\n✅ Created ${usersToRegister.length} race entries for Spring Championship`);
  }

  // =====================================================
  // FINAL SUMMARY
  // =====================================================

  // =====================================================
  // FINAL STEP: Link calendar to regattas
  // =====================================================

  console.log('\n🔗 Step 5: Linking Calendar Entries to Regattas\n');

  for (const race of createdRaces) {
    if (race.regattaId) {
      try {
        // Try to update club_race_calendar with regatta_id
        // This will only work if the column exists
        const { error } = await supabase
          .from('club_race_calendar')
          .update({ regatta_id: race.regattaId })
          .eq('id', race.id);

        if (!error) {
          console.log(`  ✅ Linked "${race.event_name}" to regatta`);
        } else if (error.message.includes('column "regatta_id"')) {
          console.log(`  ⚠️  Column regatta_id doesn't exist yet - storing mapping for manual update`);
        } else {
          console.error(`  ❌ Error linking ${race.event_name}:`, error.message);
        }
      } catch (error) {
        console.error(`  ❌ Error:`, error.message);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 Dragon Fleet Demo Data Seed Complete!\n');

  console.log('📊 Summary:');
  console.log(`  • Users created: ${userMapping.size}`);
  console.log(`  • Fleet members: ${fleetMemberCount}`);
  console.log(`  • Races created: ${createdRaces.length}`);
  console.log(`  • Spring Championship entries: 8`);

  console.log('\n📧 Demo User Logins:');
  console.log('  Email: sarah.chen@sailing.com');
  console.log('  Password: demo1234');
  console.log('\n  Email: marcus.thompson@racing.com');
  console.log('  Password: demo1234');

  console.log('\n🧪 Test the Fleet Competitors Card:');
  console.log('  1. Login as any demo user');
  console.log('  2. Go to Races tab');
  console.log('  3. Open "Spring Dragon Championship 2025"');
  console.log('  4. Scroll to "Fleet Competitors" card');
  console.log('  5. You should see 7-8 other competitors!\n');

  console.log('✅ Done!\n');
}

// =====================================================
// RUN
// =====================================================

seedDragonFleetDemo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal Error:', error);
    process.exit(1);
  });
