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

async function checkSchema() {
  // Query to get the check constraint details
  const query = `
    SELECT
      con.conname AS constraint_name,
      pg_get_constraintdef(con.oid) AS constraint_definition
    FROM
      pg_constraint con
      INNER JOIN pg_class rel ON rel.oid = con.conrelid
      INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE
      rel.relname = 'club_members'
      AND con.contype = 'c'
      AND nsp.nspname = 'public';
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql: query });

  if (error) {
    console.error('Error:', error);

    // Try alternative approach - query information_schema
    console.log('\nTrying alternative approach...\n');

    const altQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'club_members' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    console.log('Attempting to query information_schema...');
    console.log('This might not work directly, checking actual data instead...\n');

    // Just query the table to see what exists
    const { data: sample, error: sampleError } = await supabase
      .from('club_members')
      .select('role')
      .limit(10);

    if (sampleError) {
      console.error('Sample error:', sampleError);
    } else {
      console.log('Sample roles from club_members table:');
      const roles = [...new Set(sample.map(s => s.role))];
      console.log(roles);
    }
  } else {
    console.log('Constraint definition:');
    console.log(data);
  }
}

checkSchema().catch(console.error);
