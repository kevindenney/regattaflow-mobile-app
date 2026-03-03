#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR
  ? path.resolve(process.env.MIGRATIONS_DIR)
  : path.resolve(REPO_ROOT, 'supabase', 'migrations');

const REQUIRED_HEADER_MARKERS = ['-- Canonical ownership:', '-- Override intent:'];

async function run() {
  const entries = await fs.readdir(MIGRATIONS_DIR);
  const migrationFiles = entries
    .filter((name) => /^20260302\d+_.*\.sql$/.test(name))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('[lint-20260302] No 20260302 migrations found. PASS');
    return;
  }

  const failures = [];

  for (const fileName of migrationFiles) {
    const fullPath = path.resolve(MIGRATIONS_DIR, fileName);
    const source = await fs.readFile(fullPath, 'utf8');
    const header = source.split('\n').slice(0, 40).join('\n');

    for (const marker of REQUIRED_HEADER_MARKERS) {
      if (!header.includes(marker)) {
        failures.push(`${fileName}: missing header marker "${marker}"`);
      }
    }

    const hasCanonicalBullet = /--\s+-\s+/.test(header);
    if (!hasCanonicalBullet) {
      failures.push(`${fileName}: header must include at least one bullet under canonical/override sections.`);
    }
  }

  if (failures.length > 0) {
    console.error('[lint-20260302] FAIL');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`[lint-20260302] PASS (${migrationFiles.length} files checked)`);
}

run().catch((error) => {
  console.error('[lint-20260302] fatal:', error);
  process.exitCode = 1;
});
