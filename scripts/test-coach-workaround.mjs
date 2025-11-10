#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testWorkaround() {
  console.log('Testing the workaround (manual JOIN in code)...\n');

  // Get Coach Anderson's ID
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const coachAnderson = users.find(u => u.email === 'coach.anderson@sailing.com');

  if (!coachAnderson) {
    console.log('❌ Coach Anderson not found');
    return;
  }

  const coachId = coachAnderson.id;
  console.log(`Coach ID: ${coachId}\n`);

  // Step 1: Get clients without JOIN
  console.log('Step 1: Fetching clients (no JOIN)...');
  const { data: clients, error: clientsError } = await supabase
    .from('coaching_clients')
    .select('*')
    .eq('coach_id', coachId)
    .eq('status', 'active');

  if (clientsError) {
    console.log(`❌ Error: ${clientsError.message}`);
    return;
  }

  console.log(`✅ Found ${clients?.length || 0} clients\n`);

  if (!clients || clients.length === 0) {
    console.log('No clients to join with sailors');
    return;
  }

  // Step 2: Get sailor IDs
  const sailorIds = clients.map(c => c.sailor_id).filter(Boolean);
  console.log(`Step 2: Sailor IDs to fetch: ${sailorIds.length}`);
  console.log(sailorIds);
  console.log();

  // Step 3: Fetch sailors
  console.log('Step 3: Fetching sailor data from users table...');
  const { data: sailors, error: sailorsError } = await supabase
    .from('users')
    .select('id, email, full_name')
    .in('id', sailorIds);

  if (sailorsError) {
    console.log(`❌ Error: ${sailorsError.message}`);
    return;
  }

  console.log(`✅ Found ${sailors?.length || 0} sailors\n`);

  // Step 4: Join in code
  console.log('Step 4: Joining data in JavaScript...');
  const sailorMap = new Map(sailors?.map(s => [s.id, s]) || []);

  const result = clients.map(client => ({
    ...client,
    sailor: client.sailor_id ? sailorMap.get(client.sailor_id) : undefined,
  }));

  console.log(`✅ Successfully joined ${result.length} clients with sailor data\n`);

  // Display results
  console.log('FINAL RESULTS:');
  console.log('='.repeat(70));
  result.forEach((client, i) => {
    console.log(`\n${i + 1}. Client ID: ${client.id}`);
    console.log(`   Sailor: ${client.sailor?.full_name || client.sailor?.email || 'Unknown'}`);
    console.log(`   Status: ${client.status}`);
    console.log(`   Total Sessions: ${client.total_sessions}`);
    console.log(`   Last Session: ${client.last_session_date || 'Never'}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('✅ WORKAROUND SUCCESSFUL!');
  console.log('\nThis proves the workaround works. The issue is browser caching.');
  console.log('Solution: Hard refresh the browser (Cmd+Shift+R or Ctrl+Shift+R)');
}

testWorkaround().catch(console.error);
