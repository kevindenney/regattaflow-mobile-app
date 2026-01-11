/**
 * Course Detail Card
 *
 * Apple Human Interface Guidelines (HIG) compliant design:
 * - iOS system colors from shared constants
 * - Expandable card showing course information
 * - Collapsed: Header + course type + mark count
 * - Expanded: Full course details, marks list, distance
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import { CARD_EXPAND_DURATION, CARD_COLLAPSE_DURATION } from '@/constants/navigationAnimations';
import { IOS_COLORS } from '@/components/cards/constants';
import { CourseSelector } from '@/components/races/intentions';
import type { CourseSelectionIntention } from '@/types/raceIntentions';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Mark {
  id: string;
  name: string;
  type: 'windward' | 'leeward' | 'gate' | 'offset' | 'start' | 'finish' | 'waypoint';
}

/** Course option for selection */
interface CourseOption {
  id: string;
  name: string;
  sequence?: string;
}

interface CourseDetailCardProps {
  raceId: string;
  courseName?: string;
  courseType?: 'windward-leeward' | 'triangle' | 'trapezoid' | 'distance' | 'custom';
  numberOfLegs?: number;
  approximateDistance?: string;
  marks?: Mark[];
  isExpanded?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  // Distance race support
  isDistanceRace?: boolean;
  customTitle?: string;
  totalDistanceNm?: number;
  timeLimitHours?: number;
  routeWaypoints?: any[];
  // Course selection props (from sailing instructions)
  availableCourses?: CourseOption[];
  courseSelection?: CourseSelectionIntention;
  onCourseSelectionChange?: (selection: CourseSelectionIntention) => void;
}

export function CourseDetailCard({
  raceId,
  courseName,
  courseType,
  numberOfLegs,
  approximateDistance,
  marks,
  isExpanded = false,
  onToggle,
  onPress,
  isDistanceRace = false,
  customTitle,
  totalDistanceNm,
  timeLimitHours,
  routeWaypoints,
  availableCourses = [],
  courseSelection,
  onCourseSelectionChange,
}: CourseDetailCardProps) {
  const hasData = courseName || courseType || numberOfLegs || marks?.length;
  const rotation = useSharedValue(isExpanded ? 1 : 0);

  // Check if there's a course selection indicator to show in collapsed state
  const hasCourseSelected = !!courseSelection?.selectedCourseName;

  // Update rotation when isExpanded changes
  React.useEffect(() => {
    rotation.value = withTiming(isExpanded ? 1 : 0, {
      duration: isExpanded ? CARD_EXPAND_DURATION : CARD_COLLAPSE_DURATION,
    });
  }, [isExpanded, rotation]);

  // Animated chevron rotation
  const chevronStyle = useAnimatedStyle(() => {
    'worklet';
    const rotationValue = rotation.value ?? 0;
    return {
      transform: [{ rotate: `${interpolate(rotationValue, [0, 1], [0, 90])}deg` }],
    };
  });

  const handlePress = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: isExpanded ? CARD_COLLAPSE_DURATION : CARD_EXPAND_DURATION,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });

    if (onToggle) {
      onToggle();
    } else if (onPress) {
      onPress();
    }
  }, [isExpanded, onToggle, onPress]);

  const getCourseTypeLabel = (type?: string) => {
    switch (type) {
      case 'windward-leeward': return 'Windward-Leeward';
      case 'triangle': return 'Triangle';
      case 'trapezoid': return 'Trapezoid';
      case 'distance': return 'Distance Race';
      case 'custom': return 'Custom';
      default: return type || 'Unknown';
    }
  };

  const getCourseIcon = (type?: string) => {
    switch (type) {
      case 'windward-leeward': return 'arrow-up-down';
      case 'triangle': return 'triangle-outline';
      case 'distance': return 'map-marker-path';
      default: return 'map-marker-multiple';
    }
  };

  const getMarkTypeColor = (type: Mark['type']) => {
    switch (type) {
      case 'windward': return IOS_COLORS.red;
      case 'leeward': return IOS_COLORS.blue;
      case 'gate': return IOS_COLORS.purple;
      case 'start': return IOS_COLORS.green;
      case 'finish': return IOS_COLORS.orange;
      default: return IOS_COLORS.secondaryLabel;
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header - Tufte typography-only */}
      <View style={styles.tufteHeader}>
        <Text style={styles.tufteHeaderTitle}>
          {isDistanceRace ? 'ROUTE' : 'COURSE'}
        </Text>
        {courseName && (
          <Text style={styles.tufteHeaderSubtitle}>{courseName}</Text>
        )}
        <Animated.View style={chevronStyle}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={IOS_COLORS.gray} />
        </Animated.View>
      </View>

      {/* Content */}
      {hasData ? (
        <>
          {/* Collapsed: Show ALL data (Tufte principle) */}
          {!isExpanded && (
            <View style={styles.tufteCollapsedContent}>
              {/* Stats summary */}
              <Text style={styles.tufteCollapsedData}>
                {[
                  courseType && getCourseTypeLabel(courseType),
                  numberOfLegs !== undefined && `${numberOfLegs} legs`,
                  marks && marks.length > 0 && `${marks.length} marks`,
                  approximateDistance,
                  totalDistanceNm && `${totalDistanceNm}nm`,
                ].filter(Boolean).join(' · ')}
              </Text>

              {/* Leg sequence - show full course in collapsed */}
              {marks && marks.length > 0 && marks.length <= 8 && (
                <View style={styles.tufteLegsPreview}>
                  {marks.map((mark, index) => (
                    <View key={mark.id} style={styles.tufteCollapsedLegRow}>
                      <Text style={styles.tufteLegNumber}>{index + 1}.</Text>
                      <Text style={styles.tufteCollapsedLegName}>{mark.name}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* For longer courses, show summary */}
              {marks && marks.length > 8 && (
                <Text style={styles.tufteLegsSummary}>
                  {marks.slice(0, 3).map(m => m.name).join(' → ')} ... → {marks[marks.length - 1]?.name}
                </Text>
              )}

              {/* Course selection status */}
              {hasCourseSelected && (
                <Text style={styles.tufteSelectedCourse}>
                  Selected: {courseSelection?.selectedCourseName} ✓
                </Text>
              )}

              {/* CTA if course selection needed */}
              {onCourseSelectionChange && !hasCourseSelected && (
                <Text style={styles.tufteCourseSelectCTA}>
                  Tap to select course →
                </Text>
              )}
            </View>
          )}

          {/* Expanded: INTERACTION ONLY (course selection) */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {/* Course Selection - the interaction */}
              {onCourseSelectionChange ? (
                <View style={styles.courseSelectionSection}>
                  <Text style={styles.tufteSectionLabel}>SELECT COURSE</Text>
                  <CourseSelector
                    courses={availableCourses}
                    selection={courseSelection}
                    onChange={onCourseSelectionChange}
                    allowManualEntry={true}
                  />
                </View>
              ) : (
                /* If no course selection, show detailed mark list */
                <>
                  <Text style={styles.tufteSummary}>
                    {numberOfLegs !== undefined && `${numberOfLegs} legs`}
                    {numberOfLegs !== undefined && marks && marks.length > 0 && ' · '}
                    {marks && marks.length > 0 && `${marks.length} marks`}
                    {approximateDistance && ` · ${approximateDistance}`}
                  </Text>

                  {marks && marks.length > 0 && (
                    <View style={styles.tufteLegsSection}>
                      {marks.map((mark, index) => (
                        <View key={mark.id} style={styles.tufteLegRow}>
                          <Text style={styles.tufteLegNumber}>{index + 1}.</Text>
                          <Text style={styles.tufteLegName}>{mark.name}</Text>
                          <Text style={styles.tufteLegType}>{mark.type}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </>
      ) : (
        /* Empty state */
        <View style={styles.emptyContent}>
          <MaterialCommunityIcons name="map-marker-question-outline" size={32} color={IOS_COLORS.gray3} />
          <Text style={styles.emptyTitle}>No Course Set</Text>
          <Text style={styles.emptySubtext}>Course details will appear here</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${IOS_COLORS.green}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconDistance: {
    backgroundColor: `${IOS_COLORS.purple}15`,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },

  // Collapsed content
  collapsedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
    gap: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: `${IOS_COLORS.green}15`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  collapsedStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  statLabel: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  courseSelectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${IOS_COLORS.green}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  courseSelectedText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.green,
  },

  // Expanded content
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
    gap: 16,
  },
  expandedTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: `${IOS_COLORS.green}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  expandedTypeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  expandedStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  expandedStatLabel: {
    fontSize: 11,
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Tufte-style summary and leg sequence
  tufteSummary: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 4,
  },
  tufteLegsSection: {
    gap: 4,
  },
  tufteLegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.gray6,
  },
  tufteLegNumber: {
    width: 20,
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    fontVariant: ['tabular-nums'],
  },
  tufteLegName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  tufteLegType: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    textTransform: 'capitalize',
  },

  // Empty state
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },

  // Course selection section
  courseSelectionSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
  },

  // ==========================================================================
  // TUFTE STYLES - Typography-driven, flat design
  // ==========================================================================
  tufteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tufteHeaderTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tufteHeaderSubtitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  tufteCollapsedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
    gap: 4,
  },
  tufteCollapsedData: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  tufteSelectedCourse: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.green,
    marginTop: 4,
  },
  tufteLegsPreview: {
    gap: 2,
    marginTop: 8,
  },
  tufteCollapsedLegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  tufteCollapsedLegName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  tufteLegsSummary: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 8,
  },
  tufteCourseSelectCTA: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.blue,
    marginTop: 8,
  },
  tufteSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
});
