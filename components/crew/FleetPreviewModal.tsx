/**
 * FleetPreviewModal
 *
 * Shows a preview of a fleet with all its members.
 * Allows users to:
 * - See all fleet members with their avatars
 * - Follow individual members
 * - "Subscribe to All" to follow all members at once
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Users, UserPlus, UserCheck, Sailboat, X, Check, Globe } from 'lucide-react-native';
import { IOS_COLORS } from '@/components/cards/constants';
import { CrewFinderService, SailorProfileSummary } from '@/services/CrewFinderService';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('FleetPreviewModal');

// =============================================================================
// TYPES
// =============================================================================

interface FleetData {
  id: string;
  name: string;
  description?: string;
  club?: { id: string; name: string };
  memberCount?: number;
}

interface FleetMember extends SailorProfileSummary {
  joinedAt?: string;
  role?: string;
}

interface FleetPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  fleetId: string | null;
  onSubscribed?: () => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FleetPreviewModal({
  visible,
  onClose,
  fleetId,
  onSubscribed,
}: FleetPreviewModalProps) {
  const { user } = useAuth();
  const [fleet, setFleet] = useState<FleetData | null>(null);
  const [members, setMembers] = useState<FleetMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loadingFollowId, setLoadingFollowId] = useState<string | null>(null);

  const currentUserId = user?.id;

  // ---------------------------------------------------------------------------
  // LOAD FLEET DATA
  // ---------------------------------------------------------------------------

  const loadFleetData = useCallback(async () => {
    if (!fleetId || !currentUserId) {
      return;
    }

    setLoading(true);

    try {
      // Fetch fleet details
      const { data: fleetData, error: fleetError } = await supabase
        .from('fleets')
        .select('id, name, description, club_id, clubs(id, name)')
        .eq('id', fleetId)
        .single();

      if (fleetError) {
        logger.error('Failed to load fleet:', fleetError);
        return;
      }

      setFleet({
        id: fleetData.id,
        name: fleetData.name,
        description: fleetData.description,
        club: fleetData.clubs ? { id: fleetData.clubs.id, name: fleetData.clubs.name } : undefined,
      });

      // Fetch fleet members
      const { data: membersData, error: membersError } = await supabase
        .from('fleet_members')
        .select('user_id, role, joined_at')
        .eq('fleet_id', fleetId);

      if (membersError) {
        logger.error('Failed to load fleet members:', membersError);
        return;
      }

      // Get unique user IDs (excluding current user)
      const memberUserIds = (membersData || [])
        .map((m: any) => m.user_id)
        .filter((id: string) => id !== currentUserId);

      if (memberUserIds.length === 0) {
        setMembers([]);
        return;
      }

      // Fetch profiles for members
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', memberUserIds);

      const { data: sailorProfiles } = await supabase
        .from('sailor_profiles')
        .select('user_id, avatar_emoji, avatar_color, experience_level')
        .in('user_id', memberUserIds);

      const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const sailorProfilesMap = new Map((sailorProfiles || []).map((sp: any) => [sp.user_id, sp]));

      // Build member list
      const memberList: FleetMember[] = (membersData || [])
        .filter((m: any) => m.user_id !== currentUserId)
        .map((m: any) => {
          const profile = profilesMap.get(m.user_id);
          const sailorProfile = sailorProfilesMap.get(m.user_id);
          return {
            userId: m.user_id,
            fullName: profile?.full_name || 'Unknown',
            avatarEmoji: sailorProfile?.avatar_emoji,
            avatarColor: sailorProfile?.avatar_color,
            sailingExperience: sailorProfile?.experience_level,
            joinedAt: m.joined_at,
            role: m.role,
          };
        });

      setMembers(memberList);

      // Check which members the user is already following
      const followingList = await CrewFinderService.getFollowingIds(currentUserId);
      setFollowingIds(new Set(followingList));
    } catch (error) {
      logger.error('Error loading fleet data:', error);
    } finally {
      setLoading(false);
    }
  }, [fleetId, currentUserId]);

  useEffect(() => {
    if (visible && fleetId) {
      loadFleetData();
    }
  }, [visible, fleetId, loadFleetData]);

  // ---------------------------------------------------------------------------
  // FOLLOW ACTIONS
  // ---------------------------------------------------------------------------

  const handleFollowMember = useCallback(async (memberId: string) => {
    if (!currentUserId) return;

    setLoadingFollowId(memberId);

    try {
      if (followingIds.has(memberId)) {
        await CrewFinderService.unfollowUser(currentUserId, memberId);
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(memberId);
          return next;
        });
      } else {
        await CrewFinderService.followUser(currentUserId, memberId);
        setFollowingIds((prev) => new Set([...prev, memberId]));
      }
    } catch (error) {
      logger.error('Error toggling follow:', error);
    } finally {
      setLoadingFollowId(null);
    }
  }, [currentUserId, followingIds]);

  const handleSubscribeToAll = useCallback(async () => {
    if (!currentUserId || !fleetId) return;

    setSubscribing(true);

    try {
      const result = await CrewFinderService.subscribeToFleet(currentUserId, fleetId);

      if (result.followed > 0) {
        // Update local following state
        const memberIds = members.map((m) => m.userId);
        setFollowingIds(new Set([...followingIds, ...memberIds]));

        Alert.alert(
          'Subscribed to Fleet',
          `Now following ${result.followed} sailor${result.followed > 1 ? 's' : ''} from this fleet.`,
          [{ text: 'OK' }]
        );

        onSubscribed?.();
      } else {
        Alert.alert(
          'Already Following',
          'You are already following all members of this fleet.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      logger.error('Error subscribing to fleet:', error);
      Alert.alert(
        'Subscription Failed',
        error?.message || 'Could not subscribe to fleet. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubscribing(false);
    }
  }, [currentUserId, fleetId, members, followingIds, onSubscribed]);

  // ---------------------------------------------------------------------------
  // RENDER HELPERS
  // ---------------------------------------------------------------------------

  const renderMemberRow = (member: FleetMember) => {
    const isFollowing = followingIds.has(member.userId);
    const isLoading = loadingFollowId === member.userId;

    return (
      <View key={member.userId} style={styles.memberRow}>
        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            { backgroundColor: member.avatarColor || IOS_COLORS.blue },
          ]}
        >
          <Text style={styles.avatarEmoji}>{member.avatarEmoji || '⛵'}</Text>
        </View>

        {/* Name & Role */}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.fullName}</Text>
          {member.role && (
            <Text style={styles.memberRole}>{member.role}</Text>
          )}
        </View>

        {/* Follow Button */}
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followButtonActive]}
          onPress={() => handleFollowMember(member.userId)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={isFollowing ? IOS_COLORS.gray : IOS_COLORS.blue} />
          ) : isFollowing ? (
            <>
              <UserCheck size={16} color={IOS_COLORS.gray} />
              <Text style={styles.followButtonTextActive}>Following</Text>
            </>
          ) : (
            <>
              <UserPlus size={16} color={IOS_COLORS.blue} />
              <Text style={styles.followButtonText}>Follow</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const notFollowingCount = members.filter((m) => !followingIds.has(m.userId)).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Users size={24} color={IOS_COLORS.blue} />
              <View style={styles.headerText}>
                <Text style={styles.modalTitle}>{fleet?.name || 'Fleet'}</Text>
                {fleet?.club && (
                  <Text style={styles.clubName}>{fleet.club.name}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={IOS_COLORS.gray} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          {fleet?.description && (
            <Text style={styles.description}>{fleet.description}</Text>
          )}

          {/* Subscribe Button */}
          {notFollowingCount > 0 && (
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={handleSubscribeToAll}
              disabled={subscribing}
            >
              {subscribing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Globe size={20} color="#FFFFFF" />
                  <Text style={styles.subscribeButtonText}>
                    Follow All {notFollowingCount} Members
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Members List */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MEMBERS</Text>
            <Text style={styles.sectionCount}>{members.length}</Text>
          </View>

          <ScrollView
            style={styles.memberList}
            contentContainerStyle={styles.memberListContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={IOS_COLORS.blue} />
                <Text style={styles.loadingText}>Loading fleet members...</Text>
              </View>
            ) : members.length === 0 ? (
              <View style={styles.emptyState}>
                <Sailboat size={48} color={IOS_COLORS.gray3} />
                <Text style={styles.emptyText}>No other members</Text>
                <Text style={styles.emptySubtext}>
                  You're the only member of this fleet
                </Text>
              </View>
            ) : (
              members.map(renderMemberRow)
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  clubName: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    paddingHorizontal: 20,
    paddingBottom: 16,
    lineHeight: 20,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.blue,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  memberList: {
    flex: 1,
  },
  memberListContent: {
    paddingBottom: 20,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  memberRole: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: IOS_COLORS.gray6,
    gap: 6,
  },
  followButtonActive: {
    backgroundColor: IOS_COLORS.gray5,
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  followButtonTextActive: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },
});

export default FleetPreviewModal;
