/**
 * FleetActivityCard Component
 *
 * Compact card showing fleet mate race activity.
 * Displays sailor info, race name, date, and content indicators.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, FileText, StickyNote } from 'lucide-react-native';
import { FleetMateRace } from '@/hooks/useFleetActivity';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

interface FleetActivityCardProps {
  race: FleetMateRace;
  onPress: () => void;
}

export function FleetActivityCard({ race, onPress }: FleetActivityCardProps) {
  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const hasContent = race.prepNotes || race.tuningSettings;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: race.avatarColor || '#64748B' },
        ]}
      >
        <Text style={styles.avatarEmoji}>{race.avatarEmoji || '⛵'}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.sailorName} numberOfLines={1}>
          {race.userName}
        </Text>
        <Text style={styles.raceName} numberOfLines={1}>
          {race.name}
        </Text>
      </View>

      {/* Right Side */}
      <View style={styles.right}>
        <View style={styles.dateContainer}>
          <Calendar size={12} color="#64748B" />
          <Text style={styles.dateText}>{formatDate(race.startDate)}</Text>
        </View>

        {/* Content Indicators */}
        <View style={styles.indicators}>
          {race.prepNotes && (
            <View style={styles.indicator}>
              <StickyNote size={12} color={IOS_COLORS.systemBlue} />
            </View>
          )}
          {race.tuningSettings && (
            <View style={styles.indicator}>
              <FileText size={12} color={IOS_COLORS.systemOrange} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  sailorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  raceName: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
  },
  indicators: {
    flexDirection: 'row',
    gap: 6,
  },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FleetActivityCard;
