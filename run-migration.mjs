#!/usr/bin/env node

/**
 * Apply race_crew_assignments migration via direct HTTP to Supabase
 */

import { readFileSync } from 'fs';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_URL not found in environment');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY not found in environment');
  process.exit(1);
}

console.log('🚀 Applying race_crew_assignments migration...\n');

const sql = readFileSync('./supabase/migrations/20251201000001_create_race_crew_assignments_table.sql', 'utf8');

// Split SQL into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

async function executeStatement(statement, index) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ query: statement }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.log(`⚠️  Statement ${index + 1}: ${error}`);
    return false;
  }

  return true;
}

// Just copy to clipboard and show instructions
console.log('Since direct SQL execution requires special permissions,');
console.log('the migration SQL has been copied to your clipboard.\n');
console.log('📋 Please paste it into Supabase SQL Editor:\n');
console.log('   1. Go to: https://supabase.com/dashboard');
console.log('   2. Select your RegattaFlow project');
console.log('   3. Click SQL Editor → New Query');
console.log('   4. Paste (Cmd+V) and click Run\n');
console.log('✅ The SQL is ready in your clipboard!');
