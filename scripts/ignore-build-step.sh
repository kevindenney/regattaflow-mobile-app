#!/bin/bash
# Vercel Ignored Build Step
# https://vercel.com/docs/projects/overview#ignored-build-step
#
# Exit 0 = skip build, Exit 1 = proceed with build
#
# Skips builds when only non-web files changed (native-only, migrations, docs, tests).

echo "🔍 Checking if build is needed..."

# Always build on production (main branch)
if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  # Even on main, skip if only irrelevant files changed
  CHANGED=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "FORCE_BUILD")

  if [ "$CHANGED" = "FORCE_BUILD" ]; then
    echo "✅ Cannot determine changes, proceeding with build"
    exit 1
  fi

  # Patterns that DON'T need a web rebuild
  SKIP_PATTERNS="\.native\.tsx$|\.native\.ts$|\.android\.|\.ios\.|supabase/migrations/|supabase/functions/|\.maestro/|\.github/|docs/|scripts/__tests__/|\.md$|eas\.json|\.maestro|seeds/"

  # Check if ALL changed files match skip patterns
  NON_SKIPPABLE=$(echo "$CHANGED" | grep -vE "$SKIP_PATTERNS" || true)

  if [ -z "$NON_SKIPPABLE" ]; then
    echo "⏭️  Only non-web files changed, skipping build:"
    echo "$CHANGED"
    exit 0
  fi

  echo "✅ Web-relevant files changed, proceeding with build:"
  echo "$NON_SKIPPABLE"
  exit 1
fi

# For preview branches, be more aggressive about skipping
if [ "$VERCEL_ENV" = "preview" ]; then
  echo "⏭️  Skipping preview deployment (disabled to save build minutes)"
  exit 0
fi

# Default: build
echo "✅ Proceeding with build"
exit 1
