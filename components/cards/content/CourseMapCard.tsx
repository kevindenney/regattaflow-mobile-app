/**
 * CourseMapCard - Position 5
 *
 * Apple Human Interface Guidelines (HIG) compliant design:
 * - iOS system colors
 * - SF Pro typography
 * - Clean section-based layout
 * - MapLibre map integration
 * - Course builder modal
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  LayoutAnimation,
  UIManager,
  Pressable,
} from 'react-native';
import {
  Map,
  Navigation,
  Flag,
  Anchor,
  ArrowRight,
  Compass,
  CornerDownRight,
  Pencil,
  Plus,
  Trash2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Target,
  FileText,
} from 'lucide-react-native';

import { CardContentProps } from '../types';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import { CourseSelector } from '@/components/races/intentions/CourseSelector';
import type { CourseSelectionIntention } from '@/types/raceIntentions';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// =============================================================================
// iOS SYSTEM COLORS (Apple HIG)
// =============================================================================

const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  teal: '#5AC8FA',
  cyan: '#32ADE6',
  indigo: '#5856D6',
  yellow: '#FFCC00',
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
};

// =============================================================================
// TYPES
// =============================================================================

interface CourseMark {
  id: string;
  name: string;
  type: 'start' | 'finish' | 'windward' | 'leeward' | 'gate' | 'offset' | 'spreader';
  latitude?: number;
  longitude?: number;
  rounding?: 'port' | 'starboard';
  sequence?: number;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get icon for mark type
 */
function getMarkIcon(type: CourseMark['type']) {
  switch (type) {
    case 'start':
    case 'finish':
      return Flag;
    case 'windward':
      return Navigation;
    case 'leeward':
      return Anchor;
    case 'gate':
      return CornerDownRight;
    default:
      return Compass;
  }
}

/**
 * Get iOS color for mark type
 */
function getMarkColor(type: CourseMark['type']): string {
  switch (type) {
    case 'start':
      return IOS_COLORS.green;
    case 'finish':
      return IOS_COLORS.red;
    case 'windward':
      return IOS_COLORS.orange;
    case 'leeward':
      return IOS_COLORS.blue;
    case 'gate':
      return IOS_COLORS.purple;
    default:
      return IOS_COLORS.gray;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CourseMapCard({
  race,
  cardType,
  isActive,
  isExpanded,
  onToggleExpand,
  dimensions,
}: CardContentProps) {
  // State for CourseBuilder modal
  const [showCourseBuilder, setShowCourseBuilder] = useState(false);

  // State for intentions section
  const [intentionsExpanded, setIntentionsExpanded] = useState(false);

  // Hook for race preparation data (includes course selection)
  const { intentions, updateCourseSelection, isSaving } = useRacePreparation({
    raceEventId: race.id,
    autoSave: true,
    debounceMs: 1000,
  });

  // Get current course selection
  const courseSelection = intentions.courseSelection;

  // Handle course selection change
  const handleCourseSelectionChange = useCallback(
    (selection: CourseSelectionIntention) => {
      updateCourseSelection(selection);
    },
    [updateCourseSelection]
  );

  // Toggle intentions section
  const toggleIntentionsSection = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIntentionsExpanded((prev) => !prev);
  }, []);

  // Extract course info from race data
  const courseName = (race as any).metadata?.selected_course_name || 'Course';
  const courseMarks: CourseMark[] = useMemo(() => {
    // Try to get marks from race data
    const marks = (race as any).marks || (race as any).courseMarks || [];
    if (marks.length > 0) return marks;

    // Default course marks for demo
    return [
      { id: '1', name: 'Start Line', type: 'start', sequence: 1 },
      { id: '2', name: 'Windward Mark', type: 'windward', sequence: 2, rounding: 'port' },
      { id: '3', name: 'Leeward Gate', type: 'gate', sequence: 3, rounding: 'port' },
      { id: '4', name: 'Windward Mark', type: 'windward', sequence: 4, rounding: 'port' },
      { id: '5', name: 'Finish Line', type: 'finish', sequence: 5 },
    ];
  }, [race]);

  // Check if course has real data (not just defaults)
  const hasRealCourseData = useMemo(() => {
    const marks = (race as any).marks || (race as any).courseMarks || [];
    return marks.length > 0;
  }, [race]);

  // Course type (inferred from marks)
  const courseType = useMemo(() => {
    const hasGate = courseMarks.some((m) => m.type === 'gate');
    const windwardCount = courseMarks.filter((m) => m.type === 'windward').length;
    const leewardCount = courseMarks.filter((m) => m.type === 'leeward').length;

    if (windwardCount >= 2 && (leewardCount >= 1 || hasGate)) {
      return 'Windward-Leeward';
    }
    if (courseMarks.length >= 4) {
      return 'Triangle';
    }
    return 'Custom';
  }, [courseMarks]);

  // Available courses for selection (from sailing instructions or race data)
  const availableCourses = useMemo(() => {
    const courses = (race as any).availableCourses || (race as any).sailingInstructions?.courses || [];
    if (courses.length > 0) {
      return courses.map((c: any, i: number) => ({
        id: c.id || `course-${i}`,
        name: c.name || `Course ${i + 1}`,
        sequence: c.sequence || c.marks?.join(' → '),
      }));
    }
    // Create a default option from current course
    return [{
      id: 'current',
      name: courseName,
      sequence: courseMarks.map(m => m.name).join(' → '),
    }];
  }, [race, courseName, courseMarks]);

  // State for mark editing
  const [editingMarks, setEditingMarks] = useState<CourseMark[]>([]);
  const [editingMarkId, setEditingMarkId] = useState<string | null>(null);

  // Get venue center from race data
  const venueCenter = useMemo(() => {
    // Try to get center from race venue data
    const lat = (race as any).venue?.latitude || (race as any).latitude || 22.2793;
    const lng = (race as any).venue?.longitude || (race as any).longitude || 114.1628;
    return { lat, lng };
  }, [race]);

  // Handle opening course editor
  const handleOpenCourseBuilder = () => {
    // Initialize editing marks from current course marks
    setEditingMarks([...courseMarks]);
    setShowCourseBuilder(true);
  };

  // Handle adding a new mark
  const handleAddMark = () => {
    const newMark: CourseMark = {
      id: `mark-${Date.now()}`,
      name: `Mark ${editingMarks.length + 1}`,
      type: 'windward',
      sequence: editingMarks.length + 1,
    };
    setEditingMarks([...editingMarks, newMark]);
    setEditingMarkId(newMark.id);
  };

  // Handle updating mark name
  const handleUpdateMarkName = (markId: string, newName: string) => {
    setEditingMarks((marks) =>
      marks.map((m) => (m.id === markId ? { ...m, name: newName } : m))
    );
  };

  // Handle updating mark type
  const handleUpdateMarkType = (markId: string, newType: CourseMark['type']) => {
    setEditingMarks((marks) =>
      marks.map((m) => (m.id === markId ? { ...m, type: newType } : m))
    );
  };

  // Handle updating mark rounding
  const handleUpdateMarkRounding = (markId: string, rounding: 'port' | 'starboard' | undefined) => {
    setEditingMarks((marks) =>
      marks.map((m) => (m.id === markId ? { ...m, rounding } : m))
    );
  };

  // Handle deleting a mark
  const handleDeleteMark = (markId: string) => {
    setEditingMarks((marks) => marks.filter((m) => m.id !== markId));
    if (editingMarkId === markId) {
      setEditingMarkId(null);
    }
  };

  // Handle moving mark up/down in sequence
  const handleMoveMark = (markId: string, direction: 'up' | 'down') => {
    const index = editingMarks.findIndex((m) => m.id === markId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === editingMarks.length - 1) return;

    const newMarks = [...editingMarks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newMarks[index], newMarks[swapIndex]] = [newMarks[swapIndex], newMarks[index]];

    // Update sequences
    newMarks.forEach((m, i) => {
      m.sequence = i + 1;
    });

    setEditingMarks(newMarks);
  };

  // Handle saving course
  const handleSaveCourse = () => {
    // TODO: Save course marks to race data via API
    console.log('Saving course marks:', editingMarks);
    Alert.alert('Course Saved', 'Course marks have been updated.');
    setShowCourseBuilder(false);
  };

  // Handle cancel
  const handleCancelCourseBuilder = () => {
    setEditingMarks([]);
    setEditingMarkId(null);
    setShowCourseBuilder(false);
  };

  // Open web app for full map editor
  const handleOpenWebEditor = () => {
    // TODO: Navigate to course editor when route is available
    Alert.alert(
      'Web Editor',
      'For the full interactive map-based course builder, use the RegattaFlow web app.',
      [{ text: 'OK' }]
    );
  };

  // ==========================================================================
  // COLLAPSED VIEW (Apple HIG Design)
  // ==========================================================================
  if (!isExpanded) {
    return (
      <View style={styles.container}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>COURSE MAP</Text>
          <View style={styles.courseTypeBadge}>
            <Map size={12} color={IOS_COLORS.indigo} />
            <Text style={styles.courseTypeBadgeText}>{courseType}</Text>
          </View>
        </View>

        {/* Course Name */}
        <Text style={styles.courseName}>{courseName}</Text>

        {/* Collapsed Content */}
        <View style={styles.collapsedContent}>
          {/* Mini Course Preview */}
          <View style={styles.miniCoursePreview}>
            <View style={styles.courseDiagramMini}>
              <View style={styles.courseLineVerticalMini} />
              <View style={[styles.markDotMini, styles.markWindwardMini]} />
              <View style={styles.courseLineHorizontalMini} />
              <View style={[styles.markDotMini, styles.markLeewardMini]} />
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: IOS_COLORS.indigo }]}>
                {courseMarks.length}
              </Text>
              <Text style={styles.statLabel}>Marks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: IOS_COLORS.indigo }]}>
                {courseMarks.filter((m) => m.rounding).length}
              </Text>
              <Text style={styles.statLabel}>Roundings</Text>
            </View>
          </View>

          {/* More indicator */}
          <View style={styles.moreIndicatorRow}>
            <Text style={styles.moreIndicatorText}>View full course</Text>
            <ChevronDown size={14} color={IOS_COLORS.gray} />
          </View>
        </View>

        {/* Swipe Indicator */}
        <View style={styles.swipeHintBottom}>
          <View style={styles.swipeIndicator} />
        </View>
      </View>
    );
  }

  // ==========================================================================
  // EXPANDED VIEW (Apple HIG Design)
  // ==========================================================================
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>COURSE MAP</Text>
        <View style={styles.courseTypeBadge}>
          <Map size={12} color={IOS_COLORS.indigo} />
          <Text style={styles.courseTypeBadgeText}>{courseType}</Text>
        </View>
      </View>

      {/* Course Name */}
      <Text style={styles.courseNameExpanded}>{courseName}</Text>

      {/* Interactive Map Area */}
      <TouchableOpacity
        style={styles.mapContainer}
        onPress={handleOpenCourseBuilder}
        activeOpacity={0.8}
      >
        <View style={styles.mapPlaceholder}>
          <Map size={48} color={IOS_COLORS.blue} />
          <Text style={styles.mapPlaceholderText}>
            {hasRealCourseData ? 'View Course' : 'Set Up Course'}
          </Text>
          <Text style={styles.mapPlaceholderSubtext}>
            Tap to {hasRealCourseData ? 'edit' : 'place'} marks on the map
          </Text>
        </View>

        {/* Course Diagram Overlay */}
        <View style={styles.courseDiagram}>
          <View style={styles.courseLineVertical} />
          <View style={[styles.markDot, styles.markWindward]} />
          <View style={styles.courseLineHorizontal} />
          <View style={[styles.markDot, styles.markLeeward]} />
          <View style={styles.courseLineVertical2} />
          <View style={[styles.markDot, styles.markStart]} />
        </View>

        {/* Edit Badge */}
        <View style={styles.editBadge}>
          <Pencil size={14} color="#FFFFFF" />
          <Text style={styles.editBadgeText}>
            {hasRealCourseData ? 'Edit' : 'Setup'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Mark List */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <View style={styles.marksSection}>
          <Text style={styles.marksSectionTitle}>COURSE MARKS</Text>
          <View style={styles.marksList}>
            {courseMarks.map((mark, index) => {
              const Icon = getMarkIcon(mark.type);
              const color = getMarkColor(mark.type);

              return (
                <View key={mark.id} style={styles.markRow}>
                  <View style={styles.markSequence}>
                    <Text style={styles.sequenceNumber}>{index + 1}</Text>
                  </View>
                  <View style={[styles.markIcon, { backgroundColor: `${color}20` }]}>
                    <Icon size={16} color={color} />
                  </View>
                  <View style={styles.markInfo}>
                    <Text style={styles.markName}>{mark.name}</Text>
                    {mark.rounding && (
                      <Text style={styles.markRounding}>
                        {mark.rounding === 'port' ? '← Port' : '→ Starboard'}
                      </Text>
                    )}
                  </View>
                  {index < courseMarks.length - 1 && (
                    <ArrowRight size={14} color={IOS_COLORS.gray4} style={styles.arrowIcon} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Course Info */}
        <View style={styles.courseInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Marks</Text>
            <Text style={styles.infoValue}>{courseMarks.length}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Roundings</Text>
            <Text style={styles.infoValue}>
              {courseMarks.filter((m) => m.rounding).length}
            </Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{courseType}</Text>
          </View>
        </View>

        {/* Your Intentions Section */}
        <View style={styles.intentionsSection}>
          <Pressable onPress={toggleIntentionsSection} style={styles.intentionsHeader}>
            <View style={styles.intentionsHeaderLeft}>
              <Target size={16} color={IOS_COLORS.blue} />
              <Text style={styles.intentionsHeaderText}>Your Course Plan</Text>
              {courseSelection?.confirmed && (
                <View style={styles.intentionsSetBadge}>
                  <Check size={10} color={IOS_COLORS.green} />
                  <Text style={styles.intentionsSetBadgeText}>Confirmed</Text>
                </View>
              )}
              {!courseSelection?.confirmed && !intentionsExpanded && (
                <View style={styles.intentionsAddBadge}>
                  <Text style={styles.intentionsAddBadgeText}>Confirm course</Text>
                </View>
              )}
            </View>
            {intentionsExpanded ? (
              <ChevronUp size={18} color={IOS_COLORS.gray} />
            ) : (
              <ChevronDown size={18} color={IOS_COLORS.gray} />
            )}
          </Pressable>

          {intentionsExpanded && (
            <View style={styles.intentionsContent}>
              <Text style={styles.intentionsHint}>
                Identify and confirm the course you'll be racing. This helps ensure you've understood the sailing instructions.
              </Text>

              {/* Course Selection */}
              <CourseSelector
                courses={availableCourses}
                selection={courseSelection}
                onChange={handleCourseSelectionChange}
              />

              {/* Selected Course Preview */}
              {courseSelection?.selectedCourseName && (
                <View style={styles.selectedCoursePreview}>
                  <View style={styles.selectedCourseRow}>
                    <FileText size={16} color={IOS_COLORS.indigo} />
                    <Text style={styles.selectedCourseName}>
                      {courseSelection.selectedCourseName}
                    </Text>
                    {courseSelection.identifiedFromSI && (
                      <View style={styles.siBadge}>
                        <Text style={styles.siBadgeText}>From SI</Text>
                      </View>
                    )}
                  </View>
                  {courseSelection.selectedCourseSequence && (
                    <Text style={styles.selectedCourseSequence}>
                      {courseSelection.selectedCourseSequence}
                    </Text>
                  )}
                </View>
              )}

              {isSaving && (
                <Text style={styles.savingText}>Saving...</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Swipe Indicator */}
      <View style={styles.swipeHintBottom}>
        <View style={styles.swipeIndicator} />
      </View>

      {/* Course Editor Modal (iOS Native Style) */}
      <Modal
        visible={showCourseBuilder}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelCourseBuilder}
      >
        <View style={modalStyles.container}>
          {/* Modal Header */}
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={handleCancelCourseBuilder} style={modalStyles.headerButton}>
              <X size={24} color={IOS_COLORS.gray} />
            </TouchableOpacity>
            <View style={modalStyles.headerCenter}>
              <Text style={modalStyles.headerTitle}>Edit Course</Text>
              <Text style={modalStyles.headerSubtitle}>{courseName}</Text>
            </View>
            <TouchableOpacity onPress={handleSaveCourse} style={modalStyles.saveButton}>
              <Check size={20} color="#FFFFFF" />
              <Text style={modalStyles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Course Type Badge */}
          <View style={modalStyles.courseTypeRow}>
            <View style={modalStyles.courseTypeBadge}>
              <Map size={16} color={IOS_COLORS.indigo} />
              <Text style={modalStyles.courseTypeText}>{courseType}</Text>
            </View>
            <TouchableOpacity onPress={handleOpenWebEditor} style={modalStyles.webEditorLink}>
              <ExternalLink size={14} color={IOS_COLORS.blue} />
              <Text style={modalStyles.webEditorText}>Open Map Editor</Text>
            </TouchableOpacity>
          </View>

          {/* Mark List */}
          <ScrollView style={modalStyles.markList} contentContainerStyle={modalStyles.markListContent}>
            {editingMarks.length === 0 ? (
              <View style={modalStyles.emptyState}>
                <Map size={48} color={IOS_COLORS.gray4} />
                <Text style={modalStyles.emptyStateText}>No marks added yet</Text>
                <Text style={modalStyles.emptyStateSubtext}>
                  Tap "Add Mark" to define your course
                </Text>
              </View>
            ) : (
              editingMarks.map((mark, index) => {
                const Icon = getMarkIcon(mark.type);
                const color = getMarkColor(mark.type);
                const isEditing = editingMarkId === mark.id;

                return (
                  <View key={mark.id} style={[modalStyles.markItem, isEditing && modalStyles.markItemEditing]}>
                    {/* Mark Header Row */}
                    <View style={modalStyles.markItemHeader}>
                      {/* Sequence & Icon */}
                      <View style={modalStyles.markItemLeft}>
                        <View style={modalStyles.markSequenceBadge}>
                          <Text style={modalStyles.markSequenceText}>{index + 1}</Text>
                        </View>
                        <View style={[modalStyles.markIconContainer, { backgroundColor: `${color}20` }]}>
                          <Icon size={18} color={color} />
                        </View>
                      </View>

                      {/* Mark Name (Editable) */}
                      <View style={modalStyles.markItemCenter}>
                        {isEditing ? (
                          <TextInput
                            value={mark.name}
                            onChangeText={(text) => handleUpdateMarkName(mark.id, text)}
                            style={modalStyles.markNameInput}
                            autoFocus
                            selectTextOnFocus
                          />
                        ) : (
                          <TouchableOpacity onPress={() => setEditingMarkId(mark.id)}>
                            <Text style={modalStyles.markName}>{mark.name}</Text>
                            <Text style={modalStyles.markType}>{mark.type}</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Actions */}
                      <View style={modalStyles.markItemActions}>
                        {isEditing ? (
                          <TouchableOpacity
                            onPress={() => setEditingMarkId(null)}
                            style={modalStyles.actionButton}
                          >
                            <Check size={18} color={IOS_COLORS.green} />
                          </TouchableOpacity>
                        ) : (
                          <>
                            <TouchableOpacity
                              onPress={() => handleMoveMark(mark.id, 'up')}
                              style={[modalStyles.actionButton, index === 0 && modalStyles.actionButtonDisabled]}
                              disabled={index === 0}
                            >
                              <ChevronUp size={18} color={index === 0 ? IOS_COLORS.gray4 : IOS_COLORS.gray} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleMoveMark(mark.id, 'down')}
                              style={[modalStyles.actionButton, index === editingMarks.length - 1 && modalStyles.actionButtonDisabled]}
                              disabled={index === editingMarks.length - 1}
                            >
                              <ChevronDown size={18} color={index === editingMarks.length - 1 ? IOS_COLORS.gray4 : IOS_COLORS.gray} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteMark(mark.id)}
                              style={modalStyles.actionButton}
                            >
                              <Trash2 size={18} color={IOS_COLORS.red} />
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>

                    {/* Expanded Edit Options */}
                    {isEditing && (
                      <View style={modalStyles.markEditOptions}>
                        {/* Type Selector */}
                        <Text style={modalStyles.editLabel}>MARK TYPE</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modalStyles.typeSelector}>
                          {(['start', 'windward', 'leeward', 'gate', 'finish'] as const).map((type) => (
                            <TouchableOpacity
                              key={type}
                              onPress={() => handleUpdateMarkType(mark.id, type)}
                              style={[
                                modalStyles.typeChip,
                                mark.type === type && { backgroundColor: getMarkColor(type) },
                              ]}
                            >
                              <Text
                                style={[
                                  modalStyles.typeChipText,
                                  mark.type === type && { color: '#FFFFFF' },
                                ]}
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>

                        {/* Rounding Selector (for marks that need it) */}
                        {['windward', 'leeward', 'gate', 'offset'].includes(mark.type) && (
                          <>
                            <Text style={modalStyles.editLabel}>ROUNDING</Text>
                            <View style={modalStyles.roundingSelector}>
                              <TouchableOpacity
                                onPress={() => handleUpdateMarkRounding(mark.id, 'port')}
                                style={[
                                  modalStyles.roundingChip,
                                  mark.rounding === 'port' && modalStyles.roundingChipSelected,
                                ]}
                              >
                                <Text style={[
                                  modalStyles.roundingChipText,
                                  mark.rounding === 'port' && modalStyles.roundingChipTextSelected,
                                ]}>
                                  Port
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleUpdateMarkRounding(mark.id, 'starboard')}
                                style={[
                                  modalStyles.roundingChip,
                                  mark.rounding === 'starboard' && modalStyles.roundingChipSelected,
                                ]}
                              >
                                <Text style={[
                                  modalStyles.roundingChipText,
                                  mark.rounding === 'starboard' && modalStyles.roundingChipTextSelected,
                                ]}>
                                  Starboard
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Add Mark Button */}
          <TouchableOpacity onPress={handleAddMark} style={modalStyles.addMarkButton}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={modalStyles.addMarkButtonText}>Add Mark</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// =============================================================================
// STYLES (Apple HIG Compliant)
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },

  // Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.8,
  },
  courseTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${IOS_COLORS.indigo}20`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  courseTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: IOS_COLORS.indigo,
  },

  // Course Name
  courseName: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 16,
  },
  courseNameExpanded: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 16,
  },

  // Collapsed Content
  collapsedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },

  // Mini Course Preview
  miniCoursePreview: {
    width: 140,
    height: 100,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  courseDiagramMini: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseLineVerticalMini: {
    position: 'absolute',
    width: 2,
    height: 50,
    backgroundColor: `${IOS_COLORS.blue}30`,
  },
  courseLineHorizontalMini: {
    position: 'absolute',
    width: 50,
    height: 2,
    backgroundColor: `${IOS_COLORS.blue}30`,
  },
  markDotMini: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  markWindwardMini: {
    top: 20,
    backgroundColor: `${IOS_COLORS.orange}30`,
    borderColor: IOS_COLORS.orange,
  },
  markLeewardMini: {
    bottom: 20,
    backgroundColor: `${IOS_COLORS.blue}30`,
    borderColor: IOS_COLORS.blue,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  statCard: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: IOS_COLORS.gray4,
  },

  // More Indicator
  moreIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
  },
  moreIndicatorText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },

  // Swipe Indicator
  swipeHintBottom: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeIndicator: {
    width: 36,
    height: 4,
    backgroundColor: IOS_COLORS.gray4,
    borderRadius: 2,
  },

  // Map Container
  mapContainer: {
    height: 180,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    marginTop: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginTop: 4,
  },
  editBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.blue,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Course diagram overlay
  courseDiagram: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseLineVertical: {
    position: 'absolute',
    width: 2,
    height: 70,
    backgroundColor: `${IOS_COLORS.blue}30`,
    top: 30,
  },
  courseLineVertical2: {
    position: 'absolute',
    width: 2,
    height: 70,
    backgroundColor: `${IOS_COLORS.blue}30`,
    bottom: 30,
  },
  courseLineHorizontal: {
    position: 'absolute',
    width: 70,
    height: 2,
    backgroundColor: `${IOS_COLORS.blue}30`,
  },
  markDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  markWindward: {
    top: 25,
    backgroundColor: `${IOS_COLORS.orange}30`,
    borderColor: IOS_COLORS.orange,
  },
  markLeeward: {
    bottom: 25,
    backgroundColor: `${IOS_COLORS.blue}30`,
    borderColor: IOS_COLORS.blue,
  },
  markStart: {
    bottom: 15,
    left: '30%',
    backgroundColor: `${IOS_COLORS.green}30`,
    borderColor: IOS_COLORS.green,
  },

  // Scroll
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },

  // Marks section
  marksSection: {
    marginBottom: 16,
  },
  marksSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  marksList: {
    gap: 8,
  },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 12,
  },
  markSequence: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.gray5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sequenceNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: IOS_COLORS.gray,
  },
  markIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  markInfo: {
    flex: 1,
  },
  markName: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  markRounding: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  arrowIcon: {
    marginLeft: 8,
  },

  // Course info
  courseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  infoDivider: {
    width: 1,
    backgroundColor: IOS_COLORS.gray4,
  },

  // Intentions Section
  intentionsSection: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 16,
  },
  intentionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  intentionsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  intentionsHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  intentionsSetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8FAE9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  intentionsSetBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  intentionsAddBadge: {
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  intentionsAddBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  intentionsContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
    gap: 12,
  },
  intentionsHint: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    marginTop: 12,
    lineHeight: 16,
  },
  selectedCoursePreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: IOS_COLORS.indigo,
    gap: 6,
  },
  selectedCourseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedCourseName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    flex: 1,
  },
  selectedCourseSequence: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  siBadge: {
    backgroundColor: '#E8FAE9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  siBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  savingText: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    marginTop: 4,
  },
});

// =============================================================================
// MODAL STYLES (Apple HIG Compliant)
// =============================================================================

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.gray5,
    backgroundColor: IOS_COLORS.gray6,
  },
  headerButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.blue,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  courseTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.gray6,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.gray5,
  },
  courseTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${IOS_COLORS.indigo}20`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  courseTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.indigo,
  },
  webEditorLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  webEditorText: {
    fontSize: 13,
    color: IOS_COLORS.blue,
  },
  markList: {
    flex: 1,
  },
  markListContent: {
    padding: 16,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: IOS_COLORS.gray2,
    marginTop: 4,
  },
  markItem: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
  },
  markItemEditing: {
    backgroundColor: `${IOS_COLORS.blue}10`,
    borderColor: IOS_COLORS.blue,
  },
  markItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markSequenceBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.gray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markSequenceText: {
    fontSize: 12,
    fontWeight: '700',
    color: IOS_COLORS.gray,
  },
  markIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markItemCenter: {
    flex: 1,
    marginLeft: 10,
  },
  markName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  markType: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  markNameInput: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: IOS_COLORS.blue,
  },
  markItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    padding: 6,
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  markEditOptions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
  },
  editLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.gray5,
    marginRight: 8,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  roundingSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  roundingChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.gray5,
    alignItems: 'center',
  },
  roundingChipSelected: {
    backgroundColor: IOS_COLORS.blue,
  },
  roundingChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  roundingChipTextSelected: {
    color: '#FFFFFF',
  },
  addMarkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: IOS_COLORS.blue,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 34 : 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addMarkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CourseMapCard;
