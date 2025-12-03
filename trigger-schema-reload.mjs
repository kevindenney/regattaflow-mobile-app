#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project ref from URL');
  process.exit(1);
}

console.log(`📋 Project: ${projectRef}`);

async function reloadSchema() {
  console.log('\n🔄 Method 1: Using pg_notify to trigger schema reload...');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Try sending a NOTIFY signal that PostgREST listens to
    const { data, error } = await supabase.rpc('pg_notify', {
      channel: 'pgrst',
      payload: 'reload schema'
    });

    if (error) {
      console.log('⚠️  pg_notify method not available');
    } else {
      console.log('✅ Sent reload signal to PostgREST');
    }
  } catch (err) {
    console.log('⚠️  pg_notify error:', err.message);
  }

  console.log('\n🔄 Method 2: Restarting via Management API...');

  if (!supabaseAccessToken) {
    console.log('⚠️  SUPABASE_ACCESS_TOKEN not set, skipping API restart');
  } else {
    try {
      const response = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/restart`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ services: ['postgrest'] })
        }
      );

      if (response.ok) {
        console.log('✅ PostgREST restart triggered via API');
        console.log('⏳ Waiting 15 seconds for restart...');
        await new Promise(resolve => setTimeout(resolve, 15000));
      } else {
        const text = await response.text();
        console.log(`⚠️  API restart failed (${response.status}):`, text);
      }
    } catch (err) {
      console.log('⚠️  API error:', err.message);
    }
  }

  console.log('\n🧪 Testing fleet_posts query...');

  await new Promise(resolve => setTimeout(resolve, 2000));

  const { data, error } = await supabase
    .from('fleet_posts')
    .select(`
      *,
      author:author_id (id, full_name, avatar_url)
    `)
    .limit(1);

  if (error) {
    console.error('❌ Query still failing:', error.message);
    console.log('\n📝 Manual steps required:');
    console.log(`   1. Open: https://supabase.com/dashboard/project/${projectRef}/settings/api`);
    console.log('   2. Click "Restart API" button');
    console.log('   3. Wait 30 seconds and refresh your app');
  } else {
    console.log('✅ Query works! Schema cache refreshed successfully.');
  }
}

reloadSchema().catch(console.error);
