/**
 * Learn Tab - Racing Academy Course Catalog
 * Displays available learning courses organized by learning paths
 * Uses JSON catalog as single source of truth for consistency with landing page
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CourseCatalogService, { type Course, type Level } from '@/services/CourseCatalogService';
import { CourseCard } from '@/components/learn/CourseCard';
import { PricingCard } from '@/components/learn/PricingCard';
import { InstitutionalCard } from '@/components/learn/InstitutionalCard';
import { LevelTabs } from '@/components/learn/LevelTabs';
import { useAuth } from '@/providers/AuthProvider';

export default function LearnScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('level-2'); // Start with Intermediate (flagship course)
  const [showAllCourses, setShowAllCourses] = useState(false);

  const isDesktop = mounted && width > 768;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get data from catalog service
  const levels = CourseCatalogService.getLevels();
  const pricingTiers = CourseCatalogService.getPricingTiers();
  const institutionalPackages = CourseCatalogService.getInstitutionalPackages();
  const freeCourse = CourseCatalogService.getFreeCourses()[0];

  const currentLevel = levels.find((l) => l.id === selectedLevel);
  const coursesToShow = currentLevel
    ? showAllCourses
      ? currentLevel.courses
      : currentLevel.courses.slice(0, 3)
    : [];

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <LinearGradient
          colors={['#F8FAFC', '#EFF6FF', '#F0F9FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={[styles.content, isDesktop && styles.contentDesktop]}>
            {/* Hero Header */}
            <View style={styles.heroHeader}>
              <View style={styles.iconBadge}>
                <Ionicons name="school-outline" size={40} color="#8B5CF6" />
              </View>
              <Text style={[styles.mainTitle, isDesktop && styles.mainTitleDesktop]}>
                Racing Academy
              </Text>
              <Text style={[styles.heroSubtitle, isDesktop && styles.heroSubtitleDesktop]}>
                Master sailing tactics through interactive, AI-powered lessons
              </Text>
              <Text style={[styles.heroDescription, isDesktop && styles.heroDescriptionDesktop]}>
                From your first race to championship-level strategy — learn with step-by-step
                interactive animations, real-time feedback, and AI-powered analysis
              </Text>
            </View>

            {/* Free Course CTA - Prominent */}
            {freeCourse && (
              <View style={styles.freeCourseBanner}>
                <LinearGradient
                  colors={['#8B5CF6', '#6D28D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.freeCourseGradient, isDesktop && { flexDirection: 'row' }, !isDesktop && { flexDirection: 'column' }]}
                >
                  <View style={styles.freeCourseContent}>
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeText}>FREE</Text>
                    </View>
                    <View style={styles.freeCourseText}>
                      <Text style={styles.freeCourseTitle}>Start Learning Today</Text>
                      <Text style={styles.freeCourseSubtitle}>
                        Begin with "{freeCourse.title}" — a complete introduction to sailboat racing
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.startFreeButton}
                    onPress={handleStartFree}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.startFreeButtonText}>Start Free Course</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}

            {/* Learning Path Navigation */}
            <View style={styles.learningPathSection}>
              <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>
                Choose Your Learning Path
              </Text>

              <LevelTabs
                levels={levels}
                selectedLevelId={selectedLevel}
                onLevelSelect={(levelId) => {
                  setSelectedLevel(levelId);
                  setShowAllCourses(false);
                }}
              />

              {/* Level Description */}
              {currentLevel && (
                <View style={styles.levelInfo}>
                  <Text style={styles.levelDescription}>{currentLevel.description}</Text>
                  <View style={styles.targetAudienceBadge}>
                    <Ionicons name="people-outline" size={16} color="#6B7280" />
                    <Text style={styles.targetAudienceText}>For: {currentLevel.targetAudience}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Course Cards Grid */}
            <View style={[styles.coursesGrid, isDesktop && styles.coursesGridDesktop]}>
              {coursesToShow.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isDesktop={isDesktop}
                  onPress={() => handleCoursePress(course)}
                  onEnroll={() => handleEnroll(course)}
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
                  Show {currentLevel.courses.length - 3} More{' '}
                  {currentLevel.courses.length - 3 === 1 ? 'Course' : 'Courses'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#8B5CF6" />
              </TouchableOpacity>
            )}

            {/* Individual Pricing */}
            <View style={styles.pricingSection}>
              <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>
                Individual Pricing
              </Text>
              <Text style={[styles.sectionSubtitle, isDesktop && styles.sectionSubtitleDesktop]}>
                Choose the plan that fits your sailing goals
              </Text>

              <View style={[styles.pricingGrid, isDesktop && styles.pricingGridDesktop]}>
                {pricingTiers.map((tier) => (
                  <PricingCard
                    key={tier.id}
                    tier={tier}
                    isDesktop={isDesktop}
                    isFeatured={tier.id === 'championship'}
                  />
                ))}
              </View>
            </View>

            {/* Institutional Packages */}
            <View style={styles.institutionalSection}>
              <View style={styles.institutionalHeader}>
                <Ionicons name="business-outline" size={32} color="#2196F3" />
                <Text style={[styles.institutionalTitle, isDesktop && styles.institutionalTitleDesktop]}>
                  For Yacht Clubs, Teams & Programs
                </Text>
                <Text style={[styles.institutionalSubtitle, isDesktop && styles.institutionalSubtitleDesktop]}>
                  Bring RegattaFlow Academy to your organization with custom packages
                </Text>
              </View>

              <View style={[styles.institutionalGrid, isDesktop && styles.institutionalGridDesktop]}>
                {institutionalPackages.map((pkg) => (
                  <InstitutionalCard
                    key={pkg.id}
                    package={pkg}
                    isDesktop={isDesktop}
                    onContactSales={() => handleContactSales(pkg.id)}
                  />
                ))}
              </View>

              <View style={styles.institutionalCTA}>
                <Text style={styles.institutionalCTAText}>
                  Custom packages available for sailing schools, federations, and corporate programs
                </Text>
                <TouchableOpacity
                  style={styles.scheduleCallButton}
                  activeOpacity={0.8}
                  onPress={handleScheduleCall}
                >
                  <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.scheduleCallButtonText}>Schedule a Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  gradient: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    ...Platform.select({
      web: {
        minHeight: 'auto',
      },
    }),
  },
  content: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  contentDesktop: {
    // Additional desktop styles if needed
  },
  heroHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 48,
    maxWidth: 800,
    alignSelf: 'center',
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  mainTitleDesktop: {
    fontSize: 48,
  },
  heroSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitleDesktop: {
    fontSize: 24,
  },
  heroDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
  },
  heroDescriptionDesktop: {
    fontSize: 18,
  },
  freeCourseBanner: {
    marginHorizontal: 24,
    marginBottom: 64,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)',
      },
      default: {
        elevation: 8,
      },
    }),
  },
  freeCourseGradient: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  freeCourseContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  freeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  freeBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  freeCourseText: {
    flex: 1,
  },
  freeCourseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  freeCourseSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  startFreeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startFreeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  learningPathSection: {
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionTitleDesktop: {
    fontSize: 32,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  sectionSubtitleDesktop: {
    fontSize: 18,
  },
  levelInfo: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  levelDescription: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 12,
    textAlign: 'center',
  },
  targetAudienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  targetAudienceText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  coursesGrid: {
    gap: 24,
    paddingHorizontal: 24,
    marginBottom: 32,
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
    gap: 8,
    paddingVertical: 14,
    marginHorizontal: 24,
    marginBottom: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  showMoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  pricingSection: {
    paddingHorizontal: 24,
    paddingVertical: 64,
    backgroundColor: '#F9FAFB',
  },
  pricingGrid: {
    gap: 24,
  },
  pricingGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  institutionalSection: {
    paddingHorizontal: 24,
    paddingVertical: 64,
  },
  institutionalHeader: {
    alignItems: 'center',
    marginBottom: 48,
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
    gap: 24,
    marginBottom: 48,
  },
  institutionalGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
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
});
