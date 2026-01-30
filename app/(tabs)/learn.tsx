/**
 * Learn Tab - Racing Academy Course Catalog
 * Redesigned: slim banner, flat filter chips, progress rings, learning stats
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CourseCatalogService, { type Course } from '@/services/CourseCatalogService';
import { IOS_COLORS } from '@/components/cards/constants';
import { CourseRow } from '@/components/learn/CourseRow';
import { CoachesContent } from '@/components/learn/CoachesContent';
import { InProgressBanner } from '@/components/learn/InProgressBanner';
import { LearningStatsBar } from '@/components/learn/LearningStatsBar';
import { FilterChipStrip } from '@/components/learn/FilterChipStrip';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';
import { TabScreenToolbar } from '@/components/ui/TabScreenToolbar';
import { useScrollToolbarHide } from '@/hooks/useScrollToolbarHide';

// Mock progress data - in production this would come from LessonProgressService
interface CourseProgress {
  courseId: string;
  progress: number;
  currentModuleIndex: number;
  lastAccessedTitle?: string;
}

const MOCK_PROGRESS: Record<string, CourseProgress> = {
  'winning-starts-first-beats': {
    courseId: 'winning-starts-first-beats',
    progress: 65,
    currentModuleIndex: 1,
    lastAccessedTitle: 'Fleet Positioning Strategy',
  },
  'racing-rules-fundamentals': {
    courseId: 'racing-rules-fundamentals',
    progress: 100,
    currentModuleIndex: 2,
  },
};

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
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const isDesktop = mounted && width > 768;

  // Get data from catalog service
  const levels = CourseCatalogService.getLevels();
  const topics = CourseCatalogService.getTopics();

  useEffect(() => {
    setMounted(true);
  }, []);

  // All courses
  const allCourses = useMemo(() => CourseCatalogService.getAllCourses(), []);

  // Filtered courses based on active filter chip
  const filteredCourses = useMemo(() => {
    if (activeFilter === 'all') return allCourses;

    // Check if it's a level filter
    const level = levels.find((l) => l.id === activeFilter);
    if (level) return level.courses;

    // Otherwise it's a topic filter
    return CourseCatalogService.getCoursesByTopic(activeFilter);
  }, [activeFilter, allCourses, levels]);

  // Derive section header from active filter
  const sectionInfo = useMemo(() => {
    if (activeFilter === 'all') {
      return { title: 'ALL COURSES', count: allCourses.length };
    }
    const level = levels.find((l) => l.id === activeFilter);
    if (level) {
      return { title: level.name.toUpperCase(), count: level.courses.length };
    }
    const topic = topics.find((t) => t.id === activeFilter);
    if (topic) {
      const courses = CourseCatalogService.getCoursesByTopic(activeFilter);
      return { title: topic.label.toUpperCase(), count: courses.length };
    }
    return { title: 'COURSES', count: filteredCourses.length };
  }, [activeFilter, allCourses, levels, topics, filteredCourses]);

  // Find the in-progress course to feature
  const inProgressCourse = useMemo(() => {
    const inProgressSlug = Object.entries(MOCK_PROGRESS).find(
      ([, progress]) => progress.progress > 0 && progress.progress < 100
    )?.[0];
    return inProgressSlug ? allCourses.find(c => c.slug === inProgressSlug) : undefined;
  }, [allCourses]);
  const inProgressCourseProgress = inProgressCourse
    ? MOCK_PROGRESS[inProgressCourse.slug]
    : undefined;

  // Compute learning stats from MOCK_PROGRESS
  const learningStats = useMemo(() => {
    const entries = Object.values(MOCK_PROGRESS);
    const started = entries.filter(e => e.progress > 0).length;
    const completed = entries.filter(e => e.progress === 100).length;

    // Estimate remaining hours from unfinished courses
    const unfinishedSlugs = entries
      .filter(e => e.progress > 0 && e.progress < 100)
      .map(e => e.courseId);
    const remainingHours = allCourses
      .filter(c => unfinishedSlugs.includes(c.slug))
      .reduce((sum, c) => {
        const progress = MOCK_PROGRESS[c.slug];
        const remainingFraction = 1 - (progress?.progress || 0) / 100;
        return sum + c.duration.estimatedHours * remainingFraction;
      }, 0);

    return {
      coursesStarted: started,
      totalCourses: allCourses.length,
      coursesCompleted: completed,
      estimatedHoursRemaining: Math.round(remainingHours),
    };
  }, [allCourses]);

  // Build chip data from levels and topics
  const levelChips = useMemo(
    () => levels.map((l) => ({ id: l.id, label: l.name })),
    [levels]
  );
  const topicChips = useMemo(
    () => topics.map((t) => ({ id: t.id, label: t.label, icon: t.icon })),
    [topics]
  );

  // Navigation handlers
  const handleCoursePress = (course: Course) => {
    router.push({
      pathname: '/(tabs)/learn/[courseId]',
      params: { courseId: course.slug },
    });
  };

  return (
    <View style={styles.container}>
      {/* Scroll content first — flows behind absolutely-positioned toolbar */}
      {activeSegment === 'courses' ? (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingTop: toolbarHeight }]} onScroll={handleToolbarScroll} scrollEventThrottle={16}>
          <View style={[styles.content, isDesktop && styles.contentDesktop]}>
            {/* 1. In-Progress Banner (slim replacement for InProgressCard) */}
            {inProgressCourse && inProgressCourseProgress && (
              <InProgressBanner
                course={inProgressCourse}
                progress={inProgressCourseProgress.progress}
                currentModuleIndex={inProgressCourseProgress.currentModuleIndex}
                lastAccessedTitle={inProgressCourseProgress.lastAccessedTitle}
                onContinue={() => handleCoursePress(inProgressCourse)}
                onPress={() => handleCoursePress(inProgressCourse)}
              />
            )}

            {/* 2. Learning Stats Bar */}
            <LearningStatsBar
              coursesStarted={learningStats.coursesStarted}
              totalCourses={learningStats.totalCourses}
              coursesCompleted={learningStats.coursesCompleted}
              estimatedHoursRemaining={learningStats.estimatedHoursRemaining}
            />

            {/* 3. Filter Chip Strip */}
            <FilterChipStrip
              activeChipId={activeFilter}
              onChipSelect={setActiveFilter}
              levels={levelChips}
              topics={topicChips}
            />

            {/* 4. iOS Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>
                {sectionInfo.title}
              </Text>
              <Text style={styles.sectionCount}>
                {sectionInfo.count}
              </Text>
            </View>

            {/* 5. Course List */}
            <View style={styles.coursesList}>
              {filteredCourses.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="book-outline" size={32} color={IOS_COLORS.gray3} />
                  <Text style={styles.emptyText}>
                    No courses yet for this filter
                  </Text>
                  <Text style={styles.emptySubtext}>
                    New courses are added regularly
                  </Text>
                </View>
              ) : (
                filteredCourses
                  .filter(course => course.slug !== inProgressCourse?.slug)
                  .map((course) => (
                    <CourseRow
                      key={course.id}
                      course={course}
                      progress={MOCK_PROGRESS[course.slug]?.progress}
                      isInProgress={MOCK_PROGRESS[course.slug]?.progress !== undefined && MOCK_PROGRESS[course.slug]?.progress < 100}
                      onPress={() => handleCoursePress(course)}
                    />
                  ))
              )}
            </View>
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
            onPress: () => Alert.alert('Saved', 'Saved courses coming soon'),
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
});
