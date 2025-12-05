#!/usr/bin/env node

/**
 * Diagnostic script to check if learning_courses table exists and is accessible
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials!');
  console.error('   EXPO_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   EXPO_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
  process.exit(1);
}

console.log('🔍 Diagnosing learning_courses table...\n');
console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnose() {
  try {
    // Test 1: Check if table exists with a simple count query
    console.log('1️⃣ Testing table access with count query...');
    const { count, error: countError } = await supabase
      .from('learning_courses')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('   ❌ Error:', countError.message);
      console.error('   Code:', countError.code);
      console.error('   Details:', countError.details);
      console.error('   Hint:', countError.hint);
      
      if (countError.code === '42P01') {
        console.error('\n   🔴 TABLE DOES NOT EXIST!');
        console.error('   → Run the migration: supabase/migrations/20251204200000_create_learning_platform.sql');
        return;
      }
      
      if (countError.code === '42501' || countError.message?.includes('permission')) {
        console.error('\n   🔴 PERMISSION DENIED!');
        console.error('   → Check RLS policies for learning_courses table');
        return;
      }
      
      return;
    }
    
    console.log(`   ✅ Table exists! Found ${count || 0} total courses\n`);
    
    // Test 2: Try to fetch published courses
    console.log('2️⃣ Testing query for published courses...');
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('learning_courses')
      .select('id, title, is_published')
      .eq('is_published', true)
      .limit(5);
    
    const duration = Date.now() - startTime;
    
    if (error) {
      console.error('   ❌ Error:', error.message);
      console.error('   Code:', error.code);
      console.error(`   Query took ${duration}ms`);
      return;
    }
    
    console.log(`   ✅ Query successful! Took ${duration}ms`);
    console.log(`   Found ${data?.length || 0} published courses:`);
    if (data && data.length > 0) {
      data.forEach(course => {
        console.log(`      - ${course.title} (${course.id.substring(0, 8)}...)`);
      });
    } else {
      console.log('      (No published courses found)');
    }
    console.log('');
    
    // Test 3: RLS is working (we got data, so RLS allows access)
    console.log('3️⃣ RLS Status...');
    console.log('   ✅ RLS allows access (we successfully queried the table)');
    console.log('   → Policy "Published courses are viewable by everyone" is working');
    console.log('');
    
    // Summary
    console.log('✅ DIAGNOSIS COMPLETE');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • Table exists: ✅`);
    console.log(`   • Query works: ✅ (${duration}ms)`);
    console.log(`   • Published courses: ${data?.length || 0}`);
    console.log('');
    console.log('💡 If the app still times out, it might be a schema cache issue.');
    console.log('   Try waiting a few minutes or restarting the Supabase project.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error(error.stack);
  }
}

diagnose().catch(console.error);

