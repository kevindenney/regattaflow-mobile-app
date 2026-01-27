/**
 * DocumentTypeSelector Component
 *
 * Dropdown/picker for selecting document type classification.
 * Shows appropriate icons for each document type.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  FileText,
  ScrollText,
  FilePlus,
  FileStack,
  Map,
  File,
  Check,
} from 'lucide-react-native';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from '@/components/races/AddRaceDialog/tufteFormStyles';
import { IOS_COLORS } from '@/components/cards/constants';

export type DocumentType = 'nor' | 'si' | 'amendment' | 'appendix' | 'course_diagram' | 'courses' | 'other';

interface DocumentTypeOption {
  type: DocumentType;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
}

const DOCUMENT_TYPES: DocumentTypeOption[] = [
  {
    type: 'nor',
    label: 'Notice of Race',
    shortLabel: 'NOR',
    icon: <FileText size={16} />,
    description: 'Initial race announcement with entry requirements',
  },
  {
    type: 'si',
    label: 'Sailing Instructions',
    shortLabel: 'SI',
    icon: <ScrollText size={16} />,
    description: 'Racing rules and procedures',
  },
  {
    type: 'amendment',
    label: 'Amendment',
    shortLabel: 'Amendment',
    icon: <FilePlus size={16} />,
    description: 'Updates to NOR or SI',
  },
  {
    type: 'appendix',
    label: 'Appendix',
    shortLabel: 'Appendix',
    icon: <FileStack size={16} />,
    description: 'Supplementary information',
  },
  {
    type: 'course_diagram',
    label: 'Course Diagram',
    shortLabel: 'Course',
    icon: <Map size={16} />,
    description: 'Course layout and marks',
  },
  {
    type: 'courses',
    label: 'Courses',
    shortLabel: 'Courses',
    icon: <Map size={16} />,
    description: 'Course sequences and layouts',
  },
  {
    type: 'other',
    label: 'Other Document',
    shortLabel: 'Other',
    icon: <File size={16} />,
    description: 'Any other race document',
  },
];

interface DocumentTypeSelectorProps {
  value: DocumentType;
  onChange: (type: DocumentType) => void;
  disabled?: boolean;
  /** Compact mode shows horizontal chips instead of vertical list */
  compact?: boolean;
  /** Show only common types (NOR, SI, Amendment) */
  showCommonOnly?: boolean;
}

export function DocumentTypeSelector({
  value,
  onChange,
  disabled = false,
  compact = false,
  showCommonOnly = false,
}: DocumentTypeSelectorProps) {
  const types = showCommonOnly
    ? DOCUMENT_TYPES.filter((t) => ['nor', 'si', 'amendment', 'courses'].includes(t.type))
    : DOCUMENT_TYPES;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {types.map((option) => {
          const isSelected = value === option.type;
          return (
            <Pressable
              key={option.type}
              style={[
                styles.compactChip,
                isSelected && styles.compactChipSelected,
                disabled && styles.compactChipDisabled,
              ]}
              onPress={() => !disabled && onChange(option.type)}
              disabled={disabled}
            >
              {React.cloneElement(option.icon as React.ReactElement, {
                color: isSelected ? IOS_COLORS.blue : TUFTE_FORM_COLORS.secondaryLabel,
              })}
              <Text
                style={[
                  styles.compactChipText,
                  isSelected && styles.compactChipTextSelected,
                ]}
              >
                {option.shortLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {types.map((option) => {
        const isSelected = value === option.type;
        return (
          <Pressable
            key={option.type}
            style={[
              styles.option,
              isSelected && styles.optionSelected,
              disabled && styles.optionDisabled,
            ]}
            onPress={() => !disabled && onChange(option.type)}
            disabled={disabled}
          >
            <View style={styles.optionLeft}>
              <View
                style={[
                  styles.optionIcon,
                  isSelected && styles.optionIconSelected,
                ]}
              >
                {React.cloneElement(option.icon as React.ReactElement, {
                  color: isSelected ? IOS_COLORS.blue : TUFTE_FORM_COLORS.secondaryLabel,
                })}
              </View>
              <View style={styles.optionText}>
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected && styles.optionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
            </View>
            {isSelected && (
              <Check size={18} color={IOS_COLORS.blue} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: TUFTE_FORM_COLORS.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  optionSelected: {
    borderColor: IOS_COLORS.blue,
    backgroundColor: '#F0F9FF', // Very light blue
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: TUFTE_FORM_COLORS.inputBackgroundDisabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: '#DBEAFE', // Light blue
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.label,
  },
  optionLabelSelected: {
    color: IOS_COLORS.blue,
  },
  optionDescription: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  // Compact chip styles
  compactContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: TUFTE_FORM_COLORS.inputBackgroundDisabled,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  compactChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: IOS_COLORS.blue,
  },
  compactChipDisabled: {
    opacity: 0.5,
  },
  compactChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  compactChipTextSelected: {
    color: IOS_COLORS.blue,
  },
});

export { DOCUMENT_TYPES };
export default DocumentTypeSelector;
