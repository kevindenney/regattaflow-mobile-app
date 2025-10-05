/**
 * Create smaller batches of 50 marinas for Supabase SQL Editor
 * SQL Editor has query size limits, so we need very small batches
 */

import * as fs from 'fs';
import * as path from 'path';

const sqlPath = path.join(process.cwd(), 'data', 'osm-import-5000.sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');

// Split into complete INSERT statements
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

// Create batches of 50 marinas each
const BATCH_SIZE = 50;
const totalBatches = Math.ceil(statements.length / BATCH_SIZE);

for (let i = 0; i < totalBatches; i++) {
  const start = i * BATCH_SIZE;
  const end = Math.min(start + BATCH_SIZE, statements.length);
  const batch = statements.slice(start, end);

  const batchPath = path.join(process.cwd(), 'data', 'batches', `batch-${String(i + 1).padStart(3, '0')}.sql`);

  // Create batches directory if it doesn't exist
  const batchDir = path.join(process.cwd(), 'data', 'batches');
  if (!fs.existsSync(batchDir)) {
    fs.mkdirSync(batchDir, { recursive: true });
  }

  fs.writeFileSync(batchPath, batch.join('\n\n'), 'utf-8');

  if ((i + 1) % 10 === 0) {
    console.log(`Created batch ${i + 1}/${totalBatches}`);
  }
}

console.log(`\n✅ Created ${totalBatches} batches of ${BATCH_SIZE} marinas each`);
console.log(`📁 Location: data/batches/`);
console.log(`\nTo import all batches programmatically, run:`);
console.log(`npm run import:marinas:small`);
