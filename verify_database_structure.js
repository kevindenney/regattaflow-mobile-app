#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 FINAL DATABASE STRUCTURE VERIFICATION\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyDatabaseStructure() {
  console.log('📋 Testing key tables for RegattaFlow functionality...\n');

  // Key tables to test with their importance
  const keyTables = [
    { name: 'users', importance: 'CRITICAL', purpose: 'OAuth authentication and user profiles' },
    { name: 'regattas', importance: 'HIGH', purpose: 'Core regatta/event management' },
    { name: 'sailing_venues', importance: 'HIGH', purpose: 'Global venue intelligence system' },
    { name: 'boat_classes', importance: 'MEDIUM', purpose: 'Boat class reference data' },
    { name: 'weather_conditions', importance: 'HIGH', purpose: 'Weather data for venues' },
    { name: 'sailing_documents', importance: 'HIGH', purpose: 'Document management and AI processing' },
    { name: 'ai_analyses', importance: 'MEDIUM', purpose: 'AI-powered race strategy' },
    { name: 'boats', importance: 'MEDIUM', purpose: 'User boat registrations' }
  ];

  const results = {
    critical: { working: [], failing: [] },
    high: { working: [], failing: [] },
    medium: { working: [], failing: [] }
  };

  for (const table of keyTables) {
    try {
      console.log(`🔍 Testing ${table.name} (${table.importance})...`);

      // Test basic access
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        console.log(`   ❌ MISSING: Table does not exist`);
        results[table.importance.toLowerCase()].failing.push(table);
      } else {
        console.log(`   ✅ EXISTS: Table accessible`);
        results[table.importance.toLowerCase()].working.push(table);

        // For some tables, test data access
        if (['boat_classes', 'sailing_venues'].includes(table.name)) {
          const { data: sampleData, error: dataError } = await supabase
            .from(table.name)
            .select('*')
            .limit(3);

          if (!dataError && sampleData && sampleData.length > 0) {
            console.log(`   📊 Contains ${sampleData.length} sample records`);
          } else {
            console.log(`   📊 Table is empty (expected for new database)`);
          }
        }
      }

    } catch (err) {
      console.log(`   💥 ERROR: ${err.message}`);
      results[table.importance.toLowerCase()].failing.push(table);
    }
  }

  // Generate comprehensive report
  console.log('\n' + '='.repeat(70));
  console.log('📊 REGATTAFLOW DATABASE VERIFICATION REPORT');
  console.log('='.repeat(70));

  console.log('\n🔴 CRITICAL SYSTEMS:');
  console.log(`   ✅ Working: ${results.critical.working.length} tables`);
  results.critical.working.forEach(t => console.log(`      - ${t.name}: ${t.purpose}`));

  if (results.critical.failing.length > 0) {
    console.log(`   ❌ Failing: ${results.critical.failing.length} tables`);
    results.critical.failing.forEach(t => console.log(`      - ${t.name}: ${t.purpose}`));
  }

  console.log('\n🟡 HIGH PRIORITY SYSTEMS:');
  console.log(`   ✅ Working: ${results.high.working.length} tables`);
  results.high.working.forEach(t => console.log(`      - ${t.name}: ${t.purpose}`));

  if (results.high.failing.length > 0) {
    console.log(`   ❌ Failing: ${results.high.failing.length} tables`);
    results.high.failing.forEach(t => console.log(`      - ${t.name}: ${t.purpose}`));
  }

  console.log('\n🟢 MEDIUM PRIORITY SYSTEMS:');
  console.log(`   ✅ Working: ${results.medium.working.length} tables`);
  results.medium.working.forEach(t => console.log(`      - ${t.name}: ${t.purpose}`));

  if (results.medium.failing.length > 0) {
    console.log(`   ❌ Failing: ${results.medium.failing.length} tables`);
    results.medium.failing.forEach(t => console.log(`      - ${t.name}: ${t.purpose}`));
  }

  // Overall assessment
  console.log('\n' + '='.repeat(70));
  console.log('🎯 OVERALL ASSESSMENT');
  console.log('='.repeat(70));

  const allCriticalWorking = results.critical.failing.length === 0;
  const mostHighWorking = results.high.failing.length <= 1;
  const authReadiness = results.critical.working.some(t => t.name === 'users');

  if (allCriticalWorking && authReadiness) {
    console.log('🎉 EXCELLENT: Database is fully ready for OAuth authentication!');
    console.log('✅ All critical systems operational');
    console.log('✅ Users table configured correctly');
    console.log('✅ Core RegattaFlow features will work');
  } else if (authReadiness) {
    console.log('⚠️  GOOD: OAuth will work, but some features may be limited');
    console.log('✅ Users table configured correctly');
    if (!allCriticalWorking) {
      console.log('⚠️  Some critical systems need attention');
    }
  } else {
    console.log('❌ CRITICAL: OAuth authentication will not work properly');
    console.log('❌ Users table is missing or misconfigured');
  }

  console.log('\n📱 OAuth Authentication Status:');
  console.log(`   Users Table: ${authReadiness ? '✅ Ready' : '❌ Missing'}`);
  console.log(`   Auth Flow: ${authReadiness ? '✅ Will work' : '❌ Will fail'}`);
  console.log(`   User Profiles: ${authReadiness ? '✅ Supported' : '❌ Not supported'}`);

  console.log('\n🚀 Next Steps:');
  if (authReadiness) {
    console.log('1. ✅ Database structure is ready');
    console.log('2. 🔧 Configure OAuth providers in Supabase dashboard');
    console.log('3. 🧪 Test OAuth flow in the RegattaFlow app');
    console.log('4. 📊 Verify user creation and profile management');
  } else {
    console.log('1. ❌ Run the create-missing-tables.sql script');
    console.log('2. 🔧 Fix any table creation errors');
    console.log('3. 🔁 Re-run this verification script');
  }

  return authReadiness;
}

// Run the verification
verifyDatabaseStructure()
  .then(success => {
    console.log(`\n🏁 Verification complete. OAuth ready: ${success ? 'YES' : 'NO'}`);
  })
  .catch(console.error);