/**
 * SailorRow Component
 *
 * Dense row for browsing sailors (Tufte-inspired minimal design).
 * Shows avatar, name, boat class, and follow button.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserPlus, UserCheck, ChevronRight } from 'lucide-react-native';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

export interface SailorSummary {
  userId: string;
  userName: string;
  avatarEmoji?: string;
  avatarColor?: string;
  boatClassName?: string;
  publicRaceCount: number;
  isFollowing: boolean;
}

interface SailorRowProps {
  sailor: SailorSummary;
  onPress: () => void;
  onToggleFollow: () => void;
}

export function SailorRow({ sailor, onPress, onToggleFollow }: SailorRowProps) {
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
          { backgroundColor: sailor.avatarColor || '#64748B' },
        ]}
      >
        <Text style={styles.avatarEmoji}>{sailor.avatarEmoji || '⛵'}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {sailor.userName}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {sailor.boatClassName || 'Sailor'} · {sailor.publicRaceCount} races
        </Text>
      </View>

      {/* Follow Button */}
      <TouchableOpacity
        style={[
          styles.followButton,
          sailor.isFollowing && styles.followingButton,
        ]}
        onPress={(e) => {
          e.stopPropagation();
          onToggleFollow();
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {sailor.isFollowing ? (
          <UserCheck size={16} color="#10B981" />
        ) : (
          <UserPlus size={16} color={IOS_COLORS.systemBlue} />
        )}
      </TouchableOpacity>

      {/* Chevron */}
      <ChevronRight size={18} color="#CBD5E1" style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  meta: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  followButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: '#ECFDF5',
  },
  chevron: {
    marginLeft: 8,
  },
});

export default SailorRow;
