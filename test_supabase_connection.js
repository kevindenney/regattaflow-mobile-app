#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');

console.log('Environment Variables:');
console.log('- URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('- Service Key:', supabaseServiceKey ? 'Present' : 'Missing');
console.log('- Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');
console.log();

if (!supabaseUrl) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

async function testSupabaseConnection() {
// Test 1: Service Role Key (admin access)
if (supabaseServiceKey) {
  console.log('🔑 Testing Service Role Key...');
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data, error } = await supabaseService
      .rpc('get_schema_tables', { schema_name: 'public' });

    if (error) {
      console.log('⚠️  Service role RPC failed:', error.message);

      // Fallback: Try direct SQL query
      const { data: tables, error: sqlError } = await supabaseService
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE');

      if (sqlError) {
        console.log('❌ Service role direct query failed:', sqlError.message);
      } else {
        console.log('✅ Service role connection successful!');
        console.log(`📊 Found ${tables?.length || 0} tables:`, tables?.map(t => t.table_name) || []);
      }
    } else {
      console.log('✅ Service role RPC successful!');
      console.log(`📊 Found ${data?.length || 0} tables:`, data || []);
    }
  } catch (error) {
    console.log('💥 Service role error:', error.message);
  }
}

// Test 2: Anonymous Key (public access)
if (supabaseAnonKey) {
  console.log('\n🔓 Testing Anonymous Key...');
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Try a simple query that should work with anon access
    const { data, error } = await supabaseAnon.auth.getSession();

    if (error) {
      console.log('❌ Anonymous auth check failed:', error.message);
    } else {
      console.log('✅ Anonymous connection successful!');
      console.log('📱 Auth session check passed');
    }
  } catch (error) {
    console.log('💥 Anonymous error:', error.message);
  }
}

// Test 3: Check if users table exists specifically
if (supabaseServiceKey) {
  console.log('\n👥 Checking for users table specifically...');
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data, error } = await supabaseService
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Users table not found or inaccessible:', error.message);
    } else {
      console.log('✅ Users table exists!');
      console.log(`📊 Users table has ${data?.length || 0} records`);

      // Test a simple query on users table
      const { data: userSample, error: sampleError } = await supabaseService
        .from('users')
        .select('id, email, created_at')
        .limit(3);

      if (sampleError) {
        console.log('⚠️  Cannot read users table:', sampleError.message);
      } else {
        console.log(`📝 Sample users (${userSample?.length || 0} shown):`, userSample);
      }
    }
  } catch (error) {
    console.log('💥 Users table check error:', error.message);
  }
}

console.log('\n🏁 Connection test complete');
}

// Run the test
testSupabaseConnection().catch(console.error);