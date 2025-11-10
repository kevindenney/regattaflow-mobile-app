#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLS() {
  console.log('🔒 Adding RLS policies for coach_profiles...\n');

  const sql = readFileSync('supabase/migrations/20251106140000_add_coach_profiles_rls.sql', 'utf8');

  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'));

  for (const statement of statements) {
    if (!statement) continue;

    console.log(`Executing: ${statement.substring(0, 80)}...`);

    try {
      // Use raw SQL execution via RPC
      const { error } = await supabase.rpc('exec_sql', { sql_string: statement });

      if (error) {
        // Try direct approach
        console.log('⚠️  Using direct approach...');
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql_string: statement }),
        });

        if (!response.ok) {
          console.log('⚠️  Could not execute:', error?.message || 'Unknown error');
        } else {
          console.log('✅ Success');
        }
      } else {
        console.log('✅ Success');
      }
    } catch (err) {
      console.log('⚠️  Error:', err.message);
    }
  }

  console.log('\n✨ RLS policies should be added!');
  console.log('\n📝 Please verify by running:');
  console.log('   SELECT * FROM pg_policies WHERE tablename = \'coach_profiles\';');
  console.log('\nIf policies are not showing, please apply the migration manually:');
  console.log('   npx supabase db push');
}

applyRLS().catch(console.error);
