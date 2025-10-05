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

    // Get request body
    const { coach_id, return_url, refresh_url } = await req.json()

    if (!coach_id) {
      return new Response(JSON.stringify({ error: 'Missing coach_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify user owns this coach profile
    const { data: coach, error: coachError } = await supabase
      .from('coach_profiles')
      .select('id, user_id, stripe_account_id')
      .eq('id', coach_id)
      .eq('user_id', user.id)
      .single()

    if (coachError || !coach) {
      return new Response(JSON.stringify({ error: 'Coach profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let stripeAccountId = coach.stripe_account_id

    // Create Stripe Connect account if it doesn't exist
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US', // Default to US, can be made dynamic based on coach location
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
      })

      stripeAccountId = account.id

      // Save Stripe account ID to database
      const { error: updateError } = await supabase
        .from('coach_profiles')
        .update({
          stripe_account_id: stripeAccountId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', coach_id)

      if (updateError) {
        console.error('Error saving Stripe account ID:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to save Stripe account ID' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refresh_url || `${Deno.env.get('APP_URL')}/coach-onboarding-profile-preview`,
      return_url: return_url || `${Deno.env.get('APP_URL')}/coach-onboarding-stripe-callback`,
      type: 'account_onboarding',
    })

    return new Response(
      JSON.stringify({
        success: true,
        url: accountLink.url,
        account_id: stripeAccountId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
