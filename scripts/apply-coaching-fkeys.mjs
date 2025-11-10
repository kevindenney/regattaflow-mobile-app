#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

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

async function applyForeignKeys() {
  console.log('Adding foreign key constraints to coaching_clients table...\n');

  // Add foreign key for coach_id
  const addCoachFk = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'coaching_clients_coach_id_fkey'
      ) THEN
        ALTER TABLE coaching_clients
        ADD CONSTRAINT coaching_clients_coach_id_fkey
        FOREIGN KEY (coach_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added coach_id foreign key';
      ELSE
        RAISE NOTICE 'coach_id foreign key already exists';
      END IF;
    END $$;
  `;

  const { error: coachFkError } = await supabase.rpc('exec', {
    sql: addCoachFk
  });

  if (coachFkError) {
    console.log('Trying alternative approach for coach_id FK...');
    try {
      await supabase.rpc('exec_sql', { query: addCoachFk });
    } catch (err) {
      console.error('❌ Error adding coach_id FK:', coachFkError.message);
    }
  } else {
    console.log('✅ Coach_id foreign key added/verified');
  }

  // Add foreign key for sailor_id
  const addSailorFk = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'coaching_clients_sailor_id_fkey'
      ) THEN
        ALTER TABLE coaching_clients
        ADD CONSTRAINT coaching_clients_sailor_id_fkey
        FOREIGN KEY (sailor_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added sailor_id foreign key';
      ELSE
        RAISE NOTICE 'sailor_id foreign key already exists';
      END IF;
    END $$;
  `;

  const { error: sailorFkError } = await supabase.rpc('exec', {
    sql: addSailorFk
  });

  if (sailorFkError) {
    console.log('Trying alternative approach for sailor_id FK...');
    try {
      await supabase.rpc('exec_sql', { query: addSailorFk });
    } catch (err) {
      console.error('❌ Error adding sailor_id FK:', sailorFkError.message);
    }
  } else {
    console.log('✅ Sailor_id foreign key added/verified');
  }

  console.log('\nVerifying the fix...');

  // Test the JOIN query again
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const coachAnderson = users.find(u => u.email === 'coach.anderson@sailing.com');

  if (coachAnderson) {
    const { data: testClients, error: testError } = await supabase
      .from('coaching_clients')
      .select(`
        *,
        sailor:users!sailor_id(id, email, full_name)
      `)
      .eq('coach_id', coachAnderson.id)
      .eq('status', 'active');

    if (testError) {
      console.log(`❌ JOIN Query still failing: ${testError.message}`);
      console.log('   Foreign keys may not be recognized by Supabase yet.');
      console.log('   You may need to wait a few minutes for schema cache to update.');
    } else {
      console.log(`✅ JOIN query succeeded!`);
      console.log(`   Returned ${testClients?.length || 0} clients with sailor details`);
      if (testClients && testClients.length > 0) {
        testClients.forEach((c, i) => {
          console.log(`   ${i + 1}. ${c.sailor?.full_name || c.sailor?.email} (${c.total_sessions} sessions)`);
        });
      }
    }
  }

  console.log('\n✅ Foreign key setup complete!');
}

applyForeignKeys().catch(console.error);
