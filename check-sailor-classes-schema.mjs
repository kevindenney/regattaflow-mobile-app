import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSailorClassesSchema() {
  // First, let's check if the table exists
  const { data: tableData, error: tableError } = await supabase
    .from('sailor_classes')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('Error accessing sailor_classes table:', tableError);

    // Try to list all tables
    console.log('\nAttempting to query information_schema directly...');

    // Use a direct SQL query via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'sailor_classes'
                ORDER BY ordinal_position;`
      })
    });

    console.log('Response status:', response.status);
    const result = await response.text();
    console.log('Result:', result);
    return;
  }

  console.log('sailor_classes table exists!');
  console.log('Sample row:', tableData);

  // Now let's get the schema by examining the columns
  console.log('\nTo get full schema, we need to use psql or a database management tool.');
  console.log('Alternatively, you can check the Supabase dashboard or migration files.');
}

checkSailorClassesSchema();
