#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const repoRoot = process.cwd();
const codeExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const resolutionExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'];

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function parseGitLsFiles() {
  const output = execSync('git ls-files', { encoding: 'utf8' });
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractImportSpecifiers(sourceCode) {
  const specs = [];
  const re = /(?:import|export)\s+[^'"]*?\s+from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;
  while ((match = re.exec(sourceCode)) !== null) {
    const spec = match[1] || match[2] || match[3];
    if (spec) specs.push(spec);
  }
  return specs;
}

function resolveSpecifier(importerFile, specifier) {
  let base;
  if (specifier.startsWith('@/')) {
    base = path.join(repoRoot, specifier.slice(2));
  } else if (specifier.startsWith('./') || specifier.startsWith('../')) {
    base = path.resolve(path.dirname(path.join(repoRoot, importerFile)), specifier);
  } else {
    return { kind: 'external' };
  }

  const directCandidates = path.extname(base)
    ? [base]
    : resolutionExtensions.map((ext) => `${base}${ext}`);
  const indexCandidates = path.extname(base)
    ? []
    : resolutionExtensions.map((ext) => path.join(base, `index${ext}`));

  const candidates = [...directCandidates, ...indexCandidates];
  const matched = candidates.find((candidate) => fs.existsSync(candidate));
  if (!matched) {
    return {
      kind: 'unresolved',
      importerFile,
      specifier,
    };
  }

  const relative = toPosix(path.relative(repoRoot, matched));
  return {
    kind: 'resolved',
    importerFile,
    specifier,
    resolvedPath: relative,
  };
}

const trackedFiles = parseGitLsFiles();
const trackedSet = new Set(trackedFiles.map((file) => toPosix(file)));
const trackedLowerSet = new Set(trackedFiles.map((file) => toPosix(file).toLowerCase()));
const sourceFiles = trackedFiles.filter((file) => codeExtensions.has(path.extname(file)));

const untrackedTargets = [];

for (const sourceFile of sourceFiles) {
  const sourcePath = path.join(repoRoot, sourceFile);
  let sourceCode = '';
  try {
    sourceCode = fs.readFileSync(sourcePath, 'utf8');
  } catch {
    continue;
  }

  const specifiers = extractImportSpecifiers(sourceCode);
  for (const specifier of specifiers) {
    const result = resolveSpecifier(sourceFile, specifier);
    if (result.kind === 'external') continue;
    if (result.kind === 'unresolved') continue;
    const resolvedLower = result.resolvedPath.toLowerCase();
    if (!trackedSet.has(result.resolvedPath) && !trackedLowerSet.has(resolvedLower)) {
      untrackedTargets.push(result);
    }
  }
}

if (untrackedTargets.length === 0) {
  console.log('[validate:imports:tracked] PASS');
  process.exit(0);
}

if (untrackedTargets.length > 0) {
  console.error('\n[validate:imports:tracked] Imports resolve to untracked files:');
  for (const item of untrackedTargets) {
    console.error(`- importer=${item.importerFile} specifier=${item.specifier} resolved=${item.resolvedPath}`);
  }
}

process.exit(1);
