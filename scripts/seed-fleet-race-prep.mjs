/**
 * Seed Fleet Race Prep Data
 * Creates sample race_result posts and upcoming shared races for fleet dashboard testing
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

// Helper to create timestamps
const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const hoursFromNow = (hours) => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
};

async function seedFleetRacePrep() {
  console.log('🌱 Seeding fleet race prep data...\n');

  // Step 1: Get an active fleet
  const { data: fleets, error: fleetsError } = await supabase
    .from('fleets')
    .select('id, name, class_id, club_id')
    .eq('visibility', 'public')
    .limit(1);

  if (fleetsError || !fleets || fleets.length === 0) {
    console.error('❌ Could not find any public fleet');
    console.log('Please create a fleet first or run seed-complete-clubs-and-fleets.mjs');
    return;
  }

  const fleet = fleets[0];
  console.log(`✅ Using fleet: ${fleet.name} (${fleet.id})`);

  // Step 2: Get fleet members, or create them if needed
  let { data: members, error: membersError } = await supabase
    .from('fleet_members')
    .select('user_id')
    .eq('fleet_id', fleet.id)
    .eq('status', 'active')
    .limit(5);

  // If no members, add some demo users to the fleet
  if (!members || members.length === 0) {
    console.log('⚠️ No members found, adding demo users to fleet...');

    // Use known demo user IDs (from the seed-demo-users-simple.mjs script)
    const demoUserIds = [
      '76069517-bf07-485a-b470-4baa9b9c87a7',  // s17kdenney@icloud.com
      '162a7a57-c598-443f-98f9-c27f5e5289e7',  // mike.thompson@racing.com
      'e9945201-bdd6-4934-abc6-7b49dc445929',  // emma.wilson@yacht.club
      'f5224556-60d1-446f-912a-44ee68a499f3',  // james.rodriguez@fleet.com
    ];

    // Add users as fleet members
    const newMembers = demoUserIds.map(userId => ({
      fleet_id: fleet.id,
      user_id: userId,
      role: 'member',
      status: 'active',
      joined_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('fleet_members')
      .insert(newMembers);

    if (insertError) {
      console.error('❌ Failed to add members to fleet:', insertError.message);
      // Continue anyway - maybe some members were added
    } else {
      console.log(`✅ Added ${demoUserIds.length} demo users to fleet`);
    }

    members = demoUserIds.map(id => ({ user_id: id }));
  }

  const memberIds = members.map(m => m.user_id);
  console.log(`✅ Found ${memberIds.length} fleet members`);

  // Step 3: Create upcoming shared races
  console.log('\n📅 Creating upcoming shared races...');

  const upcomingRaces = [
    {
      name: 'Saturday Club Race - Race 1',
      start_time: daysFromNow(2),  // 2 days from now
      class: fleet.class_id,
      racing_area_name: 'Eastern Course',
      race_series: 'Winter Series 2025',
      location: 'Victoria Harbour',
    },
    {
      name: 'Sunday Championship - Heat 2',
      start_time: daysFromNow(3),  // 3 days from now
      class: fleet.class_id,
      racing_area_name: 'Western Course',
      race_series: 'Hong Kong Championship',
      location: 'Stanley Bay',
    },
    {
      name: 'Midweek Pursuit Race',
      start_time: daysFromNow(6),  // 6 days from now
      class: fleet.class_id,
      racing_area_name: 'Central Course',
      race_series: 'Weekday Regatta',
      location: 'Aberdeen Harbour',
    },
    {
      name: 'Next Weekend Qualifier',
      start_time: daysFromNow(9),  // 9 days from now
      class: fleet.class_id,
      racing_area_name: 'Northern Course',
      race_series: 'Regional Qualifiers',
      location: 'Tolo Harbour',
    },
  ];

  const createdRaces = [];
  for (const race of upcomingRaces) {
    const { data, error } = await supabase
      .from('races')
      .insert(race)
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to create race "${race.name}":`, error.message);
    } else {
      createdRaces.push(data);
      console.log(`   ✅ Created: ${race.name} (starts ${new Date(race.start_time).toLocaleString()})`);
    }
  }

  console.log(`\n✅ Created ${createdRaces.length} upcoming races`);

  // Step 4: Create race_result posts
  console.log('\n🏆 Creating race_result posts...');

  const resultPosts = [
    {
      fleet_id: fleet.id,
      author_id: memberIds[0],
      post_type: 'race_result',
      content: 'Great day on the water! Nailed the start and stayed in clear air most of the race. Port tack approach on final beat paid off massively.',
      metadata: {
        finish_position: 3,
        fleet_size: 24,
        race_name: 'Saturday Series - Race 12',
        conditions: 'Light and shifty, 8-12 knots',
      },
      visibility: 'fleet',
      is_pinned: false,
      created_at: daysFromNow(-2),  // 2 days ago
    },
    {
      fleet_id: fleet.id,
      author_id: memberIds[1] || memberIds[0],
      post_type: 'race_result',
      content: 'Tough race today - had to dig out from a bad start. Learned a lot about playing the shifts on the second beat. Finished mid-fleet but gained 8 positions after being last at mark 1.',
      metadata: {
        finish_position: 12,
        fleet_size: 26,
        race_name: 'Sunday Championship - Heat 1',
        conditions: 'Puffy 15-20 knots with big shifts',
      },
      visibility: 'fleet',
      is_pinned: false,
      created_at: daysFromNow(-5),  // 5 days ago
    },
    {
      fleet_id: fleet.id,
      author_id: memberIds[2] || memberIds[0],
      post_type: 'race_result',
      content: 'First podium of the season! 🥈 Conservative start paid off - stayed patient and picked off boats one by one. Thanks to everyone who shared tuning notes before the event.',
      metadata: {
        finish_position: 2,
        fleet_size: 18,
        race_name: 'Midweek Pursuit',
        conditions: 'Moderate breeze, 12-15 knots',
      },
      visibility: 'fleet',
      is_pinned: false,
      created_at: daysFromNow(-7),  // 1 week ago
    },
    {
      fleet_id: fleet.id,
      author_id: memberIds[3] || memberIds[0],
      post_type: 'race_result',
      content: 'Race abandoned after 2 legs due to lightning. Was sitting 5th at the time. Looking forward to the resail next weekend.',
      metadata: {
        finish_position: null,
        fleet_size: 22,
        race_name: 'Regional Qualifier',
        conditions: 'Building breeze, thunderstorms',
        status: 'abandoned',
      },
      visibility: 'fleet',
      is_pinned: false,
      created_at: daysFromNow(-10),  // 10 days ago
    },
  ];

  let createdPosts = 0;
  for (const post of resultPosts) {
    const { data, error } = await supabase
      .from('fleet_posts')
      .insert(post)
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to create post:`, error.message);
    } else {
      createdPosts++;
      const position = post.metadata.finish_position
        ? `P${post.metadata.finish_position}/${post.metadata.fleet_size}`
        : 'DNF';
      console.log(`   ✅ ${position} - ${post.metadata.race_name} by ${post.author_id.substring(0, 8)}...`);
    }
  }

  console.log(`\n✅ Created ${createdPosts} race_result posts`);

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Fleet: ${fleet.name}`);
  console.log(`   Upcoming races: ${createdRaces.length}`);
  console.log(`   Result posts: ${createdPosts}`);
  console.log(`\n✅ Fleet race prep data seeded successfully!`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Navigate to the Fleet dashboard in your app`);
  console.log(`   2. Select the "${fleet.name}" fleet`);
  console.log(`   3. Verify the "Race Prep" section shows:`);
  console.log(`      - Next race with countdown`);
  console.log(`      - Recent results (up to 3 posts)`);
  console.log(`   4. Test empty states by temporarily removing data`);
}

// Run the seed function
seedFleetRacePrep()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  });
