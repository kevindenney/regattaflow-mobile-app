/**
 * TufteStrategySection - Individual strategy section with inline editing
 *
 * Displays a single strategy topic (e.g., "Line Bias") with:
 * - Title row with optional sparkline for performance trend
 * - AI recommendation based on past races (when available)
 * - Default tip fallback when no AI recommendation
 * - Inline editable user plan with marginalia-style connector
 *
 * Follows Tufte principles:
 * - Typography-driven hierarchy (no icons)
 * - Integrated text and graphics (sparkline inline)
 * - Marginalia-style annotations for user input
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { Sparkline } from '@/components/shared/charts/Sparkline';
import type { StrategySectionMeta, StrategySectionNote } from '@/types/raceStrategy';
import type { PerformanceTrend } from '@/types/raceLearning';

// Tufte-inspired colors
const COLORS = {
  text: '#3D3832', // Warm gray for primary text
  secondaryText: '#6B7280', // Secondary gray
  tertiaryText: '#9CA3AF', // Lighter gray for placeholders
  connector: '#C7C7CC', // Light gray for └─ connector
  hairline: '#E5E7EB', // Hairline separator
  trendUp: '#10B981', // Green for improving
  trendDown: '#EF4444', // Red for declining
  trendStable: '#6B7280', // Gray for stable
  inputUnderline: '#D1D5DB', // Underline when empty
};

export interface TufteStrategySectionProps {
  /** Section metadata (title, description, defaultTip) */
  section: StrategySectionMeta;
  /** User's notes and performance data for this section */
  note?: StrategySectionNote;
  /** Callback when user updates their plan */
  onUpdatePlan: (plan: string) => void;
}

/**
 * Get sparkline color based on performance trend
 */
function getTrendColor(trend?: PerformanceTrend): string {
  switch (trend) {
    case 'improving':
      return COLORS.trendUp;
    case 'declining':
      return COLORS.trendDown;
    default:
      return COLORS.trendStable;
  }
}

/**
 * TrendIndicator - Small inline trend arrow/indicator
 */
function TrendIndicator({ trend }: { trend: PerformanceTrend }) {
  const color = getTrendColor(trend);
  const size = 14;

  switch (trend) {
    case 'improving':
      return <TrendingUp size={size} color={color} strokeWidth={2} />;
    case 'declining':
      return <TrendingDown size={size} color={color} strokeWidth={2} />;
    default:
      return <Minus size={size} color={color} strokeWidth={2} />;
  }
}

/**
 * Generate mock sparkline data from performance stats
 * In a real implementation, this would come from actual race history
 */
function generateSparklineData(performance?: { avgRating: number; sampleCount: number }): number[] {
  if (!performance || performance.sampleCount < 2) return [];

  // Generate 6 data points around the average rating
  const base = performance.avgRating;
  const variation = 0.5;
  return [
    base - variation * 0.8,
    base - variation * 0.4,
    base + variation * 0.2,
    base - variation * 0.1,
    base + variation * 0.6,
    base, // Current
  ];
}

export function TufteStrategySection({
  section,
  note,
  onUpdatePlan,
}: TufteStrategySectionProps) {
  const [localPlan, setLocalPlan] = useState(note?.userPlan || '');
  const [isFocused, setIsFocused] = useState(false);

  // Sync local state when saved plan loads asynchronously
  useEffect(() => {
    if (note?.userPlan && !isFocused) {
      setLocalPlan(note.userPlan);
    }
  }, [note?.userPlan, isFocused]);

  const sparklineData = generateSparklineData(note?.pastPerformance);
  const trendColor = getTrendColor(note?.pastPerformance?.trend);
  const hasPerformanceData = sparklineData.length > 0;

  const handleBlur = () => {
    setIsFocused(false);
    if (localPlan !== note?.userPlan) {
      onUpdatePlan(localPlan);
    }
  };

  return (
    <View style={styles.container}>
      {/* Title row with optional sparkline */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{section.title}</Text>
        <View style={styles.titleSpacer} />
        {hasPerformanceData && (
          <View style={styles.sparklineContainer}>
            <Sparkline
              data={sparklineData}
              width={50}
              height={16}
              color={trendColor}
              strokeWidth={1.5}
              highlightMax
            />
          </View>
        )}
      </View>

      {/* AI recommendation or default tip */}
      {note?.aiRecommendation ? (
        <View style={styles.aiRecommendation}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiLabel}>
              Based on {note.pastPerformance?.sampleCount || 'your'} race{(note.pastPerformance?.sampleCount || 0) !== 1 ? 's' : ''}
            </Text>
            {note.pastPerformance?.trend && (
              <TrendIndicator trend={note.pastPerformance.trend} />
            )}
          </View>
          <Text style={styles.aiText}>{note.aiRecommendation}</Text>
        </View>
      ) : (
        <Text style={styles.tip}>{section.defaultTip}</Text>
      )}

      {/* User plan with marginalia-style connector */}
      <View style={[styles.planContainer, !localPlan && styles.planContainerEmpty]}>
        <View style={styles.planRow}>
          <Text style={styles.planConnector}>└─</Text>
          <Text style={[styles.planLabel, !localPlan && styles.planLabelEmpty]}>
            {localPlan ? 'Your plan:' : 'Enter your strategy:'}
          </Text>
        </View>
        <TextInput
          style={[
            styles.planInput,
            !localPlan && styles.planInputEmpty,
            isFocused && styles.planInputFocused,
          ]}
          value={localPlan}
          onChangeText={setLocalPlan}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder="Tap here to write your race plan for this section..."
          placeholderTextColor={COLORS.tertiaryText}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          returnKeyType="done"
          blurOnSubmit
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  titleSpacer: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.hairline,
    marginHorizontal: 12,
  },
  sparklineContainer: {
    paddingLeft: 4,
  },
  tip: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.secondaryText,
    marginBottom: 8,
  },
  aiRecommendation: {
    backgroundColor: 'rgba(139, 92, 246, 0.06)', // Very subtle purple tint
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(139, 92, 246, 0.3)', // Purple accent
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7C3AED', // Purple text
    letterSpacing: 0.3,
  },
  aiText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.text,
  },
  planContainer: {
    marginLeft: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  planContainerEmpty: {
    backgroundColor: 'rgba(59, 130, 246, 0.06)', // Subtle blue tint to draw attention
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    borderStyle: 'dashed',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planConnector: {
    fontSize: 14,
    color: COLORS.connector,
    fontWeight: '300',
    marginRight: 4,
  },
  planLabel: {
    fontSize: 13,
    color: COLORS.secondaryText,
    fontWeight: '500',
  },
  planLabelEmpty: {
    color: '#3B82F6', // Blue to indicate action needed
    fontWeight: '600',
  },
  planInput: {
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 6,
    minHeight: 36,
  },
  planInputEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  planInputFocused: {
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
});

export default TufteStrategySection;
