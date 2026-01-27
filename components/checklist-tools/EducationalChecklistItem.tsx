/**
 * EducationalChecklistItem - iOS HIG Redesign
 *
 * Single item in an educational checklist with:
 * - iOS-style animated checkmark
 * - Swipe-to-complete gesture
 * - Trailing icon accessories
 * - Haptic feedback on completion
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import {
  Wrench,
  BookOpen,
  FileCheck2,
  FileWarning,
  Loader2,
} from 'lucide-react-native';
import type { EducationalChecklistItem as EducationalChecklistItemType } from '@/types/checklists';
import { LessonPanel } from './LessonPanel';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SWIPE_THRESHOLD = 80;

export type DocumentStatus = 'uploaded' | 'missing' | 'extracting' | null;

interface EducationalChecklistItemProps {
  item: EducationalChecklistItemType;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onOpenTool: () => void;
  /** Document status for document-related items (NOR, SI, amendments) */
  documentStatus?: DocumentStatus;
  /** Whether this is the last item (no separator) */
  isLast?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function EducationalChecklistItem({
  item,
  isCompleted,
  onToggleComplete,
  onOpenTool,
  documentStatus,
  isLast = false,
}: EducationalChecklistItemProps) {
  const [lessonExpanded, setLessonExpanded] = useState(false);

  // Animation values
  const translateX = useSharedValue(0);
  const checkmarkScale = useSharedValue(isCompleted ? 1 : 0);
  const itemScale = useSharedValue(1);

  // Update checkmark animation when completion state changes
  React.useEffect(() => {
    checkmarkScale.value = withSpring(isCompleted ? 1 : 0, IOS_ANIMATIONS.spring.bouncy);
  }, [isCompleted]);

  const handleToggleLesson = useCallback(() => {
    triggerHaptic('selection');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLessonExpanded((prev) => !prev);
  }, []);

  const handleToggleComplete = useCallback(() => {
    triggerHaptic(isCompleted ? 'selection' : 'notificationSuccess');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleComplete();
  }, [onToggleComplete, isCompleted]);

  const handleSwipeComplete = useCallback(() => {
    triggerHaptic('notificationSuccess');
    onToggleComplete();
  }, [onToggleComplete]);

  // Swipe gesture using new Gesture API
  const panGesture = Gesture.Pan()
    .activeOffsetX(10)
    .onUpdate((event) => {
      'worklet';
      // Only allow right swipe (positive x)
      if (event.translationX > 0) {
        translateX.value = Math.min(event.translationX, SWIPE_THRESHOLD + 20);
      }
    })
    .onEnd((event) => {
      'worklet';
      if (event.translationX > SWIPE_THRESHOLD && !isCompleted) {
        // Complete the item
        runOnJS(handleSwipeComplete)();
      }
      translateX.value = withSpring(0, IOS_ANIMATIONS.spring.snappy);
    });

  const hasLesson = !!item.lesson;
  const hasTool = !!item.toolId || !!item.toolType;

  // Animated styles
  const animatedRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const swipeRevealStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity: progress,
      transform: [{ scale: interpolate(progress, [0, 1], [0.8, 1]) }],
    };
  });

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
    opacity: checkmarkScale.value,
  }));

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - checkmarkScale.value * 0.2 }],
    opacity: 1 - checkmarkScale.value,
  }));

  const itemAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: itemScale.value }],
  }));

  return (
    <View style={styles.wrapper}>
      {/* Swipe reveal area (green check background) */}
      <Animated.View style={[styles.swipeReveal, swipeRevealStyle]}>
        <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedRowStyle}>
          <AnimatedPressable
            style={[
              styles.container,
              isCompleted && styles.containerCompleted,
              !isLast && styles.containerWithSeparator,
              itemAnimatedStyle,
            ]}
            onPressIn={() => {
              itemScale.value = withSpring(0.98, IOS_ANIMATIONS.spring.stiff);
            }}
            onPressOut={() => {
              itemScale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
            }}
          >
            {/* Main Row: Checkbox + Content + Actions */}
            <View style={styles.mainRow}>
              {/* Animated Checkbox */}
              <Pressable
                style={styles.checkbox}
                onPress={handleToggleComplete}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isCompleted }}
                accessibilityLabel={`Mark ${item.label} as ${isCompleted ? 'incomplete' : 'complete'}`}
              >
                {/* Circle outline (unchecked) */}
                <Animated.View style={[styles.checkmarkBase, circleStyle]}>
                  <Ionicons
                    name="ellipse-outline"
                    size={24}
                    color={IOS_COLORS.systemGray3}
                  />
                </Animated.View>
                {/* Checkmark filled (checked) */}
                <Animated.View style={[styles.checkmarkBase, styles.checkmarkOverlay, checkmarkStyle]}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={IOS_COLORS.systemGreen}
                  />
                </Animated.View>
              </Pressable>

              {/* Content - clean iOS HIG layout */}
              <Pressable
                style={styles.content}
                onPress={hasTool ? () => {
                  triggerHaptic('impactLight');
                  onOpenTool();
                } : undefined}
                disabled={!hasTool}
              >
                <Text
                  style={[styles.label, isCompleted && styles.labelCompleted]}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
                {item.description && (
                  <Text style={styles.description} numberOfLines={1}>
                    {item.description}
                  </Text>
                )}
                {/* Inline document status badge */}
                {documentStatus && (
                  <View style={styles.statusBadge}>
                    {documentStatus === 'uploaded' && (
                      <>
                        <FileCheck2 size={12} color={IOS_COLORS.systemGreen} />
                        <Text style={[styles.statusText, { color: IOS_COLORS.systemGreen }]}>Ready</Text>
                      </>
                    )}
                    {documentStatus === 'missing' && (
                      <>
                        <FileWarning size={12} color={IOS_COLORS.systemOrange} />
                        <Text style={[styles.statusText, { color: IOS_COLORS.systemOrange }]}>Upload needed</Text>
                      </>
                    )}
                    {documentStatus === 'extracting' && (
                      <>
                        <Loader2 size={12} color={IOS_COLORS.systemBlue} />
                        <Text style={[styles.statusText, { color: IOS_COLORS.systemBlue }]}>Processing...</Text>
                      </>
                    )}
                  </View>
                )}
              </Pressable>

              {/* Minimal trailing accessories - iOS HIG style */}
              <View style={styles.trailingAccessories}>
                {/* Lesson Toggle - only show if has lesson */}
                {hasLesson && (
                  <Pressable
                    style={[
                      styles.lessonButton,
                      lessonExpanded && styles.lessonButtonActive,
                    ]}
                    onPress={handleToggleLesson}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`${lessonExpanded ? 'Hide' : 'Show'} lesson`}
                  >
                    <BookOpen
                      size={14}
                      color={lessonExpanded ? '#FFFFFF' : IOS_COLORS.systemPurple}
                    />
                  </Pressable>
                )}

                {/* Single chevron - tapping row opens tool */}
                {hasTool && (
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={IOS_COLORS.systemGray3}
                  />
                )}
              </View>
            </View>

            {/* Lesson Panel */}
            {hasLesson && item.lesson && (
              <LessonPanel
                lesson={item.lesson}
                expanded={lessonExpanded}
                onToggle={handleToggleLesson}
              />
            )}
          </AnimatedPressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  swipeReveal: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SWIPE_THRESHOLD + 20,
    backgroundColor: IOS_COLORS.systemGreen,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: IOS_SPACING.lg,
  },
  container: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
  },
  containerCompleted: {
    backgroundColor: `${IOS_COLORS.systemGreen}08`,
  },
  containerWithSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: IOS_SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkmarkBase: {
    position: 'absolute',
  },
  checkmarkOverlay: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.label,
    lineHeight: 22,
  },
  labelCompleted: {
    color: IOS_COLORS.secondaryLabel,
    textDecorationLine: 'line-through',
    textDecorationColor: IOS_COLORS.systemGray3,
  },
  description: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
    lineHeight: 18,
  },
  trailingAccessories: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
    marginLeft: IOS_SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  lessonButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: `${IOS_COLORS.systemPurple}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonButtonActive: {
    backgroundColor: IOS_COLORS.systemPurple,
  },
});

export default EducationalChecklistItem;
