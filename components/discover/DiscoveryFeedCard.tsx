/**
 * DiscoveryFeedCard Component
 *
 * Compact card for Instagram-style vertical feed (~140px height).
 * Shows sailor avatar, name, follow button, race info, and content indicators.
 * Tapping opens the SailorTimelineModal.
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Calendar,
  FileText,
  StickyNote,
  CheckCircle,
  Lightbulb,
  UserPlus,
  UserCheck,
} from 'lucide-react-native';
import { PublicRacePreview } from '@/services/CrewFinderService';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

interface DiscoveryFeedCardProps {
  race: PublicRacePreview;
  onPress: () => void;
  onToggleFollow: () => void;
}

export function DiscoveryFeedCard({
  race,
  onPress,
  onToggleFollow,
}: DiscoveryFeedCardProps) {
  // Format date with relative display
  const formatDate = useCallback((dateStr: string, daysUntil: number) => {
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil === -1) return 'Yesterday';
    if (daysUntil < -1) return `${Math.abs(daysUntil)} days ago`;
    if (daysUntil < 7) return `In ${daysUntil} days`;

    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Handle follow button press (stop propagation)
  const handleFollowPress = useCallback(
    (e: any) => {
      e?.stopPropagation?.();
      onToggleFollow();
    },
    [onToggleFollow]
  );

  // Count content indicators
  const contentCount = [
    race.hasPrepNotes,
    race.hasTuning,
    race.hasPostRaceNotes,
    race.hasLessons,
  ].filter(Boolean).length;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Top Row: Avatar, Name, Follow Button */}
      <View style={styles.topRow}>
        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            { backgroundColor: race.avatarColor || '#64748B' },
          ]}
        >
          <Text style={styles.avatarEmoji}>{race.avatarEmoji || '⛵'}</Text>
        </View>

        {/* Sailor Info */}
        <View style={styles.sailorInfo}>
          <Text style={styles.sailorName} numberOfLines={1}>
            {race.userName}
          </Text>
          {race.venue && (
            <Text style={styles.venue} numberOfLines={1}>
              {race.venue}
            </Text>
          )}
        </View>

        {/* Follow Button */}
        <TouchableOpacity
          style={[
            styles.followButton,
            race.isFollowing && styles.followButtonFollowing,
          ]}
          onPress={handleFollowPress}
          activeOpacity={0.7}
        >
          {race.isFollowing ? (
            <UserCheck size={14} color={IOS_COLORS.systemGray} />
          ) : (
            <UserPlus size={14} color="#FFFFFF" />
          )}
          <Text
            style={[
              styles.followButtonText,
              race.isFollowing && styles.followButtonTextFollowing,
            ]}
          >
            {race.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Race Info Row */}
      <View style={styles.raceRow}>
        <View style={styles.raceInfo}>
          <Text style={styles.raceName} numberOfLines={1}>
            {race.name}
          </Text>
          <View style={styles.dateContainer}>
            <Calendar size={12} color="#64748B" />
            <Text style={styles.dateText}>
              {formatDate(race.startDate, race.daysUntil)}
            </Text>
          </View>
        </View>

        {/* Content Indicators */}
        <View style={styles.indicators}>
          {race.hasPrepNotes && (
            <View style={[styles.indicator, styles.indicatorBlue]}>
              <StickyNote size={12} color={IOS_COLORS.systemBlue} />
            </View>
          )}
          {race.hasTuning && (
            <View style={[styles.indicator, styles.indicatorOrange]}>
              <FileText size={12} color={IOS_COLORS.systemOrange} />
            </View>
          )}
          {race.hasPostRaceNotes && (
            <View style={[styles.indicator, styles.indicatorGreen]}>
              <CheckCircle size={12} color={IOS_COLORS.systemGreen} />
            </View>
          )}
          {race.hasLessons && (
            <View style={[styles.indicator, styles.indicatorPurple]}>
              <Lightbulb size={12} color={IOS_COLORS.systemPurple} />
            </View>
          )}
        </View>
      </View>

      {/* Content Preview (if has content) */}
      {contentCount > 0 && (
        <View style={styles.contentPreview}>
          <Text style={styles.contentPreviewText}>
            {race.isPast
              ? race.hasPostRaceNotes || race.hasLessons
                ? 'Shared race analysis'
                : 'Race completed'
              : race.hasPrepNotes || race.hasTuning
              ? 'Prepping for race'
              : 'Upcoming race'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  sailorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sailorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  venue: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.systemBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  followButtonFollowing: {
    backgroundColor: '#F1F5F9',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followButtonTextFollowing: {
    color: IOS_COLORS.systemGray,
  },
  raceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  raceInfo: {
    flex: 1,
  },
  raceName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#64748B',
  },
  indicators: {
    flexDirection: 'row',
    gap: 6,
  },
  indicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorBlue: {
    backgroundColor: `${IOS_COLORS.systemBlue}15`,
  },
  indicatorOrange: {
    backgroundColor: `${IOS_COLORS.systemOrange}15`,
  },
  indicatorGreen: {
    backgroundColor: `${IOS_COLORS.systemGreen}15`,
  },
  indicatorPurple: {
    backgroundColor: `${IOS_COLORS.systemPurple}15`,
  },
  contentPreview: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  contentPreviewText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
});

export default DiscoveryFeedCard;
