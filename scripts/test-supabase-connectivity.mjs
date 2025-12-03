#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const requiredEnv = ['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(
    `Missing required environment variables: ${missing.join(', ')}. Ensure .env is loaded.`
  );
  process.exit(1);
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  global: { headers: { 'x-cli-check': 'supabase-connectivity-test' } },
});

const testTable = 'ai_activity_logs';

async function testRead() {
  const { data, error } = await supabase
    .from(testTable)
    .select('id, created_at')
    .limit(1);

  if (error) {
    throw new Error(`Read failed: ${error.message}`);
  }

  return data?.[0] ?? null;
}

async function testWrite() {
  const testRecord = {
    skill: 'connectivity-test',
    status: 'success',
    tokens_in: 0,
    tokens_out: 0,
    duration_ms: 0,
    request_payload: {
      source: 'scripts/test-supabase-connectivity.mjs',
      id: randomUUID(),
    },
    response_payload: {
      note: 'row inserted for connectivity verification and deleted immediately',
    },
  };

  const insertResult = await supabase
    .from(testTable)
    .insert(testRecord)
    .select('id, created_at')
    .single();

  if (insertResult.error) {
    throw new Error(`Write failed: ${insertResult.error.message}`);
  }

  const insertedRow = insertResult.data;
  const cleanup = await supabase.from(testTable).delete().eq('id', insertedRow.id);
  if (cleanup.error) {
    throw new Error(
      `Cleanup failed for row ${insertedRow.id}: ${cleanup.error.message}`
    );
  }

  return insertedRow;
}

async function main() {
  console.log('🔍 Supabase connectivity test starting…');
  console.log(`→ Project: ${supabaseUrl}`);

  const readStart = Date.now();
  const readSample = await testRead();
  console.log(
    `✅ Read ok (${Date.now() - readStart}ms)` +
      (readSample ? ` • sample row ${readSample.id}` : ' • table empty')
  );

  const writeStart = Date.now();
  const insertedRow = await testWrite();
  console.log(
    `✅ Write/Delete ok (${Date.now() - writeStart}ms) • row ${insertedRow.id}`
  );

  console.log('🎉 Supabase read/write connectivity verified.');
}

main().catch((error) => {
  console.error('❌ Connectivity test failed:', error.message);
  process.exit(1);
});
