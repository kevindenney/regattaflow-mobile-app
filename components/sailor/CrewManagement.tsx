/**
 * CrewManagement Component
 *
 * Tufte-style crew management with dense table layout.
 * Typography hierarchy replaces decorative cards and badges.
 *
 * Design principles:
 * - Maximum data-ink ratio
 * - Inline status dots (not colored badges)
 * - Dense, scannable layout
 * - Whitespace separation (no background fills)
 */

import {
  AvailabilityStatus,
  CrewInvite,
  crewManagementService,
  CrewMember,
  CrewMemberWithAvailability,
  CrewRole,
} from '@/services/crewManagementService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CardMenu, CardMenuItem } from '../shared';
import { createLogger } from '@/lib/utils/logger';
import {
  tufteCrewStyles as styles,
  STATUS_COLORS,
  ROLE_ABBREVIATIONS,
} from './crewStyles';
import { IOS_COLORS } from '@/components/cards/constants';

interface CrewManagementProps {
  sailorId: string;
  classId: string;
  className: string;
  sailNumber?: string;
  compact?: boolean;
  onManagePress?: () => void;
  onSelectMemberForAvailability?: (member: CrewMember) => void;
}

const logger = createLogger('CrewManagement');

const ROLES: CrewRole[] = [
  'helmsman',
  'tactician',
  'trimmer',
  'bowman',
  'pit',
  'grinder',
  'other',
];

export function CrewManagement({
  sailorId,
  classId,
  className,
  sailNumber,
  compact = false,
  onManagePress,
  onSelectMemberForAvailability,
}: CrewManagementProps) {
  const [crew, setCrew] = useState<CrewMemberWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);
  const [inviteForm, setInviteForm] = useState<CrewInvite>({
    email: '',
    name: '',
    role: 'trimmer',
  });
  const [editForm, setEditForm] = useState<{
    name: string;
    role: CrewRole;
    notes: string;
  }>({
    name: '',
    role: 'trimmer',
    notes: '',
  });

  useEffect(() => {
    loadCrew();
  }, [classId]);

  const loadCrew = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const data = await crewManagementService.getCrewWithAvailability(
        sailorId,
        classId,
        today
      );
      setCrew(data);
    } catch (err) {
      console.error('Error loading crew:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteCrew = async () => {
    if (!inviteForm.name) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      if (inviteForm.email && inviteForm.email.trim()) {
        await crewManagementService.inviteCrewMember(sailorId, classId, inviteForm);
        Alert.alert('Success', `Invite sent to ${inviteForm.name}`);
      } else {
        await crewManagementService.addCrewMember(sailorId, classId, {
          name: inviteForm.name,
          email: undefined,
          role: inviteForm.role,
          accessLevel: inviteForm.accessLevel,
          notes: inviteForm.notes,
        });
        Alert.alert('Success', `${inviteForm.name} added to crew`);
      }
      setShowInviteModal(false);
      setInviteForm({ email: '', name: '', role: 'trimmer' });
      loadCrew();
    } catch (err: any) {
      if (err?.queuedForSync && err?.entity) {
        setCrew((prev) => [...prev, err.entity as CrewMember]);
        const action = inviteForm.email ? 'invited' : 'added';
        Alert.alert(
          'Offline',
          `${inviteForm.name} will be ${action} once you're back online.`
        );
        setShowInviteModal(false);
        setInviteForm({ email: '', name: '', role: 'trimmer' });
      } else {
        console.error('Error adding/inviting crew:', err);
        Alert.alert(
          'Error',
          inviteForm.email ? 'Failed to send invite' : 'Failed to add crew member'
        );
      }
    }
  };

  const handleRemoveCrew = (member: CrewMember) => {
    Alert.alert('Remove Crew Member', `Remove ${member.name} from your crew?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await crewManagementService.removeCrewMember(member.id);
            loadCrew();
          } catch (err: any) {
            if (err?.queuedForSync) {
              setCrew((prev) => prev.filter((c) => c.id !== member.id));
              Alert.alert(
                'Offline',
                `${member.name} will be removed when you're back online.`
              );
            } else {
              Alert.alert('Error', 'Failed to remove crew member');
            }
          }
        },
      },
    ]);
  };

  const handleResendInvite = async (member: CrewMember) => {
    try {
      await crewManagementService.resendInvite(member.id);
      Alert.alert('Success', `Invite resent to ${member.name}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to resend invite');
    }
  };

  const handleEditCrew = (member: CrewMember) => {
    setSelectedMember(member);
    setEditForm({
      name: member.name,
      role: member.role,
      notes: member.notes || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedMember) return;

    try {
      await crewManagementService.updateCrewMember(selectedMember.id, {
        name: editForm.name,
        role: editForm.role,
        notes: editForm.notes,
      });
      Alert.alert('Success', 'Crew member updated');
      setShowEditModal(false);
      setSelectedMember(null);
      loadCrew();
    } catch (err: any) {
      if (err?.queuedForSync && err?.entity?.updates) {
        const updates = err.entity.updates as Partial<CrewMember>;
        setCrew((prev) =>
          prev.map((crewMember) => {
            if (crewMember.id !== selectedMember.id) return crewMember;
            return {
              ...crewMember,
              ...updates,
              queuedForSync: true,
            } as CrewMember;
          })
        );
        Alert.alert('Offline', 'Changes saved locally and will sync when online.');
        setShowEditModal(false);
        setSelectedMember(null);
      } else {
        console.error('Error updating crew:', err);
        Alert.alert('Error', 'Failed to update crew member');
      }
    }
  };

  const handleTogglePrimary = async (member: CrewMember) => {
    try {
      await crewManagementService.setPrimaryCrew(member.id, !member.isPrimary);
      Alert.alert(
        'Success',
        member.isPrimary
          ? `${member.name} removed from primary crew`
          : `${member.name} set as primary crew`
      );
      loadCrew();
    } catch (err) {
      console.error('Error toggling primary crew:', err);
      Alert.alert('Error', 'Failed to update primary crew status');
    }
  };

  // ---------------------------------------------------------------------------
  // STATUS HELPERS
  // ---------------------------------------------------------------------------

  const getAvailabilityLabel = (availability?: AvailabilityStatus): string => {
    switch (availability) {
      case 'available':
        return 'available';
      case 'unavailable':
        return 'unavailable';
      case 'tentative':
        return 'tentative';
      default:
        return 'available';
    }
  };

  const getAvailabilityColor = (availability?: AvailabilityStatus): string => {
    switch (availability) {
      case 'available':
        return STATUS_COLORS.available;
      case 'unavailable':
        return STATUS_COLORS.unavailable;
      case 'tentative':
        return STATUS_COLORS.tentative;
      default:
        return STATUS_COLORS.available;
    }
  };

  // ---------------------------------------------------------------------------
  // MENU ITEMS BUILDER
  // ---------------------------------------------------------------------------

  const buildMenuItems = (member: CrewMemberWithAvailability): CardMenuItem[] => {
    const items: CardMenuItem[] = [
      {
        label: 'Edit',
        icon: 'create-outline',
        onPress: () => handleEditCrew(member),
      },
      {
        label: 'Availability',
        icon: 'calendar-outline',
        onPress: () => {
          if (onSelectMemberForAvailability) {
            onSelectMemberForAvailability(member);
          }
        },
      },
      {
        label: member.isPrimary ? 'Remove Primary' : 'Set Primary',
        icon: 'star-outline',
        onPress: () => handleTogglePrimary(member),
      },
    ];

    if (member.status === 'pending') {
      items.push({
        label: 'Resend Invite',
        icon: 'mail-outline',
        onPress: () => handleResendInvite(member),
      });
    }

    items.push({
      label: 'Remove',
      icon: 'trash-outline',
      onPress: () => handleRemoveCrew(member),
      variant: 'destructive' as const,
    });

    return items;
  };

  // ---------------------------------------------------------------------------
  // RENDER: STATUS DOT
  // ---------------------------------------------------------------------------

  const renderStatusDot = (member: CrewMemberWithAvailability) => {
    const isPending = member.status === 'pending';
    const availabilityColor = getAvailabilityColor(member.currentAvailability);

    if (isPending) {
      // Outline dot for pending invites
      return (
        <View
          style={[
            styles.statusDotOutline,
            { borderColor: STATUS_COLORS.pending },
          ]}
        />
      );
    }

    return (
      <View
        style={[styles.statusDot, { backgroundColor: availabilityColor }]}
      />
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER: CREW ROW
  // ---------------------------------------------------------------------------

  const renderCrewRow = (
    member: CrewMemberWithAvailability,
    index: number,
    isLast: boolean
  ) => {
    const isPending = member.status === 'pending';
    const statusLabel = isPending
      ? 'pending'
      : getAvailabilityLabel(member.currentAvailability);
    const roleAbbrev = ROLE_ABBREVIATIONS[member.role] || member.role;

    return (
      <View
        key={member.id}
        style={[styles.crewRow, isLast && styles.crewRowLast]}
      >
        {/* Name & Email */}
        <View style={styles.nameColumn}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.crewName} numberOfLines={1}>
              {member.name}
            </Text>
            {member.isPrimary && (
              <Ionicons
                name="star"
                size={12}
                color={IOS_COLORS.orange}
                style={styles.primaryStar}
              />
            )}
          </View>
          {member.email && (
            <Text style={styles.crewEmail} numberOfLines={1}>
              {member.email}
            </Text>
          )}
        </View>

        {/* Role */}
        <View style={styles.roleColumn}>
          <Text style={styles.crewRole}>{roleAbbrev}</Text>
        </View>

        {/* Status */}
        <View style={styles.statusColumn}>
          {renderStatusDot(member)}
          <Text style={styles.statusLabel}>{statusLabel}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsColumn}>
          <CardMenu items={buildMenuItems(member)} />
        </View>
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER: ROLE SELECTOR (for modals)
  // ---------------------------------------------------------------------------

  const renderRoleSelector = (
    selectedRole: CrewRole,
    onSelect: (role: CrewRole) => void
  ) => (
    <View style={styles.roleSelector}>
      {ROLES.map((role) => {
        const isSelected = selectedRole === role;
        const label = role.charAt(0).toUpperCase() + role.slice(1);

        return (
          <TouchableOpacity
            key={role}
            style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
            onPress={() => onSelect(role)}
          >
            <Text
              style={[
                styles.roleOptionText,
                isSelected && styles.roleOptionTextSelected,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={IOS_COLORS.gray} />
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // COMPACT VIEW (simplified list with manage link)
  // ---------------------------------------------------------------------------

  if (compact) {
    const displayCrew = crew.slice(0, 3);
    const remaining = crew.length - 3;
    const pendingCount = crew.filter((c) => c.status === 'pending').length;

    return (
      <View style={styles.container}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {className}
            {sailNumber ? ` #${sailNumber}` : ''}
          </Text>
          <Text style={styles.sectionMeta}>
            {crew.length} crew
            {pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
          </Text>
        </View>

        {/* Crew List */}
        <View style={styles.crewList}>
          {displayCrew.map((member, index) =>
            renderCrewRow(member, index, index === displayCrew.length - 1 && remaining === 0)
          )}
        </View>

        {/* More link if needed */}
        {remaining > 0 && onManagePress && (
          <TouchableOpacity style={styles.addCrewLink} onPress={onManagePress}>
            <Text style={styles.addCrewText}>
              +{remaining} more · View all
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // FULL VIEW
  // ---------------------------------------------------------------------------

  const pendingCount = crew.filter((c) => c.status === 'pending').length;
  const activeCount = crew.filter((c) => c.status !== 'pending').length;

  return (
    <View style={styles.container}>
      {/* Section Header with marginalia */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{className || 'Crew'}</Text>
        <Text style={styles.sectionMeta}>
          {activeCount} active
          {pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
        </Text>
      </View>

      {/* Crew List or Empty State */}
      {crew.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No crew members yet. Add teammates to share strategies and
            collaborate.
          </Text>
          <TouchableOpacity
            style={styles.addCrewLink}
            onPress={() => setShowInviteModal(true)}
          >
            <Ionicons name="add" size={16} color={IOS_COLORS.blue} />
            <Text style={styles.addCrewText}>Add crew member</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.crewList}>
            {crew.map((member, index) =>
              renderCrewRow(member, index, index === crew.length - 1)
            )}
          </View>

          {/* Add Crew Link */}
          <TouchableOpacity
            style={styles.addCrewLink}
            onPress={() => setShowInviteModal(true)}
          >
            <Ionicons name="add" size={16} color={IOS_COLORS.blue} />
            <Text style={styles.addCrewText}>Add crew member</Text>
          </TouchableOpacity>
        </>
      )}

      {/* ===================================================================== */}
      {/* INVITE MODAL */}
      {/* ===================================================================== */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Crew Member</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowInviteModal(false)}
              >
                <Ionicons name="close" size={24} color={IOS_COLORS.gray} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.form}>
                {/* Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>NAME</Text>
                  <TextInput
                    style={styles.formInput}
                    value={inviteForm.name}
                    onChangeText={(name) =>
                      setInviteForm({ ...inviteForm, name })
                    }
                    placeholder="Enter name"
                    placeholderTextColor={IOS_COLORS.gray2}
                  />
                </View>

                {/* Email */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>EMAIL (OPTIONAL)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={inviteForm.email}
                    onChangeText={(email) =>
                      setInviteForm({ ...inviteForm, email: email.toLowerCase() })
                    }
                    placeholder="Enter email to send invite"
                    placeholderTextColor={IOS_COLORS.gray2}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Text style={styles.formHelperText}>
                    {inviteForm.email
                      ? 'An invite will be sent to this email'
                      : 'Leave blank to add without invite'}
                  </Text>
                </View>

                {/* Role */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>ROLE</Text>
                  {renderRoleSelector(inviteForm.role, (role) =>
                    setInviteForm({ ...inviteForm, role })
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Submit */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleInviteCrew}
            >
              <Text style={styles.submitButtonText}>
                {inviteForm.email ? 'Send Invite' : 'Add Crew Member'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===================================================================== */}
      {/* EDIT MODAL */}
      {/* ===================================================================== */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Crew Member</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowEditModal(false)}
              >
                <Ionicons name="close" size={24} color={IOS_COLORS.gray} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.form}>
                {/* Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>NAME</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.name}
                    onChangeText={(name) => setEditForm({ ...editForm, name })}
                    placeholder="Enter name"
                    placeholderTextColor={IOS_COLORS.gray2}
                  />
                </View>

                {/* Role */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>ROLE</Text>
                  {renderRoleSelector(editForm.role, (role) =>
                    setEditForm({ ...editForm, role })
                  )}
                </View>

                {/* Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>NOTES</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea]}
                    value={editForm.notes}
                    onChangeText={(notes) =>
                      setEditForm({ ...editForm, notes })
                    }
                    placeholder="Add notes..."
                    placeholderTextColor={IOS_COLORS.gray2}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Submit */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSaveEdit}
            >
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
