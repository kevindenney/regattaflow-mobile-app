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

    // Get query params
    const url = new URL(req.url)
    const coachId = url.searchParams.get('coachId')
    const userId = url.searchParams.get('userId')
    const limit = parseInt(url.searchParams.get('limit') || '25')

    // Verify user owns this coach profile
    if (userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get coach's Stripe Connect account ID
    const { data: coach, error: coachError } = await supabase
      .from('coach_profiles')
      .select('stripe_account_id')
      .eq('id', coachId)
      .eq('user_id', userId)
      .single()

    if (coachError || !coach?.stripe_account_id) {
      return new Response(
        JSON.stringify({ error: 'Stripe Connect account not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Fetch recent charges (payments)
    const charges = await stripe.charges.list(
      {
        limit: Math.min(limit, 100),
      },
      {
        stripeAccount: coach.stripe_account_id,
      }
    )

    // Fetch recent transfers (payouts)
    const transfers = await stripe.transfers.list(
      {
        limit: Math.min(limit, 100),
      },
      {
        stripeAccount: coach.stripe_account_id,
      }
    )

    // Combine and sort transactions
    const transactions = [
      ...charges.data.map((charge) => ({
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        created: charge.created,
        description: charge.description || 'Coaching session payment',
        status: charge.status,
        type: 'charge' as const,
      })),
      ...transfers.data.map((transfer) => ({
        id: transfer.id,
        amount: transfer.amount,
        currency: transfer.currency,
        created: transfer.created,
        description: transfer.description || 'Transfer to bank',
        status: 'paid' as const,
        type: 'transfer' as const,
      })),
    ]
      .sort((a, b) => b.created - a.created)
      .slice(0, limit)

    return new Response(
      JSON.stringify({ transactions }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
