#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const expectedSkipIds =
  process.env.EXPECTED_SKIP_IDS ??
  (process.env.INTEGRATION_BASE_URL
    ? 'db-assertions-availability'
    : 'db-assertions-availability,api-smoke-availability');

const steps = [
  { script: 'typecheck', env: {} },
  { script: 'validate:imports:tracked', env: {} },
  { script: 'validate:ai-domain-gates', env: {} },
  { script: 'test:jest:key', env: {} },
  { script: 'report:migration-object-collision-audit', env: {} },
  {
    script: 'validate:integration:strict',
    env: { EXPECTED_SKIP_IDS: expectedSkipIds },
  },
];

const startedAt = Date.now();
let completed = 0;

for (const step of steps) {
  const result = spawnSync('npm', ['run', step.script], {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, ...(step.env ?? {}) },
  });

  if (result.status !== 0) {
    const elapsedMs = Date.now() - startedAt;
    const elapsedSec = (elapsedMs / 1000).toFixed(1);
    console.log(
      `\n[pre-ship] FAIL step="${step.script}" index=${completed + 1}/${steps.length} exit_code=${result.status ?? 1} elapsed_s=${elapsedSec}`
    );
    process.exit(result.status ?? 1);
  }

  completed += 1;
}

const elapsedMs = Date.now() - startedAt;
const elapsedSec = (elapsedMs / 1000).toFixed(1);
console.log(`\n[pre-ship] PASS steps=${completed}/${steps.length} elapsed_s=${elapsedSec}`);
