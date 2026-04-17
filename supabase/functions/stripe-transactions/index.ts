/**
 * Stripe Transactions Edge Function
 * Gets transaction history for a coach's Stripe Connect account
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get params from query string (coachId is legacy)
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get('coachId') || url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'userId or coachId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resolve Stripe account ID: check creator_stripe_accounts first, fall back to coach_profiles
    let stripeAccountId: string | null = null;

    // 1) creator_stripe_accounts (new: any blueprint seller)
    const { data: creatorAccount } = await supabase
      .from('creator_stripe_accounts')
      .select('stripe_account_id')
      .eq('user_id', targetUserId)
      .single();

    if (creatorAccount?.stripe_account_id) {
      stripeAccountId = creatorAccount.stripe_account_id;
    }

    // 2) Fall back to coach_profiles (legacy coaches)
    if (!stripeAccountId) {
      const { data: coachProfile } = await supabase
        .from('coach_profiles')
        .select('stripe_account_id, user_id')
        .or(`id.eq.${targetUserId},user_id.eq.${targetUserId}`)
        .single();

      if (coachProfile?.stripe_account_id) {
        stripeAccountId = coachProfile.stripe_account_id;
      }
    }

    // Verify the requesting user owns this account
    if (targetUserId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to access this account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for Stripe account
    if (!stripeAccountId) {
      return new Response(
        JSON.stringify({
          transactions: [],
          error: 'No Stripe Connect account found'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get balance transactions from the connected account
    const balanceTransactions = await stripe.balanceTransactions.list(
      {
        limit: Math.min(limit, 100),
      },
      {
        stripeAccount: stripeAccountId,
      }
    );

    // Format transactions for the client
    const transactions = balanceTransactions.data.map((txn) => ({
      id: txn.id,
      amount: txn.amount,
      currency: txn.currency,
      created: txn.created,
      description: txn.description || getTransactionDescription(txn.type),
      status: txn.status,
      type: txn.type,
      net: txn.net,
      fee: txn.fee,
      available_on: txn.available_on,
    }));

    // Also get recent payouts
    const payouts = await stripe.payouts.list(
      {
        limit: 5,
      },
      {
        stripeAccount: stripeAccountId,
      }
    );

    const payoutList = payouts.data.map((payout) => ({
      id: payout.id,
      amount: payout.amount,
      currency: payout.currency,
      created: payout.created,
      arrival_date: payout.arrival_date,
      status: payout.status,
      type: 'payout',
      description: 'Bank transfer',
    }));

    return new Response(
      JSON.stringify({
        transactions,
        payouts: payoutList,
        hasMore: balanceTransactions.has_more,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting Stripe transactions:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isStripeError = error instanceof Stripe.errors.StripeError;
    
    return new Response(
      JSON.stringify({ 
        transactions: [],
        error: isStripeError ? error.message : 'Failed to get transactions',
      }),
      { 
        status: 200, // Return 200 with error to avoid breaking UI
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Get a human-readable description for transaction type
 */
function getTransactionDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'charge': 'Payment received',
    'payment': 'Payment received',
    'payment_refund': 'Refund issued',
    'refund': 'Refund issued',
    'transfer': 'Transfer received',
    'payout': 'Payout to bank',
    'adjustment': 'Account adjustment',
    'application_fee': 'Platform fee',
    'application_fee_refund': 'Platform fee refund',
    'stripe_fee': 'Processing fee',
    'network_cost': 'Network cost',
  };
  
  return descriptions[type] || type;
}

