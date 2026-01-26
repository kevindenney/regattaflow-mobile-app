/**
 * RosterTab Component
 *
 * Displays and manages the crew roster for a boat class.
 * Extracted from CrewManagement.tsx for use in CrewHub.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserPlus, Search, Star, Mail, MoreHorizontal, Users } from 'lucide-react-native';
import { IOS_COLORS } from '@/components/cards/constants';
import {
  crewManagementService,
  CrewMember,
  CrewMemberWithAvailability,
  CrewInvite,
  CrewRole,
  AvailabilityStatus,
} from '@/services/crewManagementService';
import { CardMenu, CardMenuItem } from '@/components/shared';
import { CrewMemberFinderModal } from '../CrewMemberFinderModal';

// =============================================================================
// TYPES
// =============================================================================

interface RosterTabProps {
  sailorId: string;
  classId: string;
  className?: string;
  sailNumber?: string;
  currentUserId?: string;
  /** Optional race context for fleet-specific crew suggestions */
  regattaId?: string;
  /** Race name for display */
  regattaName?: string;
  onCrewChange?: () => void;
  onSelectMemberForAvailability?: (member: CrewMember) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ROLES: CrewRole[] = [
  'helmsman',
  'tactician',
  'trimmer',
  'bowman',
  'pit',
  'grinder',
  'other',
];

const ROLE_ABBREVIATIONS: Record<CrewRole, string> = {
  helmsman: 'Helm',
  tactician: 'Tact',
  trimmer: 'Trim',
  bowman: 'Bow',
  pit: 'Pit',
  grinder: 'Grind',
  other: 'Other',
};

const STATUS_COLORS = {
  available: IOS_COLORS.green,
  unavailable: IOS_COLORS.red,
  tentative: IOS_COLORS.orange,
  pending: IOS_COLORS.gray,
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RosterTab({
  sailorId,
  classId,
  className,
  sailNumber,
  currentUserId,
  regattaId,
  regattaName,
  onCrewChange,
  onSelectMemberForAvailability,
}: RosterTabProps) {
  const [crew, setCrew] = useState<CrewMemberWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCrewFinder, setShowCrewFinder] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);

  // Add form state
  const [addForm, setAddForm] = useState<CrewInvite>({
    email: '',
    name: '',
    role: 'trimmer',
  });

  // Edit form state
  const [editForm, setEditForm] = useState<{
    name: string;
    role: CrewRole;
    notes: string;
  }>({
    name: '',
    role: 'trimmer',
    notes: '',
  });

  // ---------------------------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------------------------

  const loadCrew = useCallback(async () => {
    // Skip API call if sailorId or classId are empty/invalid
    if (!sailorId || !classId) {
      setCrew([]);
      setLoading(false);
      return;
    }

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
  }, [sailorId, classId]);

  useEffect(() => {
    loadCrew();
  }, [loadCrew]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleAddCrew = async () => {
    if (!addForm.name) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      if (addForm.email && addForm.email.trim()) {
        await crewManagementService.inviteCrewMember(sailorId, classId, addForm);
        Alert.alert('Success', `Invite sent to ${addForm.name}`);
      } else {
        await crewManagementService.addCrewMember(sailorId, classId, {
          name: addForm.name,
          email: undefined,
          role: addForm.role,
          accessLevel: addForm.accessLevel,
          notes: addForm.notes,
        });
        Alert.alert('Success', `${addForm.name} added to crew`);
      }
      setShowAddModal(false);
      setAddForm({ email: '', name: '', role: 'trimmer' });
      loadCrew();
      onCrewChange?.();
    } catch (err: any) {
      if (err?.queuedForSync && err?.entity) {
        setCrew((prev) => [...prev, err.entity as CrewMember]);
        const action = addForm.email ? 'invited' : 'added';
        Alert.alert(
          'Offline',
          `${addForm.name} will be ${action} once you're back online.`
        );
        setShowAddModal(false);
        setAddForm({ email: '', name: '', role: 'trimmer' });
      } else {
        console.error('Error adding/inviting crew:', err);
        Alert.alert(
          'Error',
          addForm.email ? 'Failed to send invite' : 'Failed to add crew member'
        );
      }
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
      onCrewChange?.();
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
            onCrewChange?.();
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

  const handleTogglePrimary = async (member: CrewMember) => {
    try {
      await crewManagementService.setPrimaryCrew(member.id, !member.isPrimary);
      loadCrew();
      onCrewChange?.();
    } catch (err) {
      Alert.alert('Error', 'Failed to update primary crew status');
    }
  };

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  const getAvailabilityLabel = (availability?: AvailabilityStatus): string => {
    switch (availability) {
      case 'available': return 'available';
      case 'unavailable': return 'unavailable';
      case 'tentative': return 'tentative';
      default: return 'available';
    }
  };

  const getAvailabilityColor = (availability?: AvailabilityStatus): string => {
    switch (availability) {
      case 'available': return STATUS_COLORS.available;
      case 'unavailable': return STATUS_COLORS.unavailable;
      case 'tentative': return STATUS_COLORS.tentative;
      default: return STATUS_COLORS.available;
    }
  };

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
        onPress: () => onSelectMemberForAvailability?.(member),
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
  // RENDER: CREW ROW
  // ---------------------------------------------------------------------------

  const renderCrewRow = (member: CrewMemberWithAvailability, index: number) => {
    const isPending = member.status === 'pending';
    const statusLabel = isPending
      ? 'pending'
      : getAvailabilityLabel(member.currentAvailability);
    const statusColor = isPending
      ? STATUS_COLORS.pending
      : getAvailabilityColor(member.currentAvailability);
    const roleAbbrev = ROLE_ABBREVIATIONS[member.role] || member.role;

    return (
      <View key={member.id} style={styles.crewRow}>
        {/* Status dot */}
        <View
          style={[
            styles.statusDot,
            isPending
              ? { borderWidth: 2, borderColor: statusColor, backgroundColor: 'transparent' }
              : { backgroundColor: statusColor },
          ]}
        />

        {/* Name & Email */}
        <View style={styles.nameColumn}>
          <View style={styles.nameRow}>
            <Text style={styles.crewName} numberOfLines={1}>
              {member.name}
            </Text>
            {member.isPrimary && (
              <Star size={12} color={IOS_COLORS.orange} fill={IOS_COLORS.orange} />
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
          <Text style={styles.roleText}>{roleAbbrev}</Text>
        </View>

        {/* Status label */}
        <View style={styles.statusColumn}>
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {statusLabel}
          </Text>
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
        <ActivityIndicator size="large" color={IOS_COLORS.blue} />
        <Text style={styles.loadingText}>Loading crew...</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------------

  const activeCount = crew.filter((c) => c.status !== 'pending').length;
  const pendingCount = crew.filter((c) => c.status === 'pending').length;

  return (
    <View style={styles.container}>
      {/* Header with stats */}
      <View style={styles.header}>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>
            {activeCount} active
            {pendingCount > 0 && ` · ${pendingCount} pending`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCrewFinder(true)}
          >
            <Search size={16} color={IOS_COLORS.blue} />
            <Text style={styles.actionButtonText}>Find</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowAddModal(true)}
          >
            <UserPlus size={16} color={IOS_COLORS.blue} />
            <Text style={styles.actionButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Crew List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {crew.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color={IOS_COLORS.gray3} />
            <Text style={styles.emptyTitle}>No Crew Members</Text>
            <Text style={styles.emptyText}>
              Add crew members to track availability and assign positions.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowAddModal(true)}
            >
              <UserPlus size={16} color={IOS_COLORS.systemBackground} />
              <Text style={styles.emptyButtonText}>Add Crew Member</Text>
            </TouchableOpacity>
          </View>
        ) : (
          crew.map((member, index) => renderCrewRow(member, index))
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Crew Member</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAddModal(false)}
              >
                <Ionicons name="close" size={24} color={IOS_COLORS.gray} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>NAME</Text>
                  <TextInput
                    style={styles.formInput}
                    value={addForm.name}
                    onChangeText={(name) => setAddForm({ ...addForm, name })}
                    placeholder="Enter name"
                    placeholderTextColor={IOS_COLORS.gray}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>EMAIL (OPTIONAL)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={addForm.email}
                    onChangeText={(email) =>
                      setAddForm({ ...addForm, email: email.toLowerCase() })
                    }
                    placeholder="Enter email to send invite"
                    placeholderTextColor={IOS_COLORS.gray}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Text style={styles.formHelperText}>
                    {addForm.email
                      ? 'An invite will be sent to this email'
                      : 'Leave blank to add without invite'}
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>ROLE</Text>
                  {renderRoleSelector(addForm.role, (role) =>
                    setAddForm({ ...addForm, role })
                  )}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.submitButton} onPress={handleAddCrew}>
              <Text style={styles.submitButtonText}>
                {addForm.email ? 'Send Invite' : 'Add Crew Member'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>NAME</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.name}
                    onChangeText={(name) => setEditForm({ ...editForm, name })}
                    placeholder="Enter name"
                    placeholderTextColor={IOS_COLORS.gray}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>ROLE</Text>
                  {renderRoleSelector(editForm.role, (role) =>
                    setEditForm({ ...editForm, role })
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>NOTES</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea]}
                    value={editForm.notes}
                    onChangeText={(notes) => setEditForm({ ...editForm, notes })}
                    placeholder="Add notes..."
                    placeholderTextColor={IOS_COLORS.gray}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.submitButton} onPress={handleSaveEdit}>
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Crew Finder Modal */}
      {currentUserId && (
        <CrewMemberFinderModal
          visible={showCrewFinder}
          onClose={() => setShowCrewFinder(false)}
          sailorId={sailorId}
          classId={classId}
          currentUserId={currentUserId}
          regattaId={regattaId}
          regattaName={regattaName}
          onCrewAdded={() => {
            loadCrew();
            onCrewChange?.();
          }}
        />
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.gray5,
  },
  headerStats: {
    flex: 1,
  },
  statsText: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${IOS_COLORS.blue}15`,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  nameColumn: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  crewName: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  crewEmail: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  roleColumn: {
    width: 50,
    alignItems: 'center',
    marginRight: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
  },
  statusColumn: {
    width: 70,
    alignItems: 'flex-end',
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionsColumn: {
    width: 32,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 10,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.systemBackground,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.gray5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  modalCloseButton: {
    padding: 4,
  },
  form: {
    padding: 20,
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: IOS_COLORS.label,
  },
  formTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formHelperText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginTop: 4,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 8,
  },
  roleOptionSelected: {
    backgroundColor: IOS_COLORS.blue,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  roleOptionTextSelected: {
    color: IOS_COLORS.systemBackground,
  },
  submitButton: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.systemBackground,
  },
});

export default RosterTab;
