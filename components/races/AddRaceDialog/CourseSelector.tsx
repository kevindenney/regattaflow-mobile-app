/**
 * CourseSelector Component
 *
 * Dropdown selector for course types in the Add Race dialog.
 * Uses useCourseTemplates hook for standard course options.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { ChevronDown, Navigation, Check, X } from 'lucide-react-native';
import { useCourseTemplates, type CourseTemplate } from '@/hooks/useCourseTemplates';
import type { RaceType } from '../RaceTypeSelector';

const COLORS = {
  primary: '#007AFF',
  label: '#000000',
  secondaryLabel: '#8E8E93',
  tertiaryLabel: '#C7C7CC',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  separator: '#C6C6C8',
  green: '#34C759',
};

interface CourseSelectorProps {
  /** Currently selected course type ID or name */
  selectedCourse?: string | null;
  /** Called when course is selected - provides course name */
  onSelect: (courseName: string | null) => void;
  /** Race type to filter courses */
  raceType?: RaceType;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field was AI-extracted */
  aiExtracted?: boolean;
  /** Label for the field */
  label?: string;
  /** Whether to show as half-width */
  halfWidth?: boolean;
}

export function CourseSelector({
  selectedCourse,
  onSelect,
  raceType = 'fleet',
  placeholder = 'Select course type',
  aiExtracted = false,
  label = 'Course type',
  halfWidth = false,
}: CourseSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { templates, isKnownTemplate } = useCourseTemplates({ raceType });

  // Find the selected template
  const selectedTemplate = templates.find(
    t => t.name === selectedCourse || t.id === selectedCourse
  );

  const handleSelectCourse = (template: CourseTemplate | null) => {
    if (template) {
      onSelect(template.name);
    } else {
      onSelect(null);
    }
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, halfWidth && styles.halfWidth]}>
      {/* Label */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {aiExtracted && <View style={styles.aiDot} />}
      </View>

      {/* Selector Button */}
      <Pressable
        style={({ pressed }) => [
          styles.selectorButton,
          pressed && styles.selectorButtonPressed,
        ]}
        onPress={() => setModalVisible(true)}
      >
        {selectedCourse ? (
          <View style={styles.selectedContent}>
            <Navigation size={16} color={COLORS.primary} />
            <Text style={styles.selectedText} numberOfLines={1}>
              {selectedTemplate?.name || selectedCourse}
            </Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>{placeholder}</Text>
        )}
        <ChevronDown size={16} color={COLORS.secondaryLabel} />
      </Pressable>

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <X size={24} color={COLORS.secondaryLabel} />
            </Pressable>
            <Text style={styles.modalTitle}>Select Course Type</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          <ScrollView style={styles.courseList}>
            {/* Clear selection option */}
            <Pressable
              style={({ pressed }) => [
                styles.courseItem,
                pressed && styles.courseItemPressed,
              ]}
              onPress={() => handleSelectCourse(null)}
            >
              <View style={styles.courseInfo}>
                <Text style={styles.courseNameClear}>No course selected</Text>
              </View>
              {!selectedCourse && (
                <Check size={20} color={COLORS.primary} />
              )}
            </Pressable>

            {/* Course list */}
            {templates.map((template) => {
              const isSelected = selectedCourse === template.name || selectedCourse === template.id;
              return (
                <Pressable
                  key={template.id}
                  style={({ pressed }) => [
                    styles.courseItem,
                    pressed && styles.courseItemPressed,
                    isSelected && styles.courseItemSelected,
                  ]}
                  onPress={() => handleSelectCourse(template)}
                >
                  <View style={styles.courseIcon}>
                    <Navigation size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseName}>{template.name}</Text>
                    {template.description && (
                      <Text style={styles.courseDescription} numberOfLines={2}>
                        {template.description}
                      </Text>
                    )}
                  </View>
                  {isSelected && (
                    <Check size={20} color={COLORS.primary} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  halfWidth: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
    marginLeft: 6,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  selectorButtonPressed: {
    backgroundColor: COLORS.background,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  selectedText: {
    fontSize: 15,
    color: COLORS.label,
    flex: 1,
  },
  placeholderText: {
    fontSize: 15,
    color: COLORS.tertiaryLabel,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  headerSpacer: {
    width: 32,
  },
  courseList: {
    flex: 1,
    padding: 16,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  courseItemPressed: {
    backgroundColor: COLORS.background,
  },
  courseItemSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.label,
  },
  courseNameClear: {
    fontSize: 16,
    color: COLORS.secondaryLabel,
  },
  courseDescription: {
    fontSize: 14,
    color: COLORS.secondaryLabel,
    marginTop: 2,
  },
});

export default CourseSelector;
