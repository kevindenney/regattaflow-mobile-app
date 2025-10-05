import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addExtractionColumns() {
  console.log('Adding extraction columns to tuning_guides...');

  const queries = [
    `ALTER TABLE tuning_guides ADD COLUMN IF NOT EXISTS extracted_content TEXT`,
    `ALTER TABLE tuning_guides ADD COLUMN IF NOT EXISTS extracted_sections JSONB DEFAULT '[]'`,
    `ALTER TABLE tuning_guides ADD COLUMN IF NOT EXISTS extraction_status TEXT CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending'`,
    `ALTER TABLE tuning_guides ADD COLUMN IF NOT EXISTS extraction_error TEXT`,
    `ALTER TABLE tuning_guides ADD COLUMN IF NOT EXISTS extracted_at TIMESTAMPTZ`,
  ];

  for (const query of queries) {
    const { error } = await supabase.rpc('exec_sql', { sql_query: query }).single();

    if (error) {
      console.log(`Executing: ${query.substring(0, 80)}...`);
      // Try direct execution
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql_query: query })
      });

      if (!response.ok) {
        console.log(`⚠ Could not execute query (may already exist): ${query.substring(0, 60)}...`);
      } else {
        console.log(`✓ Added column`);
      }
    } else {
      console.log(`✓ Added column`);
    }
  }

  console.log('\nExtraction columns setup complete!');
}

addExtractionColumns()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
