/**
 * Debug script to check crew threads data and RLS
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log('=== Debug Crew Threads ===\n');

  // Check if tables have data (using admin/service role - bypasses RLS)
  console.log('1. Checking data with service role (bypasses RLS):\n');

  const { data: threads, error: threadsError } = await adminClient
    .from('crew_threads')
    .select('*');
  console.log('crew_threads:', threads?.length || 0, 'rows');
  if (threadsError) console.log('  Error:', threadsError.message);
  threads?.forEach(t => console.log(`  - ${t.name} (owner: ${t.owner_id})`));

  const { data: members, error: membersError } = await adminClient
    .from('crew_thread_members')
    .select('*');
  console.log('\ncrew_thread_members:', members?.length || 0, 'rows');
  if (membersError) console.log('  Error:', membersError.message);
  members?.forEach(m => console.log(`  - thread: ${m.thread_id}, user: ${m.user_id}, role: ${m.role}`));

  const { data: messages, error: messagesError } = await adminClient
    .from('crew_thread_messages')
    .select('*');
  console.log('\ncrew_thread_messages:', messages?.length || 0, 'rows');
  if (messagesError) console.log('  Error:', messagesError.message);

  // Check the view
  console.log('\n2. Checking view with service role:\n');
  const { data: viewData, error: viewError } = await adminClient
    .from('crew_threads_with_details')
    .select('*');
  console.log('crew_threads_with_details:', viewData?.length || 0, 'rows');
  if (viewError) console.log('  Error:', viewError.message);
  viewData?.forEach(v => console.log(`  - ${v.name}, user: ${v.member_user_id}, unread: ${v.unread_count}`));

  // Check notifications
  console.log('\n3. Checking notifications:\n');
  const { data: notifications, error: notifError } = await adminClient
    .from('social_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log('social_notifications:', notifications?.length || 0, 'rows');
  if (notifError) console.log('  Error:', notifError.message);
  notifications?.forEach(n => console.log(`  - type: ${n.type}, user: ${n.user_id}, read: ${n.is_read}`));

  // Get demo-sailor ID
  const { data: users } = await adminClient.auth.admin.listUsers();
  const demoSailor = users.users.find(u => u.email?.includes('demo-sailor'));
  console.log('\n4. Demo-sailor ID:', demoSailor?.id);

  // Now test as demo-sailor with anon client
  if (demoSailor) {
    console.log('\n5. Testing RLS - signing in as demo-sailor...');

    // Sign in as demo-sailor
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: 'demo-sailor@regattaflow.app',
      password: 'demo-sailor-2024'
    });

    if (signInError) {
      console.log('  Sign-in error:', signInError.message);
    } else {
      console.log('  Signed in as:', signInData.user?.email);

      // Now query the view as the logged-in user
      const { data: userViewData, error: userViewError } = await anonClient
        .from('crew_threads_with_details')
        .select('*');
      console.log('\n  View as demo-sailor:', userViewData?.length || 0, 'rows');
      if (userViewError) console.log('  Error:', userViewError.message);
      userViewData?.forEach(v => console.log(`    - ${v.name}, unread: ${v.unread_count}`));

      // Query notifications
      const { data: userNotifs, error: userNotifsError } = await anonClient
        .from('social_notifications')
        .select('*');
      console.log('\n  Notifications as demo-sailor:', userNotifs?.length || 0, 'rows');
      if (userNotifsError) console.log('  Error:', userNotifsError.message);
    }
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
