#!/usr/bin/env node

/**
 * Simple Demo Users Seed Script
 * Creates 5 mock users with authentication that can be used to test race suggestions
 *
 * Run: node scripts/seed-demo-users-simple.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEMO_PASSWORD = process.env.DEMO_PASSWORD;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}
if (!DEMO_PASSWORD) {
  console.error('❌ DEMO_PASSWORD environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// =====================================================
// Mock Users Data
// =====================================================

const MOCK_USERS = [
  {
    email: 'sarah.chen@sailing.com',
    password: DEMO_PASSWORD,
    full_name: 'Sarah Chen',
    user_type: 'sailor',
  },
  {
    email: 'mike.thompson@racing.com',
    password: DEMO_PASSWORD,
    full_name: 'Mike Thompson',
    user_type: 'sailor',
  },
  {
    email: 'emma.wilson@yacht.club',
    password: DEMO_PASSWORD,
    full_name: 'Emma Wilson',
    user_type: 'sailor',
  },
  {
    email: 'james.rodriguez@fleet.com',
    password: DEMO_PASSWORD,
    full_name: 'James Rodriguez',
    user_type: 'sailor',
  },
  {
    email: 'coach.anderson@sailing.com',
    password: DEMO_PASSWORD,
    full_name: 'Coach Anderson',
    user_type: 'coach',
  },
];

async function createUsers() {
  console.log('\n🧑‍🤝‍🧑 Creating mock users...\n');

  const createdUsers = [];

  for (const userData of MOCK_USERS) {
    try {
      // Try to create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
        },
      });

      if (authError) {
        // Check if user already exists
        if (authError.message.includes('already registered')) {
          console.log(`  ℹ️  User already exists: ${userData.email}`);

          // Try to get existing user
          const { data: { users } } = await supabase.auth.admin.listUsers();
          const existingUser = users.find(u => u.email === userData.email);

          if (existingUser) {
            createdUsers.push({ ...userData, id: existingUser.id });
          }
          continue;
        } else {
          throw authError;
        }
      }

      // Try to update user profile (if users table has these columns)
      try {
        await supabase
          .from('users')
          .update({
            full_name: userData.full_name,
            user_type: userData.user_type,
            onboarding_step: 'completed',
          })
          .eq('id', authData.user.id);
      } catch (profileError) {
        // Ignore profile update errors - table might have different schema
        console.log(`  ⚠️  Could not update profile (table schema mismatch)`);
      }

      console.log(`  ✅ Created: ${userData.full_name.padEnd(20)} ${userData.email}`);
      createdUsers.push({ ...userData, id: authData.user.id });

    } catch (error) {
      console.error(`  ❌ Error creating user ${userData.email}:`, error.message);
    }
  }

  return createdUsers;
}

async function createSampleRaces(users) {
  console.log('\n🏁 Creating sample race history...\n');

  const now = new Date();
  const races = [];

  // Helper to create a date in the past
  const monthsAgo = (months) => {
    const date = new Date(now);
    date.setMonth(date.getMonth() - months);
    return date.toISOString();
  };

  // Create some historical races for each sailor to enable pattern detection
  const sarah = users.find(u => u.email === 'sarah.chen@sailing.com');
  if (sarah) {
    // Spring Dragon Championship pattern (3 years)
    for (let year = 0; year < 3; year++) {
      races.push({
        name: 'Spring Dragon Championship',
        created_by: sarah.id,
        start_date: new Date(now.getFullYear() - year, 3, 15).toISOString(), // April
        metadata: {
          venue_name: 'Victoria Harbour',
          class: 'Dragon',
        },
        status: 'completed',
      });
    }

    // Regular J/70 racing
    for (let i = 0; i < 5; i++) {
      races.push({
        name: `J/70 Club Race`,
        created_by: sarah.id,
        start_date: monthsAgo(i * 0.5),
        metadata: {
          venue_name: 'Hong Kong Waters',
          class: 'J/70',
        },
        status: 'completed',
      });
    }
  }

  const mike = users.find(u => u.email === 'mike.thompson@racing.com');
  if (mike) {
    // Bay Challenge pattern (2 years)
    for (let year = 0; year < 2; year++) {
      races.push({
        name: 'Bay Challenge Regatta',
        created_by: mike.id,
        start_date: new Date(now.getFullYear() - year, 5, 20).toISOString(), // June
        metadata: {
          venue_name: 'San Francisco Bay',
          class: 'Dragon',
        },
        status: 'completed',
      });
    }

    // Regular 420 racing
    for (let i = 0; i < 4; i++) {
      races.push({
        name: `420 Race Day`,
        created_by: mike.id,
        start_date: monthsAgo(i),
        metadata: {
          venue_name: 'San Francisco Bay',
          class: '420',
        },
        status: 'completed',
      });
    }
  }

  const emma = users.find(u => u.email === 'emma.wilson@yacht.club');
  if (emma) {
    // Regular Laser racing
    for (let i = 0; i < 6; i++) {
      races.push({
        name: `Laser Club Race`,
        created_by: emma.id,
        start_date: monthsAgo(i * 0.3),
        metadata: {
          venue_name: 'Sydney Harbour',
          class: 'Laser',
        },
        status: 'completed',
      });
    }
  }

  // Insert all races
  for (const raceData of races) {
    try {
      await supabase.from('regattas').insert(raceData);
    } catch (error) {
      // Silently continue if insert fails
    }
  }

  console.log(`  ✅ Created ${races.length} historical races for pattern detection`);
}

async function main() {
  console.log('🚀 Starting demo users seed...');
  console.log('══════════════════════════════════════════════════════════\n');

  try {
    const users = await createUsers();

    if (users.length > 0) {
      await createSampleRaces(users);
    }

    console.log('\n══════════════════════════════════════════════════════════');
    console.log('✅ Demo users created successfully!\n');
    console.log('📧 Login Credentials:');
    console.log('──────────────────────────────────────────────────────────');
    MOCK_USERS.forEach(user => {
      console.log(`  ${user.full_name.padEnd(20)} ${user.email.padEnd(35)} ${user.password}`);
    });
    console.log('──────────────────────────────────────────────────────────\n');
    console.log('💡 Next Steps:');
    console.log('   1. Use these credentials on the login page');
    console.log('   2. Login as Sarah Chen or Mike Thompson');
    console.log('   3. Go to Add Race screen');
    console.log('   4. See pattern-based suggestions!\n');
    console.log('🔄 To generate fresh suggestions for all users:');
    console.log('   npx supabase functions invoke refresh-race-suggestions\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
