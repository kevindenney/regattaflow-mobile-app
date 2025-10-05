/**
 * Create Stripe Payment Intent for Race Entry
 *
 * This Supabase Edge Function creates a Stripe payment intent for race registration payments.
 *
 * Request body:
 * - entryId: string (race entry ID)
 * - amount: number (amount in cents)
 * - currency: string (3-letter currency code, e.g., "usd")
 * - description: string (payment description)
 *
 * Returns:
 * - clientSecret: string (Stripe payment intent client secret for mobile SDK)
 * - paymentIntentId: string (Stripe payment intent ID for confirmation)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify Stripe API key is configured
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Parse request body
    const { entryId, amount, currency, description } = await req.json()

    // Validate inputs
    if (!entryId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: entryId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount. Must be greater than 0' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!currency) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: currency' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Creating payment intent:', {
      entryId,
      amount,
      currency,
      description,
    })

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure it's an integer
      currency: currency.toLowerCase(),
      description: description || `Race Entry: ${entryId}`,
      metadata: {
        entry_id: entryId,
        platform: 'regattaflow_mobile',
      },
      // Automatic payment methods enable modern payment methods
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // Mobile doesn't support redirects
      },
    })

    console.log('Payment intent created:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    })

    // Return client secret for Stripe React Native SDK
    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Payment intent creation error:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create payment intent',
        details: error.type || 'unknown_error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
