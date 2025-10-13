// Quick script to identify and remove test users
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupTestUsers() {
  // Find users with no user_type and no onboarding_completed
  const { data: incompleteUsers, error } = await supabase
    .from('users')
    .select('id, email, user_type, onboarding_completed, created_at')
    .or('user_type.is.null,onboarding_completed.eq.false')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log('\n📋 Incomplete test users:');
  incompleteUsers?.forEach((user, i) => {
    console.log(`${i + 1}. ${user.email} (ID: ${user.id.slice(0, 8)}...) - Type: ${user.user_type || 'none'}, Created: ${new Date(user.created_at).toLocaleString()}`);
  });

  console.log('\n💡 To delete a user, run this in Supabase SQL editor:');
  console.log('DELETE FROM auth.users WHERE id = \'USER_ID_HERE\';');
}

cleanupTestUsers();
