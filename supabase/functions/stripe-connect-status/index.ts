/**
 * Stripe Connect Status Edge Function
 * Gets the status of a user's Stripe Connect account.
 * Checks creator_stripe_accounts first, falls back to coach_profiles for legacy.
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

    // Accept user_id or coach_id (legacy)
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id') || url.searchParams.get('coach_id');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the requesting user owns this account
    if (userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to access this account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1) Check creator_stripe_accounts first
    let stripeAccountId: string | null = null;

    const { data: creatorAccount } = await supabase
      .from('creator_stripe_accounts')
      .select('stripe_account_id')
      .eq('user_id', userId)
      .single();

    if (creatorAccount?.stripe_account_id) {
      stripeAccountId = creatorAccount.stripe_account_id;
    }

    // 2) Fall back to coach_profiles for legacy accounts
    if (!stripeAccountId) {
      const { data: coachProfile } = await supabase
        .from('coach_profiles')
        .select('stripe_account_id')
        .eq('user_id', userId)
        .single();

      if (coachProfile?.stripe_account_id) {
        stripeAccountId = coachProfile.stripe_account_id;
      }
    }

    // If no Stripe account anywhere, return not connected
    if (!stripeAccountId) {
      return new Response(
        JSON.stringify({
          connected: false,
          needsOnboarding: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch account from Stripe
    const account = await stripe.accounts.retrieve(stripeAccountId);

    // Update creator_stripe_accounts with latest status
    await supabase
      .from('creator_stripe_accounts')
      .upsert({
        user_id: userId,
        stripe_account_id: stripeAccountId,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        onboarding_complete: account.details_submitted,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    return new Response(
      JSON.stringify({
        connected: true,
        accountId: account.id,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        needsOnboarding: !account.details_submitted,
        requirements: {
          currently_due: account.requirements?.currently_due || [],
          eventually_due: account.requirements?.eventually_due || [],
          pending_verification: account.requirements?.pending_verification || [],
          disabled_reason: account.requirements?.disabled_reason,
        },
        capabilities: {
          card_payments: account.capabilities?.card_payments,
          transfers: account.capabilities?.transfers,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting Stripe Connect status:', error);

    const isStripeError = error instanceof Stripe.errors.StripeError;

    return new Response(
      JSON.stringify({
        error: isStripeError ? error.message : 'Failed to get Stripe Connect status',
        connected: false,
        needsOnboarding: true,
      }),
      {
        status: isStripeError ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
