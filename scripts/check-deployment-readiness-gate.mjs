#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const DEFAULT_READINESS_PATH = path.resolve(REPO_ROOT, 'docs', 'deployment-readiness.md');
const DEFAULT_WAIVERS_PATH = path.resolve(REPO_ROOT, 'docs', 'deployment-waivers.json');

function parseArgs(argv) {
  const args = {
    readinessPath: DEFAULT_READINESS_PATH,
    waiversPath: DEFAULT_WAIVERS_PATH,
    now: new Date(),
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--readiness') {
      args.readinessPath = path.resolve(process.cwd(), argv[i + 1] ?? '');
      i += 1;
      continue;
    }
    if (token === '--waivers') {
      args.waiversPath = path.resolve(process.cwd(), argv[i + 1] ?? '');
      i += 1;
      continue;
    }
    if (token === '--now') {
      const value = argv[i + 1] ?? '';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid --now value: ${value}`);
      }
      args.now = parsed;
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

/**
 * @param {string} content
 */
function parseSections(content) {
  const sections = new Map();
  let current = '';
  const lines = content.split('\n');

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = heading[1].trim();
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }
    if (!sections.has(current)) sections.set(current, []);
    sections.get(current).push(line);
  }

  return sections;
}

/**
 * Parse lines like:
 * 1. [Source] `item` - details (ref: `reference`)
 * @param {string[]} lines
 */
function parseUnresolvedItems(lines) {
  const items = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const prefixMatch = trimmed.match(/^(?:[-*]|\d+\.)\s+/);
    if (!prefixMatch) continue;

    const base = trimmed.slice(prefixMatch[0].length);
    const pattern =
      /^\[(?<source>[^\]]+)\]\s+`(?<item>[^`]+)`(?:\s*-\s*(?<details>.*?))?(?:\s*\(ref:\s*`(?<reference>[^`]+)`\))?\s*$/;
    const match = base.match(pattern);

    if (!match?.groups) {
      items.push({
        source: 'Unknown',
        item: base,
        details: '',
        reference: '',
        raw: line,
      });
      continue;
    }

    items.push({
      source: match.groups.source.trim(),
      item: match.groups.item.trim(),
      details: (match.groups.details ?? '').trim(),
      reference: (match.groups.reference ?? '').trim(),
      raw: line,
    });
  }

  return items;
}

function normalizeKeyPart(value) {
  return value.trim().toLowerCase();
}

function toKey(source, item) {
  return `${normalizeKeyPart(source)}::${normalizeKeyPart(item)}`;
}

function parseExpiry(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const value = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T23:59:59.999Z`);
  }
  return new Date(value);
}

/**
 * @param {unknown} payload
 * @param {Date} now
 */
function buildWaiverIndex(payload, now) {
  const result = {
    index: new Map(),
    invalid: [],
    expired: [],
  };

  if (!payload || typeof payload !== 'object') {
    return result;
  }

  const waivers = Array.isArray(payload.waivers) ? payload.waivers : [];
  for (const waiver of waivers) {
    if (!waiver || typeof waiver !== 'object') {
      result.invalid.push({ waiver, reason: 'Waiver entry must be an object.' });
      continue;
    }

    const source = typeof waiver.source === 'string' ? waiver.source.trim() : '';
    const item = typeof waiver.item === 'string' ? waiver.item.trim() : '';
    const owner = typeof waiver.owner === 'string' ? waiver.owner.trim() : '';
    const expiresRaw = waiver.expires_at;
    const expiresAt = parseExpiry(expiresRaw);

    if (!source || !item) {
      result.invalid.push({ waiver, reason: '`source` and `item` are required.' });
      continue;
    }
    if (!owner) {
      result.invalid.push({ waiver, reason: '`owner` is required.' });
      continue;
    }
    if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) {
      result.invalid.push({ waiver, reason: '`expires_at` must be a valid date.' });
      continue;
    }
    if (expiresAt.getTime() < now.getTime()) {
      result.expired.push({ waiver, reason: 'Waiver is expired.' });
      continue;
    }

    const key = toKey(source, item);
    const existing = result.index.get(key);
    if (!existing || existing.expiresAt.getTime() < expiresAt.getTime()) {
      result.index.set(key, { waiver, expiresAt });
    }
  }

  return result;
}

async function readFileOrFail(target, label) {
  try {
    return await fs.readFile(target, 'utf8');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read ${label} at ${target}: ${detail}`);
  }
}

async function readWaiverFile(target) {
  try {
    const raw = await fs.readFile(target, 'utf8');
    const parsed = JSON.parse(raw);
    return { parsed, missing: false };
  } catch (error) {
    const code = /** @type {{code?: string}} */ (error)?.code;
    if (code === 'ENOENT') {
      return { parsed: { waivers: [] }, missing: true };
    }
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read waiver file at ${target}: ${detail}`);
  }
}

function printItems(title, items) {
  if (items.length === 0) return;
  console.error(title);
  for (const item of items) {
    console.error(`- [${item.source}] ${item.item}`);
  }
}

async function run() {
  const args = parseArgs(process.argv);
  const readiness = await readFileOrFail(args.readinessPath, 'deployment readiness report');
  const sections = parseSections(readiness);

  const unresolvedFails = parseUnresolvedItems(sections.get('Unresolved Fails') ?? []);
  const unresolvedSkips = parseUnresolvedItems(sections.get('Unresolved Skips') ?? []);

  const waiverFile = await readWaiverFile(args.waiversPath);
  const waiverIndex = buildWaiverIndex(waiverFile.parsed, args.now);

  const unwaivedSkips = [];
  const waivedSkips = [];
  for (const skip of unresolvedSkips) {
    const key = toKey(skip.source, skip.item);
    const waiver = waiverIndex.index.get(key);
    if (waiver) {
      waivedSkips.push({ ...skip, waiver: waiver.waiver, expiresAt: waiver.expiresAt });
    } else {
      unwaivedSkips.push(skip);
    }
  }

  const shouldBlock = unresolvedFails.length > 0 || unwaivedSkips.length > 0;
  const readinessRel = path.relative(REPO_ROOT, args.readinessPath) || args.readinessPath;
  const waiverRel = path.relative(REPO_ROOT, args.waiversPath) || args.waiversPath;

  if (waiverFile.missing) {
    console.log(`Waiver file not found at ${waiverRel}; continuing with no waivers.`);
  }

  console.log(`Deployment readiness gate: ${shouldBlock ? 'BLOCK' : 'PASS'}`);
  console.log(`Readiness report: ${readinessRel}`);
  console.log(`Waivers: ${waiverRel}`);
  console.log(`Unresolved FAILs: ${unresolvedFails.length}`);
  console.log(`Unresolved SKIPs: ${unresolvedSkips.length}`);
  console.log(`Waived SKIPs: ${waivedSkips.length}`);
  console.log(`Unwaived SKIPs: ${unwaivedSkips.length}`);

  if (waiverIndex.invalid.length > 0) {
    console.error('\nInvalid waiver entries (ignored):');
    for (const entry of waiverIndex.invalid) {
      console.error(`- ${entry.reason} Entry: ${JSON.stringify(entry.waiver)}`);
    }
  }
  if (waiverIndex.expired.length > 0) {
    console.error('\nExpired waiver entries (ignored):');
    for (const entry of waiverIndex.expired) {
      console.error(`- ${entry.reason} Entry: ${JSON.stringify(entry.waiver)}`);
    }
  }

  if (unresolvedFails.length > 0) {
    console.error('');
    printItems('Blocking unresolved FAIL items:', unresolvedFails);
  }
  if (unwaivedSkips.length > 0) {
    console.error('');
    printItems('Blocking unwaived SKIP items:', unwaivedSkips);
  }

  if (shouldBlock) {
    process.exitCode = 1;
    return;
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Deployment readiness gate failed: ${message}`);
  process.exitCode = 1;
});
