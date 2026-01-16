/**
 * StrategySectionItem
 * Reusable component for individual strategy sections with:
 * - AI recommendation based on past performance
 * - User notes field with auto-save on blur
 * - Performance badge showing avg rating + trend
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/Colors';
import { IOS_COLORS } from '@/components/cards/constants';
import type { StrategySectionNote, StrategySectionMeta } from '@/types/raceStrategy';
import type { PerformanceTrend } from '@/types/raceLearning';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface StrategySectionItemProps {
  section: StrategySectionMeta;
  data?: StrategySectionNote;
  onUserPlanChange?: (plan: string) => void;
  loading?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function StrategySectionItem({
  section,
  data,
  onUserPlanChange,
  loading = false,
  collapsed = false,
  onToggle,
}: StrategySectionItemProps) {
  const [localPlan, setLocalPlan] = useState(data?.userPlan || '');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const initialPlanRef = useRef(data?.userPlan || '');

  // Sync local state with prop changes
  useEffect(() => {
    if (data?.userPlan !== undefined && data.userPlan !== initialPlanRef.current) {
      setLocalPlan(data.userPlan);
      initialPlanRef.current = data.userPlan;
    }
  }, [data?.userPlan]);

  const handleBlur = useCallback(async () => {
    // Only save if the value has changed
    if (localPlan !== initialPlanRef.current && onUserPlanChange) {
      setIsSaving(true);
      try {
        await onUserPlanChange(localPlan);
        initialPlanRef.current = localPlan;
      } finally {
        setIsSaving(false);
      }
    }
  }, [localPlan, onUserPlanChange, section.id]);

  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle?.();
  }, [onToggle]);

  const getTrendIcon = (trend?: PerformanceTrend) => {
    switch (trend) {
      case 'improving':
        return 'trending-up';
      case 'declining':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getTrendColor = (trend?: PerformanceTrend) => {
    switch (trend) {
      case 'improving':
        return colors.success.default;
      case 'declining':
        return colors.error.default;
      default:
        return colors.text.tertiary;
    }
  };

  const hasPerformance = data?.pastPerformance && data.pastPerformance.sampleCount > 0;
  const hasRecommendation = !!data?.aiRecommendation;
  const defaultTip = section.defaultTip;

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={section.icon as any}
              size={18}
              color={colors.primary.default}
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{section.title}</Text>
            {!collapsed && (
              <Text style={styles.description} numberOfLines={1}>
                {section.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* User Plan Status Badge */}
          {collapsed && (
            localPlan ? (
              <View style={styles.hasPlanBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success.default} />
                <Text style={styles.hasPlanText}>Plan set</Text>
              </View>
            ) : (
              <View style={styles.addPlanBadge}>
                <Ionicons name="add-circle-outline" size={14} color={colors.primary.default} />
                <Text style={styles.addPlanText}>Add plan</Text>
              </View>
            )
          )}

          {/* Performance Badge */}
          {hasPerformance && (
            <View style={styles.performanceBadge}>
              <Text style={styles.performanceRating}>
                {data.pastPerformance!.avgRating.toFixed(1)}
              </Text>
              <Ionicons
                name={getTrendIcon(data.pastPerformance!.trend) as any}
                size={12}
                color={getTrendColor(data.pastPerformance!.trend)}
              />
            </View>
          )}

          {/* Saving Indicator */}
          {isSaving && (
            <View style={styles.savingBadge}>
              <Text style={styles.savingText}>Saving...</Text>
            </View>
          )}

          {/* Expand/Collapse Chevron */}
          <Ionicons
            name={collapsed ? 'chevron-down' : 'chevron-up'}
            size={20}
            color={colors.text.secondary}
          />
        </View>
      </TouchableOpacity>

      {/* Collapsed Preview - Show user plan preview if exists */}
      {collapsed && localPlan && (
        <TouchableOpacity onPress={handleToggle} activeOpacity={0.7}>
          <View style={styles.collapsedPreview}>
            <Ionicons name="document-text-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.collapsedPreviewText} numberOfLines={1}>
              {localPlan}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Expanded Content */}
      {!collapsed && (
        <View style={styles.content}>
          {/* AI Recommendation */}
          <View style={styles.recommendationSection}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="bulb" size={14} color={colors.accent.default} />
              <Text style={styles.recommendationLabel}>
                {hasPerformance
                  ? `Based on ${data.pastPerformance!.sampleCount} races`
                  : 'Tip'}
              </Text>
            </View>
            <Text style={styles.recommendationText}>
              {hasRecommendation ? data.aiRecommendation : defaultTip}
            </Text>
          </View>

          {/* Last Race Note (if available) */}
          {data?.pastPerformance?.lastRaceNote && (
            <View style={styles.lastRaceSection}>
              <Text style={styles.lastRaceLabel}>Last race:</Text>
              <Text style={styles.lastRaceText} numberOfLines={2}>
                {data.pastPerformance.lastRaceNote}
              </Text>
            </View>
          )}

          {/* User Notes Input */}
          <View style={styles.notesSection}>
            <View style={styles.notesHeader}>
              <Ionicons name="pencil" size={14} color={colors.text.secondary} />
              <Text style={styles.notesLabel}>Your plan</Text>
            </View>
            <TextInput
              ref={inputRef}
              style={styles.notesInput}
              placeholder="What's your strategy for this section?"
              placeholderTextColor={colors.text.tertiary}
              value={localPlan}
              onChangeText={setLocalPlan}
              onBlur={handleBlur}
              multiline
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    minHeight: 56,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  description: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  performanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background.default,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  performanceRating: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
  },
  savingBadge: {
    backgroundColor: colors.primary.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  savingText: {
    fontSize: 11,
    color: colors.primary.default,
    fontWeight: '500',
  },
  hasPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hasPlanText: {
    fontSize: 11,
    color: colors.success.default,
    fontWeight: '600',
  },
  addPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addPlanText: {
    fontSize: 11,
    color: colors.primary.default,
    fontWeight: '600',
  },
  collapsedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 0,
  },
  collapsedPreviewText: {
    flex: 1,
    fontSize: 12,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 12,
  },
  recommendationSection: {
    backgroundColor: colors.accent.light,
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.default,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  recommendationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendationText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  lastRaceSection: {
    backgroundColor: colors.background.default,
    borderRadius: 8,
    padding: 10,
  },
  lastRaceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  lastRaceText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  notesSection: {
    backgroundColor: colors.primary.light,
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.default,
    gap: 6,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesInput: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary.default,
    padding: 10,
    fontSize: 14,
    color: colors.text.primary,
    minHeight: 60,
    maxHeight: 120,
  },
});
