/**
 * Seed data for the actual logged-in demo-sailor
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log('=== Seeding data for current user ===\n');

  // Sign in to get the actual user ID
  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email: 'demo-sailor@regattaflow.app',
    password: DEMO_PASSWORD
  });

  if (signInError) {
    console.log('Sign-in error:', signInError.message);
    return;
  }

  const userId = signInData.user.id;
  console.log('Current user:', signInData.user.email);
  console.log('User ID:', userId);

  // Find a partner user
  const { data: users } = await adminClient.auth.admin.listUsers();
  const partner = users.users.find(u => u.id !== userId && u.email?.includes('coach'))
    || users.users.find(u => u.id !== userId);
  const partnerId = partner?.id || userId;
  console.log('Partner ID:', partnerId);

  // Clean up any existing data for this user
  console.log('\nCleaning up existing data...');

  // Delete notifications
  await adminClient.from('social_notifications').delete().eq('user_id', userId);

  // Get threads where user is a member and delete
  const { data: memberOf } = await adminClient
    .from('crew_thread_members')
    .select('thread_id')
    .eq('user_id', userId);

  if (memberOf && memberOf.length > 0) {
    const threadIds = memberOf.map(m => m.thread_id);
    // Delete the threads (cascade will delete members and messages)
    await adminClient.from('crew_threads').delete().in('id', threadIds);
  }

  // Create Thread 1
  console.log('\nCreating threads...');
  const { data: thread1, error: t1Error } = await adminClient
    .from('crew_threads')
    .insert({
      name: 'Weekend Racing Crew',
      owner_id: userId,
      avatar_emoji: '⛵',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (t1Error) {
    console.log('Error creating thread 1:', t1Error.message);
    return;
  }
  console.log('Created thread 1:', thread1.id);

  // Add members
  await adminClient.from('crew_thread_members').insert([
    {
      thread_id: thread1.id,
      user_id: userId,
      role: 'owner',
      joined_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      last_read_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      thread_id: thread1.id,
      user_id: partnerId,
      role: 'member',
      joined_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      last_read_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  // Add messages
  const thread1Messages = [
    { user_id: userId, message: "Hey team! Ready for Saturday's race?", offset: 2 * 24 * 60 },
    { user_id: partnerId, message: "Absolutely! Checked the forecast - looking like 12-15 knots from the SW", offset: 2 * 24 * 60 - 30 },
    { user_id: userId, message: "Perfect conditions! I'll bring the new jib", offset: 2 * 24 * 60 - 45 },
    { user_id: partnerId, message: "Great. Meet at the club at 9am?", offset: 24 * 60 },
    { user_id: userId, message: "See you then! 🏁", offset: 24 * 60 - 10 },
    { user_id: partnerId, message: "Don't forget the new tiller extension", offset: 2 * 60 },
  ];

  for (const msg of thread1Messages) {
    await adminClient.from('crew_thread_messages').insert({
      thread_id: thread1.id,
      user_id: msg.user_id,
      message: msg.message,
      message_type: 'text',
      created_at: new Date(Date.now() - msg.offset * 60 * 1000).toISOString(),
    });
  }
  console.log('Added messages to thread 1');

  // Create Thread 2
  const { data: thread2, error: t2Error } = await adminClient
    .from('crew_threads')
    .insert({
      name: 'Dragon Fleet Chat',
      owner_id: userId,
      avatar_emoji: '🐉',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (t2Error) {
    console.log('Error creating thread 2:', t2Error.message);
    return;
  }
  console.log('Created thread 2:', thread2.id);

  await adminClient.from('crew_thread_members').insert({
    thread_id: thread2.id,
    user_id: userId,
    role: 'owner',
    joined_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    last_read_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const thread2Messages = [
    { message: 'Welcome to the Dragon Fleet chat!', offset: 7 * 24 * 60, type: 'text' },
    { message: 'Use this thread to coordinate fleet activities', offset: 7 * 24 * 60 - 1, type: 'system' },
    { message: 'Anyone up for practice Wednesday evening?', offset: 3 * 24 * 60, type: 'text' },
    { message: 'Reminder: Fleet AGM next month', offset: 30, type: 'text' },
  ];

  for (const msg of thread2Messages) {
    await adminClient.from('crew_thread_messages').insert({
      thread_id: thread2.id,
      user_id: userId,
      message: msg.message,
      message_type: msg.type,
      created_at: new Date(Date.now() - msg.offset * 60 * 1000).toISOString(),
    });
  }
  console.log('Added messages to thread 2');

  // Create notifications
  console.log('\nCreating notifications...');
  const notifications = [
    { type: 'new_follower', title: 'New Follower', body: 'started following you', is_read: false, offset: 60 },
    { type: 'race_like', title: 'Race Liked', body: 'liked your race notes for Dragon Fleet Regatta', is_read: false, offset: 3 * 60 },
    { type: 'race_comment', title: 'New Comment', body: 'Great race! What was your start strategy?', is_read: false, offset: 5 * 60 },
    { type: 'new_follower', title: 'New Follower', body: 'started following you', is_read: true, offset: 24 * 60 },
    { type: 'race_like', title: 'Race Liked', body: 'liked your tuning notes', is_read: true, offset: 48 * 60 },
  ];

  for (const notif of notifications) {
    const { error } = await adminClient.from('social_notifications').insert({
      user_id: userId,
      type: notif.type,
      actor_id: partnerId,
      title: notif.title,
      body: notif.body,
      is_read: notif.is_read,
      created_at: new Date(Date.now() - notif.offset * 60 * 1000).toISOString(),
    });
    if (error) console.log('Notification error:', error.message);
  }
  console.log('Created notifications');

  // Verify
  console.log('\n--- Verification ---');
  const { data: verifyThreads } = await adminClient
    .from('crew_threads')
    .select('*')
    .eq('owner_id', userId);
  console.log('Threads owned:', verifyThreads?.length || 0);

  const { data: verifyMembers } = await adminClient
    .from('crew_thread_members')
    .select('*')
    .eq('user_id', userId);
  console.log('Thread memberships:', verifyMembers?.length || 0);

  const { data: verifyNotifs } = await adminClient
    .from('social_notifications')
    .select('*')
    .eq('user_id', userId);
  console.log('Notifications:', verifyNotifs?.length || 0);

  console.log('\n✅ Done! Refresh the app to see the data.');
}

main().catch(console.error);
