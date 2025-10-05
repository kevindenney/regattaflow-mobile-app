/**
 * Bulk Import OSM Marinas to Supabase
 * Reads the generated SQL file and executes it directly via Supabase MCP
 */

import * as fs from 'fs';
import * as path from 'path';

const sqlPath = path.join(process.cwd(), 'data', 'osm-import-5000.sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');

// Split into complete INSERT statements (INSERT...ON CONFLICT)
const lines = sql.split('\n');
const statements: string[] = [];
let currentStatement = '';

for (const line of lines) {
  if (line.trim().startsWith('INSERT')) {
    if (currentStatement) {
      statements.push(currentStatement);
    }
    currentStatement = line;
  } else if (currentStatement) {
    currentStatement += '\n' + line;
  }
}
if (currentStatement) {
  statements.push(currentStatement);
}

console.log(`Found ${statements.length} INSERT statements`);
console.log('\nTo import via Supabase Dashboard:');
console.log('1. Open: https://supabase.com/dashboard/project/[your-project]/sql');
console.log('2. Copy the contents of data/osm-import-5000.sql');
console.log('3. Paste into SQL editor');
console.log('4. Click "Run"');
console.log('\nThis will import all 5,000 marinas at once.');
console.log('\nAlternatively, import in batches of 500 for better reliability:');

// Create smaller batch files
const BATCH_SIZE = 500;
const totalBatches = Math.ceil(statements.length / BATCH_SIZE);

for (let i = 0; i < totalBatches; i++) {
  const start = i * BATCH_SIZE;
  const end = Math.min(start + BATCH_SIZE, statements.length);
  const batch = statements.slice(start, end);

  const batchPath = path.join(process.cwd(), 'data', `osm-batch-${i + 1}.sql`);
  fs.writeFileSync(batchPath, batch.join('\n'), 'utf-8');

  console.log(`\nBatch ${i + 1}/${totalBatches}: ${batch.length} marinas → ${batchPath}`);
}

console.log(`\n✅ Created ${totalBatches} batch files`);
console.log('\nImport each batch separately via Supabase SQL editor for best results.');
