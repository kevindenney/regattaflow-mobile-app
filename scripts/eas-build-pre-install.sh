#!/bin/bash
# This script runs on EAS before pod install to fix the Podfile

if [[ "$EAS_BUILD_PLATFORM" == "ios" ]]; then
  echo "Fixing Podfile for react-native-maps Google Maps support..."

  PODFILE="ios/Podfile"

  if [[ -f "$PODFILE" ]]; then
    # Remove the auto-generated react-native-google-maps block (which references non-existent podspec)
    sed -i.bak '/# @generated begin react-native-maps/,/# @generated end react-native-maps/d' "$PODFILE"

    # Remove any standalone react-native-google-maps pod lines
    sed -i.bak '/pod.*react-native-google-maps/d' "$PODFILE"

    # Clean up backup files
    rm -f "$PODFILE.bak"

    echo "Podfile fixed successfully"
  fi
fi
