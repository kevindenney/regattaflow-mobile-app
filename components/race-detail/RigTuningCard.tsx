/**
 * Rig Tuning Card
 * Displays race-specific rig settings sourced from tuning guides and matched to forecast conditions.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StrategyCard } from './StrategyCard';
import type { RaceTuningRecommendation } from '@/services/RaceTuningService';

interface RigTuningCardProps {
  raceId: string;
  boatClassName?: string;
  recommendation?: RaceTuningRecommendation | null;
  loading?: boolean;
  onRefresh?: () => void;
}

type CardStatus = 'ready' | 'generating' | 'not_set';

export function RigTuningCard({
  raceId,
  boatClassName,
  recommendation,
  loading = false,
  onRefresh,
}: RigTuningCardProps) {
  const status: CardStatus = loading
    ? 'generating'
    : recommendation
      ? 'ready'
      : 'not_set';

  const statusMessage = loading
    ? 'Matching rig settings to forecast...'
    : recommendation
      ? undefined
      : 'Add tuning guides for this class';

  const sortedSettings = React.useMemo(() => {
    if (!recommendation?.settings) return [];

    const priority = [
      'upper_shrouds',
      'lower_shrouds',
      'forestay_length',
      'mast_rake',
      'spreader_sweep',
      'backstay_tension',
    ];

    return [...recommendation.settings].sort((a, b) => {
      const indexA = priority.indexOf(a.key);
      const indexB = priority.indexOf(b.key);

      if (indexA === -1 && indexB === -1) {
        return a.label.localeCompare(b.label);
      }
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [recommendation]);

  return (
    <StrategyCard
      icon="wrench-clock"
      title="Rig Tuning Checklist"
      status={status}
      statusMessage={statusMessage}
      actionLabel={onRefresh ? 'Refresh' : undefined}
      actionIcon={onRefresh ? 'refresh' : undefined}
      onAction={onRefresh}
    >
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading rig recommendations…</Text>
          </View>
        )}

        {!loading && !recommendation && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="book-cog-outline" size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No tuning data yet</Text>
            <Text style={styles.emptyText}>
              Add a tuning guide to your {boatClassName || 'class'} library to unlock race-day rig checklists.
            </Text>
          </View>
        )}

        {!loading && recommendation && (
          <>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <MaterialCommunityIcons name="text-box-check-outline" size={20} color="#3B82F6" />
                <View>
                  <Text style={styles.headerTitle}>{recommendation.sectionTitle || 'Matched Setup'}</Text>
                  {recommendation.conditionSummary && (
                    <Text style={styles.headerSubtitle}>
                      Target wind: {recommendation.conditionSummary}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.sourceBadge}
                onPress={onRefresh}
                disabled={!onRefresh}
                accessibilityLabel="Refresh tuning recommendations"
              >
                <MaterialCommunityIcons name="file-document-outline" size={14} color="#2563EB" />
                <Text style={styles.sourceText}>{recommendation.guideTitle}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsGrid}>
              {sortedSettings.map(setting => (
                <View key={`${raceId}-${setting.key}-${setting.value}`} style={styles.settingCard}>
                  <Text style={styles.settingLabel}>{setting.label}</Text>
                  <Text style={styles.settingValue}>{setting.value}</Text>
                  {setting.rawKey && setting.rawKey !== setting.label && (
                    <Text style={styles.settingMeta}>{setting.rawKey}</Text>
                  )}
                </View>
              ))}
            </View>

            {recommendation.notes && (
              <View style={styles.notes}>
                <MaterialCommunityIcons name="note-text-outline" size={16} color="#64748B" />
                <Text style={styles.notesText} numberOfLines={3}>
                  {recommendation.notes}
                </Text>
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Source: {recommendation.guideSource}
              </Text>
            </View>
          </>
        )}
      </View>
    </StrategyCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  loadingState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#1F2937',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sourceText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  settingCard: {
    flexBasis: '48%',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  settingMeta: {
    fontSize: 11,
    color: '#94A3B8',
  },
  notes: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },
  notesText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
  },
});
