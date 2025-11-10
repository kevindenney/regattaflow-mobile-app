#!/usr/bin/env node

/**
 * Verify clubs exist in database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyClubs() {
  console.log('🔍 Checking clubs in database...\n');

  const { data: clubs, error } = await supabase
    .from('clubs')
    .select('id, name, short_name')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching clubs:', error);
    return;
  }

  console.log(`Found ${clubs.length} clubs:\n`);
  clubs.forEach((club, index) => {
    console.log(`${index + 1}. ${club.short_name || '?'} - ${club.name}`);
    console.log(`   ID: ${club.id}\n`);
  });
}

verifyClubs();
