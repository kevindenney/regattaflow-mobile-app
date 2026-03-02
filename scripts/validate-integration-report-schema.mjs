#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_REPORT_PATH = path.resolve(REPO_ROOT, 'docs', 'integration-validation-latest.md');

const REQUIRED_LINES = [
  '# Integration Validation Latest',
  '- Generated:',
  '- Overall:',
  '- Checks:',
  '## Scope',
  '## Required Signature Matrix',
  '## Results',
  '| Check | Category | Status | Details | Reference |',
  '|---|---|---|---|---|',
  '## Environment',
  '## Notes',
];

function parseArgs(argv) {
  const args = {
    reportPath: DEFAULT_REPORT_PATH,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--report') {
      const value = argv[i + 1] ?? '';
      if (!value) {
        throw new Error('Missing value for --report');
      }
      args.reportPath = path.resolve(process.cwd(), value);
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

function countResultRows(lines) {
  let inResultsTable = false;
  let count = 0;

  for (const line of lines) {
    if (line.includes('| Check | Category | Status | Details | Reference |')) {
      inResultsTable = true;
      continue;
    }
    if (!inResultsTable) continue;

    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) break;
    if (trimmed === '|---|---|---|---|---|') continue;

    const parts = trimmed.split('|').map((part) => part.trim());
    if (parts.length < 7) continue;
    const checkId = parts[1];
    const status = parts[3];
    if (!checkId || !status) continue;
    count += 1;
  }

  return count;
}

async function run() {
  const args = parseArgs(process.argv);
  const reportRaw = await fs.readFile(args.reportPath, 'utf8');
  const lines = reportRaw.split('\n');

  const missing = REQUIRED_LINES.filter((required) => {
    if (required.endsWith(':')) {
      return !lines.some((line) => line.startsWith(required));
    }
    return !lines.includes(required);
  });

  const rowCount = countResultRows(lines);
  if (rowCount === 0) {
    missing.push('At least one results table row under "## Results"');
  }

  const reportRel = path.relative(REPO_ROOT, args.reportPath) || args.reportPath;

  if (missing.length > 0) {
    console.error(`Integration report schema: BLOCK (${reportRel})`);
    console.error('Missing required report schema items:');
    for (const item of missing) {
      console.error(`- ${item}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Integration report schema: PASS (${reportRel})`);
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Integration report schema validation failed: ${message}`);
  process.exitCode = 1;
});
