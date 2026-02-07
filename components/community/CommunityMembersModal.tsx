/**
 * CommunityMembersModal
 *
 * iOS-style bottom sheet modal displaying community members.
 * Shows member avatars, names, roles, and join dates.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Crown, Shield } from 'lucide-react-native';
import { useCommunityMembers } from '@/hooks/useCommunities';
import { getInitials } from '@/components/account/accountStyles';
import {
  IOS_COLORS,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';
import type { CommunityMembership } from '@/types/community';

// =============================================================================
// TYPES
// =============================================================================

interface CommunityMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  communityName?: string;
  memberCount?: number;
}

// =============================================================================
// MEMBER ROW
// =============================================================================

function MemberRow({
  member,
  isLast,
}: {
  member: CommunityMembership;
  isLast: boolean;
}) {
  const displayName = member.user?.full_name || 'Unknown';
  const initials = getInitials(displayName);
  const avatarUrl = member.user?.avatar_url;

  const getRoleBadge = () => {
    if (member.role === 'admin') {
      return (
        <View style={[styles.roleBadge, styles.roleBadgeAdmin]}>
          <Crown size={10} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.roleBadgeText}>Admin</Text>
        </View>
      );
    }
    if (member.role === 'moderator') {
      return (
        <View style={[styles.roleBadge, styles.roleBadgeModerator]}>
          <Shield size={10} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.roleBadgeText}>Mod</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.memberRow, !isLast && styles.memberRowBorder]}>
      {/* Avatar */}
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.memberInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.memberName} numberOfLines={1}>
            {displayName}
          </Text>
          {getRoleBadge()}
        </View>
        <Text style={styles.memberJoined}>
          Joined {formatJoinDate(member.joined_at)}
        </Text>
      </View>
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

export function CommunityMembersModal({
  isOpen,
  onClose,
  communityId,
  communityName,
  memberCount,
}: CommunityMembersModalProps) {
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useCommunityMembers(communityId, isOpen);
  const members = data?.data ?? [];

  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(400));

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

  // Sort members: admins first, then moderators, then regular members
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder: Record<string, number> = { admin: 0, moderator: 1, member: 2 };
    return (roleOrder[a.role] ?? 2) - (roleOrder[b.role] ?? 2);
  });

  const renderMember = ({ item, index }: { item: CommunityMembership; index: number }) => (
    <MemberRow member={item} isLast={index === sortedMembers.length - 1} />
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
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>
                {memberCount ? `${memberCount} Members` : 'Members'}
              </Text>
              {communityName && (
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {communityName}
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
              <Text style={styles.emptyText}>No members yet</Text>
              <Text style={styles.emptySubtext}>Be the first to join!</Text>
            </View>
          ) : (
            <FlatList
              data={sortedMembers}
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

  // Handle
  handleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: IOS_COLORS.systemGray4,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  emptySubtext: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
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
  },

  // Avatar
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: IOS_COLORS.systemBlue,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: IOS_RADIUS.sm,
    gap: 3,
  },
  roleBadgeAdmin: {
    backgroundColor: IOS_COLORS.systemOrange,
  },
  roleBadgeModerator: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

export default CommunityMembersModal;
