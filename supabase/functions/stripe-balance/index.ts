/**
 * Stripe Balance Edge Function
 * Gets the balance of a coach's Stripe Connect account
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

    // Get userId/coachId from query params (coachId is legacy)
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get('coachId') || url.searchParams.get('userId');

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
          available: 0,
          pending: 0,
          currency: 'usd',
          error: 'No Stripe Connect account found'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get balance from Stripe using the connected account
    const balance = await stripe.balance.retrieve({
      stripeAccount: stripeAccountId,
    });

    // Sum up balances (there might be multiple currencies)
    const available = balance.available.reduce((sum, b) => sum + b.amount, 0);
    const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0);
    const currency = balance.available[0]?.currency || balance.pending[0]?.currency || 'usd';

    return new Response(
      JSON.stringify({
        available,
        pending,
        currency,
        breakdown: {
          available: balance.available,
          pending: balance.pending,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting Stripe balance:', error);

    const isStripeError = error instanceof Stripe.errors.StripeError;

    // BUG 3: Return 503 so the client knows the balance is unavailable
    return new Response(
      JSON.stringify({
        error: isStripeError ? error.message : 'Balance temporarily unavailable',
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

