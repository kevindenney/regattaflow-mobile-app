#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkForeignKeys() {
  console.log('🔍 Checking foreign key constraints on fleet_posts...\n');

  const { data, error } = await supabase.rpc('exec', {
    sql: `
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
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
        AND tc.table_name = 'fleet_posts'
      ORDER BY tc.constraint_name;
    `
  });

  if (error) {
    console.log('Using alternative method...');

    // Try using a simple query to pg_catalog
    const query = `
      SELECT
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        a.attname AS column_name,
        confrelid::regclass AS referenced_table,
        af.attname AS referenced_column
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
      JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
      WHERE contype = 'f'
        AND conrelid::regclass::text = 'fleet_posts'
      ORDER BY conname;
    `;

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: query })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Foreign keys found:', JSON.stringify(result, null, 2));
      } else {
        console.log('Manual check needed - logging in to Supabase SQL editor');
        console.log('\nRun this query in Supabase SQL Editor:');
        console.log(query);
      }
    } catch (err) {
      console.log('\n📋 To check foreign keys manually:');
      console.log('1. Go to Supabase SQL Editor');
      console.log('2. Run: \\d fleet_posts');
      console.log('3. Look for foreign key constraints');
    }
  } else {
    console.log('Foreign keys:', data);
  }
}

checkForeignKeys().catch(console.error);
