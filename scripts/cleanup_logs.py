#!/usr/bin/env python3
"""
Automated Console Log Cleanup Script

This script:
1. Finds all console.log statements in TypeScript/TSX files
2. Replaces console.log with logger.debug (for useful logs)
3. Removes debug logs with emojis and verbose debugging
4. Adds logger import if needed
5. Preserves console.error and console.warn
"""

import os
import re
import sys
from pathlib import Path
from typing import Tuple

# Statistics
stats = {
    'files_processed': 0,
    'logs_replaced': 0,
    'logs_removed': 0,
    'imports_added': 0,
}

# Emoji and debug patterns to remove entirely
EMOJI_PATTERN = re.compile(r'console\.log\([^)]*[\U0001F300-\U0001F9FF\u2600-\u26FF\u2700-\u27BF][^)]*\)')
DEBUG_KEYWORDS = ['DEBUG', 'debug', 'Testing', 'TEST', 'temp', 'TEMP', 'TODO']

def should_remove_log(line: str) -> bool:
    """Check if a log line should be removed entirely"""
    # Remove emoji logs
    if EMOJI_PATTERN.search(line):
        return True

    # Remove debug keyword logs
    for keyword in DEBUG_KEYWORDS:
        if f"'{keyword}" in line or f'"{keyword}' in line:
            return True

    # Remove separator lines
    if re.search(r"console\.log\(['\"][\s-]+['\"]\)", line):
        return True

    # Remove verbose patterns
    verbose_patterns = [
        r"Rendering",
        r"Component mounted",
        r"State updated",
        r"Props:",
        r"Data:",
    ]
    for pattern in verbose_patterns:
        if re.search(pattern, line, re.IGNORECASE):
            return True

    return False

def get_logger_context(file_path: str) -> str:
    """Get the component/file name for logger context"""
    return Path(file_path).stem

def has_logger_import(content: str) -> bool:
    """Check if file already has logger import"""
    return "from '@/lib/utils/logger'" in content or 'from "@/lib/utils/logger"' in content

def process_file(file_path: str, dry_run: bool = False) -> bool:
    """Process a single file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    lines = content.split('\n')

    # Check if file has console.log
    if 'console.log' not in content:
        return False

    # Count console.log occurrences
    console_log_count = content.count('console.log')
    if console_log_count == 0:
        return False

    print(f"\n📄 Processing: {file_path}")
    print(f"   Found {console_log_count} console.log statements")

    has_logger = has_logger_import(content)
    needs_logger = False
    logs_replaced = 0
    logs_removed = 0

    # Process lines
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]

        if 'console.log' in line:
            # Check if it's part of a multi-line console.log
            full_statement = line
            indent = len(line) - len(line.lstrip())

            # Capture multi-line console.log
            if '(' in line and ')' not in line:
                j = i + 1
                while j < len(lines) and ')' not in lines[j]:
                    full_statement += '\n' + lines[j]
                    j += 1
                if j < len(lines):
                    full_statement += '\n' + lines[j]
                i = j

            if should_remove_log(full_statement):
                # Remove this line(s)
                logs_removed += 1
                stats['logs_removed'] += 1
            else:
                # Replace with logger.debug
                new_line = line.replace('console.log', 'logger.debug')
                new_lines.append(new_line)
                logs_replaced += 1
                stats['logs_replaced'] += 1
                needs_logger = True
        else:
            new_lines.append(line)

        i += 1

    content = '\n'.join(new_lines)

    # Add logger import if needed
    if needs_logger and not has_logger:
        # Find the last import line
        import_pattern = re.compile(r"^import .* from ['\"].*['\"];?$", re.MULTILINE)
        imports = list(import_pattern.finditer(content))

        if imports:
            last_import = imports[-1]
            insertion_point = last_import.end()
            logger_import = "\nimport { createLogger } from '@/lib/utils/logger';"
            content = content[:insertion_point] + logger_import + content[insertion_point:]
            stats['imports_added'] += 1
        else:
            # No imports found, add at beginning
            logger_import = "import { createLogger } from '@/lib/utils/logger';\n\n"
            content = logger_import + content
            stats['imports_added'] += 1

        # Add logger instance
        component_name = get_logger_context(file_path)
        logger_instance = f"\nconst logger = createLogger('{component_name}');\n"

        # Find where to insert (after imports, before first export/const/function)
        first_code = re.search(r'^(export )?(const|function|class)', content, re.MULTILINE)
        if first_code:
            insertion_point = first_code.start()
            content = content[:insertion_point] + logger_instance + content[insertion_point:]

    # Clean up multiple empty lines
    content = re.sub(r'\n\n\n+', '\n\n', content)

    print(f"   ✅ Replaced: {logs_replaced}, Removed: {logs_removed}")

    if not dry_run and content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        stats['files_processed'] += 1
        return True

    return False

def main():
    """Main execution"""
    dry_run = '--dry-run' in sys.argv
    target_dir = '.'

    # Parse arguments
    for arg in sys.argv[1:]:
        if not arg.startswith('--'):
            target_dir = arg

    print('🧹 Console Log Cleanup Script')
    print('================================')
    print(f'Target: {target_dir}')
    print(f'Mode: {"DRY RUN" if dry_run else "WRITE"}')
    print('')

    # Find all TypeScript and TSX files
    exclude_dirs = {'node_modules', 'dist', 'build', '.expo', '.git'}
    exclude_files = {'logger.ts'}

    files_to_process = []
    for root, dirs, files in os.walk(target_dir):
        # Remove excluded directories from traversal
        dirs[:] = [d for d in dirs if d not in exclude_dirs]

        for file in files:
            if file.endswith(('.ts', '.tsx')) and file not in exclude_files:
                if not file.endswith(('.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx')):
                    files_to_process.append(os.path.join(root, file))

    print(f'Found {len(files_to_process)} files to process\n')

    # Process each file
    for file_path in files_to_process:
        try:
            process_file(file_path, dry_run)
        except Exception as e:
            print(f'❌ Error processing {file_path}: {e}')

    # Print summary
    print('\n================================')
    print('📊 Cleanup Summary')
    print('================================')
    print(f"Files processed: {stats['files_processed']}")
    print(f"Logs replaced with logger.debug: {stats['logs_replaced']}")
    print(f"Debug logs removed: {stats['logs_removed']}")
    print(f"Logger imports added: {stats['imports_added']}")
    print(f"Total logs cleaned: {stats['logs_replaced'] + stats['logs_removed']}")

    if dry_run:
        print('\n⚠️  This was a DRY RUN. No files were modified.')
        print('Run without --dry-run to apply changes.')
    else:
        print('\n✅ Cleanup complete!')

if __name__ == '__main__':
    main()
