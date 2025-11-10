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
  db: {
    schema: 'public',
  },
});

async function addForeignKeys() {
  console.log('Adding foreign key constraints to coaching_clients...\n');

  // Try adding coach_id foreign key
  const coachFkSql = `
    ALTER TABLE coaching_clients
    ADD CONSTRAINT IF NOT EXISTS coaching_clients_coach_id_fkey
    FOREIGN KEY (coach_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  `;

  try {
    const coachResult = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: coachFkSql }),
    });

    if (coachResult.ok) {
      console.log('✅ Coach_id foreign key added');
    } else {
      const error = await coachResult.text();
      console.log(`Note: ${error}`);
    }
  } catch (err) {
    console.log(`Note: ${err.message}`);
  }

  // Try adding sailor_id foreign key
  const sailorFkSql = `
    ALTER TABLE coaching_clients
    ADD CONSTRAINT IF NOT EXISTS coaching_clients_sailor_id_fkey
    FOREIGN KEY (sailor_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  `;

  try {
    const sailorResult = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sailorFkSql }),
    });

    if (sailorResult.ok) {
      console.log('✅ Sailor_id foreign key added');
    } else {
      const error = await sailorResult.text();
      console.log(`Note: ${error}`);
    }
  } catch (err) {
    console.log(`Note: ${err.message}`);
  }

  console.log('\n Testing JOIN query after adding foreign keys...\n');

  // Wait a moment for schema cache to update
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get coach anderson's ID
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const coachAnderson = users.find(u => u.email === 'coach.anderson@sailing.com');

  if (!coachAnderson) {
    console.log('❌ Coach Anderson not found');
    return;
  }

  // Try the JOIN query
  const { data: clients, error } = await supabase
    .from('coaching_clients')
    .select(`
      *,
      sailor:users!sailor_id(id, email, full_name)
    `)
    .eq('coach_id', coachAnderson.id)
    .eq('status', 'active');

  if (error) {
    console.log(`❌ JOIN query still failing: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    console.log(`   Details: ${error.details}`);
    console.log('\n⚠️  The foreign keys may have been added, but Supabase schema cache');
    console.log('   needs time to update. Try again in 1-2 minutes.');
  } else {
    console.log(`✅ JOIN query SUCCESS!`);
    console.log(`   Found ${clients?.length || 0} clients with sailor data`);
    if (clients && clients.length > 0) {
      clients.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.sailor?.full_name || c.sailor?.email} - ${c.total_sessions} sessions`);
      });
    }
  }
}

addForeignKeys().catch(console.error);
