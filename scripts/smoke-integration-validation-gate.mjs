#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function buildReport(rows) {
  return [
    '# Integration Validation Report',
    '',
    '## Checks',
    '| Check | Category | Status | Details | Reference |',
    '|---|---|---|---|---|',
    ...rows.map((row) => `| ${row.checkId} | smoke | ${row.status} | deterministic | n/a |`),
    '',
  ].join('\n');
}

function runGate(reportPath, expectedSkipIds = '') {
  const scriptPath = path.resolve(process.cwd(), 'scripts/check-integration-validation-gate.mjs');
  return spawnSync('node', [scriptPath, '--report', reportPath], {
    encoding: 'utf8',
    env: { ...process.env, EXPECTED_SKIP_IDS: expectedSkipIds },
  });
}

async function main() {
  const startedAt = Date.now();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rf-ci-gate-smoke-'));

  const passReportPath = path.join(tempDir, 'integration-pass.md');
  const failReportPath = path.join(tempDir, 'integration-fail.md');
  const jsonOverallFailReportPath = path.join(tempDir, 'integration-json-overall-fail.md');
  const jsonOverallFailReportJsonPath = path.join(tempDir, 'integration-json-overall-fail.json');

  await fs.writeFile(
    passReportPath,
    buildReport([
      { checkId: 'api-smoke', status: 'PASS' },
      { checkId: 'db-assertions-availability', status: 'SKIP' },
    ]),
    'utf8'
  );
  await fs.writeFile(
    failReportPath,
    buildReport([
      { checkId: 'api-smoke', status: 'PASS' },
      { checkId: 'domain-gating', status: 'FAIL' },
    ]),
    'utf8'
  );
  await fs.writeFile(
    jsonOverallFailReportPath,
    buildReport([{ checkId: 'api-smoke', status: 'PASS' }]),
    'utf8'
  );
  await fs.writeFile(
    jsonOverallFailReportJsonPath,
    JSON.stringify(
      {
        overall: 'FAIL',
        results: [{ id: 'api-smoke', status: 'PASS' }],
      },
      null,
      2
    ),
    'utf8'
  );

  const passResult = runGate(passReportPath, 'db-assertions-availability');
  if (passResult.status !== 0) {
    process.stderr.write(passResult.stderr || passResult.stdout || 'Gate pass smoke failed unexpectedly.\n');
    process.exit(passResult.status ?? 1);
  }

  const failResult = runGate(failReportPath);
  if (failResult.status !== 1) {
    process.stderr.write('Gate fail smoke did not block as expected.\n');
    process.exit(1);
  }

  const jsonOverallFailResult = runGate(jsonOverallFailReportPath);
  if (jsonOverallFailResult.status !== 1) {
    process.stderr.write('Gate JSON overall fail smoke did not block as expected.\n');
    process.exit(1);
  }

  const elapsedMs = Date.now() - startedAt;
  console.log(`[gate-smoke] PASS elapsed_ms=${elapsedMs}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[gate-smoke] FAIL ${message}`);
  process.exit(1);
});
