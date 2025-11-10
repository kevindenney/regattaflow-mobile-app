/**
 * SplitTimesAnalysis - Mark-by-mark timing breakdown
 *
 * Displays split times at each mark with leg analysis
 * Part of Phase 3: DEBRIEF Mode
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SplitTime } from './modes/DebriefModeLayout';

interface SplitTimesAnalysisProps {
  splitTimes: SplitTime[];
  raceStartTime?: Date;
}

export const SplitTimesAnalysis: React.FC<SplitTimesAnalysisProps> = ({
  splitTimes,
  raceStartTime,
}) => {
  if (splitTimes.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Split Times</Text>
        <View style={styles.emptyState}>
          <Ionicons name="timer-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No split times recorded</Text>
          <Text style={styles.emptySubtext}>
            Split times will appear here after racing with GPS tracking
          </Text>
        </View>
      </View>
    );
  }

  // Calculate leg times
  const legs = splitTimes.map((split, index) => {
    const prevTime = index === 0
      ? (raceStartTime || split.time)
      : splitTimes[index - 1].time;

    const legTime = (split.time.getTime() - prevTime.getTime()) / 1000; // seconds
    const elapsedTime = raceStartTime
      ? (split.time.getTime() - raceStartTime.getTime()) / 1000
      : legTime;

    return {
      ...split,
      legTime,
      elapsedTime,
      legNumber: index + 1,
    };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Split Times</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.markCell]}>Mark</Text>
            <Text style={[styles.headerCell, styles.timeCell]}>Time</Text>
            <Text style={[styles.headerCell, styles.legCell]}>Leg Time</Text>
            <Text style={[styles.headerCell, styles.positionCell]}>Position</Text>
            <Text style={[styles.headerCell, styles.roundingCell]}>Rounding</Text>
            <Text style={[styles.headerCell, styles.efficiencyCell]}>Efficiency</Text>
          </View>

          {/* Table Rows */}
          {legs.map((leg, index) => {
            const roundingEfficiency = calculateRoundingEfficiency(leg.roundingTime);
            const gain = index > 0 ? leg.position - legs[index - 1].position : 0;

            return (
              <View
                key={leg.markId}
                style={[
                  styles.tableRow,
                  index % 2 === 0 && styles.tableRowAlt,
                ]}
              >
                {/* Mark */}
                <View style={[styles.cell, styles.markCell]}>
                  <Text style={styles.markNumber}>{leg.legNumber}</Text>
                  <Text style={styles.markName}>{leg.markName}</Text>
                </View>

                {/* Time */}
                <View style={[styles.cell, styles.timeCell]}>
                  <Text style={styles.timeValue}>
                    {formatTime(leg.elapsedTime)}
                  </Text>
                </View>

                {/* Leg Time */}
                <View style={[styles.cell, styles.legCell]}>
                  <Text style={styles.legTimeValue}>
                    {formatTime(leg.legTime)}
                  </Text>
                </View>

                {/* Position */}
                <View style={[styles.cell, styles.positionCell]}>
                  <Text style={styles.positionValue}>{leg.position}</Text>
                  {gain !== 0 && (
                    <View style={[styles.gainBadge, gain > 0 && styles.lossBadge]}>
                      <Ionicons
                        name={gain > 0 ? 'arrow-down' : 'arrow-up'}
                        size={12}
                        color={gain > 0 ? '#EF4444' : '#10B981'}
                      />
                      <Text style={[styles.gainText, gain > 0 && styles.lossText]}>
                        {Math.abs(gain)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Rounding */}
                <View style={[styles.cell, styles.roundingCell]}>
                  <View style={styles.roundingBadge}>
                    <Text style={styles.roundingText}>
                      {leg.roundingType === 'port' ? 'Port' : 'Stbd'}
                    </Text>
                  </View>
                  <Text style={styles.roundingTimeText}>
                    {leg.roundingTime.toFixed(1)}s
                  </Text>
                </View>

                {/* Efficiency */}
                <View style={[styles.cell, styles.efficiencyCell]}>
                  <View
                    style={[
                      styles.efficiencyBadge,
                      roundingEfficiency === 'good' && styles.efficiencyGood,
                      roundingEfficiency === 'poor' && styles.efficiencyPoor,
                    ]}
                  >
                    <Ionicons
                      name={
                        roundingEfficiency === 'good'
                          ? 'checkmark-circle'
                          : roundingEfficiency === 'poor'
                          ? 'close-circle'
                          : 'remove-circle'
                      }
                      size={16}
                      color={
                        roundingEfficiency === 'good'
                          ? '#10B981'
                          : roundingEfficiency === 'poor'
                          ? '#EF4444'
                          : '#F59E0B'
                      }
                    />
                    <Text
                      style={[
                        styles.efficiencyText,
                        roundingEfficiency === 'good' && styles.efficiencyGoodText,
                        roundingEfficiency === 'poor' && styles.efficiencyPoorText,
                      ]}
                    >
                      {roundingEfficiency}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate rounding efficiency based on time
 */
function calculateRoundingEfficiency(roundingTime: number): 'good' | 'average' | 'poor' {
  if (roundingTime < 5) return 'good';
  if (roundingTime < 8) return 'average';
  return 'poor';
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
  },
  tableRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  cell: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  markCell: {
    width: 120,
  },
  timeCell: {
    width: 100,
  },
  legCell: {
    width: 100,
  },
  positionCell: {
    width: 120,
  },
  roundingCell: {
    width: 120,
  },
  efficiencyCell: {
    width: 120,
  },
  markNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 2,
  },
  markName: {
    fontSize: 14,
    color: '#111827',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  legTimeValue: {
    fontSize: 14,
    color: '#6B7280',
    fontVariant: ['tabular-nums'],
  },
  positionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  gainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  lossBadge: {
    // Additional styles if needed
  },
  gainText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  lossText: {
    color: '#EF4444',
  },
  roundingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  roundingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  roundingTimeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  efficiencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  efficiencyGood: {
    backgroundColor: '#D1FAE5',
  },
  efficiencyPoor: {
    backgroundColor: '#FEE2E2',
  },
  efficiencyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F59E0B',
    textTransform: 'capitalize',
  },
  efficiencyGoodText: {
    color: '#10B981',
  },
  efficiencyPoorText: {
    color: '#EF4444',
  },
});
