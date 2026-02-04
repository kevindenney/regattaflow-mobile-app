/**
 * ThreadMembersModal - View and manage thread members
 *
 * iOS-style modal for viewing members of a crew thread.
 * Owners/admins can remove members. Shows role badges.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Crown, Shield, UserMinus } from 'lucide-react-native';
import { CrewThreadService, CrewThreadMember } from '@/services/CrewThreadService';
import { getInitials } from '@/components/account/accountStyles';
import {
  IOS_COLORS,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

// =============================================================================
// TYPES
// =============================================================================

interface ThreadMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  threadId: string;
  threadName?: string;
  currentUserRole: 'owner' | 'admin' | 'member';
  currentUserId?: string;
  onMemberRemoved?: () => void;
}

// =============================================================================
// MEMBER ROW
// =============================================================================

function MemberRow({
  member,
  canRemove,
  onRemove,
  isRemoving,
  isLast,
}: {
  member: CrewThreadMember;
  canRemove: boolean;
  onRemove: () => void;
  isRemoving: boolean;
  isLast: boolean;
}) {
  const displayName = member.fullName || 'Unknown';
  const initials = getInitials(displayName);

  const getRoleBadge = () => {
    if (member.role === 'owner') {
      return (
        <View style={[styles.roleBadge, styles.roleBadgeOwner]}>
          <Crown size={10} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.roleBadgeText}>Owner</Text>
        </View>
      );
    }
    if (member.role === 'admin') {
      return (
        <View style={[styles.roleBadge, styles.roleBadgeAdmin]}>
          <Shield size={10} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.roleBadgeText}>Admin</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.memberRow, !isLast && styles.memberRowBorder]}>
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: member.avatarColor || IOS_COLORS.systemGray4 },
        ]}
      >
        {member.avatarEmoji ? (
          <Text style={styles.avatarEmoji}>{member.avatarEmoji}</Text>
        ) : (
          <Text style={styles.avatarInitials}>{initials}</Text>
        )}
      </View>

      {/* Info */}
      <View style={styles.memberInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.memberName} numberOfLines={1}>
            {displayName}
          </Text>
          {getRoleBadge()}
        </View>
        <Text style={styles.memberJoined}>
          Joined {formatJoinDate(member.joinedAt)}
        </Text>
      </View>

      {/* Remove button */}
      {canRemove && (
        <Pressable
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.removeButtonPressed,
          ]}
          onPress={onRemove}
          disabled={isRemoving}
        >
          {isRemoving ? (
            <ActivityIndicator size="small" color={IOS_COLORS.systemRed} />
          ) : (
            <UserMinus size={20} color={IOS_COLORS.systemRed} strokeWidth={1.5} />
          )}
        </Pressable>
      )}
    </View>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatJoinDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ThreadMembersModal({
  isOpen,
  onClose,
  threadId,
  threadName,
  currentUserRole,
  currentUserId,
  onMemberRemoved,
}: ThreadMembersModalProps) {
  const insets = useSafeAreaInsets();
  const [members, setMembers] = useState<CrewThreadMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(400));

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  // Fetch members
  useEffect(() => {
    if (!isOpen || !threadId) return;

    const fetchMembers = async () => {
      setIsLoading(true);
      const data = await CrewThreadService.getThreadMembers(threadId);
      // Sort: owner first, then admins, then members
      const sorted = data.sort((a, b) => {
        const roleOrder = { owner: 0, admin: 1, member: 2 };
        return roleOrder[a.role] - roleOrder[b.role];
      });
      setMembers(sorted);
      setIsLoading(false);
    };

    fetchMembers();
  }, [isOpen, threadId]);

  // Animations
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 28,
          stiffness: 400,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 400,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, fadeAnim, slideAnim]);

  const handleRemoveMember = useCallback(
    async (member: CrewThreadMember) => {
      Alert.alert(
        'Remove Member',
        `Remove ${member.fullName || 'this member'} from the thread?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              setRemovingId(member.userId);
              const success = await CrewThreadService.removeMember(threadId, member.userId);
              setRemovingId(null);

              if (success) {
                setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
                onMemberRemoved?.();
              } else {
                Alert.alert('Error', 'Could not remove member');
              }
            },
          },
        ]
      );
    },
    [threadId, onMemberRemoved]
  );

  const renderMember = useCallback(
    ({ item, index }: { item: CrewThreadMember; index: number }) => {
      // Can't remove yourself (use Leave Thread instead)
      // Can't remove the owner
      // Only owner/admin can remove others
      const canRemove =
        canManageMembers &&
        item.userId !== currentUserId &&
        item.role !== 'owner';

      return (
        <MemberRow
          member={item}
          canRemove={canRemove}
          onRemove={() => handleRemoveMember(item)}
          isRemoving={removingId === item.userId}
          isLast={index === members.length - 1}
        />
      );
    },
    [canManageMembers, currentUserId, removingId, members.length, handleRemoveMember]
  );

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
      </Animated.View>

      {/* Modal */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            paddingBottom: insets.bottom || IOS_SPACING.lg,
            transform: [{ translateY: slideAnim }],
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Members</Text>
              {threadName && (
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {threadName}
                </Text>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              onPress={onClose}
            >
              <X size={20} color={IOS_COLORS.secondaryLabel} strokeWidth={2} />
            </Pressable>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
            </View>
          ) : members.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No members found</Text>
            </View>
          ) : (
            <FlatList
              data={members}
              renderItem={renderMember}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const AVATAR_SIZE = 44;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdropPressable: {
    flex: 1,
  },

  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70%',
  },

  modal: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: IOS_SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: IOS_COLORS.quaternarySystemFill,
  },

  // Loading/Empty
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },

  // List
  list: {
    maxHeight: 400,
  },
  listContent: {
    paddingVertical: IOS_SPACING.sm,
  },

  // Member Row
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: IOS_SPACING.lg,
  },
  memberRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    marginLeft: IOS_SPACING.lg + AVATAR_SIZE + 12,
    paddingLeft: 0,
    marginRight: 0,
  },

  // Avatar
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Member Info
  memberInfo: {
    flex: 1,
    marginRight: IOS_SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 17,
    fontWeight: '500',
    color: IOS_COLORS.label,
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  memberJoined: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },

  // Role Badge
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  roleBadgeOwner: {
    backgroundColor: IOS_COLORS.systemOrange,
  },
  roleBadgeAdmin: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Remove Button
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonPressed: {
    backgroundColor: IOS_COLORS.systemGray6,
  },
});

export default ThreadMembersModal;
