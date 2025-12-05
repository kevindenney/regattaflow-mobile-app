#!/usr/bin/env node

/**
 * Setup Stripe Products and Prices for Learning Courses
 * 
 * This script:
 * 1. Creates Stripe products for each learning course
 * 2. Creates Stripe prices for each product
 * 3. Updates the learning_courses table with Stripe IDs
 * 
 * Usage:
 *   node scripts/setup-stripe-course-products.mjs
 * 
 * Prerequisites:
 *   - STRIPE_SECRET_KEY environment variable
 *   - DATABASE_URL environment variable (or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY is required');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// Initialize Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products for learning courses...\n');

  try {
    // Fetch all learning courses that need Stripe products
    const { data: courses, error } = await supabase
      .from('learning_courses')
      .select('id, title, description, price_cents, stripe_product_id, stripe_price_id')
      .not('price_cents', 'is', null)
      .gt('price_cents', 0);

    if (error) {
      console.error('❌ Failed to fetch courses:', error);
      process.exit(1);
    }

    if (!courses || courses.length === 0) {
      console.log('ℹ️  No paid courses found to set up.');
      return;
    }

    console.log(`📚 Found ${courses.length} paid course(s) to set up:\n`);

    for (const course of courses) {
      console.log(`📖 Processing: ${course.title}`);
      console.log(`   Price: $${(course.price_cents / 100).toFixed(2)}`);

      let productId = course.stripe_product_id;
      let priceId = course.stripe_price_id;

      // Create Stripe product if needed
      if (!productId) {
        console.log('   Creating Stripe product...');
        const product = await stripe.products.create({
          name: course.title,
          description: course.description || `Access to ${course.title}`,
          metadata: {
            course_id: course.id,
            source: 'regattaflow',
            type: 'learning_course',
          },
        });
        productId = product.id;
        console.log(`   ✅ Created product: ${productId}`);
      } else {
        console.log(`   ✓ Product exists: ${productId}`);
      }

      // Create Stripe price if needed
      if (!priceId) {
        console.log('   Creating Stripe price...');
        const price = await stripe.prices.create({
          product: productId,
          unit_amount: course.price_cents,
          currency: 'usd',
          metadata: {
            course_id: course.id,
            source: 'regattaflow',
          },
        });
        priceId = price.id;
        console.log(`   ✅ Created price: ${priceId}`);
      } else {
        console.log(`   ✓ Price exists: ${priceId}`);
      }

      // Update course with Stripe IDs
      if (productId !== course.stripe_product_id || priceId !== course.stripe_price_id) {
        const { error: updateError } = await supabase
          .from('learning_courses')
          .update({
            stripe_product_id: productId,
            stripe_price_id: priceId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', course.id);

        if (updateError) {
          console.error(`   ❌ Failed to update course: ${updateError.message}`);
        } else {
          console.log('   ✅ Updated course with Stripe IDs');
        }
      }

      console.log('');
    }

    console.log('✅ Stripe product setup complete!\n');

    // Summary
    console.log('📋 Summary:');
    const { data: updatedCourses } = await supabase
      .from('learning_courses')
      .select('title, price_cents, stripe_product_id, stripe_price_id')
      .not('price_cents', 'is', null)
      .gt('price_cents', 0);

    if (updatedCourses) {
      for (const c of updatedCourses) {
        const status = c.stripe_product_id && c.stripe_price_id ? '✅' : '❌';
        console.log(`   ${status} ${c.title} - $${(c.price_cents / 100).toFixed(2)}`);
        if (c.stripe_product_id) console.log(`      Product: ${c.stripe_product_id}`);
        if (c.stripe_price_id) console.log(`      Price: ${c.stripe_price_id}`);
      }
    }

  } catch (err) {
    console.error('❌ Error setting up Stripe products:', err);
    process.exit(1);
  }
}

// List existing products (helpful for debugging)
async function listExistingProducts() {
  console.log('\n📦 Existing Stripe products with "regattaflow" metadata:\n');
  
  const products = await stripe.products.list({
    limit: 100,
    active: true,
  });

  const regattaflowProducts = products.data.filter(
    p => p.metadata?.source === 'regattaflow' && p.metadata?.type === 'learning_course'
  );

  if (regattaflowProducts.length === 0) {
    console.log('   No existing RegattaFlow course products found.');
  } else {
    for (const product of regattaflowProducts) {
      console.log(`   ${product.name} (${product.id})`);
      
      // Get prices for this product
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
      });
      
      for (const price of prices.data) {
        console.log(`      Price: ${price.id} - $${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`);
      }
    }
  }
  console.log('');
}

// Main execution
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   Stripe Course Products Setup');
  console.log('═══════════════════════════════════════════════════════\n');
  
  await listExistingProducts();
  await setupStripeProducts();
}

main().catch(console.error);

