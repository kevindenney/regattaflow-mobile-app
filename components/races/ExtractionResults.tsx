/**
 * ExtractionResults Component
 *
 * Displays extracted race data with confidence indicators
 * Allows inline editing of fields
 */

import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/race-ui/Badge';
import { Card } from '@/components/race-ui/Card';
import { Typography, Spacing, colors, BorderRadius } from '@/constants/designSystem';

export type FieldConfidence = 'high' | 'medium' | 'low' | 'missing';

export interface ExtractedField {
  label: string;
  value: string;
  confidence: FieldConfidence;
  editable?: boolean;
}

export interface ExtractedRaceData {
  basic: ExtractedField[];
  course?: ExtractedField[];
  conditions?: ExtractedField[];
  timing?: ExtractedField[];
}

interface ExtractionResultsProps {
  data: ExtractedRaceData;
  onFieldChange: (section: keyof ExtractedRaceData, index: number, value: string) => void;
  onConfirm: () => void;
  onRetry: () => void;
}

const ConfidenceBadge: React.FC<{ confidence: FieldConfidence }> = ({ confidence }) => {
  const config = {
    high: { text: 'HIGH CONFIDENCE', color: colors.success[600] },
    medium: { text: 'MEDIUM', color: colors.warning[600] },
    low: { text: 'LOW - VERIFY', color: colors.danger[600] },
    missing: { text: 'NOT FOUND', color: colors.neutral[500] },
  };

  const { text, color } = config[confidence];

  return <Badge text={text} color={color} />;
};

const EditableFieldRow: React.FC<{
  field: ExtractedField;
  onChangeText: (value: string) => void;
}> = ({ field, onChangeText }) => {
  const [isEditing, setIsEditing] = React.useState(false);

  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{field.label}</Text>
        <ConfidenceBadge confidence={field.confidence} />
      </View>

      <View style={styles.fieldValueContainer}>
        <TextInput
          style={[
            styles.fieldValue,
            field.confidence === 'missing' && styles.fieldValueMissing,
            isEditing && styles.fieldValueEditing,
          ]}
          value={field.value}
          onChangeText={onChangeText}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          placeholderTextColor={colors.text.tertiary}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          editable={field.editable !== false}
        />
        {field.editable !== false && (
          <Ionicons
            name="create-outline"
            size={16}
            color={colors.text.tertiary}
            style={styles.editIcon}
          />
        )}
      </View>
    </View>
  );
};

const FieldSection: React.FC<{
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  fields: ExtractedField[];
  section: keyof ExtractedRaceData;
  onFieldChange: (index: number, value: string) => void;
}> = ({ title, icon, fields, section, onFieldChange }) => {
  if (!fields || fields.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={colors.primary[600]} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {fields.map((field, index) => (
          <EditableFieldRow
            key={`${section}-${index}`}
            field={field}
            onChangeText={(value) => onFieldChange(index, value)}
          />
        ))}
      </View>
    </View>
  );
};

export const ExtractionResults: React.FC<ExtractionResultsProps> = ({
  data,
  onFieldChange,
  onConfirm,
  onRetry,
}) => {
  // Calculate overall confidence
  const allFields = [
    ...(data.basic || []),
    ...(data.course || []),
    ...(data.conditions || []),
    ...(data.timing || []),
  ];

  const highConfidenceCount = allFields.filter((f) => f.confidence === 'high').length;
  const totalFields = allFields.length;
  const confidencePercentage = totalFields > 0 ? (highConfidenceCount / totalFields) * 100 : 0;

  const overallConfidence: FieldConfidence =
    confidencePercentage >= 80
      ? 'high'
      : confidencePercentage >= 50
      ? 'medium'
      : 'low';

  return (
    <View style={styles.container}>
      {/* Header */}
      <Card size="small">
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="checkmark-circle" size={32} color={colors.success[600]} />
          </View>
          <Text style={styles.headerTitle}>Extraction Complete</Text>
          <Text style={styles.headerSubtitle}>
            Review the extracted information and make any necessary changes
          </Text>
        </View>

        {/* Overall confidence */}
        <View style={styles.confidenceOverview}>
          <Text style={styles.confidenceLabel}>Overall Confidence</Text>
          <ConfidenceBadge confidence={overallConfidence} />
          <Text style={styles.confidenceStats}>
            {highConfidenceCount} of {totalFields} fields verified
          </Text>
        </View>
      </Card>

      {/* Scrollable field sections */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <FieldSection
          title="Basic Information"
          icon="information-circle-outline"
          fields={data.basic || []}
          section="basic"
          onFieldChange={(index, value) => onFieldChange('basic', index, value)}
        />

        <FieldSection
          title="Timing & Schedule"
          icon="time-outline"
          fields={data.timing || []}
          section="timing"
          onFieldChange={(index, value) => onFieldChange('timing', index, value)}
        />

        <FieldSection
          title="Course Details"
          icon="navigate-outline"
          fields={data.course || []}
          section="course"
          onFieldChange={(index, value) => onFieldChange('course', index, value)}
        />

        <FieldSection
          title="Conditions & Weather"
          icon="partly-sunny-outline"
          fields={data.conditions || []}
          section="conditions"
          onFieldChange={(index, value) => onFieldChange('conditions', index, value)}
        />

        {/* Help text */}
        <View style={styles.helpBox}>
          <Ionicons name="help-circle-outline" size={20} color={colors.info[600]} />
          <Text style={styles.helpText}>
            Fields with lower confidence may need verification. You can edit any field by tapping on it.
          </Text>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.retryButtonText}>Try Different Document</Text>
        </Pressable>

        <Pressable style={styles.confirmButton} onPress={onConfirm}>
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text style={styles.confirmButtonText}>Looks Good - Save Race</Text>
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
  confidenceOverview: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  confidenceLabel: {
    ...Typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confidenceStats: {
    ...Typography.caption,
    color: colors.text.tertiary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
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
  sectionContent: {
    gap: Spacing.md,
  },
  fieldRow: {
    gap: Spacing.xs,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    ...Typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValueContainer: {
    position: 'relative',
  },
  fieldValue: {
    ...Typography.body,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: Spacing.sm,
    paddingRight: 32,
    color: colors.text.primary,
  },
  fieldValueMissing: {
    borderColor: colors.danger[300],
    backgroundColor: colors.danger[50],
  },
  fieldValueEditing: {
    borderColor: colors.primary[600],
    backgroundColor: colors.background.primary,
  },
  editIcon: {
    position: 'absolute',
    right: Spacing.sm,
    top: '50%',
    marginTop: -8,
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: colors.info[50],
    borderRadius: BorderRadius.medium,
    borderLeftWidth: 4,
    borderLeftColor: colors.info[600],
    marginBottom: Spacing.lg,
  },
  helpText: {
    ...Typography.caption,
    flex: 1,
    color: colors.info[900],
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.background.secondary,
  },
  retryButtonText: {
    ...Typography.bodyBold,
    color: colors.text.secondary,
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    backgroundColor: colors.success[600],
  },
  confirmButtonText: {
    ...Typography.bodyBold,
    color: 'white',
  },
});
