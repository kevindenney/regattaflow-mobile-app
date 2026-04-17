/**
 * CompetencyCard — Individual capability card for the "Working On" / "Needs Attention" views.
 *
 * Shows: title, category tag, status badge, attempts count, last practiced relative time.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COMPETENCY_STATUS_CONFIG, type CompetencyWithProgress } from '@/types/competency';

interface Props {
  competency: CompetencyWithProgress;
  onPress: (competencyId: string) => void;
}

function formatRelativeTime(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function CompetencyCard({ competency, onPress }: Props) {
  const status = competency.progress?.status ?? 'not_started';
  const config = COMPETENCY_STATUS_CONFIG[status];
  const attempts = competency.progress?.attempts_count ?? 0;
  const lastAt = formatRelativeTime(competency.progress?.last_attempt_at ?? null);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(competency.id)}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon as any} size={12} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {competency.title}
      </Text>

      {/* Category + meta */}
      <View style={styles.metaRow}>
        <Text style={styles.category} numberOfLines={1}>
          {competency.category}
        </Text>

        {(attempts > 0 || lastAt) && (
          <View style={styles.statsRow}>
            {attempts > 0 && (
              <Text style={styles.statText}>
                {attempts} attempt{attempts !== 1 ? 's' : ''}
              </Text>
            )}
            {attempts > 0 && lastAt && <Text style={styles.statDot}>·</Text>}
            {lastAt && <Text style={styles.statText}>{lastAt}</Text>}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statDot: {
    fontSize: 12,
    color: '#CBD5E1',
  },
});
