/**
 * CrewManagement Component
 * Manages crew members for a boat/class
 */

import {
    CrewInvite,
    crewManagementService,
    CrewMember,
    CrewRole
} from '@/src/services/crewManagementService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { CardMenu, CardMenuItem } from '../shared';

interface CrewManagementProps {
  sailorId: string;
  classId: string;
  className: string;
  sailNumber?: string;
  compact?: boolean;
  onManagePress?: () => void;
}

const ROLE_ICONS: Record<CrewRole, string> = {
  helmsman: 'navigate-circle',
  tactician: 'compass',
  trimmer: 'hand-left',
  bowman: 'arrow-up-circle',
  pit: 'construct',
  grinder: 'fitness',
  other: 'person',
};

const ROLE_COLORS: Record<CrewRole, string> = {
  helmsman: '#3B82F6',
  tactician: '#8B5CF6',
  trimmer: '#10B981',
  bowman: '#F59E0B',
  pit: '#EF4444',
  grinder: '#6366F1',
  other: '#64748B',
};

export function CrewManagement({
  sailorId,
  classId,
  className,
  sailNumber,
  compact = false,
  onManagePress,
}: CrewManagementProps) {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState<CrewInvite>({
    email: '',
    name: '',
    role: 'trimmer',
  });

  useEffect(() => {
    loadCrew();
  }, [classId]);

  const loadCrew = async () => {
    try {
      setLoading(true);
      const data = await crewManagementService.getCrewForClass(sailorId, classId);
      setCrew(data);
    } catch (err) {
      console.error('Error loading crew:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteCrew = async () => {
    if (!inviteForm.email || !inviteForm.name) {
      Alert.alert('Error', 'Please enter both name and email');
      return;
    }

    try {
      await crewManagementService.inviteCrewMember(sailorId, classId, inviteForm);
      Alert.alert('Success', `Invite sent to ${inviteForm.name}`);
      setShowInviteModal(false);
      setInviteForm({ email: '', name: '', role: 'trimmer' });
      loadCrew();
    } catch (err) {
      console.error('Error inviting crew:', err);
      Alert.alert('Error', 'Failed to send invite');
    }
  };

  const handleRemoveCrew = (member: CrewMember) => {
    Alert.alert(
      'Remove Crew Member',
      `Remove ${member.name} from your crew?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await crewManagementService.removeCrewMember(member.id);
              loadCrew();
            } catch (err) {
              Alert.alert('Error', 'Failed to remove crew member');
            }
          },
        },
      ]
    );
  };

  const handleResendInvite = async (member: CrewMember) => {
    try {
      await crewManagementService.resendInvite(member.id);
      Alert.alert('Success', `Invite resent to ${member.name}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to resend invite');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'inactive':
        return '#94A3B8';
      default:
        return '#64748B';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }

  if (compact) {
    return (
      <View style={styles.container}>
        <View style={styles.compactHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="people" size={18} color="#3B82F6" />
            <Text style={styles.compactTitle}>
              My Crew - {className}
              {sailNumber && ` #${sailNumber}`}
            </Text>
          </View>
          {onManagePress && (
            <TouchableOpacity onPress={onManagePress}>
              <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.crewScroll}
        >
          {crew.slice(0, 3).map((member) => (
            <View key={member.id} style={styles.crewAvatarCard}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: ROLE_COLORS[member.role] + '20' },
                ]}
              >
                <Ionicons
                  name={ROLE_ICONS[member.role] as any}
                  size={20}
                  color={ROLE_COLORS[member.role]}
                />
              </View>
              <Text style={styles.avatarName} numberOfLines={1}>
                {member.name.split(' ')[0]}
              </Text>
              <Text style={styles.avatarRole}>{member.role}</Text>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(member.status) },
                ]}
              />
            </View>
          ))}

          {crew.length > 3 && (
            <TouchableOpacity style={styles.moreCard} onPress={onManagePress}>
              <Text style={styles.moreText}>+{crew.length - 3}</Text>
              <Text style={styles.moreLabel}>more</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.addCrewCard}
            onPress={() => setShowInviteModal(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
            <Text style={styles.addCrewText}>Add Crew</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Full view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconWrap}>
            <Text style={styles.headerIcon}>👥</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Crew</Text>
            <Text style={styles.headerSubtitle}>
              {className ? `Invite teammates for ${className}` : 'Invite your teammates'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => setShowInviteModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add-outline" size={18} color="#047857" />
          <Text style={styles.inviteButtonText}>Invite Crew</Text>
        </TouchableOpacity>
      </View>

      {crew.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Crew Members Yet</Text>
          <Text style={styles.emptyText}>
            Invite your crew to share strategies and collaborate
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowInviteModal(true)}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Invite First Member</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.crewScroll}
        >
          {crew.map((member) => {
            const crewMenuItems: CardMenuItem[] = [
              {
                label: 'View Profile',
                icon: 'person-outline',
                onPress: () => console.log('View profile:', member.id),
              },
              {
                label: 'Edit Role',
                icon: 'create-outline',
                onPress: () => console.log('Edit role:', member.id),
              },
            ];

            if (member.status === 'pending') {
              crewMenuItems.push({
                label: 'Resend Invite',
                icon: 'mail-outline',
                onPress: () => handleResendInvite(member),
              });
            }

            crewMenuItems.push({
              label: 'Remove',
              icon: 'trash-outline',
              onPress: () => handleRemoveCrew(member),
              variant: 'destructive' as const,
            });

            return (
              <View key={member.id} style={styles.crewCard}>
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(member.status) },
                    ]}
                  />
                  <CardMenu items={crewMenuItems} />
                </View>

                <View
                  style={[
                    styles.crewIcon,
                    { backgroundColor: ROLE_COLORS[member.role] + '20' },
                  ]}
                >
                  <Ionicons
                    name={ROLE_ICONS[member.role] as any}
                    size={32}
                    color={ROLE_COLORS[member.role]}
                  />
                </View>

                <View style={styles.crewInfo}>
                  <Text style={styles.crewName} numberOfLines={1}>{member.name}</Text>
                  <Text style={styles.crewEmail} numberOfLines={1}>{member.email}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[member.role] + '15' }]}>
                    <Text style={[styles.roleText, { color: ROLE_COLORS[member.role] }]}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Text>
                  </View>
                </View>

                {member.status === 'pending' && (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingText}>Pending</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Add Crew Card */}
          <TouchableOpacity
            style={styles.addCrewCardFull}
            onPress={() => setShowInviteModal(true)}
          >
            <Ionicons name="add-circle-outline" size={32} color="#3B82F6" />
            <Text style={styles.addCrewTextFull}>Add Crew</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Crew Member</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={inviteForm.name}
                  onChangeText={(name) => setInviteForm({ ...inviteForm, name })}
                  placeholder="Enter name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={inviteForm.email}
                  onChangeText={(email) =>
                    setInviteForm({ ...inviteForm, email: email.toLowerCase() })
                  }
                  placeholder="Enter email"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Role</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.roleSelector}
                >
                  {(['helmsman', 'tactician', 'trimmer', 'bowman', 'pit', 'grinder', 'other'] as CrewRole[]).map(
                    (role) => (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.roleChip,
                          inviteForm.role === role && styles.roleChipActive,
                          inviteForm.role === role && {
                            backgroundColor: ROLE_COLORS[role],
                          },
                        ]}
                        onPress={() => setInviteForm({ ...inviteForm, role })}
                      >
                        <Ionicons
                          name={ROLE_ICONS[role] as any}
                          size={16}
                          color={
                            inviteForm.role === role ? '#FFFFFF' : ROLE_COLORS[role]
                          }
                        />
                        <Text
                          style={[
                            styles.roleChipText,
                            inviteForm.role === role && styles.roleChipTextActive,
                          ]}
                        >
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleInviteCrew}>
              <Ionicons name="send" size={18} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Send Invite</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 20,
    marginVertical: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    boxShadow: '0px 4px',
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#047857',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#064E3B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#047857',
    marginTop: 2,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#047857',
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  crewScroll: {
    gap: 12,
  },
  crewAvatarCard: {
    alignItems: 'center',
    width: 80,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  avatarRole: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  moreCard: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
  },
  moreText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
  moreLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  addCrewCard: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 4,
  },
  addCrewText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#3B82F6',
  },
  addCrewCardFull: {
    width: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  addCrewTextFull: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  crewScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  crewCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0px 6px',
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  crewIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  crewInfo: {
    gap: 4,
  },
  crewName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  crewEmail: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  roleSelector: {
    gap: 8,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  roleChipActive: {
    borderColor: 'transparent',
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
