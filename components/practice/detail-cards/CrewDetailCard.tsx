/**
 * Crew Detail Card
 *
 * Apple HIG compliant card showing:
 * - Member list with roles and RSVP status
 * - Invite code for sharing
 * - Attendance tracking (for completed sessions)
 *
 * Tufte design: Clear hierarchy, minimal decoration.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Pressable,
  Share,
} from 'react-native';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Share as ShareIcon,
  ChevronRight,
  Crown,
  Anchor,
  Eye,
  UserCog,
} from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { IOS_COLORS } from '@/components/cards/constants';
import { CARD_EXPAND_DURATION, CARD_COLLAPSE_DURATION } from '@/constants/navigationAnimations';
import { PracticeSessionMember, PracticeMemberRole, RSVPStatus } from '@/types/practice';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// RSVP status colors
const RSVP_COLORS: Record<RSVPStatus, string> = {
  pending: IOS_COLORS.gray,
  accepted: IOS_COLORS.green,
  declined: IOS_COLORS.red,
  maybe: IOS_COLORS.orange,
};

// Role icons
function RoleIcon({ role, size = 14 }: { role: PracticeMemberRole; size?: number }) {
  switch (role) {
    case 'organizer':
      return <Crown size={size} color={IOS_COLORS.orange} />;
    case 'skipper':
      return <Anchor size={size} color={IOS_COLORS.blue} />;
    case 'coach':
      return <UserCog size={size} color={IOS_COLORS.purple} />;
    case 'observer':
      return <Eye size={size} color={IOS_COLORS.gray} />;
    default:
      return <Users size={size} color={IOS_COLORS.gray} />;
  }
}

interface CrewDetailCardProps {
  members: PracticeSessionMember[];
  maxCrewSize?: number;
  inviteCode?: string | null;
  inviteLink?: string | null;
  isOrganizer?: boolean;
  sessionStatus?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  isExpanded?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  onGenerateInvite?: () => Promise<string>;
  onClearInvite?: () => void;
  onInviteMember?: () => void;
  onMarkAttendance?: (memberId: string, attended: boolean) => void;
}

export function CrewDetailCard({
  members,
  maxCrewSize = 4,
  inviteCode,
  inviteLink,
  isOrganizer = false,
  sessionStatus = 'planned',
  isExpanded = false,
  onToggle,
  onPress,
  onGenerateInvite,
  onClearInvite,
  onInviteMember,
  onMarkAttendance,
}: CrewDetailCardProps) {
  const rotation = useSharedValue(isExpanded ? 1 : 0);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    rotation.value = withTiming(isExpanded ? 1 : 0, {
      duration: isExpanded ? CARD_EXPAND_DURATION : CARD_COLLAPSE_DURATION,
    });
  }, [isExpanded, rotation]);

  const chevronStyle = useAnimatedStyle(() => {
    'worklet';
    const rotationValue = rotation.value ?? 0;
    return {
      transform: [{ rotate: `${interpolate(rotationValue, [0, 1], [0, 90])}deg` }],
    };
  });

  const handlePress = () => {
    LayoutAnimation.configureNext({
      duration: isExpanded ? CARD_COLLAPSE_DURATION : CARD_EXPAND_DURATION,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
    if (onToggle) {
      onToggle();
    } else if (onPress) {
      onPress();
    }
  };

  const handleCopyCode = async () => {
    if (inviteCode) {
      await Clipboard.setStringAsync(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (inviteLink || inviteCode) {
      try {
        await Share.share({
          message: `Join my practice session!\n\nInvite code: ${inviteCode}\n\n${inviteLink || ''}`,
        });
      } catch (error) {
        // User cancelled or error
      }
    }
  };

  const confirmedCount = members.filter((m) => m.rsvpStatus === 'accepted').length;
  const pendingCount = members.filter((m) => m.rsvpStatus === 'pending').length;
  const attendedCount = members.filter((m) => m.attended).length;
  const isCompleted = sessionStatus === 'completed';

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      {/* Collapsed View */}
      {!isExpanded && (
        <View style={styles.tufteGrid}>
          {/* Crew summary row */}
          <View style={styles.tufteRow}>
            <Users size={18} color={IOS_COLORS.blue} />
            <Text style={styles.tufteValue}>
              {isCompleted
                ? `${attendedCount} attended`
                : `${confirmedCount}/${maxCrewSize} confirmed`}
            </Text>
            {pendingCount > 0 && !isCompleted && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingCount} pending</Text>
              </View>
            )}
            <Animated.View style={chevronStyle}>
              <MaterialCommunityIcons name="chevron-right" size={18} color={IOS_COLORS.gray3} />
            </Animated.View>
          </View>

          {/* Member avatars */}
          {members.length > 0 && (
            <View style={styles.avatarRow}>
              {members.slice(0, 5).map((member, index) => (
                <View
                  key={member.id}
                  style={[
                    styles.avatar,
                    { marginLeft: index > 0 ? -8 : 0, zIndex: 5 - index },
                    { backgroundColor: RSVP_COLORS[member.rsvpStatus] },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {(member.displayName || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              ))}
              {members.length > 5 && (
                <View style={[styles.avatar, styles.avatarOverflow, { marginLeft: -8 }]}>
                  <Text style={styles.avatarOverflowText}>+{members.length - 5}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionLabel}>CREW</Text>
            <Text style={styles.crewCount}>
              {isCompleted
                ? `${attendedCount}/${members.length} attended`
                : `${confirmedCount}/${maxCrewSize}`}
            </Text>
          </View>

          {/* Member List */}
          <View style={styles.memberList}>
            {members.map((member) => (
              <View key={member.id} style={styles.memberItem}>
                <View
                  style={[
                    styles.memberAvatar,
                    { backgroundColor: RSVP_COLORS[member.rsvpStatus] },
                  ]}
                >
                  <Text style={styles.memberAvatarText}>
                    {(member.displayName || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.displayName || 'Unknown'}</Text>
                  <View style={styles.memberMeta}>
                    <RoleIcon role={member.role} size={12} />
                    <Text style={styles.memberRole}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Text>
                  </View>
                </View>
                {isCompleted && isOrganizer && onMarkAttendance ? (
                  <Pressable
                    style={[
                      styles.attendanceButton,
                      member.attended && styles.attendanceButtonActive,
                    ]}
                    onPress={() => onMarkAttendance(member.id, !member.attended)}
                  >
                    {member.attended ? (
                      <Check size={16} color={IOS_COLORS.systemBackground} />
                    ) : (
                      <Text style={styles.attendanceButtonText}>Mark</Text>
                    )}
                  </Pressable>
                ) : (
                  <View
                    style={[
                      styles.rsvpBadge,
                      { backgroundColor: `${RSVP_COLORS[member.rsvpStatus]}15` },
                    ]}
                  >
                    <Text
                      style={[styles.rsvpBadgeText, { color: RSVP_COLORS[member.rsvpStatus] }]}
                    >
                      {member.rsvpStatus.charAt(0).toUpperCase() + member.rsvpStatus.slice(1)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Invite Section */}
          {isOrganizer && sessionStatus === 'planned' && (
            <View style={styles.inviteSection}>
              <Text style={styles.inviteLabel}>INVITE CODE</Text>
              {inviteCode ? (
                <View style={styles.inviteCodeRow}>
                  <View style={styles.inviteCodeBox}>
                    <Text style={styles.inviteCodeText}>{inviteCode}</Text>
                  </View>
                  <Pressable style={styles.copyButton} onPress={handleCopyCode}>
                    {copied ? (
                      <Check size={18} color={IOS_COLORS.green} />
                    ) : (
                      <Copy size={18} color={IOS_COLORS.blue} />
                    )}
                  </Pressable>
                  <Pressable style={styles.shareButton} onPress={handleShare}>
                    <ShareIcon size={18} color={IOS_COLORS.blue} />
                  </Pressable>
                </View>
              ) : onGenerateInvite ? (
                <Pressable style={styles.generateButton} onPress={onGenerateInvite}>
                  <UserPlus size={18} color={IOS_COLORS.blue} />
                  <Text style={styles.generateButtonText}>Generate Invite Code</Text>
                </Pressable>
              ) : null}

              {/* Direct invite button */}
              {onInviteMember && (
                <Pressable style={styles.inviteButton} onPress={onInviteMember}>
                  <UserPlus size={16} color={IOS_COLORS.systemBackground} />
                  <Text style={styles.inviteButtonText}>Invite Crew Member</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Empty state */}
          {members.length === 0 && (
            <View style={styles.emptyMemberState}>
              <Users size={24} color={IOS_COLORS.gray3} />
              <Text style={styles.emptyMemberText}>No crew members yet</Text>
              <Text style={styles.emptyMemberSubtext}>
                Share the invite code to add crew members
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    flex: 1,
  },
  tufteGrid: {
    gap: 10,
  },
  tufteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tufteValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  pendingBadge: {
    backgroundColor: `${IOS_COLORS.orange}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.orange,
  },
  avatarRow: {
    flexDirection: 'row',
    marginLeft: 28,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: IOS_COLORS.systemBackground,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: IOS_COLORS.systemBackground,
  },
  avatarOverflow: {
    backgroundColor: IOS_COLORS.gray,
  },
  avatarOverflowText: {
    fontSize: 10,
    fontWeight: '700',
    color: IOS_COLORS.systemBackground,
  },
  expandedContent: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  crewCount: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  memberList: {
    gap: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: IOS_COLORS.systemBackground,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  memberRole: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  rsvpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rsvpBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  attendanceButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: IOS_COLORS.gray5,
  },
  attendanceButtonActive: {
    backgroundColor: IOS_COLORS.green,
  },
  attendanceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
  inviteSection: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
    gap: 10,
  },
  inviteLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inviteCodeBox: {
    flex: 1,
    backgroundColor: IOS_COLORS.gray6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    borderStyle: 'dashed',
  },
  inviteCodeText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: IOS_COLORS.label,
    letterSpacing: 2,
    textAlign: 'center',
  },
  copyButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    borderStyle: 'dashed',
  },
  generateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 10,
  },
  inviteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.systemBackground,
  },
  emptyMemberState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyMemberText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptyMemberSubtext: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },
});

export default CrewDetailCard;
