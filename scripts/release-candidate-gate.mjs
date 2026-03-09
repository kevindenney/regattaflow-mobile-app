#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const docsDir = path.resolve(repoRoot, 'docs');
const jsonPath = path.resolve(docsDir, 'release-candidate-latest.json');
const mdPath = path.resolve(docsDir, 'RELEASE_CANDIDATE_ARTIFACTS.md');

const args = new Set(process.argv.slice(2));
const skipSmoke = args.has('--skip-smoke');
const skipApi = args.has('--skip-api');
const skipIntegration = args.has('--skip-integration');

const startedAt = new Date();

function runCommand(id, command, commandArgs, options = {}) {
  const start = Date.now();
  const result = spawnSync(command, commandArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...(options.env || {}) },
  });
  const durationMs = Date.now() - start;
  const stdout = String(result.stdout || '').trim();
  const stderr = String(result.stderr || '').trim();
  const status = result.status === 0 ? 'PASS' : 'FAIL';
  const detail = status === 'PASS'
    ? `${command} ${commandArgs.join(' ')} (${durationMs}ms)`
    : `${command} ${commandArgs.join(' ')} failed (${durationMs}ms)`;

  return {
    id,
    category: options.category || 'validation',
    status,
    command: `${command} ${commandArgs.join(' ')}`,
    durationMs,
    detail,
    stdoutTail: stdout.split('\n').slice(-8),
    stderrTail: stderr.split('\n').slice(-8),
  };
}

function skippedResult(id, command, reason, category = 'validation') {
  return {
    id,
    category,
    status: 'SKIP',
    command,
    durationMs: 0,
    detail: reason,
    stdoutTail: [],
    stderrTail: [],
  };
}

function emitResultLine(result) {
  console.log(`rc_${result.id}|${result.status}|${result.detail}`);
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const results = [];

  const typecheck = runCommand('typecheck', 'npm', ['run', 'typecheck'], { category: 'quality' });
  results.push(typecheck);
  emitResultLine(typecheck);

  const qaCoverage = runCommand('qa_matrix_coverage', 'node', ['scripts/qa-matrix-coverage.mjs'], { category: 'quality' });
  results.push(qaCoverage);
  emitResultLine(qaCoverage);

  if (skipSmoke) {
    const skipped = skippedResult('smoke_multi_org_demo', 'node scripts/smoke-multi-org-demo.mjs', 'Skipped via --skip-smoke', 'smoke');
    results.push(skipped);
    emitResultLine(skipped);
  } else {
    const smoke = runCommand('smoke_multi_org_demo', 'node', ['scripts/smoke-multi-org-demo.mjs'], { category: 'smoke' });
    results.push(smoke);
    emitResultLine(smoke);
  }

  if (skipApi) {
    const skipped = skippedResult('api_smoke_deploy', 'node scripts/run-api-smoke-deploy.mjs', 'Skipped via --skip-api', 'api');
    results.push(skipped);
    emitResultLine(skipped);
  } else {
    const apiSmoke = runCommand('api_smoke_deploy', 'node', ['scripts/run-api-smoke-deploy.mjs'], { category: 'api' });
    results.push(apiSmoke);
    emitResultLine(apiSmoke);
  }

  if (skipIntegration) {
    const skipped = skippedResult('integration_validation', 'node scripts/run-integration-validation.mjs', 'Skipped via --skip-integration', 'integration');
    results.push(skipped);
    emitResultLine(skipped);
  } else {
    const integration = runCommand('integration_validation', 'node', ['scripts/run-integration-validation.mjs'], { category: 'integration' });
    results.push(integration);
    emitResultLine(integration);
  }

  const finishedAt = new Date();
  const failed = results.filter((row) => row.status === 'FAIL');
  const passCount = results.filter((row) => row.status === 'PASS').length;
  const skipCount = results.filter((row) => row.status === 'SKIP').length;
  const overall = failed.length > 0 ? 'FAIL' : 'PASS';

  const artifacts = [
    { path: 'docs/QA_MATRIX.md', note: 'Matrix rows + automation hook IDs' },
    { path: 'docs/MILESTONES.md', note: 'Milestone acceptance/manual log' },
    { path: 'docs/release-candidate-latest.json', note: 'Machine-readable release gate output' },
    { path: 'docs/RELEASE_CANDIDATE_ARTIFACTS.md', note: 'Human-readable artifact index and command outcomes' },
    { path: 'docs/api-smoke-deploy.md', note: 'API smoke details (when API smoke runs)' },
    { path: 'docs/integration-validation-latest.md', note: 'Integration validation report (when integration validation runs)' },
    { path: '/tmp/multi-org-smoke.png', note: 'Browser smoke screenshot artifact (when smoke runs with browser)' },
  ];

  const payload = {
    generatedAt: finishedAt.toISOString(),
    startedAt: startedAt.toISOString(),
    overall,
    summary: {
      total: results.length,
      pass: passCount,
      fail: failed.length,
      skip: skipCount,
    },
    results,
    artifacts,
  };

  await fs.writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const lines = [];
  lines.push('# Release Candidate Artifacts');
  lines.push('');
  lines.push(`- Generated: ${payload.generatedAt}`);
  lines.push(`- Overall: **${overall}**`);
  lines.push(`- Summary: ${passCount} PASS, ${failed.length} FAIL, ${skipCount} SKIP (${results.length} total)`);
  lines.push('');
  lines.push('## Validation Results');
  lines.push('');
  lines.push('| ID | Category | Status | Command | Detail |');
  lines.push('|---|---|---|---|---|');
  for (const row of results) {
    lines.push(`| ${row.id} | ${row.category} | ${row.status} | \`${row.command}\` | ${row.detail.replace(/\|/g, '\\|')} |`);
  }
  lines.push('');
  lines.push('## Artifact Index');
  lines.push('');
  for (const artifact of artifacts) {
    const exists = await fileExists(path.resolve(repoRoot, artifact.path));
    lines.push(`- ${exists ? '[x]' : '[ ]'} \`${artifact.path}\` - ${artifact.note}`);
  }
  lines.push('');
  lines.push('## Command');
  lines.push('');
  lines.push('```bash');
  lines.push('node scripts/release-candidate-gate.mjs');
  lines.push('```');
  lines.push('');
  lines.push('Optional flags:');
  lines.push('- `--skip-smoke`');
  lines.push('- `--skip-api`');
  lines.push('- `--skip-integration`');

  await fs.writeFile(mdPath, `${lines.join('\n')}\n`, 'utf8');

  console.log(`rc_report_json|INFO|${path.relative(repoRoot, jsonPath)}`);
  console.log(`rc_artifact_index|INFO|${path.relative(repoRoot, mdPath)}`);

  if (overall === 'FAIL') {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`rc_gate_error|FAIL|${error?.message || error}`);
  process.exit(1);
});
