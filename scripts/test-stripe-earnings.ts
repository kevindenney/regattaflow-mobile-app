#!/usr/bin/env tsx
/**
 * Test script for Stripe Earnings implementation
 * Tests that monthly stats can be fetched from coaching_sessions
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables:');
  console.error('- EXPO_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMonthlyStats() {
  console.log('🧪 Testing Monthly Stats Query...\n');

  // Get current month's date range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  console.log(`📅 Date Range: ${startOfMonth.toLocaleDateString()} - ${endOfMonth.toLocaleDateString()}\n`);

  // First, check if coaching_sessions table exists
  const { data: tables, error: tableError } = await supabase
    .from('coaching_sessions')
    .select('id')
    .limit(1);

  if (tableError) {
    console.error('❌ Error accessing coaching_sessions table:', tableError.message);
    console.log('\n💡 Tip: Run database migrations first:');
    console.log('   supabase db push');
    return;
  }

  console.log('✅ coaching_sessions table exists\n');

  // Get all coaches
  const { data: coaches, error: coachError } = await supabase
    .from('coach_profiles')
    .select('id, user_id, stripe_account_id');

  if (coachError) {
    console.error('❌ Error fetching coaches:', coachError.message);
    return;
  }

  console.log(`📊 Found ${coaches?.length || 0} coach profiles\n`);

  if (!coaches || coaches.length === 0) {
    console.log('💡 No coaches found. Create a coach profile to test.');
    return;
  }

  // Test monthly stats for each coach
  for (const coach of coaches) {
    console.log(`\n👤 Coach ID: ${coach.id}`);
    console.log(`   User ID: ${coach.user_id}`);
    console.log(`   Stripe Account: ${coach.stripe_account_id || 'Not set'}\n`);

    const { data: sessions, error: sessionError } = await supabase
      .from('coaching_sessions')
      .select('fee_amount, currency, paid, status, completed_at')
      .eq('coach_id', coach.user_id)
      .eq('status', 'completed')
      .gte('completed_at', startOfMonth.toISOString())
      .lte('completed_at', endOfMonth.toISOString());

    if (sessionError) {
      console.error(`   ❌ Error fetching sessions:`, sessionError.message);
      continue;
    }

    if (!sessions || sessions.length === 0) {
      console.log('   ℹ️  No completed sessions this month');
      continue;
    }

    const totalEarned = sessions.reduce((sum, s) => sum + (Number(s.fee_amount) || 0), 0);
    const sessionsCompleted = sessions.length;
    const averagePerSession = sessionsCompleted > 0 ? totalEarned / sessionsCompleted : 0;
    const platformFee = totalEarned * 0.15;
    const currency = sessions[0]?.currency?.toLowerCase() || 'usd';

    console.log('   📈 Monthly Stats:');
    console.log(`   • Sessions Completed: ${sessionsCompleted}`);
    console.log(`   • Total Earned: ${formatCurrency(totalEarned, currency)}`);
    console.log(`   • Average/Session: ${formatCurrency(averagePerSession, currency)}`);
    console.log(`   • Platform Fee (15%): ${formatCurrency(platformFee, currency)}`);
    console.log(`   • Net Earnings: ${formatCurrency(totalEarned - platformFee, currency)}`);

    console.log('\n   📝 Session Details:');
    sessions.forEach((session, i) => {
      console.log(`   ${i + 1}. ${formatCurrency(session.fee_amount || 0, session.currency || 'usd')} - ${new Date(session.completed_at).toLocaleDateString()} ${session.paid ? '✓ Paid' : '○ Unpaid'}`);
    });
  }
}

async function testStripeConnectSetup() {
  console.log('\n\n🔌 Testing Stripe Connect Setup...\n');

  const { data: coaches, error } = await supabase
    .from('coach_profiles')
    .select('id, stripe_account_id, stripe_details_submitted, stripe_charges_enabled, stripe_payouts_enabled');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!coaches || coaches.length === 0) {
    console.log('ℹ️  No coaches found');
    return;
  }

  coaches.forEach((coach, i) => {
    console.log(`\n${i + 1}. Coach ${coach.id}:`);
    console.log(`   Stripe Account ID: ${coach.stripe_account_id || '❌ Not set'}`);
    console.log(`   Details Submitted: ${coach.stripe_details_submitted ? '✅' : '❌'}`);
    console.log(`   Charges Enabled: ${coach.stripe_charges_enabled ? '✅' : '❌'}`);
    console.log(`   Payouts Enabled: ${coach.stripe_payouts_enabled ? '✅' : '❌'}`);

    const ready = coach.stripe_account_id &&
                  coach.stripe_details_submitted &&
                  coach.stripe_charges_enabled;

    if (ready) {
      console.log('   Status: ✅ Ready for earnings');
    } else {
      console.log('   Status: ⚠️  Needs Stripe onboarding');
    }
  });
}

async function testEdgeFunctionsReady() {
  console.log('\n\n⚙️  Testing Edge Functions Readiness...\n');

  const functionsToCheck = [
    'stripe-balance',
    'stripe-transactions'
  ];

  console.log('📁 Edge Functions to deploy:');
  functionsToCheck.forEach(fn => {
    console.log(`   • ${fn}`);
  });

  console.log('\n💡 Deployment commands:');
  console.log('   supabase functions deploy stripe-balance');
  console.log('   supabase functions deploy stripe-transactions');

  console.log('\n🔐 Required secrets:');
  console.log('   supabase secrets set STRIPE_SECRET_KEY=sk_xxx');
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Stripe Earnings Implementation Test     ║');
  console.log('╚════════════════════════════════════════════╝\n');

  try {
    await testMonthlyStats();
    await testStripeConnectSetup();
    await testEdgeFunctionsReady();

    console.log('\n\n✅ Test Complete!\n');
    console.log('📖 Next Steps:');
    console.log('   1. Review the output above');
    console.log('   2. Deploy Edge Functions if not already deployed');
    console.log('   3. Set Stripe secret key in Supabase');
    console.log('   4. Test the earnings screen in the app');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
