/**
 * CollaborationPopover
 *
 * Apple-style collaboration popover showing:
 * - Crew member list with presence dots and roles
 * - Recent activity summary
 * - "Manage Crew" action button
 *
 * Presented as a bottom sheet (Actionsheet) triggered from the avatar row.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from '@/components/ui/actionsheet';
import { Phone, MessageSquare, Settings, Circle } from 'lucide-react-native';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';
import type { RaceCollaborator } from '@/types/raceCollaboration';
import type { RaceMessage } from '@/types/raceCollaboration';

// =============================================================================
// TYPES
// =============================================================================

interface CollaborationPopoverProps {
  visible: boolean;
  onClose: () => void;
  collaborators: RaceCollaborator[];
  /** Set of user IDs currently present */
  presentUserIds?: Set<string>;
  /** Recent messages for activity summary */
  recentMessages?: RaceMessage[];
  /** Current user ID */
  currentUserId?: string;
  /** Callback to open manage crew screen */
  onManageCrew?: () => void;
  /** Callback to open chat */
  onOpenChat?: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function getDisplayName(collab: RaceCollaborator): string {
  return (
    collab.profile?.fullName ||
    collab.displayName ||
    'Unknown'
  );
}

function getInitials(collab: RaceCollaborator): string {
  const name = getDisplayName(collab);
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getAvatarColor(index: number): string {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  ];
  return colors[index % colors.length];
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CollaborationPopover({
  visible,
  onClose,
  collaborators,
  presentUserIds,
  recentMessages = [],
  currentUserId,
  onManageCrew,
  onOpenChat,
}: CollaborationPopoverProps) {
  const accepted = collaborators.filter((c) => c.status === 'accepted');
  const pending = collaborators.filter((c) => c.status === 'pending');

  // Recent system messages for activity summary (last 3)
  const recentActivity = recentMessages
    .filter((m) => m.messageType === 'system')
    .slice(-3)
    .reverse();

  return (
    <Actionsheet isOpen={visible} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent style={styles.content}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Crew</Text>
          <Text style={styles.headerCount}>
            {accepted.length} member{accepted.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Crew members list */}
        <View style={styles.memberList}>
          {accepted.map((collab, index) => {
            const isPresent = presentUserIds?.has(collab.userId || '');
            const isCurrentUser = collab.userId === currentUserId;

            return (
              <View key={collab.id} style={styles.memberRow}>
                {/* Avatar */}
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor:
                        collab.profile?.avatarColor || getAvatarColor(index),
                    },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {collab.profile?.avatarEmoji || getInitials(collab)}
                  </Text>
                  {/* Presence dot */}
                  {isPresent && <View style={styles.presenceDot} />}
                </View>

                {/* Info */}
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {getDisplayName(collab)}
                    {isCurrentUser ? ' (you)' : ''}
                  </Text>
                  {collab.role && (
                    <Text style={styles.memberRole} numberOfLines={1}>
                      {collab.role}
                    </Text>
                  )}
                </View>

                {/* Status */}
                <Text
                  style={[
                    styles.statusText,
                    isPresent && styles.statusTextOnline,
                  ]}
                >
                  {isPresent ? 'Viewing' : ''}
                </Text>
              </View>
            );
          })}

          {/* Pending invites */}
          {pending.length > 0 && (
            <View style={styles.pendingSection}>
              <Text style={styles.pendingSectionTitle}>
                Pending ({pending.length})
              </Text>
              {pending.map((collab) => (
                <View key={collab.id} style={styles.memberRow}>
                  <View style={[styles.avatar, styles.pendingAvatar]}>
                    <Text style={[styles.avatarText, styles.pendingAvatarText]}>
                      {getInitials(collab)}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text
                      style={[styles.memberName, styles.pendingName]}
                      numberOfLines={1}
                    >
                      {getDisplayName(collab)}
                    </Text>
                    {collab.role && (
                      <Text style={styles.memberRole}>{collab.role}</Text>
                    )}
                  </View>
                  <Text style={styles.pendingBadge}>Invited</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recent activity */}
        {recentActivity.length > 0 && (
          <View style={styles.activitySection}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
            {recentActivity.map((msg) => (
              <View key={msg.id} style={styles.activityRow}>
                <Circle
                  size={6}
                  color={IOS_COLORS.systemGray3}
                  fill={IOS_COLORS.systemGray3}
                />
                <Text style={styles.activityText} numberOfLines={2}>
                  {msg.message}
                </Text>
                <Text style={styles.activityTime}>
                  {formatRelativeTime(msg.createdAt)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          {onOpenChat && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => {
                onClose();
                onOpenChat();
              }}
            >
              <MessageSquare size={18} color={IOS_COLORS.systemBlue} />
              <Text style={styles.actionButtonText}>Crew Chat</Text>
            </Pressable>
          )}
          {onManageCrew && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => {
                onClose();
                onManageCrew();
              }}
            >
              <Settings size={18} color={IOS_COLORS.systemBlue} />
              <Text style={styles.actionButtonText}>Manage Crew</Text>
            </Pressable>
          )}
        </View>
      </ActionsheetContent>
    </Actionsheet>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  content: {
    paddingBottom: 34, // Safe area
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.md,
    paddingBottom: IOS_SPACING.sm,
  },
  headerTitle: {
    ...IOS_TYPOGRAPHY.title3,
    color: IOS_COLORS.label,
  },
  headerCount: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
  },
  memberList: {
    paddingHorizontal: IOS_SPACING.lg,
    gap: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.sm,
    gap: IOS_SPACING.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  presenceDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: IOS_COLORS.systemGreen,
    borderWidth: 2,
    borderColor: IOS_COLORS.systemBackground,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
  },
  memberRole: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
  },
  statusText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
  },
  statusTextOnline: {
    color: IOS_COLORS.systemGreen,
    fontWeight: '500',
  },
  pendingSection: {
    marginTop: IOS_SPACING.sm,
    paddingTop: IOS_SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  pendingSectionTitle: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: IOS_SPACING.xs,
  },
  pendingAvatar: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
  pendingAvatarText: {
    color: IOS_COLORS.systemGray,
  },
  pendingName: {
    color: IOS_COLORS.secondaryLabel,
  },
  pendingBadge: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.systemOrange,
    fontWeight: '500',
  },
  activitySection: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.lg,
    gap: IOS_SPACING.sm,
  },
  activityTitle: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: IOS_SPACING.sm,
  },
  activityText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.label,
    flex: 1,
    lineHeight: 18,
  },
  activityTime: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.tertiaryLabel,
  },
  actions: {
    flexDirection: 'row',
    gap: IOS_SPACING.sm,
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.xl,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },
});

export default CollaborationPopover;
