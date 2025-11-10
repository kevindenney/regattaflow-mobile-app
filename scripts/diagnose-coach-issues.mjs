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

async function diagnose() {
  console.log('='.repeat(70));
  console.log('COACH ISSUES DIAGNOSTIC');
  console.log('='.repeat(70));

  // 1. Check Coach Anderson's setup
  console.log('\n1. CHECKING COACH ANDERSON USER SETUP');
  console.log('-'.repeat(70));

  const { data: { users } } = await supabase.auth.admin.listUsers();
  const coachAnderson = users.find(u => u.email === 'coach.anderson@sailing.com');

  if (!coachAnderson) {
    console.log('❌ Coach Anderson not found');
    return;
  }

  console.log(`✅ User ID: ${coachAnderson.id}`);

  const { data: userProfile } = await supabase
    .from('users')
    .select('user_type, onboarding_completed')
    .eq('id', coachAnderson.id)
    .single();

  console.log(`   User Type: ${userProfile?.user_type}`);
  console.log(`   Onboarding: ${userProfile?.onboarding_completed}`);

  // 2. Check coach_profile
  console.log('\n2. CHECKING COACH_PROFILE');
  console.log('-'.repeat(70));

  const { data: coachProfile, error: coachProfileError } = await supabase
    .from('coach_profiles')
    .select('*')
    .eq('user_id', coachAnderson.id)
    .maybeSingle();

  if (coachProfileError) {
    console.log(`❌ Error: ${coachProfileError.message}`);
  } else if (coachProfile) {
    console.log(`✅ Coach profile exists (ID: ${coachProfile.id})`);
  } else {
    console.log('❌ No coach profile found');
  }

  // 3. Check coaching_clients table structure
  console.log('\n3. CHECKING COACHING_CLIENTS TABLE');
  console.log('-'.repeat(70));

  const { data: clients, error: clientsError } = await supabase
    .from('coaching_clients')
    .select('*')
    .eq('coach_id', coachAnderson.id);

  if (clientsError) {
    console.log(`❌ Query Error: ${clientsError.message}`);
    console.log(`   Code: ${clientsError.code}`);
    console.log(`   Details: ${clientsError.details}`);
    console.log(`   Hint: ${clientsError.hint}`);
  } else {
    console.log(`✅ Query succeeded`);
    console.log(`   Found ${clients?.length || 0} clients`);
    if (clients && clients.length > 0) {
      clients.forEach((c, i) => {
        console.log(`   ${i + 1}. Sailor ID: ${c.sailor_id}, Sessions: ${c.total_sessions}`);
      });
    }
  }

  // 4. Check if foreign keys exist
  console.log('\n4. CHECKING FOREIGN KEY CONSTRAINTS');
  console.log('-'.repeat(70));

  const fkQuery = `
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name='coaching_clients';
  `;

  try {
    const { data: fkeys, error: fkError } = await supabase.rpc('exec_sql', { query: fkQuery });
    if (fkError) {
      console.log(`⚠️  Cannot query FK constraints: ${fkError.message}`);
    } else {
      console.log(`Found ${fkeys?.length || 0} foreign keys`);
      if (fkeys && fkeys.length > 0) {
        fkeys.forEach(fk => {
          console.log(`   - ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }
    }
  } catch (err) {
    console.log(`⚠️  FK check not available`);
  }

  // 5. Test a specific client query (the one that's failing in the UI)
  console.log('\n5. TESTING GETCLIENTS QUERY');
  console.log('-'.repeat(70));

  try {
    const { data: testClients, error: testError } = await supabase
      .from('coaching_clients')
      .select(`
        *,
        sailor:users!sailor_id(id, email, full_name)
      `)
      .eq('coach_id', coachAnderson.id)
      .eq('status', 'active');

    if (testError) {
      console.log(`❌ JOIN Query Failed: ${testError.message}`);
      console.log(`   This is likely the issue! The UI query includes a JOIN.`);
    } else {
      console.log(`✅ JOIN query succeeded`);
      console.log(`   Returned ${testClients?.length || 0} clients`);
    }
  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('DIAGNOSIS COMPLETE');
  console.log('='.repeat(70));
}

diagnose().catch(console.error);
