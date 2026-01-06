/**
 * RigIntentionItem Component
 *
 * A per-setting intention control for rig settings.
 * Shows:
 * - Setting name + recommended value
 * - Status picker: Default / Adjusted / Monitoring
 * - Optional notes field when expanded
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/Colors';
import type { RigSettingIntention, RigIntentionStatus } from '@/types/raceIntentions';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface RigIntentionItemProps {
  /** Setting key (e.g., 'upper_shrouds') */
  settingKey: string;
  /** Display label (e.g., 'Upper Shrouds') */
  label: string;
  /** Recommended value (e.g., 'Loos 12-13') */
  recommendedValue?: string;
  /** Current intention state */
  intention?: RigSettingIntention;
  /** Called when intention changes */
  onChange: (intention: RigSettingIntention) => void;
  /** Whether the item is disabled */
  disabled?: boolean;
}

const STATUS_OPTIONS: Array<{
  value: RigIntentionStatus;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}> = [
  {
    value: 'default',
    label: 'Default',
    icon: 'checkmark-circle',
    color: colors.success.default,
    bgColor: colors.success.light,
  },
  {
    value: 'adjusted',
    label: 'Adjusted',
    icon: 'construct',
    color: colors.warning.default,
    bgColor: colors.warning.light,
  },
  {
    value: 'monitoring',
    label: 'Watch',
    icon: 'eye',
    color: colors.primary.default,
    bgColor: colors.primary.light,
  },
];

export function RigIntentionItem({
  settingKey,
  label,
  recommendedValue,
  intention,
  onChange,
  disabled = false,
}: RigIntentionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localNotes, setLocalNotes] = useState(intention?.notes || '');
  const [localValue, setLocalValue] = useState(intention?.value || '');

  const currentStatus = intention?.status || 'default';
  const currentOption = STATUS_OPTIONS.find((o) => o.value === currentStatus) || STATUS_OPTIONS[0];

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  }, []);

  const handleStatusChange = useCallback(
    (status: RigIntentionStatus) => {
      onChange({
        ...intention,
        status,
        value: intention?.value,
        notes: intention?.notes,
      });
    },
    [intention, onChange]
  );

  const handleNotesBlur = useCallback(() => {
    if (localNotes !== intention?.notes) {
      onChange({
        ...intention,
        status: intention?.status || 'default',
        notes: localNotes || undefined,
      });
    }
  }, [intention, localNotes, onChange]);

  const handleValueBlur = useCallback(() => {
    if (localValue !== intention?.value) {
      onChange({
        ...intention,
        status: intention?.status || 'adjusted',
        value: localValue || undefined,
      });
    }
  }, [intention, localValue, onChange]);

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name="tune-vertical"
            size={18}
            color={colors.text.secondary}
          />
          <View style={styles.headerText}>
            <Text style={styles.label}>{label}</Text>
            {recommendedValue && (
              <Text style={styles.recommendedValue}>{recommendedValue}</Text>
            )}
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: currentOption.bgColor }]}>
            <Ionicons
              name={currentOption.icon as any}
              size={12}
              color={currentOption.color}
            />
            <Text style={[styles.statusText, { color: currentOption.color }]}>
              {currentOption.label}
            </Text>
          </View>

          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.text.tertiary}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Status Selector */}
          <View style={styles.statusSelector}>
            {STATUS_OPTIONS.map((option) => {
              const isSelected = currentStatus === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusOption,
                    isSelected && { backgroundColor: option.bgColor, borderColor: option.color },
                  ]}
                  onPress={() => handleStatusChange(option.value)}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={16}
                    color={isSelected ? option.color : colors.text.tertiary}
                  />
                  <Text
                    style={[
                      styles.statusOptionText,
                      isSelected && { color: option.color, fontWeight: '600' },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Value (only for 'adjusted') */}
          {currentStatus === 'adjusted' && (
            <View style={styles.valueSection}>
              <Text style={styles.sectionLabel}>Your Setting</Text>
              <TextInput
                style={styles.valueInput}
                value={localValue}
                onChangeText={setLocalValue}
                onBlur={handleValueBlur}
                placeholder={recommendedValue || 'Enter your value...'}
                placeholderTextColor={colors.text.tertiary}
                editable={!disabled}
              />
            </View>
          )}

          {/* Notes */}
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={localNotes}
              onChangeText={setLocalNotes}
              onBlur={handleNotesBlur}
              placeholder="Any notes about this setting..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              textAlignVertical="top"
              editable={!disabled}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.elevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  recommendedValue: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 12,
  },
  statusSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.default,
  },
  statusOptionText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  valueSection: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueInput: {
    backgroundColor: colors.background.default,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text.primary,
  },
  notesSection: {
    gap: 4,
  },
  notesInput: {
    backgroundColor: colors.background.default,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text.primary,
    minHeight: 60,
    maxHeight: 100,
  },
});
