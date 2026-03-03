#!/usr/bin/env node
import fs from 'node:fs/promises';

const BASE_URL = (process.env.INTEGRATION_BASE_URL || 'https://regattaflow-app.vercel.app').replace(/\/$/, '');
const OUTPUT_PATH = 'docs/api-smoke-deploy.md';

/** @type {Array<{id: string; method: string; path: string; okStatuses: number[]; note: string; body?: string; headers?: Record<string,string>}>} */
const checks = [
  {
    id: 'ai-race-comms-get',
    method: 'GET',
    path: '/api/ai/races/integration-smoke/comms/draft',
    okStatuses: [400, 401, 403, 405],
    note: 'Race comms draft should reject unauthenticated/wrong-method calls.',
  },
  {
    id: 'ai-event-doc-get',
    method: 'GET',
    path: '/api/ai/events/integration-smoke/documents/draft',
    okStatuses: [400, 401, 403, 405],
    note: 'Event document draft should reject unauthenticated/wrong-method calls.',
  },
  {
    id: 'ai-club-support-get',
    method: 'GET',
    path: '/api/ai/club/support',
    okStatuses: [400, 401, 403, 405],
    note: 'Club support should reject unauthenticated/wrong-method calls.',
  },
  {
    id: 'cron-coach-retention-get',
    method: 'GET',
    path: '/api/cron/coach-retention-loop',
    okStatuses: [401, 405],
    note: 'Coach retention cron should return controlled auth/method failure without runtime crash.',
  },
  {
    id: 'cron-coach-retention-post',
    method: 'POST',
    path: '/api/cron/coach-retention-loop',
    okStatuses: [401, 405],
    note: 'Coach retention cron should reject unauthenticated POST without runtime crash.',
    body: JSON.stringify({}),
    headers: { 'content-type': 'application/json' },
  },
];

function sanitize(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
    .trim();
}

async function fetchWithTimeout(url, options, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  const startedAt = new Date();
  const results = [];

  for (const check of checks) {
    const target = `${BASE_URL}${check.path}`;
    try {
      const response = await fetchWithTimeout(target, {
        method: check.method,
        headers: check.headers,
        body: check.body,
      });
      const text = await response.text();
      const vercelError = response.headers.get('x-vercel-error') || '';
      const vercelId = response.headers.get('x-vercel-id') || '-';
      const requestId = response.headers.get('x-vercel-request-id') || response.headers.get('x-request-id') || '-';

      const bodySnippet = sanitize(text.slice(0, 220));
      const failInvocation = response.status === 500 && vercelError === 'FUNCTION_INVOCATION_FAILED';
      const statusOk = check.okStatuses.includes(response.status);
      const pass = !failInvocation && statusOk;

      results.push({
        ...check,
        target,
        status: pass ? 'PASS' : 'FAIL',
        httpStatus: response.status,
        vercelError: vercelError || '-',
        vercelId,
        requestId,
        bodySnippet: bodySnippet || '-',
      });
    } catch (error) {
      results.push({
        ...check,
        target,
        status: 'FAIL',
        httpStatus: 'ERR',
        vercelError: '-',
        vercelId: '-',
        requestId: '-',
        bodySnippet: sanitize(error?.message || String(error)),
      });
    }
  }

  const failCount = results.filter((row) => row.status === 'FAIL').length;
  const overall = failCount > 0 ? 'FAIL' : 'PASS';
  const finishedAt = new Date();

  const lines = [];
  lines.push('# Deployment API Smoke');
  lines.push('');
  lines.push(`- Generated: ${finishedAt.toISOString()}`);
  lines.push(`- Base URL: ${BASE_URL}`);
  lines.push(`- Overall: **${overall}**`);
  lines.push(`- Checks: ${results.length} total (${results.length - failCount} pass, ${failCount} fail)`);
  lines.push('');
  lines.push('| Check | Status | Method | Endpoint | HTTP | x-vercel-error | x-vercel-id | x-vercel-request-id | Body Snippet |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (const row of results) {
    lines.push(
      `| ${sanitize(row.id)} | ${row.status} | ${row.method} | ${sanitize(row.target)} | ${sanitize(row.httpStatus)} | ${sanitize(row.vercelError)} | ${sanitize(row.vercelId)} | ${sanitize(row.requestId)} | ${sanitize(row.bodySnippet)} |`
    );
  }
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- Any `HTTP 500` with `x-vercel-error=FUNCTION_INVOCATION_FAILED` is a hard FAIL.');
  lines.push(`- Started: ${startedAt.toISOString()}`);
  lines.push(`- Finished: ${finishedAt.toISOString()}`);
  lines.push('');

  await fs.writeFile(OUTPUT_PATH, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Wrote ${OUTPUT_PATH} (${overall})`);

  if (overall === 'FAIL') {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error('[api-smoke-deploy] fatal:', error);
  process.exitCode = 1;
});
