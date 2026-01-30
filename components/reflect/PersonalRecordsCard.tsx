/**
 * PersonalRecordsCard - Display personal best results and records
 *
 * Shows best finish, win streaks, largest fleet win, and other
 * personal records in a card grid layout.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { PersonalRecord } from '@/hooks/useReflectProfile';

interface PersonalRecordsCardProps {
  records: PersonalRecord[];
  onSeeMore?: () => void;
  onRecordPress?: (record: PersonalRecord) => void;
}

// Map color names to actual colors
function getColor(colorName: string): string {
  const colors: Record<string, string> = {
    systemYellow: IOS_COLORS.systemYellow,
    systemOrange: IOS_COLORS.systemOrange,
    systemBlue: IOS_COLORS.systemBlue,
    systemGreen: IOS_COLORS.systemGreen,
    systemPurple: IOS_COLORS.systemPurple,
    systemRed: IOS_COLORS.systemRed,
    systemTeal: IOS_COLORS.systemTeal,
    systemIndigo: IOS_COLORS.systemIndigo,
  };
  return colors[colorName] || IOS_COLORS.systemBlue;
}

function RecordItem({
  record,
  onPress,
}: {
  record: PersonalRecord;
  onPress?: () => void;
}) {
  const color = getColor(record.color);
  const iconName = record.icon as keyof typeof Ionicons.glyphMap;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.recordItem,
        pressed && onPress && styles.recordItemPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.recordIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={iconName} size={18} color={color} />
      </View>
      <View style={styles.recordContent}>
        <Text style={styles.recordLabel}>{record.label}</Text>
        <View style={styles.recordValueRow}>
          <Text style={[styles.recordValue, { color }]}>
            {record.value}
          </Text>
          {record.detail && (
            <Text style={styles.recordDetail} numberOfLines={1}>
              {record.detail}
            </Text>
          )}
        </View>
        {record.regattaName && (
          <Text style={styles.recordRegatta} numberOfLines={1}>
            {record.regattaName}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export function PersonalRecordsCard({
  records,
  onSeeMore,
  onRecordPress,
}: PersonalRecordsCardProps) {
  if (records.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Personal Records</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons
            name="ribbon-outline"
            size={32}
            color={IOS_COLORS.systemGray3}
          />
          <Text style={styles.emptyText}>No records yet</Text>
          <Text style={styles.emptySubtext}>
            Complete races to set your personal bests
          </Text>
        </View>
      </View>
    );
  }

  // Show top 4 records
  const displayRecords = records.slice(0, 4);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Personal Records</Text>
        {onSeeMore && records.length > 4 && (
          <Pressable
            onPress={onSeeMore}
            style={({ pressed }) => [
              styles.seeMoreButton,
              pressed && styles.seeMoreButtonPressed,
            ]}
          >
            <Text style={styles.seeMoreText}>See All</Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={IOS_COLORS.systemBlue}
            />
          </Pressable>
        )}
      </View>

      {/* Records Grid */}
      <View style={styles.recordsGrid}>
        {displayRecords.map((record, index) => (
          <React.Fragment key={record.id}>
            <RecordItem
              record={record}
              onPress={onRecordPress ? () => onRecordPress(record) : undefined}
            />
            {index < displayRecords.length - 1 && (
              <View style={styles.separator} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...IOS_SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeMoreButtonPressed: {
    opacity: 0.6,
  },
  seeMoreText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  recordsGrid: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
    overflow: 'hidden',
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  recordItemPressed: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
  recordIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordContent: {
    flex: 1,
  },
  recordLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  recordValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  recordValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.41,
  },
  recordDetail: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    maxWidth: 150,
  },
  recordRegatta: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: 60,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
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

export default PersonalRecordsCard;
