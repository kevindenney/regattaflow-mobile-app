/**
 * Course Card Component
 * Reusable course card for displaying course information
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Course } from '@/services/CourseCatalogService';

interface CourseCardProps {
  course: Course;
  isDesktop?: boolean;
  onPress: () => void;
  onEnroll?: () => void;
}

// Helper functions
function getLevelDisplayName(levelId: string): string {
  const levelMap: Record<string, string> = {
    'level-1': 'Beginner',
    'level-2': 'Intermediate',
    'level-3': 'Advanced',
    'specializations': 'Specialization',
  };
  return levelMap[levelId] || levelId;
}

function getLevelColor(levelId: string): string {
  const colorMap: Record<string, string> = {
    'level-1': '#10B981',
    'level-2': '#F59E0B',
    'level-3': '#EF4444',
    'specializations': '#8B5CF6',
  };
  return colorMap[levelId] || '#6B7280';
}

export function CourseCard({ course, isDesktop = false, onPress, onEnroll }: CourseCardProps) {
  const levelColor = getLevelColor(course.level);
  const levelName = getLevelDisplayName(course.level);
  const isFlagship = course.slug === 'winning-starts-first-beats';

  const handleEnroll = () => {
    if (onEnroll) {
      onEnroll();
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.courseCard, isDesktop && styles.courseCardDesktop]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={course.status === 'coming-soon'}
    >
      {/* Course Thumbnail */}
      <View style={styles.courseThumbnailContainer}>
        <View style={[styles.courseThumbnail, { backgroundColor: '#F3E8FF' }]}>
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons
              name={
                course.level === 'level-1'
                  ? 'flag-outline'
                  : course.level === 'level-2'
                  ? 'navigate-outline'
                  : course.level === 'level-3'
                  ? 'trophy-outline'
                  : 'boat-outline'
              }
              size={48}
              color="#8B5CF6"
            />
          </View>

          {/* Status Badges */}
          {course.status === 'coming-soon' && (
            <View style={styles.comingSoonBadge}>
              <Ionicons name="time-outline" size={14} color="#FFFFFF" />
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          )}

          {isFlagship && (
            <View style={styles.flagshipBadge}>
              <Ionicons name="rocket" size={14} color="#FFFFFF" />
              <Text style={styles.flagshipText}>Flagship</Text>
            </View>
          )}
        </View>

        {/* Quick Stats Bar */}
        <View style={styles.quickStatsBar}>
          <View style={styles.quickStat}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.quickStatText}>{course.duration.totalMinutes} min</Text>
          </View>
          <View style={styles.quickStat}>
            <Ionicons name="book-outline" size={14} color="#6B7280" />
            <Text style={styles.quickStatText}>
              {course.modules?.length || 0} {course.modules?.length === 1 ? 'module' : 'modules'}
            </Text>
          </View>
          {course.skillsUsed && course.skillsUsed.length > 0 && (
            <View style={styles.quickStat}>
              <Ionicons name="flash-outline" size={14} color="#8B5CF6" />
              <Text style={[styles.quickStatText, { color: '#8B5CF6' }]}>
                {course.skillsUsed.length} AI {course.skillsUsed.length === 1 ? 'tool' : 'tools'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Course Content */}
      <View style={styles.courseContent}>
        {/* Level Badge */}
        <View style={styles.levelBadge}>
          <View style={[styles.levelDot, { backgroundColor: levelColor }]} />
          <Text style={styles.levelBadgeText}>{levelName}</Text>
        </View>

        <Text style={[styles.courseTitle, isDesktop && styles.courseTitleDesktop]}>
          {course.title}
        </Text>
        <Text style={[styles.courseDescription, isDesktop && styles.courseDescriptionDesktop]}>
          {course.description}
        </Text>

        {/* What You'll Learn */}
        {course.whatYouLearn && course.whatYouLearn.length > 0 && (
          <View style={styles.whatYouLearnSection}>
            <Text style={styles.whatYouLearnTitle}>What you'll learn:</Text>
            <View style={styles.learningPointsList}>
              {course.whatYouLearn.slice(0, 3).map((point, idx) => (
                <View key={idx} style={styles.learningPoint}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.learningPointText}>{point}</Text>
                </View>
              ))}
              {course.whatYouLearn.length > 3 && (
                <Text style={styles.morePointsText}>
                  +{course.whatYouLearn.length - 3} more{' '}
                  {course.whatYouLearn.length - 3 === 1 ? 'skill' : 'skills'}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Interactive Features Highlight */}
        {course.skillsUsed && course.skillsUsed.length > 0 && (
          <View style={styles.interactiveFeaturesBox}>
            <View style={styles.interactiveHeader}>
              <Ionicons name="flash" size={18} color="#8B5CF6" />
              <Text style={styles.interactiveHeaderText}>Interactive Learning</Text>
            </View>
            <View style={styles.skillChips}>
              {course.skillsUsed.slice(0, 2).map((skill, idx) => (
                <View key={idx} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>
                    {skill.replace(/-/g, ' ').replace(/interactive/i, '').trim()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Instructor */}
        {course.instructor && (
          <View style={styles.instructorSection}>
            <View style={styles.instructorAvatar}>
              <Text style={styles.instructorInitials}>
                {course.instructor.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </Text>
            </View>
            <View style={styles.instructorInfo}>
              <Text style={styles.instructorName}>{course.instructor.name}</Text>
              <Text style={styles.instructorTitle} numberOfLines={2}>
                {course.instructor.bio}
              </Text>
            </View>
          </View>
        )}

        {/* Module Preview */}
        {course.modules && course.modules.length > 0 && (
          <View style={styles.modulePreviewSection}>
            <Text style={styles.modulePreviewTitle}>Course modules:</Text>
            <View style={styles.modulesList}>
              {course.modules.slice(0, 3).map((module, idx) => (
                <View key={module.id} style={styles.moduleItem}>
                  <View style={styles.moduleNumber}>
                    <Text style={styles.moduleNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.moduleTitle} numberOfLines={1}>
                    {module.title}
                  </Text>
                  {module.durationMinutes && (
                    <Text style={styles.moduleLessonCount}>{module.durationMinutes} min</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Course Footer - Price & CTA */}
      <View style={styles.courseFooter}>
        <View style={styles.priceSection}>
          {course.price.cents === 0 ? (
            <Text style={styles.priceFree}>FREE</Text>
          ) : course.status === 'coming-soon' ? (
            <Text style={styles.releaseDate}>
              {course.releaseDate
                ? new Date(course.releaseDate).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Coming Soon'}
            </Text>
          ) : (
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${(course.price.cents / 100).toFixed(0)}</Text>
              <Text style={styles.priceLabel}>/year</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.enrollButton,
            course.status === 'coming-soon' && styles.enrollButtonSecondary,
            course.price.cents === 0 && styles.enrollButtonFree,
          ]}
          disabled={course.status === 'coming-soon'}
          onPress={handleEnroll}
          activeOpacity={0.8}
        >
          <Text style={styles.enrollButtonText}>
            {course.status === 'coming-soon'
              ? 'Notify Me'
              : course.price.cents === 0
              ? 'Start Free'
              : 'Enroll Now'}
          </Text>
          <Ionicons
            name={course.status === 'coming-soon' ? 'notifications-outline' : 'arrow-forward'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        cursor: 'pointer',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  courseCardDesktop: {
    width: '30%',
    minWidth: 350,
    maxWidth: 400,
  },
  courseThumbnailContainer: {
    position: 'relative',
  },
  courseThumbnail: {
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnailPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(107, 114, 128, 0.95)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  flagshipBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.95)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  flagshipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickStatsBar: {
    flexDirection: 'row',
    gap: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickStatText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  courseContent: {
    padding: 20,
    flex: 1,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 28,
  },
  courseTitleDesktop: {
    fontSize: 22,
  },
  courseDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  courseDescriptionDesktop: {
    fontSize: 15,
  },
  whatYouLearnSection: {
    marginBottom: 16,
  },
  whatYouLearnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 10,
  },
  learningPointsList: {
    gap: 8,
  },
  learningPoint: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  learningPointText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  morePointsText: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '600',
    marginTop: 4,
  },
  interactiveFeaturesBox: {
    backgroundColor: '#F3E8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  interactiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  interactiveHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6D28D9',
  },
  skillChips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  skillChip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  skillChipText: {
    fontSize: 12,
    color: '#6D28D9',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  instructorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 16,
  },
  instructorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructorInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  instructorInfo: {
    flex: 1,
  },
  instructorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  instructorTitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  modulePreviewSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 16,
  },
  modulePreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 10,
  },
  modulesList: {
    gap: 8,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moduleNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  moduleTitle: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
  },
  moduleLessonCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  courseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  priceSection: {
    flex: 1,
  },
  priceFree: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10B981',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  priceLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  releaseDate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  enrollButtonSecondary: {
    backgroundColor: '#6B7280',
  },
  enrollButtonFree: {
    backgroundColor: '#10B981',
  },
  enrollButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

