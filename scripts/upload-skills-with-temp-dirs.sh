#!/bin/bash

# Upload Claude Skills using curl with proper directory structure
# The Anthropic Skills API requires files to be in a top-level folder

set -e

if [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$EXPO_PUBLIC_ANTHROPIC_API_KEY" ]; then
  echo "❌ Error: ANTHROPIC_API_KEY or EXPO_PUBLIC_ANTHROPIC_API_KEY must be set"
  exit 1
fi

API_KEY="${ANTHROPIC_API_KEY:-$EXPO_PUBLIC_ANTHROPIC_API_KEY}"

echo "🚀 Uploading Claude Skills to Anthropic"
echo ""

# Array of skills to upload
declare -a SKILLS=(
  "tidal-opportunism-analyst:Identifies current-driven opportunities, eddies, and anchoring decisions using bathymetry and WorldTides intel"
  "slack-window-planner:Builds maneuver timelines around upcoming slack, high, and low water windows"
  "current-counterplay-advisor:Advises on current-based tactics against opponents (lee bow, cover, split timing)"
)

SUCCESS=0
FAILED=0

for skill_info in "${SKILLS[@]}"; do
  IFS=':' read -r skill_name skill_desc <<< "$skill_info"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📤 Uploading: $skill_name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Create temporary directory with the skill name
  TEMP_DIR=$(mktemp -d)
  SKILL_DIR="$TEMP_DIR/$skill_name"
  mkdir -p "$SKILL_DIR"

  # Copy the SKILL.md file to the temp directory
  if [ -f "skills/$skill_name/SKILL.md" ]; then
    cp "skills/$skill_name/SKILL.md" "$SKILL_DIR/SKILL.md"
  else
    echo "❌ Skill file not found: skills/$skill_name/SKILL.md"
    FAILED=$((FAILED + 1))
    rm -rf "$TEMP_DIR"
    continue
  fi

  # Change to temp directory so the file path is relative
  cd "$SKILL_DIR"

  # Upload using curl with multipart form data
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://api.anthropic.com/v1/skills" \
    -H "x-api-key: $API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "anthropic-beta: skills-2025-10-02" \
    -F "name=$skill_name" \
    -F "description=$skill_desc" \
    -F "files[]=@SKILL.md")

  # Change back to original directory
  cd - > /dev/null

  # Extract HTTP code and body
  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    SKILL_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "✅ Success! Skill ID: $SKILL_ID"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "❌ Failed (HTTP $HTTP_CODE)"
    echo "$BODY" | head -5
    FAILED=$((FAILED + 1))
  fi

  # Clean up temp directory
  rm -rf "$TEMP_DIR"

  # Be nice to the API
  sleep 1
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Upload Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Successful: $SUCCESS"
echo "❌ Failed: $FAILED"
echo "📝 Total: ${#SKILLS[@]}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 All skills uploaded successfully!"
  exit 0
else
  echo "⚠️ Some skills failed to upload"
  exit 1
fi
