/**
 * Embed Pages Layout
 * Minimal layout for embeddable widgets - no navigation chrome
 */

import { Stack } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

export default function EmbedLayout() {
  // Minimal container for embedding
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'none',
        }}
      >
        <Stack.Screen name="results" />
        <Stack.Screen name="schedule" />
        <Stack.Screen name="notices" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="standings" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Ensure iframe fills container
    ...(Platform.OS === 'web' ? {
      minHeight: '100%',
      width: '100%',
    } : {}),
  },
});

