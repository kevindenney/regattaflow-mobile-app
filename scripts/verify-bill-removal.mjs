#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyRemoval() {
  console.log('Checking for any remaining Bill references...\n');

  const { data: analyses, error } = await supabase
    .from('race_analysis')
    .select('id, ai_coaching_feedback')
    .not('ai_coaching_feedback', 'is', null);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  let foundBill = false;

  for (const analysis of analyses) {
    const feedbackStr = JSON.stringify(analysis.ai_coaching_feedback);

    if (feedbackStr.includes('bill') || feedbackStr.includes('Bill')) {
      console.log(`❌ Found Bill reference in record ${analysis.id}`);
      console.log(JSON.stringify(analysis.ai_coaching_feedback, null, 2));
      foundBill = true;
    }
  }

  if (!foundBill) {
    console.log('✅ No Bill references found in database!');
    console.log('\nSample of updated data:');
    if (analyses.length > 0 && analyses[0].ai_coaching_feedback) {
      console.log(JSON.stringify(analyses[0].ai_coaching_feedback[0], null, 2));
    }
  }
}

verifyRemoval();
