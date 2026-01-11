/**
 * Learn Tab - Racing Academy Course Catalog
 * Displays available learning courses organized by learning paths
 * Uses JSON catalog as single source of truth for consistency with landing page
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  
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
import { ChevronRight } from 'lucide-react-native';
import CourseCatalogService, { type Course, type Level } from '@/services/CourseCatalogService';
import { IOS_COLORS } from '@/components/cards/constants';
import { CourseCard } from '@/components/learn/CourseCard';
import { CourseRow } from '@/components/learn/CourseRow';
import { InProgressCard } from '@/components/learn/InProgressCard';
import { PricingCard } from '@/components/learn/PricingCard';
import { PricingTable } from '@/components/learn/PricingTable';
import { InstitutionalCard } from '@/components/learn/InstitutionalCard';
import { LevelTabs } from '@/components/learn/LevelTabs';
import { useAuth } from '@/providers/AuthProvider';

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
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('level-1'); // Start with Fundamentals (natural progression)
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [activePricingIndex, setActivePricingIndex] = useState(0);
  const [activeInstitutionalIndex, setActiveInstitutionalIndex] = useState(0);
  const pricingScrollRef = useRef<ScrollView>(null);
  const institutionalScrollRef = useRef<ScrollView>(null);

  const isDesktop = mounted && width > 768;
  // Card width for carousel: 85% of screen width to show peek of next card
  const CARD_WIDTH = width * 0.85;
  const CARD_SPACING = 12;

  // Get data from catalog service (must be before useEffect that uses pricingTiers)
  const levels = CourseCatalogService.getLevels();
  const pricingTiers = CourseCatalogService.getPricingTiers();
  const institutionalPackages = CourseCatalogService.getInstitutionalPackages();
  const freeCourse = CourseCatalogService.getFreeCourses()[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-scroll to featured tier (Championship = index 3) on mount for mobile
  useEffect(() => {
    if (mounted && !isDesktop && pricingScrollRef.current) {
      // Find the index of the featured tier
      const featuredIndex = pricingTiers.findIndex(t => t.id === 'championship');
      if (featuredIndex > 0) {
        // Small delay to ensure layout is complete
        setTimeout(() => {
          pricingScrollRef.current?.scrollTo({
            x: featuredIndex * (CARD_WIDTH + CARD_SPACING),
            animated: false,
          });
          setActivePricingIndex(featuredIndex);
        }, 100);
      }
    }
  }, [mounted, isDesktop, pricingTiers, CARD_WIDTH, CARD_SPACING]);

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

  const handleStartFree = () => {
    if (freeCourse) {
      router.push({
        pathname: '/(tabs)/learn/[courseId]',
        params: { courseId: freeCourse.slug },
      });
    }
  };

  const handleContactSales = (packageId: string) => {
    if (Platform.OS === 'web') {
      window.location.href = `mailto:sales@regattaflow.com?subject=Institutional Package Inquiry: ${packageId}`;
    } else {
      alert('Please contact sales@regattaflow.com for institutional packages');
    }
  };

  const handleScheduleCall = () => {
    if (Platform.OS === 'web') {
      window.open('https://calendly.com/regattaflow-sales', '_blank');
    } else {
      alert('Please contact us to schedule a call');
    }
  };

  // Handle pricing carousel scroll to update page indicators
  const handlePricingScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
    if (index !== activePricingIndex && index >= 0 && index < pricingTiers.length) {
      setActivePricingIndex(index);
    }
  };

  // Handle institutional carousel scroll to update page indicators
  const handleInstitutionalScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
    if (index !== activeInstitutionalIndex && index >= 0 && index < institutionalPackages.length) {
      setActiveInstitutionalIndex(index);
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

            {/* Individual Pricing (Tufte: comparison table for desktop) */}
            <View style={styles.pricingSection}>
              <Text style={[styles.pricingSectionTitle, isDesktop && styles.pricingSectionTitleDesktop]}>
                Pricing
              </Text>

              {/* Desktop: Tufte comparison table */}
              {isDesktop ? (
                <PricingTable
                  tiers={pricingTiers}
                  featuredTierId="championship"
                  onSelectTier={(tier) => {
                    if (tier.price.cents === 0) {
                      handleStartFree();
                    } else {
                      // Handle paid tier selection
                      console.log('Selected tier:', tier.id);
                    }
                  }}
                />
              ) : (
                /* Mobile: Horizontal snap carousel */
                <>
                  <ScrollView
                    ref={pricingScrollRef}
                    horizontal
                    pagingEnabled={false}
                    snapToInterval={CARD_WIDTH + CARD_SPACING}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    onScroll={handlePricingScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={styles.pricingCarouselContent}
                    style={styles.pricingCarousel}
                  >
                    {pricingTiers.map((tier, index) => (
                      <View
                        key={tier.id}
                        style={[
                          styles.pricingCardWrapper,
                          { width: CARD_WIDTH, marginRight: index < pricingTiers.length - 1 ? CARD_SPACING : 0 },
                        ]}
                      >
                        <PricingCard
                          tier={tier}
                          isDesktop={false}
                          isFeatured={tier.id === 'championship'}
                          compact
                        />
                      </View>
                    ))}
                  </ScrollView>
                  {/* Page indicator dots */}
                  <View style={styles.pageIndicators}>
                    {pricingTiers.map((tier, index) => (
                      <View
                        key={tier.id}
                        style={[
                          styles.pageIndicatorDot,
                          index === activePricingIndex && styles.pageIndicatorDotActive,
                          tier.id === 'championship' && styles.pageIndicatorDotFeatured,
                        ]}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* Institutional Packages (Tufte: tightened header) */}
            <View style={styles.institutionalSection}>
              <Text style={[styles.institutionalSectionTitle, isDesktop && styles.institutionalSectionTitleDesktop]}>
                Teams & Organizations
              </Text>

              {/* Desktop: Grid layout */}
              {isDesktop ? (
                <View style={[styles.institutionalGrid, styles.institutionalGridDesktop]}>
                  {institutionalPackages.map((pkg) => (
                    <InstitutionalCard
                      key={pkg.id}
                      package={pkg}
                      isDesktop={isDesktop}
                      onContactSales={() => handleContactSales(pkg.id)}
                    />
                  ))}
                </View>
              ) : (
                /* Mobile: Horizontal snap carousel */
                <>
                  <ScrollView
                    ref={institutionalScrollRef}
                    horizontal
                    pagingEnabled={false}
                    snapToInterval={CARD_WIDTH + CARD_SPACING}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleInstitutionalScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={styles.institutionalCarouselContent}
                    style={styles.institutionalCarousel}
                  >
                    {institutionalPackages.map((pkg, index) => (
                      <View
                        key={pkg.id}
                        style={[
                          styles.institutionalCardWrapper,
                          { width: CARD_WIDTH, marginRight: index < institutionalPackages.length - 1 ? CARD_SPACING : 0 },
                        ]}
                      >
                        <InstitutionalCard
                          package={pkg}
                          isDesktop={false}
                          compact
                          onContactSales={() => handleContactSales(pkg.id)}
                        />
                      </View>
                    ))}
                  </ScrollView>
                  {/* Page indicator dots */}
                  <View style={styles.institutionalPageIndicators}>
                    {institutionalPackages.map((pkg, index) => (
                      <View
                        key={pkg.id}
                        style={[
                          styles.institutionalPageDot,
                          index === activeInstitutionalIndex && styles.institutionalPageDotActive,
                        ]}
                      />
                    ))}
                  </View>
                </>
              )}

              {/* Tufte: Simplified CTA */}
              <TouchableOpacity
                style={styles.scheduleCTA}
                activeOpacity={0.8}
                onPress={handleScheduleCall}
              >
                <Text style={styles.scheduleCTAText}>
                  Need a custom package? Schedule a call →
                </Text>
              </TouchableOpacity>
            </View>
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
  // Free Course CTA - iOS List Row
  freeCourseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.systemBackground,
    marginBottom: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  freeCourseIcon: {
    marginRight: 12,
  },
  freeCourseContent: {
    flex: 1,
  },
  freeCourseTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  freeCourseSubtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
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
  pricingSection: {
    paddingVertical: 32,
    backgroundColor: '#F9FAFB',
    marginHorizontal: -16, // Extend to screen edges
    paddingHorizontal: 16,
  },
  // Tufte: tightened section title
  pricingSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 16,
  },
  pricingSectionTitleDesktop: {
    fontSize: 24,
    marginBottom: 24,
  },
  pricingGrid: {
    gap: 24,
  },
  pricingGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  // Mobile carousel styles
  pricingCarousel: {
    marginHorizontal: -16, // Extend to screen edges
    paddingTop: 16, // Space for "MOST POPULAR" badge
  },
  pricingCarouselContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  pricingCardWrapper: {
    // Height set to auto to allow card to determine its height
  },
  // Page indicator dots
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  pageIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  pageIndicatorDotActive: {
    backgroundColor: '#8B5CF6',
    width: 24,
    borderRadius: 4,
  },
  pageIndicatorDotFeatured: {
    // Featured tier gets a slightly different inactive color
  },
  institutionalSection: {
    paddingVertical: 24,
    marginHorizontal: -16, // Extend to screen edges on mobile
    paddingHorizontal: 16,
  },
  // Tufte: tightened section title
  institutionalSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 16,
  },
  institutionalSectionTitleDesktop: {
    fontSize: 24,
    marginBottom: 20,
  },
  // Legacy styles kept for reference
  institutionalHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  institutionalHeaderCompact: {
    marginBottom: 24,
  },
  institutionalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  institutionalTitleDesktop: {
    fontSize: 36,
  },
  institutionalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 600,
  },
  institutionalSubtitleDesktop: {
    fontSize: 18,
  },
  institutionalGrid: {
    gap: 12,
    marginBottom: 16,
  },
  institutionalGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  // Mobile institutional carousel styles
  institutionalCarousel: {
    marginHorizontal: -16, // Extend to screen edges
  },
  institutionalCarouselContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  institutionalCardWrapper: {
    // Height set to auto
  },
  // Page indicator dots for institutional
  institutionalPageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  institutionalPageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  institutionalPageDotActive: {
    backgroundColor: '#2196F3',
    width: 24,
    borderRadius: 4,
  },
  institutionalCTA: {
    backgroundColor: '#F9FAFB',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  institutionalCTAText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
    maxWidth: 600,
  },
  scheduleCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  scheduleCallButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Tufte: Simplified schedule CTA
  scheduleCTA: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  scheduleCTAText: {
    fontSize: 15,
    color: '#2196F3',
    fontWeight: '500',
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
