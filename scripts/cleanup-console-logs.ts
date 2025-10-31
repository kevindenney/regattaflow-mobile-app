#!/usr/bin/env ts-node
/**
 * Automated Console Log Cleanup Script
 *
 * This script:
 * 1. Finds all logger.debug statements in TypeScript/TSX files
 * 2. Replaces logger.debug with logger.debug
 * 3. Adds logger import if needed
 * 4. Removes purely debug logs (with emojis, verbose debugging)
 * 5. Preserves console.error and console.warn
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface LogCleanupStats {
  filesProcessed: number;
  logsReplaced: number;
  logsRemoved: number;
  importsAdded: number;
}

const stats: LogCleanupStats = {
  filesProcessed: 0,
  logsReplaced: 0,
  logsRemoved: 0,
  importsAdded: 0,
};

const LOGGER_IMPORT = "import { createLogger } from '@/lib/utils/logger';";

// Patterns that indicate debug logs that should be removed entirely
const DEBUG_PATTERNS = [
  /console\.log\([^)]*[🎯🔄⚡🌊🗺️📍✅❌🔍💾📊🏁⏱️🚀🎉🔥💡🎨📝🎭🎬🎪🎯🔮🎲🎰🎳🎮🎯🎺🎸🎻🎹🎤🎧🎬🎭🎪🎨🎯🔄⚡🌊🗺️📍✅❌🔍💾📊🏁⏱️🚀][^)]*\)/g,
  /console\.log\(['"](Debug|DEBUG|Testing|TEST|temp|TEMP|TODO)['"]/gi,
  /console\.log\(['"]\s*-+\s*['"]\)/g,  // Separator lines
];

// Patterns for verbose/noisy logs that should be removed
const VERBOSE_PATTERNS = [
  /console\.log\(['"]Rendering/i,
  /console\.log\(['"]Component mounted/i,
  /console\.log\(['"]State updated/i,
  /console\.log\(['"]Props:/i,
  /console\.log\(['"]Data:/i,
  /console\.log\(['"]\s*\)/,  // Empty logs
];

/**
 * Check if a log statement should be removed entirely
 */
function shouldRemoveLog(logStatement: string): boolean {
  // Check debug patterns
  for (const pattern of DEBUG_PATTERNS) {
    if (pattern.test(logStatement)) {
      return true;
    }
  }

  // Check verbose patterns
  for (const pattern of VERBOSE_PATTERNS) {
    if (pattern.test(logStatement)) {
      return true;
    }
  }

  return false;
}

/**
 * Get the component/file name for the logger context
 */
function getLoggerContext(filePath: string): string {
  const fileName = path.basename(filePath, path.extname(filePath));
  return fileName;
}

/**
 * Process a single file
 */
function processFile(filePath: string, dryRun: boolean = false): boolean {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Skip if file already uses logger
  const hasLogger = /from ['"]@\/lib\/utils\/logger['"]/.test(content);

  // Find all logger.debug statements
  const consoleLogMatches = content.match(/console\.log\([^;]*\);?/g);

  if (!consoleLogMatches || consoleLogMatches.length === 0) {
    return false;
  }

  console.log(`   Found ${consoleLogMatches.length} logger.debug statements`);

  let needsLogger = false;
  let logsReplaced = 0;
  let logsRemoved = 0;

  // Process each logger.debug
  for (const logStatement of consoleLogMatches) {
    if (shouldRemoveLog(logStatement)) {
      // Remove the entire line
      const lineRegex = new RegExp(`^\\s*${logStatement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'gm');
      content = content.replace(lineRegex, '');
      logsRemoved++;
      stats.logsRemoved++;
    } else {
      // Replace with logger.debug
      const replaced = logStatement.replace(/console\.log/g, 'logger.debug');
      content = content.replace(logStatement, replaced);
      logsReplaced++;
      stats.logsReplaced++;
      needsLogger = true;
    }
  }

  // Add logger import if needed and not already present
  if (needsLogger && !hasLogger) {
    // Find the last import statement
    const importMatches = content.match(/^import .* from ['"].*['"];?$/gm);
    if (importMatches && importMatches.length > 0) {
      const lastImport = importMatches[importMatches.length - 1];
      content = content.replace(lastImport, `${lastImport}\n${LOGGER_IMPORT}`);
      stats.importsAdded++;
    } else {
      // No imports found, add at the beginning
      content = `${LOGGER_IMPORT}\n\n${content}`;
      stats.importsAdded++;
    }

    // Add logger instance after imports
    const componentName = getLoggerContext(filePath);
    const loggerInstance = `\nconst logger = createLogger('${componentName}');\n`;

    // Find where to insert the logger instance (after imports, before component/function)
    const firstFunctionOrComponent = content.search(/^(export )?(const|function|class)/m);
    if (firstFunctionOrComponent !== -1) {
      content = content.slice(0, firstFunctionOrComponent) + loggerInstance + content.slice(firstFunctionOrComponent);
    }
  }

  // Clean up multiple consecutive empty lines
  content = content.replace(/\n\n\n+/g, '\n\n');

  if (!dryRun && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    stats.filesProcessed++;
    return true;
  }

  return false;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetDir = args.find(arg => !arg.startsWith('--')) || '.';

  console.log('================================');
  console.log(`Target: ${targetDir}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'WRITE'}`);
  console.log('');

  // Find all TypeScript and TSX files
  const pattern = `${targetDir}/**/*.{ts,tsx}`;
  const files = await glob(pattern, {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/lib/utils/logger.ts', // Don't modify the logger itself
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
    ],
  });

  console.log(`Found ${files.length} files to process\n`);

  // Process each file
  for (const file of files) {
    try {
      processFile(file, dryRun);
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  // Print summary
  console.log('\n================================');
  console.log('================================');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Logs replaced with logger.debug: ${stats.logsReplaced}`);
  console.log(`Debug logs removed: ${stats.logsRemoved}`);
  console.log(`Logger imports added: ${stats.importsAdded}`);
  console.log(`Total logs cleaned: ${stats.logsReplaced + stats.logsRemoved}`);

  if (dryRun) {
    console.log('Run without --dry-run to apply changes.');
  } else {
  }
}

main().catch(console.error);
