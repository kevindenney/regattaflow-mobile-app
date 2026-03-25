/**
 * Create Org Checkout Session Edge Function
 * Creates a Stripe checkout session for organization/institutional subscriptions
 *
 * Supports:
 * - Starter: $500/yr flat (≤25 seats)
 * - Department: $15/seat/yr (26-500 seats), quantity-based
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Org plan Stripe Price IDs
const ORG_PLAN_PRICES: Record<string, { priceId: string; isPerSeat: boolean; memberTier: string }> = {
  starter: {
    priceId: Deno.env.get('STRIPE_ORG_STARTER_PRICE_ID') || 'price_org_starter',
    isPerSeat: false,
    memberTier: 'individual',
  },
  department: {
    priceId: Deno.env.get('STRIPE_ORG_DEPARTMENT_PRICE_ID') || 'price_org_department',
    isPerSeat: true,
    memberTier: 'pro',
  },
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrgCheckoutRequest {
  organizationId: string;
  planId: 'starter' | 'department';
  seatCount: number;
  successUrl: string;
  cancelUrl: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { organizationId, planId, seatCount, successUrl, cancelUrl }: OrgCheckoutRequest =
      await req.json();

    if (!organizationId || !planId || !seatCount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: organizationId, planId, seatCount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const planConfig = ORG_PLAN_PRICES[planId];
    if (!planConfig) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan. Enterprise plans require custom setup.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get org info
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, stripe_customer_id')
      .eq('id', organizationId)
      .single();

    if (!org) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get admin user email for Stripe customer
    const { data: adminMembership } = await supabase
      .from('organization_memberships')
      .select('user_id')
      .eq('organization_id', organizationId)
      .in('role', ['owner', 'admin'])
      .in('status', ['active', 'verified'])
      .limit(1)
      .single();

    let adminEmail = '';
    if (adminMembership) {
      const { data: adminUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', adminMembership.user_id)
        .single();
      adminEmail = adminUser?.email || '';
    }

    // Get or create Stripe customer for the org
    let customerId = org.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: adminEmail,
        name: org.name,
        metadata: {
          organization_id: organizationId,
          type: 'institution',
        },
      });
      customerId = customer.id;

      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organizationId);
    }

    // Build line items
    const quantity = planConfig.isPerSeat ? seatCount : 1;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: planConfig.priceId,
          quantity,
        },
      ],
      success_url: `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          organization_id: organizationId,
          plan_id: planId,
          seat_count: String(seatCount),
          member_tier: planConfig.memberTier,
        },
      },
      metadata: {
        organization_id: organizationId,
        plan_id: planId,
        seat_count: String(seatCount),
        type: 'org_subscription',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });

    // Create pending subscription record
    await supabase.from('organization_subscriptions').upsert(
      {
        organization_id: organizationId,
        stripe_customer_id: customerId,
        plan_id: planId,
        status: 'trialing', // Will be updated to 'active' by webhook
        seat_count: seatCount,
        member_tier: planConfig.memberTier,
        billing_period: 'annual',
        currency: 'usd',
      },
      { onConflict: 'organization_id' }
    );

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Org checkout session error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
