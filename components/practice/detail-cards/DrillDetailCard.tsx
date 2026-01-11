/**
 * Drill Detail Card
 *
 * Apple HIG compliant card showing:
 * - Drill name and category
 * - Instructions and success criteria
 * - Duration and equipment requirements
 * - Execution rating and notes
 *
 * Tufte design: Clear hierarchy, minimal decoration.
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  Dumbbell,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Play,
  ChevronRight,
  Target,
  BookOpen,
} from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IOS_COLORS } from '@/components/cards/constants';
import { CARD_EXPAND_DURATION, CARD_COLLAPSE_DURATION } from '@/constants/navigationAnimations';
import { PracticeSessionDrill, Drill, DRILL_CATEGORY_CONFIG, DrillCategory } from '@/types/practice';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Difficulty colors
const DIFFICULTY_COLORS = {
  beginner: IOS_COLORS.green,
  intermediate: IOS_COLORS.orange,
  advanced: IOS_COLORS.red,
} as const;

/**
 * Skill level indicator (5 dots)
 */
function RatingDots({
  rating,
  size = 8,
  color = IOS_COLORS.orange,
}: {
  rating: number;
  size?: number;
  color?: string;
}) {
  const dots = [];
  for (let i = 1; i <= 5; i++) {
    dots.push(
      <View
        key={i}
        style={[
          styles.ratingDot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: i <= rating ? color : `${color}30`,
          },
        ]}
      />
    );
  }
  return <View style={styles.ratingDots}>{dots}</View>;
}

interface DrillDetailCardProps {
  sessionDrills: PracticeSessionDrill[];
  isExpanded?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  onStartDrill?: (drillId: string) => void;
  onCompleteDrill?: (sessionDrillId: string) => void;
  onOpenLearning?: (interactiveId: string) => void;
}

export function DrillDetailCard({
  sessionDrills,
  isExpanded = false,
  onToggle,
  onPress,
  onStartDrill,
  onCompleteDrill,
  onOpenLearning,
}: DrillDetailCardProps) {
  const rotation = useSharedValue(isExpanded ? 1 : 0);

  React.useEffect(() => {
    rotation.value = withTiming(isExpanded ? 1 : 0, {
      duration: isExpanded ? CARD_EXPAND_DURATION : CARD_COLLAPSE_DURATION,
    });
  }, [isExpanded, rotation]);

  const chevronStyle = useAnimatedStyle(() => {
    'worklet';
    const rotationValue = rotation.value ?? 0;
    return {
      transform: [{ rotate: `${interpolate(rotationValue, [0, 1], [0, 90])}deg` }],
    };
  });

  const handlePress = () => {
    LayoutAnimation.configureNext({
      duration: isExpanded ? CARD_COLLAPSE_DURATION : CARD_EXPAND_DURATION,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
    if (onToggle) {
      onToggle();
    } else if (onPress) {
      onPress();
    }
  };

  const sortedDrills = [...sessionDrills].sort((a, b) => a.orderIndex - b.orderIndex);
  const primaryDrill = sortedDrills[0];
  const completedCount = sessionDrills.filter((d) => d.completed).length;
  const totalDuration = sessionDrills.reduce(
    (sum, d) => sum + (d.plannedDurationMinutes || d.drill?.durationMinutes || 15),
    0
  );

  if (!primaryDrill) {
    return (
      <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
        <View style={styles.emptyContent}>
          <Dumbbell size={32} color={IOS_COLORS.gray3} />
          <Text style={styles.emptyTitle}>No Drills Added</Text>
          <Text style={styles.emptySubtext}>Add drills to structure your practice</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      {/* Collapsed View */}
      {!isExpanded && (
        <View style={styles.tufteGrid}>
          {/* Primary drill row */}
          <View style={styles.tufteRow}>
            <Dumbbell size={18} color={IOS_COLORS.purple} />
            <Text style={styles.tufteValue} numberOfLines={1}>
              {primaryDrill.drill?.name || 'Practice Drill'}
            </Text>
            <View style={styles.metaBadge}>
              <Clock size={10} color={IOS_COLORS.gray} />
              <Text style={styles.metaBadgeText}>{totalDuration}min</Text>
            </View>
            <Animated.View style={chevronStyle}>
              <MaterialCommunityIcons name="chevron-right" size={18} color={IOS_COLORS.gray3} />
            </Animated.View>
          </View>

          {/* Progress indicator */}
          {sessionDrills.length > 1 && (
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {completedCount}/{sessionDrills.length} drills completed
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(completedCount / sessionDrills.length) * 100}%` },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionLabel}>DRILLS</Text>
            <Text style={styles.totalDuration}>{totalDuration} min total</Text>
          </View>

          {sortedDrills.map((sessionDrill, index) => {
            const drill = sessionDrill.drill;
            if (!drill) return null;

            const categoryConfig = DRILL_CATEGORY_CONFIG[drill.category];
            const difficultyColor = DIFFICULTY_COLORS[drill.difficulty] || IOS_COLORS.gray;

            return (
              <View
                key={sessionDrill.id}
                style={[
                  styles.drillItem,
                  sessionDrill.completed && styles.drillItemCompleted,
                  sessionDrill.skipped && styles.drillItemSkipped,
                ]}
              >
                {/* Drill Header */}
                <View style={styles.drillHeader}>
                  <View style={styles.drillNumberCircle}>
                    {sessionDrill.completed ? (
                      <CheckCircle2 size={16} color={IOS_COLORS.green} />
                    ) : sessionDrill.skipped ? (
                      <XCircle size={16} color={IOS_COLORS.gray} />
                    ) : (
                      <Text style={styles.drillNumber}>{index + 1}</Text>
                    )}
                  </View>
                  <View style={styles.drillText}>
                    <Text
                      style={[
                        styles.drillName,
                        sessionDrill.completed && styles.drillNameCompleted,
                      ]}
                    >
                      {drill.name}
                    </Text>
                    <View style={styles.drillMeta}>
                      <Text style={styles.drillCategory}>{categoryConfig?.label}</Text>
                      <View style={[styles.difficultyDot, { backgroundColor: difficultyColor }]} />
                      <Text style={styles.drillDuration}>
                        {sessionDrill.actualDurationMinutes ||
                          sessionDrill.plannedDurationMinutes ||
                          drill.durationMinutes}
                        min
                      </Text>
                    </View>
                  </View>
                  {!sessionDrill.completed && !sessionDrill.skipped && onStartDrill && (
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() => onStartDrill(drill.id)}
                    >
                      <Play size={14} color={IOS_COLORS.systemBackground} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Drill Description (expanded only if not completed) */}
                {!sessionDrill.completed && drill.description && (
                  <Text style={styles.drillDescription} numberOfLines={2}>
                    {drill.description}
                  </Text>
                )}

                {/* Success Criteria */}
                {!sessionDrill.completed && drill.successCriteria && (
                  <View style={styles.criteriaRow}>
                    <Target size={12} color={IOS_COLORS.green} />
                    <Text style={styles.criteriaText}>{drill.successCriteria}</Text>
                  </View>
                )}

                {/* Equipment Requirements */}
                {drill.requiresMarks && (
                  <View style={styles.requirementChip}>
                    <Text style={styles.requirementText}>Marks required</Text>
                  </View>
                )}

                {/* Linked Learning */}
                {drill.linkedInteractiveId && onOpenLearning && (
                  <TouchableOpacity
                    style={styles.learningLink}
                    onPress={() => onOpenLearning(drill.linkedInteractiveId!)}
                  >
                    <BookOpen size={14} color={IOS_COLORS.blue} />
                    <Text style={styles.learningLinkText}>View Interactive Lesson</Text>
                    <ChevronRight size={14} color={IOS_COLORS.blue} />
                  </TouchableOpacity>
                )}

                {/* Rating (for completed drills) */}
                {sessionDrill.completed && sessionDrill.rating && (
                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>Rating</Text>
                    <RatingDots rating={sessionDrill.rating} />
                  </View>
                )}

                {/* Notes */}
                {sessionDrill.notes && (
                  <Text style={styles.drillNotes}>{sessionDrill.notes}</Text>
                )}
              </View>
            );
          })}
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
  tufteGrid: {
    gap: 8,
  },
  tufteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tufteValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.gray6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 28,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.green,
    borderRadius: 2,
  },
  expandedContent: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  totalDuration: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  drillItem: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  drillItemCompleted: {
    backgroundColor: `${IOS_COLORS.green}10`,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.green}30`,
  },
  drillItemSkipped: {
    backgroundColor: IOS_COLORS.gray6,
    opacity: 0.6,
  },
  drillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drillNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${IOS_COLORS.purple}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drillNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: IOS_COLORS.purple,
  },
  drillText: {
    flex: 1,
  },
  drillName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  drillNameCompleted: {
    textDecorationLine: 'line-through',
    color: IOS_COLORS.secondaryLabel,
  },
  drillMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  drillCategory: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  drillDuration: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  startButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drillDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 4,
  },
  criteriaText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.green,
  },
  requirementChip: {
    alignSelf: 'flex-start',
    backgroundColor: `${IOS_COLORS.orange}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  requirementText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.orange,
  },
  learningLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
    marginTop: 4,
  },
  learningLinkText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: `${IOS_COLORS.green}30`,
  },
  ratingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingDot: {},
  drillNotes: {
    fontSize: 12,
    fontWeight: '400',
    fontStyle: 'italic',
    color: IOS_COLORS.secondaryLabel,
  },
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
});

export default DrillDetailCard;
