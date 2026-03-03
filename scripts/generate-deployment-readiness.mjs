#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const PATHS = {
  integration: path.resolve(REPO_ROOT, 'docs', 'integration-validation-latest.md'),
  migrationReadiness: path.resolve(REPO_ROOT, 'docs', 'migration-merge-readiness.md'),
  testResults: path.resolve(REPO_ROOT, 'e2e', 'TEST_RESULTS.md'),
  waivers: path.resolve(REPO_ROOT, 'waivers', 'deployment-waivers.yml'),
  migrationsDir: path.resolve(REPO_ROOT, 'supabase', 'migrations'),
  output: path.resolve(REPO_ROOT, 'docs', 'deployment-readiness.md'),
};

/**
 * @param {string} target
 */
async function readOrNull(target) {
  try {
    return await fs.readFile(target, 'utf8');
  } catch {
    return null;
  }
}

/**
 * @param {string} value
 */
function normalizeStatus(value) {
  const upper = value.toUpperCase();
  if (upper.includes('PARTIAL')) return 'PARTIAL';
  if (upper.includes('FAIL')) return 'FAIL';
  if (upper.includes('SKIP')) return 'SKIP';
  if (upper.includes('PASS')) return 'PASS';
  return 'UNKNOWN';
}

/**
 * @param {string} line
 */
function parseMarkdownRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((part) => part.trim());
}

/**
 * @param {string} content
 */
function parseIntegration(content) {
  const generated = content.match(/^- Generated:\s*(.+)$/m)?.[1] ?? 'unknown';
  const overall = content.match(/^- Overall:\s*\*\*(PASS|FAIL|SKIP)\*\*$/m)?.[1] ?? 'UNKNOWN';
  const checksMatch = content.match(/^- Checks:\s*(\d+)\s+total\s+\((\d+)\s+pass,\s+(\d+)\s+fail,\s+(\d+)\s+skip\)/m);
  const totals = checksMatch
    ? {
        total: Number.parseInt(checksMatch[1], 10),
        pass: Number.parseInt(checksMatch[2], 10),
        fail: Number.parseInt(checksMatch[3], 10),
        skip: Number.parseInt(checksMatch[4], 10),
      }
    : { total: 0, pass: 0, fail: 0, skip: 0 };

  const rows = [];
  let inTable = false;
  for (const line of content.split('\n')) {
    if (line.startsWith('| Check | Category | Status | Details | Reference |')) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (!line.startsWith('|')) break;
    if (line.includes('|---|')) continue;
    const cells = parseMarkdownRow(line);
    if (cells.length < 5) continue;
    rows.push({
      check: cells[0],
      category: cells[1],
      status: normalizeStatus(cells[2]),
      details: cells[3],
      reference: cells[4],
    });
  }

  return {
    generated,
    overall,
    totals,
    rows,
    fails: rows.filter((row) => row.status === 'FAIL'),
    skips: rows.filter((row) => row.status === 'SKIP'),
    authProbeConfig:
      rows.find((row) => row.check === 'api-smoke-auth-probe-configuration') ?? null,
  };
}

/**
 * @param {string} content
 */
function parseTestResults(content) {
  const runLabel = content.match(/^## Test Run:\s*(.+)$/m)?.[1] ?? 'unknown';
  const lines = content.split('\n');
  const rows = [];

  let inSummary = false;
  for (const line of lines) {
    if (line.trim() === '### Summary') {
      inSummary = true;
      continue;
    }
    if (inSummary && line.startsWith('### ')) {
      break;
    }
    if (!inSummary) continue;
    if (!line.startsWith('|')) continue;
    if (line.includes('|------|')) continue;
    if (line.includes('| Test | Result | Notes |')) continue;
    const cells = parseMarkdownRow(line);
    if (cells.length < 3) continue;
    rows.push({
      test: cells[0],
      status: normalizeStatus(cells[1]),
      notes: cells[2],
    });
  }

  const counts = { PASS: 0, FAIL: 0, PARTIAL: 0, SKIP: 0, UNKNOWN: 0 };
  for (const row of rows) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }

  let overall = 'UNKNOWN';
  if (counts.FAIL > 0) overall = 'FAIL';
  else if (counts.PARTIAL > 0 || counts.SKIP > 0) overall = 'PARTIAL';
  else if (counts.PASS > 0) overall = 'PASS';

  return { runLabel, rows, counts, overall };
}

/**
 * @param {string} content
 */
function parseStreamStatuses(content) {
  const statuses = [];
  const lines = content.split('\n');
  let inSection = false;
  let inTable = false;

  for (const line of lines) {
    if (line.trim() === '## Current Parallel Streams') {
      inSection = true;
      continue;
    }
    if (!inSection) continue;
    if (line.startsWith('## ')) break;
    if (!line.startsWith('|')) continue;
    if (line.includes('|---|')) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    const cells = parseMarkdownRow(line);
    if (cells.length < 5) continue;
    statuses.push({
      stream: cells[0],
      status: cells[3],
      notes: cells[4],
    });
  }

  return statuses;
}

async function getMigrationStatus() {
  let files = [];
  try {
    files = await fs.readdir(PATHS.migrationsDir);
  } catch {
    files = [];
  }

  const migrationFiles = files
    .filter((name) => /^\d{14,}_.+\.sql(?:\.skip)?$/.test(name))
    .sort((a, b) => a.localeCompare(b));
  const skipped = migrationFiles.filter((name) => name.endsWith('.skip'));
  const active = migrationFiles.filter((name) => !name.endsWith('.skip'));

  const readinessText = await readOrNull(PATHS.migrationReadiness);
  const streamStatuses = readinessText ? parseStreamStatuses(readinessText) : [];

  const streamCounts = {};
  for (const stream of streamStatuses) {
    const key = stream.status.toLowerCase();
    streamCounts[key] = (streamCounts[key] ?? 0) + 1;
  }

  return {
    migrationFiles,
    skipped,
    active,
    latestAny: migrationFiles.at(-1) ?? 'none',
    latestActive: active.at(-1) ?? 'none',
    streamStatuses,
    streamCounts,
  };
}

/**
 * @param {string} status
 */
function statusEmoji(status) {
  if (status === 'PASS') return 'PASS';
  if (status === 'FAIL') return 'FAIL';
  if (status === 'SKIP') return 'SKIP';
  if (status === 'PARTIAL') return 'PARTIAL';
  return 'UNKNOWN';
}

/**
 * @param {string} raw
 */
function stripInlineComment(raw) {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if (char === "'" && !inDouble) inSingle = !inSingle;
    if (char === '"' && !inSingle) inDouble = !inDouble;
    if (char === '#' && !inSingle && !inDouble) {
      return raw.slice(0, i).trimEnd();
    }
  }
  return raw.trimEnd();
}

/**
 * @param {string} raw
 */
function parseYamlScalar(raw) {
  const value = stripInlineComment(raw).trim();
  if (value === '') return '';
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;
  if (/^-?\d+$/.test(value)) return Number.parseInt(value, 10);
  return value;
}

/**
 * Minimal YAML parser for deployment waivers structure:
 * version: <number>
 * waivers:
 *   - source: ...
 *     item: ...
 * @param {string} raw
 */
function parseDeploymentWaiversYaml(raw) {
  const lines = raw.split('\n');
  /** @type {Record<string, any>} */
  const payload = { waivers: [] };

  let inWaivers = false;
  /** @type {Record<string, any> | null} */
  let currentWaiver = null;

  const commitWaiver = () => {
    if (!currentWaiver) return;
    payload.waivers.push(currentWaiver);
    currentWaiver = null;
  };

  for (const rawLine of lines) {
    const line = stripInlineComment(rawLine);
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (!inWaivers) {
      const topMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
      if (!topMatch) continue;
      const [, key, valueRaw] = topMatch;
      if (key === 'waivers') {
        inWaivers = true;
        continue;
      }
      payload[key] = parseYamlScalar(valueRaw);
      continue;
    }

    if (/^[A-Za-z0-9_]+\s*:/.test(trimmed) && !rawLine.startsWith(' ')) {
      commitWaiver();
      inWaivers = false;
      const match = trimmed.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
      if (match) {
        payload[match[1]] = parseYamlScalar(match[2]);
      }
      continue;
    }

    const entryMatch = line.match(/^\s*-\s*(.*)$/);
    if (entryMatch) {
      commitWaiver();
      currentWaiver = {};
      const inlinePair = entryMatch[1].trim();
      if (inlinePair) {
        const inlineMatch = inlinePair.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
        if (inlineMatch) {
          currentWaiver[inlineMatch[1]] = parseYamlScalar(inlineMatch[2]);
        }
      }
      continue;
    }

    const fieldMatch = line.match(/^\s+([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (fieldMatch && currentWaiver) {
      currentWaiver[fieldMatch[1]] = parseYamlScalar(fieldMatch[2]);
    }
  }

  commitWaiver();
  if (!Array.isArray(payload.waivers)) payload.waivers = [];
  return payload;
}

/**
 * @param {string | undefined} raw
 */
function parseWaiverExpiry(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T23:59:59.999Z`);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * @param {string} value
 */
function formatIsoDate(value) {
  const parsed = parseWaiverExpiry(value);
  if (!parsed) return value;
  return parsed.toISOString().slice(0, 10);
}

async function getWaiverStatus(now = new Date()) {
  const raw = await readOrNull(PATHS.waivers);
  if (!raw) {
    return {
      missing: true,
      active: [],
      expired: [],
      invalid: [],
      parseError: null,
    };
  }

  try {
    const payload = parseDeploymentWaiversYaml(raw);
    const waivers = Array.isArray(payload.waivers) ? payload.waivers : [];

    /** @type {Array<{source: string; item: string; owner: string; expires_at: string; reason: string}>} */
    const active = [];
    /** @type {Array<{source: string; item: string; owner: string; expires_at: string; reason: string}>} */
    const expired = [];
    /** @type {Array<{waiver: any; reason: string}>} */
    const invalid = [];

    for (const waiver of waivers) {
      if (!waiver || typeof waiver !== 'object') {
        invalid.push({ waiver, reason: 'Waiver entry must be an object.' });
        continue;
      }

      const source = String(waiver.source ?? '').trim();
      const item = String(waiver.item ?? '').trim();
      const owner = String(waiver.owner ?? '').trim();
      const reason = String(waiver.reason ?? '').trim();
      const expiresRaw = String(waiver.expires_at ?? '').trim();
      const expiresAt = parseWaiverExpiry(expiresRaw);
      const isActiveFlag = waiver.active !== false && String(waiver.status ?? 'active').toLowerCase() === 'active';

      if (!source || !item || !owner || !expiresRaw || !expiresAt) {
        invalid.push({
          waiver,
          reason: 'Each waiver needs source, item, owner, and valid expires_at.',
        });
        continue;
      }
      if (!isActiveFlag) continue;

      const normalized = { source, item, owner, expires_at: expiresRaw, reason };
      if (expiresAt.getTime() < now.getTime()) {
        expired.push(normalized);
      } else {
        active.push(normalized);
      }
    }

    return { missing: false, active, expired, invalid, parseError: null };
  } catch (error) {
    return {
      missing: false,
      active: [],
      expired: [],
      invalid: [],
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

async function run() {
  const generatedAt = new Date().toISOString();
  const [integrationRaw, testRaw, migration, waivers] = await Promise.all([
    readOrNull(PATHS.integration),
    readOrNull(PATHS.testResults),
    getMigrationStatus(),
    getWaiverStatus(new Date()),
  ]);

  const integration = integrationRaw ? parseIntegration(integrationRaw) : null;
  const testResults = testRaw ? parseTestResults(testRaw) : null;

  const unresolvedSkips = [];
  if (integration) {
    for (const item of integration.skips) {
      unresolvedSkips.push({
        source: 'Integration Validation',
        item: item.check,
        details: item.details,
        reference: item.reference,
      });
    }
  }
  for (const migrationFile of migration.skipped) {
    unresolvedSkips.push({
      source: 'Migrations',
      item: migrationFile,
      details: 'Migration is marked as .skip and not in active execution path.',
      reference: `supabase/migrations/${migrationFile}`,
    });
  }
  if (testResults) {
    for (const test of testResults.rows) {
      if (test.status === 'SKIP' || test.status === 'PARTIAL') {
        unresolvedSkips.push({
          source: 'Test Suite',
          item: test.test,
          details: `${test.status}: ${test.notes}`,
          reference: 'e2e/TEST_RESULTS.md',
        });
      }
    }
  }

  const actionItems = [];
  if (integration?.fails.length) {
    actionItems.push(
      `[ ] Resolve ${integration.fails.length} failing integration validation check(s) in \`docs/integration-validation-latest.md\`.`
    );
  }
  if (integration?.skips.length) {
    actionItems.push(
      `[ ] Resolve or document waiver for ${integration.skips.length} skipped integration validation check(s), including API smoke failures.`
    );
  }
  if (
    integration?.authProbeConfig &&
    integration.authProbeConfig.details.includes('sailing=disabled') &&
    integration.authProbeConfig.details.includes('institution=disabled')
  ) {
    actionItems.push(
      '[ ] Configure authenticated smoke probe secrets (`INTEGRATION_AUTH_SAILING_BEARER`, `INTEGRATION_AUTH_INSTITUTION_BEARER`) to enable domain-authenticated runtime coverage in CI.'
    );
  }
  if (migration.skipped.length) {
    actionItems.push(
      `[ ] Triage ${migration.skipped.length} skipped migration file(s) and decide keep/remove/execute before deployment.`
    );
  }
  if (testResults && (testResults.counts.FAIL > 0 || testResults.counts.PARTIAL > 0 || testResults.counts.SKIP > 0)) {
    actionItems.push(
      `[ ] Close remaining test suite gaps (FAIL/PARTIAL/SKIP) from \`e2e/TEST_RESULTS.md\`.`
    );
  }
  if (waivers.missing) {
    actionItems.push('[ ] Add `waivers/deployment-waivers.yml` (or confirm no waivers policy) so readiness has explicit waiver state.');
  }
  if (waivers.invalid.length) {
    actionItems.push(`[ ] Fix ${waivers.invalid.length} invalid waiver entry/entries in \`waivers/deployment-waivers.yml\`.`);
  }
  if (waivers.expired.length) {
    actionItems.push(`[ ] Renew or remove ${waivers.expired.length} expired active waiver(s) before deployment.`);
  }
  actionItems.push('[ ] Re-run validation (`npm run validate:integration`) and regenerate this report before deploy cut.');

  if (actionItems.length === 1) {
    actionItems.unshift('[x] No unresolved skips or failing checks detected in available sources.');
  }

  const unresolvedPreview = unresolvedSkips.slice(0, 12);
  const unresolvedRemainder = unresolvedSkips.length - unresolvedPreview.length;

  const streamSummaryEntries = Object.entries(migration.streamCounts)
    .map(([status, count]) => `${status}: ${count}`)
    .join(', ');
  const streamSummary = streamSummaryEntries || 'none';

  const output = `# Deployment Readiness Report

- Generated: ${generatedAt}
- Output target: \`docs/deployment-readiness.md\`

## Migration Status

- Total migration files: ${migration.migrationFiles.length}
- Active migration files: ${migration.active.length}
- Skipped migration files (\`.skip\`): ${migration.skipped.length}
- Latest migration file: \`${migration.latestAny}\`
- Latest active migration file: \`${migration.latestActive}\`
- Current parallel stream statuses (${migration.streamStatuses.length} streams): ${streamSummary}

## Test Suite Status

${testResults ? `- Source: \`e2e/TEST_RESULTS.md\`\n- Latest run label: ${testResults.runLabel}\n- Overall: **${statusEmoji(testResults.overall)}**\n- Breakdown: PASS=${testResults.counts.PASS}, PARTIAL=${testResults.counts.PARTIAL}, FAIL=${testResults.counts.FAIL}, SKIP=${testResults.counts.SKIP}` : '- Source not found: `e2e/TEST_RESULTS.md`'}

## Integration Validation Summary

${integration ? `- Source: \`docs/integration-validation-latest.md\`\n- Generated: ${integration.generated}\n- Overall: **${statusEmoji(integration.overall)}**\n- Checks: ${integration.totals.total} total (${integration.totals.pass} pass, ${integration.totals.fail} fail, ${integration.totals.skip} skip)` : '- Source not found: `docs/integration-validation-latest.md`'}
${integration?.authProbeConfig ? `- Authenticated probe coverage: ${integration.authProbeConfig.details}` : '- Authenticated probe coverage: unknown (check row not present)'}

## Waivers

- Source: \`waivers/deployment-waivers.yml\`
- Active waivers: ${waivers.active.length}
- Expired active waivers: ${waivers.expired.length}
- Invalid waiver entries: ${waivers.invalid.length}
- Parse status: ${waivers.parseError ? `FAIL (${waivers.parseError})` : waivers.missing ? 'MISSING FILE' : 'PASS'}

### Active Waivers

${waivers.active.length > 0 ? waivers.active.map((waiver, index) => `${index + 1}. [${waiver.source}] \`${waiver.item}\` - owner: \`${waiver.owner}\`, expires: \`${formatIsoDate(waiver.expires_at)}\`${waiver.reason ? `, reason: ${waiver.reason}` : ''}`).join('\n') : 'No active waivers.'}

${waivers.expired.length > 0 ? `\n### Expired Waivers\n\n${waivers.expired.map((waiver, index) => `${index + 1}. [${waiver.source}] \`${waiver.item}\` - owner: \`${waiver.owner}\`, expired: \`${formatIsoDate(waiver.expires_at)}\`${waiver.reason ? `, reason: ${waiver.reason}` : ''}`).join('\n')}` : ''}

## Unresolved Skips

${unresolvedPreview.length > 0 ? unresolvedPreview.map((entry, index) => `${index + 1}. [${entry.source}] \`${entry.item}\` - ${entry.details} (ref: \`${entry.reference}\`)`).join('\n') : 'No unresolved skips found from current sources.'}
${unresolvedRemainder > 0 ? `\n\n...plus ${unresolvedRemainder} additional unresolved skip item(s).` : ''}

## Action Checklist

${actionItems.map((item) => `- ${item}`).join('\n')}
`;

  await fs.writeFile(PATHS.output, output, 'utf8');
  if (waivers.parseError) {
    console.error(`Deployment readiness report written to ${path.relative(REPO_ROOT, PATHS.output)} (waiver parse failure).`);
    process.exitCode = 1;
    return;
  }
  if (waivers.expired.length > 0) {
    console.error(`Deployment readiness report written to ${path.relative(REPO_ROOT, PATHS.output)} (expired waivers detected).`);
    process.exitCode = 1;
    return;
  }

  console.log(`Deployment readiness report written to ${path.relative(REPO_ROOT, PATHS.output)}`);
}

run().catch((error) => {
  console.error('[deployment-readiness] Failed to generate report');
  console.error(error);
  process.exitCode = 1;
});
