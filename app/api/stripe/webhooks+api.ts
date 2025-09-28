/**
 * Stripe Webhook Handler for RegattaFlow Coach Marketplace
 * Handles payment events: payment_intent.succeeded, payment_intent.payment_failed
 * Updates coaching session status and triggers notifications
 */

import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabase } from '@/src/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const sig = headersList.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`✅ Received Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'account.updated':
        await handleCoachAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'transfer.created':
        await handleCoachPayout(event.data.object as Stripe.Transfer);
        break;

      default:
        console.log(`🔄 Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

/**
 * Handle successful payment - confirm coaching session
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`💰 Payment succeeded: ${paymentIntent.id}`);

    // Find the coaching session by payment intent ID
    const { data: session, error: fetchError } = await supabase
      .from('coaching_sessions')
      .select(`
        *,
        coach_profiles!coaching_sessions_coach_id_fkey(
          first_name,
          last_name,
          email,
          stripe_account_id
        ),
        student:auth.users!coaching_sessions_student_id_fkey(email)
      `)
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single();

    if (fetchError || !session) {
      console.error('❌ Could not find session for payment intent:', paymentIntent.id);
      return;
    }

    // Update session status to confirmed
    const { error: updateError } = await supabase
      .from('coaching_sessions')
      .update({
        status: 'confirmed',
        payment_status: 'captured',
        payment_confirmed_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('❌ Failed to update session status:', updateError);
      return;
    }

    // Send confirmation emails
    await sendPaymentConfirmationEmails(session);

    // Schedule payout to coach (usually 7 days after session completion)
    await scheduleCoachPayout(session);

    console.log(`✅ Session ${session.id} confirmed successfully`);
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
  }
}

/**
 * Handle failed payment - mark session as payment failed
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`❌ Payment failed: ${paymentIntent.id}`);

    const { data: session, error: fetchError } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single();

    if (fetchError || !session) {
      console.error('❌ Could not find session for failed payment:', paymentIntent.id);
      return;
    }

    // Update session status
    const { error: updateError } = await supabase
      .from('coaching_sessions')
      .update({
        status: 'payment_failed',
        payment_status: 'failed',
        payment_failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('❌ Failed to update failed session:', updateError);
      return;
    }

    // Send payment failure notification
    await sendPaymentFailureEmails(session);

    console.log(`❌ Session ${session.id} marked as payment failed`);
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
  }
}

/**
 * Handle canceled payment - mark session as canceled
 */
async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`🚫 Payment canceled: ${paymentIntent.id}`);

    const { error } = await supabase
      .from('coaching_sessions')
      .update({
        status: 'cancelled',
        payment_status: 'cancelled',
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('❌ Failed to update canceled session:', error);
    }
  } catch (error) {
    console.error('❌ Error handling payment cancellation:', error);
  }
}

/**
 * Handle coach Stripe account updates
 */
async function handleCoachAccountUpdated(account: Stripe.Account) {
  try {
    console.log(`🔄 Coach account updated: ${account.id}`);

    const { error } = await supabase
      .from('coach_profiles')
      .update({
        stripe_account_id: account.id,
        stripe_details_submitted: account.details_submitted,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_account_id', account.id);

    if (error) {
      console.error('❌ Failed to update coach account details:', error);
    }
  } catch (error) {
    console.error('❌ Error handling coach account update:', error);
  }
}

/**
 * Handle coach payout completion
 */
async function handleCoachPayout(transfer: Stripe.Transfer) {
  try {
    console.log(`💸 Coach payout completed: ${transfer.id}`);

    // Find sessions related to this payout
    const { data: sessions, error } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('stripe_transfer_id', transfer.id);

    if (error) {
      console.error('❌ Failed to find sessions for payout:', error);
      return;
    }

    // Update sessions to mark payout as completed
    if (sessions && sessions.length > 0) {
      const { error: updateError } = await supabase
        .from('coaching_sessions')
        .update({
          payout_processed: true,
          payout_date: new Date().toISOString(),
        })
        .in('id', sessions.map(s => s.id));

      if (updateError) {
        console.error('❌ Failed to update payout status:', updateError);
      }
    }

    // Send payout confirmation to coach
    await sendPayoutConfirmationEmail(transfer);
  } catch (error) {
    console.error('❌ Error handling coach payout:', error);
  }
}

/**
 * Send confirmation emails to coach and student
 */
async function sendPaymentConfirmationEmails(session: any) {
  // In a production app, integrate with email service (SendGrid, etc.)
  console.log(`📧 Sending confirmation emails for session ${session.id}`);

  // Student confirmation email
  // await emailService.send({
  //   to: session.student.email,
  //   template: 'booking_confirmed_student',
  //   data: { session, coach: session.coach_profiles }
  // });

  // Coach notification email
  // await emailService.send({
  //   to: session.coach_profiles.email,
  //   template: 'booking_confirmed_coach',
  //   data: { session }
  // });
}

/**
 * Send payment failure notification emails
 */
async function sendPaymentFailureEmails(session: any) {
  console.log(`📧 Sending payment failure notifications for session ${session.id}`);

  // Implementation would go here
}

/**
 * Schedule coach payout after session completion
 */
async function scheduleCoachPayout(session: any) {
  console.log(`⏰ Scheduling payout for session ${session.id}`);

  // In production, this would:
  // 1. Calculate payout amount (session amount - platform fee)
  // 2. Schedule automatic transfer after session completion + holding period
  // 3. Store payout schedule in database
}

/**
 * Send payout confirmation to coach
 */
async function sendPayoutConfirmationEmail(transfer: Stripe.Transfer) {
  console.log(`📧 Sending payout confirmation for transfer ${transfer.id}`);

  // Implementation would go here
}