/**
 * Insert demo race analysis data directly via Supabase service role
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Required: EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const demoData = [
  {
    sailor_id: '4ef0d350-a582-4ca8-beab-cf3d8c112589',
    race_id: '718e0559-b9e0-482b-be7e-3af671bcfac3',
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
    sailor_id: '4ef0d350-a582-4ca8-beab-cf3d8c112589',
    race_id: '3d12a4bb-21fc-42ed-848f-437e6b3e984f',
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
    sailor_id: '4ef0d350-a582-4ca8-beab-cf3d8c112589',
    race_id: 'a663dbd8-203d-4751-a083-7a8dcd55b0df',
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
    sailor_id: '4ef0d350-a582-4ca8-beab-cf3d8c112589',
    race_id: '3738ebaf-3ac4-442d-8726-339ba1a297f3',
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
    sailor_id: '4ef0d350-a582-4ca8-beab-cf3d8c112589',
    race_id: '8801f16a-b4a2-4428-80a9-8d54a432e7f8',
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

async function insertData() {
  console.log('🌱 Inserting demo race analysis data...\n');

  // Check if data already exists
  const { data: existing, error: checkError } = await supabase
    .from('race_analysis')
    .select('id')
    .eq('sailor_id', '4ef0d350-a582-4ca8-beab-cf3d8c112589');

  if (checkError) {
    console.error('❌ Error checking existing data:', checkError);
    return;
  }

  if (existing && existing.length > 0) {
    console.log(`⚠️  Found ${existing.length} existing race analysis records`);
    console.log('Deleting existing records...');

    const { error: deleteError } = await supabase
      .from('race_analysis')
      .delete()
      .eq('sailor_id', '4ef0d350-a582-4ca8-beab-cf3d8c112589');

    if (deleteError) {
      console.error('❌ Error deleting existing data:', deleteError);
      return;
    }
    console.log('✅ Deleted existing records\n');
  }

  // Insert new data
  const { data, error } = await supabase.from('race_analysis').insert(demoData).select();

  if (error) {
    console.error('❌ Error inserting data:', error);
    return;
  }

  console.log(`✅ Successfully inserted ${data.length} race analysis records\n`);
  console.log('📊 Pattern Summary:');
  console.log('   • Strengths: Start execution (avg 4.2/5, improving)');
  console.log('   • Strengths: Upwind speed (avg 3.6/5, improving)');
  console.log('   • Strengths: Puff Response Framework (78/100, improving)');
  console.log('   • Focus: Mark rounding (avg 2.8/5, declining)');
  console.log('   • Focus: Layline judgment (recurring issue)');
  console.log('\n✨ Now navigate to Settings → My Learning to see the insights!');
  console.log('   Path: More tab → My Learning → Race Learning Insights');
}

insertData()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
