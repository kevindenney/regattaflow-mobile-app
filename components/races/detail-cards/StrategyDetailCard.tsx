/**
 * Strategy Detail Card
 * Expandable card showing tactical strategy with:
 * - AI recommendations learned from past post-race analysis
 * - User notes fields for each strategy section
 * - Performance badges showing avg rating + trend
 */

import React, { useCallback, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
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
import { colors } from '@/constants/Colors';
import { useAuth } from '@/providers/AuthProvider';
import { useStrategyRecommendations } from '@/hooks/useStrategyRecommendations';
import { strategicPlanningService } from '@/services/StrategicPlanningService';
import { StrategySectionItem } from '@/components/races/strategy';
import {
  STRATEGY_SECTIONS,
  getSectionsForPhase,
  type StrategyPhase,
  type StrategySectionId,
  type StrategySectionMeta,
  type StrategySectionNote,
} from '@/types/raceStrategy';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface StrategyNote {
  id: string;
  category: 'start' | 'upwind' | 'downwind' | 'mark_rounding' | 'general';
  text: string;
}

interface StrategyDetailCardProps {
  raceId: string;
  primaryStrategy?: string;
  notes?: StrategyNote[];
  aiInsight?: string;
  startPreference?: 'pin' | 'boat' | 'middle';
  laylineApproach?: 'early' | 'late' | 'standard';
  isExpanded?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  onGenerateStrategy?: () => void;
  /** Venue name for venue-specific recommendations */
  venueName?: string;
  /** Wind speed for condition-specific recommendations */
  windSpeed?: number;
}

const PHASE_ORDER: StrategyPhase[] = ['start', 'upwind', 'downwind', 'markRounding', 'finish'];

const PHASE_LABELS: Record<StrategyPhase, string> = {
  start: 'Start Strategy',
  upwind: 'Upwind Strategy',
  downwind: 'Downwind Strategy',
  markRounding: 'Mark Rounding',
  finish: 'Finish Strategy',
};

const PHASE_ICONS: Record<StrategyPhase, string> = {
  start: 'flag-checkered',
  upwind: 'arrow-up-bold',
  downwind: 'arrow-down-bold',
  markRounding: 'rotate-right',
  finish: 'flag-variant',
};

export function StrategyDetailCard({
  raceId,
  primaryStrategy,
  notes,
  aiInsight,
  startPreference,
  laylineApproach,
  isExpanded = false,
  onToggle,
  onPress,
  onGenerateStrategy,
  venueName,
  windSpeed,
}: StrategyDetailCardProps) {
  const { user } = useAuth();
  const rotation = useSharedValue(isExpanded ? 1 : 0);

  // Track collapsed sections within expanded view
  const [collapsedSections, setCollapsedSections] = useState<Set<StrategySectionId>>(new Set());

  // Track user notes locally (for optimistic updates)
  const [localNotes, setLocalNotes] = useState<Partial<Record<StrategySectionId, string>>>({});

  // Fetch recommendations from learning profile
  const {
    sectionData,
    phasePatterns,
    venueInsights,
    conditionsInsights,
    isLoading,
    error,
  } = useStrategyRecommendations(user?.id, {
    venueName,
    windSpeed,
    enabled: isExpanded,
  });

  // Update rotation when isExpanded changes
  React.useEffect(() => {
    rotation.value = withTiming(isExpanded ? 1 : 0, {
      duration: isExpanded ? CARD_EXPAND_DURATION : CARD_COLLAPSE_DURATION,
    });
  }, [isExpanded, rotation]);

  // Animated chevron rotation
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 90])}deg` }],
  }));

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

  const toggleSectionCollapse = useCallback((sectionId: StrategySectionId) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleUserPlanChange = useCallback(async (sectionId: StrategySectionId, plan: string) => {
    // Update local state immediately (optimistic update)
    setLocalNotes((prev) => ({ ...prev, [sectionId]: plan }));

    // Save to backend
    if (user?.id) {
      try {
        await strategicPlanningService.saveSectionNote(raceId, user.id, sectionId, plan);
      } catch (error) {
        console.error(`[StrategyDetailCard] Failed to save note for ${sectionId}:`, error);
      }
    }
  }, [raceId, user?.id]);

  // Merge sectionData with localNotes for display
  const mergedSectionData = useMemo(() => {
    const merged: Partial<Record<StrategySectionId, StrategySectionNote>> = { ...sectionData };

    for (const [sectionId, userPlan] of Object.entries(localNotes)) {
      const id = sectionId as StrategySectionId;
      merged[id] = {
        ...merged[id],
        userPlan,
      };
    }

    return merged;
  }, [sectionData, localNotes]);

  // Determine if we have any meaningful content
  const hasContent = Object.keys(sectionData).length > 0 || primaryStrategy || notes?.length || aiInsight;
  const hasLegacyContent = primaryStrategy || notes?.length || aiInsight || startPreference || laylineApproach;

  // Count sections with performance data for badge
  const sectionsWithData = Object.keys(sectionData).length;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header - Tufte typography-only */}
      <View style={styles.tufteHeader}>
        <Text style={styles.tufteHeaderTitle}>STRATEGY</Text>
        {sectionsWithData > 0 && (
          <Text style={styles.tufteInsightCount}>{sectionsWithData} insights</Text>
        )}
        <Animated.View style={chevronStyle}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={IOS_COLORS.gray} />
        </Animated.View>
      </View>

      {/* Content */}
      {isExpanded ? (
        <View style={styles.expandedContent}>
          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary.default} />
              <Text style={styles.loadingText}>Loading insights from past races...</Text>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={16} color={colors.error.default} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Venue/Conditions Context Banner */}
          {(venueInsights || conditionsInsights) && (
            <View style={styles.contextBanner}>
              {venueInsights && venueInsights.raceCount > 0 && (
                <View style={styles.contextItem}>
                  <Ionicons name="location-outline" size={14} color={colors.primary.default} />
                  <Text style={styles.contextText}>
                    {venueInsights.raceCount} races at this venue
                  </Text>
                </View>
              )}
              {conditionsInsights && conditionsInsights.raceCount > 0 && (
                <View style={styles.contextItem}>
                  <Ionicons name="partly-sunny-outline" size={14} color={colors.primary.default} />
                  <Text style={styles.contextText}>
                    {conditionsInsights.raceCount} races in {conditionsInsights.conditionLabel}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Strategy Sections by Phase - Tufte flat grid */}
          {!isLoading && PHASE_ORDER.map((phase) => {
            const sections = getSectionsForPhase(phase);
            const phasePattern = phasePatterns[phase];

            return (
              <View key={phase} style={styles.phaseSection}>
                {/* Phase Header - Tufte style: label, score, trend text */}
                <View style={styles.tuftePhaseRow}>
                  <Text style={styles.tuftePhaseLabel}>
                    {phase === 'start' ? 'Start' :
                     phase === 'upwind' ? 'Upwind' :
                     phase === 'downwind' ? 'Downwind' :
                     phase === 'markRounding' ? 'Rounding' : 'Finish'}
                  </Text>
                  {phasePattern && (
                    <>
                      <Text style={[
                        styles.tuftePhaseScore,
                        phasePattern.average >= 7 && styles.tuftePhaseScoreHigh
                      ]}>
                        {phasePattern.average.toFixed(1)}
                      </Text>
                      <Text style={styles.tuftePhaseTrend}>
                        {phasePattern.trend === 'improving' ? 'improving' :
                         phasePattern.trend === 'declining' ? 'needs work' : '—'}
                      </Text>
                    </>
                  )}
                  {!phasePattern && (
                    <Text style={styles.tuftePhaseEmpty}>—</Text>
                  )}
                </View>

                {/* Section Items */}
                {sections.map((section) => (
                  <StrategySectionItem
                    key={section.id}
                    section={section}
                    data={mergedSectionData[section.id]}
                    collapsed={collapsedSections.has(section.id)}
                    onToggle={() => toggleSectionCollapse(section.id)}
                    onUserPlanChange={(plan) => handleUserPlanChange(section.id, plan)}
                  />
                ))}
              </View>
            );
          })}

          {/* Legacy AI Insight (if provided via props) */}
          {aiInsight && !isLoading && (
            <View style={styles.legacyAiInsight}>
              <MaterialCommunityIcons name="robot-outline" size={16} color={IOS_COLORS.purple} />
              <Text style={styles.legacyAiInsightText}>{aiInsight}</Text>
            </View>
          )}
        </View>
      ) : (
        /* Collapsed Preview - Tufte flat typography */
        hasLegacyContent ? (
          <View style={styles.tufteCollapsedContent}>
            {primaryStrategy && (
              <Text style={styles.tufteCollapsedStrategy} numberOfLines={2}>
                {primaryStrategy}
              </Text>
            )}
            <Text style={styles.tufteCollapsedMeta}>
              {[
                startPreference && (startPreference === 'pin' ? 'Pin end' : startPreference === 'boat' ? 'Boat end' : 'Middle start'),
                laylineApproach && `${laylineApproach} layline`,
              ].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ) : (
          /* Empty state - minimal */
          <View style={styles.tufteEmptyContent}>
            <Text style={styles.tufteEmptyText}>
              Tap to plan race tactics
            </Text>
          </View>
        )
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
    backgroundColor: `${IOS_COLORS.purple}15`,
    alignItems: 'center',
    justifyContent: 'center',
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
  dataBadge: {
    backgroundColor: colors.accent.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dataBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent.dark,
  },

  // Collapsed content
  collapsedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
    gap: 8,
  },
  collapsedStrategy: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  collapsedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },

  // Expanded content
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
    gap: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.error.light,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.error.default,
  },
  contextBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 10,
    backgroundColor: colors.primary.light,
    borderRadius: 8,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contextText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary.default,
  },

  // Phase sections
  phaseSection: {
    gap: 8,
  },

  // Tufte-style phase row (flat grid, no icons)
  tuftePhaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.gray6,
  },
  tuftePhaseLabel: {
    width: 70,
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  tuftePhaseScore: {
    width: 32,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  tuftePhaseScoreHigh: {
    color: IOS_COLORS.green,
    fontWeight: '700',
  },
  tuftePhaseTrend: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tuftePhaseEmpty: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.gray3,
  },

  // Legacy AI insight
  legacyAiInsight: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: `${IOS_COLORS.purple}15`,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.purple}30`,
  },
  legacyAiInsightText: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.purple,
    fontStyle: 'italic',
    lineHeight: 18,
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${IOS_COLORS.purple}15`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  generateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.purple,
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
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tufteInsightCount: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tufteCollapsedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
    gap: 6,
  },
  tufteCollapsedStrategy: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  tufteCollapsedMeta: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.gray,
  },
  tufteEmptyContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  tufteEmptyText: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },
});
