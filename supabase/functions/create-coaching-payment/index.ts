import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify user session
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const {
      amount,
      coachStripeAccountId,
      platformFee,
      metadata
    } = await req.json()

    if (!amount || !coachStripeAccountId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, coachStripeAccountId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create payment intent with Stripe Connect
    // Application fee is the platform's revenue (15%)
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Amount in cents
      currency: 'usd',
      application_fee_amount: platformFee || Math.round(amount * 0.15), // 15% platform fee
      transfer_data: {
        destination: coachStripeAccountId, // Coach's connected account
      },
      metadata: {
        ...metadata,
        sailor_id: user.id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return new Response(
      JSON.stringify({
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
