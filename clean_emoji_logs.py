#!/usr/bin/env python3
"""
Clean emoji debug logs from TypeScript/JavaScript files.
Removes console.log/error/warn statements that start with emoji characters.
"""

import re
import os
import glob

# Define emoji patterns to search for
EMOJI_PATTERN = r"[🚨🏁🔴⚠️🎬🗺️❌✅🔄🌊🧹📍🎯🤖📤💾🗑️📋📝🎨🚫↩️📏🎥🌍💡🖱️🔥]"

# Pattern 1: Match standalone console statements with emojis (on their own line)
STANDALONE_PATTERN = re.compile(
    r"^\s*console\.(log|error|warn)\(['\"]" + EMOJI_PATTERN + r"[^)]*\);\s*$",
    re.MULTILINE
)

# Pattern 2: Match inline console statements with emojis (like in callbacks)
INLINE_PATTERN = re.compile(
    r"console\.(log|error|warn)\(['\"]" + EMOJI_PATTERN + r"[^)]*\)",
    re.MULTILINE
)

def clean_file(filepath):
    """Remove emoji debug logs from a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # First remove standalone console statements with emojis
        content = STANDALONE_PATTERN.sub('', content)

        # Then handle inline console statements
        # For inline, we need to be more careful to preserve the rest of the line
        lines = content.split('\n')
        cleaned_lines = []

        for line in lines:
            # Check if line contains inline emoji console statement
            if INLINE_PATTERN.search(line):
                # Check if line has other code before/after the console statement
                # If it's ONLY the console statement, remove the whole line
                if re.match(r'^\s*console\.(log|error|warn)\([\'"]' + EMOJI_PATTERN, line):
                    # Check if there's meaningful code after
                    after_console = re.sub(r'console\.(log|error|warn)\([^)]*\);?\s*', '', line)
                    if after_console.strip() in ['', '}', '{', '},', '{,']:
                        # Line only contains console or trivial syntax
                        continue
                else:
                    # Has code before console, try to preserve it
                    # For now, skip this edge case as it's uncommon
                    cleaned_lines.append(line)
            else:
                cleaned_lines.append(line)

        content = '\n'.join(cleaned_lines)

        # If content changed, write it back
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    """Clean all TypeScript and JavaScript files in the project."""
    patterns = [
        'components/**/*.tsx',
        'components/**/*.ts',
        'services/**/*.tsx',
        'services/**/*.ts',
        'app/**/*.tsx',
        'app/**/*.ts',
        'lib/**/*.tsx',
        'lib/**/*.ts',
        'hooks/**/*.tsx',
        'hooks/**/*.ts',
        'providers/**/*.tsx',
        'providers/**/*.ts',
        'scripts/**/*.tsx',
        'scripts/**/*.ts',
    ]

    files_cleaned = 0
    total_files = 0

    for pattern in patterns:
        for filepath in glob.glob(pattern, recursive=True):
            # Skip node_modules and other excluded directories
            if 'node_modules' in filepath or '.git' in filepath:
                continue

            total_files += 1
            if clean_file(filepath):
                files_cleaned += 1
                print(f"Cleaned: {filepath}")

    print(f"\n✅ Cleanup complete!")
    print(f"Files processed: {total_files}")
    print(f"Files cleaned: {files_cleaned}")

if __name__ == '__main__':
    main()
