import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function runQueries() {
  console.log('=== Phase 17: Database Verification ===\n');

  // 1. Check thread_type distribution
  console.log('1. Thread type distribution:');
  const { data: threadTypes, error: err1 } = await supabase
    .from('crew_threads')
    .select('thread_type');

  if (err1) {
    console.log('Error:', err1.message);
  } else {
    const counts = threadTypes.reduce((acc, t) => {
      acc[t.thread_type] = (acc[t.thread_type] || 0) + 1;
      return acc;
    }, {});
    console.log(counts);
  }

  // 2. Check for duplicate direct threads (needs auth)
  console.log('\n2. Checking for duplicate direct threads:');
  console.log('   (Requires authentication to query - skipping in anonymous mode)');

  // 3. Check total thread and message counts
  console.log('\n3. Total counts:');
  const { count: threadCount } = await supabase
    .from('crew_threads')
    .select('*', { count: 'exact', head: true });

  const { count: messageCount } = await supabase
    .from('crew_thread_messages')
    .select('*', { count: 'exact', head: true });

  const { count: memberCount } = await supabase
    .from('crew_thread_members')
    .select('*', { count: 'exact', head: true });

  console.log('Threads:', threadCount);
  console.log('Messages:', messageCount);
  console.log('Memberships:', memberCount);

  // 4. Check recent messages
  console.log('\n4. Recent messages (last 5):');
  const { data: recentMsgs } = await supabase
    .from('crew_thread_messages')
    .select('id, thread_id, message, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentMsgs) {
    recentMsgs.forEach(m => {
      const preview = m.message.length > 50 ? m.message.substring(0, 50) + '...' : m.message;
      console.log('  -', preview, '(' + new Date(m.created_at).toLocaleString() + ')');
    });
  }
}

runQueries().catch(console.error);
