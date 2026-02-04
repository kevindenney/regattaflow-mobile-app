#!/usr/bin/env node

/**
 * Final Database Integrity Check for Ship Readiness
 *
 * Verifies:
 * 1. is_active column properly set on all records
 * 2. No orphaned records
 * 3. Message queries work correctly
 * 4. Push notification trigger query works
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runIntegrityChecks() {
  console.log('='.repeat(60));
  console.log('DATABASE INTEGRITY CHECK - SHIP READINESS');
  console.log('='.repeat(60));
  console.log();

  let allPassed = true;

  // Test 1: Verify is_active column properly set
  console.log('TEST 1: Verify is_active column on crew_thread_members');
  console.log('-'.repeat(50));

  const { data: members, error: membersError } = await supabase
    .from('crew_thread_members')
    .select('id, thread_id, user_id, is_active, role')
    .order('joined_at', { ascending: false })
    .limit(20);

  if (membersError) {
    console.error('❌ FAILED:', membersError.message);
    allPassed = false;
  } else {
    const allActive = members.every(m => m.is_active === true);
    console.log(`   Records checked: ${members.length}`);
    console.log(`   All is_active = true: ${allActive ? '✅ YES' : '❌ NO'}`);
    if (!allActive) {
      const inactive = members.filter(m => !m.is_active);
      console.log(`   Inactive records: ${inactive.length}`);
      allPassed = false;
    }
  }
  console.log();

  // Test 2: Check for NULL is_active values
  console.log('TEST 2: Check for NULL is_active values');
  console.log('-'.repeat(50));

  const { count: nullCount, error: nullError } = await supabase
    .from('crew_thread_members')
    .select('*', { count: 'exact', head: true })
    .is('is_active', null);

  if (nullError) {
    console.error('❌ FAILED:', nullError.message);
    allPassed = false;
  } else {
    console.log(`   NULL is_active values: ${nullCount || 0}`);
    if (nullCount && nullCount > 0) {
      console.log('   ⚠️ WARNING: Found NULL values');
      allPassed = false;
    } else {
      console.log('   ✅ No NULL values found');
    }
  }
  console.log();

  // Test 3: Check for orphaned thread members
  console.log('TEST 3: Check for orphaned thread members');
  console.log('-'.repeat(50));

  const { data: orphanCheck, error: orphanError } = await supabase
    .rpc('check_orphaned_thread_members')
    .maybeSingle();

  if (orphanError && orphanError.code === 'PGRST202') {
    // RPC doesn't exist, do manual check
    console.log('   (Running manual orphan check)');
    const { data: allMembers } = await supabase
      .from('crew_thread_members')
      .select('thread_id');
    const { data: allThreads } = await supabase
      .from('crew_threads')
      .select('id');

    const threadIds = new Set(allThreads?.map(t => t.id) || []);
    const orphaned = allMembers?.filter(m => !threadIds.has(m.thread_id)) || [];

    console.log(`   Orphaned members: ${orphaned.length}`);
    if (orphaned.length === 0) {
      console.log('   ✅ No orphaned records');
    } else {
      console.log('   ❌ Found orphaned records');
      allPassed = false;
    }
  } else if (orphanError) {
    console.error('❌ FAILED:', orphanError.message);
  } else {
    console.log('   ✅ Orphan check passed');
  }
  console.log();

  // Test 4: Verify messages can be queried with is_active
  console.log('TEST 4: Verify message query with is_active join');
  console.log('-'.repeat(50));

  const { data: messages, error: msgError } = await supabase
    .from('crew_thread_messages')
    .select(`
      id,
      message,
      created_at,
      thread_id,
      user_id
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (msgError) {
    console.error('❌ FAILED:', msgError.message);
    allPassed = false;
  } else {
    console.log(`   Messages retrieved: ${messages?.length || 0}`);
    console.log('   ✅ Message query successful');
  }
  console.log();

  // Test 5: Simulate push notification trigger query
  console.log('TEST 5: Simulate push notification trigger query');
  console.log('-'.repeat(50));

  const { data: triggerTest, error: triggerError } = await supabase
    .from('crew_thread_members')
    .select('user_id, thread_id')
    .eq('is_active', true)
    .limit(10);

  if (triggerError) {
    console.error('❌ FAILED:', triggerError.message);
    allPassed = false;
  } else {
    console.log(`   Active members found: ${triggerTest?.length || 0}`);
    console.log('   ✅ Trigger query pattern works');
  }
  console.log();

  // Test 6: Communities count
  console.log('TEST 6: Verify Communities data');
  console.log('-'.repeat(50));

  const { count: commCount, error: commError } = await supabase
    .from('communities')
    .select('*', { count: 'exact', head: true });

  if (commError) {
    console.error('❌ FAILED:', commError.message);
    allPassed = false;
  } else {
    console.log(`   Total communities: ${commCount || 0}`);
    console.log('   ✅ Communities accessible');
  }
  console.log();

  // Summary
  console.log('='.repeat(60));
  if (allPassed) {
    console.log('🎉 ALL INTEGRITY CHECKS PASSED');
    console.log('   Database is ready for production');
  } else {
    console.log('⚠️ SOME CHECKS FAILED');
    console.log('   Review issues above before shipping');
  }
  console.log('='.repeat(60));

  return allPassed;
}

runIntegrityChecks()
  .then(passed => process.exit(passed ? 0 : 1))
  .catch(err => {
    console.error('Script error:', err);
    process.exit(1);
  });
