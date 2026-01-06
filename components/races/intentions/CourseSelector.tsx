/**
 * CourseSelector Component
 *
 * A dropdown picker for identifying the course from sailing instructions.
 * Shows available courses if parsed, or allows manual entry.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/Colors';
import type { CourseSelectionIntention } from '@/types/raceIntentions';

interface CourseOption {
  id: string;
  name: string;
  sequence?: string;
}

interface CourseSelectorProps {
  /** Available courses from sailing instructions */
  courses: CourseOption[];
  /** Current selection */
  selection?: CourseSelectionIntention;
  /** Called when selection changes */
  onChange: (selection: CourseSelectionIntention) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Allow manual course entry if no courses available */
  allowManualEntry?: boolean;
}

export function CourseSelector({
  courses,
  selection,
  onChange,
  disabled = false,
  allowManualEntry = true,
}: CourseSelectorProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [manualCourseName, setManualCourseName] = useState(
    selection?.selectedCourseName || ''
  );

  const handlePress = useCallback(() => {
    if (!disabled) {
      setIsModalVisible(true);
    }
  }, [disabled]);

  const handleSelectCourse = useCallback(
    (course: CourseOption | null) => {
      if (course) {
        onChange({
          selectedCourseId: course.id,
          selectedCourseName: course.name,
          selectedCourseSequence: course.sequence,
          identifiedFromSI: true,
          confirmed: true,
        });
      } else {
        onChange({
          selectedCourseId: undefined,
          selectedCourseName: undefined,
          selectedCourseSequence: undefined,
          identifiedFromSI: false,
          confirmed: false,
        });
      }
      setIsModalVisible(false);
    },
    [onChange]
  );

  const handleManualEntry = useCallback(() => {
    if (manualCourseName.trim()) {
      onChange({
        selectedCourseId: undefined,
        selectedCourseName: manualCourseName.trim(),
        selectedCourseSequence: undefined,
        identifiedFromSI: false,
        confirmed: true,
      });
      setIsModalVisible(false);
    }
  }, [manualCourseName, onChange]);

  const handleNotesChange = useCallback(
    (notes: string) => {
      onChange({
        ...selection,
        notes,
      });
    },
    [selection, onChange]
  );

  const toggleConfirmed = useCallback(() => {
    onChange({
      ...selection,
      confirmed: !selection?.confirmed,
    });
  }, [selection, onChange]);

  const renderCourseItem = useCallback(
    ({ item }: { item: CourseOption }) => {
      const isSelected = item.id === selection?.selectedCourseId;

      return (
        <TouchableOpacity
          style={[styles.courseItem, isSelected && styles.courseItemSelected]}
          onPress={() => handleSelectCourse(item)}
          activeOpacity={0.7}
        >
          <View style={styles.courseItemLeft}>
            <MaterialCommunityIcons
              name="map-marker-path"
              size={20}
              color={isSelected ? colors.primary.default : colors.text.secondary}
            />
            <View style={styles.courseItemText}>
              <Text
                style={[
                  styles.courseItemName,
                  isSelected && styles.courseItemNameSelected,
                ]}
              >
                {item.name}
              </Text>
              {item.sequence && (
                <Text style={styles.courseItemSequence} numberOfLines={1}>
                  {item.sequence}
                </Text>
              )}
            </View>
          </View>

          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.primary.default}
            />
          )}
        </TouchableOpacity>
      );
    },
    [selection?.selectedCourseId, handleSelectCourse]
  );

  const hasSelection = !!selection?.selectedCourseName;
  const hasCourses = courses.length > 0;

  return (
    <View style={styles.container}>
      {/* Label */}
      <View style={styles.labelRow}>
        <MaterialCommunityIcons
          name="map-marker-path"
          size={16}
          color={colors.primary.default}
        />
        <Text style={styles.label}>Course Identification</Text>
      </View>

      {/* Selector Button */}
      <TouchableOpacity
        style={[
          styles.selector,
          disabled && styles.selectorDisabled,
          !hasCourses && !allowManualEntry && styles.selectorEmpty,
        ]}
        onPress={handlePress}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <View style={styles.selectorLeft}>
          <Text
            style={[
              styles.selectorText,
              !hasSelection && styles.selectorPlaceholder,
            ]}
            numberOfLines={1}
          >
            {selection?.selectedCourseName || 'Select or enter course...'}
          </Text>
        </View>

        {selection?.identifiedFromSI && (
          <View style={styles.siBadge}>
            <Ionicons name="document-text" size={10} color={colors.success.default} />
            <Text style={styles.siBadgeText}>SI</Text>
          </View>
        )}

        <Ionicons
          name="chevron-down"
          size={18}
          color={colors.text.tertiary}
        />
      </TouchableOpacity>

      {/* Course Sequence (if selected) */}
      {selection?.selectedCourseSequence && (
        <View style={styles.sequenceBox}>
          <Text style={styles.sequenceLabel}>Course Sequence</Text>
          <Text style={styles.sequenceText}>{selection.selectedCourseSequence}</Text>
        </View>
      )}

      {/* Confirmed Checkbox */}
      {hasSelection && (
        <TouchableOpacity
          style={styles.confirmRow}
          onPress={toggleConfirmed}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons
            name={selection?.confirmed ? 'checkbox' : 'square-outline'}
            size={22}
            color={selection?.confirmed ? colors.success.default : colors.text.tertiary}
          />
          <Text style={styles.confirmText}>
            I've reviewed and understand the course
          </Text>
        </TouchableOpacity>
      )}

      {/* Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={styles.modal}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Course</Text>
            <TouchableOpacity
              onPress={() => handleSelectCourse(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.modalClear}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Manual Entry Section */}
          {allowManualEntry && (
            <View style={styles.manualSection}>
              <Text style={styles.manualLabel}>Enter Course Manually</Text>
              <View style={styles.manualRow}>
                <TextInput
                  style={styles.manualInput}
                  value={manualCourseName}
                  onChangeText={setManualCourseName}
                  placeholder="e.g., Course 3, Alpha Course"
                  placeholderTextColor={colors.text.tertiary}
                />
                <TouchableOpacity
                  style={[
                    styles.manualButton,
                    !manualCourseName.trim() && styles.manualButtonDisabled,
                  ]}
                  onPress={handleManualEntry}
                  disabled={!manualCourseName.trim()}
                >
                  <Text style={styles.manualButtonText}>Set</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Courses from SI */}
          {hasCourses && (
            <>
              <View style={styles.siHeader}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={16}
                  color={colors.text.secondary}
                />
                <Text style={styles.siHeaderText}>From Sailing Instructions</Text>
              </View>
              <FlatList
                data={courses}
                renderItem={renderCourseItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.courseList}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </>
          )}

          {/* Empty state when no courses */}
          {!hasCourses && !allowManualEntry && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="map-marker-question"
                size={48}
                color={colors.text.tertiary}
              />
              <Text style={styles.emptyText}>No courses found</Text>
              <Text style={styles.emptyHint}>
                Check sailing instructions for course details
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.default,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  selectorDisabled: {
    backgroundColor: colors.background.elevated,
    opacity: 0.6,
  },
  selectorEmpty: {
    borderStyle: 'dashed',
  },
  selectorLeft: {
    flex: 1,
  },
  selectorText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  selectorPlaceholder: {
    color: colors.text.tertiary,
  },
  siBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success.light,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  siBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success.default,
  },
  sequenceBox: {
    backgroundColor: colors.background.elevated,
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.default,
  },
  sequenceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sequenceText: {
    fontSize: 13,
    color: colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  confirmText: {
    fontSize: 13,
    color: colors.text.secondary,
  },

  // Modal styles
  modal: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalCancel: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  modalClear: {
    fontSize: 16,
    color: colors.error.default,
  },
  manualSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: 8,
  },
  manualLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  manualRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    backgroundColor: colors.background.elevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text.primary,
  },
  manualButton: {
    backgroundColor: colors.primary.default,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  manualButtonDisabled: {
    backgroundColor: colors.text.tertiary,
  },
  manualButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  siHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  siHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  courseList: {
    padding: 16,
    paddingTop: 8,
  },
  separator: {
    height: 8,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  courseItemSelected: {
    borderColor: colors.primary.default,
    backgroundColor: colors.primary.light,
  },
  courseItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courseItemText: {
    flex: 1,
  },
  courseItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  courseItemNameSelected: {
    color: colors.primary.default,
  },
  courseItemSequence: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
});
