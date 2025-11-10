/**
 * Script to create demo accounts for RegattaFlow
 * Run with: npx tsx scripts/setup-demo-accounts.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const DEMO_PASSWORD = 'Demo123!'; // Simple password for demo accounts

const demoAccounts = [
  {
    email: 'demo-sailor@regattaflow.app',
    password: DEMO_PASSWORD,
    firstName: 'Demo',
    lastName: 'Sailor',
    role: 'sailor',
  },
  {
    email: 'demo-club@regattaflow.app',
    password: DEMO_PASSWORD,
    firstName: 'Demo',
    lastName: 'Club Manager',
    role: 'club_manager',
  },
  {
    email: 'demo-coach@regattaflow.app',
    password: DEMO_PASSWORD,
    firstName: 'Demo',
    lastName: 'Coach',
    role: 'coach',
  },
];

async function setupDemoAccounts() {
  console.log('🔧 Setting up demo accounts...\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   EXPO_PUBLIC_SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  for (const account of demoAccounts) {
    console.log(`📧 Creating account: ${account.email}`);

    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const userExists = existingUsers?.users.some(u => u.email === account.email);

      if (userExists) {
        console.log(`   ℹ️  Account already exists, skipping...`);
        continue;
      }

      // Create the user
      const { data: user, error: createError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true, // Auto-confirm email for demo accounts
        user_metadata: {
          first_name: account.firstName,
          last_name: account.lastName,
          role: account.role,
        },
      });

      if (createError) {
        console.error(`   ❌ Error creating user:`, createError.message);
        continue;
      }

      console.log(`   ✅ Created user: ${user.user?.id}`);

      // Create profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.user?.id,
          email: account.email,
          first_name: account.firstName,
          last_name: account.lastName,
        });

      if (profileError) {
        console.error(`   ⚠️  Warning: Could not create profile:`, profileError.message);
      } else {
        console.log(`   ✅ Created profile`);
      }
    } catch (error: any) {
      console.error(`   ❌ Unexpected error:`, error.message);
    }

    console.log('');
  }

  console.log('✨ Demo account setup complete!\n');
  console.log('📝 Add these to your .env.local file:\n');
  console.log(`EXPO_PUBLIC_DEMO_SAILOR_PASSWORD=${DEMO_PASSWORD}`);
  console.log(`EXPO_PUBLIC_DEMO_CLUB_PASSWORD=${DEMO_PASSWORD}`);
  console.log(`EXPO_PUBLIC_DEMO_COACH_PASSWORD=${DEMO_PASSWORD}`);
}

setupDemoAccounts().catch(console.error);
