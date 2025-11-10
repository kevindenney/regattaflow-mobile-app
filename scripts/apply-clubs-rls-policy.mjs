#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

// Use postgres client for raw SQL execution
import pg from 'pg';
const { Client } = pg;

async function applyRLSPolicy() {
  console.log('\n🔒 Applying RLS policy for public clubs read...\n');

  const connectionString = process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    console.error('❌ SUPABASE_DB_URL not found in .env');
    console.log('\n📝 You need to add this policy manually via SQL Editor in Supabase:');
    console.log('---');
    const sql = readFileSync(
      resolve(__dirname, '../supabase/migrations/20251108130000_allow_public_clubs_read.sql'),
      'utf-8'
    );
    console.log(sql);
    console.log('---\n');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const sql = `
      -- Drop existing policy if it exists
      DROP POLICY IF EXISTS "Public can read clubs" ON clubs;

      -- Create policy to allow anyone to read clubs
      CREATE POLICY "Public can read clubs" ON clubs
        FOR SELECT
        USING (true);
    `;

    await client.query(sql);

    console.log('✅ RLS policy applied successfully!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📝 If you see connection errors, add this policy via Supabase SQL Editor:');
    console.log('---');
    const sql = readFileSync(
      resolve(__dirname, '../supabase/migrations/20251108130000_allow_public_clubs_read.sql'),
      'utf-8'
    );
    console.log(sql);
    console.log('---\n');
  } finally {
    await client.end();
  }
}

applyRLSPolicy();
