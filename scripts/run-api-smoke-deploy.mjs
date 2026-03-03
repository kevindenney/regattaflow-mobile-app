#!/usr/bin/env node
import fs from 'node:fs/promises';

const BASE_URL = (process.env.INTEGRATION_BASE_URL || 'https://regattaflow-app.vercel.app').replace(/\/$/, '');
const OUTPUT_PATH = 'docs/api-smoke-deploy.md';
const HISTORY_PATH = 'docs/api-smoke-deploy-history.json';
const SAILING_AUTH_TOKEN = String(process.env.INTEGRATION_AUTH_SAILING_BEARER || '').trim();
const INSTITUTION_AUTH_TOKEN = String(process.env.INTEGRATION_AUTH_INSTITUTION_BEARER || '').trim();

/** @type {Array<{id: string; method: string; path: string; okStatuses: number[]; note: string; body?: string; headers?: Record<string,string>; expectedBodyIncludes?: string[]}>} */
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

if (SAILING_AUTH_TOKEN) {
  checks.push({
    id: 'auth-sailing-workspace-get',
    method: 'GET',
    path: '/api/club/workspace',
    okStatuses: [200],
    note: 'Sailing authenticated workspace probe should return 200 without runtime failure.',
    headers: { authorization: `Bearer ${SAILING_AUTH_TOKEN}` },
  });
}

if (INSTITUTION_AUTH_TOKEN) {
  checks.push({
    id: 'auth-institution-domain-gate-post',
    method: 'POST',
    path: '/api/ai/club/support',
    okStatuses: [403],
    note: 'Institution authenticated probe should be domain-gated on club support.',
    body: JSON.stringify({ message: 'deployment smoke probe' }),
    headers: {
      authorization: `Bearer ${INSTITUTION_AUTH_TOKEN}`,
      'content-type': 'application/json',
    },
    expectedBodyIncludes: ['DOMAIN_GATED', 'sailing workspaces', 'Organization context required'],
  });
}

function sanitize(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
    .trim();
}

function summarizeErrorJsonObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const obj = /** @type {Record<string, unknown>} */ (value);
  const keys = ['error', 'message', 'detail', 'details', 'code', 'status', 'statusCode', 'hint', 'name'];
  const parts = [];
  for (const key of keys) {
    const item = obj[key];
    if (item === undefined || item === null) continue;
    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
      parts.push(`${key}=${String(item)}`);
      continue;
    }
    if (typeof item === 'object') {
      const nested = summarizeErrorJsonObject(item);
      if (nested) parts.push(`${key}={${nested}}`);
    }
  }
  if (parts.length > 0) return parts.join('; ');
  return null;
}

function extractBodySnippet(rawText, contentType) {
  const text = String(rawText || '').trim();
  if (!text) return '-';
  const normalizedType = String(contentType || '').toLowerCase();
  const looksJson = normalizedType.includes('application/json') || text.startsWith('{') || text.startsWith('[');

  if (looksJson) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = summarizeErrorJsonObject(parsed[0]);
        if (first) return sanitize(`json[0]: ${first}`).slice(0, 220);
      }
      const summary = summarizeErrorJsonObject(parsed);
      if (summary) return sanitize(`json: ${summary}`).slice(0, 220);
      return sanitize(`json: ${JSON.stringify(parsed)}`).slice(0, 220);
    } catch {
      return sanitize(text.slice(0, 220));
    }
  }

  if (normalizedType.includes('text/html') || /<html|<!doctype/i.test(text)) {
    const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch?.[1]) {
      return sanitize(`html: title=${titleMatch[1]}`).slice(0, 220);
    }
    return sanitize(`html: ${text.replace(/<[^>]+>/g, ' ')}`).slice(0, 220);
  }

  return sanitize(text.slice(0, 220));
}

async function readHistory() {
  try {
    const raw = await fs.readFile(HISTORY_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.runs)) {
      return { runs: [] };
    }
    return {
      runs: parsed.runs
        .filter((row) => row && typeof row === 'object' && typeof row.signature === 'string')
        .map((row) => ({
          signature: String(row.signature),
          overall: String(row.overall || 'FAIL'),
          pass: Number.isFinite(row.pass) ? Number(row.pass) : 0,
          fail: Number.isFinite(row.fail) ? Number(row.fail) : 0,
          invocation_failures: Number.isFinite(row.invocation_failures) ? Number(row.invocation_failures) : 0,
        })),
    };
  } catch (error) {
    const code = /** @type {{ code?: string }} */ (error)?.code;
    if (code === 'ENOENT') return { runs: [] };
    throw error;
  }
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
      const contentType = response.headers.get('content-type') || '-';
      const vercelError = response.headers.get('x-vercel-error') || '';
      const vercelId = response.headers.get('x-vercel-id') || '-';
      const requestId = response.headers.get('x-vercel-request-id') || response.headers.get('x-request-id') || '-';

      const bodySnippet = extractBodySnippet(text, contentType);
      const failInvocation = response.status === 500 && vercelError === 'FUNCTION_INVOCATION_FAILED';
      const statusOk = check.okStatuses.includes(response.status);
      const bodyExpectationMet =
        !check.expectedBodyIncludes ||
        check.expectedBodyIncludes.length === 0 ||
        check.expectedBodyIncludes.some((needle) => text.includes(needle));
      const pass = !failInvocation && statusOk && bodyExpectationMet;
      const diagnosticVercelId = pass ? '-' : vercelId;
      const diagnosticRequestId = pass ? '-' : requestId;

      results.push({
        ...check,
        target,
        status: pass ? 'PASS' : 'FAIL',
        httpStatus: response.status,
        contentType,
        vercelError: vercelError || '-',
        vercelId: diagnosticVercelId,
        requestId: diagnosticRequestId,
        bodySnippet: bodySnippet || '-',
      });
    } catch (error) {
      results.push({
        ...check,
        target,
        status: 'FAIL',
        httpStatus: 'ERR',
        contentType: '-',
        vercelError: '-',
        vercelId: '-',
        requestId: '-',
        bodySnippet: sanitize(error?.message || String(error)),
      });
    }
  }

  const failCount = results.filter((row) => row.status === 'FAIL').length;
  const overall = failCount > 0 ? 'FAIL' : 'PASS';
  const invocationFailureCount = results.filter(
    (row) => row.httpStatus === 500 && row.vercelError === 'FUNCTION_INVOCATION_FAILED'
  ).length;

  const signature = JSON.stringify(
    results.map((row) => ({
      id: row.id,
      status: row.status,
      httpStatus: row.httpStatus,
      vercelError: row.vercelError,
      bodySnippet: row.bodySnippet,
    }))
  );
  const history = await readHistory();
  const nextHistoryRuns = [...history.runs];
  const latest = nextHistoryRuns[nextHistoryRuns.length - 1];
  if (!latest || latest.signature !== signature) {
    nextHistoryRuns.push({
      signature,
      overall,
      pass: results.length - failCount,
      fail: failCount,
      invocation_failures: invocationFailureCount,
    });
  }
  const boundedHistoryRuns = nextHistoryRuns.slice(-20);
  const trendWindow = boundedHistoryRuns.slice(-5);
  const trendPassRuns = trendWindow.filter((row) => row.overall === 'PASS').length;
  const trendInvocationFailureRuns = trendWindow.filter((row) => row.invocation_failures > 0).length;

  const lines = [];
  lines.push('# Deployment API Smoke');
  lines.push('');
  lines.push(`- Base URL: ${BASE_URL}`);
  lines.push(`- Overall: **${overall}**`);
  lines.push(`- Checks: ${results.length} total (${results.length - failCount} pass, ${failCount} fail)`);
  lines.push(`- Sailing auth probe token: ${SAILING_AUTH_TOKEN ? 'set' : 'not set'}`);
  lines.push(`- Institution auth probe token: ${INSTITUTION_AUTH_TOKEN ? 'set' : 'not set'}`);
  lines.push('');
  lines.push('## Trend');
  lines.push('');
  lines.push(`- Window: last ${trendWindow.length} distinct result set${trendWindow.length === 1 ? '' : 's'}`);
  lines.push(`- Run pass rate: ${trendPassRuns}/${trendWindow.length}`);
  lines.push(`- Runs with invocation failure: ${trendInvocationFailureRuns}/${trendWindow.length}`);
  lines.push('');
  lines.push('| Check | Status | Method | Endpoint | HTTP | content-type | x-vercel-error | x-vercel-id | x-vercel-request-id | Body Snippet |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const row of results) {
    lines.push(
      `| ${sanitize(row.id)} | ${row.status} | ${row.method} | ${sanitize(row.target)} | ${sanitize(row.httpStatus)} | ${sanitize(row.contentType)} | ${sanitize(row.vercelError)} | ${sanitize(row.vercelId)} | ${sanitize(row.requestId)} | ${sanitize(row.bodySnippet)} |`
    );
  }
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- Any `HTTP 500` with `x-vercel-error=FUNCTION_INVOCATION_FAILED` is a hard FAIL.');
  lines.push('- Authenticated probe rows are included only when bearer token env vars are provided.');
  lines.push('');

  const nextContent = `${lines.join('\n')}\n`;
  let currentContent = null;
  try {
    currentContent = await fs.readFile(OUTPUT_PATH, 'utf8');
  } catch (error) {
    const code = /** @type {{ code?: string }} */ (error)?.code;
    if (code !== 'ENOENT') throw error;
  }

  if (currentContent === nextContent) {
    console.log(`Unchanged ${OUTPUT_PATH} (${overall})`);
  } else {
    await fs.writeFile(OUTPUT_PATH, nextContent, 'utf8');
    console.log(`Wrote ${OUTPUT_PATH} (${overall})`);
  }

  const nextHistoryContent = `${JSON.stringify({ runs: boundedHistoryRuns }, null, 2)}\n`;
  let currentHistoryContent = null;
  try {
    currentHistoryContent = await fs.readFile(HISTORY_PATH, 'utf8');
  } catch (error) {
    const code = /** @type {{ code?: string }} */ (error)?.code;
    if (code !== 'ENOENT') throw error;
  }
  if (currentHistoryContent !== nextHistoryContent) {
    await fs.writeFile(HISTORY_PATH, nextHistoryContent, 'utf8');
  }

  if (overall === 'FAIL') {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error('[api-smoke-deploy] fatal:', error);
  process.exitCode = 1;
});
