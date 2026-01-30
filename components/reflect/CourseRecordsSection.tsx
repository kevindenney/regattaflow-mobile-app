/**
 * CourseRecordsSection - Personal bests on courses
 *
 * Shows personal best finishes on different race courses
 * with conditions and improvement tracking.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { CourseRecord } from '@/hooks/useReflectProfile';

interface CourseRecordsSectionProps {
  records: CourseRecord[];
  onRecordPress?: (recordId: string) => void;
}

function getOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getWindDirectionIcon(direction: string): string {
  const directionMap: Record<string, string> = {
    N: 'arrow-up',
    NE: 'arrow-up',
    E: 'arrow-forward',
    SE: 'arrow-down',
    S: 'arrow-down',
    SW: 'arrow-down',
    W: 'arrow-back',
    NW: 'arrow-up',
  };
  return directionMap[direction.toUpperCase()] || 'compass';
}

function RecordCard({
  record,
  onPress,
}: {
  record: CourseRecord;
  onPress: () => void;
}) {
  const isPB = record.previousBest && record.bestPosition < record.previousBest;
  const improvement = record.previousBest
    ? record.previousBest - record.bestPosition
    : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.recordCard,
        pressed && styles.recordCardPressed,
      ]}
      onPress={onPress}
    >
      {/* Header */}
      <View style={styles.recordHeader}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseName} numberOfLines={1}>
            {record.courseName}
          </Text>
          <View style={styles.venueRow}>
            <Ionicons
              name="location"
              size={12}
              color={IOS_COLORS.secondaryLabel}
            />
            <Text style={styles.venueName} numberOfLines={1}>
              {record.venueName}
            </Text>
          </View>
        </View>

        {/* Best Position Badge */}
        <View style={styles.positionBadge}>
          <Text style={styles.positionNumber}>{record.bestPosition}</Text>
          <Text style={styles.positionSuffix}>
            {record.bestPosition === 1 ? 'st' : record.bestPosition === 2 ? 'nd' : record.bestPosition === 3 ? 'rd' : 'th'}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{record.fleetSize}</Text>
          <Text style={styles.statLabel}>fleet</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{record.timesRaced}</Text>
          <Text style={styles.statLabel}>times</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{record.avgPosition.toFixed(1)}</Text>
          <Text style={styles.statLabel}>avg</Text>
        </View>
      </View>

      {/* Improvement Badge */}
      {isPB && improvement && (
        <View style={styles.improvementBadge}>
          <Ionicons name="trending-up" size={12} color={IOS_COLORS.systemGreen} />
          <Text style={styles.improvementText}>
            Improved by {improvement} {improvement === 1 ? 'position' : 'positions'}
          </Text>
        </View>
      )}

      {/* Conditions */}
      {record.conditions && (
        <View style={styles.conditionsRow}>
          {record.conditions.windSpeed && (
            <View style={styles.conditionBadge}>
              <Ionicons name="speedometer-outline" size={12} color={IOS_COLORS.secondaryLabel} />
              <Text style={styles.conditionText}>
                {record.conditions.windSpeed} kts
              </Text>
            </View>
          )}
          {record.conditions.windDirection && (
            <View style={styles.conditionBadge}>
              <Ionicons
                name={getWindDirectionIcon(record.conditions.windDirection) as any}
                size={12}
                color={IOS_COLORS.secondaryLabel}
              />
              <Text style={styles.conditionText}>
                {record.conditions.windDirection}
              </Text>
            </View>
          )}
          {record.conditions.waveHeight && (
            <View style={styles.conditionBadge}>
              <Ionicons name="water-outline" size={12} color={IOS_COLORS.secondaryLabel} />
              <Text style={styles.conditionText}>
                {record.conditions.waveHeight}m
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Date */}
      <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
    </Pressable>
  );
}

export function CourseRecordsSection({
  records,
  onRecordPress,
}: CourseRecordsSectionProps) {
  const [expandedView, setExpandedView] = useState(false);

  // Sort by best position (ascending)
  const sortedRecords = [...records].sort((a, b) => a.bestPosition - b.bestPosition);
  const displayRecords = expandedView ? sortedRecords : sortedRecords.slice(0, 3);

  // Calculate summary stats
  const totalCourses = records.length;
  const coursesWithWin = records.filter((r) => r.bestPosition === 1).length;
  const coursesWithPodium = records.filter((r) => r.bestPosition <= 3).length;

  if (records.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Course Records</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons
            name="ribbon-outline"
            size={40}
            color={IOS_COLORS.systemGray3}
          />
          <Text style={styles.emptyText}>No Course Records</Text>
          <Text style={styles.emptySubtext}>
            Race at different courses to track your personal bests
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Course Records</Text>
          <Text style={styles.sectionSubtitle}>
            {totalCourses} courses • {coursesWithWin} wins • {coursesWithPodium} podiums
          </Text>
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: IOS_COLORS.systemYellow + '20' }]}>
              <Ionicons name="trophy" size={18} color={IOS_COLORS.systemYellow} />
            </View>
            <Text style={styles.summaryValue}>{coursesWithWin}</Text>
            <Text style={styles.summaryLabel}>Course Wins</Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: IOS_COLORS.systemOrange + '20' }]}>
              <Ionicons name="medal" size={18} color={IOS_COLORS.systemOrange} />
            </View>
            <Text style={styles.summaryValue}>{coursesWithPodium}</Text>
            <Text style={styles.summaryLabel}>Podium Finishes</Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: IOS_COLORS.systemBlue + '20' }]}>
              <Ionicons name="map" size={18} color={IOS_COLORS.systemBlue} />
            </View>
            <Text style={styles.summaryValue}>{totalCourses}</Text>
            <Text style={styles.summaryLabel}>Courses Raced</Text>
          </View>
        </View>
      </View>

      {/* Records List */}
      <View style={styles.recordsList}>
        <Text style={styles.listHeader}>Personal Bests</Text>
        {displayRecords.map((record) => (
          <RecordCard
            key={record.id}
            record={record}
            onPress={() => onRecordPress?.(record.id)}
          />
        ))}
      </View>

      {/* Show More / Less */}
      {records.length > 3 && (
        <Pressable
          style={({ pressed }) => [
            styles.expandButton,
            pressed && styles.expandButtonPressed,
          ]}
          onPress={() => setExpandedView(!expandedView)}
        >
          <Text style={styles.expandButtonText}>
            {expandedView ? 'Show Less' : `Show All ${records.length} Courses`}
          </Text>
          <Ionicons
            name={expandedView ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={IOS_COLORS.systemBlue}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 16,
    ...IOS_SHADOWS.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 6,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
  },
  recordsList: {
    marginHorizontal: 16,
  },
  listHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  recordCard: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    ...IOS_SHADOWS.sm,
  },
  recordCardPressed: {
    opacity: 0.7,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  courseInfo: {
    flex: 1,
    marginRight: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  venueName: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: IOS_COLORS.systemYellow + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  positionNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.systemYellow,
  },
  positionSuffix: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.systemYellow,
    marginLeft: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: IOS_COLORS.separator,
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.systemGreen + '15',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  improvementText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.systemGreen,
  },
  conditionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.systemGray6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  recordDate: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    marginHorizontal: 16,
  },
  expandButtonPressed: {
    opacity: 0.6,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  emptyState: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
});

export default CourseRecordsSection;
