/**
 * RecentLearnings Component (Tufte-Style)
 *
 * Compact list of learning events with marginalia for metadata.
 * Simple check/warning symbols instead of colored icons.
 *
 * Tufte principles:
 * - Dense, scannable list format
 * - Marginalia for surfacing count
 * - Simple Unicode symbols (✓ △) instead of heavy icons
 * - No decorative backgrounds
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { LearnableEvent } from '@/types/adaptiveLearning';

interface RecentLearningsProps {
  events: LearnableEvent[];
  limit?: number;
  onViewAll?: () => void;
  onEventPress?: (event: LearnableEvent) => void;
}

export function RecentLearnings({
  events,
  limit = 5,
  onViewAll,
  onEventPress,
}: RecentLearningsProps) {
  const displayEvents = events.slice(0, limit);

  // Count outcomes
  const positiveCount = events.filter((e) => e.outcome === 'positive').length;
  const negativeCount = events.filter((e) => e.outcome === 'negative').length;

  if (displayEvents.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionHeader}>LEARNINGS</Text>
        </View>
        <View style={styles.divider} />
        <Text style={styles.emptyText}>
          Your learnings will appear here after races.
        </Text>
        <Text style={styles.emptySubtext}>
          Fill out post-race reflections to build your knowledge base.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Section header with stats in marginalia */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeader}>LEARNINGS</Text>
        <Text style={styles.marginalia}>
          {positiveCount} pos · {negativeCount} neg
        </Text>
      </View>
      <View style={styles.divider} />

      {/* Learning events as compact list */}
      {displayEvents.map((event) => {
        const isPositive = event.outcome === 'positive';
        const isNegative = event.outcome === 'negative';
        const symbol = isPositive ? '✓' : isNegative ? '△' : '·';

        return (
          <TouchableOpacity
            key={event.id}
            style={styles.eventRow}
            onPress={() => onEventPress?.(event)}
            activeOpacity={0.7}
          >
            {/* Outcome symbol */}
            <Text style={[
              styles.symbol,
              isPositive && styles.symbolPositive,
              isNegative && styles.symbolNegative,
            ]}>
              {symbol}
            </Text>

            {/* Event text */}
            <Text style={styles.eventText} numberOfLines={2}>
              {event.actionText || event.title}
            </Text>

            {/* Surfacing count in marginalia */}
            {event.timesSurfaced > 0 && (
              <Text style={styles.surfacedCount}>
                surfaced {event.timesSurfaced}×
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

      {/* View all link */}
      {events.length > limit && onViewAll && (
        <TouchableOpacity
          style={styles.viewAllRow}
          onPress={onViewAll}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>
            View all {events.length} →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // No padding, no background
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  marginalia: {
    fontSize: 10,
    fontWeight: '400',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginBottom: 12,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 5,
    gap: 8,
  },
  symbol: {
    width: 16,
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  symbolPositive: {
    color: '#059669',
  },
  symbolNegative: {
    color: '#d97706',
  },
  eventText: {
    flex: 1,
    fontSize: 13,
    color: '#4a4a4a',
    lineHeight: 18,
  },
  surfacedCount: {
    fontSize: 10,
    color: '#9ca3af',
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  viewAllRow: {
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  viewAllText: {
    fontSize: 12,
    color: '#2563eb',
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 18,
  },
});

export default RecentLearnings;
