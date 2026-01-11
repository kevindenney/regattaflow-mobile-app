/**
 * TuftePlanStep
 *
 * Combined WHAT + WHO step following Tufte principles:
 * - Focus areas selection
 * - Drill selection with marginalia-style details
 * - Optional crew members
 * - Typography-driven hierarchy
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react-native';
import { TUFTE_BACKGROUND } from '@/components/cards/constants';
import {
  TUFTE_FORM_COLORS,
  TUFTE_FORM_SPACING,
} from '@/components/races/AddRaceDialog/tufteFormStyles';
import type {
  SkillArea,
  Drill,
  WhatStepDrill,
  WhoStepMember,
  PracticeMemberRole,
} from '@/types/practice';
import { SKILL_AREA_LABELS, DRILL_CATEGORY_META } from '@/types/practice';

// Skill area options
const SKILL_OPTIONS: Array<{ area: SkillArea; label: string }> = [
  { area: 'start-execution', label: 'Starts' },
  { area: 'upwind-execution', label: 'Upwind' },
  { area: 'downwind-speed', label: 'Downwind' },
  { area: 'shift-awareness', label: 'Shifts' },
  { area: 'windward-rounding', label: 'Windward' },
  { area: 'leeward-rounding', label: 'Leeward' },
  { area: 'crew-coordination', label: 'Crew' },
  { area: 'equipment-prep', label: 'Boat' },
];

// Role options
const ROLE_OPTIONS: Array<{ role: PracticeMemberRole; label: string }> = [
  { role: 'skipper', label: 'Skipper' },
  { role: 'crew', label: 'Crew' },
  { role: 'coach', label: 'Coach' },
];

interface TuftePlanStepProps {
  // WHAT data
  focusAreas: SkillArea[];
  drills: WhatStepDrill[];
  availableDrills: Drill[];
  estimatedDuration: number;
  onFocusAreasChange: (areas: SkillArea[]) => void;
  onAddDrill: (drill: Drill) => void;
  onRemoveDrill: (drillId: string) => void;
  // WHO data
  members: WhoStepMember[];
  onAddMember: (member: WhoStepMember) => void;
  onRemoveMember: (memberIndex: number) => void;
  // Loading state
  isLoadingDrills?: boolean;
}

export function TuftePlanStep({
  focusAreas,
  drills,
  availableDrills,
  estimatedDuration,
  onFocusAreasChange,
  onAddDrill,
  onRemoveDrill,
  members,
  onAddMember,
  onRemoveMember,
  isLoadingDrills = false,
}: TuftePlanStepProps) {
  const [showCrewSection, setShowCrewSection] = useState(members.length > 0);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<PracticeMemberRole>('crew');

  const toggleFocusArea = (area: SkillArea) => {
    if (focusAreas.includes(area)) {
      onFocusAreasChange(focusAreas.filter((a) => a !== area));
    } else {
      onFocusAreasChange([...focusAreas, area].slice(0, 3));
    }
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    onAddMember({
      displayName: newMemberName.trim(),
      role: newMemberRole,
    });
    setNewMemberName('');
  };

  // Get drill info by ID
  const getDrillInfo = (drillId: string) => {
    return availableDrills.find((d) => d.id === drillId);
  };

  // Get available drills not yet selected
  const unselectedDrills = availableDrills.filter(
    (d) => !drills.find((sd) => sd.drillId === d.id)
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Duration Summary */}
      {estimatedDuration > 0 && (
        <View style={styles.durationBanner}>
          <Text style={styles.durationText}>
            {estimatedDuration} min total · {drills.length} drill{drills.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* FOCUS AREAS */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>FOCUS AREAS</Text>
        <View style={styles.chipGrid}>
          {SKILL_OPTIONS.map((option) => {
            const isSelected = focusAreas.includes(option.area);
            return (
              <TouchableOpacity
                key={option.area}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleFocusArea(option.area)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.chipText, isSelected && styles.chipTextSelected]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* DRILLS */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DRILLS</Text>

        {drills.length > 0 ? (
          <View style={styles.drillList}>
            {drills.map((drill, index) => {
              const drillInfo = getDrillInfo(drill.drillId);
              if (!drillInfo) return null;

              const categoryMeta = DRILL_CATEGORY_META[drillInfo.category];

              return (
                <View key={drill.drillId} style={styles.drillRow}>
                  <View style={styles.drillContent}>
                    <Text style={styles.drillName}>{drillInfo.name}</Text>
                    <Text style={styles.drillMeta}>
                      <Text style={styles.connector}>└─ </Text>
                      {drill.durationMinutes || drillInfo.durationMinutes} min · {categoryMeta?.label || drillInfo.category}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => onRemoveDrill(drill.drillId)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={16} color={TUFTE_FORM_COLORS.secondaryLabel} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>No drills selected</Text>
        )}

        {/* Add drill button - shows available drills */}
        {isLoadingDrills ? (
          <View style={styles.loadingDrills}>
            <ActivityIndicator size="small" color={TUFTE_FORM_COLORS.primary} />
            <Text style={styles.loadingDrillsText}>Loading drills...</Text>
          </View>
        ) : unselectedDrills.length > 0 ? (
          <View style={styles.addDrillSection}>
            <Text style={styles.addDrillLabel}>Add a drill:</Text>
            <View style={styles.availableDrills}>
              {unselectedDrills.slice(0, 5).map((drill) => (
                <TouchableOpacity
                  key={drill.id}
                  style={styles.availableDrillChip}
                  onPress={() => onAddDrill(drill)}
                  activeOpacity={0.7}
                >
                  <Plus size={12} color={TUFTE_FORM_COLORS.primary} />
                  <Text style={styles.availableDrillText}>{drill.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {/* CREW (Collapsible) */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => setShowCrewSection(!showCrewSection)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionLabel}>CREW (OPTIONAL)</Text>
          {showCrewSection ? (
            <ChevronUp size={16} color={TUFTE_FORM_COLORS.sectionLabel} />
          ) : (
            <ChevronDown size={16} color={TUFTE_FORM_COLORS.sectionLabel} />
          )}
        </TouchableOpacity>

        {showCrewSection && (
          <View style={styles.crewSection}>
            {/* Existing members */}
            {members.length > 0 && (
              <View style={styles.memberList}>
                {members.map((member, index) => (
                  <View key={index} style={styles.memberRow}>
                    <View style={styles.memberContent}>
                      <Text style={styles.memberName}>{member.displayName}</Text>
                      <Text style={styles.memberRole}>{member.role}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => onRemoveMember(index)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={16} color={TUFTE_FORM_COLORS.secondaryLabel} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add member form */}
            <View style={styles.addMemberForm}>
              <TextInput
                style={styles.memberNameInput}
                value={newMemberName}
                onChangeText={setNewMemberName}
                placeholder="Name"
                placeholderTextColor={TUFTE_FORM_COLORS.placeholder}
                returnKeyType="done"
                onSubmitEditing={handleAddMember}
              />
              <View style={styles.roleChips}>
                {ROLE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.role}
                    style={[
                      styles.roleChip,
                      newMemberRole === option.role && styles.roleChipSelected,
                    ]}
                    onPress={() => setNewMemberRole(option.role)}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        newMemberRole === option.role && styles.roleChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.addMemberButton,
                  !newMemberName.trim() && styles.addMemberButtonDisabled,
                ]}
                onPress={handleAddMember}
                disabled={!newMemberName.trim()}
              >
                <Text style={styles.addMemberButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  content: {
    paddingTop: TUFTE_FORM_SPACING.lg,
  },
  durationBanner: {
    backgroundColor: '#FFFFFF',
    paddingVertical: TUFTE_FORM_SPACING.sm,
    paddingHorizontal: TUFTE_FORM_SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE_FORM_COLORS.separator,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  section: {
    paddingHorizontal: TUFTE_FORM_SPACING.lg,
    paddingVertical: TUFTE_FORM_SPACING.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.sectionLabel,
    letterSpacing: 1.2,
    marginBottom: TUFTE_FORM_SPACING.sm,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
  },
  chipSelected: {
    backgroundColor: TUFTE_FORM_COLORS.primary,
    borderColor: TUFTE_FORM_COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  drillList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
    overflow: 'hidden',
  },
  drillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: TUFTE_FORM_SPACING.md,
    paddingHorizontal: TUFTE_FORM_SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE_FORM_COLORS.separator,
  },
  drillContent: {
    flex: 1,
    gap: 2,
  },
  drillName: {
    fontSize: 15,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.label,
  },
  drillMeta: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  connector: {
    color: '#D1D5DB',
  },
  removeButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.placeholder,
    fontStyle: 'italic',
  },
  loadingDrills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: TUFTE_FORM_SPACING.sm,
  },
  loadingDrillsText: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  addDrillSection: {
    marginTop: TUFTE_FORM_SPACING.md,
  },
  addDrillLabel: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.secondaryLabel,
    marginBottom: TUFTE_FORM_SPACING.xs,
  },
  availableDrills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availableDrillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: TUFTE_FORM_COLORS.primary,
    borderStyle: 'dashed',
  },
  availableDrillText: {
    fontSize: 12,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.primary,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: TUFTE_FORM_SPACING.sm,
  },
  crewSection: {
    gap: TUFTE_FORM_SPACING.md,
  },
  memberList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: TUFTE_FORM_SPACING.sm,
    paddingHorizontal: TUFTE_FORM_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE_FORM_COLORS.separator,
  },
  memberContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.label,
  },
  memberRole: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.secondaryLabel,
    textTransform: 'capitalize',
  },
  addMemberForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberNameInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: TUFTE_FORM_COLORS.label,
  },
  roleChips: {
    flexDirection: 'row',
    gap: 4,
  },
  roleChip: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
  },
  roleChipSelected: {
    backgroundColor: TUFTE_FORM_COLORS.primary,
    borderColor: TUFTE_FORM_COLORS.primary,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  roleChipTextSelected: {
    color: '#FFFFFF',
  },
  addMemberButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addMemberButtonDisabled: {
    opacity: 0.4,
  },
  addMemberButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.primary,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default TuftePlanStep;
