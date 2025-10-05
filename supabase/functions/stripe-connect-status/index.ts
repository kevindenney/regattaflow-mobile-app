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
    const coachId = url.searchParams.get('coach_id')

    if (!coachId) {
      return new Response(JSON.stringify({ error: 'Missing coach_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get coach's Stripe Connect account ID
    const { data: coach, error: coachError } = await supabase
      .from('coach_profiles')
      .select('stripe_account_id, stripe_details_submitted, stripe_charges_enabled, stripe_payouts_enabled')
      .eq('id', coachId)
      .eq('user_id', user.id)
      .single()

    if (coachError || !coach) {
      return new Response(
        JSON.stringify({
          connected: false,
          needsOnboarding: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!coach.stripe_account_id) {
      return new Response(
        JSON.stringify({
          connected: false,
          needsOnboarding: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Fetch account details from Stripe
    const account = await stripe.accounts.retrieve(coach.stripe_account_id)

    // Update local database with latest status
    const { error: updateError } = await supabase
      .from('coach_profiles')
      .update({
        stripe_details_submitted: account.details_submitted || false,
        stripe_charges_enabled: account.charges_enabled || false,
        stripe_payouts_enabled: account.payouts_enabled || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', coachId)

    if (updateError) {
      console.error('Error updating coach status:', updateError)
    }

    return new Response(
      JSON.stringify({
        connected: true,
        accountId: account.id,
        detailsSubmitted: account.details_submitted || false,
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
        needsOnboarding: !account.details_submitted,
        requirements: account.requirements,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error fetching Stripe Connect status:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
