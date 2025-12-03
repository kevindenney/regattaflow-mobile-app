#!/usr/bin/env node

/**
 * Add regatta_id column to club_race_calendar
 * This links calendar entries to the main regattas table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Missing SUPABASE_DB_URL in .env');
  process.exit(1);
}

async function addRegattaIdColumn() {
  console.log('\n🔧 Adding regatta_id column to club_race_calendar...\n');

  const sql = postgres(dbUrl);

  try {
    // Add column
    await sql`
      ALTER TABLE club_race_calendar
      ADD COLUMN IF NOT EXISTS regatta_id UUID REFERENCES regattas(id) ON DELETE CASCADE
    `;

    console.log('✅ Column added');

    // Add index
    await sql`
      CREATE INDEX IF NOT EXISTS idx_club_race_calendar_regatta_id
      ON club_race_calendar(regatta_id)
    `;

    console.log('✅ Index created');

    // Verify
    const result = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'club_race_calendar'
      AND column_name = 'regatta_id'
    `;

    if (result.length > 0) {
      console.log('\n✅ regatta_id column successfully added to club_race_calendar');
    } else {
      console.log('\n⚠️  Column may not have been added');
    }

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

addRegattaIdColumn();
