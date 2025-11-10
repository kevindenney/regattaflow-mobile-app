#!/usr/bin/env node

/**
 * Script to seed mock coach profiles for testing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const mockCoaches = [
  {
    user_id: 'd6c95c89-43e6-4d69-8f2c-58d392c22d16', // coach-test@regattaflow.com
    display_name: 'Sarah Chen',
    bio: 'Olympic-level sailing coach with 15+ years of experience coaching at the highest levels of competitive sailing. Specialized in match racing, fleet racing strategy, and mental performance. Former Laser Radial World Champion and 470 Olympic medalist. Known for data-driven coaching approach and personalized tactical development.',
    experience_years: 15,
    certifications: [
      'World Sailing Level 3 Coach',
      'Olympic Team Coach 2016-2020',
      'US Sailing Level 4',
      'Mental Performance Certified',
      'Tactical Racing Specialist'
    ],
    specializations: ['Match Racing', 'Fleet Racing', 'Olympic Classes', 'Tactical Strategy', 'Mental Performance', 'Start Line Mastery'],
    hourly_rate: 150.00,
    currency: 'USD',
    is_verified: true,
    is_active: true,
    rating: 4.9,
    total_sessions: 247,
    location_name: 'San Francisco',
    location_region: 'North America',
    languages: ['English', 'Mandarin'],
    profile_image_url: 'https://i.pravatar.cc/150?img=5'
  },
  {
    user_id: 'b92a8ffd-6c11-4ebb-b6e8-12b7de58f5eb', // coachkdenney@icloud.com
    display_name: 'James "Jimmy" Wilson',
    bio: 'Youth sailing development coach specializing in Optimist, 420, and 29er classes. 12 years coaching junior sailors from beginner to national championship level. Expert in foundational skills, boat handling, and building racing confidence. Multiple national championship-winning coach. Creates fun, engaging learning environments while maintaining competitive edge.',
    experience_years: 12,
    certifications: [
      'RYA Senior Instructor',
      'World Sailing Youth Coach',
      'US Sailing Level 3',
      'Safeguarding Certified',
      'First Aid at Sea'
    ],
    specializations: ['Youth Development', 'Optimist', '420', '29er', 'Boat Handling', 'Racing Fundamentals'],
    hourly_rate: 95.00,
    currency: 'USD',
    is_verified: true,
    is_active: true,
    rating: 4.8,
    total_sessions: 189,
    location_name: 'Newport',
    location_region: 'North America',
    languages: ['English'],
    profile_image_url: 'https://i.pravatar.cc/150?img=12'
  }
];

async function seedCoaches() {
  console.log('🌱 Seeding mock coach profiles...\n');

  // Delete existing coach profiles for these users
  console.log('Cleaning up existing profiles...');
  const { error: deleteError } = await supabase
    .from('coach_profiles')
    .delete()
    .in('user_id', mockCoaches.map(c => c.user_id));

  if (deleteError) {
    console.error('Error deleting existing profiles:', deleteError);
  }

  // Insert new coach profiles
  for (const coach of mockCoaches) {
    console.log(`\n📝 Creating coach profile: ${coach.display_name}`);

    const { data, error } = await supabase
      .from('coach_profiles')
      .insert(coach)
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating ${coach.display_name}:`, error);
    } else {
      console.log(`✅ Created ${coach.display_name}`);
      console.log(`   ID: ${data.id}`);
      console.log(`   Email: Looking up user ${coach.user_id}`);
      console.log(`   Specializations: ${coach.specializations.join(', ')}`);
      console.log(`   Rating: ${coach.rating} ⭐ (${coach.total_sessions} sessions)`);
    }
  }

  // Create a coaching session relationship with demo sailor
  console.log('\n📚 Creating coaching relationship with demo sailor...');

  // Get demo sailor profile
  const { data: sailorProfile } = await supabase
    .from('sailor_profiles')
    .select('id')
    .eq('user_id', '72865178-17c5-43aa-b93e-b2d0d20cb76b') // 01kdenney@icloud.com
    .single();

  if (sailorProfile) {
    // Get Sarah Chen's coach profile
    const { data: coachProfile } = await supabase
      .from('coach_profiles')
      .select('id')
      .eq('user_id', 'd6c95c89-43e6-4d69-8f2c-58d392c22d16')
      .single();

    if (coachProfile) {
      // Create a past coaching session
      const { error: sessionError } = await supabase
        .from('coaching_sessions')
        .insert({
          coach_id: coachProfile.id,
          sailor_id: sailorProfile.id,
          session_type: 'strategy_review',
          status: 'completed',
          scheduled_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 60,
          location_type: 'virtual',
          notes: 'Reviewed start line strategy and wind shift patterns. Sailor showing good improvement in line bias recognition.'
        });

      if (sessionError) {
        console.error('❌ Error creating coaching session:', sessionError);
      } else {
        console.log('✅ Created coaching session between Sarah Chen and demo sailor');
      }
    }
  }

  console.log('\n✨ Mock coach profiles seeded successfully!\n');
}

seedCoaches().catch(console.error);
