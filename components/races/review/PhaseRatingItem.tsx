/**
 * PhaseRatingItem - Structured debrief phase rating component
 *
 * Features:
 * - 5-star rating (1 tap to set)
 * - Expand/collapse for notes
 * - Checkmark when rating is set
 * - Phase-specific icons
 * - Nudge integration (when expanded)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  LayoutAnimation,
} from 'react-native';
import {
  Star,
  ChevronDown,
  ChevronUp,
  Flag,
  Anchor,
  ArrowUp,
  Circle,
  ArrowDown,
  Target,
} from 'lucide-react-native';
import { NudgeList } from '@/components/checklist-tools/NudgeBanner';
import type { PersonalizedNudge } from '@/types/adaptiveLearning';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  yellow: '#FFCC00',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
};

// Phase icons and labels
const PHASE_CONFIG = {
  prestart: {
    icon: Flag,
    label: 'Pre-start',
    color: IOS_COLORS.blue,
  },
  start: {
    icon: Anchor,
    label: 'Start',
    color: IOS_COLORS.green,
  },
  upwind: {
    icon: ArrowUp,
    label: 'Upwind',
    color: IOS_COLORS.orange,
  },
  windwardMark: {
    icon: Circle,
    label: 'Windward Mark',
    color: '#AF52DE', // purple
  },
  downwind: {
    icon: ArrowDown,
    label: 'Downwind',
    color: '#5856D6', // indigo
  },
  leewardMark: {
    icon: Target,
    label: 'Leeward Mark',
    color: '#FF2D55', // pink
  },
};

export type RacePhaseKey = keyof typeof PHASE_CONFIG;

interface PhaseRatingItemProps {
  phase: RacePhaseKey;
  rating?: number;
  note?: string;
  onRatingChange: (rating: number) => void;
  onNoteChange: (note: string) => void;
  nudges?: PersonalizedNudge[];
  onRecordNudgeDelivery?: (nudgeId: string, channel: string) => void;
  disabled?: boolean;
}

/**
 * StarRating - Tappable 5-star rating component
 */
function StarRating({
  rating,
  onRatingChange,
  disabled,
}: {
  rating?: number;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((starValue) => (
        <Pressable
          key={starValue}
          onPress={() => !disabled && onRatingChange(starValue)}
          disabled={disabled}
          style={styles.starButton}
        >
          <Star
            size={22}
            color={rating && starValue <= rating ? IOS_COLORS.yellow : IOS_COLORS.gray3}
            fill={rating && starValue <= rating ? IOS_COLORS.yellow : 'transparent'}
          />
        </Pressable>
      ))}
    </View>
  );
}

export function PhaseRatingItem({
  phase,
  rating,
  note,
  onRatingChange,
  onNoteChange,
  nudges = [],
  onRecordNudgeDelivery,
  disabled = false,
}: PhaseRatingItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = PHASE_CONFIG[phase];
  const PhaseIcon = config.icon;
  const hasRating = rating !== undefined && rating > 0;
  const hasNudges = nudges.length > 0;

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <Pressable style={styles.headerRow} onPress={toggleExpand}>
        {/* Checkbox */}
        <View style={[styles.checkbox, hasRating && styles.checkboxDone]}>
          {hasRating && <Text style={styles.checkmark}>✓</Text>}
        </View>

        {/* Phase Icon */}
        <PhaseIcon size={18} color={hasRating ? config.color : IOS_COLORS.gray3} />

        {/* Phase Label */}
        <Text
          style={[styles.phaseLabel, hasRating && styles.phaseLabelDone]}
          numberOfLines={1}
        >
          {config.label}
        </Text>

        {/* Star Rating */}
        <StarRating rating={rating} onRatingChange={onRatingChange} disabled={disabled} />

        {/* Expand Chevron */}
        <Pressable onPress={toggleExpand} style={styles.chevronButton}>
          {isExpanded ? (
            <ChevronUp size={20} color={IOS_COLORS.gray} />
          ) : (
            <ChevronDown size={20} color={IOS_COLORS.gray} />
          )}
        </Pressable>
      </Pressable>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Note Input */}
          <TextInput
            style={styles.noteInput}
            placeholder={`Notes about ${config.label.toLowerCase()}...`}
            placeholderTextColor={IOS_COLORS.gray3}
            value={note || ''}
            onChangeText={onNoteChange}
            multiline
            numberOfLines={2}
            editable={!disabled}
          />

          {/* Nudges (if any) */}
          {hasNudges && (
            <View style={styles.nudgesContainer}>
              <Text style={styles.nudgesLabel}>Past learnings</Text>
              <NudgeList
                nudges={nudges}
                channel="review"
                onRecordDelivery={onRecordNudgeDelivery}
                maxVisible={2}
                showMatchReasons={false}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: IOS_COLORS.green,
    borderColor: IOS_COLORS.green,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  phaseLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  phaseLabelDone: {
    color: IOS_COLORS.gray,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  starButton: {
    padding: 2,
  },
  chevronButton: {
    padding: 4,
  },
  expandedContent: {
    marginLeft: 30,
    marginTop: 4,
    gap: 12,
  },
  noteInput: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: IOS_COLORS.label,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  nudgesContainer: {
    gap: 6,
  },
  nudgesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default PhaseRatingItem;
