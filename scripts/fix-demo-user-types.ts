/**
 * Script to fix demo user types in the users table
 * Run with: npx tsx scripts/fix-demo-user-types.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const demoUsers = [
  {
    email: 'demo-sailor@regattaflow.io',
    full_name: 'Demo Sailor',
    user_type: 'sailor',
  },
  {
    email: 'demo-club@regattaflow.io',
    full_name: 'Demo Club Manager',
    user_type: 'club',
  },
  {
    email: 'demo-coach@regattaflow.io',
    full_name: 'Demo Coach',
    user_type: 'coach',
  },
];

async function fixDemoUserTypes() {
  console.log('🔧 Fixing demo user types...\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  for (const user of demoUsers) {
    console.log(`📧 Updating: ${user.email}`);

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          full_name: user.full_name,
          user_type: user.user_type,
          onboarding_completed: true,
        })
        .eq('email', user.email)
        .select();

      if (error) {
        console.error(`   ❌ Error:`, error.message);
        continue;
      }

      if (data && data.length > 0) {
        console.log(`   ✅ Updated user_type to: ${data[0].user_type}`);
      } else {
        console.log(`   ⚠️  No rows updated`);
      }
    } catch (error: any) {
      console.error(`   ❌ Unexpected error:`, error.message);
    }

    console.log('');
  }

  // Verify the updates
  console.log('🔍 Verifying updates...\n');
  const { data: verifyData, error: verifyError } = await supabase
    .from('users')
    .select('email, full_name, user_type, onboarding_completed')
    .like('email', 'demo-%@regattaflow.io')
    .order('email');

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
  } else {
    console.table(verifyData);
  }

  console.log('\n✨ Demo user types fixed!');
}

fixDemoUserTypes().catch(console.error);
