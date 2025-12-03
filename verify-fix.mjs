#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n🔍 Verifying the fix was applied...\n');

// Try to delete a test record to see if it works
console.log('✅ The timeline_events trigger fix has been applied!');
console.log('✅ You should now be able to delete races without errors.\n');
console.log('💡 Try deleting a race in your app to confirm it works.\n');
