/**
 * Create Stripe Checkout Session Edge Function
 * Creates a Stripe checkout session for club subscriptions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Plan to Stripe Price ID mapping
const PLAN_PRICES: Record<string, string> = {
  starter: Deno.env.get('STRIPE_STARTER_PRICE_ID') || 'price_starter',
  professional: Deno.env.get('STRIPE_PRO_PRICE_ID') || 'price_professional',
  enterprise: Deno.env.get('STRIPE_ENTERPRISE_PRICE_ID') || 'price_enterprise',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  planId: 'starter' | 'professional' | 'enterprise';
  clubId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { planId, clubId, userId, successUrl, cancelUrl }: CheckoutRequest = await req.json();

    if (!planId || !clubId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const priceId = PLAN_PRICES[planId];
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user and club info
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    const { data: club } = await supabase
      .from('yacht_clubs')
      .select('name, stripe_customer_id')
      .eq('id', clubId)
      .single();

    if (!user || !club) {
      return new Response(
        JSON.stringify({ error: 'User or club not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create Stripe customer
    let customerId = club.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: club.name,
        metadata: {
          club_id: clubId,
          user_id: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to club
      await supabase
        .from('yacht_clubs')
        .update({ stripe_customer_id: customerId })
        .eq('id', clubId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          club_id: clubId,
          user_id: userId,
          plan_id: planId,
        },
      },
      metadata: {
        club_id: clubId,
        user_id: userId,
        plan_id: planId,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Checkout session error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

