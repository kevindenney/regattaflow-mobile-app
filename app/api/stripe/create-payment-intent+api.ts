/**
 * Create Payment Intent for Coach Marketplace
 * Handles payment creation for coaching sessions
 */

import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/src/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = await request.json();

    if (!sessionId || !userId) {
      return new Response('Missing required parameters', { status: 400 });
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('coaching_sessions')
      .select(`
        *,
        coach_profiles!coaching_sessions_coach_id_fkey(
          first_name,
          last_name,
          stripe_account_id,
          user_id
        ),
        coach_services!coaching_sessions_service_id_fkey(
          title,
          description
        )
      `)
      .eq('id', sessionId)
      .eq('student_id', userId)
      .single();

    if (sessionError || !session) {
      return new Response('Session not found or access denied', { status: 404 });
    }

    // Verify session is in correct state for payment
    if (session.payment_status !== 'pending') {
      return new Response('Session payment already processed', { status: 400 });
    }

    // Get or create Stripe customer for student
    let customerId = '';
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        metadata: {
          user_id: userId,
          app: 'regattaflow',
        },
      });

      // Store customer ID
      await supabase
        .from('stripe_customers')
        .insert({
          user_id: userId,
          stripe_customer_id: customer.id,
        });

      customerId = customer.id;
    }

    // Calculate application fee (platform commission)
    const applicationFeeAmount = Math.round(session.platform_fee);

    // Create payment intent
    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: session.total_amount,
      currency: session.currency.toLowerCase(),
      customer: customerId,
      description: `${session.coach_services.title} with ${session.coach_profiles.first_name} ${session.coach_profiles.last_name}`,
      metadata: {
        session_id: sessionId,
        coach_id: session.coach_id,
        student_id: userId,
        app: 'regattaflow',
        type: 'coaching_session',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // Add application fee for coach marketplace
    if (session.coach_profiles.stripe_account_id && applicationFeeAmount > 0) {
      paymentIntentData.application_fee_amount = applicationFeeAmount;
      paymentIntentData.transfer_data = {
        destination: session.coach_profiles.stripe_account_id,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    // Update session with payment intent ID
    await supabase
      .from('coaching_sessions')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}