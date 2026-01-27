#!/usr/bin/env node

/**
 * Sailors Tab Demo Data Seed Script
 *
 * Populates all four sections of the Sailors tab with realistic content
 * for the demo sailor user (kyle / 51241049-02ed-4e31-b8c6-39af7c9d4d50):
 *
 *   1. Following   – races from users the demo sailor follows
 *   2. Fleet Activity – races from fleet mates
 *   3. Class Experts  – top-scoring Dragon sailors via get_class_experts()
 *   4. Discover       – public races from unfollowed users
 *
 * Run: node scripts/seed-sailors-tab-demo.mjs
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
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// =====================================================
// CONSTANTS
// =====================================================

const DEMO_SAILOR_ID = '51241049-02ed-4e31-b8c6-39af7c9d4d50';
const DRAGON_CLASS_ID = '130829e3-05dd-4ab3-bea2-e0231c12064a';

// Deterministic IDs for idempotency
const USER_IDS = {
  sarahChen:       'b2000000-0000-0000-0000-000000000001',
  mikeThompson:    'b2000000-0000-0000-0000-000000000002',
  emmaWilson:      'b2000000-0000-0000-0000-000000000003',
  jamesRodriguez:  'b2000000-0000-0000-0000-000000000004',
  kenjiTanaka:     'b2000000-0000-0000-0000-000000000005',
  oliviaHartley:   'b2000000-0000-0000-0000-000000000006',
  lucaFerretti:    'b2000000-0000-0000-0000-000000000007',
};

const FLEET_ID = 'b2100000-0000-0000-0000-000000000001';

const BOAT_IDS = {
  demoSailor:      'b3000000-0000-0000-0000-000000000000',
  sarahChen:       'b3000000-0000-0000-0000-000000000001',
  mikeThompson:    'b3000000-0000-0000-0000-000000000002',
  emmaWilson:      'b3000000-0000-0000-0000-000000000003',
  jamesRodriguez:  'b3000000-0000-0000-0000-000000000004',
  kenjiTanaka:     'b3000000-0000-0000-0000-000000000005',
  oliviaHartley:   'b3000000-0000-0000-0000-000000000006',
  lucaFerretti:    'b3000000-0000-0000-0000-000000000007',
};

// Regatta IDs (per user, numbered)
const REGATTA_IDS = {
  sarah1:  'b4000000-0000-0000-0000-000000000101',
  sarah2:  'b4000000-0000-0000-0000-000000000102',
  sarah3:  'b4000000-0000-0000-0000-000000000103',
  sarah4:  'b4000000-0000-0000-0000-000000000104',
  mike1:   'b4000000-0000-0000-0000-000000000201',
  mike2:   'b4000000-0000-0000-0000-000000000202',
  mike3:   'b4000000-0000-0000-0000-000000000203',
  emma1:   'b4000000-0000-0000-0000-000000000301',
  emma2:   'b4000000-0000-0000-0000-000000000302',
  james1:  'b4000000-0000-0000-0000-000000000401',
  james2:  'b4000000-0000-0000-0000-000000000402',
  kenji1:  'b4000000-0000-0000-0000-000000000501',
  kenji2:  'b4000000-0000-0000-0000-000000000502',
  kenji3:  'b4000000-0000-0000-0000-000000000503',
  kenji4:  'b4000000-0000-0000-0000-000000000504',
  olivia1: 'b4000000-0000-0000-0000-000000000601',
  olivia2: 'b4000000-0000-0000-0000-000000000602',
  olivia3: 'b4000000-0000-0000-0000-000000000603',
  luca1:   'b4000000-0000-0000-0000-000000000701',
  luca2:   'b4000000-0000-0000-0000-000000000702',
  luca3:   'b4000000-0000-0000-0000-000000000703',
};

const RESULT_IDS = {
  kenji1:  'b5000000-0000-0000-0000-000000000501',
  kenji2:  'b5000000-0000-0000-0000-000000000502',
  kenji3:  'b5000000-0000-0000-0000-000000000503',
  kenji4:  'b5000000-0000-0000-0000-000000000504',
  olivia1: 'b5000000-0000-0000-0000-000000000601',
  olivia2: 'b5000000-0000-0000-0000-000000000602',
  olivia3: 'b5000000-0000-0000-0000-000000000603',
  sarah1:  'b5000000-0000-0000-0000-000000000101',
  sarah2:  'b5000000-0000-0000-0000-000000000102',
  sarah3:  'b5000000-0000-0000-0000-000000000103',
  sarah4:  'b5000000-0000-0000-0000-000000000104',
  mike1:   'b5000000-0000-0000-0000-000000000201',
  mike2:   'b5000000-0000-0000-0000-000000000202',
  mike3:   'b5000000-0000-0000-0000-000000000203',
};

const FLEET_MEMBER_IDS = {
  demoSailor:     'b6000000-0000-0000-0000-000000000000',
  sarahChen:      'b6000000-0000-0000-0000-000000000001',
  mikeThompson:   'b6000000-0000-0000-0000-000000000002',
  emmaWilson:     'b6000000-0000-0000-0000-000000000003',
  jamesRodriguez: 'b6000000-0000-0000-0000-000000000004',
};

// =====================================================
// HELPERS
// =====================================================

function daysFromNow(d) {
  return new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Ensure auth.users entry exists, return the user id.
 * Uses admin API — creates if missing, returns existing if found.
 */
async function ensureAuthUser(id, email, fullName) {
  // Try to fetch existing user first
  const { data: existingUser } = await supabase.auth.admin.getUserById(id);
  if (existingUser?.user) {
    console.log(`  ✓ Auth user exists: ${email}`);
    return existingUser.user.id;
  }

  // Create new user with deterministic ID
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'demo-password-2026!',
    email_confirm: true,
    user_metadata: { full_name: fullName },
    // Supabase doesn't let us set the ID directly in createUser,
    // so we'll use SQL for the ID if needed
  });

  if (error) {
    // Might already exist with different ID — look up by email
    const { data: listData } = await supabase.auth.admin.listUsers();
    const found = listData?.users?.find((u) => u.email === email);
    if (found) {
      console.log(`  ✓ Auth user found by email: ${email} (${found.id})`);
      return found.id;
    }
    console.error(`  ✗ Failed to create auth user ${email}:`, error.message);
    return null;
  }

  console.log(`  + Created auth user: ${email} (${data.user.id})`);
  return data.user.id;
}

/**
 * Ensure auth user exists with specific ID using raw SQL.
 * This is the reliable way to create users with deterministic IDs.
 */
async function ensureAuthUserWithId(targetId, email, fullName) {
  // Check if user exists by ID
  const { data: existingUser } = await supabase.auth.admin.getUserById(targetId);
  if (existingUser?.user) {
    console.log(`  ✓ Auth user exists: ${email} (${targetId})`);
    return targetId;
  }

  // Check if user exists by email
  const { data: listData } = await supabase.auth.admin.listUsers();
  const foundByEmail = listData?.users?.find((u) => u.email === email);
  if (foundByEmail) {
    console.log(`  ✓ Auth user exists by email: ${email} (${foundByEmail.id})`);
    return foundByEmail.id;
  }

  // Create via admin API (ID will be auto-generated, but we'll use it)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'demo-password-2026!',
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    console.error(`  ✗ Failed to create auth user ${email}:`, error.message);
    return null;
  }

  const actualId = data.user.id;

  // If the auto-generated ID doesn't match, update via SQL
  if (actualId !== targetId) {
    console.log(`  ~ Auth user created with ID ${actualId}, updating to ${targetId}...`);
    // Update all references: auth.users, profiles, etc.
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `UPDATE auth.users SET id = '${targetId}' WHERE id = '${actualId}'`,
    });

    if (updateError) {
      // RPC might not exist — use the auto-generated ID instead
      console.log(`  ~ Using auto-generated ID: ${actualId} (cannot reassign)`);
      return actualId;
    }
    console.log(`  + Created auth user: ${email} (${targetId})`);
    return targetId;
  }

  console.log(`  + Created auth user: ${email} (${actualId})`);
  return actualId;
}

// =====================================================
// USER DEFINITIONS
// =====================================================

const USERS = [
  {
    key: 'sarahChen',
    targetId: USER_IDS.sarahChen,
    email: 'sarah.chen@demo.regattaflow.app',
    fullName: 'Sarah Chen',
    emoji: '⛵',
    color: '#FF6B6B',
    experience: 'advanced',
    boatName: 'Red Phoenix',
    sailNumber: 'HKG 188',
  },
  {
    key: 'mikeThompson',
    targetId: USER_IDS.mikeThompson,
    email: 'mike.thompson@demo.regattaflow.app',
    fullName: 'Mike Thompson',
    emoji: '🌊',
    color: '#4ECDC4',
    experience: 'advanced',
    boatName: 'Wave Rider',
    sailNumber: 'HKG 42',
  },
  {
    key: 'emmaWilson',
    targetId: USER_IDS.emmaWilson,
    email: 'emma.wilson@demo.regattaflow.app',
    fullName: 'Emma Wilson',
    emoji: '🏄‍♀️',
    color: '#9B59B6',
    experience: 'intermediate',
    boatName: 'Purple Haze',
    sailNumber: 'HKG 77',
  },
  {
    key: 'jamesRodriguez',
    targetId: USER_IDS.jamesRodriguez,
    email: 'james.rodriguez@demo.regattaflow.app',
    fullName: 'James Rodriguez',
    emoji: '🔥',
    color: '#E67E22',
    experience: 'intermediate',
    boatName: 'Fuego',
    sailNumber: 'HKG 55',
  },
  {
    key: 'kenjiTanaka',
    targetId: USER_IDS.kenjiTanaka,
    email: 'kenji.tanaka@demo.regattaflow.app',
    fullName: 'Kenji Tanaka',
    emoji: '🎌',
    color: '#E74C3C',
    experience: 'advanced',
    boatName: 'Samurai Wind',
    sailNumber: 'JPN 7',
  },
  {
    key: 'oliviaHartley',
    targetId: USER_IDS.oliviaHartley,
    email: 'olivia.hartley@demo.regattaflow.app',
    fullName: 'Olivia Hartley',
    emoji: '🌟',
    color: '#F1C40F',
    experience: 'advanced',
    boatName: 'Golden Star',
    sailNumber: 'GBR 21',
  },
  {
    key: 'lucaFerretti',
    targetId: USER_IDS.lucaFerretti,
    email: 'luca.ferretti@demo.regattaflow.app',
    fullName: 'Luca Ferretti',
    emoji: '🇮🇹',
    color: '#27AE60',
    experience: 'advanced',
    boatName: 'Vento Verde',
    sailNumber: 'ITA 33',
  },
];

// =====================================================
// REGATTA DATA
// =====================================================

const REGATTAS = [
  // --- Sarah Chen (4 races: 3 public, 1 fleet) ---
  {
    id: REGATTA_IDS.sarah1,
    name: 'Dragon Spring Cup 2026',
    start_date: daysFromNow(7),
    created_by: 'sarahChen',
    content_visibility: 'public',
    prep_notes: 'Planning pin-end start if wind stays ENE. Need to check forestay tension — been slightly loose. Focus on clean mark roundings, lost too much distance at marks last regatta.',
    tuning_settings: { mast_rake: '6450mm', shroud_tension: '32', jib_halyard: '650mm', backstay: 'moderate', spreader_angle: '165°' },
    post_race_notes: null,
    lessons_learned: null,
  },
  {
    id: REGATTA_IDS.sarah2,
    name: 'RHKYC Wednesday Twilight Series R5',
    start_date: daysFromNow(-5),
    created_by: 'sarahChen',
    content_visibility: 'public',
    prep_notes: 'Light air forecast (8-12kt). Going with full hoist genoa. Crew weight forward.',
    tuning_settings: { mast_rake: '6500mm', shroud_tension: '28', jib_halyard: '620mm', backstay: 'light' },
    post_race_notes: 'Great start, held lane for first beat. Gained 3 places on the run by gybing early onto port. Finished 3rd overall.',
    lessons_learned: ['Gybe earlier on downwind in tide', 'Light air crew placement critical', 'Pin end was heavily favored'],
  },
  {
    id: REGATTA_IDS.sarah3,
    name: 'Asia Pacific Dragon Championship 2026',
    start_date: daysFromNow(21),
    created_by: 'sarahChen',
    content_visibility: 'public',
    prep_notes: 'Major event — 3-day regatta. Focusing on consistency over individual race wins. Need to nail boat handling in 15kt+ conditions. Reviewing course strategy from 2025 event.',
    tuning_settings: null,
    post_race_notes: null,
    lessons_learned: null,
  },
  {
    id: REGATTA_IDS.sarah4,
    name: 'RHKYC Wednesday Twilight Series R4',
    start_date: daysFromNow(-12),
    created_by: 'sarahChen',
    content_visibility: 'fleet',
    prep_notes: 'Strong NE wind forecast (18-22kt). Reefing the main. Short-handed today with 2 crew.',
    tuning_settings: { mast_rake: '6400mm', shroud_tension: '36', backstay: 'heavy', cunningham: 'max' },
    post_race_notes: 'Overpowered on first beat, should have reefed earlier. Recovered with good downwind angles. Finished 7th.',
    lessons_learned: ['Reef earlier in gusts above 20kt', 'Backstay tension critical for pointing'],
  },

  // --- Mike Thompson (3 races: 2 public, 1 fleet) ---
  {
    id: REGATTA_IDS.mike1,
    name: 'Dragon Spring Cup 2026',
    start_date: daysFromNow(7),
    created_by: 'mikeThompson',
    content_visibility: 'public',
    prep_notes: 'Targeting top 5. New spinnaker from North Sails, first race with it. Focus on starts — need to be more aggressive at the pin end.',
    tuning_settings: null,
    post_race_notes: null,
    lessons_learned: null,
  },
  {
    id: REGATTA_IDS.mike2,
    name: 'RHKYC Wednesday Twilight Series R5',
    start_date: daysFromNow(-5),
    created_by: 'mikeThompson',
    content_visibility: 'fleet',
    prep_notes: 'Testing new kite in light conditions. Crew doing practice sets beforehand.',
    tuning_settings: null,
    post_race_notes: 'New spinnaker flew well in 10kt. Slightly slower in the light patches — may need to adjust sheet lead. 5th place.',
    lessons_learned: ['New kite needs outboard sheet lead in light air'],
  },
  {
    id: REGATTA_IDS.mike3,
    name: 'Clearwater Bay Dragon Open',
    start_date: daysFromNow(14),
    created_by: 'mikeThompson',
    content_visibility: 'public',
    prep_notes: 'Good venue for us — historically strong in the Clearwater Bay chop. Crew training session planned for Saturday before.',
    tuning_settings: null,
    post_race_notes: null,
    lessons_learned: null,
  },

  // --- Emma Wilson (2 races: 1 public, 1 fleet) ---
  {
    id: REGATTA_IDS.emma1,
    name: 'Dragon Spring Cup 2026',
    start_date: daysFromNow(7),
    created_by: 'emmaWilson',
    content_visibility: 'public',
    prep_notes: 'First Dragon regatta since upgrading sails. New jib from Doyle. Nervous but excited.',
    tuning_settings: { mast_rake: '6480mm', shroud_tension: '30', jib_halyard: '640mm' },
    post_race_notes: null,
    lessons_learned: null,
  },
  {
    id: REGATTA_IDS.emma2,
    name: 'RHKYC Wednesday Twilight Series R5',
    start_date: daysFromNow(-5),
    created_by: 'emmaWilson',
    content_visibility: 'fleet',
    prep_notes: 'Practice race to break in new sails. Low pressure, just getting comfortable.',
    tuning_settings: { mast_rake: '6480mm', shroud_tension: '29' },
    post_race_notes: null,
    lessons_learned: null,
  },

  // --- James Rodriguez (2 races: 1 public, 1 fleet) ---
  {
    id: REGATTA_IDS.james1,
    name: 'Clearwater Bay Dragon Open',
    start_date: daysFromNow(14),
    created_by: 'jamesRodriguez',
    content_visibility: 'fleet',
    prep_notes: null,
    tuning_settings: { mast_rake: '6460mm', shroud_tension: '31', backstay: 'medium' },
    post_race_notes: null,
    lessons_learned: null,
  },
  {
    id: REGATTA_IDS.james2,
    name: 'RHKYC Wednesday Twilight Series R5',
    start_date: daysFromNow(-5),
    created_by: 'jamesRodriguez',
    content_visibility: 'public',
    prep_notes: null,
    tuning_settings: { mast_rake: '6460mm', shroud_tension: '31' },
    post_race_notes: 'Decent race, stayed out of trouble. Gained on starboard tack shifts. 9th place.',
    lessons_learned: ['Starboard tack shifts were key'],
  },

  // --- Kenji Tanaka (4 races: 4 public — top class expert) ---
  {
    id: REGATTA_IDS.kenji1,
    name: 'Dragon Gold Cup 2025',
    start_date: daysFromNow(-14),
    created_by: 'kenjiTanaka',
    content_visibility: 'public',
    prep_notes: 'Target: defend title. Boat fully optimized with new foils. Two practice days planned at venue. Focus on gate starts and short-course tactics.',
    tuning_settings: { mast_rake: '6420mm', shroud_tension: '34', jib_halyard: '660mm', backstay: 'heavy', spreader_angle: '162°', cunningham: 'medium', outhaul: '95%' },
    post_race_notes: 'Won overall! 1st in 3 of 5 races. Key was starting at the boat end and tacking within 30 seconds. The right side paid on every beat in the afternoon seabreeze.',
    lessons_learned: ['Boat-end starts were gold in the sea breeze', 'Right side always paid after 13:00', 'Gate starts: time to the boat = 3 seconds advantage', 'Foil setup was perfect for the chop'],
  },
  {
    id: REGATTA_IDS.kenji2,
    name: 'Asia Pacific Dragon Championship 2026',
    start_date: daysFromNow(21),
    created_by: 'kenjiTanaka',
    content_visibility: 'public',
    prep_notes: 'Defending champion mindset. Training block of 6 sessions before the event. New crew member on bow — need to work on communication. Boat measurement check booked for Feb 10.',
    tuning_settings: { mast_rake: '6430mm', shroud_tension: '33', jib_halyard: '655mm', backstay: 'medium-heavy', spreader_angle: '163°' },
    post_race_notes: null,
    lessons_learned: null,
  },
  {
    id: REGATTA_IDS.kenji3,
    name: 'Dragon Spring Cup 2026',
    start_date: daysFromNow(7),
    created_by: 'kenjiTanaka',
    content_visibility: 'public',
    prep_notes: 'Good warm-up event before Asia Pacifics. Trying slightly more rake for the expected 12-15kt. Priority: clean starts and mark roundings.',
    tuning_settings: { mast_rake: '6440mm', shroud_tension: '32', jib_halyard: '650mm' },
    post_race_notes: null,
    lessons_learned: null,
  },
  {
    id: REGATTA_IDS.kenji4,
    name: 'Clearwater Bay Dragon Open',
    start_date: daysFromNow(-7),
    created_by: 'kenjiTanaka',
    content_visibility: 'public',
    prep_notes: 'Testing new crew combination. Clearwater Bay has good chop practice. Wind should be 15-20kt from the East.',
    tuning_settings: { mast_rake: '6410mm', shroud_tension: '35', backstay: 'heavy', cunningham: 'medium' },
    post_race_notes: 'Solid 2nd place. New crew worked well but mark roundings need polish. Lost 1st on final downwind leg — should have gybed earlier.',
    lessons_learned: ['New crew communication improving', 'Earlier gybe in pressure', 'Mast rake was right for the chop'],
  },

  // --- Olivia Hartley (3 races: 3 public — class expert) ---
  {
    id: REGATTA_IDS.olivia1,
    name: 'Dragon Gold Cup 2025',
    start_date: daysFromNow(-14),
    created_by: 'oliviaHartley',
    content_visibility: 'public',
    prep_notes: 'First Gold Cup — aiming for top 10. Focused on boat speed in medium conditions. Crew drills every day this week.',
    tuning_settings: null,
    post_race_notes: 'Finished 3rd overall — beyond expectations! Consistent sailing was key. Never finished outside top 5 in any race. Crew work was excellent.',
    lessons_learned: ['Consistency beats individual heroics', 'Boat speed comes from preparation', 'Stay calm at the start line'],
  },
  {
    id: REGATTA_IDS.olivia2,
    name: 'Dragon Spring Cup 2026',
    start_date: daysFromNow(7),
    created_by: 'oliviaHartley',
    content_visibility: 'public',
    prep_notes: 'Continuing momentum from Gold Cup. New backstay system installed — should help pointing in 12-18kt. Targeting the win.',
    tuning_settings: null,
    post_race_notes: null,
    lessons_learned: null,
  },
  {
    id: REGATTA_IDS.olivia3,
    name: 'Clearwater Bay Dragon Open',
    start_date: daysFromNow(-7),
    created_by: 'oliviaHartley',
    content_visibility: 'public',
    prep_notes: 'Using this as a testing day for the new backstay. Light on expectations, heavy on learning.',
    tuning_settings: null,
    post_race_notes: 'Won! New backstay was a game changer in the gusty conditions. Pointing improved noticeably. 1st place with 3 bullet races.',
    lessons_learned: ['New backstay setup is fast', 'Gusty conditions suit our new setup', 'Clearwater Bay right side paid in ebb tide'],
  },

  // --- Luca Ferretti (3 races: 3 public — discover section) ---
  {
    id: REGATTA_IDS.luca1,
    name: 'Dragon Spring Cup 2026',
    start_date: daysFromNow(7),
    created_by: 'lucaFerretti',
    content_visibility: 'public',
    prep_notes: 'First race in Hong Kong! Recently moved from Lake Garda. Adjusting to sea state and tidal current. Training with local sailors to learn the venue.',
    tuning_settings: { mast_rake: '6470mm', shroud_tension: '30', jib_halyard: '645mm', backstay: 'light-medium' },
    post_race_notes: null,
    lessons_learned: null,
  },
  {
    id: REGATTA_IDS.luca2,
    name: 'Asia Pacific Dragon Championship 2026',
    start_date: daysFromNow(21),
    created_by: 'lucaFerretti',
    content_visibility: 'public',
    prep_notes: 'Big goal for the season. Need more practice in tidal conditions. Signed up for extra training sessions at RHKYC. Italian Dragon Association has a team of 4 boats entering.',
    tuning_settings: { mast_rake: '6465mm', shroud_tension: '31', jib_halyard: '648mm' },
    post_race_notes: null,
    lessons_learned: null,
  },
  {
    id: REGATTA_IDS.luca3,
    name: 'Clearwater Bay Dragon Open',
    start_date: daysFromNow(-7),
    created_by: 'lucaFerretti',
    content_visibility: 'public',
    prep_notes: 'Getting to know Clearwater Bay. Heard it has good chop similar to Garda. Excited to test boat in these conditions.',
    tuning_settings: { mast_rake: '6475mm', shroud_tension: '29' },
    post_race_notes: null,
    lessons_learned: null,
  },
];

// =====================================================
// RACE RESULTS DATA
// For expert scoring via get_class_experts() RPC.
// Results reference the regatta created_by the user.
// =====================================================

const RACE_RESULTS = [
  // Kenji Tanaka — 3 podiums, 4 total results
  { id: RESULT_IDS.kenji1, regatta_id: REGATTA_IDS.kenji1, race_number: 1, position: 1, sailor_id: 'kenjiTanaka', status_code: 'finished' },
  { id: RESULT_IDS.kenji2, regatta_id: REGATTA_IDS.kenji4, race_number: 1, position: 2, sailor_id: 'kenjiTanaka', status_code: 'finished' },
  { id: RESULT_IDS.kenji3, regatta_id: REGATTA_IDS.kenji1, race_number: 2, position: 1, sailor_id: 'kenjiTanaka', status_code: 'finished' },
  { id: RESULT_IDS.kenji4, regatta_id: REGATTA_IDS.kenji1, race_number: 3, position: 5, sailor_id: 'kenjiTanaka', status_code: 'finished' },

  // Olivia Hartley — 2 podiums, 3 total results
  { id: RESULT_IDS.olivia1, regatta_id: REGATTA_IDS.olivia1, race_number: 1, position: 3, sailor_id: 'oliviaHartley', status_code: 'finished' },
  { id: RESULT_IDS.olivia2, regatta_id: REGATTA_IDS.olivia3, race_number: 1, position: 1, sailor_id: 'oliviaHartley', status_code: 'finished' },
  { id: RESULT_IDS.olivia3, regatta_id: REGATTA_IDS.olivia1, race_number: 2, position: 2, sailor_id: 'oliviaHartley', status_code: 'finished' },

  // Sarah Chen — 1 podium, 4 total results (also followed + fleet mate)
  { id: RESULT_IDS.sarah1, regatta_id: REGATTA_IDS.sarah2, race_number: 1, position: 3, sailor_id: 'sarahChen', status_code: 'finished' },
  { id: RESULT_IDS.sarah2, regatta_id: REGATTA_IDS.sarah4, race_number: 1, position: 7, sailor_id: 'sarahChen', status_code: 'finished' },
  { id: RESULT_IDS.sarah3, regatta_id: REGATTA_IDS.sarah2, race_number: 2, position: 5, sailor_id: 'sarahChen', status_code: 'finished' },
  { id: RESULT_IDS.sarah4, regatta_id: REGATTA_IDS.sarah4, race_number: 2, position: 8, sailor_id: 'sarahChen', status_code: 'finished' },

  // Mike Thompson — 0 podiums, 3 total results (top 10)
  { id: RESULT_IDS.mike1, regatta_id: REGATTA_IDS.mike2, race_number: 1, position: 5, sailor_id: 'mikeThompson', status_code: 'finished' },
  { id: RESULT_IDS.mike2, regatta_id: REGATTA_IDS.mike2, race_number: 2, position: 8, sailor_id: 'mikeThompson', status_code: 'finished' },
  { id: RESULT_IDS.mike3, regatta_id: REGATTA_IDS.mike2, race_number: 3, position: 6, sailor_id: 'mikeThompson', status_code: 'finished' },
];

// =====================================================
// MAIN SEED FUNCTION
// =====================================================

async function main() {
  console.log('🚀 Seeding Sailors Tab demo data...\n');

  // Map user keys -> resolved IDs (may differ from targetId if user already existed)
  const resolvedUserIds = {};
  resolvedUserIds.demoSailor = DEMO_SAILOR_ID;

  // --------------------------------------------------
  // STEP 1: Create / resolve auth users
  // --------------------------------------------------
  console.log('Step 1: Creating demo auth users...');
  for (const user of USERS) {
    const resolvedId = await ensureAuthUserWithId(user.targetId, user.email, user.fullName);
    if (!resolvedId) {
      console.error(`Failed to resolve user ${user.email}, aborting.`);
      process.exit(1);
    }
    resolvedUserIds[user.key] = resolvedId;
  }
  console.log('');

  // --------------------------------------------------
  // STEP 2: Upsert profiles
  // --------------------------------------------------
  console.log('Step 2: Upserting profiles...');
  const profiles = USERS.map((u) => ({
    id: resolvedUserIds[u.key],
    full_name: u.fullName,
    email: u.email,
  }));

  const { error: profilesError } = await supabase
    .from('profiles')
    .upsert(profiles, { onConflict: 'id' });

  if (profilesError) {
    console.error('  ✗ Profiles upsert failed:', profilesError.message);
  } else {
    console.log(`  ✓ Upserted ${profiles.length} profiles`);
  }

  // Ensure demo sailor profile exists (don't overwrite existing email)
  const { data: existingDemoProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', DEMO_SAILOR_ID)
    .maybeSingle();

  if (!existingDemoProfile) {
    const { error: demoProfileError } = await supabase
      .from('profiles')
      .insert({ id: DEMO_SAILOR_ID, full_name: 'Kyle', email: 'demo-sailor@regattaflow.app' });

    if (demoProfileError) {
      console.log('  ~ Demo sailor profile note:', demoProfileError.message);
    }
  } else {
    console.log('  ✓ Demo sailor profile already exists');
  }
  console.log('');

  // --------------------------------------------------
  // STEP 3: Upsert sailor_profiles
  // --------------------------------------------------
  console.log('Step 3: Upserting sailor profiles...');
  const sailorProfiles = USERS.map((u) => ({
    id: BOAT_IDS[u.key], // Use boat ID as sailor_profile ID (deterministic)
    user_id: resolvedUserIds[u.key],
    avatar_emoji: u.emoji,
    avatar_color: u.color,
    experience_level: u.experience,
  }));

  // Upsert one by one to handle conflicts on user_id
  for (const sp of sailorProfiles) {
    const { error } = await supabase
      .from('sailor_profiles')
      .upsert(sp, { onConflict: 'user_id' });

    if (error) {
      // Try insert without id if conflict on user_id
      const { error: err2 } = await supabase
        .from('sailor_profiles')
        .update({ avatar_emoji: sp.avatar_emoji, avatar_color: sp.avatar_color, experience_level: sp.experience_level })
        .eq('user_id', sp.user_id);

      if (err2) {
        // Insert fresh
        const { error: err3 } = await supabase
          .from('sailor_profiles')
          .insert({ user_id: sp.user_id, avatar_emoji: sp.avatar_emoji, avatar_color: sp.avatar_color, experience_level: sp.experience_level });

        if (err3) {
          console.error(`  ✗ Sailor profile for ${sp.user_id}:`, err3.message);
        }
      }
    }
  }

  // Ensure demo sailor has a sailor_profile
  const { error: demoSpError } = await supabase
    .from('sailor_profiles')
    .upsert(
      { user_id: DEMO_SAILOR_ID, avatar_emoji: '🐉', avatar_color: '#3498DB', experience_level: 'advanced' },
      { onConflict: 'user_id' }
    );

  if (demoSpError) {
    // Try update
    await supabase
      .from('sailor_profiles')
      .update({ avatar_emoji: '🐉', avatar_color: '#3498DB', experience_level: 'advanced' })
      .eq('user_id', DEMO_SAILOR_ID);
  }

  console.log(`  ✓ Upserted ${sailorProfiles.length + 1} sailor profiles`);
  console.log('');

  // --------------------------------------------------
  // STEP 4: Upsert sailor_boats (link users to Dragon class)
  // --------------------------------------------------
  console.log('Step 4: Creating sailor boats (Dragon class)...');

  // Handle demo sailor's boat separately — may already have a primary Dragon boat
  const { data: existingDemoBoat } = await supabase
    .from('sailor_boats')
    .select('id')
    .eq('sailor_id', DEMO_SAILOR_ID)
    .eq('class_id', DRAGON_CLASS_ID)
    .eq('is_primary', true)
    .maybeSingle();

  if (existingDemoBoat) {
    console.log('  ✓ Demo sailor already has primary Dragon boat');
  } else {
    const { error } = await supabase
      .from('sailor_boats')
      .upsert({
        id: BOAT_IDS.demoSailor,
        sailor_id: DEMO_SAILOR_ID,
        class_id: DRAGON_CLASS_ID,
        name: 'Azure Dragon',
        sail_number: 'HKG 1',
        is_primary: true,
        is_owner: true,
        status: 'active',
      }, { onConflict: 'id' });

    if (error) {
      console.error('  ✗ Demo boat:', error.message);
    } else {
      console.log('  + Created demo sailor Dragon boat');
    }
  }

  // Create boats for other users
  const otherBoats = USERS.map((u) => ({
    id: BOAT_IDS[u.key],
    sailor_id: resolvedUserIds[u.key],
    class_id: DRAGON_CLASS_ID,
    name: u.boatName,
    sail_number: u.sailNumber,
    is_primary: true,
    is_owner: true,
    status: 'active',
  }));

  for (const boat of otherBoats) {
    const { error } = await supabase
      .from('sailor_boats')
      .upsert(boat, { onConflict: 'id' });

    if (error) {
      console.error(`  ✗ Boat ${boat.name}:`, error.message);
    }
  }
  console.log(`  ✓ Upserted ${otherBoats.length + 1} boats`);
  console.log('');

  // --------------------------------------------------
  // STEP 5: Create fleet + memberships
  // --------------------------------------------------
  console.log('Step 5: Creating fleet and memberships...');

  const { error: fleetError } = await supabase
    .from('fleets')
    .upsert({
      id: FLEET_ID,
      name: 'HK Dragon Association',
      description: 'Hong Kong Dragon Class sailing community',
      class_id: DRAGON_CLASS_ID,
      visibility: 'public',
      is_public: true,
      region: 'Hong Kong',
    }, { onConflict: 'id' });

  if (fleetError) {
    console.error('  ✗ Fleet upsert:', fleetError.message);
  } else {
    console.log('  ✓ Fleet: HK Dragon Association');
  }

  // Fleet members: demo sailor + Sarah, Mike, Emma, James
  const fleetMembers = [
    { id: FLEET_MEMBER_IDS.demoSailor,     fleet_id: FLEET_ID, user_id: DEMO_SAILOR_ID,                    role: 'member' },
    { id: FLEET_MEMBER_IDS.sarahChen,      fleet_id: FLEET_ID, user_id: resolvedUserIds.sarahChen,         role: 'captain' },
    { id: FLEET_MEMBER_IDS.mikeThompson,   fleet_id: FLEET_ID, user_id: resolvedUserIds.mikeThompson,      role: 'member' },
    { id: FLEET_MEMBER_IDS.emmaWilson,     fleet_id: FLEET_ID, user_id: resolvedUserIds.emmaWilson,        role: 'member' },
    { id: FLEET_MEMBER_IDS.jamesRodriguez, fleet_id: FLEET_ID, user_id: resolvedUserIds.jamesRodriguez,    role: 'member' },
  ];

  for (const fm of fleetMembers) {
    const { error } = await supabase
      .from('fleet_members')
      .upsert(fm, { onConflict: 'id' });

    if (error) {
      console.error(`  ✗ Fleet member ${fm.user_id}:`, error.message);
    }
  }
  console.log(`  ✓ Added ${fleetMembers.length} fleet members`);
  console.log('');

  // --------------------------------------------------
  // STEP 6: Create regattas
  // --------------------------------------------------
  console.log('Step 6: Creating regattas...');

  const regattaRows = REGATTAS.map((r) => ({
    id: r.id,
    name: r.name,
    start_date: r.start_date,
    created_by: resolvedUserIds[r.created_by],
    content_visibility: r.content_visibility,
    prep_notes: r.prep_notes,
    tuning_settings: r.tuning_settings,
    post_race_notes: r.post_race_notes,
    lessons_learned: r.lessons_learned,
  }));

  for (const regatta of regattaRows) {
    const { error } = await supabase
      .from('regattas')
      .upsert(regatta, { onConflict: 'id' });

    if (error) {
      console.error(`  ✗ Regatta "${regatta.name}":`, error.message);
    }
  }
  console.log(`  ✓ Upserted ${regattaRows.length} regattas`);
  console.log('');

  // --------------------------------------------------
  // STEP 7: Create race results (for expert scoring)
  // --------------------------------------------------
  console.log('Step 7: Creating race results...');

  const resultRows = RACE_RESULTS.map((r) => ({
    id: r.id,
    regatta_id: r.regatta_id,
    race_number: r.race_number,
    position: r.position,
    sailor_id: resolvedUserIds[r.sailor_id],
    status_code: r.status_code,
  }));

  for (const result of resultRows) {
    const { error } = await supabase
      .from('race_results')
      .upsert(result, { onConflict: 'id' });

    if (error) {
      console.error(`  ✗ Result ${result.id}:`, error.message);
    }
  }
  console.log(`  ✓ Upserted ${resultRows.length} race results`);
  console.log('');

  // --------------------------------------------------
  // STEP 8: Create follow relationships
  // --------------------------------------------------
  console.log('Step 8: Creating follow relationships...');

  const follows = [
    { follower_id: DEMO_SAILOR_ID, following_id: resolvedUserIds.sarahChen },
    { follower_id: DEMO_SAILOR_ID, following_id: resolvedUserIds.mikeThompson },
  ];

  for (const follow of follows) {
    const { error } = await supabase
      .from('user_follows')
      .upsert(follow, { onConflict: 'follower_id,following_id' });

    if (error) {
      // Try insert if upsert with composite key fails
      const { error: err2 } = await supabase
        .from('user_follows')
        .insert(follow);

      if (err2 && !err2.message.includes('duplicate')) {
        console.error(`  ✗ Follow ${follow.follower_id} -> ${follow.following_id}:`, err2.message);
      }
    }
  }
  console.log(`  ✓ Demo sailor follows Sarah Chen and Mike Thompson`);
  console.log('');

  // --------------------------------------------------
  // VERIFICATION
  // --------------------------------------------------
  console.log('📊 Verification...');

  // Check follow count
  const { count: followCount } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', DEMO_SAILOR_ID);
  console.log(`  Following count: ${followCount}`);

  // Check fleet membership
  const { count: fleetCount } = await supabase
    .from('fleet_members')
    .select('*', { count: 'exact', head: true })
    .eq('fleet_id', FLEET_ID);
  console.log(`  Fleet member count: ${fleetCount}`);

  // Check regattas created
  const { count: regattaCount } = await supabase
    .from('regattas')
    .select('*', { count: 'exact', head: true })
    .in('id', Object.values(REGATTA_IDS));
  console.log(`  Regattas created: ${regattaCount}`);

  // Check race results
  const { count: resultCount } = await supabase
    .from('race_results')
    .select('*', { count: 'exact', head: true })
    .in('id', Object.values(RESULT_IDS));
  console.log(`  Race results created: ${resultCount}`);

  // Check sailor boat class link
  const { data: demoBoat } = await supabase
    .from('sailor_boats')
    .select('class_id, name, is_primary')
    .eq('sailor_id', DEMO_SAILOR_ID)
    .eq('is_primary', true)
    .maybeSingle();
  console.log(`  Demo sailor boat: ${demoBoat?.name || 'NOT FOUND'} (class: ${demoBoat?.class_id === DRAGON_CLASS_ID ? 'Dragon ✓' : 'WRONG'})`);

  // Test class experts RPC
  const { data: experts, error: expertsError } = await supabase.rpc('get_class_experts', {
    target_class_id: DRAGON_CLASS_ID,
    exclude_user_id: DEMO_SAILOR_ID,
    result_limit: 10,
  });

  if (expertsError) {
    console.log(`  Class experts RPC: ERROR - ${expertsError.message}`);
  } else {
    console.log(`  Class experts found: ${experts?.length || 0}`);
    (experts || []).forEach((e) => {
      console.log(`    - ${e.user_name}: score=${e.expert_score}, podiums=${e.podium_count}, public=${e.public_race_count}`);
    });
  }

  console.log('\n✅ Sailors Tab seed complete!');
  console.log('\nExpected sections:');
  console.log('  Following (2):     Sarah Chen + Mike Thompson races');
  console.log('  Fleet Activity:    Emma Wilson + James Rodriguez races (+ Sarah/Mike)');
  console.log('  Class Experts:     Kenji Tanaka, Olivia Hartley, Sarah Chen (by score)');
  console.log('  Discover:          Luca Ferretti races (+ Kenji/Olivia not followed)');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
