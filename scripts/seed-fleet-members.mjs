#!/usr/bin/env node

/**
 * Seeds mock fleet members with profiles, race sessions, and post-race data
 * These accounts can be used to test the Fleet Insights feature
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Mock fleet members with realistic sailing backgrounds
const FLEET_MEMBERS = [
  {
    email: 'sarah.chen@demo.regattaflow.com',
    password: 'demo1234',
    profile: {
      full_name: 'Sarah Chen',
      experience_level: 'intermediate',
      boat_class_preferences: ['Laser', '420'],
      home_club: 'Berkeley Yacht Club',
      sailing_since: '2019-01-01',
      achievements: ['Collegiate All-American 2023', 'Regional Light-Air Champion'],
    }
  },
  {
    email: 'marcus.thompson@demo.regattaflow.com',
    password: 'demo1234',
    profile: {
      full_name: 'Marcus Thompson',
      experience_level: 'advanced',
      boat_class_preferences: ['J/70', 'J/105'],
      home_club: 'St. Francis Yacht Club',
      sailing_since: '2015-01-01',
      achievements: ['J/70 North American Crew Champion', 'Multiple Podium Finishes'],
    }
  },
  {
    email: 'emma.rodriguez@demo.regattaflow.com',
    password: 'demo1234',
    profile: {
      full_name: 'Emma Rodriguez',
      experience_level: 'intermediate',
      boat_class_preferences: ['Laser', 'RS Aero'],
      home_club: 'Sausalito Yacht Club',
      sailing_since: '2023-01-01',
      achievements: ['Completed First Season', 'Most Improved Sailor 2024'],
    }
  },
  {
    email: 'james.wilson@demo.regattaflow.com',
    password: 'demo1234',
    profile: {
      full_name: 'James Wilson',
      experience_level: 'advanced',
      boat_class_preferences: ['Melges 24', 'J/105', 'Express 27'],
      home_club: 'Richmond Yacht Club',
      sailing_since: '2010-01-01',
      achievements: ['10x Fleet Champion', 'Heavy Weather Specialist', 'PHRF Division Winner'],
    }
  }
];

// Sample race notes and insights for variety
const RACE_NOTES_TEMPLATES = [
  {
    notes: "Great start on the pin end. Caught a nice left shift on the first beat that put me ahead of the pack. Need to work on my downwind speed - lost a few boats there.",
    satisfaction: 4,
    keyLearning: "Starting at the favored end paid off big time. Next time I'll practice downwind VMG."
  },
  {
    notes: "Struggled at the start - got boxed out and had to duck a few boats. Made up ground with better upwind speed but couldn't catch the leaders.",
    satisfaction: 3,
    keyLearning: "Need to be more aggressive in the pre-start. My boat setup was good though."
  },
  {
    notes: "Solid mid-pack finish. Played the shifts well but made a mistake at the weather mark rounding. Overall happy with consistency.",
    satisfaction: 4,
    keyLearning: "Mark roundings need practice - I'm losing 2-3 seconds each time."
  },
  {
    notes: "Tough conditions today. Wind was all over the place. Stayed patient and picked my lanes carefully. Finished better than expected.",
    satisfaction: 4,
    keyLearning: "In shifty conditions, patience and lane selection matter more than raw speed."
  },
  {
    notes: "Best race of the season! Nailed the start, got the shifts right, and had clean mark roundings. Everything clicked today.",
    satisfaction: 5,
    keyLearning: "When you get the start right, everything else becomes easier. Need to replicate this consistency."
  }
];

async function createFleetMember(memberData, demoRaceId) {
  const { email, password, profile } = memberData;

  console.log(`\n📝 Creating fleet member: ${profile.full_name}`);

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: profile.full_name,
    }
  });

  if (authError) {
    console.error(`❌ Error creating auth user for ${email}:`, authError.message);
    return null;
  }

  const userId = authData.user.id;
  console.log(`✅ Created auth user: ${userId}`);

  // Wait a moment for triggers to fire
  await new Promise(resolve => setTimeout(resolve, 500));

  // Update user record (might have been created by trigger)
  const { error: userError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email: email,
      full_name: profile.full_name,
      user_type: 'sailor',
      onboarding_completed: true,
      sailor_role: 'owner',
    }, {
      onConflict: 'id'
    });

  if (userError) {
    console.error(`❌ Error updating user record:`, userError.message);
    return null;
  }

  console.log(`✅ Updated user record`);

  // Create sailor profile
  const { data: sailorProfile, error: profileError } = await supabase
    .from('sailor_profiles')
    .insert({
      user_id: userId,
      experience_level: profile.experience_level,
      boat_class_preferences: profile.boat_class_preferences,
      home_club: profile.home_club,
      sailing_since: profile.sailing_since,
      achievements: profile.achievements,
    })
    .select()
    .single();

  if (profileError) {
    console.error(`❌ Error creating sailor profile:`, profileError.message);
    return null;
  }

  console.log(`✅ Created sailor profile`);

  // Create 2-3 race timer sessions for this sailor
  const numSessions = Math.floor(Math.random() * 2) + 2; // 2 or 3 sessions

  for (let i = 0; i < numSessions; i++) {
    const noteTemplate = RACE_NOTES_TEMPLATES[Math.floor(Math.random() * RACE_NOTES_TEMPLATES.length)];
    const startTime = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000); // Days ago
    const endTime = new Date(startTime.getTime() + (45 + Math.random() * 30) * 60 * 1000); // 45-75 min race

    // Generate realistic GPS track points
    const trackPoints = generateMockGPSTrack(startTime, endTime);

    const { data: session, error: sessionError} = await supabase
      .from('race_timer_sessions')
      .insert({
        regatta_id: demoRaceId,
        sailor_id: userId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        notes: noteTemplate.notes,
        track_points: trackPoints,
        duration_seconds: Math.floor((endTime - startTime) / 1000),
        created_at: startTime.toISOString(),
        updated_at: endTime.toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      console.error(`❌ Error creating race session:`, sessionError.message);
      continue;
    }

    // Add post-race analysis
    const { error: analysisError } = await supabase
      .from('race_analysis')
      .insert({
        session_id: session.id,
        sailor_id: userId,
        race_id: demoRaceId,
        overall_satisfaction: noteTemplate.satisfaction,
        key_learning: noteTemplate.keyLearning,
        notes: noteTemplate.notes,
        created_at: endTime.toISOString(),
      });

    if (analysisError) {
      console.error(`❌ Error creating race analysis:`, analysisError.message);
    } else {
      console.log(`  ✅ Created race session ${i + 1}/${numSessions} with analysis`);
    }
  }

  return { userId, email, profile };
}

function generateMockGPSTrack(startTime, endTime) {
  // Generate a simple GPS track for a race
  const points = [];
  const duration = (endTime - startTime) / 1000; // seconds
  const numPoints = Math.floor(duration / 10); // Point every 10 seconds

  // Start position (example: San Francisco Bay)
  let lat = 37.8 + Math.random() * 0.01;
  let lng = -122.4 + Math.random() * 0.01;

  for (let i = 0; i < numPoints; i++) {
    const timestamp = new Date(startTime.getTime() + (i * 10 * 1000));

    // Random walk to simulate sailing
    lat += (Math.random() - 0.5) * 0.0002;
    lng += (Math.random() - 0.5) * 0.0002;

    points.push({
      latitude: lat,
      longitude: lng,
      timestamp: timestamp.toISOString(),
      speed: 3 + Math.random() * 4, // 3-7 knots
      heading: Math.random() * 360,
    });
  }

  return points;
}

async function main() {
  console.log('🚢 Starting Fleet Member Seeding...\n');

  // Find the demo race ID (we'll use the most recent regatta)
  const { data: regattas, error: regattasError } = await supabase
    .from('regattas')
    .select('id, name, start_date')
    .order('start_date', { ascending: false })
    .limit(1);

  if (regattasError || !regattas || regattas.length === 0) {
    console.error('❌ No regattas found. Please create a demo regatta first.');
    process.exit(1);
  }

  const demoRace = regattas[0];
  console.log(`📍 Using demo regatta: ${demoRace.name} (${demoRace.id})\n`);

  const createdMembers = [];

  for (const member of FLEET_MEMBERS) {
    const result = await createFleetMember(member, demoRace.id);
    if (result) {
      createdMembers.push(result);
    }
  }

  console.log('\n\n✅ Fleet Member Seeding Complete!');
  console.log('\n📋 Created Accounts:');
  createdMembers.forEach(member => {
    console.log(`   • ${member.profile.full_name}`);
    console.log(`     Email: ${member.email}`);
    console.log(`     Password: demo1234`);
  });

  console.log('\n💡 Next step: Add one-click login buttons to the login page');
}

main().catch(console.error);
