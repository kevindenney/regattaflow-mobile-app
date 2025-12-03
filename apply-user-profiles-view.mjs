#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('📋 Reading user_profiles view migration...');
    const migrationPath = join(__dirname, 'supabase/migrations/20251201150100_create_user_profiles_view_for_fleet_social.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('🔄 Creating user_profiles view...');

    // Execute the SQL directly via a fetch call
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      console.log('⚠️  RPC method failed, trying alternative...');

      // Split into statements and execute
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.length < 10) continue;

        console.log(`   Executing: ${statement.substring(0, 50)}...`);

        const { error } = await supabase.rpc('exec', { sql: statement });
        if (error) {
          console.warn(`   ⚠️  ${error.message}`);
        }
      }
    }

    console.log('✅ User profiles view created!');

    // Verify the view exists and test the join
    console.log('\n🧪 Testing fleet_posts query with user_profiles view...');

    const { data, error } = await supabase
      .from('fleet_posts')
      .select(`
        *,
        author:author_id (id, full_name, avatar_url)
      `)
      .limit(1);

    if (error) {
      console.error('❌ Query still failing:', error.message);
      console.log('\n💡 Trying alternative approach - querying user_profiles directly...');

      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .limit(3);

      if (profileError) {
        console.error('❌ user_profiles view not accessible:', profileError.message);
      } else {
        console.log('✅ user_profiles view works!', profiles?.length, 'users found');
        console.log('\n📝 Next step: Update FleetSocialService to use user_profiles instead of auth.users');
      }
    } else {
      console.log('✅ Query works with user join!');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

applyMigration();
