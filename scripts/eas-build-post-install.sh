#!/bin/bash
# Runs after npm install, before expo prebuild
# We run prebuild ourselves so we can fix the Podfile before pod install

set -e

if [[ "$EAS_BUILD_PLATFORM" == "ios" ]]; then
  echo "=== Custom iOS prebuild with Podfile fix ==="

  # Run expo prebuild (this creates the ios folder)
  echo "Running expo prebuild..."
  npx expo prebuild --platform ios --clean

  # Fix the Podfile - remove the incorrect react-native-google-maps pod
  PODFILE="ios/Podfile"

  if [[ -f "$PODFILE" ]]; then
    echo "Fixing Podfile..."

    # Remove the auto-generated react-native-google-maps block
    # Using perl for better cross-platform compatibility (sed differs between macOS and Linux)
    perl -i -0pe 's/# @generated begin react-native-maps.*?# @generated end react-native-maps\n?//gs' "$PODFILE"

    # Also remove any standalone react-native-google-maps pod lines
    perl -i -pe 's/^\s*pod.*react-native-google-maps.*\n//g' "$PODFILE"

    echo "Podfile fixed!"

    # Verify the fix
    if grep -q "react-native-google-maps" "$PODFILE"; then
      echo "ERROR: react-native-google-maps still found in Podfile!"
      exit 1
    else
      echo "Verified: No react-native-google-maps references in Podfile"
    fi
  else
    echo "ERROR: Podfile not found!"
    exit 1
  fi

  echo "=== Custom prebuild complete ==="
fi
