#!/usr/bin/env node

import { chromium } from 'playwright';
import path from 'path';

const baseUrl = process.env.MEASURE_BASE_URL || process.env.SMOKE_BASE_URL || 'http://localhost:8081';
const profileDir = process.env.MEASURE_PROFILE_DIR || process.env.SMOKE_PROFILE_DIR || path.resolve('.chrome-devtools');
const iterations = Number(process.env.MEASURE_ITERATIONS || '5');
const p95BudgetMs = Number(process.env.MEASURE_BUDGET_MS || '3500');
const discardRuns = Number(process.env.MEASURE_DISCARD_RUNS || '1');
const outputPath = process.env.MEASURE_OUTPUT_PATH || '/tmp/m14-route-budget.json';

const routes = [
  { id: 'members', path: '/organization/members', marker: 'text=Members' },
  { id: 'cohorts', path: '/organization/cohorts', marker: 'text=Cohorts' },
  { id: 'templates', path: '/organization/templates', marker: 'text=Templates' },
];

function percentile95(values) {
  if (!values.length) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

function average(values) {
  if (!values.length) return NaN;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function emit(id, status, detail) {
  console.log(`${id}|${status}|${detail}`);
}

const run = async () => {
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: true,
    viewport: { width: 1440, height: 980 },
  });

  const page = context.pages()[0] || (await context.newPage());

  const results = [];

  try {
    emit(
      'route_budget_start',
      'INFO',
      `base=${baseUrl}; iterations=${iterations}; discard_runs=${discardRuns}; budget_ms=${p95BudgetMs}`
    );

    for (const route of routes) {
      const durations = [];
      let errors = 0;
      const warmupUrl = `${baseUrl}${route.path}?_warmup=${Date.now()}`;

      try {
        await page.goto(warmupUrl, { waitUntil: 'networkidle', timeout: 120000 });
        await page.locator(route.marker).first().waitFor({ timeout: 10000 });
        emit(`route_${route.id}_warmup`, 'PASS', 'warmup complete');
      } catch (error) {
        emit(`route_${route.id}_warmup`, 'FAIL', String(error?.message || error));
      }

      for (let i = 0; i < iterations; i += 1) {
        const bust = `m14_${Date.now()}_${i}`;
        const url = `${baseUrl}${route.path}?_=${bust}`;
        const start = Date.now();
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
          await page.locator(route.marker).first().waitFor({ timeout: 10000 });
          const ms = Date.now() - start;
          durations.push(ms);
          emit(`route_${route.id}_run_${i + 1}`, 'PASS', `${ms}ms`);
        } catch (error) {
          errors += 1;
          emit(`route_${route.id}_run_${i + 1}`, 'FAIL', String(error?.message || error));
        }
      }

      const scoredDurations = durations.slice(Math.max(0, discardRuns));
      const p95 = Number(percentile95(scoredDurations).toFixed(0));
      const avg = Number(average(scoredDurations).toFixed(0));
      const pass =
        errors === 0 &&
        scoredDurations.length > 0 &&
        Number.isFinite(p95) &&
        p95 <= p95BudgetMs;

      results.push({
        route: route.path,
        id: route.id,
        durations_ms: durations,
        scored_durations_ms: scoredDurations,
        avg_ms: avg,
        p95_ms: p95,
        errors,
        discard_runs: discardRuns,
        budget_ms: p95BudgetMs,
        status: pass ? 'PASS' : 'FAIL',
      });

      emit(
        `route_${route.id}_p95`,
        pass ? 'PASS' : 'FAIL',
        `avg=${avg}ms p95=${p95}ms errors=${errors} discard=${discardRuns} budget=${p95BudgetMs}ms`
      );
    }

    const allPass = results.every((r) => r.status === 'PASS');
    const payload = {
      generated_at: new Date().toISOString(),
      base_url: baseUrl,
      iterations,
      budget_ms: p95BudgetMs,
      results,
      overall: allPass ? 'PASS' : 'FAIL',
    };

    await import('node:fs/promises').then((fs) => fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8'));
    emit('route_budget_artifact', 'INFO', outputPath);
    emit('route_budget_overall', allPass ? 'PASS' : 'FAIL', `routes=${results.length}`);

    if (!allPass) {
      process.exitCode = 1;
    }
  } finally {
    await context.close();
  }
};

run().catch((error) => {
  emit('route_budget_error', 'FAIL', String(error?.message || error));
  process.exit(1);
});
