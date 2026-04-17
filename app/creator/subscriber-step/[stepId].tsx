/**
 * Creator Step View — Read-only view of a subscriber's adopted step
 * with a mentoring panel for the blueprint author to provide feedback.
 */

import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StepDetailContent } from '@/components/step/StepDetailContent';
import { CreatorMentoringPanel } from '@/components/creator/CreatorMentoringPanel';

const C = {
  bg: '#FFFFFF',
  labelDark: '#1A1918',
  labelMid: '#6D6C6A',
  accent: '#00897B',
  border: '#E5E4E1',
} as const;

export default function CreatorStepViewScreen() {
  const router = useRouter();
  const { stepId } = useLocalSearchParams<{ stepId: string }>();

  if (!stepId) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={C.labelDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Review Step</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Subscriber's step content (read-only) */}
        <StepDetailContent stepId={stepId} readOnly />

        {/* Mentoring panel */}
        <CreatorMentoringPanel stepId={stepId} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.labelDark,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
