#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function refreshSchemaCache() {
  console.log('🔄 Refreshing PostgREST schema cache...');

  try {
    // Method 1: Use the Supabase REST API to reload schema
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'resolution=ignore-duplicates',
      },
    });

    console.log('API Response status:', response.status);

    // Method 2: Alternative - we can try directly using rpc
    console.log('\n🔄 Attempting to reload via SQL NOTIFY...');

    const { data, error } = await supabase.rpc('pgrst_reload_config');

    if (error) {
      console.warn('⚠️  pgrst_reload_config not available:', error.message);
      console.log('\n💡 The schema cache should auto-reload within 10 seconds.');
      console.log('   If tables still don\'t work, restart the Supabase instance.');
    } else {
      console.log('✅ Schema cache reload triggered!');
    }

  } catch (err) {
    console.warn('⚠️  Could not programmatically reload schema:', err.message);
    console.log('\n💡 The PostgREST schema cache typically reloads automatically.');
    console.log('   You can also trigger a reload via the Supabase Dashboard:');
    console.log('   Settings → Database → Connection pooling → Restart');
  }

  // Wait a moment and test
  console.log('\n⏳ Waiting 5 seconds for cache to refresh...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('\n🧪 Testing fleet_posts query again...');
  const { data, error } = await supabase
    .from('fleet_posts')
    .select(`
      *,
      author:author_id (id, full_name, avatar_url)
    `)
    .limit(1);

  if (error) {
    console.error('❌ Still failing:', error.message);
    console.log('\n📝 Next steps:');
    console.log('   1. Go to Supabase Dashboard');
    console.log('   2. Settings → API → Restart API');
    console.log('   3. Or wait up to 60 seconds for automatic reload');
  } else {
    console.log('✅ Query now works! Schema cache refreshed.');
  }
}

refreshSchemaCache().catch(console.error);
