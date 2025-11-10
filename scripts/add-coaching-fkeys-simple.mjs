#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

// Get database URL from environment
const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Missing SUPABASE_DB_URL or DATABASE_URL environment variable');
  console.error('   Add it to your .env file');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
});

async function addForeignKeys() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('Adding foreign key constraints to coaching_clients table...\n');

    // Add coach_id foreign key
    await client.query(`
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
    `);
    console.log('✅ Coach_id foreign key processed');

    // Add sailor_id foreign key
    await client.query(`
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
    `);
    console.log('✅ Sailor_id foreign key processed');

    console.log('\n✅ Foreign keys added successfully!');
    console.log('\nNow refresh your browser and the coach clients should load with JOIN queries working.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addForeignKeys();
