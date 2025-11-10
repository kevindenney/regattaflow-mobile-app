#!/bin/bash

# Apply RLS policy to allow public read access to clubs table

echo "🔒 Applying public read policy to clubs table..."

# Read the migration file
MIGRATION_FILE="supabase/migrations/20251108130000_allow_public_clubs_read.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  exit 1
fi

# Get connection string from .env
if [ -f .env ]; then
  export $(grep SUPABASE_DB_URL .env | xargs)
fi

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "❌ SUPABASE_DB_URL not found in .env"
  echo "Please add the RLS policy manually in Supabase dashboard:"
  cat "$MIGRATION_FILE"
  exit 1
fi

# Apply the migration using psql
psql "$SUPABASE_DB_URL" < "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo "✅ RLS policy applied successfully!"
else
  echo "❌ Failed to apply RLS policy"
  echo "Please add it manually in Supabase dashboard:"
  cat "$MIGRATION_FILE"
fi
