#!/usr/bin/env node
/**
 * Export the boat-tuning-analyst skill content to Markdown.
 * This script transpiles the TypeScript skill definition at runtime,
 * ensuring the generated SKILL.md stays in sync with the structured guide data.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
const cache = new Map();

function resolveTsPath(specifier) {
  if (specifier.startsWith('@/')) {
    const relativePath = specifier.slice(2);
    const absWithoutExt = path.join(projectRoot, relativePath);

    const candidates = [
      `${absWithoutExt}.ts`,
      path.join(absWithoutExt, 'index.ts')
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function loadTsModule(modulePath) {
  const resolvedPath = modulePath.endsWith('.ts') ? modulePath : `${modulePath}.ts`;

  if (cache.has(resolvedPath)) {
    return cache.get(resolvedPath);
  }

  const source = fs.readFileSync(resolvedPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true
    }
  }).outputText;

  const module = { exports: {} };

  const sandbox = {
    module,
    exports: module.exports,
    require: (specifier) => {
      if (specifier === 'tslib') {
        return require('tslib');
      }

      const resolved = resolveTsPath(specifier);
      if (resolved) {
        return loadTsModule(resolved);
      }

      return require(specifier);
    },
    __dirname: path.dirname(resolvedPath),
    __filename: resolvedPath,
    console
  };

  vm.runInNewContext(transpiled, sandbox, { filename: resolvedPath });
  cache.set(resolvedPath, module.exports);
  return module.exports;
}

function main() {
  const skillModulePath = path.join(projectRoot, 'skills', 'tuning-guides', 'boatTuningSkill.ts');
  const { BOAT_TUNING_SKILL_CONTENT } = loadTsModule(skillModulePath);

  if (!BOAT_TUNING_SKILL_CONTENT) {
    throw new Error('Failed to load BOAT_TUNING_SKILL_CONTENT from boatTuningSkill.ts');
  }

  const outputDir = path.join(projectRoot, 'skills', 'boat-tuning-analyst');
  const outputPath = path.join(outputDir, 'SKILL.md');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const frontmatter = [
    '---',
    'name: boat-tuning-analyst',
    'description: Championship rig tuning recommendations automatically assembled from RegattaFlow tuning guides',
    '---',
    ''
  ].join('\n');

  fs.writeFileSync(outputPath, `${frontmatter}${BOAT_TUNING_SKILL_CONTENT}`, 'utf8');

  console.log(`✅ Wrote boat tuning skill to ${path.relative(projectRoot, outputPath)}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('❌ Failed to export boat tuning skill:', error);
    process.exit(1);
  }
}
