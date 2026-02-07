/**
 * Fix demo-sailor data and create notifications
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log('=== Fixing Demo Data ===\n');

  // Get demo-sailor and partner IDs
  const { data: users } = await adminClient.auth.admin.listUsers();
  const demoSailor = users.users.find(u => u.email?.includes('demo-sailor'));
  const partner = users.users.find(u =>
    u.email?.includes('demo-coach') || u.email?.includes('coach')
  ) || users.users.find(u => u.id !== demoSailor?.id);

  if (!demoSailor) {
    console.log('Demo-sailor not found!');
    return;
  }

  console.log('Demo-sailor:', demoSailor.id);
  console.log('Partner:', partner?.id);

  // Check notifications for demo-sailor
  const { data: existingNotifs } = await adminClient
    .from('social_notifications')
    .select('*')
    .eq('user_id', demoSailor.id);

  console.log('\nExisting notifications for demo-sailor:', existingNotifs?.length || 0);

  // Delete any existing notifications for demo-sailor to recreate fresh
  if (existingNotifs && existingNotifs.length > 0) {
    await adminClient
      .from('social_notifications')
      .delete()
      .eq('user_id', demoSailor.id);
    console.log('Cleared old notifications');
  }

  // Create fresh notifications using correct schema (title, body, not message/reference_type)
  const notifications = [
    { type: 'new_follower', title: 'New Follower', body: 'started following you', is_read: false, offset: 60 },
    { type: 'race_like', title: 'Race Liked', body: 'liked your race notes for Dragon Fleet Regatta', is_read: false, offset: 3 * 60 },
    { type: 'race_comment', title: 'New Comment', body: 'Great race! What was your start strategy?', is_read: false, offset: 5 * 60 },
    { type: 'new_follower', title: 'New Follower', body: 'started following you', is_read: true, offset: 24 * 60 },
    { type: 'race_like', title: 'Race Liked', body: 'liked your tuning notes', is_read: true, offset: 48 * 60 },
  ];

  for (const notif of notifications) {
    const { error } = await adminClient.from('social_notifications').insert({
      user_id: demoSailor.id,
      type: notif.type,
      actor_id: partner?.id || demoSailor.id,
      title: notif.title,
      body: notif.body,
      is_read: notif.is_read,
      created_at: new Date(Date.now() - notif.offset * 60 * 1000).toISOString(),
    });
    if (error) {
      console.log('Error creating notification:', error.message);
    }
  }
  console.log('Created', notifications.length, 'notifications');

  // Verify
  const { data: newNotifs } = await adminClient
    .from('social_notifications')
    .select('*')
    .eq('user_id', demoSailor.id)
    .order('created_at', { ascending: false });

  console.log('\nNew notifications for demo-sailor:', newNotifs?.length || 0);
  newNotifs?.forEach(n => console.log(`  - ${n.type}: ${n.message || '(no message)'}, read: ${n.is_read}`));

  // Also verify threads have unread messages
  console.log('\n--- Checking thread unread status ---');

  const { data: viewData } = await adminClient
    .from('crew_threads_with_details')
    .select('*')
    .eq('member_user_id', demoSailor.id);

  viewData?.forEach(v => {
    console.log(`Thread: ${v.name}`);
    console.log(`  Unread: ${v.unread_count}`);
    console.log(`  Last message: ${v.last_message}`);
    console.log(`  Last read at: ${v.last_read_at}`);
  });

  console.log('\n✅ Done!');
}

main().catch(console.error);
