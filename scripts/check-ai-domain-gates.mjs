#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const aiDir = path.join(repoRoot, 'api', 'ai');

async function walkTsFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkTsFiles(full)));
      continue;
    }
    if (entry.isFile() && full.endsWith('.ts')) {
      files.push(full);
    }
  }

  return files;
}

function toRepoPath(absPath) {
  return path.relative(repoRoot, absPath).split(path.sep).join('/');
}

function isActiveAiRoute(repoPath) {
  if (!repoPath.startsWith('api/ai/')) return false;
  if (repoPath.includes('/__tests__/')) return false;
  if (repoPath.includes('/cron.disabled/')) return false;
  return true;
}

const requiredMarkers = [
  'withAuth(',
  'requireClub: true',
  'resolveWorkspaceDomainForAuth',
  "code: 'DOMAIN_GATED'",
];

const files = (await walkTsFiles(aiDir))
  .map(toRepoPath)
  .filter(isActiveAiRoute)
  .sort((a, b) => a.localeCompare(b));

const failures = [];

for (const file of files) {
  const source = await fs.readFile(path.join(repoRoot, file), 'utf8');
  const missing = requiredMarkers.filter((marker) => !source.includes(marker));
  if (missing.length > 0) {
    failures.push({ file, missing });
  }
}

if (failures.length === 0) {
  console.log(`[validate:ai-domain-gates] PASS files=${files.length}`);
  process.exit(0);
}

console.error(`[validate:ai-domain-gates] FAIL files=${files.length} failed=${failures.length}`);
for (const failure of failures) {
  console.error(`- ${failure.file}`);
  for (const marker of failure.missing) {
    console.error(`  missing: ${marker}`);
  }
}
process.exit(1);
