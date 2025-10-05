/**
 * Import OSM marinas by creating migrations for each batch
 * This uses Supabase's apply_migration which handles larger queries better
 */

import * as fs from 'fs';
import * as path from 'path';

const batchesDir = path.join(process.cwd(), 'data', 'batches');
const TOTAL_BATCHES = 100;

async function createMigrationsFromBatches() {
  console.log('📦 Converting batches to migration SQL...\n');

  for (let i = 1; i <= TOTAL_BATCHES; i++) {
    const batchNum = String(i).padStart(3, '0');
    const batchPath = path.join(batchesDir, `batch-${batchNum}.sql`);

    if (!fs.existsSync(batchPath)) {
      console.log(`❌ Batch ${batchNum} not found`);
      continue;
    }

    const sql = fs.readFileSync(batchPath, 'utf-8');

    // Create migration file
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      `20251002_osm_batch_${batchNum}.sql`
    );

    fs.writeFileSync(migrationPath, sql, 'utf-8');

    if (i % 10 === 0) {
      console.log(`✅ Created migration for batches 1-${i}`);
    }
  }

  console.log('\n✅ All migration files created!');
  console.log('\nNext step: Run migrations via Supabase CLI:');
  console.log('npx supabase db push');
}

// Alternative: Print instructions for manual Supabase MCP import
function printMCPInstructions() {
  console.log('\n📋 ALTERNATIVE: Use Supabase MCP to import batches');
  console.log('='.repeat(60));
  console.log('\nRun this in Claude Code:');
  console.log('\nFor each batch (001-100), run:');
  console.log('```typescript');
  console.log('const sql = fs.readFileSync("data/batches/batch-001.sql", "utf-8");');
  console.log('await mcp__supabase__execute_sql({ query: sql });');
  console.log('```');
  console.log('\nThis will import 50 marinas per batch.');
}

console.log('🚀 OSM Marina Import - Migration Generator');
console.log('='.repeat(60));
console.log('\nThis script will:');
console.log('1. Convert batch SQL files to Supabase migrations');
console.log('2. Allow you to run: npx supabase db push');
console.log('\nProceed? (This creates 100 migration files)');

// Just create one master migration instead
const allBatches: string[] = [];

for (let i = 1; i <= TOTAL_BATCHES; i++) {
  const batchNum = String(i).padStart(3, '0');
  const batchPath = path.join(batchesDir, `batch-${batchNum}.sql`);

  if (fs.existsSync(batchPath)) {
    const sql = fs.readFileSync(batchPath, 'utf-8');
    allBatches.push(`-- Batch ${batchNum} (50 marinas)\n${sql}`);
  }
}

const masterSQL = allBatches.join('\n\n');
const masterPath = path.join(process.cwd(), 'data', 'master-import-all-5000.sql');
fs.writeFileSync(masterPath, masterSQL, 'utf-8');

console.log('\n✅ Created master SQL file with all 5,000 marinas');
console.log(`📁 Location: ${masterPath}`);
console.log('\n💡 To import via command line:');
console.log('psql "YOUR_CONNECTION_STRING" -f data/master-import-all-5000.sql');

printMCPInstructions();
