/**
 * Racing Console Demo
 *
 * Demo page to test the new Racing Tactical Console
 * Access at: http://localhost:8081/racing-console-demo
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PreStartConsole } from '@/components/racing-console/PreStartConsole';
import { Colors, Typography, Spacing } from '@/constants/RacingDesignSystem';

export default function RacingConsoleDemo() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Racing Tactical Console Demo</Text>
        <Text style={styles.subtitle}>
          Pre-Start Console with AI Recommendations
        </Text>
      </View>

      <PreStartConsole
        startLineHeading={45}
        startLineLength={150}
        timeToStart={5}
        boatSpeed={6}
        courseHeading={50}
        boatLength={10}
        draft={2.5}
        onChipExpand={(chip) => {
          // Chip expanded callback
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ui.surface
  },

  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.primary.blue,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary.blue
  },

  title: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    marginBottom: Spacing.xs
  },

  subtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.inverse,
    opacity: 0.9
  }
});
