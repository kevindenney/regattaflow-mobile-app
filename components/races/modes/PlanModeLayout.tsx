/**
 * PLAN Mode Layout
 * Shore-based race planning and preparation interface
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useLayoutContext } from '../ResponsiveRaceLayout';

interface PlanModeLayoutProps {
  raceId: string | null;
  raceData: any;
  children?: React.ReactNode;
}

export function PlanModeLayout({
  raceId,
  raceData,
  children,
}: PlanModeLayoutProps) {
  const layout = useLayoutContext();

  // Tablet landscape: two-column layout
  if (layout.isTablet && layout.isLandscape) {
    return (
      <View style={styles.container}>
        {/* Left Column: Map */}
        <View style={styles.leftColumn}>
          {/* TODO: Tactical map goes here */}
          <View style={styles.placeholder}>
            {/* Map placeholder */}
          </View>
        </View>

        {/* Right Column: Content */}
        <ScrollView
          style={styles.rightColumn}
          contentContainerStyle={styles.scrollContent}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  // Default: single column portrait layout
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  leftColumn: {
    flex: 6,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  rightColumn: {
    flex: 4,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#e5e7eb',
  },
});
