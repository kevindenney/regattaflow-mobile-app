/**
 * CompetencySummaryBar — Actionable stats strip for Reflect → Progress.
 *
 * Shows: "X in progress · Y ready for checkoff · Last: [name], Zd ago"
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COMPETENCY_STATUS_CONFIG } from '@/types/competency';
import type { ActionableSummary } from '@/hooks/useCompetencyReflectData';

interface Props {
  summary: ActionableSummary;
  total: number;
  completed: number;
  percent: number;
}

export function CompetencySummaryBar({ summary, total, completed, percent }: Props) {
  const { inProgress, checkoffReady, lastPracticedName, lastPracticedDaysAgo } = summary;

  const lastPracticedText = lastPracticedName
    ? lastPracticedDaysAgo === 0
      ? 'today'
      : lastPracticedDaysAgo === 1
        ? 'yesterday'
        : `${lastPracticedDaysAgo}d ago`
    : null;

  return (
    <View style={styles.container}>
      {/* Overall progress */}
      <View style={styles.progressRow}>
        <Text style={styles.percentText}>{percent}%</Text>
        <Text style={styles.progressLabel}>
          {completed} of {total} capabilities
        </Text>
      </View>

      {/* Status pills */}
      <View style={styles.pillRow}>
        {inProgress > 0 && (
          <View style={[styles.pill, { backgroundColor: COMPETENCY_STATUS_CONFIG.practicing.bg }]}>
            <Ionicons
              name={COMPETENCY_STATUS_CONFIG.practicing.icon as any}
              size={12}
              color={COMPETENCY_STATUS_CONFIG.practicing.color}
            />
            <Text style={[styles.pillText, { color: COMPETENCY_STATUS_CONFIG.practicing.color }]}>
              {inProgress} in progress
            </Text>
          </View>
        )}

        {checkoffReady > 0 && (
          <View style={[styles.pill, { backgroundColor: COMPETENCY_STATUS_CONFIG.checkoff_ready.bg }]}>
            <Ionicons
              name={COMPETENCY_STATUS_CONFIG.checkoff_ready.icon as any}
              size={12}
              color={COMPETENCY_STATUS_CONFIG.checkoff_ready.color}
            />
            <Text style={[styles.pillText, { color: COMPETENCY_STATUS_CONFIG.checkoff_ready.color }]}>
              {checkoffReady} ready for checkoff
            </Text>
          </View>
        )}
      </View>

      {/* Last practiced */}
      {lastPracticedName && lastPracticedText && (
        <Text style={styles.lastPracticed} numberOfLines={1}>
          Last practiced: {lastPracticedName} · {lastPracticedText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  percentText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lastPracticed: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
