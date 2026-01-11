#!/bin/bash

# EAS Build hook to fix react-native-maps Google Maps podspec issue
# This runs before pod install and removes the invalid react-native-google-maps reference

set -e

echo "🔧 Running pre-install hook: Fixing react-native-maps Podfile..."

if [ -f "ios/Podfile" ]; then
  # Remove any lines that reference react-native-google-maps as a separate pod
  # (but keep react-native-maps with Google subspec)
  sed -i.bak "s/pod 'react-native-google-maps'.*$/# react-native-google-maps removed - using react-native-maps with Google subspec/g" ios/Podfile

  echo "✅ Podfile patched successfully"
  echo "📄 Podfile contents:"
  grep -n "react-native" ios/Podfile || true
else
  echo "⚠️ ios/Podfile not found, skipping patch"
fi
