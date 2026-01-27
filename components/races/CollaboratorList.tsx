/**
 * CollaboratorList Component
 *
 * Displays a list of collaborators on a race card with:
 * - Avatar, name, role display
 * - Pending status indicator
 * - Invite button for owners
 * - Find Crew button for owners
 * - Remove/edit actions for owners
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Avatar, AvatarFallbackText } from '@/components/ui/avatar';
import { RaceCollaborator, AccessLevel } from '@/types/raceCollaboration';
import { IOS_COLORS } from '@/components/cards/constants';
import {
  UserPlus,
  Trash2,
  Copy,
  Share as ShareIcon,
  Clock,
  CheckCircle2,
  Shield,
  Eye,
  Search,
} from 'lucide-react-native';
import { CoachFinderModal } from '@/components/crew/CoachFinderModal';

interface CollaboratorListProps {
  /** List of collaborators */
  collaborators: RaceCollaborator[];
  /** Whether current user is owner */
  isOwner: boolean;
  /** Race ID for crew finder */
  regattaId: string;
  /** Callback to create invite */
  onCreateInvite: (accessLevel?: AccessLevel) => Promise<string>;
  /** Callback to remove collaborator */
  onRemove?: (collaboratorId: string) => void;
  /** Callback to update access level */
  onUpdateAccess?: (collaboratorId: string, level: AccessLevel) => void;
  /** Whether currently loading */
  isLoading?: boolean;
  /** Callback when crew finder sends an invite */
  onCrewFinderInviteSent?: () => void;
}

/**
 * Get initials from collaborator
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
 * Get display name from collaborator
 */
function getDisplayName(collaborator: RaceCollaborator): string {
  return (
    collaborator.displayName ||
    collaborator.profile?.fullName ||
    'Pending invite'
  );
}

export function CollaboratorList({
  collaborators,
  isOwner,
  regattaId,
  onCreateInvite,
  onRemove,
  onUpdateAccess,
  isLoading = false,
  onCrewFinderInviteSent,
}: CollaboratorListProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [showCrewFinder, setShowCrewFinder] = useState(false);

  const handleCrewFinderInviteSent = () => {
    onCrewFinderInviteSent?.();
  };

  const handleCreateInvite = async () => {
    setIsCreatingInvite(true);
    try {
      const code = await onCreateInvite('view');
      setInviteCode(code);
    } catch (error) {
      console.error('Failed to create invite:', error);
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleCopyCode = async () => {
    if (inviteCode) {
      await Clipboard.setStringAsync(inviteCode);
    }
  };

  const handleShareCode = async () => {
    if (inviteCode) {
      // Use web URL on web platform, deep link on native
      const webUrl = Platform.OS === 'web'
        ? `${window.location.origin}/join-race/${inviteCode}`
        : `regattaflow://join-race?code=${inviteCode}`;
      const message = `Join my race on RegattaFlow! Use invite code: ${inviteCode}\n\nOr tap this link: ${webUrl}`;

      try {
        if (Platform.OS === 'web') {
          const nav = typeof navigator !== 'undefined' ? navigator : undefined;
          if (nav?.share) {
            await nav.share({ title: 'Join my race', text: message });
          } else if (nav?.clipboard?.writeText) {
            await nav.clipboard.writeText(message);
            Alert.alert('Copied', 'Invite link copied to clipboard');
          }
        } else {
          const { Share } = await import('react-native');
          await Share.share({ message, title: 'Join my race' });
        }
      } catch (error) {
        console.error('Failed to share:', error);
      }
    }
  };

  const acceptedCollaborators = collaborators.filter((c) => c.status === 'accepted');
  const pendingCollaborators = collaborators.filter((c) => c.status === 'pending');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Invite Section (owner only) */}
      {isOwner && (
        <View style={styles.inviteSection}>
          {inviteCode ? (
            <View style={styles.inviteCodeContainer}>
              <Text style={styles.inviteCodeLabel}>Invite Code</Text>
              <Text style={styles.inviteCode}>{inviteCode}</Text>
              <View style={styles.inviteActions}>
                <Pressable
                  style={styles.inviteActionButton}
                  onPress={handleCopyCode}
                >
                  <Copy size={18} color={IOS_COLORS.blue} />
                  <Text style={styles.inviteActionText}>Copy</Text>
                </Pressable>
                <Pressable
                  style={styles.inviteActionButton}
                  onPress={handleShareCode}
                >
                  <ShareIcon size={18} color={IOS_COLORS.blue} />
                  <Text style={styles.inviteActionText}>Share</Text>
                </Pressable>
                <Pressable
                  style={styles.inviteActionButton}
                  onPress={handleCreateInvite}
                >
                  <UserPlus size={18} color={IOS_COLORS.blue} />
                  <Text style={styles.inviteActionText}>New</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.inviteButtonsRow}>
              <Pressable
                style={[styles.inviteButton, isCreatingInvite && styles.inviteButtonDisabled]}
                onPress={handleCreateInvite}
                disabled={isCreatingInvite}
              >
                <UserPlus size={20} color={IOS_COLORS.blue} />
                <Text style={styles.inviteButtonText}>
                  {isCreatingInvite ? 'Creating...' : 'Invite via Code'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.findCrewButton}
                onPress={() => setShowCrewFinder(true)}
              >
                <Search size={20} color={IOS_COLORS.blue} />
                <Text style={styles.findCrewButtonText}>Find Crew</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Accepted Collaborators */}
      {acceptedCollaborators.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crew ({acceptedCollaborators.length})</Text>
          {acceptedCollaborators.map((collaborator) => (
            <CollaboratorRow
              key={collaborator.id}
              collaborator={collaborator}
              isOwner={isOwner}
              onRemove={onRemove}
              onUpdateAccess={onUpdateAccess}
            />
          ))}
        </View>
      )}

      {/* Pending Invites */}
      {pendingCollaborators.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Invites ({pendingCollaborators.length})</Text>
          {pendingCollaborators.map((collaborator) => (
            <CollaboratorRow
              key={collaborator.id}
              collaborator={collaborator}
              isOwner={isOwner}
              onRemove={onRemove}
              isPending
            />
          ))}
        </View>
      )}

      {/* Empty State */}
      {collaborators.length === 0 && !isLoading && (
        <View style={styles.emptyState}>
          <UserPlus size={48} color={IOS_COLORS.gray3} />
          <Text style={styles.emptyStateTitle}>No crew members yet</Text>
          <Text style={styles.emptyStateText}>
            {isOwner
              ? 'Invite crew members to collaborate on this race'
              : 'Ask the race owner to invite you'}
          </Text>
        </View>
      )}

      {/* Coach Finder Modal */}
      <CoachFinderModal
        regattaId={regattaId}
        isVisible={showCrewFinder}
        onClose={() => setShowCrewFinder(false)}
        onInviteSent={handleCrewFinderInviteSent}
      />
    </ScrollView>
  );
}

/**
 * Individual collaborator row
 */
interface CollaboratorRowProps {
  collaborator: RaceCollaborator;
  isOwner: boolean;
  onRemove?: (collaboratorId: string) => void;
  onUpdateAccess?: (collaboratorId: string, level: AccessLevel) => void;
  isPending?: boolean;
}

function CollaboratorRow({
  collaborator,
  isOwner,
  onRemove,
  onUpdateAccess,
  isPending = false,
}: CollaboratorRowProps) {
  return (
    <View style={styles.collaboratorRow}>
      <Avatar
        size="sm"
        style={{
          backgroundColor:
            collaborator.profile?.avatarColor || IOS_COLORS.blue,
        }}
      >
        {collaborator.profile?.avatarEmoji ? (
          <AvatarFallbackText>{collaborator.profile.avatarEmoji}</AvatarFallbackText>
        ) : (
          <AvatarFallbackText>{getInitials(collaborator)}</AvatarFallbackText>
        )}
      </Avatar>

      <View style={styles.collaboratorInfo}>
        <Text style={styles.collaboratorName}>{getDisplayName(collaborator)}</Text>
        <View style={styles.collaboratorMeta}>
          {collaborator.role && (
            <Text style={styles.collaboratorRole}>{collaborator.role}</Text>
          )}
          {isPending ? (
            <View style={styles.pendingBadge}>
              <Clock size={10} color={IOS_COLORS.orange} />
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          ) : (
            <View style={styles.accessBadge}>
              {collaborator.accessLevel === 'full' ? (
                <>
                  <Shield size={10} color={IOS_COLORS.green} />
                  <Text style={[styles.accessBadgeText, { color: IOS_COLORS.green }]}>
                    Full access
                  </Text>
                </>
              ) : (
                <>
                  <Eye size={10} color={IOS_COLORS.blue} />
                  <Text style={[styles.accessBadgeText, { color: IOS_COLORS.blue }]}>
                    View only
                  </Text>
                </>
              )}
            </View>
          )}
        </View>
      </View>

      {isOwner && onRemove && (
        <Pressable
          style={styles.removeButton}
          onPress={() => onRemove(collaborator.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={18} color={IOS_COLORS.red} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  inviteSection: {
    marginBottom: 8,
  },
  inviteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${IOS_COLORS.blue}15`,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.blue}30`,
  },
  inviteButtonDisabled: {
    opacity: 0.6,
  },
  inviteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  inviteButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  findCrewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${IOS_COLORS.blue}10`,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.blue}30`,
  },
  findCrewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  inviteCodeContainer: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  inviteCodeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inviteCode: {
    fontSize: 28,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  inviteActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  inviteActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  collaboratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: IOS_COLORS.systemBackground,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
  },
  collaboratorInfo: {
    flex: 1,
  },
  collaboratorName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  collaboratorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  collaboratorRole: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${IOS_COLORS.orange}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.orange,
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accessBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  emptyStateText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default CollaboratorList;
