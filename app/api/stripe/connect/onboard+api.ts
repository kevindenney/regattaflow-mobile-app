/**
 * Stripe Connect Onboarding for Coaches
 * Creates Stripe Connect accounts and onboarding links for coaches
 */

import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/src/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    const { userId, coachId, returnUrl, refreshUrl } = await request.json();

    if (!userId || !coachId) {
      return new Response('Missing required parameters', { status: 400 });
    }

    // Get coach profile
    const { data: coach, error: coachError } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('id', coachId)
      .eq('user_id', userId)
      .single();

    if (coachError || !coach) {
      return new Response('Coach profile not found or access denied', { status: 404 });
    }

    let accountId = coach.stripe_account_id;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: coach.country || 'US',
        email: coach.email,
        business_type: 'individual',
        individual: {
          first_name: coach.first_name,
          last_name: coach.last_name,
          email: coach.email,
        },
        business_profile: {
          name: `${coach.first_name} ${coach.last_name} Sailing Coach`,
          product_description: 'Professional sailing coaching and instruction services',
          support_email: coach.email,
          url: coach.website || undefined,
        },
        metadata: {
          coach_id: coachId,
          user_id: userId,
          app: 'regattaflow',
        },
      });

      accountId = account.id;

      // Update coach profile with Stripe account ID
      await supabase
        .from('coach_profiles')
        .update({
          stripe_account_id: accountId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', coachId);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl || `${process.env.EXPO_PUBLIC_BASE_URL}/coach/onboard/refresh`,
      return_url: returnUrl || `${process.env.EXPO_PUBLIC_BASE_URL}/coach/dashboard`,
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({
        url: accountLink.url,
        accountId,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating Stripe Connect onboarding:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Get Stripe Connect account status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');
    const userId = searchParams.get('userId');

    if (!userId || !coachId) {
      return new Response('Missing required parameters', { status: 400 });
    }

    // Get coach profile
    const { data: coach, error: coachError } = await supabase
      .from('coach_profiles')
      .select('stripe_account_id, stripe_details_submitted, stripe_charges_enabled, stripe_payouts_enabled')
      .eq('id', coachId)
      .eq('user_id', userId)
      .single();

    if (coachError || !coach) {
      return new Response('Coach profile not found or access denied', { status: 404 });
    }

    if (!coach.stripe_account_id) {
      return new Response(
        JSON.stringify({
          connected: false,
          needsOnboarding: true,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get latest account details from Stripe
    const account = await stripe.accounts.retrieve(coach.stripe_account_id);

    // Update local database with latest status
    await supabase
      .from('coach_profiles')
      .update({
        stripe_details_submitted: account.details_submitted,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', coachId);

    return new Response(
      JSON.stringify({
        connected: true,
        accountId: account.id,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        needsOnboarding: !account.details_submitted,
        requirements: account.requirements,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error getting Stripe Connect status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}