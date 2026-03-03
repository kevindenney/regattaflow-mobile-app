#!/usr/bin/env node
import fs from 'node:fs/promises';

const REPORT_PATH = process.env.COACH_HOME_BASELINE_REPORT || 'docs/coach-home-query-baseline-latest.md';
const DEFAULT_BUDGET_MS = Number(process.env.COACH_HOME_BASELINE_BUDGET_MS || '600');

/**
 * @param {string} text
 */
function parseAvgTotalMs(text) {
  const match = text.match(/Avg Total Refresh \(ms\):\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!match) return null;
  return Number(match[1]);
}

/**
 * @param {string} text
 */
function parseBudgetMs(text) {
  const match = text.match(/Budget \(ms\):\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!match) return null;
  return Number(match[1]);
}

async function run() {
  const raw = await fs.readFile(REPORT_PATH, 'utf8');
  const avgTotalMs = parseAvgTotalMs(raw);
  const reportBudgetMs = parseBudgetMs(raw);
  const budgetMs = Number.isFinite(reportBudgetMs) ? Number(reportBudgetMs) : DEFAULT_BUDGET_MS;

  if (!Number.isFinite(avgTotalMs)) {
    throw new Error(`Could not parse 'Avg Total Refresh (ms)' from ${REPORT_PATH}`);
  }
  if (!Number.isFinite(budgetMs) || budgetMs <= 0) {
    throw new Error(`Invalid budget value (${budgetMs}) for ${REPORT_PATH}`);
  }

  const withinBudget = avgTotalMs <= budgetMs;
  if (withinBudget) {
    console.log(
      `[coach-home-baseline-budget] PASS avg_total_ms=${avgTotalMs} budget_ms=${budgetMs} report=${REPORT_PATH}`
    );
    return;
  }

  console.error(
    `[coach-home-baseline-budget] FAIL avg_total_ms=${avgTotalMs} budget_ms=${budgetMs} report=${REPORT_PATH}`
  );
  process.exitCode = 1;
}

run().catch((error) => {
  console.error('[check-coach-home-baseline-budget] fatal:', error?.message || error);
  process.exitCode = 1;
});
