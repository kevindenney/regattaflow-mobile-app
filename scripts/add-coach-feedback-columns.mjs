#!/usr/bin/env node

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

async function addCoachFeedbackColumns() {
  console.log('🔧 Adding coach feedback columns to sailor_race_preparation...\n');

  try {
    // Check if columns already exist
    const { data: columns, error: checkError } = await supabase
      .from('sailor_race_preparation')
      .select('coach_feedback, coach_reviewed_at')
      .limit(1);

    if (!checkError) {
      console.log('✅ Columns already exist!');
      return;
    }

    // Columns don't exist, we need to add them
    // Note: This would normally be done via a migration, but we can't modify schema via service role
    console.log('⚠️  Columns need to be added via Supabase dashboard or migration');
    console.log('   Run: npx supabase db push');
    console.log('   Or manually add these columns:');
    console.log('   - coach_feedback (text)');
    console.log('   - coach_reviewed_at (timestamptz)');
  } catch (error) {
    console.error('Error:', error);
  }
}

addCoachFeedbackColumns();
