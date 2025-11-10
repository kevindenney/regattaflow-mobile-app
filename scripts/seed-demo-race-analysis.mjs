/**
 * Seed Demo Race Analysis Data
 * Creates sample race analysis records for the Demo Sailor to showcase learning insights
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedDemoRaceAnalysis() {
  console.log('🌱 Seeding demo race analysis data...\n');

  // Get any sailor profile (we'll use the first one)
  const { data: profiles, error: profileError } = await supabase
    .from('sailor_profiles')
    .select('id, user_id, sailing_number, home_club')
    .limit(1);

  if (profileError) {
    console.error('❌ Error querying sailor profiles:', profileError);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.error('❌ Could not find any sailor profile');
    console.log('Please create a sailor profile first');
    return;
  }

  const sailorId = profiles[0].id;
  console.log('✅ Found sailor profile:', sailorId);
  console.log('   Sailor:', profiles[0].sailing_number || 'No sailing number', '/', profiles[0].home_club || 'No club');

  // Get some races for this sailor
  let { data: races, error: racesError } = await supabase
    .from('races')
    .select('id, name, start_time')
    .order('start_time', { ascending: false })
    .limit(5);

  if (racesError) {
    console.error('❌ Error querying races:', racesError);
    return;
  }

  if (!races || races.length === 0) {
    console.log('⚠️ No races found, creating sample races...');

    // Create sample races
    const sampleRaces = [
      {
        name: 'Corinthian & 4',
        start_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        location: 'Hong Kong',
        class: 'One Design',
      },
      {
        name: 'c34',
        start_time: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
        location: 'Hong Kong',
        class: 'IRC',
      },
      {
        name: 'Race 9',
        start_time: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks ago
        location: 'Hong Kong',
        class: 'One Design',
      },
      {
        name: 'Race 7',
        start_time: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), // 4 weeks ago
        location: 'Hong Kong',
        class: 'IRC',
      },
      {
        name: 'c65',
        start_time: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 5 weeks ago
        location: 'Hong Kong',
        class: 'One Design',
      },
    ];

    const { data: createdRaces, error: createRacesError } = await supabase
      .from('races')
      .insert(sampleRaces)
      .select();

    if (createRacesError) {
      console.error('❌ Failed to create races:', createRacesError);
      return;
    }

    races = createdRaces;
    console.log(`✅ Created ${races.length} sample races`);
  }

  console.log(`✅ Using ${races.length} races for analysis data\n`);

  // Create race analysis data with realistic patterns
  // Pattern: Great starts, improving upwind, but struggling with mark roundings
  const analysisData = [
    // Most recent race - Best performance
    {
      sailor_id: sailorId,
      race_id: races[0].id,
      equipment_rating: 4,
      planning_rating: 4,
      crew_rating: 4,
      prestart_rating: 5,
      start_rating: 5,
      upwind_rating: 4,
      upwind_shift_awareness: 4,
      windward_mark_rating: 3, // Weakness
      downwind_rating: 4,
      leeward_mark_rating: 2, // Weakness
      finish_rating: 4,
      overall_satisfaction: 4,
      start_notes: 'Perfect timing on favored pin end, clean air',
      upwind_notes: 'Good speed, read the shifts well',
      windward_mark_notes: 'Overstanding layline, lost 2 boat lengths',
      leeward_mark_notes: 'Late gybe, came in too high',
      key_learnings: JSON.stringify(['Nail start execution', 'Improve mark approach timing']),
      framework_scores: JSON.stringify({
        puff_response: 82,
        shift_awareness: 78,
        delayed_tack_usage: 65,
        downwind_detection: 70,
        getting_in_phase: 75,
        covering_tactics: 60,
        overall_framework_adoption: 72,
      }),
    },
    // 2 weeks ago
    {
      sailor_id: sailorId,
      race_id: races[1].id,
      equipment_rating: 4,
      planning_rating: 4,
      crew_rating: 4,
      prestart_rating: 4,
      start_rating: 4,
      upwind_rating: 4,
      upwind_shift_awareness: 4,
      windward_mark_rating: 3,
      downwind_rating: 4,
      leeward_mark_rating: 3,
      finish_rating: 3,
      overall_satisfaction: 4,
      start_notes: 'Good start, mid-line with clear air',
      upwind_notes: 'Solid beat, could have tacked sooner on headers',
      windward_mark_notes: 'Late to layline again',
      downwind_notes: 'Good VMG, stayed in pressure',
      key_learnings: JSON.stringify(['Start consistency good', 'Mark rounding needs work']),
      framework_scores: JSON.stringify({
        puff_response: 80,
        shift_awareness: 75,
        delayed_tack_usage: 62,
        downwind_detection: 68,
        getting_in_phase: 73,
        covering_tactics: 58,
        overall_framework_adoption: 70,
      }),
    },
    // 3 weeks ago
    {
      sailor_id: sailorId,
      race_id: races[2].id,
      equipment_rating: 3,
      planning_rating: 4,
      crew_rating: 4,
      prestart_rating: 4,
      start_rating: 4,
      upwind_rating: 3,
      upwind_shift_awareness: 3,
      windward_mark_rating: 2, // Getting worse
      downwind_rating: 3,
      leeward_mark_rating: 2,
      finish_rating: 3,
      overall_satisfaction: 3,
      start_notes: 'Port end favored, executed well',
      upwind_notes: 'Got stuck in bad air mid-beat',
      windward_mark_notes: 'Way overstanding, lost 3 lengths',
      leeward_mark_notes: 'Traffic at mark, poor exit',
      key_learnings: JSON.stringify(['Keep working on starts', 'Practice layline calls']),
      framework_scores: JSON.stringify({
        puff_response: 76,
        shift_awareness: 72,
        delayed_tack_usage: 60,
        downwind_detection: 65,
        getting_in_phase: 70,
        covering_tactics: 55,
        overall_framework_adoption: 68,
      }),
    },
    // 4 weeks ago
    {
      sailor_id: sailorId,
      race_id: races[3].id,
      equipment_rating: 4,
      planning_rating: 3,
      crew_rating: 4,
      prestart_rating: 4,
      start_rating: 4,
      upwind_rating: 3,
      upwind_shift_awareness: 3,
      windward_mark_rating: 3,
      downwind_rating: 3,
      leeward_mark_rating: 3,
      finish_rating: 4,
      overall_satisfaction: 3,
      start_notes: 'Clean start but conservative',
      upwind_notes: 'OK speed, missed a big right shift',
      windward_mark_notes: 'Rounded OK but could have been tighter',
      finish_notes: 'Good finish, ducked boats for favored end',
      key_learnings: JSON.stringify(['Start line bias reading improving', 'Need more confidence']),
      framework_scores: JSON.stringify({
        puff_response: 74,
        shift_awareness: 70,
        delayed_tack_usage: 58,
        downwind_detection: 63,
        getting_in_phase: 68,
        covering_tactics: 52,
        overall_framework_adoption: 65,
      }),
    },
    // 5 weeks ago - First race
    {
      sailor_id: sailorId,
      race_id: races[4].id,
      equipment_rating: 3,
      planning_rating: 3,
      crew_rating: 4,
      prestart_rating: 3,
      start_rating: 4,
      upwind_rating: 3,
      upwind_shift_awareness: 3,
      windward_mark_rating: 3,
      downwind_rating: 3,
      leeward_mark_rating: 3,
      finish_rating: 3,
      overall_satisfaction: 3,
      start_notes: 'Decent start, mid-pack',
      upwind_notes: 'Learning the boat speed',
      windward_mark_notes: 'Followed the fleet',
      key_learnings: JSON.stringify(['First race, baseline performance']),
      framework_scores: JSON.stringify({
        puff_response: 70,
        shift_awareness: 68,
        delayed_tack_usage: 55,
        downwind_detection: 60,
        getting_in_phase: 65,
        covering_tactics: 50,
        overall_framework_adoption: 62,
      }),
    },
  ];

  // Check if analysis already exists for these races
  const { data: existingAnalysis } = await supabase
    .from('race_analysis')
    .select('id, race_id')
    .eq('sailor_id', sailorId)
    .in('race_id', races.map(r => r.id));

  if (existingAnalysis && existingAnalysis.length > 0) {
    console.log(`⚠️ Found ${existingAnalysis.length} existing analysis records`);
    console.log('Deleting existing records to re-seed...');

    const { error: deleteError } = await supabase
      .from('race_analysis')
      .delete()
      .eq('sailor_id', sailorId)
      .in('race_id', races.map(r => r.id));

    if (deleteError) {
      console.error('❌ Failed to delete existing analysis:', deleteError);
      return;
    }
    console.log('✅ Deleted existing records\n');
  }

  // Insert race analysis data
  console.log('Inserting race analysis data...');
  const { data: insertedAnalysis, error: insertError } = await supabase
    .from('race_analysis')
    .insert(analysisData)
    .select();

  if (insertError) {
    console.error('❌ Failed to insert race analysis:', insertError);
    console.error('Error details:', JSON.stringify(insertError, null, 2));
    return;
  }

  console.log(`\n✅ Successfully seeded ${insertedAnalysis.length} race analysis records`);
  console.log('\n📊 Pattern Summary:');
  console.log('   • Strengths: Start execution (avg 4.2/5, improving)');
  console.log('   • Strengths: Upwind speed (avg 3.6/5, improving)');
  console.log('   • Strengths: Puff Response Framework (78/100, improving)');
  console.log('   • Focus: Mark rounding (avg 2.8/5, declining)');
  console.log('   • Focus: Layline judgment (recurring issue)');
  console.log('\n🎯 Expected AI Insights:');
  console.log('   Keep Doing: "Your start game is championship-level (4.2 avg, improving)"');
  console.log('   Focus Next: "Mark rounding (2.8 avg, declining) costing 2-3 boat lengths"');
  console.log('   Practice: "Shore drill: Mark 2-3 mast widths inside shrouds when tacking"');
  console.log('   Reminder: "You own the start line - carry that confidence through marks"');
  console.log('\n✨ Now navigate to Settings → My Learning to see the insights!');
  console.log('   Path: More tab → My Learning → Race Learning Insights');
}

// Run the seed function
seedDemoRaceAnalysis()
  .then(() => {
    console.log('\n✅ Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });
