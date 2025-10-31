#!/usr/bin/env python3
"""
Enhanced emoji log cleanup script - removes ALL console statements with emojis
"""

import re
import os
import glob

# Expanded emoji pattern to catch ALL emojis commonly used in debug logs
EMOJI_PATTERN = r"[🚨🏁🔴⚠️🎬🗺️❌✅🔄🌊🧹📍🎯🤖📤💾🗑️📋📝🎨🚫↩️📏🎥🌍💡🖱️🔥⚙️⏱️🏷️🌤️🧭📧🚀🛰️🌬️🛎️📊📐💥👤📅]"

def clean_file(filepath):
    """Remove all console.log/error/warn statements containing emojis"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        lines = content.split('\n')
        cleaned_lines = []
        skip_next = False

        for i, line in enumerate(lines):
            # Skip if marked from previous line
            if skip_next:
                skip_next = False
                continue

            # Check if line contains console statement with emoji
            if re.search(r'console\.(log|error|warn)\(', line) and re.search(EMOJI_PATTERN, line):
                # Check if it's a multi-line statement (doesn't end with );)
                if not line.rstrip().endswith(');') and not line.rstrip().endswith(')'):
                    # Multi-line - need to find where it ends
                    j = i + 1
                    while j < len(lines):
                        if ');' in lines[j] or ')' in lines[j]:
                            # Mark all lines from i to j for removal
                            for k in range(i, j + 1):
                                if k < len(lines):
                                    lines[k] = '__REMOVE__'
                            break
                        j += 1
                    continue
                else:
                    # Single line - remove it
                    continue

            cleaned_lines.append(line)

        # Remove marked lines
        cleaned_lines = [line for line in cleaned_lines if line != '__REMOVE__']
        new_content = '\n'.join(cleaned_lines)

        if new_content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    patterns = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']
    exclude_dirs = {'node_modules', '.git', 'build', 'dist', '.expo'}

    all_files = []
    for pattern in patterns:
        files = glob.glob(pattern, recursive=True)
        all_files.extend([f for f in files if not any(ex in f for ex in exclude_dirs)])

    cleaned_count = 0
    for filepath in all_files:
        if clean_file(filepath):
            cleaned_count += 1
            print(f"Cleaned: {filepath}")

    print(f"\n✅ Cleanup complete!")
    print(f"Files processed: {len(all_files)}")
    print(f"Files cleaned: {cleaned_count}")

if __name__ == '__main__':
    main()
