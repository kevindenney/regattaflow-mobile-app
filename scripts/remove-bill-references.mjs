#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeBillReferences() {
  console.log('Fetching race_analysis records with Bill references...');

  // Get all records with ai_coaching_feedback
  const { data: analyses, error: fetchError } = await supabase
    .from('race_analysis')
    .select('id, ai_coaching_feedback, framework_scores')
    .not('ai_coaching_feedback', 'is', null);

  if (fetchError) {
    console.error('Error fetching records:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${analyses.length} records with coaching feedback`);

  let updatedCount = 0;

  for (const analysis of analyses) {
    let feedback = analysis.ai_coaching_feedback;
    let needsUpdate = false;

    if (Array.isArray(feedback)) {
      feedback = feedback.map(item => {
        const updated = { ...item };

        // Replace bill_framework with playbook_framework
        if (updated.bill_framework) {
          updated.playbook_framework = updated.bill_framework;
          delete updated.bill_framework;
          needsUpdate = true;
        }

        // Replace bill_recommendation with playbook_recommendation
        if (updated.bill_recommendation) {
          // Remove "Bill says:" and replace with "Kevin teaches:"
          updated.playbook_recommendation = updated.bill_recommendation
            .replace(/Bill says:/g, 'Kevin teaches:')
            .replace(/Bill teaches:/g, 'Kevin teaches:')
            .replace(/Bill's/g, "Kevin's");
          delete updated.bill_recommendation;
          needsUpdate = true;
        }

        // Update demo_reference to remove "bill-"
        if (updated.demo_reference && updated.demo_reference.includes('bill-demo')) {
          updated.demo_reference = updated.demo_reference.replace('bill-demo', 'demo');
          needsUpdate = true;
        }

        return updated;
      });
    }

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('race_analysis')
        .update({ ai_coaching_feedback: feedback })
        .eq('id', analysis.id);

      if (updateError) {
        console.error(`Error updating ${analysis.id}:`, updateError);
      } else {
        updatedCount++;
        console.log(`✅ Updated record ${analysis.id}`);
      }
    }
  }

  console.log(`\n✅ Complete! Updated ${updatedCount} records`);
}

removeBillReferences();
