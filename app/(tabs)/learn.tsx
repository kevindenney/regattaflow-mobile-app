/**
 * Learn Tab - BetterAt Course Catalog
 * Database-backed courses for all interests (sailing, nursing, drawing, fitness).
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS } from '@/components/cards/constants';
import { CoachesContent } from '@/components/learn/CoachesContent';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';
import { TabScreenToolbar } from '@/components/ui/TabScreenToolbar';
import { useScrollToolbarHide } from '@/hooks/useScrollToolbarHide';
import { useInterest } from '@/providers/InterestProvider';
import { useCourses, type BetterAtCourse } from '@/hooks/useBetterAtCourses';

type LearnSegment = 'courses' | 'coaches';

const LEARN_SEGMENTS = [
  { value: 'courses' as const, label: 'Courses' },
  { value: 'coaches' as const, label: 'Coaches' },
];

export default function LearnScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const { toolbarHidden, handleScroll: handleToolbarScroll } = useScrollToolbarHide();
  const [activeSegment, setActiveSegment] = useState<LearnSegment>('courses');

  const isDesktop = mounted && width > 768;

  const { currentInterest } = useInterest();
  const { data: betterAtCourses, isLoading: betterAtLoading } = useCourses();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBetterAtCoursePress = (course: BetterAtCourse) => {
    router.push({
      pathname: '/(tabs)/learn/[courseId]',
      params: { courseId: course.id },
    });
  };

  return (
    <View style={styles.container}>
      {/* Scroll content first — flows behind absolutely-positioned toolbar */}
      {activeSegment === 'courses' ? (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingTop: toolbarHeight }]} onScroll={handleToolbarScroll} scrollEventThrottle={16}>
          <View style={[styles.content, isDesktop && styles.contentDesktop]}>
            {betterAtLoading ? (
              <View style={styles.betterAtLoading}>
                <ActivityIndicator size="large" color={currentInterest?.accent_color || IOS_COLORS.systemBlue} />
              </View>
            ) : !betterAtCourses || betterAtCourses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={32} color={IOS_COLORS.gray3} />
                <Text style={styles.emptyText}>No courses available yet</Text>
                <Text style={styles.emptySubtext}>
                  Courses for {currentInterest?.name || 'this interest'} are coming soon
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>
                    {(currentInterest?.name || 'COURSES').toUpperCase()}
                  </Text>
                  <Text style={styles.sectionCount}>{betterAtCourses.length}</Text>
                </View>
                <View style={styles.coursesList}>
                  {betterAtCourses.map((course) => (
                    <TouchableOpacity
                      key={course.id}
                      style={styles.betterAtCourseRow}
                      onPress={() => handleBetterAtCoursePress(course)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.betterAtCourseAccent,
                        { backgroundColor: currentInterest?.accent_color || '#003DA5' },
                      ]} />
                      <View style={styles.betterAtCourseInfo}>
                        <Text style={styles.betterAtCourseTitle}>{course.title}</Text>
                        {course.description && (
                          <Text style={styles.betterAtCourseDesc} numberOfLines={2}>
                            {course.description}
                          </Text>
                        )}
                        <View style={styles.betterAtCourseMeta}>
                          <Text style={styles.betterAtCourseLevel}>{course.level}</Text>
                          <Text style={styles.betterAtCourseMetaSep}>·</Text>
                          <Text style={styles.betterAtCourseLessons}>
                            {course.lesson_count} {course.lesson_count === 1 ? 'lesson' : 'lessons'}
                          </Text>
                          {course.topic && (
                            <>
                              <Text style={styles.betterAtCourseMetaSep}>·</Text>
                              <Text style={styles.betterAtCourseTopic}>{course.topic}</Text>
                            </>
                          )}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={IOS_COLORS.tertiaryLabel} />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        /* Coaches segment */
        <CoachesContent toolbarOffset={toolbarHeight} onScroll={handleToolbarScroll} />
      )}

      {/* Toolbar rendered last — absolutely positioned over content */}
      <TabScreenToolbar
        title="Learn"
        topInset={insets.top}
        actions={[
          {
            icon: 'bookmark-outline',
            label: 'Saved courses',
            onPress: () => router.push('/(tabs)/my-learning'),
          },
        ]}
        onMeasuredHeight={setToolbarHeight}
        hidden={toolbarHidden}
      >
        {/* Apple HIG Segmented Control: Courses | Coaches */}
        <View style={styles.segmentedControlContainer}>
          <IOSSegmentedControl
            segments={LEARN_SEGMENTS}
            selectedValue={activeSegment}
            onValueChange={setActiveSegment}
          />
        </View>
      </TabScreenToolbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  segmentedControlContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  content: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  contentDesktop: {
    paddingHorizontal: 24,
  },
  // iOS Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.tertiaryLabel,
  },
  // Course list
  coursesList: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
  },
  // BetterAt DB-backed course styles
  betterAtLoading: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  betterAtCourseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  betterAtCourseAccent: {
    width: 4,
    height: '80%',
    borderRadius: 2,
    marginRight: 12,
  },
  betterAtCourseInfo: {
    flex: 1,
  },
  betterAtCourseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 3,
  },
  betterAtCourseDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 6,
  },
  betterAtCourseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  betterAtCourseLevel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'capitalize',
  },
  betterAtCourseMetaSep: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  betterAtCourseLessons: {
    fontSize: 11,
    color: '#64748B',
  },
  betterAtCourseTopic: {
    fontSize: 11,
    color: '#64748B',
  },
});
