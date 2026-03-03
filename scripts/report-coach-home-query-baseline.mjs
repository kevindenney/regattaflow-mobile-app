#!/usr/bin/env node
import fs from 'node:fs/promises';

const OUTPUT_PATH = 'docs/coach-home-query-baseline-latest.md';

/**
 * @typedef {{
 *   run_id: string;
 *   generated_at: string;
 *   budget_ms: number;
 *   samples: Array<{ step: string; duration_ms: number }>;
 * }} BaselineInput
 */

/**
 * @param {string} value
 */
function sanitize(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
    .trim();
}

/**
 * @param {string} path
 * @returns {Promise<BaselineInput>}
 */
async function readInput(path) {
  const raw = await fs.readFile(path, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid baseline input: expected object JSON');
  }

  const runId = String(parsed.run_id || '').trim();
  const generatedAt = String(parsed.generated_at || '').trim();
  const budgetMs = Number(parsed.budget_ms);
  const samples = Array.isArray(parsed.samples) ? parsed.samples : [];

  if (!runId) throw new Error('Invalid baseline input: run_id is required');
  if (!generatedAt) throw new Error('Invalid baseline input: generated_at is required');
  if (!Number.isFinite(budgetMs) || budgetMs <= 0) {
    throw new Error('Invalid baseline input: budget_ms must be a positive number');
  }

  const normalizedSamples = samples.map((row, index) => {
    const step = String(row?.step || '').trim();
    const durationMs = Number(row?.duration_ms);
    if (!step) throw new Error(`Invalid baseline input: samples[${index}].step is required`);
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      throw new Error(`Invalid baseline input: samples[${index}].duration_ms must be >= 0`);
    }
    return { step, duration_ms: durationMs };
  });

  return {
    run_id: runId,
    generated_at: generatedAt,
    budget_ms: budgetMs,
    samples: normalizedSamples,
  };
}

/**
 * @param {BaselineInput} input
 */
function buildReport(input) {
  const totalsByStep = new Map();
  const countsByStep = new Map();

  for (const sample of input.samples) {
    totalsByStep.set(sample.step, (totalsByStep.get(sample.step) || 0) + sample.duration_ms);
    countsByStep.set(sample.step, (countsByStep.get(sample.step) || 0) + 1);
  }

  const stepRows = Array.from(totalsByStep.entries())
    .map(([step, total]) => {
      const count = countsByStep.get(step) || 1;
      const avg = total / count;
      return {
        step,
        samples: count,
        avg_ms: Math.round(avg * 100) / 100,
      };
    })
    .sort((a, b) => a.step.localeCompare(b.step));

  const totalSampleTime = input.samples.reduce((sum, row) => sum + row.duration_ms, 0);
  const avgTotalMs = input.samples.length > 0 ? totalSampleTime / input.samples.length : 0;
  const budgetExceeded = avgTotalMs > input.budget_ms;

  const lines = [];
  lines.push('# Coach Home Query Baseline (Latest)');
  lines.push('');
  lines.push(`- Run ID: ${sanitize(input.run_id)}`);
  lines.push(`- Generated At: ${sanitize(input.generated_at)}`);
  lines.push(`- Budget (ms): ${input.budget_ms}`);
  lines.push(`- Samples: ${input.samples.length}`);
  lines.push(`- Avg Total Refresh (ms): ${Math.round(avgTotalMs * 100) / 100}`);
  lines.push(`- Budget Exceeded: ${budgetExceeded ? 'yes' : 'no'}`);
  lines.push('');
  lines.push('| Step | Samples | Avg Duration (ms) |');
  lines.push('|---|---|---|');
  for (const row of stepRows) {
    lines.push(`| ${sanitize(row.step)} | ${row.samples} | ${row.avg_ms} |`);
  }
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- This report is deterministic for identical input JSON.');
  lines.push('- Use this as a baseline trend artifact for coach-home refresh path tuning.');

  return `${lines.join('\n')}\n`;
}

async function run() {
  const inputPath = process.env.COACH_HOME_BASELINE_INPUT || '';
  if (!inputPath) {
    throw new Error('Set COACH_HOME_BASELINE_INPUT to a baseline JSON file path.');
  }

  const input = await readInput(inputPath);
  const nextReport = buildReport(input);

  let current = null;
  try {
    current = await fs.readFile(OUTPUT_PATH, 'utf8');
  } catch (error) {
    const code = /** @type {{ code?: string }} */ (error)?.code;
    if (code !== 'ENOENT') throw error;
  }

  if (current === nextReport) {
    console.log(`Unchanged ${OUTPUT_PATH}`);
  } else {
    await fs.writeFile(OUTPUT_PATH, nextReport, 'utf8');
    console.log(`Wrote ${OUTPUT_PATH}`);
  }
}

run().catch((error) => {
  console.error('[report-coach-home-query-baseline] fatal:', error);
  process.exitCode = 1;
});
