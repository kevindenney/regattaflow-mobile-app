import React from 'react';
import { View, Text } from 'react-native';

/**
 * Base tactical.tsx file - Required by Expo Router
 *
 * Platform-specific implementations:
 * - tactical.native.tsx - Full tactical race timer for iOS/Android with GPS and maps
 * - tactical.web.tsx - Fallback message for web
 *
 * This base file should never actually be used since platform-specific
 * files take precedence, but Expo Router requires it to exist.
 */
export default function TacticalRaceTimer() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Tactical Race Timer
      </Text>
      <Text style={{ textAlign: 'center', color: '#666' }}>
        This feature requires GPS and is only available on mobile devices.{'\n'}
        Please use the iOS or Android app for tactical race tracking.
      </Text>
    </View>
  );
}
