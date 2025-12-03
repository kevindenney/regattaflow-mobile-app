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

    // Get coachId from query params
    const url = new URL(req.url);
    const coachId = url.searchParams.get('coachId');
    const userId = url.searchParams.get('userId');

    if (!coachId) {
      return new Response(
        JSON.stringify({ error: 'coachId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get coach profile
    const { data: coachProfile, error: profileError } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('id', coachId)
      .single();

    if (profileError || !coachProfile) {
      return new Response(
        JSON.stringify({ error: 'Coach profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership
    if (coachProfile.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to access this coach profile' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for Stripe account
    if (!coachProfile.stripe_account_id) {
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
      stripeAccount: coachProfile.stripe_account_id,
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
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isStripeError = error instanceof Stripe.errors.StripeError;
    
    return new Response(
      JSON.stringify({ 
        available: 0,
        pending: 0,
        currency: 'usd',
        error: isStripeError ? error.message : 'Failed to get balance',
      }),
      { 
        status: 200, // Return 200 with error message to avoid breaking UI
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

