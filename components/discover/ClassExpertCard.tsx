/**
 * ClassExpertCard Component
 *
 * Displays a class expert sailor with:
 * - Avatar and name
 * - Expert score indicators (podium count, public races)
 * - Follow/following button
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Trophy, FileText, UserPlus, UserCheck } from 'lucide-react-native';
import { ClassExpert } from '@/hooks/useClassExperts';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

interface ClassExpertCardProps {
  expert: ClassExpert;
  onPress: () => void;
  onToggleFollow: () => void;
}

export function ClassExpertCard({
  expert,
  onPress,
  onToggleFollow,
}: ClassExpertCardProps) {
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
          { backgroundColor: expert.avatarColor || '#3B82F6' },
        ]}
      >
        <Text style={styles.avatarEmoji}>{expert.avatarEmoji || '⛵'}</Text>
      </View>

      {/* Name */}
      <Text style={styles.name} numberOfLines={1}>
        {expert.userName}
      </Text>

      {/* Stats */}
      <View style={styles.stats}>
        {expert.podiumCount > 0 && (
          <View style={styles.stat}>
            <Trophy size={12} color={IOS_COLORS.systemOrange} />
            <Text style={styles.statText}>{expert.podiumCount}</Text>
          </View>
        )}
        <View style={styles.stat}>
          <FileText size={12} color="#64748B" />
          <Text style={styles.statText}>{expert.publicRaceCount}</Text>
        </View>
      </View>

      {/* Follow Button */}
      <TouchableOpacity
        style={[
          styles.followButton,
          expert.isFollowing && styles.followingButton,
        ]}
        onPress={(e) => {
          e.stopPropagation();
          onToggleFollow();
        }}
        activeOpacity={0.7}
      >
        {expert.isFollowing ? (
          <>
            <UserCheck size={14} color="#10B981" />
            <Text style={styles.followingText}>Following</Text>
          </>
        ) : (
          <>
            <UserPlus size={14} color={IOS_COLORS.systemBlue} />
            <Text style={styles.followText}>Follow</Text>
          </>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#64748B',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  followingButton: {
    backgroundColor: '#ECFDF5',
  },
  followText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  followingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
});

export default ClassExpertCard;
