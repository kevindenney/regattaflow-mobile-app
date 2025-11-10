#!/usr/bin/env node

import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Read .env file to get DATABASE_URL
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
const dbUrlMatch = envContent.match(/(?:DATABASE_URL|SUPABASE_DB_URL)=(.+)/);

if (!dbUrlMatch) {
  console.error('❌ No DATABASE_URL or SUPABASE_DB_URL found in .env');
  process.exit(1);
}

const connectionString = dbUrlMatch[1].trim();

async function addForeignKey() {
  console.log('⚓ Connecting to database...');

  const sql = postgres(connectionString, {
    max: 1,
    ssl: 'require'
  });

  try {
    console.log('📝 Adding foreign key constraint to club_members.club_id...');

    await sql`
      ALTER TABLE public.club_members
        ADD CONSTRAINT club_members_club_id_fkey
        FOREIGN KEY (club_id)
        REFERENCES public.clubs(id)
        ON DELETE CASCADE
    `;

    console.log('✅ Foreign key constraint added successfully!');
    console.log('\n🔍 Verifying constraint...');

    const result = await sql`
      SELECT constraint_name, table_name
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'club_members'
        AND constraint_name = 'club_members_club_id_fkey'
    `;

    if (result.length > 0) {
      console.log('✅ Constraint verified:', result[0]);
    }

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Foreign key constraint already exists!');
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  } finally {
    await sql.end();
  }
}

addForeignKey();
