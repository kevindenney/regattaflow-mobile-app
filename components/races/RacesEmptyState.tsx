/**
 * RacesEmptyState — Positive framing empty state for the Races tab.
 *
 * Shown when a sailor has no races. Encourages adding their first race
 * or exploring a demo race.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RacesEmptyStateProps {
  onAddRace: () => void;
  onExploreDemoRace: () => void;
}

export function RacesEmptyState({ onAddRace, onExploreDemoRace }: RacesEmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="flag" size={48} color="#3B82F6" />
      </View>

      <Text style={styles.title}>Your Race Timeline</Text>
      <Text style={styles.description}>
        Add your first race to get countdown timers, weather forecasts, prep checklists, and AI strategy analysis.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={onAddRace} activeOpacity={0.8}>
        <Ionicons name="add-circle" size={20} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Add a Race</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={onExploreDemoRace} activeOpacity={0.7}>
        <Ionicons name="compass-outline" size={18} color="#3B82F6" />
        <Text style={styles.secondaryButtonText}>Explore a Demo Race</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 320,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '500',
  },
});
