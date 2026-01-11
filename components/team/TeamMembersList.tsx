/**
 * TeamMembersList
 *
 * Displays team members with their status and roles.
 * Shows who's in the team for team racing collaboration.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Users, Sailboat, Anchor } from 'lucide-react-native';
import { TeamRaceEntryMember } from '@/types/teamRacing';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  teal: '#0D9488',
};

interface TeamMembersListProps {
  members: TeamRaceEntryMember[];
  currentUserId?: string;
  compact?: boolean;
}

/**
 * Get initials from a name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Get display name for a member
 */
function getDisplayName(member: TeamRaceEntryMember): string {
  return (
    member.displayName ||
    member.profile?.fullName ||
    member.profile?.email?.split('@')[0] ||
    'Teammate'
  );
}

/**
 * Single member avatar
 */
function MemberAvatar({
  member,
  size = 32,
  isCurrentUser,
}: {
  member: TeamRaceEntryMember;
  size?: number;
  isCurrentUser?: boolean;
}) {
  const name = getDisplayName(member);
  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        isCurrentUser && styles.avatarCurrentUser,
      ]}
    >
      <Text
        style={[
          styles.avatarText,
          { fontSize: size * 0.4 },
          isCurrentUser && styles.avatarTextCurrentUser,
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

/**
 * Compact view - just avatars in a row
 */
function CompactView({
  members,
  currentUserId,
}: {
  members: TeamRaceEntryMember[];
  currentUserId?: string;
}) {
  const maxVisible = 4;
  const visibleMembers = members.slice(0, maxVisible);
  const hiddenCount = members.length - maxVisible;

  return (
    <View style={styles.compactContainer}>
      <View style={styles.avatarStack}>
        {visibleMembers.map((member, index) => (
          <View
            key={member.id}
            style={[
              styles.avatarStackItem,
              { marginLeft: index > 0 ? -8 : 0, zIndex: members.length - index },
            ]}
          >
            <MemberAvatar
              member={member}
              size={28}
              isCurrentUser={member.userId === currentUserId}
            />
          </View>
        ))}
        {hiddenCount > 0 && (
          <View style={[styles.avatarStackItem, styles.hiddenCountBadge]}>
            <Text style={styles.hiddenCountText}>+{hiddenCount}</Text>
          </View>
        )}
      </View>
      <Text style={styles.compactLabel}>
        {members.length} teammate{members.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

/**
 * Full view - list with details
 */
function FullView({
  members,
  currentUserId,
}: {
  members: TeamRaceEntryMember[];
  currentUserId?: string;
}) {
  return (
    <View style={styles.fullContainer}>
      <View style={styles.header}>
        <Users size={16} color={IOS_COLORS.teal} />
        <Text style={styles.headerLabel}>TEAM ({members.length})</Text>
      </View>
      <View style={styles.membersList}>
        {members.map((member) => {
          const isCurrentUser = member.userId === currentUserId;
          const name = getDisplayName(member);

          return (
            <View key={member.id} style={styles.memberRow}>
              <MemberAvatar
                member={member}
                size={36}
                isCurrentUser={isCurrentUser}
              />
              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <Text
                    style={[
                      styles.memberName,
                      isCurrentUser && styles.memberNameCurrentUser,
                    ]}
                    numberOfLines={1}
                  >
                    {name}
                  </Text>
                  {isCurrentUser && (
                    <Text style={styles.youBadge}>You</Text>
                  )}
                </View>
                <View style={styles.memberMeta}>
                  {member.sailNumber && (
                    <View style={styles.metaItem}>
                      <Sailboat size={12} color={IOS_COLORS.gray} />
                      <Text style={styles.metaText}>#{member.sailNumber}</Text>
                    </View>
                  )}
                  {member.role && (
                    <View style={styles.metaItem}>
                      <Anchor size={12} color={IOS_COLORS.gray} />
                      <Text style={styles.metaText}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function TeamMembersList({
  members,
  currentUserId,
  compact = false,
}: TeamMembersListProps) {
  if (members.length === 0) {
    return null;
  }

  if (compact) {
    return <CompactView members={members} currentUserId={currentUserId} />;
  }

  return <FullView members={members} currentUserId={currentUserId} />;
}

const styles = StyleSheet.create({
  // Compact View
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStackItem: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
  },
  hiddenCountBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.gray5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  hiddenCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
  compactLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },

  // Avatar
  avatar: {
    backgroundColor: IOS_COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCurrentUser: {
    backgroundColor: IOS_COLORS.blue,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  avatarTextCurrentUser: {
    color: '#FFFFFF',
  },

  // Full View
  fullContainer: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },
  membersList: {
    gap: 10,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  memberNameCurrentUser: {
    fontWeight: '600',
  },
  youBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    backgroundColor: `${IOS_COLORS.blue}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.gray,
  },
});

export default TeamMembersList;
