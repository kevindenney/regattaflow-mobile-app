#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFleetTables() {
  console.log('🔍 Testing fleet social tables...\n');

  // Test 1: Check if tables exist
  const tables = ['fleet_posts', 'fleet_post_comments', 'fleet_followers', 'fleet_notifications'];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`❌ ${table}: ${error.message}`);
        console.error(`   Code: ${error.code}, Details: ${error.details}`);
      } else {
        console.log(`✅ ${table}: exists (count: ${count ?? 'unknown'})`);
      }
    } catch (err) {
      console.error(`❌ ${table}: ${err.message}`);
    }
  }

  console.log('\n🔍 Testing specific query from FleetSocialService...\n');

  // Test 2: Try the exact query that's failing
  const testFleetId = '1bcdfd00-6325-404e-81a9-2fa8ca25d2c3';
  try {
    const { data, error } = await supabase
      .from('fleet_posts')
      .select(`
        *,
        author:author_id (id, full_name, avatar_url),
        likes:fleet_post_likes(count),
        comments:fleet_post_comments(count),
        shares:fleet_post_shares(count)
      `)
      .eq('fleet_id', testFleetId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Query failed:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
    } else {
      console.log('✅ Query succeeded!');
      console.log(`   Found ${data?.length ?? 0} posts`);
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n🔍 Checking auth.users foreign key references...\n');

  // Test 3: Check if we can access auth schema
  try {
    const { data, error } = await supabase
      .from('fleet_posts')
      .select('id, author_id')
      .limit(1);

    if (error) {
      console.error('❌ Simple query failed:', error.message);
    } else {
      console.log('✅ Simple query succeeded');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

testFleetTables().catch(console.error);
