#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const matrixPath = path.resolve('docs/QA_MATRIX.md');
const MIN_AUTOMATION_RATIO = 0.6;

function parseMatrixRows(markdown) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim().startsWith('| Area | Persona | Org | Route | Action | Expected | Automation Hook | Run |'));
  if (start === -1) {
    throw new Error('QA matrix table with automation columns not found');
  }

  const rows = [];
  for (let i = start + 2; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim().startsWith('|')) break;
    const cells = line
      .trim()
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 8) continue;
    const area = cells[0];
    const hook = cells[6];
    const run = cells[7];
    if (!area || area === '---') continue;
    rows.push({ area, hook, run });
  }

  return rows;
}

function isAutomated(row) {
  const normalizedHook = String(row.hook || '').replace(/`/g, '').trim();
  return (
    normalizedHook.startsWith('smoke:') ||
    normalizedHook.startsWith('test:') ||
    normalizedHook.startsWith('script:')
  );
}

function main() {
  if (!fs.existsSync(matrixPath)) {
    throw new Error(`Missing ${matrixPath}`);
  }

  const markdown = fs.readFileSync(matrixPath, 'utf8');
  const rows = parseMatrixRows(markdown);
  if (rows.length === 0) {
    throw new Error('No QA matrix rows parsed');
  }

  const automatedRows = rows.filter(isAutomated);
  const ratio = automatedRows.length / rows.length;
  const ratioPct = (ratio * 100).toFixed(1);
  const ok = ratio >= MIN_AUTOMATION_RATIO;

  console.log(`qa_matrix_rows|INFO|total=${rows.length}`);
  console.log(`qa_matrix_automated_rows|INFO|automated=${automatedRows.length}`);
  console.log(
    `qa_matrix_automation_ratio|${ok ? 'PASS' : 'FAIL'}|${automatedRows.length}/${rows.length} (${ratioPct}%) min=${Math.round(MIN_AUTOMATION_RATIO * 100)}%`
  );

  if (!ok) {
    process.exitCode = 1;
  }
}

main();
