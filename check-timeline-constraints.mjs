#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTimelineConstraints() {
  console.log('\n🔍 Checking for timeline_events constraints...\n');

  // Check if timeline_events exists
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name, table_type')
    .eq('table_name', 'timeline_events');

  if (tablesError) {
    console.log('⚠️  Error checking tables:', tablesError.message);
  } else {
    console.log('📊 Timeline Events Table Status:');
    console.log(tables && tables.length > 0 ? tables : '❌ timeline_events does not exist as a table or view');
  }

  // Check for constraints on regattas table
  console.log('\n📋 Checking constraints on regattas table...');
  const { data: constraints, error: constraintsError } = await supabase.rpc('check_timeline_constraints');

  if (constraintsError) {
    console.log('⚠️  Error (trying raw SQL):', constraintsError.message);

    // Try direct SQL query
    const query = `
      SELECT
        tc.constraint_name,
        tc.table_name,
        tc.constraint_type,
        pg_get_constraintdef(pgc.oid) as constraint_definition
      FROM information_schema.table_constraints AS tc
      JOIN pg_constraint pgc ON tc.constraint_name = pgc.conname
      WHERE tc.table_name = 'regattas'
      AND pg_get_constraintdef(pgc.oid) LIKE '%timeline_events%'
    `;

    const { data, error } = await supabase.rpc('exec_sql', { query });

    if (error) {
      console.log('❌ Could not execute SQL:', error.message);
      console.log('\n💡 You may need to run this query directly in Supabase SQL Editor:');
      console.log(query);
    } else {
      console.log(data);
    }
  } else {
    console.log(constraints);
  }

  // Check triggers
  console.log('\n🔧 Checking triggers on regattas table...');
  const triggerQuery = `
    SELECT
      trigger_name,
      event_manipulation,
      action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'regattas'
    AND action_statement LIKE '%timeline_events%'
  `;

  console.log('Run this in Supabase SQL Editor to check triggers:');
  console.log(triggerQuery);
}

checkTimelineConstraints().catch(console.error);
