/**
 * Fix demo user data - create sailor profile and add race analysis
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const demoUserId = 'f6f6a7f6-7755-412b-a87b-3a7617721cc7';
const regattaIds = [
  '718e0559-b9e0-482b-be7e-3af671bcfac3',
  '3d12a4bb-21fc-42ed-848f-437e6b3e984f',
  'a663dbd8-203d-4751-a083-7a8dcd55b0df',
  '3738ebaf-3ac4-442d-8726-339ba1a297f3',
  '8801f16a-b4a2-4428-80a9-8d54a432e7f8',
];

async function fixDemoUserData() {
  console.log('🔧 Fixing demo user data...\n');

  // Create or get sailor profile for demo user
  let { data: profile, error: profileError } = await supabase
    .from('sailor_profiles')
    .select('id')
    .eq('user_id', demoUserId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('❌ Error querying sailor profile:', profileError);
    return;
  }

  if (!profile) {
    console.log('Creating sailor profile for demo user...');
    const { data: newProfile, error: createError } = await supabase
      .from('sailor_profiles')
      .insert({
        user_id: demoUserId,
        sailing_number: 'DEMO-2024',
        home_club: 'Royal Hong Kong Yacht Club',
        experience_level: 'intermediate',
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating profile:', createError);
      return;
    }

    profile = newProfile;
    console.log('✅ Created sailor profile:', profile.id);
  } else {
    console.log('✅ Found existing sailor profile:', profile.id);
  }

  const sailorId = profile.id;

  // Delete existing race analysis for this sailor
  const { error: deleteError } = await supabase
    .from('race_analysis')
    .delete()
    .eq('sailor_id', sailorId);

  if (deleteError) {
    console.error('⚠️  Error deleting existing data:', deleteError);
  }

  // Insert race analysis data
  const analysisData = [
    {
      sailor_id: sailorId,
      race_id: regattaIds[0],
      equipment_rating: 4,
      planning_rating: 4,
      crew_rating: 4,
      prestart_rating: 5,
      start_rating: 5,
      upwind_rating: 4,
      upwind_shift_awareness: 4,
      windward_mark_rating: 3,
      downwind_rating: 4,
      leeward_mark_rating: 2,
      finish_rating: 4,
      overall_satisfaction: 4,
      start_notes: 'Perfect timing on favored pin end, clean air',
      upwind_notes: 'Good speed, read the shifts well',
      windward_mark_notes: 'Overstanding layline, lost 2 boat lengths',
      leeward_mark_notes: 'Late gybe, came in too high',
      key_learnings: ['Nail start execution', 'Improve mark approach timing'],
      framework_scores: {
        puff_response: 82,
        shift_awareness: 78,
        delayed_tack_usage: 65,
        downwind_detection: 70,
        getting_in_phase: 75,
        covering_tactics: 60,
        overall_framework_adoption: 72,
      },
    },
    {
      sailor_id: sailorId,
      race_id: regattaIds[1],
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
      key_learnings: ['Start consistency good', 'Mark rounding needs work'],
      framework_scores: {
        puff_response: 80,
        shift_awareness: 75,
        delayed_tack_usage: 62,
        downwind_detection: 68,
        getting_in_phase: 73,
        covering_tactics: 58,
        overall_framework_adoption: 70,
      },
    },
    {
      sailor_id: sailorId,
      race_id: regattaIds[2],
      equipment_rating: 3,
      planning_rating: 4,
      crew_rating: 4,
      prestart_rating: 4,
      start_rating: 4,
      upwind_rating: 3,
      upwind_shift_awareness: 3,
      windward_mark_rating: 2,
      downwind_rating: 3,
      leeward_mark_rating: 2,
      finish_rating: 3,
      overall_satisfaction: 3,
      start_notes: 'Port end favored, executed well',
      upwind_notes: 'Got stuck in bad air mid-beat',
      windward_mark_notes: 'Way overstanding, lost 3 lengths',
      leeward_mark_notes: 'Traffic at mark, poor exit',
      key_learnings: ['Keep working on starts', 'Practice layline calls'],
      framework_scores: {
        puff_response: 76,
        shift_awareness: 72,
        delayed_tack_usage: 60,
        downwind_detection: 65,
        getting_in_phase: 70,
        covering_tactics: 55,
        overall_framework_adoption: 68,
      },
    },
    {
      sailor_id: sailorId,
      race_id: regattaIds[3],
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
      key_learnings: ['Start line bias reading improving', 'Need more confidence'],
      framework_scores: {
        puff_response: 74,
        shift_awareness: 70,
        delayed_tack_usage: 58,
        downwind_detection: 63,
        getting_in_phase: 68,
        covering_tactics: 52,
        overall_framework_adoption: 65,
      },
    },
    {
      sailor_id: sailorId,
      race_id: regattaIds[4],
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
      key_learnings: ['First race, baseline performance'],
      framework_scores: {
        puff_response: 70,
        shift_awareness: 68,
        delayed_tack_usage: 55,
        downwind_detection: 60,
        getting_in_phase: 65,
        covering_tactics: 50,
        overall_framework_adoption: 62,
      },
    },
  ];

  console.log('\nInserting race analysis data...');
  const { data, error } = await supabase.from('race_analysis').insert(analysisData).select();

  if (error) {
    console.error('❌ Error inserting data:', error);
    return;
  }

  console.log(`✅ Inserted ${data.length} race analysis records\n`);
  console.log('📊 Data Summary:');
  console.log('   • Sailor ID:', sailorId);
  console.log('   • User ID:', demoUserId);
  console.log('   • Email: demo-sailor@regattaflow.io');
  console.log('   • Records: 5 races');
  console.log('\n✨ Refresh the app to see the learning insights!');
}

fixDemoUserData()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
