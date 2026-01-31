#!/bin/bash
# Custom prebuild script for iOS that fixes the Podfile after expo prebuild

set -e

echo "Running expo prebuild for iOS..."
npx expo prebuild --platform ios --clean

echo "Fixing Podfile for react-native-maps Google Maps support..."
PODFILE="ios/Podfile"

if [[ -f "$PODFILE" ]]; then
  # Remove the auto-generated react-native-google-maps block (which references non-existent podspec)
  sed -i '' '/# @generated begin react-native-maps/,/# @generated end react-native-maps/d' "$PODFILE"

  # Remove any standalone react-native-google-maps pod lines
  sed -i '' '/pod.*react-native-google-maps/d' "$PODFILE"

  echo "Podfile fixed successfully"

  # Show the relevant part of the Podfile for debugging
  echo "--- Podfile Google Maps section ---"
  grep -A3 "Google Maps" "$PODFILE" || echo "Google Maps section not found"
  echo "---"
else
  echo "Warning: Podfile not found at $PODFILE"
fi
