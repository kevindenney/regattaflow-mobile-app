#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript/JavaScript files with console logs in src
const findFilesWithConsoleLogs = () => {
  try {
    const result = execSync(
      'grep -rl "console\\.(log|debug|info|warn)" src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"',
      { encoding: 'utf8', cwd: path.join(__dirname, '..') }
    );
    return result.trim().split('\n').filter(Boolean);
  } catch (error) {
    // No matches found or error
    return [];
  }
};

// Files to preserve console.error and console.warn for production debugging
const preserveErrorWarnings = true;

// Exception patterns - keep these console logs
const keepPatterns = [
  /console\.error/,  // Keep error logs
  // Remove most warns but could keep critical ones
];

function removeConsoleLogs(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Remove console.log, console.debug, console.info
    // But preserve console.error and console.warn
    const lines = content.split('\n');
    const newLines = [];

    let removedCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if line contains console log we want to remove
      if (
        line.match(/console\.(log|debug|info)/) &&
        !line.match(/\/\/.*console\.(log|debug|info)/) && // Skip if already commented
        !line.match(/console\.error/) && // Keep errors
        !line.match(/console\.warn/) // Keep warnings for now
      ) {
        // Check if it's a simple single-line console statement
        const trimmed = line.trim();
        if (trimmed.startsWith('console.') && trimmed.endsWith(';')) {
          // Remove the entire line
          removedCount++;
          continue;
        } else if (trimmed.startsWith('console.')) {
          // Comment out instead of removing (safer)
          newLines.push(line.replace(/(\s*)console\.(log|debug|info)/, '$1// console.$2'));
          removedCount++;
          continue;
        }
      }

      newLines.push(line);
    }

    if (removedCount > 0) {
      const newContent = newLines.join('\n');
      fs.writeFileSync(fullPath, newContent, 'utf8');
      console.log(`✓ ${filePath} (removed ${removedCount} console logs)`);
      return removedCount;
    } else {
      console.log(`- ${filePath} (no changes)`);
      return 0;
    }

  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// Main execution
console.log('Finding files with console logs...\n');

const files = findFilesWithConsoleLogs();

if (files.length === 0) {
  console.log('No files with console logs found.');
  process.exit(0);
}

console.log(`Found ${files.length} files with console logs\n`);

let totalRemoved = 0;

for (const file of files) {
  totalRemoved += removeConsoleLogs(file);
}

console.log(`\n✓ Removed ${totalRemoved} console log statements across ${files.length} files`);
console.log('Note: console.error and console.warn were preserved for production debugging');
