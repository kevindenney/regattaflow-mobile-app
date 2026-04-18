#!/usr/bin/env bash
#
# Time Machine exclusion script for dev folders
# ----------------------------------------------
# Excludes regenerable dev folders (node_modules, build outputs, caches)
# from Time Machine backups. Run periodically as new projects are added.
#
# Usage:
#   ./tm-exclude-dev-junk.sh          # add exclusions
#   ./tm-exclude-dev-junk.sh --dry    # show what would be excluded, change nothing
#   ./tm-exclude-dev-junk.sh --list   # list current exclusions only
#   ./tm-exclude-dev-junk.sh --remove # remove all dev exclusions added by this script
#
# Notes:
# - Uses `tmutil addexclusion` (no -p flag) which excludes by path
# - Safe to re-run; tmutil silently ignores already-excluded paths
# - Only touches paths under ~/Developer

set -euo pipefail

DEV_ROOT="$HOME/Developer"

# Folder names to exclude wherever they appear under ~/Developer
EXCLUDE_NAMES=(
  "node_modules"
  ".next"
  ".expo"
  ".turbo"
  "dist"
  "build"
  "Pods"
  "DerivedData"
  ".gradle"
  ".cxx"
  "__pycache__"
  ".venv"
  "venv"
  ".pytest_cache"
  ".mypy_cache"
  "target"        # Rust
  ".cache"
)

# Additional explicit Library paths to exclude (system-wide caches)
EXTRA_PATHS=(
  "$HOME/Library/Caches"
  "$HOME/Library/Developer/Xcode/DerivedData"
  "$HOME/Library/Developer/CoreSimulator/Caches"
)

MODE="${1:-add}"

color() { printf "\033[%sm%s\033[0m" "$1" "$2"; }
green() { color "32" "$1"; }
yellow() { color "33" "$1"; }
red() { color "31" "$1"; }
cyan() { color "36" "$1"; }

if [[ ! -d "$DEV_ROOT" ]]; then
  echo "$(red "Error:") $DEV_ROOT does not exist"
  exit 1
fi

case "$MODE" in
  --list|-l)
    echo "$(cyan "Current Time Machine exclusions:")"
    tmutil isexcluded "$DEV_ROOT" 2>/dev/null || true
    # tmutil doesn't have a "list all" — closest is to check known paths
    echo ""
    echo "Tip: System Settings → Time Machine → Options shows the full list."
    exit 0
    ;;
esac

echo "$(cyan "Scanning") $DEV_ROOT for excludable folders..."
echo ""

# Build find expression for the named folders
find_args=()
for name in "${EXCLUDE_NAMES[@]}"; do
  find_args+=( -name "$name" -o )
done
# Remove trailing -o
unset 'find_args[${#find_args[@]}-1]'

# Find matching folders, prune at first match (don't descend into them)
# Bash 3.2-compatible (no mapfile)
found_paths=()
while IFS= read -r line; do
  found_paths+=( "$line" )
done < <(find "$DEV_ROOT" \( "${find_args[@]}" \) -type d -prune 2>/dev/null)

# Add the explicit Library paths
for p in "${EXTRA_PATHS[@]}"; do
  [[ -d "$p" ]] && found_paths+=( "$p" )
done

count=${#found_paths[@]}
total_size=0

if [[ $count -eq 0 ]]; then
  echo "$(yellow "No matching folders found.")"
  exit 0
fi

echo "Found $(green "$count") folders to process:"
echo ""

added=0
skipped=0
removed=0
errors=0

for path in "${found_paths[@]}"; do
  # Get size in bytes for reporting (single-line guaranteed)
  size_bytes=$(du -sk "$path" 2>/dev/null | awk 'NR==1{print $1 * 1024; exit}')
  [[ -z "$size_bytes" ]] && size_bytes=0
  size_human=$(du -sh "$path" 2>/dev/null | awk 'NR==1{print $1; exit}')
  [[ -z "$size_human" ]] && size_human="?"
  total_size=$((total_size + size_bytes))

  case "$MODE" in
    --dry|--dry-run|-n)
      printf "  %s  %s\n" "$(yellow "[DRY]")" "$path  ($size_human)"
      ;;
    --remove|-r)
      if tmutil removeexclusion "$path" 2>/dev/null; then
        printf "  %s  %s\n" "$(red "[REMOVED]")" "$path"
        removed=$((removed + 1))
      else
        errors=$((errors + 1))
      fi
      ;;
    add|*)
      if tmutil isexcluded "$path" 2>/dev/null | grep -q "\[Excluded\]"; then
        printf "  %s  %s\n" "$(yellow "[SKIP]")" "$path  (already excluded)"
        skipped=$((skipped + 1))
      else
        if tmutil addexclusion "$path" 2>/dev/null; then
          printf "  %s  %s  $(cyan "(%s)")\n" "$(green "[ADD]")" "$path" "$size_human"
          added=$((added + 1))
        else
          printf "  %s  %s\n" "$(red "[ERR]")" "$path"
          errors=$((errors + 1))
        fi
      fi
      ;;
  esac
done

# Convert total to human-readable
total_human=$(echo "$total_size" | awk '{
  if ($1 > 1073741824) printf "%.1f GB", $1/1073741824
  else if ($1 > 1048576) printf "%.1f MB", $1/1048576
  else printf "%d KB", $1/1024
}')

echo ""
echo "$(cyan "Summary:")"
case "$MODE" in
  --dry|--dry-run|-n)
    echo "  Would exclude: $count folders ($total_human)"
    echo "  Run without --dry to apply"
    ;;
  --remove|-r)
    echo "  Removed: $(green "$removed") | Errors: $(red "$errors")"
    ;;
  *)
    echo "  Added:   $(green "$added")"
    echo "  Skipped: $(yellow "$skipped")  (already excluded)"
    echo "  Errors:  $(red "$errors")"
    echo "  Total size now excluded: $(green "$total_human")"
    ;;
esac

echo ""
echo "$(cyan "Verify in:") System Settings → Time Machine → Options"
