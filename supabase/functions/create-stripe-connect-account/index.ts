/**
 * Create Stripe Connect Account Edge Function
 * Creates and onboards coaches to Stripe Connect for marketplace payments
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

interface ConnectAccountRequest {
  coach_id: string;
  return_url?: string;
  refresh_url?: string;
}

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

    const body: ConnectAccountRequest = await req.json();
    const { coach_id, return_url, refresh_url } = body;

    if (!coach_id) {
      return new Response(
        JSON.stringify({ error: 'coach_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the coach profile belongs to this user
    const { data: coachProfile, error: profileError } = await supabase
      .from('coach_profiles')
      .select('*, users!coach_profiles_user_id_fkey (email, full_name)')
      .eq('id', coach_id)
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

    // Check if coach already has a Stripe account
    let accountId = coachProfile.stripe_account_id;

    if (!accountId) {
      // Create new Stripe Connect account (Express type)
      const account = await stripe.accounts.create({
        type: 'express',
        country: coachProfile.country || 'US',
        email: coachProfile.users?.email || user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          mcc: '7941', // Sports clubs, fields, and promoters
          name: coachProfile.display_name || coachProfile.users?.full_name || 'Sailing Coach',
          product_description: 'Professional sailing coaching services',
          url: `https://regattaflow.com/coach/${coach_id}`,
        },
        metadata: {
          coach_id: coach_id,
          user_id: user.id,
        },
      });

      accountId = account.id;

      // Save account ID to coach profile
      const { error: updateError } = await supabase
        .from('coach_profiles')
        .update({
          stripe_account_id: accountId,
          stripe_onboarding_complete: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', coach_id);

      if (updateError) {
        console.error('Failed to save Stripe account ID:', updateError);
      }
    }

    // Create account onboarding link
    const baseUrl = Deno.env.get('APP_URL') || 'https://regattaflow.com';
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refresh_url || `${baseUrl}/coach-onboarding-stripe-callback?refresh=true`,
      return_url: return_url || `${baseUrl}/coach-onboarding-stripe-callback`,
      type: 'account_onboarding',
      collect: 'eventually_due',
    });

    return new Response(
      JSON.stringify({
        url: accountLink.url,
        accountId: accountId,
        expiresAt: accountLink.expires_at,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isStripeError = error instanceof Stripe.errors.StripeError;
    
    return new Response(
      JSON.stringify({ 
        error: isStripeError ? error.message : 'Failed to create Stripe Connect account',
        code: isStripeError ? error.code : undefined,
      }),
      { 
        status: isStripeError ? 400 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

