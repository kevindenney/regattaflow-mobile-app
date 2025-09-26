/**
 * Venue Intelligence Tab
 * Showcases RegattaFlow's "OnX Maps for Sailing" global venue intelligence system
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VenueIntelligenceDisplay } from '@/src/components/venue/VenueIntelligenceDisplay';

export default function VenueScreen() {
  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title">🌍 Global Venue Intelligence</ThemedText>
        <ThemedText style={styles.subtitle}>
          OnX Maps for Sailing - Globally intelligent, locally expert
        </ThemedText>
      </View>

      {/* Main Intelligence Display */}
      <VenueIntelligenceDisplay style={styles.intelligence} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  intelligence: {
    flex: 1,
  },
});