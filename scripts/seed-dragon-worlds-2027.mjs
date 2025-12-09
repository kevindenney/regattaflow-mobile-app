#!/usr/bin/env node

/**
 * Dragon World Championship 2027 - Complete Demo Data Seed
 * =========================================================
 * Seeds comprehensive mock data for the Dragon Worlds 2027 in Hong Kong
 * Including: regatta, race committee, competitors, fleet data, and documents
 *
 * Run: node scripts/seed-dragon-worlds-2027.mjs
 * Requires: EXPO_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';
import dragonWorldsData from '../data/demo/dragonWorlds2027.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Constants
const RHKYC_CLUB_ID = '15621949-7086-418a-8245-0f932e6edd70'; // UUID for clubs table
const DEMO_PASSWORD = 'Demo123!';

const log = {
  info: (msg, ...args) => console.log(`🐉 ${msg}`, ...args),
  success: (msg, ...args) => console.log(`✅ ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`⚠️ ${msg}`, ...args),
  error: (msg, ...args) => console.error(`❌ ${msg}`, ...args),
  section: (msg) => console.log(`\n${'═'.repeat(60)}\n🏆 ${msg}\n${'═'.repeat(60)}`),
};

const deterministicUuid = (namespace, value) => {
  const hash = createHash('sha1').update(`${namespace}:${value}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
};

// =====================================================
// User Resolution & Creation
// =====================================================

async function resolveOrCreateUser(email, fullName, userType = 'sailor') {
  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    log.info(`Found existing user: ${email}`);
    return existingUser.id;
  }

  // Create new auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError) {
    // User might exist in auth but not in users table
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const authUser = users.find(u => u.email === email);
    if (authUser) {
      // Update the users table
      await supabase.from('users').upsert({
        id: authUser.id,
        email,
        full_name: fullName,
        user_type: userType,
        onboarding_completed: true,
        onboarding_step: 'completed',
      }, { onConflict: 'id' });
      return authUser.id;
    }
    throw authError;
  }

  // Update users table
  await supabase.from('users').upsert({
    id: authData.user.id,
    email,
    full_name: fullName,
    user_type: userType,
    onboarding_completed: true,
    onboarding_step: 'completed',
  }, { onConflict: 'id' });

  log.success(`Created user: ${fullName} (${email})`);
  return authData.user.id;
}

// =====================================================
// Demo Users Setup
// =====================================================

async function setupDemoUsers() {
  log.section('Setting up Demo Users for Dragon Worlds 2027');
  
  const users = {};

  // Demo Sailor
  users.demoSailor = await resolveOrCreateUser(
    'demo-sailor@regattaflow.io',
    'Demo Sailor',
    'sailor'
  );

  // Sarah Chen (Coach/Competitor)
  users.sarahChen = await resolveOrCreateUser(
    'sarah.chen@sailing.com',
    'Sarah Chen',
    'sailor'
  );

  // Demo Club (Race Committee)
  users.demoClub = await resolveOrCreateUser(
    'demo-club@regattaflow.io',
    'RHKYC Race Office',
    'club'
  );

  // Coach Anderson (for coaching features)
  users.coachAnderson = await resolveOrCreateUser(
    'coach.anderson@sailing.com',
    'Coach Anderson',
    'coach'
  );

  return users;
}

// =====================================================
// Dragon Boat Class Setup
// =====================================================

async function ensureDragonClass() {
  log.section('Ensuring Dragon Boat Class Exists');

  const dragonClass = {
    id: deterministicUuid('boat_classes', 'dragon'),
    name: 'Dragon',
    class_association: 'International Dragon Association',
    measurement_rules: {
      loa: 8.9,
      beam: 1.92,
      draft: 1.21,
      displacement: 1700,
      sailArea: 27.5,
      crew: 3,
      spinnaker: false
    },
    metadata: {
      description: 'Classic one-design keelboat, Olympic class 1948-1972',
      website: 'https://internationaldragonsailing.net',
      founded: 1929,
      designer: 'Johan Anker'
    }
  };

  const { error } = await supabase
    .from('boat_classes')
    .upsert(dragonClass, { onConflict: 'name' });

  if (error) {
    log.warn(`Could not upsert Dragon class: ${error.message}`);
  } else {
    log.success('Dragon boat class configured');
  }

  // Get the actual ID from the database
  const { data } = await supabase
    .from('boat_classes')
    .select('id')
    .eq('name', 'Dragon')
    .single();

  return data?.id;
}

// =====================================================
// Hong Kong Dragon Fleet Setup
// =====================================================

async function setupHongKongDragonFleet(users, dragonClassId) {
  log.section('Setting up Hong Kong Dragon Fleet');

  const fleetId = deterministicUuid('fleets', 'hk-dragon-fleet-2027');
  
  const fleetData = {
    id: fleetId,
    name: 'Hong Kong Dragon Association',
    slug: 'hkda-dragon-fleet',
    description: dragonWorldsData.hongKongDragonFleet.history + '. ' + 
                 `Fleet of ${dragonWorldsData.hongKongDragonFleet.fleetSize} boats racing Wednesdays from RHKYC.`,
    class_id: dragonClassId,
    club_id: RHKYC_CLUB_ID,
    region: 'Hong Kong',
    visibility: 'public',
    whatsapp_link: 'https://chat.whatsapp.com/HKDragonFleet2027',
    metadata: {
      fleetSize: dragonWorldsData.hongKongDragonFleet.fleetSize,
      practiceNight: dragonWorldsData.hongKongDragonFleet.practiceNight,
      recentResults: dragonWorldsData.hongKongDragonFleet.recentResults,
      worldsHost: true,
      worldsYear: 2027
    }
  };

  const { error } = await supabase
    .from('fleets')
    .upsert(fleetData, { onConflict: 'id' });

  if (error) {
    log.warn(`Could not create HK Dragon Fleet: ${error.message}`);
  } else {
    log.success('Hong Kong Dragon Association fleet created');
  }

  // Add fleet memberships
  const fleetMembers = [
    { userId: users.demoSailor, role: 'member' },
    { userId: users.sarahChen, role: 'captain' },
    { userId: users.coachAnderson, role: 'coach' },
  ];

  for (const member of fleetMembers) {
    const { error: memberError } = await supabase
      .from('fleet_members')
      .upsert({
        fleet_id: fleetId,
        user_id: member.userId,
        role: member.role,
        status: 'active',
        joined_at: new Date().toISOString(),
        metadata: { dragonWorlds2027: true }
      }, { onConflict: 'fleet_id,user_id' });

    if (memberError) {
      log.warn(`Could not add fleet member: ${memberError.message}`);
    }
  }

  log.success('Fleet memberships configured');
  return fleetId;
}

// =====================================================
// Sailor Boats Setup
// =====================================================

async function setupSailorBoats(users, dragonClassId) {
  log.section('Setting up Sailor Boats');

  const boats = [];

  // Demo Sailor's boat - Doubloon
  const demoSailorBoat = {
    id: deterministicUuid('sailor_boats', 'hkg-88-doubloon'),
    sailor_id: users.demoSailor,
    class_id: dragonClassId,
    name: 'Doubloon',
    sail_number: 'HKG 88',
    hull_number: 'HKG-088-2022',
    manufacturer: 'Petticrows',
    year_built: 2022,
    hull_material: 'fiberglass',
    status: 'active',
    ownership_type: 'owned',
    is_primary: true,
    is_owner: true,
    storage_location: 'RHKYC Shelter Cove',
    metadata: {
      dragonWorlds2027: true,
      registrationStatus: 'confirmed',
      lastMeasurement: '2026-09-15'
    }
  };

  // Sarah Chen's boat - Golden Dragon
  const sarahChenBoat = {
    id: deterministicUuid('sailor_boats', 'hkg-188-golden-dragon'),
    sailor_id: users.sarahChen,
    class_id: dragonClassId,
    name: 'Golden Dragon',
    sail_number: 'HKG 188',
    hull_number: 'HKG-188-2021',
    manufacturer: 'Petticrows',
    year_built: 2021,
    hull_material: 'fiberglass',
    status: 'active',
    ownership_type: 'owned',
    is_primary: true,
    is_owner: true,
    storage_location: 'RHKYC Shelter Cove',
    metadata: {
      dragonWorlds2027: true,
      registrationStatus: 'confirmed',
      fleetCaptainBoat: true
    }
  };

  for (const boat of [demoSailorBoat, sarahChenBoat]) {
    const { error } = await supabase
      .from('sailor_boats')
      .upsert(boat, { onConflict: 'id' });

    if (error) {
      log.warn(`Could not create boat ${boat.name}: ${error.message}`);
    } else {
      boats.push(boat);
      log.success(`Created boat: ${boat.name} (${boat.sail_number})`);
    }
  }

  return boats;
}

// =====================================================
// Dragon Worlds 2027 Regatta Setup
// =====================================================

async function setupDragonWorldsRegatta(users, dragonClassId, boats) {
  log.section('Creating Dragon World Championship 2027 Regatta');

  const regattaId = deterministicUuid('regattas', 'dragon-worlds-2027');
  const event = dragonWorldsData.event;

  const regattaData = {
    id: regattaId,
    name: event.name,
    description: event.description,
    start_date: event.startDate,
    end_date: event.endDate,
    status: 'planned',
    created_by: users.demoClub,
    class_id: dragonClassId,
    
    // Race management
    vhf_channel: event.raceCommittee?.vhfChannel || '72',
    vhf_backup_channel: event.raceCommittee?.backupChannel || '69',
    safety_channel: event.raceCommittee?.safetyChannel || 'VHF 16',
    rc_boat_name: event.raceCommittee?.committeeBoatName || 'Voyager',
    race_officer: event.raceCommittee?.principalRaceOfficer?.name || 'Stuart Childerley',
    
    // Event details
    number_of_races: 10,
    expected_fleet_size: event.expectedFleetSize,
    event_type: 'Championship',
    event_series_name: 'Dragon World Championship',
    
    // Venue & conditions
    start_area_name: event.racingArea?.name || 'South China Sea - Ninepins',
    start_area_description: event.racingArea?.description,
    race_area_boundaries: event.racingArea?.bounds,
    expected_conditions: event.expectedConditions?.description,
    expected_wind_speed_min: 8,
    expected_wind_speed_max: 18,
    
    // Documents
    notice_of_race_url: 'https://www.dragonworld2027.com/media/nor-2027.pdf',
    sailing_instructions_url: 'https://www.dragonworld2027.com/media/si-2027.pdf',
    
    // Registration
    registration_deadline: event.registrationCloses,
    entry_fee_amount: event.entryFee,
    entry_fee_currency: event.currency,
    
    // Scoring
    scoring_system: 'Low Point',
    discards_policy: '1 discard after 5 races, 2 discards after 9 races',
    series_races_required: 3,
    
    // Social
    event_hashtag: event.eventHashtag,
    post_race_social: true,
    social_event_details: 'Daily debrief at Clearwater Bay marina, Prize Giving at RHKYC Kellett Island',
    photographer_present: true,
    live_tracking_url: 'https://www.dragonworld2027.com/live',
    
    metadata: {
      eventType: 'world_championship',
      hostClub: 'Royal Hong Kong Yacht Club',
      sponsors: event.sponsors,
      ambassadors: event.ambassadors,
      charterBoatsAvailable: event.charterBoats?.available,
      shippingSubsidized: event.shipping?.subsidized,
      website: event.website
    }
  };

  const { error } = await supabase
    .from('regattas')
    .upsert(regattaData, { onConflict: 'id' });

  if (error) {
    log.error(`Could not create regatta: ${error.message}`);
    throw error;
  }

  log.success('Dragon World Championship 2027 regatta created');
  return regattaId;
}

// =====================================================
// Race Participants Registration
// =====================================================

async function setupRaceParticipants(regattaId, users, fleetId, boats) {
  log.section('Registering Competitors for Dragon Worlds 2027');

  const participants = [
    {
      regatta_id: regattaId,
      user_id: users.demoSailor,
      fleet_id: fleetId,
      status: 'confirmed',
      boat_name: 'Doubloon',
      sail_number: 'HKG 88',
      visibility: 'public',
      metadata: {
        country: 'HKG',
        crew: ['Tommy Chan (Tactician)', 'Lisa Wong (Trimmer)'],
        entryNumber: 1,
        measurementComplete: true
      }
    },
    {
      regatta_id: regattaId,
      user_id: users.sarahChen,
      fleet_id: fleetId,
      status: 'confirmed',
      boat_name: 'Golden Dragon',
      sail_number: 'HKG 188',
      visibility: 'public',
      metadata: {
        country: 'HKG',
        crew: ['David Hui (Tactician)', 'Jenny Lau (Trimmer)'],
        entryNumber: 2,
        fleetCaptain: true,
        measurementComplete: true
      }
    }
  ];

  for (const participant of participants) {
    const { error } = await supabase
      .from('race_participants')
      .upsert({
        ...participant,
        id: deterministicUuid('race_participants', `${regattaId}-${participant.user_id}`),
      }, { onConflict: 'regatta_id,user_id' });

    if (error) {
      log.warn(`Could not register participant: ${error.message}`);
    } else {
      log.success(`Registered: ${participant.boat_name} (${participant.sail_number})`);
    }
  }
}

// =====================================================
// Club Race Committee Setup
// =====================================================

async function setupRaceCommittee(users) {
  log.section('Setting up Race Committee Access');

  // Add demo-club as race_committee member at RHKYC
  const { error: memberError } = await supabase
    .from('club_members')
    .upsert({
      id: deterministicUuid('club_members', `${RHKYC_CLUB_ID}-${users.demoClub}`),
      club_id: RHKYC_CLUB_ID,
      user_id: users.demoClub,
      role: 'race_committee',
      membership_start: '2024-01-01',
      membership_number: 'RC-2027-001',
      is_active: true,
      metadata: {
        dragonWorlds2027: true,
        position: 'Race Officer',
        responsibilities: dragonWorldsData.testUserRoles.demoClub.responsibilities
      }
    }, { onConflict: 'club_id,user_id' });

  if (memberError) {
    log.warn(`Could not setup race committee membership: ${memberError.message}`);
  } else {
    log.success('Race Committee membership configured for demo-club');
  }

  // Also ensure Sarah Chen has her officer role
  const { error: sarahError } = await supabase
    .from('club_members')
    .upsert({
      id: deterministicUuid('club_members', `${RHKYC_CLUB_ID}-${users.sarahChen}`),
      club_id: RHKYC_CLUB_ID,
      user_id: users.sarahChen,
      role: 'officer',
      membership_start: '2015-02-10',
      membership_number: 'RHKYC-204',
      is_active: true,
      metadata: {
        dragonWorlds2027: true,
        position: 'Dragon Fleet Captain',
        committees: ['Hong Kong Dragon Association', 'RHKYC Sailing Committee']
      }
    }, { onConflict: 'club_id,user_id' });

  if (sarahError) {
    log.warn(`Could not update Sarah Chen membership: ${sarahError.message}`);
  } else {
    log.success('Sarah Chen officer role configured');
  }
}

// =====================================================
// Club Event Entry
// =====================================================

async function setupClubEvent(users) {
  log.section('Creating Club Event Entry');

  const event = dragonWorldsData.event;
  const eventId = deterministicUuid('club_events', 'dragon-worlds-2027-event');

  const clubEventData = {
    id: eventId,
    club_id: RHKYC_CLUB_ID,
    title: event.name,
    description: event.description,
    event_type: 'regatta',
    start_date: event.startDate,
    end_date: event.endDate,
    registration_opens: event.registrationOpens,
    registration_closes: event.registrationCloses,
    location_name: event.venueName,
    location_coordinates: event.coordinates,
    max_participants: event.maxEntries,
    registration_fee: event.entryFee,
    currency: event.currency,
    status: 'registration_open',
    visibility: 'public',
    boat_classes: ['Dragon'],
    contact_email: 'dragonworlds2027@rhkyc.org.hk',
    website_url: event.website,
    created_by: users.demoClub,
  };

  const { error } = await supabase
    .from('club_events')
    .upsert(clubEventData, { onConflict: 'id' });

  if (error) {
    log.warn(`Could not create club event: ${error.message}`);
  } else {
    log.success('Club event entry created');
  }

  return eventId;
}

// =====================================================
// Documents Setup
// =====================================================

async function setupDocuments() {
  log.section('Setting up Event Documents');

  for (const doc of dragonWorldsData.documents) {
    const docId = deterministicUuid('club_ai_documents', doc.slug);
    
    const { error } = await supabase
      .from('club_ai_documents')
      .upsert({
        id: docId,
        club_id: 'rhkyc', // yacht_clubs table uses string IDs
        title: doc.title,
        document_type: doc.documentType === 'notice_of_race' ? 'nor' : 
                       doc.documentType === 'sailing_instructions' ? 'si' : 'bulletin',
        url: doc.url,
        publish_date: doc.publishDate,
        parsed: false,
      }, { onConflict: 'id' });

    if (error) {
      log.warn(`Could not create document ${doc.title}: ${error.message}`);
    } else {
      log.success(`Document added: ${doc.title}`);
    }
  }
}

// =====================================================
// Global Racing Event Entry
// =====================================================

async function setupGlobalRacingEvent() {
  log.section('Adding to Global Racing Events Calendar');

  const event = dragonWorldsData.event;
  const eventId = deterministicUuid('global_racing_events', 'dragon-worlds-2027');

  const globalEventData = {
    id: eventId,
    name: event.name,
    venue_id: 'hong-kong-clearwater-bay',
    event_type: 'championship',
    start_date: event.startDate.split('T')[0],
    end_date: event.endDate.split('T')[0],
    boat_classes: ['Dragon'],
    entry_status: 'open',
    website_url: event.website,
    contact_email: 'dragonworlds2027@rhkyc.org.hk',
    entry_fee_range: `${event.currency} ${event.entryFee}`,
    expected_participants: event.expectedFleetSize,
    prestige_level: 'world_championship',
    source: 'manual'
  };

  const { error } = await supabase
    .from('global_racing_events')
    .upsert(globalEventData, { onConflict: 'id' });

  if (error) {
    log.warn(`Could not add global event: ${error.message}`);
  } else {
    log.success('Added to global racing events calendar');
  }
}

// =====================================================
// Sailor Profiles Enhancement
// =====================================================

async function enhanceSailorProfiles(users) {
  log.section('Enhancing Sailor Profiles');

  const profiles = [
    {
      user_id: users.demoSailor,
      home_club: 'Royal Hong Kong Yacht Club',
      experience_level: 'advanced',
      sailing_since: '2018-01-01',
      boat_class_preferences: ['Dragon'],
      preferred_venues: ['Hong Kong - Victoria Harbour', 'Hong Kong - Clearwater Bay'],
      achievements: [
        { title: 'Dragon Worlds 2027 Entry', year: 2026 },
        { title: 'RHKYC Dragon Series Winner', year: 2025 }
      ]
    },
    {
      user_id: users.sarahChen,
      home_club: 'Royal Hong Kong Yacht Club',
      experience_level: 'professional',
      sailing_since: '2010-01-01',
      boat_class_preferences: ['Dragon', 'J/70'],
      preferred_venues: ['Hong Kong - Victoria Harbour', 'Hong Kong - Clearwater Bay'],
      achievements: [
        { title: 'Dragon Worlds 2027 Entry', year: 2026 },
        { title: 'RHKYC Dragon Fleet Captain', year: 2024 },
        { title: 'Asia Pacific Dragon Championship - 2nd', year: 2024 },
        { title: 'Hong Kong Dragon Series Champion', year: 2023 }
      ]
    }
  ];

  for (const profile of profiles) {
    const { error } = await supabase
      .from('sailor_profiles')
      .upsert(profile, { onConflict: 'user_id' });

    if (error) {
      log.warn(`Could not update sailor profile: ${error.message}`);
    }
  }

  log.success('Sailor profiles enhanced');
}

// =====================================================
// Coach Profile Enhancement
// =====================================================

async function enhanceCoachProfile(users) {
  log.section('Enhancing Coach Profile');

  const { error } = await supabase
    .from('coach_profiles')
    .upsert({
      user_id: users.coachAnderson,
      display_name: 'Coach Anderson',
      bio: 'Experienced Dragon class coach specializing in race tactics and boat speed. Working with Hong Kong Dragon Association teams for Dragon Worlds 2027.',
      experience_years: 20,
      specializations: ['Race tactics', 'Boat speed', 'Starts', 'Dragon class'],
      location_name: 'Hong Kong',
      location_region: 'Asia Pacific',
      languages: ['English', 'Cantonese'],
      hourly_rate: 150,
      currency: 'USD',
      is_verified: true,
      is_active: true,
      rating: 4.8,
      total_sessions: 150,
      location_preferences: [
        { venue: 'Hong Kong - Victoria Harbour', primary: true },
        { venue: 'Hong Kong - Clearwater Bay', primary: false }
      ]
    }, { onConflict: 'user_id' });

  if (error) {
    log.warn(`Could not update coach profile: ${error.message}`);
  } else {
    log.success('Coach Anderson profile enhanced for Dragon Worlds');
  }
}

// =====================================================
// Main Execution
// =====================================================

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║    🐉 DRAGON WORLD CHAMPIONSHIP 2027 - MOCK DATA SEED 🐉      ║');
  console.log('║         Hong Kong • November 21-29, 2026                        ║');
  console.log('║         Royal Hong Kong Yacht Club                              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  try {
    // Setup users first
    const users = await setupDemoUsers();
    
    // Setup Dragon boat class
    const dragonClassId = await ensureDragonClass();
    
    // Setup fleet
    const fleetId = await setupHongKongDragonFleet(users, dragonClassId);
    
    // Setup boats
    const boats = await setupSailorBoats(users, dragonClassId);
    
    // Create the main regatta
    const regattaId = await setupDragonWorldsRegatta(users, dragonClassId, boats);
    
    // Register participants
    await setupRaceParticipants(regattaId, users, fleetId, boats);
    
    // Setup race committee
    await setupRaceCommittee(users);
    
    // Create club event
    await setupClubEvent(users);
    
    // Add documents
    await setupDocuments();
    
    // Add to global events
    await setupGlobalRacingEvent();
    
    // Enhance profiles
    await enhanceSailorProfiles(users);
    await enhanceCoachProfile(users);

    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║              🎉 SEED COMPLETE - DRAGON WORLDS 2027 🎉         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n');
    
    console.log('📧 Demo User Credentials:');
    console.log('─'.repeat(60));
    console.log(`  Demo Sailor (Competitor)    demo-sailor@regattaflow.io    ${DEMO_PASSWORD}`);
    console.log(`  Sarah Chen (Fleet Captain)  sarah.chen@sailing.com         sailing123`);
    console.log(`  Demo Club (Race Committee)  demo-club@regattaflow.io      ${DEMO_PASSWORD}`);
    console.log(`  Coach Anderson              coach.anderson@sailing.com     sailing123`);
    console.log('─'.repeat(60));
    console.log('\n');
    
    console.log('🚀 What\'s Next:');
    console.log('  1. Login as demo-sailor@regattaflow.io to see competitor view');
    console.log('  2. Login as demo-club@regattaflow.io for race committee management');
    console.log('  3. Login as sarah.chen@sailing.com for fleet captain features');
    console.log('  4. Check the Races tab to see Dragon Worlds 2027');
    console.log('\n');
    console.log('🔗 Event Website: https://www.dragonworld2027.com');
    console.log('\n');

  } catch (error) {
    log.error('Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

