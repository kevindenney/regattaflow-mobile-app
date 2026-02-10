/**
 * Debug RLS access for demo-sailor
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
if (!DEMO_PASSWORD) {
  console.error('❌ DEMO_PASSWORD environment variable is required');
  process.exit(1);
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log('=== Debug RLS for demo-sailor ===\n');

  // Sign in as demo-sailor
  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email: 'demo-sailor@regattaflow.app',
    password: DEMO_PASSWORD
  });

  if (signInError) {
    console.log('Sign-in error:', signInError.message);
    return;
  }

  const userId = signInData.user.id;
  console.log('Signed in as:', signInData.user.email);
  console.log('User ID:', userId);

  // Test 1: Query crew_threads directly
  console.log('\n--- Test 1: crew_threads table ---');
  const { data: threads, error: threadsError } = await anonClient
    .from('crew_threads')
    .select('*');
  console.log('Result:', threads?.length || 0, 'rows');
  if (threadsError) console.log('Error:', threadsError.message);
  threads?.forEach(t => console.log(`  - ${t.name}`));

  // Test 2: Query crew_thread_members directly
  console.log('\n--- Test 2: crew_thread_members table ---');
  const { data: members, error: membersError } = await anonClient
    .from('crew_thread_members')
    .select('*');
  console.log('Result:', members?.length || 0, 'rows');
  if (membersError) console.log('Error:', membersError.message);

  // Test 3: Query the view
  console.log('\n--- Test 3: crew_threads_with_details view ---');
  const { data: viewData, error: viewError } = await anonClient
    .from('crew_threads_with_details')
    .select('*');
  console.log('Result:', viewData?.length || 0, 'rows');
  if (viewError) console.log('Error:', viewError.message, viewError.details, viewError.hint);

  // Test 4: Query the view filtered by user
  console.log('\n--- Test 4: crew_threads_with_details filtered ---');
  const { data: filteredView, error: filteredError } = await anonClient
    .from('crew_threads_with_details')
    .select('*')
    .eq('member_user_id', userId);
  console.log('Result:', filteredView?.length || 0, 'rows');
  if (filteredError) console.log('Error:', filteredError.message);

  // Test 5: Query notifications
  console.log('\n--- Test 5: social_notifications ---');
  const { data: notifs, error: notifsError } = await anonClient
    .from('social_notifications')
    .select('*');
  console.log('Result:', notifs?.length || 0, 'rows');
  if (notifsError) console.log('Error:', notifsError.message);
  notifs?.forEach(n => console.log(`  - ${n.type}: ${n.title}`));

  // Compare with admin view
  console.log('\n--- Admin check: data exists? ---');
  const { data: adminThreads } = await adminClient
    .from('crew_threads')
    .select('*')
    .eq('owner_id', userId);
  console.log('Threads owned by demo-sailor:', adminThreads?.length || 0);

  const { data: adminMembers } = await adminClient
    .from('crew_thread_members')
    .select('*')
    .eq('user_id', userId);
  console.log('Thread memberships for demo-sailor:', adminMembers?.length || 0);

  const { data: adminNotifs } = await adminClient
    .from('social_notifications')
    .select('*')
    .eq('user_id', userId);
  console.log('Notifications for demo-sailor:', adminNotifs?.length || 0);

  console.log('\n=== Done ===');
}

main().catch(console.error);
