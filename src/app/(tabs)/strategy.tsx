import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function StrategyScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Strategy</ThemedText>
        <ThemedText type="subtitle">AI-powered racing insights</ThemedText>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <ThemedText type="subtitle">🧠 AI Recommendations</ThemedText>
          <ThemedText type="default">
            • Start at committee boat end - better current
          </ThemedText>
          <ThemedText type="default">
            • Expect 15° right shift in 20 minutes
          </ThemedText>
          <ThemedText type="default">
            • Port tack favored on first beat
          </ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle">🌊 Current Conditions</ThemedText>
          <ThemedText type="default">Wind: 12-15 kts SW</ThemedText>
          <ThemedText type="default">Current: 0.8 kts flood</ThemedText>
          <ThemedText type="default">Waves: 1-2 ft</ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle">📈 Performance Analysis</ThemedText>
          <ThemedText type="default">• Last race: 15% better upwind speed</ThemedText>
          <ThemedText type="default">• Improvement area: Mark roundings</ThemedText>
          <ThemedText type="default">• Strong in: Light air reaching</ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle">👥 Team Strategy</ThemedText>
          <ThemedText type="default">• Shared notes with crew</ThemedText>
          <ThemedText type="default">• Pre-race briefing checklist</ThemedText>
          <ThemedText type="default">• Communication plan</ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
});