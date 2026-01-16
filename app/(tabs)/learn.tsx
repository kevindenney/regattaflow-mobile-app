/**
 * Learn Tab - Racing Academy Course Catalog
 * Displays available learning courses organized by learning paths
 * Uses JSON catalog as single source of truth for consistency with landing page
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CourseCatalogService, { type Course } from '@/services/CourseCatalogService';
import { IOS_COLORS } from '@/components/cards/constants';
import { CourseRow } from '@/components/learn/CourseRow';
import { InProgressCard } from '@/components/learn/InProgressCard';
import { LevelTabs } from '@/components/learn/LevelTabs';

// Mock progress data - in production this would come from LessonProgressService
// This demonstrates the Tufte-inspired progress tracking
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

export default function LearnScreen() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('level-1'); // Start with Fundamentals (natural progression)
  const [showAllCourses, setShowAllCourses] = useState(false);

  const isDesktop = mounted && width > 768;

  // Get data from catalog service
  const levels = CourseCatalogService.getLevels();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLevel = levels.find((l) => l.id === selectedLevel);
  const coursesToShow = currentLevel
    ? showAllCourses
      ? currentLevel.courses
      : currentLevel.courses.slice(0, 6) // Show more courses with compact rows
    : [];

  // Find the in-progress course to feature (Tufte: featured card earns its space)
  const allCourses = useMemo(() => CourseCatalogService.getAllCourses(), []);
  const inProgressCourse = useMemo(() => {
    // Find a course that is in progress (has progress but not complete)
    const inProgressSlug = Object.entries(MOCK_PROGRESS).find(
      ([slug, progress]) => progress.progress > 0 && progress.progress < 100
    )?.[0];
    return inProgressSlug ? allCourses.find(c => c.slug === inProgressSlug) : undefined;
  }, [allCourses]);
  const inProgressCourseProgress = inProgressCourse
    ? MOCK_PROGRESS[inProgressCourse.slug]
    : undefined;

  // Navigation handlers
  const handleCoursePress = (course: Course) => {
    router.push({
      pathname: '/(tabs)/learn/[courseId]',
      params: { courseId: course.slug },
    });
  };

  const handleEnroll = (course: Course) => {
    if (course.status === 'coming-soon') {
      if (Platform.OS === 'web') {
        alert(`"${course.title}" is coming soon! We'll notify you when it's available.`);
      } else {
        alert(`"${course.title}" is coming soon!`);
      }
    } else if (course.price.cents === 0) {
      // Free course - navigate directly
      router.push({
        pathname: '/(tabs)/learn/[courseId]',
        params: { courseId: course.slug },
      });
    } else {
      // Paid course - navigate to course detail page
      router.push({
        pathname: '/(tabs)/learn/[courseId]',
        params: { courseId: course.slug },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={[styles.content, isDesktop && styles.contentDesktop]}>
          {/* In-Progress Course Card (Tufte: earns space with real content) */}
          {inProgressCourse && inProgressCourseProgress && (
            <InProgressCard
              course={inProgressCourse}
              progress={inProgressCourseProgress.progress}
              currentModuleIndex={inProgressCourseProgress.currentModuleIndex}
              lastAccessedTitle={inProgressCourseProgress.lastAccessedTitle}
              onContinue={() => handleCoursePress(inProgressCourse)}
              onPress={() => handleCoursePress(inProgressCourse)}
            />
          )}

          {/* Learning Path Navigation (Tufte: removed redundant heading) */}
          <View style={styles.learningPathSection}>
            <LevelTabs
              levels={levels}
              selectedLevelId={selectedLevel}
              onLevelSelect={(levelId) => {
                setSelectedLevel(levelId);
                setShowAllCourses(false);
              }}
            />

            {/* Level Description - tightened to single line subtitle */}
            {currentLevel && (
              <Text style={styles.levelDescriptionInline}>
                {currentLevel.description}
              </Text>
            )}
          </View>

          {/* Course List (Tufte: compact rows, higher information density) */}
          <View style={styles.coursesList}>
            {coursesToShow
              .filter(course => course.slug !== inProgressCourse?.slug) // Don't duplicate in-progress
              .map((course) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  progress={MOCK_PROGRESS[course.slug]?.progress}
                  isInProgress={MOCK_PROGRESS[course.slug]?.progress !== undefined && MOCK_PROGRESS[course.slug]?.progress < 100}
                  onPress={() => handleCoursePress(course)}
                />
              ))}
          </View>

          {/* Show More Button */}
          {currentLevel && currentLevel.courses.length > 3 && !showAllCourses && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setShowAllCourses(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.showMoreButtonText}>
                Show {currentLevel.courses.length - 3} More
              </Text>
              <Ionicons name="chevron-down" size={18} color={IOS_COLORS.blue} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
  },
  scrollView: {
    flex: 1,
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
  // Hero Header - iOS Large Title style
  heroHeader: {
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  mainTitleDesktop: {
    fontSize: 40,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 4,
  },
  // Section Header - iOS Grouped Table style
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
  addButtonText: {
    fontSize: 17,
    color: IOS_COLORS.blue,
  },
  learningPathSection: {
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 12,
  },
  sectionTitleDesktop: {
    fontSize: 28,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 16,
  },
  sectionSubtitleDesktop: {
    fontSize: 17,
  },
  // Tufte: tightened level description to single line
  levelDescriptionInline: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 8,
    marginBottom: 4,
  },
  // Legacy styles kept for reference
  levelInfo: {
    backgroundColor: IOS_COLORS.systemBackground,
    padding: 16,
    borderRadius: 10,
    marginTop: 16,
  },
  levelDescription: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
  },
  targetAudienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetAudienceText: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
  },
  // Tufte: compact course list with higher information density
  coursesList: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  // Legacy grid styles kept for desktop fallback
  coursesGrid: {
    gap: 16,
    paddingHorizontal: 0,
    marginBottom: 24,
  },
  coursesGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 24,
  },
  showMoreButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  // Practice Section Styles - iOS Grouped Table style
  practiceSection: {
    backgroundColor: IOS_COLORS.systemBackground,
    marginBottom: 24,
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  practiceLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  practiceLoadingText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  practiceCarouselContainer: {
    marginBottom: 16,
  },
  practiceCarouselLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  practiceCarouselContent: {
    paddingRight: 16,
  },
  practiceCardWrapper: {
    width: 280,
    marginRight: 12,
  },
  practiceEmptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  practiceEmptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  practiceEmptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  practiceEmptySubtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    maxWidth: 260,
  },
  practiceEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  practiceEmptyButtonText: {
    fontSize: 17,
    color: IOS_COLORS.blue,
  },
  recentPracticeContainer: {
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
    paddingTop: 16,
  },
  recentPracticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllButtonText: {
    fontSize: 15,
    color: IOS_COLORS.blue,
  },
  recentPracticeList: {
    gap: 1,
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  recentPracticeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.systemBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  recentPracticeInfo: {
    flex: 1,
  },
  recentPracticeName: {
    fontSize: 17,
    fontWeight: '400',
    color: IOS_COLORS.label,
    marginBottom: 2,
  },
  recentPracticeDate: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  recentPracticeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentPracticeRatingText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.orange,
  },
});
