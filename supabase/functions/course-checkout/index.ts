/**
 * Course Checkout Edge Function
 * Creates a Stripe checkout session for learning course purchases
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CourseCheckoutRequest {
  courseId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { courseId, userId, successUrl, cancelUrl }: CourseCheckoutRequest = await req.json();

    if (!courseId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: courseId and userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get course info
    const { data: course, error: courseError } = await supabase
      .from('learning_courses')
      .select('id, title, description, price_cents, stripe_price_id, stripe_product_id, is_published')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return new Response(
        JSON.stringify({ error: 'Course not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!course.is_published) {
      return new Response(
        JSON.stringify({ error: 'Course is not available for purchase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has access
    const { data: existingEnrollment } = await supabase
      .from('learning_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      return new Response(
        JSON.stringify({ error: 'You already have access to this course' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name || undefined,
        metadata: {
          user_id: userId,
          source: 'regattaflow',
        },
      });
      customerId = customer.id;

      // Save customer ID to user
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Determine price - use existing Stripe price or create one-time price
    let priceData: Stripe.Checkout.SessionCreateParams.LineItem;

    if (course.stripe_price_id) {
      // Use existing Stripe price
      priceData = {
        price: course.stripe_price_id,
        quantity: 1,
      };
    } else if (course.price_cents && course.price_cents > 0) {
      // Create one-time price for this checkout
      priceData = {
        price_data: {
          currency: 'usd',
          product_data: {
            name: course.title,
            description: course.description || `Access to ${course.title}`,
            metadata: {
              course_id: courseId,
            },
          },
          unit_amount: course.price_cents,
        },
        quantity: 1,
      };
    } else {
      // Free course - no payment needed, just enroll
      const { error: enrollError } = await supabase
        .from('learning_enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          access_type: 'purchase',
          amount_paid_cents: 0,
          enrolled_at: new Date().toISOString(),
        });

      if (enrollError) {
        console.error('Failed to enroll in free course:', enrollError);
        return new Response(
          JSON.stringify({ error: 'Failed to enroll in course' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          free: true,
          message: 'Successfully enrolled in free course',
          redirectUrl: successUrl,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create checkout session for paid course
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [priceData],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&course_id=${courseId}`,
      cancel_url: `${cancelUrl}?course_id=${courseId}`,
      payment_intent_data: {
        metadata: {
          type: 'course_purchase',
          course_id: courseId,
          user_id: userId,
          course_title: course.title,
        },
      },
      metadata: {
        type: 'course_purchase',
        course_id: courseId,
        user_id: userId,
        course_title: course.title,
      },
      allow_promotion_codes: true,
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });

    return new Response(
      JSON.stringify({ 
        url: session.url, 
        sessionId: session.id,
        amount: course.price_cents,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Course checkout error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

