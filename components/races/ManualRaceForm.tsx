/**
 * ManualRaceForm Component
 *
 * Progressive disclosure form for manual race entry
 * Shows required fields first, then optional sections
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/race-ui/Card';
import { Typography, Spacing, colors, BorderRadius } from '@/constants/designSystem';

export interface ManualRaceFormData {
  // Required
  name: string;
  date: string;
  time: string;
  location: string;

  // Optional - Course
  courseName?: string;
  courseDescription?: string;

  // Optional - Conditions
  expectedWind?: string;
  expectedCurrent?: string;

  // Optional - Timing
  warningSignal?: string;
  startSequence?: string;

  // Optional - Communications
  vhfChannel?: string;
  contactName?: string;
  contactPhone?: string;
}

interface FormField {
  key: keyof ManualRaceFormData;
  label: string;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
}

interface ManualRaceFormProps {
  initialData?: Partial<ManualRaceFormData>;
  onSubmit: (data: ManualRaceFormData) => void;
  onCancel: () => void;
}

const requiredFields: FormField[] = [
  {
    key: 'name',
    label: 'Race Name',
    placeholder: 'e.g., Croucher Series Race 3',
    icon: 'trophy-outline',
  },
  {
    key: 'date',
    label: 'Race Date',
    placeholder: 'YYYY-MM-DD',
    icon: 'calendar-outline',
  },
  {
    key: 'time',
    label: 'Start Time',
    placeholder: 'HH:MM (24hr)',
    icon: 'time-outline',
  },
  {
    key: 'location',
    label: 'Location',
    placeholder: 'e.g., Victoria Harbour, Hong Kong',
    icon: 'location-outline',
    multiline: true,
  },
];

const optionalSections: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  fields: FormField[];
}[] = [
  {
    title: 'Course Details',
    icon: 'navigate-outline',
    fields: [
      {
        key: 'courseName',
        label: 'Course Name',
        placeholder: 'e.g., Windward-Leeward',
        icon: 'flag-outline',
      },
      {
        key: 'courseDescription',
        label: 'Course Description',
        placeholder: 'e.g., 3-lap windward-leeward',
        icon: 'document-text-outline',
        multiline: true,
      },
    ],
  },
  {
    title: 'Expected Conditions',
    icon: 'partly-sunny-outline',
    fields: [
      {
        key: 'expectedWind',
        label: 'Wind Forecast',
        placeholder: 'e.g., NE 12-15 kts',
        icon: 'cloudy-outline',
      },
      {
        key: 'expectedCurrent',
        label: 'Current Forecast',
        placeholder: 'e.g., Flood tide, 1.5 kts',
        icon: 'water-outline',
      },
    ],
  },
  {
    title: 'Start Sequence',
    icon: 'alarm-outline',
    fields: [
      {
        key: 'warningSignal',
        label: 'Warning Signal',
        placeholder: 'e.g., 5 minutes before start',
        icon: 'flag-outline',
      },
      {
        key: 'startSequence',
        label: 'Start Sequence',
        placeholder: 'e.g., 5-4-1-GO',
        icon: 'list-outline',
      },
    ],
  },
  {
    title: 'Communications',
    icon: 'radio-outline',
    fields: [
      {
        key: 'vhfChannel',
        label: 'VHF Channel',
        placeholder: 'e.g., 72',
        icon: 'radio-outline',
        keyboardType: 'numeric',
      },
      {
        key: 'contactName',
        label: 'Race Officer',
        placeholder: 'Name',
        icon: 'person-outline',
      },
      {
        key: 'contactPhone',
        label: 'Contact Phone',
        placeholder: '+852 1234 5678',
        icon: 'call-outline',
        keyboardType: 'phone-pad',
      },
    ],
  },
];

export const ManualRaceForm: React.FC<ManualRaceFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<ManualRaceFormData>>(initialData);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const updateField = (key: keyof ManualRaceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const isFormValid = () => {
    return (
      formData.name?.trim() &&
      formData.date?.trim() &&
      formData.time?.trim() &&
      formData.location?.trim()
    );
  };

  const handleSubmit = () => {
    if (isFormValid()) {
      onSubmit(formData as ManualRaceFormData);
    }
  };

  const renderField = (field: FormField) => (
    <View key={field.key} style={styles.field}>
      <View style={styles.fieldHeader}>
        <Ionicons name={field.icon} size={16} color={colors.text.secondary} />
        <Text style={styles.fieldLabel}>{field.label}</Text>
      </View>
      <TextInput
        style={[styles.fieldInput, field.multiline && styles.fieldInputMultiline]}
        value={formData[field.key] || ''}
        onChangeText={(value) => updateField(field.key, value)}
        placeholder={field.placeholder}
        placeholderTextColor={colors.text.tertiary}
        multiline={field.multiline}
        numberOfLines={field.multiline ? 3 : 1}
        textAlignVertical={field.multiline ? 'top' : 'center'}
        keyboardType={field.keyboardType}
      />
    </View>
  );

  const missingFields = requiredFields.filter((f) => !formData[f.key]?.trim());

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="create-outline" size={28} color={colors.primary[600]} />
        </View>
        <Text style={styles.headerTitle}>Manual Entry</Text>
        <Text style={styles.headerSubtitle}>
          Fill in the race details - only the basics are required
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Required Section */}
        <Card>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={20} color={colors.danger[600]} />
            <Text style={styles.sectionTitle}>Required Information</Text>
          </View>
          <View style={styles.fieldsContainer}>
            {requiredFields.map(renderField)}
          </View>

          {/* Validation message */}
          {missingFields.length > 0 && (
            <View style={styles.validationMessage}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.warning[700]} />
              <Text style={styles.validationText}>
                {missingFields.length} required field{missingFields.length > 1 ? 's' : ''} remaining
              </Text>
            </View>
          )}
        </Card>

        {/* Optional Sections */}
        <View style={styles.optionalSectionsHeader}>
          <Text style={styles.optionalLabel}>OPTIONAL DETAILS</Text>
          <Text style={styles.optionalHint}>Add more information to get better recommendations</Text>
        </View>

        {optionalSections.map((section) => {
          const isExpanded = expandedSections.has(section.title);
          const hasData = section.fields.some((f) => formData[f.key]?.trim());

          return (
            <Card key={section.title} size="small">
              <Pressable
                style={styles.collapsibleHeader}
                onPress={() => toggleSection(section.title)}
              >
                <View style={styles.collapsibleTitleRow}>
                  <Ionicons name={section.icon} size={20} color={colors.primary[600]} />
                  <Text style={styles.collapsibleTitle}>{section.title}</Text>
                  {hasData && (
                    <View style={styles.dataBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success[600]} />
                    </View>
                  )}
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.text.tertiary}
                />
              </Pressable>

              {isExpanded && (
                <View style={styles.collapsibleContent}>
                  {section.fields.map(renderField)}
                </View>
              )}
            </Card>
          );
        })}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>

        <Pressable
          style={[styles.submitButton, !isFormValid() && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid()}
        >
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text style={styles.submitButtonText}>Save Race</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerIcon: {
    marginBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.h2,
    color: colors.text.primary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: colors.text.primary,
  },
  fieldsContainer: {
    gap: Spacing.md,
  },
  field: {
    gap: Spacing.xs,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  fieldLabel: {
    ...Typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  fieldInput: {
    ...Typography.body,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: Spacing.sm,
    color: colors.text.primary,
  },
  fieldInputMultiline: {
    minHeight: 80,
  },
  validationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: colors.warning[50],
    borderRadius: BorderRadius.small,
  },
  validationText: {
    ...Typography.caption,
    color: colors.warning[700],
    fontWeight: '500',
  },
  optionalSectionsHeader: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  optionalLabel: {
    ...Typography.captionBold,
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  optionalHint: {
    ...Typography.caption,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapsibleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  collapsibleTitle: {
    ...Typography.bodyBold,
    color: colors.text.primary,
  },
  dataBadge: {
    marginLeft: Spacing.xs,
  },
  collapsibleContent: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: Spacing.md,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...Typography.bodyBold,
    color: colors.text.secondary,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    backgroundColor: colors.primary[600],
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral[400],
  },
  submitButtonText: {
    ...Typography.bodyBold,
    color: 'white',
  },
});
