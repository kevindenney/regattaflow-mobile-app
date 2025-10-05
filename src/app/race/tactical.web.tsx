import React from 'react';
import { View, Text } from 'react-native';

export default function TacticalWebFallback() {
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
