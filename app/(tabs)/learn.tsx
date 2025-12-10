/**
 * Learn Tab - Learning Platform Course Catalog
 * Displays available learning courses from the learning platform
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LearningService, type LearningCourse } from '@/services/LearningService';
import { useAuth } from '@/providers/AuthProvider';
import { InstagramExporter } from '@/components/learn';

// System admin emails that can access content export features
const ADMIN_EMAILS = [
  '01kdenney@icloud.com',
  'coachkdenney@icloud.com', 
  'coach-test@regattaflow.com',
  'kyle@regattaflow.com',
  'admin@regattaflow.com',
  // Add more admin emails as needed
];

export default function LearnScreen() {
  const { user, userType } = useAuth();
  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProSubscription, setHasProSubscription] = useState(false);
  const [showInstagramExporter, setShowInstagramExporter] = useState(false);

  // System admins, coaches, and clubs can export content for Instagram
  const isSystemAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  const canExportContent = isSystemAdmin || userType === 'coach' || userType === 'club';

  useEffect(() => {
    console.log('[Learn] Component mounted, starting loadCourses...');
    loadCourses();
  }, []);

  // Check subscription when user is available
  useEffect(() => {
    if (user?.id) {
      checkSubscription();
    }
  }, [user?.id]);

  const checkSubscription = async () => {
    if (!user?.id) return;
    try {
      const { hasProAccess } = await LearningService.checkSubscriptionAccess(user.id);
      setHasProSubscription(hasProAccess);
      console.log('[Learn] Pro subscription:', hasProAccess);
    } catch (err) {
      console.error('[Learn] Failed to check subscription:', err);
    }
  };

  const loadCourses = async () => {
    console.log('[Learn] loadCourses called');
    try {
      setLoading(true);
      setError(null);
      console.log('[Learn] Calling LearningService.getCourses()...');
      
      // Add timeout to prevent hanging (30s to allow for Supabase cold starts)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );
      
      const coursesPromise = LearningService.getCourses();
      console.log('[Learn] Waiting for courses promise...');
      const publishedCourses = await Promise.race([coursesPromise, timeoutPromise]) as LearningCourse[];
      
      console.log('[Learn] ✅ Loaded courses:', publishedCourses?.length, publishedCourses);
      console.log('[Learn] Course data structure:', JSON.stringify(publishedCourses?.[0], null, 2));
      setCourses(publishedCourses || []);
      console.log('[Learn] State updated with courses, count:', publishedCourses?.length);
    } catch (err: any) {
      console.error('[Learn] ❌ Failed to load courses:', err);
      console.error('[Learn] Error details:', JSON.stringify(err, null, 2));
      const errorMessage = err?.message?.includes('timeout') 
        ? 'Request timed out. Please check your connection.'
        : err?.message || 'Unable to load courses. Please try again.';
      setError(errorMessage);
    } finally {
      console.log('[Learn] Setting loading to false');
      setLoading(false);
    }
  };

  const handleCoursePress = (course: LearningCourse) => {
    router.push({
      pathname: '/(tabs)/learn/[courseId]',
      params: { courseId: course.id },
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatPrice = (cents: number | null) => {
    if (!cents) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const renderCourseCard = ({ item: course }: { item: LearningCourse }) => {
    console.log('[Learn] Rendering course card:', course.title);
    const levelColors: Record<string, string> = {
      beginner: '#10B981',
      intermediate: '#3B82F6',
      advanced: '#8B5CF6',
    };

    return (
      <TouchableOpacity
        style={styles.courseCard}
        onPress={() => handleCoursePress(course)}
        activeOpacity={0.7}
      >
        <View style={styles.courseCardHeader}>
          {course.is_featured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
          <View style={[styles.levelBadge, { backgroundColor: levelColors[course.level] || '#64748B' }]}>
            <Text style={styles.levelText}>{course.level}</Text>
          </View>
        </View>

        <View style={styles.courseCardContent}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          {course.description && (
            <Text style={styles.courseDescription} numberOfLines={2}>
              {course.description}
            </Text>
          )}

          <View style={styles.courseMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{formatDuration(course.duration_minutes)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="book-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>
                {course.learning_modules?.length || 0} modules
              </Text>
            </View>
          </View>

          {course.instructor_name && (
            <View style={styles.instructorRow}>
              <Ionicons name="person-outline" size={14} color="#64748B" />
              <Text style={styles.instructorText}>{course.instructor_name}</Text>
            </View>
          )}
        </View>

        <View style={styles.courseCardFooter}>
          {hasProSubscription && course.price_cents && course.price_cents > 0 ? (
            <View style={styles.proIncludedBadge}>
              <Ionicons name="star" size={14} color="#8B5CF6" />
              <Text style={styles.proIncludedText}>Included with Pro</Text>
            </View>
          ) : (
            <Text style={styles.priceText}>{formatPrice(course.price_cents)}</Text>
          )}
          <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="school-outline" size={64} color="#CBD5E1" />
      <Text style={styles.emptyStateTitle}>No courses available</Text>
      <Text style={styles.emptyStateText}>
        Check back soon for new learning courses!
      </Text>
    </View>
  );

  // Debug: Log render state
  console.log('[Learn] Render - loading:', loading, 'error:', error, 'courses:', courses.length);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Learn</Text>
            <Text style={styles.headerSubtitle}>Interactive sailing courses</Text>
          </View>
          {canExportContent && (
            <TouchableOpacity
              style={styles.instagramButton}
              onPress={() => setShowInstagramExporter(true)}
            >
              <MaterialCommunityIcons name="instagram" size={22} color="#E4405F" />
              <Text style={styles.instagramButtonText}>Share</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Instagram Exporter Modal */}
      <InstagramExporter
        visible={showInstagramExporter}
        onClose={() => setShowInstagramExporter(false)}
        skillName="mark-rounding-execution"
      />

      {loading ? (
        <View style={styles.listContent}>
          {/* Skeleton loading - shows instantly for perceived performance */}
          {[1, 2].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonHeader}>
                <View style={styles.skeletonBadge} />
                <View style={styles.skeletonBadgeSmall} />
              </View>
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonDescription} />
                <View style={styles.skeletonDescription} />
                <View style={styles.skeletonMeta}>
                  <View style={styles.skeletonMetaItem} />
                  <View style={styles.skeletonMetaItem} />
                </View>
              </View>
              <View style={styles.skeletonFooter}>
                <View style={styles.skeletonPrice} />
              </View>
            </View>
          ))}
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCourses}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : courses.length > 0 ? (
        <FlatList
          data={courses}
          renderItem={renderCourseCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadCourses}
          ListEmptyComponent={renderEmptyState}
        />
      ) : (
        renderEmptyState()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  instagramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF5F7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  instagramButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E4405F',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.08)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }),
  },
  courseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  courseCardContent: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  courseMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instructorText: {
    fontSize: 12,
    color: '#64748B',
  },
  courseCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  proIncludedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proIncludedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
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
  // Skeleton loading styles
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.08)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }),
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  skeletonBadge: {
    width: 70,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  skeletonBadgeSmall: {
    width: 80,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  skeletonContent: {
    padding: 16,
  },
  skeletonTitle: {
    width: '70%',
    height: 24,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  skeletonDescription: {
    width: '100%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  skeletonMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  skeletonMetaItem: {
    width: 80,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  skeletonPrice: {
    width: 60,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
});

