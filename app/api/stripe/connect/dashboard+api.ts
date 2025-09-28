/**
 * Stripe Connect Dashboard Access for Coaches
 * Creates login links for coaches to access their Stripe Express dashboard
 */

import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/src/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    const { userId, coachId } = await request.json();

    if (!userId || !coachId) {
      return new Response('Missing required parameters', { status: 400 });
    }

    // Get coach profile
    const { data: coach, error: coachError } = await supabase
      .from('coach_profiles')
      .select('stripe_account_id')
      .eq('id', coachId)
      .eq('user_id', userId)
      .single();

    if (coachError || !coach) {
      return new Response('Coach profile not found or access denied', { status: 404 });
    }

    if (!coach.stripe_account_id) {
      return new Response('Coach has not completed Stripe onboarding', { status: 400 });
    }

    // Create login link for Stripe Express dashboard
    const loginLink = await stripe.accounts.createLoginLink(coach.stripe_account_id);

    return new Response(
      JSON.stringify({
        url: loginLink.url,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating Stripe dashboard link:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}