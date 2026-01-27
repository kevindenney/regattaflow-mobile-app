/**
 * RaceCardSailorHeader Component
 *
 * Displays sailor info in the full-screen race card:
 * - Avatar with emoji/color
 * - Sailor name
 * - Boat class (if available)
 * - Follow button
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserPlus, UserCheck, Sailboat } from 'lucide-react-native';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

interface RaceCardSailorHeaderProps {
  userName: string;
  avatarEmoji?: string;
  avatarColor?: string;
  boatClass?: string;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
}

export function RaceCardSailorHeader({
  userName,
  avatarEmoji = '⛵',
  avatarColor = '#64748B',
  boatClass,
  isFollowing = false,
  onToggleFollow,
}: RaceCardSailorHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
      </View>

      {/* Sailor Info */}
      <View style={styles.sailorInfo}>
        <Text style={styles.sailorName} numberOfLines={1}>
          {userName}
        </Text>
        {boatClass && (
          <View style={styles.boatClassRow}>
            <Sailboat size={12} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.boatClass} numberOfLines={1}>
              {boatClass}
            </Text>
          </View>
        )}
      </View>

      {/* Follow Button */}
      {onToggleFollow && (
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing && styles.followButtonFollowing,
          ]}
          onPress={onToggleFollow}
          activeOpacity={0.7}
        >
          {isFollowing ? (
            <UserCheck size={16} color={IOS_COLORS.systemGray} />
          ) : (
            <UserPlus size={16} color="#FFFFFF" />
          )}
          <Text
            style={[
              styles.followButtonText,
              isFollowing && styles.followButtonTextFollowing,
            ]}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  sailorInfo: {
    flex: 1,
  },
  sailorName: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.2,
  },
  boatClassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  boatClass: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.systemBlue,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
  },
  followButtonFollowing: {
    backgroundColor: IOS_COLORS.systemGray6,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followButtonTextFollowing: {
    color: IOS_COLORS.systemGray,
  },
});

export default RaceCardSailorHeader;
