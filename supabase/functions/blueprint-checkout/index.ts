/**
 * Blueprint Checkout Edge Function
 * Creates a Stripe checkout session for blueprint purchases.
 * Cloned from course-checkout with blueprint-specific adaptations.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BlueprintCheckoutRequest {
  blueprintId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { blueprintId, userId, successUrl, cancelUrl }: BlueprintCheckoutRequest = await req.json();

    if (!blueprintId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: blueprintId and userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get blueprint info
    const { data: blueprint, error: blueprintError } = await supabase
      .from('timeline_blueprints')
      .select('id, title, description, price_cents, currency, is_published, access_level, user_id, organization_id')
      .eq('id', blueprintId)
      .single();

    if (blueprintError || !blueprint) {
      return new Response(
        JSON.stringify({ error: 'Blueprint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!blueprint.is_published) {
      return new Response(
        JSON.stringify({ error: 'Blueprint is not available for purchase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already purchased
    const { data: existingPurchase } = await supabase
      .from('blueprint_purchases')
      .select('id, status')
      .eq('blueprint_id', blueprintId)
      .eq('buyer_id', userId)
      .eq('status', 'completed')
      .maybeSingle();

    if (existingPurchase) {
      return new Response(
        JSON.stringify({ error: 'You already have access to this blueprint' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is org member (free access bypass)
    if (blueprint.organization_id) {
      const { data: membership } = await supabase
        .from('organization_memberships')
        .select('id')
        .eq('user_id', userId)
        .eq('organization_id', blueprint.organization_id)
        .eq('membership_status', 'active')
        .maybeSingle();

      if (membership) {
        // Auto-subscribe without payment (org members get free access)
        await supabase
          .from('blueprint_subscriptions')
          .upsert({
            blueprint_id: blueprintId,
            subscriber_id: userId,
            subscribed_at: new Date().toISOString(),
          }, {
            onConflict: 'blueprint_id,subscriber_id',
          });

        return new Response(
          JSON.stringify({
            success: true,
            free: true,
            message: 'Free access granted through your organization membership',
            redirectUrl: successUrl,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Free blueprint — just subscribe
    if (!blueprint.price_cents || blueprint.price_cents <= 0) {
      await supabase
        .from('blueprint_subscriptions')
        .upsert({
          blueprint_id: blueprintId,
          subscriber_id: userId,
          subscribed_at: new Date().toISOString(),
        }, {
          onConflict: 'blueprint_id,subscriber_id',
        });

      return new Response(
        JSON.stringify({
          success: true,
          free: true,
          message: 'Successfully subscribed to free blueprint',
          redirectUrl: successUrl,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name || undefined,
        metadata: {
          user_id: userId,
          source: 'betterat',
        },
      });
      customerId = customer.id;

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create checkout session for paid blueprint
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: blueprint.currency || 'usd',
          product_data: {
            name: blueprint.title,
            description: blueprint.description || `Access to ${blueprint.title}`,
            metadata: {
              blueprint_id: blueprintId,
            },
          },
          unit_amount: blueprint.price_cents,
        },
        quantity: 1,
      }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&blueprint_id=${blueprintId}`,
      cancel_url: `${cancelUrl}?blueprint_id=${blueprintId}`,
      payment_intent_data: {
        metadata: {
          type: 'blueprint_purchase',
          blueprint_id: blueprintId,
          user_id: userId,
          creator_id: blueprint.user_id,
          blueprint_title: blueprint.title,
        },
      },
      metadata: {
        type: 'blueprint_purchase',
        blueprint_id: blueprintId,
        user_id: userId,
        creator_id: blueprint.user_id,
        blueprint_title: blueprint.title,
      },
      allow_promotion_codes: true,
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
        amount: blueprint.price_cents,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Blueprint checkout error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
