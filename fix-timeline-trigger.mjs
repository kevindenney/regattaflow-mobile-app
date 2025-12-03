#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Make sure EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixTimelineTrigger() {
  console.log('\n🔧 Fixing timeline_events trigger issue...\n');

  try {
    // Drop the trigger
    console.log('1️⃣  Dropping trigger: refresh_timeline_events_after_regattas');
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TRIGGER IF EXISTS refresh_timeline_events_after_regattas ON regattas'
    });

    if (triggerError) {
      // Try alternative method
      console.log('   Trying alternative method...');
      const { error: altError } = await supabase
        .from('_sql')
        .select('*')
        .limit(0);

      // Use direct SQL execution
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: 'DROP TRIGGER IF EXISTS refresh_timeline_events_after_regattas ON regattas'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to drop trigger: ${response.statusText}`);
      }
    }
    console.log('   ✅ Trigger dropped successfully');

    // Drop the function
    console.log('2️⃣  Dropping function: trigger_refresh_timeline_events');
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: 'DROP FUNCTION IF EXISTS trigger_refresh_timeline_events()'
    });

    if (functionError) {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: 'DROP FUNCTION IF EXISTS trigger_refresh_timeline_events()'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to drop function: ${response.statusText}`);
      }
    }
    console.log('   ✅ Function dropped successfully');

    console.log('\n✅ Fix complete! You can now delete races without errors.\n');

  } catch (error) {
    console.error('\n❌ Error fixing trigger:', error.message);
    console.error('\n📋 Please run these SQL commands manually in Supabase SQL Editor:');
    console.error('\nDROP TRIGGER IF EXISTS refresh_timeline_events_after_regattas ON regattas;');
    console.error('DROP FUNCTION IF EXISTS trigger_refresh_timeline_events();');
    console.error('');
    process.exit(1);
  }
}

fixTimelineTrigger();
