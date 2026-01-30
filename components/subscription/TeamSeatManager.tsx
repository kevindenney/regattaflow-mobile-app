/**
 * Team Seat Manager Component
 *
 * Main interface for managing subscription team members.
 * Shows seat usage, member list, and invite actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { SubscriptionTeamService } from '@/services/SubscriptionTeamService';
import { TeamMemberRow } from './TeamMemberRow';
import { TeamInviteSheet } from './TeamInviteSheet';
import type {
  SubscriptionTeamWithMembers,
  TeamSeatUsage,
} from '@/types/subscriptionTeam';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

interface TeamSeatManagerProps {
  onClose?: () => void;
}

export function TeamSeatManager({ onClose }: TeamSeatManagerProps) {
  const { user } = useAuth();
  const [team, setTeam] = useState<SubscriptionTeamWithMembers | null>(null);
  const [seatUsage, setSeatUsage] = useState<TeamSeatUsage>({ used: 0, max: 5, available: 5 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const loadTeamData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const teamData = await SubscriptionTeamService.getTeam(user.id);
      if (teamData) {
        const teamWithMembers = await SubscriptionTeamService.getTeamWithMembers(teamData.id);
        setTeam(teamWithMembers);

        const usage = await SubscriptionTeamService.getSeatUsage(teamData.id);
        setSeatUsage(usage);

        const ownerStatus = await SubscriptionTeamService.isTeamOwner(user.id, teamData.id);
        setIsOwner(ownerStatus);
      }
    } catch (error) {
      console.error('Failed to load team data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTeamData();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!team) return;

    Alert.alert(
      'Remove Team Member',
      'Are you sure you want to remove this member from your team?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await SubscriptionTeamService.removeMember(team.id, memberId);
            if (success) {
              loadTeamData();
            } else {
              Alert.alert('Error', 'Failed to remove team member');
            }
          },
        },
      ]
    );
  };

  const handleCancelInvite = async (memberId: string) => {
    if (!team) return;

    const success = await SubscriptionTeamService.cancelInvite(team.id, memberId);
    if (success) {
      loadTeamData();
    } else {
      Alert.alert('Error', 'Failed to cancel invite');
    }
  };

  const handleLeaveTeam = async () => {
    if (!user?.id) return;

    Alert.alert(
      'Leave Team',
      'Are you sure you want to leave this team? You will lose access to team features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Team',
          style: 'destructive',
          onPress: async () => {
            const success = await SubscriptionTeamService.leaveTeam(user.id);
            if (success) {
              onClose?.();
            } else {
              Alert.alert('Error', 'Failed to leave team');
            }
          },
        },
      ]
    );
  };

  const handleInviteSuccess = () => {
    setShowInviteSheet(false);
    loadTeamData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={48} color={IOS_COLORS.tertiaryLabel} />
        <Text style={styles.emptyText}>No team found</Text>
        <Text style={styles.emptySubtext}>
          Upgrade to a Team plan to invite team members
        </Text>
      </View>
    );
  }

  const activeMembers = team.members.filter(m => m.status === 'active');
  const pendingMembers = team.members.filter(m => m.status === 'pending');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{team.name}</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={IOS_COLORS.secondaryLabel} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Seat Counter */}
        <View style={styles.seatCounter}>
          <View style={styles.seatInfo}>
            <Text style={styles.seatLabel}>Team Members</Text>
            <Text style={styles.seatCount}>
              {seatUsage.used} / {seatUsage.max}
            </Text>
          </View>
          <View style={styles.seatBar}>
            <View
              style={[
                styles.seatBarFill,
                {
                  width: `${(seatUsage.used / seatUsage.max) * 100}%`,
                  backgroundColor:
                    seatUsage.available === 0
                      ? IOS_COLORS.systemRed
                      : IOS_COLORS.systemBlue,
                },
              ]}
            />
          </View>
          {seatUsage.available > 0 && (
            <Text style={styles.seatAvailable}>
              {seatUsage.available} seat{seatUsage.available !== 1 ? 's' : ''} available
            </Text>
          )}
        </View>

        {/* Active Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>MEMBERS</Text>
          {activeMembers.map((member) => (
            <TeamMemberRow
              key={member.id}
              member={member}
              isOwner={isOwner}
              isSelf={member.user_id === user?.id}
              onRemove={() => handleRemoveMember(member.id)}
            />
          ))}
        </View>

        {/* Pending Invites Section */}
        {pendingMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>PENDING INVITES</Text>
            {pendingMembers.map((member) => (
              <TeamMemberRow
                key={member.id}
                member={member}
                isOwner={isOwner}
                onCancel={() => handleCancelInvite(member.id)}
              />
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {isOwner && seatUsage.available > 0 && (
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => setShowInviteSheet(true)}
            >
              <Ionicons name="person-add" size={20} color="#FFFFFF" />
              <Text style={styles.inviteButtonText}>Invite Member</Text>
            </TouchableOpacity>
          )}

          {!isOwner && (
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={handleLeaveTeam}
            >
              <Ionicons name="exit-outline" size={20} color={IOS_COLORS.systemRed} />
              <Text style={styles.leaveButtonText}>Leave Team</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer info */}
        <Text style={styles.footerNote}>
          Team members share the subscription benefits of the Team plan.
        </Text>
      </ScrollView>

      {/* Invite Sheet */}
      {showInviteSheet && team && (
        <TeamInviteSheet
          teamId={team.id}
          inviteCode={team.invite_code}
          onClose={() => setShowInviteSheet(false)}
          onSuccess={handleInviteSuccess}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: IOS_SPACING.xl,
  },
  emptyText: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.md,
  },
  emptySubtext: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
    marginTop: IOS_SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  title: {
    ...IOS_TYPOGRAPHY.title3,
    color: IOS_COLORS.label,
  },
  content: {
    flex: 1,
  },
  seatCounter: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    marginTop: IOS_SPACING.lg,
    padding: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.lg,
  },
  seatInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: IOS_SPACING.sm,
  },
  seatLabel: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
  },
  seatCount: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  seatBar: {
    height: 8,
    backgroundColor: IOS_COLORS.systemGray5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  seatBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  seatAvailable: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.systemBlue,
    marginTop: IOS_SPACING.xs,
    textAlign: 'right',
  },
  section: {
    marginTop: IOS_SPACING.xl,
  },
  sectionHeader: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.xs,
  },
  actions: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.xl,
    gap: IOS_SPACING.sm,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.systemBlue,
    paddingVertical: IOS_SPACING.md,
    borderRadius: IOS_RADIUS.md,
    gap: IOS_SPACING.xs,
  },
  inviteButtonText: {
    ...IOS_TYPOGRAPHY.headline,
    color: '#FFFFFF',
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: IOS_SPACING.md,
    gap: IOS_SPACING.xs,
  },
  leaveButtonText: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.systemRed,
  },
  footerNote: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
    padding: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.xl,
  },
});

export default TeamSeatManager;
