#!/bin/bash

# Auto-import all 100 batches of OSM marinas to Supabase
# This script uses the Supabase connection to import batches sequentially

echo "🚀 Starting OSM Marina Import"
echo "================================"
echo "Importing 100 batches (50 marinas each = 5,000 total)"
echo ""

BATCH_DIR="data/batches"
TOTAL_BATCHES=100
IMPORTED=0
FAILED=0

for i in $(seq -f "%03g" 1 $TOTAL_BATCHES); do
  BATCH_FILE="$BATCH_DIR/batch-$i.sql"

  if [ ! -f "$BATCH_FILE" ]; then
    echo "❌ Batch $i file not found: $BATCH_FILE"
    ((FAILED++))
    continue
  fi

  echo "📦 Importing batch $i/$TOTAL_BATCHES..."

  # Read the SQL file and execute via psql
  # You need to set your DATABASE_URL environment variable
  if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set"
    echo "   Get your connection string from Supabase Dashboard"
    echo "   Then run: export DATABASE_URL='your-connection-string'"
    exit 1
  fi

  psql "$DATABASE_URL" -f "$BATCH_FILE" > /dev/null 2>&1

  if [ $? -eq 0 ]; then
    ((IMPORTED+=50))
    if [ $((${i#0} % 10)) -eq 0 ]; then
      echo "   ✅ Progress: $IMPORTED marinas imported"
    fi
  else
    echo "   ❌ Batch $i failed"
    ((FAILED++))
  fi

  # Small delay to avoid overwhelming the database
  sleep 0.1
done

echo ""
echo "================================"
echo "✅ Import Complete!"
echo "================================"
echo "📊 Imported: $IMPORTED marinas"
echo "❌ Failed batches: $FAILED"
echo ""
echo "Verify with:"
echo "psql \"\$DATABASE_URL\" -c \"SELECT COUNT(*) FROM sailing_venues WHERE data_source='osm';\""
