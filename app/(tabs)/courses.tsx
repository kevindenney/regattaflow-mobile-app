/**
 * Courses Tab - Race Course Library
 * Persistent course management with race integration
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CourseBuilder, type CourseDraft } from '@/components/courses';
import { CourseLibraryService } from '@/services/CourseLibraryService';
import { useAuth } from '@/providers/AuthProvider';
import type { CourseType, Mark, MarkType, RaceCourse } from '@/types/courses';
import { getRacesForCourse, MOCK_COURSES, type MockCourse } from '@/constants/mockData';
import { Clock3, Flag, MapPin, Navigation, Plus, Ruler } from 'lucide-react-native';

const COURSE_TYPE_LABELS: Record<string, string> = {
  windward_leeward: 'Windward / Leeward',
  olympic: 'Olympic',
  trapezoid: 'Trapezoid',
  triangle: 'Triangle',
  coastal: 'Coastal',
  custom: 'Custom',
};

export default function CoursesScreen() {
  const { user, userProfile } = useAuth();
  const fallbackCourses = useMemo(() => MOCK_COURSES.map(convertMockCourseToRaceCourse), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [editingDraft, setEditingDraft] = useState<CourseDraft | undefined>(undefined);
  const [editingCourseId, setEditingCourseId] = useState<string | undefined>(undefined);
  const [savedCourses, setSavedCourses] = useState<RaceCourse[]>(fallbackCourses);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [courseForAssignment, setCourseForAssignment] = useState<RaceCourse | null>(null);

  const loadCourses = useCallback(async () => {
    if (!user?.id) {
      setSavedCourses(fallbackCourses);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const remoteCourses = await CourseLibraryService.fetchCourses({
        clubId: userProfile?.club_id ?? undefined,
      });

      if (remoteCourses && remoteCourses.length > 0) {
        setSavedCourses(remoteCourses);
        setError(null);
      } else {
        setSavedCourses(fallbackCourses);
      }
    } catch (err) {
      console.error('[Courses] Failed to load courses:', err);
      setError('Unable to reach course library. Showing demo courses.');
      setSavedCourses(fallbackCourses);
    } finally {
      setLoading(false);
    }
  }, [fallbackCourses, user?.id, userProfile?.club_id]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const startCreateCourse = () => {
    setEditingDraft(undefined);
    setEditingCourseId(undefined);
    setIsBuilding(true);
  };

  const handleEditCourse = (course: RaceCourse) => {
    setEditingDraft(convertRaceCourseToDraft(course));
    setEditingCourseId(course.id);
    setIsBuilding(true);
  };

  const handleSaveCourse = async (draft: CourseDraft) => {
    if (saving) return;

    setSaving(true);
    const scope = userProfile?.club_id ? 'club' : 'personal';
    const clubId = userProfile?.club_id ?? undefined;

    try {
      let persisted: RaceCourse | null = null;

      if (editingCourseId) {
        const updatePayload = buildUpdatePayloadFromDraft(draft, clubId);
        persisted = await CourseLibraryService.updateCourse(editingCourseId, updatePayload);
      } else if (user?.id) {
        const createPayload = buildCreatePayloadFromDraft(draft, clubId);
        persisted = await CourseLibraryService.saveCourse(createPayload, scope, user.id);
      }

      const fallbackCourse = draftToRaceCourse(draft, editingCourseId);
      const nextCourse = persisted ?? fallbackCourse;

      setSavedCourses((prev) => {
        const copy = [...prev];
        const index = editingCourseId ? copy.findIndex((c) => c.id === editingCourseId) : -1;
        if (index >= 0) {
          copy[index] = nextCourse;
        } else {
          copy.unshift(nextCourse);
        }
        return copy;
      });

      setIsBuilding(false);
      setEditingDraft(undefined);
      setEditingCourseId(undefined);
    } catch (err) {
      console.error('[Courses] Failed to save course:', err);
      Alert.alert(
        'Unable to save',
        'We kept your changes locally. Try again when you have a connection.'
      );

      const fallbackCourse = draftToRaceCourse(draft, editingCourseId);
      setSavedCourses((prev) => {
        const copy = [...prev];
        const index = editingCourseId ? copy.findIndex((c) => c.id === editingCourseId) : -1;
        if (index >= 0) {
          copy[index] = fallbackCourse;
        } else {
          copy.unshift(fallbackCourse);
        }
        return copy;
      });

      setIsBuilding(false);
      setEditingDraft(undefined);
      setEditingCourseId(undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    const courseName = savedCourses.find((c) => c.id === courseId)?.name ?? 'this course';
    Alert.alert('Delete course?', `Remove ${courseName} from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await CourseLibraryService.deleteCourse(courseId);
          } catch (err) {
            console.error('[Courses] Failed to delete course in Supabase:', err);
          } finally {
            setSavedCourses((prev) => prev.filter((course) => course.id !== courseId));
          }
        },
      },
    ]);
  };

  const openAssignModal = (course: RaceCourse) => {
    setCourseForAssignment(course);
    setAssignModalVisible(true);
  };

  const closeAssignModal = () => {
    setAssignModalVisible(false);
    setCourseForAssignment(null);
  };

  if (isBuilding) {
    return (
      <SafeAreaView style={styles.container}>
        <CourseBuilder
          initialCourse={editingDraft}
          onSave={handleSaveCourse}
          onCancel={() => {
            setIsBuilding(false);
            setEditingDraft(undefined);
            setEditingCourseId(undefined);
          }}
          venueName={editingDraft?.venue ?? 'Custom Venue'}
        />
        {saving && (
          <View style={styles.savingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.savingText}>Saving course…</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const courseCountLabel = `${savedCourses.length} saved course${
    savedCourses.length === 1 ? '' : 's'
  }`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Race Courses</Text>
          <Text style={styles.headerSubtitle}>{courseCountLabel}</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
        <TouchableOpacity style={styles.addButton} onPress={startCreateCourse}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>New Course</Text>
        </TouchableOpacity>
      </View>

      {loading && savedCourses.length === 0 ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading courses…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            savedCourses.length === 0 && styles.emptyContentContainer,
          ]}
        >
          {savedCourses.length === 0 ? (
            <View style={styles.emptyState}>
              <MapPin size={64} color="#CBD5E1" />
              <Text style={styles.emptyStateTitle}>No courses yet</Text>
              <Text style={styles.emptyStateText}>
                Build your first race course with the interactive course builder.
              </Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={startCreateCourse}>
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.emptyStateButtonText}>Create Course</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.courseGrid}>
              {savedCourses.map((course) => {
                const usageRaces = getRacesForCourse(course.id);
                const hasUsage = usageRaces.length > 0 || (course.usage_count ?? 0) > 0;
                const courseTypeLabel =
                  COURSE_TYPE_LABELS[course.course_type] ?? COURSE_TYPE_LABELS.custom;

                return (
                  <View key={course.id} style={styles.courseCard}>
                    <TouchableOpacity
                      style={styles.courseCardContent}
                      onPress={() => handleEditCourse(course)}
                    >
                      <View style={styles.courseCardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.courseCardTitle}>{course.name}</Text>
                          <Text style={styles.courseCardVenue}>
                            {course.description || 'Custom venue'}
                          </Text>
                        </View>
                        <View style={styles.courseTypeBadge}>
                          <Text style={styles.courseTypeBadgeText}>{courseTypeLabel}</Text>
                        </View>
                      </View>

                      <View style={styles.coursePreview}>
                        <MapPin size={40} color="#3B82F6" />
                        <Text style={styles.coursePreviewText}>
                          {course.marks?.length ?? 0} mark
                          {(course.marks?.length ?? 0) === 1 ? '' : 's'}
                        </Text>
                      </View>

                      <View style={styles.courseStats}>
                        <View style={styles.courseStat}>
                          <Ruler size={14} color="#64748B" />
                          <Text style={styles.courseStatLabel}>Length</Text>
                          <Text style={styles.courseStatValue}>
                            {(course.typical_length_nm ?? 0).toFixed(2)} NM
                          </Text>
                        </View>
                        <View style={styles.courseStat}>
                          <Navigation size={14} color="#64748B" />
                          <Text style={styles.courseStatLabel}>Wind</Text>
                          <Text style={styles.courseStatValue}>
                            {formatWindRange(course.min_wind_speed, course.max_wind_speed)}
                          </Text>
                        </View>
                        <View style={styles.courseStat}>
                          <Flag size={14} color="#64748B" />
                          <Text style={styles.courseStatLabel}>Usage</Text>
                          <Text style={styles.courseStatValue}>
                            {course.usage_count ?? usageRaces.length}x
                          </Text>
                        </View>
                      </View>

                      <View style={styles.courseUsageSection}>
                        <Flag size={16} color="#3B82F6" />
                        {hasUsage ? (
                          <View style={styles.usageChips}>
                            {usageRaces.slice(0, 3).map((race) => (
                              <TouchableOpacity
                                key={race.id}
                                style={styles.usageChip}
                                onPress={() =>
                                  router.push({
                                    pathname: '/race/[id]',
                                    params: { id: race.id, courseId: course.id },
                                  })
                                }
                              >
                                <Text style={styles.usageChipText}>{race.name}</Text>
                              </TouchableOpacity>
                            ))}
                            {usageRaces.length > 3 && (
                              <Text style={styles.usageMoreText}>
                                +{usageRaces.length - 3} more
                              </Text>
                            )}
                          </View>
                        ) : (
                          <Text style={styles.courseUsageEmpty}>Not linked to races yet</Text>
                        )}
                      </View>

                      {course.last_used_date && (
                        <View style={styles.courseFooter}>
                          <Clock3 size={14} color="#94A3B8" />
                          <Text style={styles.courseLastUsed}>
                            Last used {new Date(course.last_used_date).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <View style={styles.courseActions}>
                      <TouchableOpacity
                        style={styles.courseActionButton}
                        onPress={() => handleEditCourse(course)}
                      >
                        <Ionicons name="create-outline" size={18} color="#3B82F6" />
                        <Text style={styles.courseActionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.courseActionButton}
                        onPress={() => openAssignModal(course)}
                      >
                        <Ionicons name="flag-outline" size={18} color="#0F766E" />
                        <Text style={[styles.courseActionText, { color: '#0F766E' }]}>Assign</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.courseActionButton}
                        onPress={() => handleDeleteCourse(course.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        <Text style={[styles.courseActionText, { color: '#EF4444' }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {savedCourses.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={startCreateCourse}>
          <Plus size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <AssignmentModal
        visible={assignModalVisible}
        course={courseForAssignment}
        onClose={closeAssignModal}
      />
    </SafeAreaView>
  );
}

type AssignmentModalProps = {
  visible: boolean;
  course: RaceCourse | null;
  onClose: () => void;
};

function AssignmentModal({ visible, course, onClose }: AssignmentModalProps) {
  if (!visible || !course) return null;

  const linkedRaces = getRacesForCourse(course.id);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assign “{course.name}”</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#475569" />
            </TouchableOpacity>
          </View>

          {linkedRaces.length > 0 ? (
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Existing races</Text>
              {linkedRaces.map((race) => (
                <TouchableOpacity
                  key={race.id}
                  style={styles.modalListItem}
                  onPress={() => {
                    onClose();
                    router.push({ pathname: '/race/[id]', params: { id: race.id, courseId: course.id } });
                  }}
                >
                  <Flag size={16} color="#1D4ED8" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalListTitle}>{race.name}</Text>
                    <Text style={styles.modalListSubTitle}>{race.venue}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.modalEmptyState}>
              <Text style={styles.modalEmptyText}>No races are using this course yet.</Text>
            </View>
          )}

          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Next steps</Text>
            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={() => {
                onClose();
                router.push({
                  pathname: '/(tabs)/race/add',
                  params: { courseId: course.id, courseName: course.name },
                });
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.modalPrimaryButtonText}>Create new race with this course</Text>
            </TouchableOpacity>
            <Text style={styles.modalHint}>
              After saving the race, the course selector will open automatically so you can apply
              this layout.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function buildCreatePayloadFromDraft(draft: CourseDraft, clubId?: string) {
  const marks = draft.marks.map((mark) => buildMarkFromDraft(mark));

  const payload: Omit<RaceCourse, 'id' | 'created_at' | 'updated_at'> = {
    name: draft.name.trim(),
    description: draft.venue?.trim() || undefined,
    course_type: mapDraftTypeToCourseType(draft.courseType),
    marks,
    min_wind_speed: draft.windRange.min,
    max_wind_speed: draft.windRange.max,
    min_wind_direction: draft.windRange.preferredDirection ?? undefined,
    max_wind_direction: draft.windRange.preferredDirection ?? undefined,
    typical_length_nm: draft.length ?? calculateDraftLength(draft),
    usage_count: 0,
    club_id: clubId,
  };

  return payload;
}

function buildUpdatePayloadFromDraft(draft: CourseDraft, clubId?: string) {
  const marks = draft.marks.map((mark) => buildMarkFromDraft(mark));

  const payload: Partial<RaceCourse> = {
    name: draft.name.trim(),
    description: draft.venue?.trim() || undefined,
    course_type: mapDraftTypeToCourseType(draft.courseType),
    marks,
    min_wind_speed: draft.windRange.min,
    max_wind_speed: draft.windRange.max,
    min_wind_direction: draft.windRange.preferredDirection ?? undefined,
    max_wind_direction: draft.windRange.preferredDirection ?? undefined,
    typical_length_nm: draft.length ?? calculateDraftLength(draft),
    club_id: clubId,
  };

  return payload;
}

function buildMarkFromDraft(mark: CourseDraft['marks'][number]): Mark {
  return {
    name: mark.name.trim(),
    type: mapDraftMarkTypeToMarkType(mark.type, mark.name),
    latitude: mark.lat,
    longitude: mark.lng,
  };
}

function draftToRaceCourse(draft: CourseDraft, existingId?: string): RaceCourse {
  const marks = draft.marks.map((mark, index) => ({
    id: `${existingId ?? draft.id ?? 'draft'}-mark-${index}`,
    name: mark.name.trim(),
    type: mapDraftMarkTypeToMarkType(mark.type, mark.name),
    latitude: mark.lat,
    longitude: mark.lng,
  }));

  const linkedRaces = getRacesForCourse(existingId ?? draft.id ?? '');

  return {
    id: existingId ?? draft.id ?? `course-${Date.now()}`,
    name: draft.name.trim(),
    description: draft.venue?.trim() || undefined,
    course_type: mapDraftTypeToCourseType(draft.courseType),
    marks,
    min_wind_speed: draft.windRange.min,
    max_wind_speed: draft.windRange.max,
    min_wind_direction: draft.windRange.preferredDirection ?? null,
    max_wind_direction: draft.windRange.preferredDirection ?? null,
    typical_length_nm: draft.length ?? calculateDraftLength(draft),
    usage_count: linkedRaces.length,
    last_used_date: draft.lastUsed,
  } as RaceCourse;
}

function convertRaceCourseToDraft(course: RaceCourse): CourseDraft {
  return {
    id: course.id,
    name: course.name,
    venue: course.description ?? undefined,
    courseType: mapCourseTypeToDraft(course.course_type),
    marks:
      course.marks?.map((mark, index) => ({
        name: mark.name,
        lat: mark.latitude,
        lng: mark.longitude,
        type: mapMarkTypeToDraft(mark.type, mark.name, index),
      })) ?? [],
    windRange: {
      min: course.min_wind_speed ?? 0,
      max: course.max_wind_speed ?? 0,
      preferredDirection: course.min_wind_direction ?? undefined,
    },
    length: course.typical_length_nm ?? undefined,
    lastUsed: course.last_used_date ?? undefined,
  };
}

function convertMockCourseToRaceCourse(course: MockCourse): RaceCourse {
  const marks = course.marks.map((mark, index) => ({
    id: `${course.id}-mark-${index}`,
    name: mark.name,
    type: mapDraftMarkTypeToMarkType(undefined, mark.name),
    latitude: mark.lat,
    longitude: mark.lng,
  }));

  const linkedRaces = getRacesForCourse(course.id);

  return {
    id: course.id,
    name: course.name,
    description: course.venue,
    course_type: mapDraftTypeToCourseType(course.courseType as CourseDraft['courseType']),
    marks,
    min_wind_speed: course.windRange.min,
    max_wind_speed: course.windRange.max,
    min_wind_direction: course.windRange.preferredDirection ?? null,
    max_wind_direction: course.windRange.preferredDirection ?? null,
    typical_length_nm: course.length,
    usage_count: linkedRaces.length,
    last_used_date: course.lastUsed,
  } as RaceCourse;
}

function mapDraftTypeToCourseType(type: CourseDraft['courseType']): CourseType {
  switch (type) {
    case 'windward_leeward':
      return 'windward_leeward';
    case 'olympic':
      return 'olympic';
    case 'trapezoid':
      return 'trapezoid';
    case 'coastal':
      return 'custom';
    case 'custom':
    default:
      return 'custom';
  }
}

function mapCourseTypeToDraft(type: CourseType | null | undefined): CourseDraft['courseType'] {
  switch (type) {
    case 'windward_leeward':
      return 'windward_leeward';
    case 'olympic':
      return 'olympic';
    case 'trapezoid':
      return 'trapezoid';
    case 'triangle':
      return 'trapezoid';
    default:
      return 'custom';
  }
}

function mapDraftMarkTypeToMarkType(
  type: CourseDraft['marks'][number]['type'] | undefined,
  name: string
): MarkType {
  if (type === 'start') return 'start';
  if (type === 'finish') return 'finish';
  if (type === 'windward') return 'windward';
  if (type === 'leeward') return 'leeward';
  if (type === 'gate_left' || type === 'gate_right') return 'gate';

  return inferMarkTypeFromName(name);
}

function mapMarkTypeToDraft(type: MarkType | undefined, name: string, index: number) {
  switch (type) {
    case 'start':
      return 'start';
    case 'finish':
      return 'finish';
    case 'windward':
      return 'windward';
    case 'leeward':
      return 'leeward';
    case 'gate':
      return index % 2 === 0 ? 'gate_left' : 'gate_right';
    default:
      return 'mark';
  }
}

function inferMarkTypeFromName(name: string): MarkType {
  const lower = name.toLowerCase();
  if (lower.includes('start')) return 'start';
  if (lower.includes('finish')) return 'finish';
  if (lower.includes('windward') || lower.includes('mark 1')) return 'windward';
  if (lower.includes('leeward') || lower.includes('gate')) return 'leeward';
  return 'offset';
}

function calculateDraftLength(draft: CourseDraft): number {
  return draft.length ?? 0;
}

function formatWindRange(min?: number | null, max?: number | null) {
  if (min == null && max == null) return 'Any';
  if (min != null && max != null) return `${min}-${max}kt`;
  if (min != null) return `${min}+ kt`;
  return `≤${max}kt`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  errorText: {
    marginTop: 8,
    color: '#C2410C',
    fontSize: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  courseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  courseCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 12px 28px rgba(15, 23, 42, 0.08)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }),
  },
  courseCardContent: {
    flex: 1,
  },
  courseCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  courseCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  courseCardVenue: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  courseTypeBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  courseTypeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E40AF',
  },
  coursePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: '#F0F9FF',
    gap: 8,
  },
  coursePreviewText: {
    fontSize: 12,
    color: '#64748B',
  },
  courseStats: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  courseStat: {
    flex: 1,
    alignItems: 'center',
  },
  courseStatLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  courseStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  courseUsageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  courseUsageEmpty: {
    fontSize: 12,
    color: '#64748B',
  },
  usageChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  usageChip: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  usageChipText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  usageMoreText: {
    fontSize: 11,
    color: '#64748B',
    alignSelf: 'center',
  },
  courseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  courseLastUsed: {
    fontSize: 12,
    color: '#94A3B8',
  },
  courseActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  courseActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  courseActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    backgroundColor: '#3B82F6',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 20px 30px rgba(15, 23, 42, 0.25)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }),
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  savingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  modalSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  modalListTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalListSubTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 12,
    lineHeight: 16,
  },
  modalEmptyState: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginHorizontal: 20,
  },
  modalEmptyText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
  },
});
