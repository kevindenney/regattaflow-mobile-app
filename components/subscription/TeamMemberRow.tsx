/**
 * Team Member Row Component
 *
 * Displays a single team member with actions.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SubscriptionTeamMemberWithProfile } from '@/types/subscriptionTeam';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
} from '@/lib/design-tokens-ios';

interface TeamMemberRowProps {
  member: SubscriptionTeamMemberWithProfile;
  isOwner: boolean;
  isSelf?: boolean;
  onRemove?: () => void;
  onCancel?: () => void;
}

export function TeamMemberRow({
  member,
  isOwner,
  isSelf = false,
  onRemove,
  onCancel,
}: TeamMemberRowProps) {
  const isPending = member.status === 'pending';
  const displayName = member.profile?.full_name || member.email;
  const initials = getInitials(displayName);
  const avatarUrl = member.profile?.avatar_url;

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
        {isPending && (
          <View style={styles.pendingBadge}>
            <Ionicons name="time" size={10} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {member.role === 'owner' && (
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerBadgeText}>Owner</Text>
            </View>
          )}
          {isSelf && !isOwner && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>You</Text>
            </View>
          )}
        </View>
        <Text style={styles.email} numberOfLines={1}>
          {member.email}
        </Text>
        {isPending && (
          <Text style={styles.pendingText}>Invite pending</Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {isPending && isOwner && onCancel && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onCancel}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={22} color={IOS_COLORS.systemRed} />
          </TouchableOpacity>
        )}
        {!isPending && isOwner && !isSelf && member.role !== 'owner' && onRemove && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onRemove}
            hitSlop={8}
          >
            <Ionicons name="remove-circle" size={22} color={IOS_COLORS.systemRed} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function getInitials(name: string): string {
  const parts = name.split(/[\s@]/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.sm,
    paddingHorizontal: IOS_SPACING.lg,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: IOS_SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: IOS_COLORS.systemGray4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.secondaryLabel,
    fontSize: 16,
  },
  pendingBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: IOS_COLORS.systemOrange,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
  },
  name: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
    flexShrink: 1,
  },
  ownerBadge: {
    backgroundColor: IOS_COLORS.systemBlue,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ownerBadgeText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  youBadge: {
    backgroundColor: IOS_COLORS.systemGray4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadgeText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
  },
  email: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  pendingText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.systemOrange,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: IOS_SPACING.sm,
  },
  actionButton: {
    padding: IOS_SPACING.xs,
  },
});

export default TeamMemberRow;
