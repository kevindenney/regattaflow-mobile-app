/**
 * CrewMemberPicker
 *
 * A reusable dropdown component for selecting crew members.
 * Used in position assignment and watch schedule tools.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronDown,
  Check,
  User,
  X,
} from 'lucide-react-native';
import type { CrewMember, CrewRole } from '@/services/crewManagementService';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray2: '#636366',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

// Role colors
const ROLE_COLORS: Record<CrewRole, string> = {
  helmsman: '#FF3B30',
  tactician: '#5856D6',
  trimmer: '#007AFF',
  bowman: '#34C759',
  pit: '#FF9500',
  grinder: '#8E8E93',
  other: '#636366',
};

interface CrewMemberPickerProps {
  label: string;
  crewMembers: CrewMember[];
  selectedMemberId?: string;
  onSelect: (member: CrewMember | null) => void;
  excludeIds?: string[]; // IDs to exclude (already assigned elsewhere)
  placeholder?: string;
  disabled?: boolean;
}

export function CrewMemberPicker({
  label,
  crewMembers,
  selectedMemberId,
  onSelect,
  excludeIds = [],
  placeholder = 'Select crew member',
  disabled = false,
}: CrewMemberPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const selectedMember = crewMembers.find((m) => m.id === selectedMemberId);

  // Filter out excluded members
  const availableMembers = crewMembers.filter(
    (m) => !excludeIds.includes(m.id) || m.id === selectedMemberId
  );

  const handleSelect = useCallback((member: CrewMember | null) => {
    onSelect(member);
    setShowPicker(false);
  }, [onSelect]);

  const getRoleLabel = (role: CrewRole) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        style={[
          styles.pickerButton,
          disabled && styles.pickerButtonDisabled,
        ]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
      >
        {selectedMember ? (
          <View style={styles.selectedMember}>
            <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[selectedMember.role] }]}>
              <Text style={styles.avatarText}>
                {selectedMember.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{selectedMember.name}</Text>
              <Text style={styles.memberRole}>{getRoleLabel(selectedMember.role)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <User size={18} color={IOS_COLORS.gray} />
            <Text style={styles.placeholderText}>{placeholder}</Text>
          </View>
        )}
        <ChevronDown size={18} color={IOS_COLORS.gray} />
      </Pressable>

      <Modal
        visible={showPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowPicker(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color={IOS_COLORS.blue} />
            </Pressable>
            <Text style={styles.modalTitle}>{label}</Text>
            <View style={styles.headerRight} />
          </View>

          {/* Options List */}
          <ScrollView
            style={styles.optionsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.optionsContent}
          >
            {/* None option */}
            <Pressable
              style={[
                styles.optionRow,
                !selectedMemberId && styles.optionRowSelected,
              ]}
              onPress={() => handleSelect(null)}
            >
              <View style={styles.emptyAvatar}>
                <User size={18} color={IOS_COLORS.gray} />
              </View>
              <Text style={[styles.optionName, styles.emptyOptionName]}>None</Text>
              {!selectedMemberId && (
                <Check size={20} color={IOS_COLORS.blue} />
              )}
            </Pressable>

            {availableMembers.map((member) => {
              const isSelected = member.id === selectedMemberId;
              const isExcluded = excludeIds.includes(member.id) && !isSelected;

              return (
                <Pressable
                  key={member.id}
                  style={[
                    styles.optionRow,
                    isSelected && styles.optionRowSelected,
                    isExcluded && styles.optionRowDisabled,
                  ]}
                  onPress={() => !isExcluded && handleSelect(member)}
                  disabled={isExcluded}
                >
                  <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[member.role] }]}>
                    <Text style={styles.avatarText}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={[
                      styles.optionName,
                      isExcluded && styles.optionNameDisabled,
                    ]}>
                      {member.name}
                    </Text>
                    <Text style={styles.optionRole}>{getRoleLabel(member.role)}</Text>
                  </View>
                  {isSelected && (
                    <Check size={20} color={IOS_COLORS.blue} />
                  )}
                  {isExcluded && (
                    <Text style={styles.assignedBadge}>Assigned</Text>
                  )}
                </Pressable>
              );
            })}

            {availableMembers.length === 0 && (
              <View style={styles.emptyState}>
                <User size={32} color={IOS_COLORS.gray} />
                <Text style={styles.emptyStateText}>No crew members found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Add crew members in your boat settings
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
  },
  pickerButtonDisabled: {
    opacity: 0.5,
  },
  selectedMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  memberRole: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  placeholderText: {
    fontSize: 15,
    color: IOS_COLORS.gray,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  closeButton: {
    padding: 4,
    minWidth: 60,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    minWidth: 60,
  },
  optionsList: {
    flex: 1,
  },
  optionsContent: {
    padding: 16,
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  optionRowSelected: {
    backgroundColor: `${IOS_COLORS.blue}10`,
  },
  optionRowDisabled: {
    opacity: 0.5,
  },
  emptyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  optionNameDisabled: {
    color: IOS_COLORS.gray,
  },
  emptyOptionName: {
    flex: 1,
    color: IOS_COLORS.secondaryLabel,
  },
  optionRole: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  assignedBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.orange,
    backgroundColor: `${IOS_COLORS.orange}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },
});

export default CrewMemberPicker;
