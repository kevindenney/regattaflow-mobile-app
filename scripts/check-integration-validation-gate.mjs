#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const DEFAULT_REPORT_PATH = path.resolve(REPO_ROOT, 'docs', 'integration-validation-latest.md');
const DEFAULT_REPORT_JSON_PATH = path.resolve(REPO_ROOT, 'docs', 'integration-validation-latest.json');

function parseArgs(argv) {
  const args = {
    reportPath: DEFAULT_REPORT_PATH,
    reportJsonPath: DEFAULT_REPORT_JSON_PATH,
    expectedSkipIds: process.env.EXPECTED_SKIP_IDS ?? '',
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--report') {
      const value = argv[i + 1] ?? '';
      args.reportPath = path.resolve(process.cwd(), value);
      args.reportJsonPath = args.reportPath.replace(/\.md$/i, '.json');
      i += 1;
      continue;
    }
    if (token === '--report-json') {
      const value = argv[i + 1] ?? '';
      args.reportJsonPath = path.resolve(process.cwd(), value);
      i += 1;
      continue;
    }
    if (token === '--expected-skip-ids') {
      args.expectedSkipIds = argv[i + 1] ?? '';
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

function parseAllowedSkips(value) {
  return new Set(
    String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function parseCheckRows(markdown) {
  const lines = markdown.split(/\r?\n/);
  const headerLine = '| Check | Category | Status | Details | Reference |';
  const dividerPattern = /^\|\s*-+\s*\|\s*-+\s*\|\s*-+\s*\|\s*-+\s*\|\s*-+\s*\|$/;

  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim() !== headerLine) continue;

    const rows = [];
    for (let j = i + 1; j < lines.length; j += 1) {
      const trimmed = lines[j].trim();
      if (!trimmed.startsWith('|')) break;
      if (dividerPattern.test(trimmed)) continue;

      const parts = trimmed.split('|').map((part) => part.trim());
      if (parts.length < 7) continue;

      const checkId = parts[1];
      const status = parts[3];
      if (!checkId || !status) continue;
      rows.push({ checkId, status });
    }
    return rows;
  }

  return [];
}

/**
 * @param {string} markdown
 */
function parseMarkdownOverallStatus(markdown) {
  const match = markdown.match(/^- Overall:\s*\*\*(PASS|FAIL|SKIP)\*\*$/m);
  return match ? String(match[1]).trim().toUpperCase() : '';
}

/**
 * @param {{checkId: string; status: string}[]} rows
 */
function findDuplicateCheckIds(rows) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const row of rows) {
    counts.set(row.checkId, (counts.get(row.checkId) || 0) + 1);
  }
  return Array.from(counts.entries())
    .filter((entry) => entry[1] > 1)
    .map((entry) => entry[0])
    .sort((a, b) => a.localeCompare(b));
}

/**
 * @param {unknown} payload
 */
function parseCheckRowsFromJson(payload) {
  if (!payload || typeof payload !== 'object') return [];
  const resultRows = Array.isArray(payload.results) ? payload.results : [];
  return resultRows
    .map((row) => ({
      checkId: typeof row?.id === 'string' ? row.id.trim() : '',
      status: typeof row?.status === 'string' ? row.status.trim().toUpperCase() : '',
    }))
    .filter((row) => row.checkId && row.status);
}

function rowsToStatusMap(rows) {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const row of rows) {
    if (!row.checkId || !row.status) continue;
    map.set(row.checkId, row.status.toUpperCase());
  }
  return map;
}

function rowsEquivalent(aRows, bRows) {
  const a = rowsToStatusMap(aRows);
  const b = rowsToStatusMap(bRows);
  if (a.size !== b.size) return false;
  for (const [checkId, status] of a.entries()) {
    if (b.get(checkId) !== status) return false;
  }
  return true;
}

/**
 * @param {unknown} payload
 */
function parseJsonOverallStatus(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const overall = /** @type {{ overall?: unknown }} */ (payload).overall;
  if (typeof overall !== 'string') return '';
  return overall.trim().toUpperCase();
}

async function run() {
  const args = parseArgs(process.argv);
  /** @type {{checkId: string; status: string}[]} */
  let rows = [];
  let sourcePath = args.reportPath;
  let parsedFrom = 'markdown';
  let jsonOverall = '';
  let markdownOverall = '';
  let markdownRows = [];

  try {
    const reportJsonRaw = await fs.readFile(args.reportJsonPath, 'utf8');
    const parsedJson = JSON.parse(reportJsonRaw);
    rows = parseCheckRowsFromJson(parsedJson);
    jsonOverall = parseJsonOverallStatus(parsedJson);
    if (rows.length > 0) {
      sourcePath = args.reportJsonPath;
      parsedFrom = 'json';
    }
  } catch (error) {
    const code = /** @type {{code?: string}} */ (error)?.code;
    if (code && code !== 'ENOENT') {
      console.warn(`Integration validation gate: JSON read failed at ${args.reportJsonPath}; falling back to markdown.`);
    }
  }

  if (rows.length === 0) {
    const reportRaw = await fs.readFile(args.reportPath, 'utf8');
    markdownRows = parseCheckRows(reportRaw);
    markdownOverall = parseMarkdownOverallStatus(reportRaw);
    rows = markdownRows;
    sourcePath = args.reportPath;
    parsedFrom = 'markdown';
  } else {
    try {
      const reportRaw = await fs.readFile(args.reportPath, 'utf8');
      markdownRows = parseCheckRows(reportRaw);
      markdownOverall = parseMarkdownOverallStatus(reportRaw);
    } catch {
      // markdown may be unavailable; json-first path remains authoritative
    }
  }

  if (rows.length === 0) {
    console.error(`Integration validation gate: BLOCK (${args.reportPath})`);
    console.error('No check rows were parsed from integration validation report.');
    process.exitCode = 1;
    return;
  }

  const duplicateCheckIds = findDuplicateCheckIds(rows);

  const allowedSkips = parseAllowedSkips(args.expectedSkipIds);
  const failRows = rows.filter((row) => row.status === 'FAIL');
  const unexpectedSkipRows = rows.filter(
    (row) => row.status === 'SKIP' && !allowedSkips.has(row.checkId)
  );

  const reportRel = path.relative(REPO_ROOT, sourcePath) || sourcePath;

  const jsonOverallFailed = parsedFrom === 'json' && jsonOverall && jsonOverall !== 'PASS';
  const crossFormatMismatch =
    parsedFrom === 'json' &&
    markdownRows.length > 0 &&
    (!rowsEquivalent(rows, markdownRows) ||
      (jsonOverall && markdownOverall && jsonOverall !== markdownOverall));

  if (
    duplicateCheckIds.length > 0 ||
    failRows.length > 0 ||
    unexpectedSkipRows.length > 0 ||
    jsonOverallFailed ||
    crossFormatMismatch
  ) {
    console.error(`Integration validation gate: BLOCK (${reportRel}, parsed as ${parsedFrom})`);
    if (jsonOverallFailed) {
      console.error(`JSON overall status is ${jsonOverall} (expected PASS).`);
    }
    if (crossFormatMismatch) {
      console.error('JSON/markdown integration report mismatch detected (rows and/or overall status differ).');
    }
    if (duplicateCheckIds.length > 0) {
      console.error('Duplicate check IDs detected:');
      for (const checkId of duplicateCheckIds) {
        console.error(`- ${checkId}`);
      }
    }
    if (failRows.length > 0) {
      console.error('FAIL checks detected:');
      for (const row of failRows) {
        console.error(`- ${row.checkId}`);
      }
    }
    if (unexpectedSkipRows.length > 0) {
      console.error('Unexpected SKIP checks detected:');
      for (const row of unexpectedSkipRows) {
        console.error(`- ${row.checkId}`);
      }
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Integration validation gate: PASS (${reportRel}, parsed as ${parsedFrom})`);
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Integration validation gate failed: ${message}`);
  process.exitCode = 1;
});
