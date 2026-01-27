/**
 * TeamActionPill Component
 *
 * A unified action pill combining crew avatars and chat functionality.
 * Replaces the separate CrewAvatarStack + chat button in race card headers.
 *
 * Design:
 * - Empty state: Blue outline pill with "Add Crew" text and UserPlus icon
 * - With crew (1-3): Mini avatar stack | chat icon
 * - With crew (4+): Users icon + count | chat icon
 */

import { MessageSquare, UserPlus, Users } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import { RaceCollaborator } from '@/types/raceCollaboration';

export interface TeamActionPillProps {
  /** List of collaborators to display */
  collaborators: RaceCollaborator[];
  /** Callback when crew section is pressed */
  onCrewPress: () => void;
  /** Callback when chat section is pressed */
  onChatPress: () => void;
  /** Whether there are unread messages */
  hasUnreadMessages?: boolean;
}

/**
 * Get initials from collaborator for mini avatar display
 */
function getInitials(collaborator: RaceCollaborator): string {
  if (collaborator.displayName) {
    const parts = collaborator.displayName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return collaborator.displayName.substring(0, 2).toUpperCase();
  }

  if (collaborator.profile?.fullName) {
    const parts = collaborator.profile.fullName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return collaborator.profile.fullName.substring(0, 2).toUpperCase();
  }

  return '??';
}

/**
 * Get background color for mini avatar
 */
function getAvatarColor(collaborator: RaceCollaborator, index: number): string {
  if (collaborator.profile?.avatarColor) {
    return collaborator.profile.avatarColor;
  }

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

/**
 * Mini Avatar Stack - compact avatar display inside the pill
 */
function MiniAvatarStack({
  collaborators,
}: {
  collaborators: RaceCollaborator[];
}) {
  const visible = collaborators.slice(0, 3);

  return (
    <View style={styles.miniAvatarStack}>
      {visible.map((collab, index) => (
        <View
          key={collab.id}
          style={[
            styles.miniAvatar,
            { backgroundColor: getAvatarColor(collab, index) },
            index > 0 && { marginLeft: -6 },
          ]}
        >
          <Text style={styles.miniAvatarText}>{getInitials(collab)}</Text>
        </View>
      ))}
    </View>
  );
}

export function TeamActionPill({
  collaborators,
  onCrewPress,
  onChatPress,
  hasUnreadMessages = false,
}: TeamActionPillProps) {
  // Filter to only show accepted collaborators (pending ones shown differently)
  const acceptedCollaborators = collaborators.filter(
    (c) => c.status === 'accepted'
  );
  const hasCollaborators = acceptedCollaborators.length > 0;
  const showAvatars = acceptedCollaborators.length <= 3;

  // Empty state - "Add Crew" pill
  if (!hasCollaborators) {
    return (
      <Pressable
        onPress={onCrewPress}
        style={({ pressed }) => [
          styles.emptyPill,
          pressed && styles.pillPressed,
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <UserPlus size={16} color={IOS_COLORS.blue} strokeWidth={2} />
        <Text style={styles.emptyText}>Add Crew</Text>
      </Pressable>
    );
  }

  // Has collaborators - split pill with crew | chat
  return (
    <View style={styles.pill}>
      {/* Crew Section (left side) */}
      <Pressable
        onPress={onCrewPress}
        style={({ pressed }) => [
          styles.crewSection,
          pressed && styles.sectionPressed,
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8 }}
      >
        {showAvatars ? (
          <MiniAvatarStack collaborators={acceptedCollaborators} />
        ) : (
          <>
            <Users size={14} color={IOS_COLORS.blue} strokeWidth={2} />
            <Text style={styles.countText}>{acceptedCollaborators.length}</Text>
          </>
        )}
        <Text style={styles.crewLabel}>Crew</Text>
      </Pressable>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Chat Section (right side) */}
      <Pressable
        onPress={onChatPress}
        style={({ pressed }) => [
          styles.chatSection,
          pressed && styles.sectionPressed,
        ]}
        hitSlop={{ top: 8, bottom: 8, right: 8 }}
      >
        <MessageSquare size={16} color={IOS_COLORS.blue} strokeWidth={2} />
        {hasUnreadMessages && <View style={styles.unreadDot} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Empty state pill - blue outline, white background
  emptyPill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: IOS_COLORS.blue,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },

  // Filled pill - light blue background
  pill: {
    height: 32,
    borderRadius: 16,
    backgroundColor: `${IOS_COLORS.blue}12`, // 12% opacity blue
    borderWidth: 1,
    borderColor: `${IOS_COLORS.blue}30`, // 30% opacity blue border
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },

  pillPressed: {
    opacity: 0.7,
  },

  // Crew section (left half)
  crewSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    height: '100%',
  },

  sectionPressed: {
    backgroundColor: `${IOS_COLORS.blue}20`, // Slightly darker on press
  },

  // Count mode (4+ crew)
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
  },

  crewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },

  // Vertical divider between sections
  divider: {
    width: 1,
    height: 18,
    backgroundColor: `${IOS_COLORS.blue}30`,
  },

  // Chat section (right half)
  chatSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    height: '100%',
    position: 'relative',
  },

  // Unread indicator dot
  unreadDot: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: IOS_COLORS.red,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // Mini avatar stack
  miniAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  miniAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  miniAvatarText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});

export default TeamActionPill;
