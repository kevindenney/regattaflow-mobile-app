#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.resolve(REPO_ROOT, 'supabase', 'migrations');
const OUTPUT_PATH = path.resolve(REPO_ROOT, 'docs', 'migration-object-collision-audit.md');

const TARGET_PATTERN = /^20260302\d+.*\.sql$/i;

const PATTERNS = [
  { type: 'index', regex: /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?("?)([A-Za-z_][A-Za-z0-9_]*)\1/gi },
  { type: 'trigger', regex: /CREATE\s+TRIGGER\s+("?)([A-Za-z_][A-Za-z0-9_]*)\1/gi },
  { type: 'constraint', regex: /ADD\s+CONSTRAINT\s+("?)([A-Za-z_][A-Za-z0-9_]*)\1/gi },
  { type: 'constraint', regex: /\bCONSTRAINT\s+("?)([A-Za-z_][A-Za-z0-9_]*)\1\s+(?:PRIMARY|UNIQUE|CHECK|FOREIGN|EXCLUDE)\b/gi },
];

function normalizeSymbol(value) {
  return String(value || '').trim().toLowerCase();
}

function findMatchesByLine(content, migrationFile) {
  const findings = [];
  const lines = content.split('\n');
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    for (const pattern of PATTERNS) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match;
      while ((match = regex.exec(line)) !== null) {
        const symbol = normalizeSymbol(match[2]);
        if (!symbol) continue;
        findings.push({
          type: pattern.type,
          symbol,
          file: migrationFile,
          line: lineIndex + 1,
          source: line.trim(),
        });
      }
    }
  }
  return findings;
}

async function run() {
  const entries = await fs.readdir(MIGRATIONS_DIR);
  const migrationFiles = entries
    .filter((name) => TARGET_PATTERN.test(name))
    .sort();

  const findings = [];
  for (const file of migrationFiles) {
    const target = path.resolve(MIGRATIONS_DIR, file);
    const content = await fs.readFile(target, 'utf8');
    findings.push(...findMatchesByLine(content, file));
  }

  /** @type {Map<string, {type: string; symbol: string; occurrences: Array<{file: string; line: number; source: string}>}>} */
  const bySymbol = new Map();
  for (const item of findings) {
    const key = `${item.type}:${item.symbol}`;
    const existing = bySymbol.get(key);
    if (!existing) {
      bySymbol.set(key, {
        type: item.type,
        symbol: item.symbol,
        occurrences: [{ file: item.file, line: item.line, source: item.source }],
      });
      continue;
    }
    existing.occurrences.push({ file: item.file, line: item.line, source: item.source });
  }

  const allSymbols = Array.from(bySymbol.values()).sort((a, b) => {
    const typeOrder = a.type.localeCompare(b.type);
    if (typeOrder !== 0) return typeOrder;
    return a.symbol.localeCompare(b.symbol);
  });

  const duplicateSymbols = allSymbols
    .filter((item) => new Set(item.occurrences.map((occ) => occ.file)).size > 1)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  const countsByType = {
    index: allSymbols.filter((item) => item.type === 'index').length,
    trigger: allSymbols.filter((item) => item.type === 'trigger').length,
    constraint: allSymbols.filter((item) => item.type === 'constraint').length,
  };

  const lines = [];
  lines.push('# Migration Object Collision Audit (20260302*)');
  lines.push('');
  lines.push(`- Scope: \`supabase/migrations/${TARGET_PATTERN.source}\``);
  lines.push(`- Migration files scanned: ${migrationFiles.length}`);
  lines.push(`- Symbols scanned: ${allSymbols.length} (indexes=${countsByType.index}, triggers=${countsByType.trigger}, constraints=${countsByType.constraint})`);
  lines.push(`- Cross-file duplicate symbols: ${duplicateSymbols.length}`);
  lines.push('');
  lines.push('## Result');
  if (duplicateSymbols.length === 0) {
    lines.push('- No cross-file duplicate index/trigger/constraint symbols detected in `20260302*` migrations.');
  } else {
    lines.push('- Potential collisions detected. Review duplicate symbol list below.');
  }
  lines.push('');
  lines.push('## Duplicate Symbols');
  lines.push('| Type | Symbol | Files | Locations |');
  lines.push('|---|---|---:|---|');
  if (duplicateSymbols.length === 0) {
    lines.push('| - | - | 0 | none |');
  } else {
    for (const item of duplicateSymbols) {
      const files = Array.from(new Set(item.occurrences.map((occ) => occ.file)));
      const locations = item.occurrences
        .map((occ) => `\`${occ.file}:${occ.line}\``)
        .join(', ');
      lines.push(`| ${item.type} | \`${item.symbol}\` | ${files.length} | ${locations} |`);
    }
  }
  lines.push('');
  lines.push('## Notes');
  lines.push('- This audit targets object-symbol collisions only (indexes/triggers/constraints).');
  lines.push('- It does not evaluate semantic compatibility of similarly named objects within the same file.');
  lines.push('- If duplicates are intentional canonical overrides, document them in migration merge notes before deploy.');
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
    console.log(`Migration object collision audit unchanged at ${path.relative(REPO_ROOT, OUTPUT_PATH)}`);
    return;
  }

  await fs.writeFile(OUTPUT_PATH, nextContent, 'utf8');
  console.log(`Migration object collision audit written to ${path.relative(REPO_ROOT, OUTPUT_PATH)}`);
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Migration object collision audit failed: ${message}`);
  process.exitCode = 1;
});
