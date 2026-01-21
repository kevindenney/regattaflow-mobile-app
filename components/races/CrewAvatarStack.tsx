/**
 * CrewAvatarStack Component
 *
 * Displays a stack of crew member avatars on race cards.
 * Uses Gluestack AvatarGroup for overlapping display.
 * Shows pending status with yellow badge.
 */

import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import {
  Avatar,
  AvatarGroup,
  AvatarFallbackText,
  AvatarBadge,
} from '@/components/ui/avatar';
import { RaceCollaborator } from '@/types/raceCollaboration';
import { IOS_COLORS } from '@/components/cards/constants';

interface CrewAvatarStackProps {
  /** List of collaborators to display */
  collaborators: RaceCollaborator[];
  /** Maximum number of avatars to show before overflow indicator */
  maxVisible?: number;
  /** Avatar size */
  size?: 'xs' | 'sm' | 'md';
  /** Callback when avatar stack is pressed */
  onPress?: () => void;
  /** Whether to show pending status badges */
  showPendingBadge?: boolean;
}

/**
 * Get display initials from collaborator
 */
function getInitials(collaborator: RaceCollaborator): string {
  // Use display name first
  if (collaborator.displayName) {
    const parts = collaborator.displayName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return collaborator.displayName.substring(0, 2).toUpperCase();
  }

  // Then profile full name
  if (collaborator.profile?.fullName) {
    const parts = collaborator.profile.fullName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return collaborator.profile.fullName.substring(0, 2).toUpperCase();
  }

  // Fallback
  return '??';
}

/**
 * Get background color for avatar
 */
function getAvatarColor(collaborator: RaceCollaborator, index: number): string {
  if (collaborator.profile?.avatarColor) {
    return collaborator.profile.avatarColor;
  }

  // Fallback colors based on index
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
  ];
  return colors[index % colors.length];
}

export function CrewAvatarStack({
  collaborators,
  maxVisible = 4,
  size = 'sm',
  onPress,
  showPendingBadge = true,
}: CrewAvatarStackProps) {
  // Only show accepted collaborators by default, plus pending if badges enabled
  const displayCollaborators = showPendingBadge
    ? collaborators
    : collaborators.filter((c) => c.status === 'accepted');

  if (displayCollaborators.length === 0) {
    return null;
  }

  const visible = displayCollaborators.slice(0, maxVisible);
  const overflow = displayCollaborators.length - maxVisible;

  const content = (
    <View style={styles.container}>
      <AvatarGroup>
        {visible.map((collab, index) => (
          <Avatar
            key={collab.id}
            size={size}
            style={{ backgroundColor: getAvatarColor(collab, index) }}
          >
            {collab.profile?.avatarEmoji ? (
              <AvatarFallbackText style={styles.emojiText}>
                {collab.profile.avatarEmoji}
              </AvatarFallbackText>
            ) : (
              <AvatarFallbackText>{getInitials(collab)}</AvatarFallbackText>
            )}
            {showPendingBadge && collab.status === 'pending' && (
              <AvatarBadge style={styles.pendingBadge} />
            )}
          </Avatar>
        ))}
        {overflow > 0 && (
          <Avatar size={size} style={styles.overflowAvatar}>
            <AvatarFallbackText style={styles.overflowText}>
              +{overflow}
            </AvatarFallbackText>
          </Avatar>
        )}
      </AvatarGroup>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  emojiText: {
    fontSize: 14,
  },
  pendingBadge: {
    backgroundColor: IOS_COLORS.yellow,
    borderColor: IOS_COLORS.systemBackground,
    borderWidth: 1,
  },
  overflowAvatar: {
    backgroundColor: IOS_COLORS.gray4,
  },
  overflowText: {
    color: IOS_COLORS.gray,
    fontSize: 10,
    fontWeight: '600',
  },
});

export default CrewAvatarStack;
