/**
 * TufteStrategySection - Individual strategy section with inline editing
 *
 * Displays a single strategy topic (e.g., "Line Bias") with:
 * - Title row with optional sparkline for performance trend
 * - Default tip from the strategy metadata
 * - Inline editable user plan with marginalia-style connector
 *
 * Follows Tufte principles:
 * - Typography-driven hierarchy (no icons)
 * - Integrated text and graphics (sparkline inline)
 * - Marginalia-style annotations for user input
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
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

      {/* Default tip */}
      <Text style={styles.tip}>{section.defaultTip}</Text>

      {/* User plan with marginalia-style connector */}
      <View style={styles.planRow}>
        <Text style={styles.planConnector}>└─</Text>
        <Text style={styles.planLabel}>Your plan:</Text>
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
          placeholder="Add your plan..."
          placeholderTextColor={COLORS.tertiaryText}
          multiline={false}
          returnKeyType="done"
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
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  planConnector: {
    fontSize: 14,
    color: COLORS.connector,
    fontWeight: '300',
    marginRight: 4,
  },
  planLabel: {
    fontSize: 14,
    color: COLORS.secondaryText,
    fontWeight: '500',
    marginRight: 8,
  },
  planInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 4,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  planInputEmpty: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputUnderline,
  },
  planInputFocused: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.text,
  },
});

export default TufteStrategySection;
