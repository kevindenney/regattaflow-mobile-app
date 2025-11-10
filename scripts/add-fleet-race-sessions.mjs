#!/usr/bin/env node

/**
 * Adds race sessions and analysis for existing fleet members
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

const FLEET_EMAILS = [
  'sarah.chen@demo.regattaflow.com',
  'marcus.thompson@demo.regattaflow.com',
  'emma.rodriguez@demo.regattaflow.com',
  'james.wilson@demo.regattaflow.com',
];

const RACE_NOTES_TEMPLATES = [
  {
    notes: "Great start on the pin end. Caught a nice left shift on the first beat that put me ahead of the pack. Need to work on my downwind speed - lost a few boats there.",
    satisfaction: 4,
    keyLearnings: ["Starting at the favored end paid off big time", "Need to practice downwind VMG"]
  },
  {
    notes: "Struggled at the start - got boxed out and had to duck a few boats. Made up ground with better upwind speed but couldn't catch the leaders.",
    satisfaction: 3,
    keyLearnings: ["Need to be more aggressive in the pre-start", "My boat setup was good though"]
  },
  {
    notes: "Solid mid-pack finish. Played the shifts well but made a mistake at the weather mark rounding. Overall happy with consistency.",
    satisfaction: 4,
    keyLearnings: ["Mark roundings need practice - I'm losing 2-3 seconds each time"]
  },
  {
    notes: "Tough conditions today. Wind was all over the place. Stayed patient and picked my lanes carefully. Finished better than expected.",
    satisfaction: 4,
    keyLearnings: ["In shifty conditions, patience and lane selection matter more than raw speed"]
  },
  {
    notes: "Best race of the season! Nailed the start, got the shifts right, and had clean mark roundings. Everything clicked today.",
    satisfaction: 5,
    keyLearnings: ["When you get the start right, everything else becomes easier", "Need to replicate this consistency"]
  }
];

function generateMockGPSTrack(startTime, endTime) {
  const points = [];
  const duration = (endTime - startTime) / 1000;
  const numPoints = Math.floor(duration / 10);

  let lat = 37.8 + Math.random() * 0.01;
  let lng = -122.4 + Math.random() * 0.01;

  for (let i = 0; i < numPoints; i++) {
    const timestamp = new Date(startTime.getTime() + (i * 10 * 1000));

    lat += (Math.random() - 0.5) * 0.0002;
    lng += (Math.random() - 0.5) * 0.0002;

    points.push({
      latitude: lat,
      longitude: lng,
      timestamp: timestamp.toISOString(),
      speed: 3 + Math.random() * 4,
      heading: Math.random() * 360,
    });
  }

  return points;
}

async function main() {
  console.log('🚢 Adding Race Sessions for Fleet Members...\n');

  // Get the demo regatta
  const { data: regattas, error: regattasError } = await supabase
    .from('regattas')
    .select('id, name')
    .order('start_date', { ascending: false })
    .limit(1);

  if (regattasError || !regattas || regattas.length === 0) {
    console.error('❌ No regattas found');
    process.exit(1);
  }

  const demoRegattaId = regattas[0].id;
  console.log(`📍 Using regatta: ${regattas[0].name}\n`);

  // Get all fleet member users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name')
    .in('email', FLEET_EMAILS);

  if (usersError || !users || users.length === 0) {
    console.error('❌ No fleet members found');
    process.exit(1);
  }

  console.log(`Found ${users.length} fleet members\n`);

  for (const user of users) {
    console.log(`📝 Creating sessions for ${user.full_name}...`);

    const numSessions = Math.floor(Math.random() * 2) + 2; // 2-3 sessions

    for (let i = 0; i < numSessions; i++) {
      const noteTemplate = RACE_NOTES_TEMPLATES[Math.floor(Math.random() * RACE_NOTES_TEMPLATES.length)];
      const startTime = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + (45 + Math.random() * 30) * 60 * 1000);

      const trackPoints = generateMockGPSTrack(startTime, endTime);

      const { data: session, error: sessionError } = await supabase
        .from('race_timer_sessions')
        .insert({
          regatta_id: demoRegattaId,
          sailor_id: user.id,
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
        console.error(`  ❌ Error creating session:`, sessionError.message);
        continue;
      }

      // Add race analysis
      const { error: analysisError } = await supabase
        .from('race_analysis')
        .insert({
          session_id: session.id,
          sailor_id: user.id,
          race_id: demoRegattaId,
          overall_satisfaction: noteTemplate.satisfaction,
          key_learnings: noteTemplate.keyLearnings,
          created_at: endTime.toISOString(),
        });

      if (analysisError) {
        console.error(`  ❌ Error creating analysis:`, analysisError.message);
      } else {
        console.log(`  ✅ Created session ${i + 1}/${numSessions}`);
      }
    }
  }

  console.log('\n✅ Fleet Race Sessions Added!');
}

main().catch(console.error);
