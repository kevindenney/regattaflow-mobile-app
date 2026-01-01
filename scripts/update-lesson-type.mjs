/**
 * Script to update the "What is Sailboat Racing?" lesson to interactive type
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateLesson() {
  console.log('Updating "What is Sailboat Racing?" lesson to interactive type...');

  const { data, error } = await supabase
    .from('learning_lessons')
    .update({
      lesson_type: 'interactive',
      interactive_component: 'WhatIsSailboatRacingInteractive',
      video_url: null
    })
    .eq('id', 'deae333e-7dcc-424f-857d-33f8b3df5d06')
    .select();

  if (error) {
    console.error('Error updating lesson:', error);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log('✅ Successfully updated lesson:');
    console.log('  Title:', data[0].title);
    console.log('  Type:', data[0].lesson_type);
    console.log('  Component:', data[0].interactive_component);
  } else {
    console.log('⚠️ No lesson found with that ID');
  }
}

updateLesson();
