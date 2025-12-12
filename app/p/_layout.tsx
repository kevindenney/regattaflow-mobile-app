/**
 * Public Pages Layout
 * No authentication required - these pages are accessible to anyone
 */

import { Stack } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

export default function PublicLayout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F8FAFC' },
          animation: Platform.OS === 'ios' ? 'default' : 'fade',
        }}
      >
        <Stack.Screen name="[regattaId]" />
        <Stack.Screen name="results/[regattaId]" />
        <Stack.Screen name="schedule/[regattaId]" />
        <Stack.Screen name="notices/[regattaId]" />
        <Stack.Screen name="strategy/[token]" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});

