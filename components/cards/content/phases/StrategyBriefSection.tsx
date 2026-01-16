/**
 * StrategyBriefSection
 *
 * Individual strategy section within the Strategy Brief checklist.
 * Shows checkbox, title, and expandable content with AI suggestion,
 * past performance, and user plan input.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
} from 'lucide-react-native';
import type { StrategyBriefSectionWithState } from '@/hooks/useStrategyBrief';
import type { PerformanceTrend } from '@/types/raceLearning';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
};

interface StrategyBriefSectionProps {
  section: StrategyBriefSectionWithState;
  onToggleComplete: () => void;
  onUpdatePlan: (plan: string) => void;
  isFirst?: boolean;
}

export function StrategyBriefSection({
  section,
  onToggleComplete,
  onUpdatePlan,
  isFirst = false,
}: StrategyBriefSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localPlan, setLocalPlan] = useState(section.userPlan || '');

  // Sync local plan when external changes
  useEffect(() => {
    setLocalPlan(section.userPlan || '');
  }, [section.userPlan]);

  // Handle plan blur - save to database
  const handlePlanBlur = useCallback(() => {
    if (localPlan !== section.userPlan) {
      onUpdatePlan(localPlan);
    }
  }, [localPlan, section.userPlan, onUpdatePlan]);

  // Get trend icon and color
  const getTrendIcon = (trend: PerformanceTrend | undefined) => {
    if (!trend) return null;

    switch (trend) {
      case 'improving':
        return <TrendingUp size={12} color={IOS_COLORS.green} />;
      case 'declining':
        return <TrendingDown size={12} color={IOS_COLORS.red} />;
      case 'stable':
      default:
        return <Minus size={12} color={IOS_COLORS.gray} />;
    }
  };

  const hasPastPerformance = section.pastPerformance && section.pastPerformance.sampleCount > 0;

  return (
    <View style={[styles.container, !isFirst && styles.containerBorder]}>
      {/* Main Row - Checkbox + Title + Expand Button */}
      <View style={styles.mainRow}>
        {/* Checkbox */}
        <Pressable
          onPress={onToggleComplete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {section.isCompleted ? (
            <CheckCircle2 size={22} color={IOS_COLORS.green} />
          ) : (
            <Circle size={22} color={IOS_COLORS.gray3} />
          )}
        </Pressable>

        {/* Title - tap to expand */}
        <Pressable
          style={styles.titleContainer}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text
            style={[
              styles.title,
              section.isCompleted && styles.titleCompleted,
            ]}
            numberOfLines={1}
          >
            {section.title}
          </Text>
          {!isExpanded && (
            <Text style={styles.expandHint}>Tap to expand</Text>
          )}
        </Pressable>

        {/* Expand Button */}
        <Pressable
          style={styles.expandButton}
          onPress={() => setIsExpanded(!isExpanded)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronDown
            size={16}
            color={IOS_COLORS.gray}
            style={[
              styles.expandChevron,
              isExpanded && styles.expandChevronRotated,
            ]}
          />
        </Pressable>
      </View>

      {/* Collapsed Preview - Show user plan preview if exists */}
      {!isExpanded && localPlan && (
        <Pressable
          style={styles.collapsedPreview}
          onPress={() => setIsExpanded(true)}
        >
          <FileText size={12} color={IOS_COLORS.gray} />
          <Text style={styles.collapsedPreviewText} numberOfLines={1}>
            {localPlan}
          </Text>
        </Pressable>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* AI Suggestion */}
          {section.aiRecommendation && (
            <View style={styles.suggestionContainer}>
              <Lightbulb size={14} color={IOS_COLORS.orange} />
              <Text style={styles.suggestionText}>
                {section.aiRecommendation}
              </Text>
            </View>
          )}

          {/* Past Performance */}
          {hasPastPerformance && (
            <View style={styles.performanceContainer}>
              <Text style={styles.performanceText}>
                Avg {section.pastPerformance!.avgRating.toFixed(1)}
              </Text>
              <Text style={styles.performanceDot}>·</Text>
              {getTrendIcon(section.pastPerformance!.trend)}
              <Text style={styles.performanceText}>
                {section.pastPerformance!.trend}
              </Text>
              <Text style={styles.performanceDot}>·</Text>
              <Text style={styles.performanceText}>
                {section.pastPerformance!.sampleCount} races
              </Text>
            </View>
          )}

          {/* User Plan Input */}
          <View style={[styles.planContainer, !localPlan && styles.planContainerEmpty]}>
            <View style={styles.planHeader}>
              <Text style={styles.planConnector}>└─</Text>
              <Text style={[styles.planLabel, !localPlan && styles.planLabelEmpty]}>
                {localPlan ? 'Your plan:' : 'Write your strategy:'}
              </Text>
            </View>
            <View style={[styles.planInputWrapper, !localPlan && styles.planInputWrapperEmpty]}>
              <TextInput
                style={styles.planInput}
                value={localPlan}
                onChangeText={setLocalPlan}
                onBlur={handlePlanBlur}
                placeholder="Tap here to write your race strategy for this item..."
                placeholderTextColor={IOS_COLORS.gray}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  containerBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  expandHint: {
    fontSize: 10,
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
    marginTop: 2,
  },
  titleCompleted: {
    color: IOS_COLORS.gray,
    textDecorationLine: 'line-through',
  },
  expandButton: {
    padding: 4,
  },
  expandChevron: {
    transform: [{ rotate: '-90deg' }],
  },
  expandChevronRotated: {
    transform: [{ rotate: '0deg' }],
  },
  collapsedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 32,
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  collapsedPreviewText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
    flex: 1,
  },
  expandedContent: {
    marginTop: 8,
    marginLeft: 32,
    gap: 8,
  },
  suggestionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: `${IOS_COLORS.orange}12`,
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 2,
    borderLeftColor: IOS_COLORS.orange,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  performanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
  },
  performanceText: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    textTransform: 'capitalize',
  },
  performanceDot: {
    fontSize: 11,
    color: IOS_COLORS.gray,
  },
  planContainer: {
    gap: 6,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  planContainerEmpty: {
    backgroundColor: 'rgba(0, 122, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.15)',
    borderStyle: 'dashed',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planConnector: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: IOS_COLORS.gray,
  },
  planLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  planLabelEmpty: {
    color: IOS_COLORS.blue,
    fontWeight: '600',
  },
  planInputWrapper: {
    flex: 1,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 8,
    padding: 10,
  },
  planInputWrapperEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  planInput: {
    fontSize: 14,
    color: IOS_COLORS.label,
    minHeight: 48,
    textAlignVertical: 'top',
  },
});
