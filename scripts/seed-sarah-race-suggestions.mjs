#!/usr/bin/env node
/**
 * Seed demo race suggestions for Sarah Chen
 * This allows testing the race suggestions feature in the Add Race drawer
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedRaceSuggestions() {
  const sarahUserId = '2771843f-d220-4aa4-9c2f-8e78b4a818c0';

  console.log('🌱 Seeding race suggestions for Sarah Chen...');

  // Get Hong Kong club ID
  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, name')
    .ilike('name', '%Hong Kong%')
    .limit(1);

  const hkClubId = clubs?.[0]?.id;
  console.log('🏢 Found club:', clubs?.[0]?.name, hkClubId);

  // Get Dragon fleet ID
  const { data: fleets } = await supabase
    .from('fleets')
    .select('id, name')
    .ilike('name', '%Dragon%')
    .limit(1);

  const dragonFleetId = fleets?.[0]?.id;
  console.log('⛵ Found fleet:', fleets?.[0]?.name, dragonFleetId);

  // Clear existing suggestions for Sarah
  const { error: deleteError } = await supabase
    .from('race_suggestions_cache')
    .delete()
    .eq('user_id', sarahUserId);

  if (deleteError) {
    console.error('❌ Error clearing old suggestions:', deleteError);
  } else {
    console.log('🧹 Cleared old suggestions');
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const suggestions = [
    {
      user_id: sarahUserId,
      suggestion_type: 'club_event',
      confidence_score: 0.9,
      race_data: {
        raceName: 'Hong Kong Regatta Week',
        venue: 'Victoria Harbour',
        venueCoordinates: { lat: 22.2855, lng: 114.1577 },
        startDate: '2026-03-15',
        boatClass: 'Dragon',
        description: 'Annual regatta featuring multiple boat classes',
      },
      source_id: hkClubId,
      source_metadata: { name: 'Hong Kong Yacht Club', type: 'club' },
      suggestion_reason: 'Upcoming event at your club',
      expires_at: expiresAt.toISOString(),
    },
    {
      user_id: sarahUserId,
      suggestion_type: 'fleet_race',
      confidence_score: 0.85,
      race_data: {
        raceName: 'Spring Dragon Series',
        venue: 'Peng Chau',
        startDate: '2026-04-10',
        boatClass: 'Dragon',
      },
      source_id: dragonFleetId,
      source_metadata: { name: 'Dragon Fleet', 'type': 'fleet' },
      suggestion_reason: 'Fleet members are racing this event',
      expires_at: expiresAt.toISOString(),
    },
    {
      user_id: sarahUserId,
      suggestion_type: 'pattern_match',
      confidence_score: 0.75,
      race_data: {
        raceName: 'Summer Championship',
        venue: 'Hong Kong',
        startDate: '2026-06-20',
        boatClass: 'Dragon',
      },
      source_metadata: { type: 'pattern' },
      suggestion_reason: 'You typically race in June',
      expires_at: expiresAt.toISOString(),
    },
  ];

  // Insert suggestions
  const { data, error } = await supabase
    .from('race_suggestions_cache')
    .insert(suggestions)
    .select();

  if (error) {
    console.error('❌ Error inserting suggestions:', error);
    process.exit(1);
  }

  console.log(`✅ Successfully seeded ${data.length} race suggestions for Sarah Chen`);
  console.log('Suggestions:', data.map(s => s.race_data.raceName).join(', '));
}

seedRaceSuggestions().catch(console.error);
