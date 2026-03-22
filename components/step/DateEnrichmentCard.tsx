/**
 * DateEnrichmentCard — Collapsible card showing weather, tide, and rig suggestions
 * for a detected date in a sailing brain dump.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { STEP_COLORS } from '@/lib/step-theme';
import type { DateEnrichment } from '@/types/step-detail';

interface DateEnrichmentCardProps {
  dateLabel: string;
  dateIso: string;
  enrichment?: DateEnrichment;
  isLoading?: boolean;
}

function windDirectionArrow(degrees: number): string {
  const arrows = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return arrows[index];
}

export function DateEnrichmentCard({ dateLabel, dateIso: _dateIso, enrichment, isLoading }: DateEnrichmentCardProps) {
  const [expanded, setExpanded] = useState(true);

  if (!enrichment && !isLoading) return null;

  const hasContent = enrichment && (enrichment.wind || enrichment.tide || enrichment.rig_suggestion || enrichment.sail_suggestion);

  return (
    <View style={styles.card}>
      <Pressable style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={styles.headerLeft}>
          <Ionicons name="partly-sunny-outline" size={16} color={IOS_COLORS.systemIndigo} />
          <Text style={styles.headerTitle}>Conditions for {dateLabel}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={STEP_COLORS.secondaryLabel}
        />
      </Pressable>

      {expanded && (
        <View style={styles.content}>
          {isLoading && !hasContent && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={IOS_COLORS.systemIndigo} />
              <Text style={styles.loadingText}>Fetching conditions...</Text>
            </View>
          )}

          {enrichment?.wind && (
            <View style={styles.row}>
              <View style={styles.iconBadge}>
                <Ionicons name="flag-outline" size={14} color={IOS_COLORS.systemBlue} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Wind</Text>
                <Text style={styles.rowValue}>
                  {enrichment.wind.speed_knots} kts {windDirectionArrow(enrichment.wind.direction)}
                  {enrichment.wind.gusts ? ` (G${enrichment.wind.gusts})` : ''}
                </Text>
              </View>
            </View>
          )}

          {enrichment?.tide && (
            <View style={styles.row}>
              <View style={styles.iconBadge}>
                <Ionicons name="water-outline" size={14} color={IOS_COLORS.systemTeal} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Tide</Text>
                <Text style={styles.rowValue}>
                  {enrichment.tide.state} ({enrichment.tide.height_m}m)
                </Text>
              </View>
            </View>
          )}

          {enrichment?.sail_suggestion && (
            <View style={styles.row}>
              <View style={styles.iconBadge}>
                <Ionicons name="boat-outline" size={14} color={IOS_COLORS.systemOrange} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Sails</Text>
                <Text style={styles.rowValue}>{enrichment.sail_suggestion}</Text>
              </View>
            </View>
          )}

          {enrichment?.rig_suggestion && (
            <View style={styles.row}>
              <View style={styles.iconBadge}>
                <Ionicons name="construct-outline" size={14} color={IOS_COLORS.systemPurple} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Rig</Text>
                <Text style={styles.rowValue}>{enrichment.rig_suggestion}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(88,86,214,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(88,86,214,0.12)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.xs + 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.systemIndigo,
  },
  content: {
    paddingHorizontal: IOS_SPACING.sm,
    paddingBottom: IOS_SPACING.sm,
    gap: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  loadingText: {
    fontSize: 13,
    color: STEP_COLORS.secondaryLabel,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  rowContent: {
    flex: 1,
    gap: 1,
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: STEP_COLORS.secondaryLabel,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  rowValue: {
    fontSize: 13,
    color: STEP_COLORS.label,
    lineHeight: 18,
  },
});
