#!/usr/bin/env node

/**
 * Supabase Connection Test Script
 * Tests all critical integration points
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Integration Points\n');

  // Test 1: Environment Variables
  console.log('1️⃣ Testing Environment Variables...');
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ EXPO_PUBLIC_SUPABASE_URL is missing');
    process.exit(1);
  }
  if (!supabaseAnonKey) {
    console.error('❌ EXPO_PUBLIC_SUPABASE_ANON_KEY is missing');
    process.exit(1);
  }
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing');
    process.exit(1);
  }

  console.log('✅ All environment variables present');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);
  console.log(`   Service Key: ${supabaseServiceKey.substring(0, 20)}...\n`);

  // Test 2: REST API Connectivity
  console.log('2️⃣ Testing REST API Connectivity...');
  try {
    const start = Date.now();
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      signal: AbortSignal.timeout(5000)
    });

    const duration = Date.now() - start;

    if (response.ok) {
      console.log(`✅ REST API reachable (${duration}ms)`);
      console.log(`   Status: ${response.status} ${response.statusText}\n`);
    } else {
      console.error(`❌ REST API returned error: ${response.status} ${response.statusText}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`❌ REST API connection failed: ${error.message}`);
    process.exit(1);
  }

  // Test 3: Auth API Connectivity
  console.log('3️⃣ Testing Auth API Connectivity...');
  try {
    const start = Date.now();
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey
      },
      signal: AbortSignal.timeout(5000)
    });

    const duration = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Auth API reachable (${duration}ms)`);
      console.log(`   Health: ${JSON.stringify(data)}\n`);
    } else {
      console.error(`❌ Auth API returned error: ${response.status} ${response.statusText}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`❌ Auth API connection failed: ${error.message}`);
    process.exit(1);
  }

  // Test 4: Database Query (users table)
  console.log('4️⃣ Testing Database Query (users table)...');
  try {
    const start = Date.now();
    const response = await fetch(`${supabaseUrl}/rest/v1/users?select=count`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Prefer': 'count=exact'
      },
      signal: AbortSignal.timeout(5000)
    });

    const duration = Date.now() - start;
    const count = response.headers.get('content-range')?.split('/')[1] || '0';

    if (response.ok) {
      console.log(`✅ Database query successful (${duration}ms)`);
      console.log(`   Users count: ${count}\n`);
    } else {
      console.error(`❌ Database query failed: ${response.status} ${response.statusText}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`❌ Database query failed: ${error.message}`);
    process.exit(1);
  }

  // Test 5: Session Check (anonymous)
  console.log('5️⃣ Testing Session Management...');
  try {
    const start = Date.now();
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      signal: AbortSignal.timeout(5000)
    });

    const duration = Date.now() - start;

    if (response.status === 401 || response.status === 403) {
      console.log(`✅ Session management working (${duration}ms)`);
      console.log(`   No active session (expected for anonymous request)\n`);
    } else if (response.ok) {
      const data = await response.json();
      console.log(`✅ Session management working (${duration}ms)`);
      console.log(`   Active session: ${data.email}\n`);
    } else {
      console.error(`❌ Session check failed: ${response.status} ${response.statusText}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`❌ Session check failed: ${error.message}`);
    process.exit(1);
  }

  console.log('✅ All Supabase integration tests passed!\n');
  console.log('📊 Summary:');
  console.log('   ✅ Environment variables configured');
  console.log('   ✅ REST API reachable');
  console.log('   ✅ Auth API healthy');
  console.log('   ✅ Database queries working');
  console.log('   ✅ Session management functional');
}

testSupabaseConnection().catch((error) => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
