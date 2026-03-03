#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const sourcePath = path.resolve(repoRoot, 'docs', 'coach-home-query-baseline-latest.md');
const outputPath = path.resolve(repoRoot, 'docs', 'coach-home-endpoint-profile.md');

function extract(pattern, source, fallback = 'unknown') {
  const match = source.match(pattern);
  return match?.[1]?.trim() || fallback;
}

function parseStepRows(source) {
  const lines = source.split('\n');
  const rows = [];
  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    if (line.includes('---')) continue;
    const parts = line.split('|').map((part) => part.trim()).filter(Boolean);
    if (parts.length !== 3) continue;
    if (parts[0] === 'Step') continue;
    const avg = Number.parseFloat(parts[2]);
    rows.push({
      step: parts[0],
      samples: parts[1],
      avgMs: Number.isFinite(avg) ? avg : 0,
    });
  }
  return rows;
}

async function run() {
  const source = await fs.readFile(sourcePath, 'utf8');

  const runId = extract(/- Run ID:\s*(.+)/, source);
  const generatedAt = extract(/- Generated At:\s*(.+)/, source);
  const budgetMs = extract(/- Budget \(ms\):\s*(.+)/, source);
  const avgTotalMs = extract(/- Avg Total Refresh \(ms\):\s*(.+)/, source);
  const budgetExceeded = extract(/- Budget Exceeded:\s*(.+)/, source);

  const steps = parseStepRows(source).sort((a, b) => b.avgMs - a.avgMs);
  const topBottleneck = steps[0]?.step || 'n/a';
  const topBottleneckMs = steps[0]?.avgMs ?? 0;

  const lines = [
    '# Coach Home Endpoint Profile',
    '',
    `- Source baseline: \`docs/coach-home-query-baseline-latest.md\``,
    `- Run ID: ${runId}`,
    `- Generated At: ${generatedAt}`,
    `- Budget (ms): ${budgetMs}`,
    `- Avg Total Refresh (ms): ${avgTotalMs}`,
    `- Budget Exceeded: ${budgetExceeded}`,
    '',
    '## Bottleneck Summary',
    '',
    `- Top step by average duration: \`${topBottleneck}\` (${topBottleneckMs}ms)`,
    '',
    '## Step Ranking (Avg ms)',
    '',
    '| Rank | Step | Avg Duration (ms) | Samples |',
    '|---|---|---:|---:|',
    ...steps.map((row, index) => `| ${index + 1} | ${row.step} | ${row.avgMs} | ${row.samples} |`),
    '',
  ];

  await fs.writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`[coach-home-endpoint-profile] wrote ${path.relative(repoRoot, outputPath)}`);
}

run().catch((error) => {
  console.error('[coach-home-endpoint-profile] failed', error);
  process.exit(1);
});
