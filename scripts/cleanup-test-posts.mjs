#!/usr/bin/env node
/**
 * Cleanup script for Maestro test posts
 * Deletes any posts with [MAESTRO-TEST] in the title
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  console.log('Cleaning up Maestro test posts...');

  // First, find posts with [MAESTRO-TEST] in title
  const { data: posts, error: findError } = await supabase
    .from('venue_discussions')
    .select('id, title')
    .or('title.ilike.%[MAESTRO-TEST]%,title.ilike.%[MAESTRO-OUTCOMES]%');

  if (findError) {
    console.error('Error finding test posts:', findError);
    return;
  }

  const count = posts ? posts.length : 0;
  console.log('Found ' + count + ' test posts to delete');

  if (posts && posts.length > 0) {
    console.log('Posts to delete:');
    posts.forEach(p => console.log('  - ' + p.title));

    const ids = posts.map(p => p.id);
    const { error: deleteError } = await supabase
      .from('venue_discussions')
      .delete()
      .in('id', ids);

    if (deleteError) {
      console.error('Error deleting test posts:', deleteError);
    } else {
      console.log('Successfully deleted ' + count + ' test posts');
    }
  } else {
    console.log('No test posts found to clean up');
  }
}

cleanup();
