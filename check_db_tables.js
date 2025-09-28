#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/kevindenney/Developer/RegattaFlow/regattaflow-app/.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExistingTables() {
  try {
    console.log('🔍 Querying Supabase database for existing tables in public schema...\n');

    // Query to get all tables in the public schema
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
      .order('table_name');

    if (error) {
      console.error('❌ Error querying tables:', error.message);

      // Fallback: try direct SQL query
      console.log('\n🔄 Trying alternative method...');
      const { data: fallbackData, error: fallbackError } = await supabase.rpc('get_public_tables');

      if (fallbackError) {
        console.error('❌ Fallback method also failed:', fallbackError.message);
        return [];
      }

      return fallbackData || [];
    }

    if (!tables || tables.length === 0) {
      console.log('⚠️  No tables found in public schema');
      return [];
    }

    console.log(`✅ Found ${tables.length} existing tables in public schema:\n`);

    const tableNames = tables.map(t => t.table_name).sort();
    tableNames.forEach((name, index) => {
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${name}`);
    });

    return tableNames;

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    return [];
  }
}

async function createFallbackFunction() {
  try {
    // Create a simple function to get table names if it doesn't exist
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_public_tables()
        RETURNS TABLE(table_name text)
        LANGUAGE sql
        SECURITY DEFINER
        AS $$
          SELECT t.table_name::text
          FROM information_schema.tables t
          WHERE t.table_schema = 'public'
            AND t.table_type = 'BASE TABLE'
          ORDER BY t.table_name;
        $$;
      `
    });

    if (error) {
      console.log('Note: Could not create fallback function:', error.message);
    }
  } catch (e) {
    // Ignore function creation errors
  }
}

// Main execution
(async () => {
  await createFallbackFunction();
  const existingTables = await checkExistingTables();

  console.log('\n' + '='.repeat(50));
  console.log(`📊 SUMMARY: ${existingTables.length} tables currently exist in the database`);
  console.log('='.repeat(50));
})();