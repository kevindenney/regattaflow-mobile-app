#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Checking Supabase Tables with Anonymous Access...\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTablesWithAnonKey() {
  console.log('🔓 Testing table access with anonymous key...\n');

  // List of tables we expect to exist based on the SQL script
  const expectedTables = [
    'users',
    'organizations',
    'boat_classes',
    'boats',
    'regattas',
    'races',
    'regatta_registrations',
    'race_results',
    'sailing_venues',
    'yacht_clubs',
    'user_venue_profiles',
    'venue_transitions',
    'venue_detections',
    'weather_conditions',
    'sailing_documents',
    'document_chunks',
    'document_queries',
    'ai_analyses',
    'boat_positions'
  ];

  const existingTables = [];
  const missingTables = [];

  console.log('Checking each expected table...\n');

  for (const tableName of expectedTables) {
    try {
      // Try to query the table structure (this should work with RLS even if we can't see data)
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0); // We don't need data, just want to see if table exists

      if (error) {
        // Check if it's a table not found error vs RLS/permission error
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`❌ ${tableName}: Table does not exist`);
          missingTables.push(tableName);
        } else {
          console.log(`✅ ${tableName}: Table exists (${error.message})`);
          existingTables.push(tableName);
        }
      } else {
        console.log(`✅ ${tableName}: Table exists and accessible`);
        existingTables.push(tableName);
      }
    } catch (err) {
      console.log(`💥 ${tableName}: Unexpected error - ${err.message}`);
      missingTables.push(tableName);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 TABLE STATUS SUMMARY');
  console.log('='.repeat(60));

  console.log(`✅ Existing tables (${existingTables.length}):`);
  existingTables.forEach(table => console.log(`   - ${table}`));

  console.log(`\n❌ Missing tables (${missingTables.length}):`);
  missingTables.forEach(table => console.log(`   - ${table}`));

  if (missingTables.length > 0) {
    console.log('\n⚠️  CRITICAL: Tables are missing! OAuth authentication will not work.');
    console.log('   Run the create-missing-tables.sql script in your Supabase dashboard.');
  } else {
    console.log('\n🎉 All expected tables exist! Database is ready for OAuth.');
  }

  // Special check for the critical users table
  console.log('\n' + '='.repeat(60));
  console.log('👥 CRITICAL USERS TABLE CHECK');
  console.log('='.repeat(60));

  if (existingTables.includes('users')) {
    console.log('✅ Users table exists - OAuth authentication should work!');

    // Try to check the structure of the users table
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      if (error) {
        console.log(`📋 Users table structure: Cannot view data (${error.message})`);
        console.log('   This is normal with RLS policies - table structure is likely correct.');
      } else {
        console.log(`📋 Users table accessible with ${data?.length || 0} records visible`);
      }
    } catch (err) {
      console.log(`⚠️  Users table access error: ${err.message}`);
    }
  } else {
    console.log('❌ Users table is MISSING - OAuth authentication will FAIL!');
    console.log('   This is the most critical table for the app to function.');
  }

  return { existingTables, missingTables };
}

// Run the check
checkTablesWithAnonKey().catch(console.error);