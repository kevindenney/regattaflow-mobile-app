/**
 * Seed demo messages and notifications for demo-sailor
 * Run with: node scripts/seed-demo-messages.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log('Starting seed...');

  // Get demo-sailor user ID
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('Failed to list users:', usersError);
    process.exit(1);
  }

  const demoSailor = users.users.find(u =>
    u.email === 'demo-sailor@regattaflow.app' ||
    u.email?.includes('demo-sailor')
  );

  if (!demoSailor) {
    console.error('Demo sailor not found!');
    console.log('Available users:', users.users.map(u => u.email));
    process.exit(1);
  }

  console.log('Found demo-sailor:', demoSailor.id);

  // Find another user to be conversation partner
  const demoCoach = users.users.find(u =>
    u.email?.includes('demo-coach') ||
    u.email?.includes('coach')
  ) || users.users.find(u => u.id !== demoSailor.id);

  const partnerId = demoCoach?.id || demoSailor.id;
  console.log('Using partner:', partnerId);

  // Create Thread 1: Weekend Racing Crew
  const { data: thread1, error: t1Error } = await supabase
    .from('crew_threads')
    .insert({
      name: 'Weekend Racing Crew',
      owner_id: demoSailor.id,
      avatar_emoji: '⛵',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (t1Error) {
    console.error('Failed to create thread 1:', t1Error);
    process.exit(1);
  }
  console.log('Created thread 1:', thread1.id);

  // Add members to thread 1
  await supabase.from('crew_thread_members').insert([
    {
      thread_id: thread1.id,
      user_id: demoSailor.id,
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

  // Add messages to thread 1
  const thread1Messages = [
    { user_id: demoSailor.id, message: "Hey team! Ready for Saturday's race?", offset: 2 * 24 * 60 },
    { user_id: partnerId, message: "Absolutely! Checked the forecast - looking like 12-15 knots from the SW", offset: 2 * 24 * 60 - 30 },
    { user_id: demoSailor.id, message: "Perfect conditions! I'll bring the new jib", offset: 2 * 24 * 60 - 45 },
    { user_id: partnerId, message: "Great. Meet at the club at 9am?", offset: 24 * 60 },
    { user_id: demoSailor.id, message: "See you then! 🏁", offset: 24 * 60 - 10 },
    { user_id: partnerId, message: "Don't forget the new tiller extension", offset: 2 * 60 },
  ];

  for (const msg of thread1Messages) {
    await supabase.from('crew_thread_messages').insert({
      thread_id: thread1.id,
      user_id: msg.user_id,
      message: msg.message,
      message_type: 'text',
      created_at: new Date(Date.now() - msg.offset * 60 * 1000).toISOString(),
    });
  }
  console.log('Added messages to thread 1');

  // Create Thread 2: Dragon Fleet Chat
  const { data: thread2, error: t2Error } = await supabase
    .from('crew_threads')
    .insert({
      name: 'Dragon Fleet Chat',
      owner_id: demoSailor.id,
      avatar_emoji: '🐉',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (t2Error) {
    console.error('Failed to create thread 2:', t2Error);
    process.exit(1);
  }
  console.log('Created thread 2:', thread2.id);

  // Add member to thread 2
  await supabase.from('crew_thread_members').insert({
    thread_id: thread2.id,
    user_id: demoSailor.id,
    role: 'owner',
    joined_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    last_read_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Add messages to thread 2
  const thread2Messages = [
    { message: 'Welcome to the Dragon Fleet chat!', offset: 7 * 24 * 60, type: 'text' },
    { message: 'Use this thread to coordinate fleet activities', offset: 7 * 24 * 60 - 1, type: 'system' },
    { message: 'Anyone up for practice Wednesday evening?', offset: 3 * 24 * 60, type: 'text' },
    { message: 'Reminder: Fleet AGM next month', offset: 30, type: 'text' },
  ];

  for (const msg of thread2Messages) {
    await supabase.from('crew_thread_messages').insert({
      thread_id: thread2.id,
      user_id: demoSailor.id,
      message: msg.message,
      message_type: msg.type,
      created_at: new Date(Date.now() - msg.offset * 60 * 1000).toISOString(),
    });
  }
  console.log('Added messages to thread 2');

  // Create notifications
  const notifications = [
    { type: 'new_follower', reference_type: 'user', is_read: false, offset: 60 },
    { type: 'race_like', reference_type: 'race', message: 'liked your race notes', is_read: false, offset: 3 * 60 },
    { type: 'comment', reference_type: 'activity_comment', message: 'Great race! What was your start strategy?', is_read: false, offset: 5 * 60 },
    { type: 'new_follower', reference_type: 'user', is_read: true, offset: 24 * 60 },
    { type: 'race_like', reference_type: 'race', message: 'liked your tuning notes', is_read: true, offset: 48 * 60 },
  ];

  for (const notif of notifications) {
    await supabase.from('social_notifications').insert({
      user_id: demoSailor.id,
      type: notif.type,
      actor_id: partnerId,
      reference_type: notif.reference_type,
      reference_id: crypto.randomUUID(),
      message: notif.message || null,
      is_read: notif.is_read,
      created_at: new Date(Date.now() - notif.offset * 60 * 1000).toISOString(),
    });
  }
  console.log('Added notifications');

  console.log('\n✅ Demo data created successfully!');
  console.log('Thread 1 ID:', thread1.id);
  console.log('Thread 2 ID:', thread2.id);
}

main().catch(console.error);
