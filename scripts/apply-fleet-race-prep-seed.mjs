/**
 * Apply Fleet Race Prep Seed Data directly using raw SQL
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyFleetRacePrepSeed() {
  console.log('🌱 Applying fleet race prep seed data...\n');

  try {
    // Read the migration SQL file
    const sqlPath = join(__dirname, '../supabase/migrations/20251109000000_seed_fleet_race_prep_data.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📄 Executing SQL migration...');

    // Execute the SQL directly using rpc
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      console.log('\n💡 Trying alternative approach with individual inserts...\n');

      // Fallback: execute parts manually
      await fallbackSeed();
      return;
    }

    console.log('✅ Fleet race prep data seeded successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Navigate to http://localhost:8081');
    console.log('   2. Go to Fleet dashboard and select "Hong Kong Etchells Fleet"');
    console.log('   3. Verify the "Race Prep" section shows upcoming races and results');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

async function fallbackSeed() {
  const fleet_id = '27c63e2c-189f-4195-8256-810c454fc4c1';
  const userIds = [
    '76069517-bf07-485a-b470-4baa9b9c87a7',
    '162a7a57-c598-443f-98f9-c27f5e5289e7',
    'e9945201-bdd6-4934-abc6-7b49dc445929',
    'f5224556-60d1-446f-912a-44ee68a499f3',
  ];

  console.log('1️⃣ Adding fleet members...');
  for (const user_id of userIds) {
    const { error } = await supabase
      .from('fleet_members')
      .upsert({
        fleet_id,
        user_id,
        role: 'member',
        status: 'active',
        joined_at: new Date().toISOString(),
      }, {
        onConflict: 'fleet_id,user_id'
      });

    if (error && !error.message.includes('duplicate')) {
      console.error(`   ⚠️ Could not add user ${user_id.substring(0, 8)}:`, error.message);
    }
  }
  console.log('   ✅ Fleet members processed');

  console.log('\n2️⃣ Creating upcoming races...');
  const races = [
    { name: 'Saturday Club Race - Race 1', days: 2, area: 'Eastern Course', series: 'Winter Series 2025', location: 'Victoria Harbour' },
    { name: 'Sunday Championship - Heat 2', days: 3, area: 'Western Course', series: 'Hong Kong Championship', location: 'Stanley Bay' },
    { name: 'Midweek Pursuit Race', days: 6, area: 'Central Course', series: 'Weekday Regatta', location: 'Aberdeen Harbour' },
    { name: 'Next Weekend Qualifier', days: 9, area: 'Northern Course', series: 'Regional Qualifiers', location: 'Tolo Harbour' },
  ];

  let raceCount = 0;
  for (const race of races) {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + race.days);

    const { error } = await supabase
      .from('races')
      .insert({
        name: race.name,
        start_time: startTime.toISOString(),
        racing_area_name: race.area,
        race_series: race.series,
        location: race.location,
      });

    if (error) {
      console.error(`   ⚠️ Could not create race "${race.name}":`, error.message);
    } else {
      raceCount++;
    }
  }
  console.log(`   ✅ Created ${raceCount}/4 races`);

  console.log('\n3️⃣ Creating race_result posts...');
  const posts = [
    {
      author_id: userIds[0],
      days_ago: 2,
      content: 'Great day on the water! Nailed the start and stayed in clear air most of the race. Port tack approach on final beat paid off massively.',
      metadata: { finish_position: 3, fleet_size: 24, race_name: 'Saturday Series - Race 12', conditions: 'Light and shifty, 8-12 knots' }
    },
    {
      author_id: userIds[1],
      days_ago: 5,
      content: 'Tough race today - had to dig out from a bad start. Learned a lot about playing the shifts on the second beat. Finished mid-fleet but gained 8 positions after being last at mark 1.',
      metadata: { finish_position: 12, fleet_size: 26, race_name: 'Sunday Championship - Heat 1', conditions: 'Puffy 15-20 knots with big shifts' }
    },
    {
      author_id: userIds[2],
      days_ago: 7,
      content: 'First podium of the season! 🥈 Conservative start paid off - stayed patient and picked off boats one by one. Thanks to everyone who shared tuning notes before the event.',
      metadata: { finish_position: 2, fleet_size: 18, race_name: 'Midweek Pursuit', conditions: 'Moderate breeze, 12-15 knots' }
    },
  ];

  let postCount = 0;
  for (const post of posts) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - post.days_ago);

    const { error } = await supabase
      .from('fleet_posts')
      .insert({
        fleet_id,
        author_id: post.author_id,
        post_type: 'race_result',
        content: post.content,
        metadata: post.metadata,
        visibility: 'fleet',
        is_pinned: false,
        created_at: createdAt.toISOString(),
      });

    if (error) {
      console.error(`   ⚠️ Could not create post:`, error.message);
    } else {
      postCount++;
    }
  }
  console.log(`   ✅ Created ${postCount}/3 race_result posts`);

  console.log('\n✅ Fallback seed completed!');
  console.log(`\n📊 Summary:`);
  console.log(`   Races: ${raceCount}/4`);
  console.log(`   Posts: ${postCount}/3`);
}

// Run the seed function
applyFleetRacePrepSeed()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
