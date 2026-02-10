/**
 * EducationalChecklistSheet - Modal sheet for educational checklists
 *
 * Displays checklist items with their educational content,
 * allowing users to toggle items individually and learn from
 * the embedded lessons.
 *
 * Used for Performance Review and Learning Capture sections.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { X, Check, ChevronDown, ChevronUp, BookOpen, Target, Lightbulb } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { triggerHaptic } from '@/lib/haptics';
import type { EducationalChecklistItem } from '@/types/checklists';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// iOS System Colors
const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  background: '#FFFFFF',
  groupedBackground: '#F2F2F7',
};

export interface EducationalChecklistSheetProps {
  /** Whether the sheet is visible */
  isOpen: boolean;
  /** Callback to close the sheet */
  onClose: () => void;
  /** Title for the sheet */
  title: string;
  /** Subtitle/description for the sheet */
  subtitle?: string;
  /** Icon color theme */
  accentColor?: string;
  /** The checklist items to display */
  items: EducationalChecklistItem[];
  /** Function to check if an item is completed */
  isItemCompleted: (itemId: string) => boolean;
  /** Function to toggle an item's completion */
  toggleItem: (itemId: string) => void;
  /** Count of completed items */
  completedCount: number;
  /** Total count of items */
  totalCount: number;
}

interface ChecklistItemRowProps {
  item: EducationalChecklistItem;
  isCompleted: boolean;
  onToggle: () => void;
  accentColor: string;
}

function ChecklistItemRow({ item, isCompleted, onToggle, accentColor }: ChecklistItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handleToggle = () => {
    triggerHaptic('impactLight');
    onToggle();
  };

  const handleExpand = () => {
    triggerHaptic('selection');
    setIsExpanded(!isExpanded);
  };

  return (
    <AnimatedPressable
      style={[styles.itemContainer, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Main row */}
      <View style={styles.itemRow}>
        {/* Checkbox */}
        <TouchableOpacity
          style={[
            styles.checkbox,
            isCompleted && { backgroundColor: accentColor, borderColor: accentColor },
          ]}
          onPress={handleToggle}
          activeOpacity={0.7}
        >
          {isCompleted && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </TouchableOpacity>

        {/* Content */}
        <TouchableOpacity
          style={styles.itemContent}
          onPress={handleExpand}
          activeOpacity={0.7}
        >
          <Text style={[styles.itemLabel, isCompleted && styles.itemLabelCompleted]}>
            {item.label}
          </Text>
          <Text style={styles.itemDescription} numberOfLines={isExpanded ? undefined : 1}>
            {item.description}
          </Text>
        </TouchableOpacity>

        {/* Expand button */}
        {item.lesson && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={handleExpand}
            hitSlop={8}
          >
            {isExpanded ? (
              <ChevronUp size={20} color={COLORS.gray} />
            ) : (
              <ChevronDown size={20} color={COLORS.gray} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Expanded lesson content */}
      {isExpanded && item.lesson && (
        <View style={styles.lessonContainer}>
          {/* Lesson header */}
          <View style={styles.lessonHeader}>
            <BookOpen size={14} color={accentColor} />
            <Text style={[styles.lessonTitle, { color: accentColor }]}>
              {item.lesson.title}
            </Text>
          </View>

          {/* Lesson content */}
          <Text style={styles.lessonContent}>
            {item.lesson.content}
          </Text>

          {/* Key points */}
          {item.lesson.keyPoints && item.lesson.keyPoints.length > 0 && (
            <View style={styles.keyPointsContainer}>
              <View style={styles.keyPointsHeader}>
                <Lightbulb size={12} color={COLORS.orange} />
                <Text style={styles.keyPointsTitle}>Key Points</Text>
              </View>
              {item.lesson.keyPoints.map((point, index) => (
                <View key={index} style={styles.keyPointRow}>
                  <View style={[styles.keyPointBullet, { backgroundColor: accentColor }]} />
                  <Text style={styles.keyPointText}>{point}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </AnimatedPressable>
  );
}

export function EducationalChecklistSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  accentColor = COLORS.blue,
  items,
  isItemCompleted,
  toggleItem,
  completedCount,
  totalCount,
}: EducationalChecklistSheetProps) {
  const isAllComplete = completedCount === totalCount && totalCount > 0;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.progressBadge}>
              <Text style={[styles.progressText, isAllComplete && { color: COLORS.green }]}>
                {completedCount}/{totalCount}
              </Text>
              {isAllComplete && <Check size={12} color={COLORS.green} strokeWidth={3} />}
            </View>
          </View>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
            <X size={24} color={COLORS.gray} />
          </Pressable>
        </View>

        {/* Subtitle */}
        {subtitle && (
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        )}

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                  backgroundColor: isAllComplete ? COLORS.green : accentColor,
                },
              ]}
            />
          </View>
        </View>

        {/* Items list */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              isCompleted={isItemCompleted(item.id)}
              onToggle={() => toggleItem(item.id)}
              accentColor={accentColor}
            />
          ))}

          {/* Completion message */}
          {isAllComplete && (
            <View style={styles.completionMessage}>
              <Check size={24} color={COLORS.green} />
              <Text style={styles.completionText}>All items reviewed!</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.groupedBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gray6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
  },
  closeButton: {
    padding: 4,
  },
  subtitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.secondaryLabel,
    lineHeight: 20,
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: COLORS.gray5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  // Item styles
  itemContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.label,
  },
  itemLabelCompleted: {
    color: COLORS.secondaryLabel,
  },
  itemDescription: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    lineHeight: 18,
  },
  expandButton: {
    padding: 4,
  },
  // Lesson styles
  lessonContainer: {
    backgroundColor: COLORS.gray6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray5,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lessonTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  lessonContent: {
    fontSize: 14,
    color: COLORS.secondaryLabel,
    lineHeight: 21,
  },
  keyPointsContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  keyPointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  keyPointsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.orange,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  keyPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  keyPointBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  keyPointText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.label,
    lineHeight: 18,
  },
  // Completion message
  completionMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  completionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.green,
  },
});

export default EducationalChecklistSheet;
