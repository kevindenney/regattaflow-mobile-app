/**
 * Stripe Webhooks Edge Function
 * Handles all Stripe webhook events for payments, subscriptions, and Connect
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    console.error('Missing stripe-signature header');
    return new Response('Missing signature', { status: 400 });
  }

  try {
    const body = await req.text();
    
    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      // Payment Intent Events
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      // Subscription Events
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      // Checkout Session Events
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      // Invoice Events
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      // Stripe Connect Events
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer);
        break;

      case 'payout.paid':
        await handlePayoutPaid(event.data.object as Stripe.Payout, event.account);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);
  const metadata = paymentIntent.metadata;

  if (metadata.type === 'race_entry' && metadata.entry_id) {
    // Update race entry payment status
    const { error } = await supabase
      .from('race_entries')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        payment_intent_id: paymentIntent.id,
        payment_confirmed_at: new Date().toISOString(),
        amount_paid: paymentIntent.amount / 100, // Convert from cents
        payment_date: new Date().toISOString(),
      })
      .eq('id', metadata.entry_id);

    if (error) {
      console.error('Failed to update race entry:', error);
    } else {
      console.log(`Race entry ${metadata.entry_id} marked as paid`);
      
      // Trigger confirmation email
      await triggerConfirmationEmail(metadata.entry_id, 'race_entry');
    }
  }

  if (metadata.type === 'coaching_session' && metadata.session_id) {
    // Update coaching session payment status
    const { error } = await supabase
      .from('coaching_sessions')
      .update({
        payment_status: 'captured',
        status: 'confirmed',
        stripe_payment_intent_id: paymentIntent.id,
        payment_date: new Date().toISOString(),
      })
      .eq('id', metadata.session_id);

    if (error) {
      console.error('Failed to update coaching session:', error);
    } else {
      console.log(`Coaching session ${metadata.session_id} marked as paid`);
      
      // Trigger notification to coach
      await triggerConfirmationEmail(metadata.session_id, 'coaching_session');
    }
  }

  if (metadata.type === 'subscription' && metadata.user_id) {
    // Update user subscription
    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        subscription_updated_at: new Date().toISOString(),
      })
      .eq('id', metadata.user_id);

    if (error) {
      console.error('Failed to update user subscription:', error);
    }
  }

  // Handle course purchase
  if (metadata.type === 'course_purchase' && metadata.course_id && metadata.user_id) {
    await handleCoursePurchaseSuccess(
      metadata.course_id,
      metadata.user_id,
      paymentIntent.id,
      paymentIntent.amount
    );
  }
}

/**
 * Handle successful course purchase
 */
async function handleCoursePurchaseSuccess(
  courseId: string,
  userId: string,
  paymentIntentId: string,
  amountPaid: number
) {
  console.log(`Course purchase succeeded: course=${courseId}, user=${userId}`);

  // Create enrollment record
  const { data: enrollment, error: enrollError } = await supabase
    .from('learning_enrollments')
    .upsert({
      user_id: userId,
      course_id: courseId,
      stripe_payment_id: paymentIntentId,
      amount_paid_cents: amountPaid,
      access_type: 'purchase',
      enrolled_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,course_id',
    })
    .select()
    .single();

  if (enrollError) {
    console.error('Failed to create enrollment:', enrollError);
    return;
  }

  console.log(`Enrollment created: ${enrollment?.id}`);

  // Get course and user info for email
  const { data: course } = await supabase
    .from('learning_courses')
    .select('title')
    .eq('id', courseId)
    .single();

  const { data: user } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  // Send confirmation email
  if (user?.email) {
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: user.email,
          subject: `Course Access Confirmed: ${course?.title || 'Your Course'}`,
          html: `
            <h2>Welcome to Your New Course!</h2>
            <p>Hi ${user.full_name || 'Sailor'},</p>
            <p>Your payment has been received and you now have access to:</p>
            <h3>${course?.title || 'Your Course'}</h3>
            <p>Start learning now and improve your racing skills!</p>
            <p><a href="https://regattaflow.com/learn/${courseId}" style="display:inline-block;background-color:#3B82F6;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Start Learning</a></p>
            <p>Thank you for choosing RegattaFlow!</p>
          `,
        },
      });
    } catch (emailError) {
      console.error('Failed to send course confirmation email:', emailError);
    }
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);
  const metadata = paymentIntent.metadata;
  const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

  if (metadata.type === 'race_entry' && metadata.entry_id) {
    await supabase
      .from('race_entries')
      .update({
        payment_status: 'failed',
        payment_error: failureMessage,
      })
      .eq('id', metadata.entry_id);
  }

  if (metadata.type === 'coaching_session' && metadata.session_id) {
    await supabase
      .from('coaching_sessions')
      .update({
        payment_status: 'failed',
      })
      .eq('id', metadata.session_id);
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`Checkout session completed: ${session.id}`);
  const metadata = session.metadata || {};

  // Handle course purchase checkout
  if (metadata.type === 'course_purchase' && metadata.course_id && metadata.user_id) {
    console.log(`Course checkout completed: course=${metadata.course_id}, user=${metadata.user_id}`);
    
    // Create enrollment - checkout.session.completed is the primary event for course purchases
    await handleCoursePurchaseSuccess(
      metadata.course_id,
      metadata.user_id,
      session.payment_intent as string || session.id, // Use session ID if no payment intent
      session.amount_total || 0
    );
    
    // Also store the checkout session ID
    await supabase
      .from('learning_enrollments')
      .update({
        stripe_checkout_session_id: session.id,
      })
      .eq('user_id', metadata.user_id)
      .eq('course_id', metadata.course_id);
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);
  
  const customerId = subscription.customer as string;
  
  // Find user by Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error(`User not found for customer: ${customerId}`);
    return;
  }

  // Map subscription status
  const statusMap: Record<string, string> = {
    'active': 'active',
    'trialing': 'trialing',
    'past_due': 'past_due',
    'canceled': 'canceled',
    'incomplete': 'incomplete',
    'incomplete_expired': 'canceled',
    'unpaid': 'past_due',
  };

  // Get the price/product to determine tier
  // Price IDs: Basic $120/yr, Pro $360/yr (updated 2026-01-15)
  const priceId = subscription.items.data[0]?.price.id;
  const tierMap: Record<string, string> = {
    // Use env vars if set, with hardcoded fallbacks
    [Deno.env.get('STRIPE_BASIC_PRICE_ID') || 'price_1Splo2BbfEeOhHXbHi1ENal0']: 'basic',
    [Deno.env.get('STRIPE_PRO_PRICE_ID') || 'price_1SplplBbfEeOhHXbRunl0IIa']: 'pro',
    // Hardcoded price IDs (in case env vars differ)
    'price_1Splo2BbfEeOhHXbHi1ENal0': 'basic',  // $120/year
    'price_1SplplBbfEeOhHXbRunl0IIa': 'pro',    // $360/year
    // Legacy price IDs (map old prices to appropriate tiers)
    'price_1Sl0i8BbfEeOhHXbmUQ5OBkV': 'basic',  // old $300/year Pro -> basic
    'price_1Sl0ljBbfEeOhHXbKmEU06Ha': 'pro',    // old $480/year Championship -> pro
  };

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: user.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: statusMap[subscription.status] || subscription.status,
      tier: tierMap[priceId] || 'basic',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at: subscription.cancel_at 
        ? new Date(subscription.cancel_at * 1000).toISOString() 
        : null,
      canceled_at: subscription.canceled_at 
        ? new Date(subscription.canceled_at * 1000).toISOString() 
        : null,
      trial_end: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000).toISOString() 
        : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Failed to update subscription:', error);
  }

  // Also update user record
  await supabase
    .from('users')
    .update({
      subscription_status: statusMap[subscription.status] || subscription.status,
      subscription_tier: tierMap[priceId] || 'basic',
      subscription_updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`Subscription deleted: ${subscription.id}`);
  
  const customerId = subscription.customer as string;
  
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) return;

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  await supabase
    .from('users')
    .update({
      subscription_status: 'canceled',
      subscription_tier: 'free',
      subscription_updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);
}

/**
 * Handle paid invoice
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`Invoice paid: ${invoice.id}`);
  
  const customerId = invoice.customer as string;
  
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) return;

  // Record invoice
  await supabase
    .from('invoices')
    .upsert({
      user_id: user.id,
      stripe_invoice_id: invoice.id,
      amount_eur: Math.round((invoice.amount_paid || 0) / 100),
      currency: invoice.currency || 'eur',
      status: 'paid',
      invoice_pdf: invoice.invoice_pdf,
      paid_at: new Date().toISOString(),
      created_at: new Date(invoice.created * 1000).toISOString(),
    }, {
      onConflict: 'stripe_invoice_id',
    });
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Invoice payment failed: ${invoice.id}`);
  
  const customerId = invoice.customer as string;
  
  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) return;

  // Update subscription status
  await supabase
    .from('users')
    .update({
      subscription_status: 'past_due',
      subscription_updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  // Send payment failed email
  if (user.email) {
    await supabase.functions.invoke('send-email', {
      body: {
        to: user.email,
        subject: 'Payment Failed - RegattaFlow Subscription',
        html: `
          <h2>Payment Failed</h2>
          <p>We were unable to process your payment for your RegattaFlow subscription.</p>
          <p>Please update your payment method to continue enjoying premium features.</p>
          <p><a href="https://regattaflow.com/settings/billing">Update Payment Method</a></p>
        `,
      },
    });
  }
}

/**
 * Handle Stripe Connect account updates
 */
async function handleAccountUpdated(account: Stripe.Account) {
  console.log(`Connected account updated: ${account.id}`);
  
  // Update coach profile with account status
  const { error } = await supabase
    .from('coach_profiles')
    .update({
      stripe_details_submitted: account.details_submitted,
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_account_id', account.id);

  if (error) {
    console.error('Failed to update coach profile:', error);
  }
}

/**
 * Handle transfer created (platform to connected account)
 */
async function handleTransferCreated(transfer: Stripe.Transfer) {
  console.log(`Transfer created: ${transfer.id}, amount: ${transfer.amount}`);
  
  // Log transfer for accounting
  const { error } = await supabase
    .from('platform_transfers')
    .insert({
      stripe_transfer_id: transfer.id,
      destination_account: transfer.destination as string,
      amount: transfer.amount,
      currency: transfer.currency,
      created_at: new Date(transfer.created * 1000).toISOString(),
    });

  if (error) {
    console.error('Failed to log transfer:', error);
  }
}

/**
 * Handle payout to connected account
 */
async function handlePayoutPaid(payout: Stripe.Payout, accountId?: string) {
  console.log(`Payout completed: ${payout.id}, amount: ${payout.amount}`);
  
  if (accountId) {
    // Find coach by Stripe account
    const { data: coach } = await supabase
      .from('coach_profiles')
      .select('id, user_id')
      .eq('stripe_account_id', accountId)
      .single();

    if (coach) {
      // Record payout for coach
      await supabase
        .from('coach_payouts')
        .insert({
          coach_id: coach.id,
          stripe_payout_id: payout.id,
          amount: payout.amount,
          currency: payout.currency,
          arrival_date: payout.arrival_date 
            ? new Date(payout.arrival_date * 1000).toISOString()
            : null,
          status: 'paid',
          created_at: new Date().toISOString(),
        });
    }
  }
}

/**
 * Trigger confirmation email via send-email function
 */
async function triggerConfirmationEmail(entityId: string, type: 'race_entry' | 'coaching_session') {
  try {
    if (type === 'race_entry') {
      // Get entry details
      const { data: entry } = await supabase
        .from('race_entries')
        .select(`
          *,
          users!sailor_id (email, full_name),
          regattas (event_name, start_date)
        `)
        .eq('id', entityId)
        .single();

      if (entry?.users?.email) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: entry.users.email,
            subject: `Entry Confirmed: ${entry.regattas?.event_name || 'Race'}`,
            html: `
              <h2>Your Race Entry is Confirmed!</h2>
              <p>Hi ${entry.users?.full_name || 'Sailor'},</p>
              <p>Your payment has been received and your entry is confirmed.</p>
              <ul>
                <li><strong>Event:</strong> ${entry.regattas?.event_name}</li>
                <li><strong>Sail Number:</strong> ${entry.sail_number || 'TBD'}</li>
                <li><strong>Entry Number:</strong> ${entry.entry_number || 'TBD'}</li>
              </ul>
              <p>Good luck on the water!</p>
            `,
          },
        });
      }
    }

    if (type === 'coaching_session') {
      // Get session details
      const { data: session } = await supabase
        .from('coaching_sessions')
        .select(`
          *,
          sailor:users!coaching_sessions_sailor_id_fkey (email, full_name),
          coach:coach_profiles!coaching_sessions_coach_id_fkey (
            display_name,
            users (email, full_name)
          )
        `)
        .eq('id', entityId)
        .single();

      // Email to sailor
      if (session?.sailor?.email) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: session.sailor.email,
            subject: 'Coaching Session Confirmed',
            html: `
              <h2>Your Coaching Session is Confirmed!</h2>
              <p>Hi ${session.sailor?.full_name || 'Sailor'},</p>
              <p>Your payment has been received and your coaching session is confirmed.</p>
              <p><strong>Coach:</strong> ${session.coach?.display_name || session.coach?.users?.full_name}</p>
              <p><strong>Date:</strong> ${new Date(session.scheduled_at).toLocaleString()}</p>
            `,
          },
        });
      }

      // Email to coach
      if (session?.coach?.users?.email) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: session.coach.users.email,
            subject: 'New Coaching Session Booked',
            html: `
              <h2>New Session Booking!</h2>
              <p>Hi ${session.coach?.display_name},</p>
              <p>You have a new confirmed coaching session.</p>
              <p><strong>Student:</strong> ${session.sailor?.full_name || 'Sailor'}</p>
              <p><strong>Date:</strong> ${new Date(session.scheduled_at).toLocaleString()}</p>
              <p><strong>Amount:</strong> $${((session.coach_payout || 0) / 100).toFixed(2)}</p>
            `,
          },
        });
      }
    }
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
  }
}

