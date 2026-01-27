/**
 * StartLineAnalyzerWizard
 *
 * Analyzes start line position and bias based on wind direction.
 * Shows map with positioned start line and calculates favored end.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Navigation,
  Check,
  Wind,
  Flag,
  AlertCircle,
  ArrowUp,
  Ship,
  CircleDot,
} from 'lucide-react-native';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray2: '#636366',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
};

// Wind direction presets
const WIND_DIRECTIONS = [
  { label: 'N', degrees: 0 },
  { label: 'NE', degrees: 45 },
  { label: 'E', degrees: 90 },
  { label: 'SE', degrees: 135 },
  { label: 'S', degrees: 180 },
  { label: 'SW', degrees: 225 },
  { label: 'W', degrees: 270 },
  { label: 'NW', degrees: 315 },
];

interface StartLineAnalyzerWizardProps extends ChecklistToolProps {
  /** Wind direction from weather data */
  initialWindDirection?: number;
  /** Start line bearing (perpendicular to course) */
  lineBearing?: number;
}

export function StartLineAnalyzerWizard({
  item,
  regattaId,
  onComplete,
  onCancel,
  initialWindDirection,
  lineBearing = 270, // Default: line runs E-W
}: StartLineAnalyzerWizardProps) {
  const [windDirection, setWindDirection] = useState(initialWindDirection || 180);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    WIND_DIRECTIONS.find((d) => d.degrees === initialWindDirection)?.label || 'S'
  );

  // Helper function for recommendations - must be defined before useMemo that uses it
  const getRecommendation = useCallback((bias: number, level: string) => {
    if (level === 'none') {
      return 'Line is relatively square. Start where you want to go on the first beat.';
    }
    if (level === 'slight') {
      return bias > 0
        ? 'Slight pin-end advantage. Consider pin start if it aligns with your strategy.'
        : 'Slight boat-end advantage. Consider RC boat start for clean air.';
    }
    if (level === 'moderate') {
      return bias > 0
        ? 'Pin end is moderately favored. Expect crowding at the pin.'
        : 'Boat end is moderately favored. Good option for clean start.';
    }
    return bias > 0
      ? 'Strong pin-end bias! Starting at the pin gives significant advantage, but expect heavy traffic.'
      : 'Strong boat-end bias! RC boat start gives significant advantage.';
  }, []);

  // Calculate line bias
  const lineAnalysis = useMemo(() => {
    // Line is perpendicular to first beat
    // Perfect line: wind is perpendicular to line
    const perfectWind = (lineBearing + 90) % 360;

    // Calculate bias angle
    let biasAngle = windDirection - perfectWind;
    if (biasAngle > 180) biasAngle -= 360;
    if (biasAngle < -180) biasAngle += 360;

    // Positive bias = port end favored
    // Negative bias = starboard end favored
    const biasDirection = biasAngle > 0 ? 'Port (Pin)' : biasAngle < 0 ? 'Starboard (RC)' : 'Square';
    const biasStrength = Math.abs(biasAngle);

    let biasLevel: 'none' | 'slight' | 'moderate' | 'significant';
    if (biasStrength < 3) biasLevel = 'none';
    else if (biasStrength < 8) biasLevel = 'slight';
    else if (biasStrength < 15) biasLevel = 'moderate';
    else biasLevel = 'significant';

    return {
      biasAngle: Math.round(biasAngle),
      biasDirection,
      biasLevel,
      biasStrength: Math.round(biasStrength),
      favoredEnd: biasAngle > 2 ? 'pin' : biasAngle < -2 ? 'boat' : 'either',
      recommendation: getRecommendation(biasAngle, biasLevel),
    };
  }, [windDirection, lineBearing, getRecommendation]);

  const handlePresetSelect = useCallback((preset: typeof WIND_DIRECTIONS[0]) => {
    setSelectedPreset(preset.label);
    setWindDirection(preset.degrees);
  }, []);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.closeButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={IOS_COLORS.gray} />
        </Pressable>
        <Text style={styles.headerTitle}>Start Line Analysis</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentInner}
      >
        {/* Icon Header */}
        <View style={styles.iconHeader}>
          <View style={styles.iconCircle}>
            <Navigation size={32} color={IOS_COLORS.blue} />
          </View>
          <Text style={styles.title}>Line Bias Calculator</Text>
          <Text style={styles.subtitle}>
            Determine which end of the start line is favored
          </Text>
        </View>

        {/* Wind Direction Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wind Direction</Text>
          <View style={styles.windSelector}>
            {WIND_DIRECTIONS.map((dir) => (
              <Pressable
                key={dir.label}
                style={[
                  styles.windButton,
                  selectedPreset === dir.label && styles.windButtonSelected,
                ]}
                onPress={() => handlePresetSelect(dir)}
              >
                <Text
                  style={[
                    styles.windButtonText,
                    selectedPreset === dir.label && styles.windButtonTextSelected,
                  ]}
                >
                  {dir.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.windDisplay}>
            <Wind size={20} color={IOS_COLORS.blue} />
            <Text style={styles.windDisplayText}>
              {windDirection}° ({selectedPreset})
            </Text>
          </View>
        </View>

        {/* Visual Line Diagram */}
        <View style={styles.diagramSection}>
          <Text style={styles.sectionTitle}>Start Line Diagram</Text>
          <View style={styles.diagram}>
            {/* Wind Arrow */}
            <View style={[styles.windArrow, { transform: [{ rotate: `${windDirection}deg` }] }]}>
              <ArrowUp size={24} color={IOS_COLORS.blue} />
            </View>
            <Text style={styles.windLabel}>WIND</Text>

            {/* Start Line */}
            <View style={styles.startLine}>
              {/* Pin End */}
              <View style={[
                styles.lineEnd,
                lineAnalysis.favoredEnd === 'pin' && styles.lineEndFavored,
              ]}>
                <CircleDot
                  size={20}
                  color={lineAnalysis.favoredEnd === 'pin' ? IOS_COLORS.green : IOS_COLORS.orange}
                />
                <Text style={styles.lineEndLabel}>PIN</Text>
              </View>

              {/* Line */}
              <View style={styles.lineBar} />

              {/* RC Boat End */}
              <View style={[
                styles.lineEnd,
                lineAnalysis.favoredEnd === 'boat' && styles.lineEndFavored,
              ]}>
                <Ship
                  size={20}
                  color={lineAnalysis.favoredEnd === 'boat' ? IOS_COLORS.green : IOS_COLORS.blue}
                />
                <Text style={styles.lineEndLabel}>RC</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Analysis Result */}
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Flag size={20} color={getBiasColor(lineAnalysis.biasLevel)} />
            <Text style={[styles.resultTitle, { color: getBiasColor(lineAnalysis.biasLevel) }]}>
              {lineAnalysis.biasDirection} {lineAnalysis.biasLevel !== 'none' && 'Favored'}
            </Text>
          </View>

          <View style={styles.resultStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{lineAnalysis.biasStrength}°</Text>
              <Text style={styles.statLabel}>Bias Angle</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{lineAnalysis.biasLevel}</Text>
              <Text style={styles.statLabel}>Severity</Text>
            </View>
          </View>

          <View style={styles.recommendationBox}>
            <AlertCircle size={16} color={IOS_COLORS.blue} />
            <Text style={styles.recommendationText}>
              {lineAnalysis.recommendation}
            </Text>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Start Line Tips</Text>
          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Reassess bias as wind shifts before start
            </Text>
          </View>
          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Even favored end has crowding trade-off
            </Text>
          </View>
          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Consider first beat strategy, not just line bias
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <Pressable style={styles.completeButton} onPress={handleComplete}>
          <Check size={20} color="#FFFFFF" />
          <Text style={styles.completeButtonText}>Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function getBiasColor(level: string): string {
  switch (level) {
    case 'none':
      return IOS_COLORS.green;
    case 'slight':
      return IOS_COLORS.blue;
    case 'moderate':
      return IOS_COLORS.orange;
    case 'significant':
      return IOS_COLORS.red;
    default:
      return IOS_COLORS.gray;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  closeButton: {
    padding: 4,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    minWidth: 40,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: 20,
    paddingBottom: 40,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  windSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  windButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
    minWidth: 48,
    alignItems: 'center',
  },
  windButtonSelected: {
    backgroundColor: IOS_COLORS.blue,
    borderColor: IOS_COLORS.blue,
  },
  windButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  windButtonTextSelected: {
    color: '#FFFFFF',
  },
  windDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: `${IOS_COLORS.blue}08`,
    borderRadius: 10,
  },
  windDisplayText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  diagramSection: {
    marginBottom: 24,
  },
  diagram: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
  },
  windArrow: {
    position: 'absolute',
    top: 16,
    left: '50%',
    marginLeft: -12,
  },
  windLabel: {
    position: 'absolute',
    top: 44,
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    textTransform: 'uppercase',
  },
  startLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    width: '100%',
    justifyContent: 'center',
  },
  lineEnd: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 8,
  },
  lineEndFavored: {
    backgroundColor: `${IOS_COLORS.green}15`,
  },
  lineEndLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  lineBar: {
    flex: 1,
    height: 4,
    backgroundColor: IOS_COLORS.orange,
    marginHorizontal: 8,
    maxWidth: 150,
  },
  resultCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: IOS_COLORS.label,
    textTransform: 'capitalize',
  },
  statLabel: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: IOS_COLORS.separator,
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: `${IOS_COLORS.blue}08`,
    borderRadius: 10,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: `${IOS_COLORS.blue}08`,
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.blue,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  bottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.green,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default StartLineAnalyzerWizard;
