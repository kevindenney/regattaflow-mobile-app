/**
 * ShroudTensionSimulator Interactive Component
 *
 * Demonstrates how shroud tension affects:
 * - Forestay sag
 * - Mast bend
 * - Sail shape (entry angle)
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Line, Path, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import Slider from '@react-native-community/slider';

interface ShroudTensionSimulatorProps {
  onComplete?: () => void;
}

// Tufte-inspired color palette
const COLORS = {
  mast: '#374151',
  shroud: '#6B7280',
  forestay: '#3B82F6',
  sail: 'rgba(59, 130, 246, 0.15)',
  sailOutline: '#3B82F6',
  highlight: '#F59E0B',
  text: '#1F2937',
  secondaryText: '#6B7280',
  background: '#FFFFFF',
  cardBg: '#F9FAFB',
};

export function ShroudTensionSimulator({ onComplete }: ShroudTensionSimulatorProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // State for tension controls (0-100 scale)
  const [upperTension, setUpperTension] = useState(50);
  const [lowerTension, setLowerTension] = useState(50);
  const [showLabels, setShowLabels] = useState(true);

  // Calculate derived values based on tension
  const calculations = useMemo(() => {
    // Forestay sag: more upper tension = less sag
    const forestaySag = 15 - (upperTension / 100) * 12; // 3-15 range

    // Mast bend at spreaders: lower tension affects this
    // Negative = windward bend, Positive = leeward bend
    const mastBend = ((50 - lowerTension) / 100) * 8; // -4 to +4 range

    // Sail entry angle: affected by forestay sag
    const entryAngle = 20 + forestaySag * 1.5; // Fuller with more sag

    // Performance characteristics
    const pointing = Math.min(100, upperTension * 0.8 + 20);
    const power = Math.max(0, 100 - upperTension * 0.6);
    const acceleration = power * 0.8 + (50 - Math.abs(50 - lowerTension)) * 0.4;

    return {
      forestaySag,
      mastBend,
      entryAngle,
      pointing,
      power,
      acceleration,
    };
  }, [upperTension, lowerTension]);

  // SVG dimensions
  const svgWidth = isMobile ? width - 32 : 400;
  const svgHeight = 300;
  const centerX = svgWidth / 2;

  // Mast geometry
  const mastTop = 30;
  const mastBottom = 270;
  const mastHeight = mastBottom - mastTop;
  const spreaderHeight = mastTop + mastHeight * 0.4;
  const spreaderWidth = 40;

  // Calculate mast curve based on bend
  const getMastPath = () => {
    const bendOffset = calculations.mastBend * 3;
    const controlY = spreaderHeight;
    return `M ${centerX} ${mastTop} Q ${centerX + bendOffset} ${controlY} ${centerX} ${mastBottom}`;
  };

  // Calculate forestay with sag
  const getForestayPath = () => {
    const sagOffset = calculations.forestaySag;
    const forestayEnd = { x: centerX - 60, y: mastBottom };
    const controlX = centerX - 30 - sagOffset;
    const controlY = (mastTop + mastBottom) / 2;
    return `M ${centerX} ${mastTop} Q ${controlX} ${controlY} ${forestayEnd.x} ${forestayEnd.y}`;
  };

  // Calculate sail shape
  const getSailPath = () => {
    const sagOffset = calculations.forestaySag;
    const depth = 10 + sagOffset * 0.8; // Sail depth increases with forestay sag
    const forestayEnd = { x: centerX - 60, y: mastBottom };

    // Sail follows forestay luff with draft
    return `M ${centerX} ${mastTop}
            Q ${centerX - 30 - sagOffset + depth} ${(mastTop + mastBottom) / 2} ${forestayEnd.x} ${forestayEnd.y}
            L ${centerX} ${mastBottom}
            Z`;
  };

  const getWindIndicator = () => (
    <G>
      <Line x1={20} y1={50} x2={20} y2={100} stroke={COLORS.highlight} strokeWidth={2} />
      <Path d="M 15 55 L 20 45 L 25 55" fill={COLORS.highlight} />
      <SvgText x={20} y={115} fontSize={10} fill={COLORS.secondaryText} textAnchor="middle">WIND</SvgText>
    </G>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="settings-outline" size={24} color={COLORS.text} />
        <Text style={styles.title}>Shroud Tension Simulator</Text>
      </View>

      <Text style={styles.subtitle}>
        Adjust tension to see how it affects forestay sag, mast bend, and sail shape
      </Text>

      {/* Main visualization */}
      <View style={styles.visualizationContainer}>
        <Svg width={svgWidth} height={svgHeight}>
          <Defs>
            <LinearGradient id="sailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={COLORS.sailOutline} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={COLORS.sailOutline} stopOpacity="0.1" />
            </LinearGradient>
          </Defs>

          {/* Wind indicator */}
          {getWindIndicator()}

          {/* Sail shape */}
          <Path d={getSailPath()} fill="url(#sailGrad)" stroke={COLORS.sailOutline} strokeWidth={1} />

          {/* Forestay */}
          <Path
            d={getForestayPath()}
            stroke={COLORS.forestay}
            strokeWidth={2}
            fill="none"
            strokeDasharray={calculations.forestaySag > 8 ? "5,3" : "none"}
          />

          {/* Mast */}
          <Path d={getMastPath()} stroke={COLORS.mast} strokeWidth={4} fill="none" />

          {/* Spreaders */}
          <Line
            x1={centerX - spreaderWidth}
            y1={spreaderHeight}
            x2={centerX + spreaderWidth}
            y2={spreaderHeight}
            stroke={COLORS.mast}
            strokeWidth={3}
          />

          {/* Upper shrouds */}
          <Line
            x1={centerX} y1={mastTop}
            x2={centerX + spreaderWidth + 20} y2={mastBottom}
            stroke={COLORS.shroud}
            strokeWidth={upperTension > 60 ? 2.5 : 1.5}
            opacity={0.5 + upperTension / 200}
          />
          <Line
            x1={centerX} y1={mastTop}
            x2={centerX - spreaderWidth - 20} y2={mastBottom}
            stroke={COLORS.shroud}
            strokeWidth={upperTension > 60 ? 2.5 : 1.5}
            opacity={0.5 + upperTension / 200}
          />

          {/* Lower shrouds (to spreaders) */}
          <Line
            x1={centerX + spreaderWidth} y1={spreaderHeight}
            x2={centerX + spreaderWidth + 10} y2={mastBottom}
            stroke={COLORS.shroud}
            strokeWidth={lowerTension > 60 ? 2 : 1}
            opacity={0.5 + lowerTension / 200}
          />
          <Line
            x1={centerX - spreaderWidth} y1={spreaderHeight}
            x2={centerX - spreaderWidth - 10} y2={mastBottom}
            stroke={COLORS.shroud}
            strokeWidth={lowerTension > 60 ? 2 : 1}
            opacity={0.5 + lowerTension / 200}
          />

          {/* Labels */}
          {showLabels && (
            <G>
              <SvgText x={centerX - 70} y={mastTop + 60} fontSize={11} fill={COLORS.forestay}>
                Forestay sag: {calculations.forestaySag.toFixed(1)}
              </SvgText>
              <SvgText x={centerX + 50} y={spreaderHeight - 10} fontSize={11} fill={COLORS.mast}>
                Bend: {calculations.mastBend > 0 ? '+' : ''}{calculations.mastBend.toFixed(1)}
              </SvgText>
            </G>
          )}

          {/* Masthead and chainplates */}
          <Circle cx={centerX} cy={mastTop} r={4} fill={COLORS.mast} />
          <Circle cx={centerX} cy={mastBottom} r={6} fill={COLORS.mast} />
        </Svg>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Upper Shrouds</Text>
          <View style={styles.sliderWrapper}>
            <Text style={styles.sliderValue}>{upperTension.toFixed(0)}%</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={upperTension}
              onValueChange={setUpperTension}
              minimumTrackTintColor={COLORS.forestay}
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor={COLORS.forestay}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderEndLabel}>Loose</Text>
              <Text style={styles.sliderEndLabel}>Tight</Text>
            </View>
          </View>
        </View>

        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Lower Shrouds</Text>
          <View style={styles.sliderWrapper}>
            <Text style={styles.sliderValue}>{lowerTension.toFixed(0)}%</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={lowerTension}
              onValueChange={setLowerTension}
              minimumTrackTintColor={COLORS.highlight}
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor={COLORS.highlight}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderEndLabel}>Leeward bend</Text>
              <Text style={styles.sliderEndLabel}>Windward</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Performance indicators */}
      <View style={styles.metricsContainer}>
        <Text style={styles.metricsTitle}>Performance Effect</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Pointing</Text>
            <View style={styles.metricBar}>
              <View style={[styles.metricFill, { width: `${calculations.pointing}%`, backgroundColor: '#10B981' }]} />
            </View>
            <Text style={styles.metricValue}>{calculations.pointing.toFixed(0)}%</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Power</Text>
            <View style={styles.metricBar}>
              <View style={[styles.metricFill, { width: `${calculations.power}%`, backgroundColor: '#F59E0B' }]} />
            </View>
            <Text style={styles.metricValue}>{calculations.power.toFixed(0)}%</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Acceleration</Text>
            <View style={styles.metricBar}>
              <View style={[styles.metricFill, { width: `${calculations.acceleration}%`, backgroundColor: '#3B82F6' }]} />
            </View>
            <Text style={styles.metricValue}>{calculations.acceleration.toFixed(0)}%</Text>
          </View>
        </View>
      </View>

      {/* Key insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Key Insights</Text>
        <View style={styles.insightItem}>
          <Ionicons name="arrow-up-circle" size={16} color={COLORS.forestay} />
          <Text style={styles.insightText}>
            <Text style={styles.insightBold}>Upper shrouds</Text> control forestay tension.
            Tighter = less sag = flatter entry = better pointing but less power.
          </Text>
        </View>
        <View style={styles.insightItem}>
          <Ionicons name="swap-horizontal" size={16} color={COLORS.highlight} />
          <Text style={styles.insightText}>
            <Text style={styles.insightBold}>Lower shrouds</Text> control mast bend at spreaders.
            This affects mainsail shape in the middle section.
          </Text>
        </View>
        <View style={styles.insightItem}>
          <Ionicons name="flash" size={16} color="#10B981" />
          <Text style={styles.insightText}>
            <Text style={styles.insightBold}>Light air:</Text> Looser for power.
            <Text style={styles.insightBold}> Heavy air:</Text> Tighter to depower.
          </Text>
        </View>
      </View>

      {/* Toggle labels */}
      <TouchableOpacity style={styles.toggleButton} onPress={() => setShowLabels(!showLabels)}>
        <Ionicons name={showLabels ? "eye" : "eye-off"} size={16} color={COLORS.secondaryText} />
        <Text style={styles.toggleText}>{showLabels ? 'Hide' : 'Show'} measurements</Text>
      </TouchableOpacity>

      {/* Complete button */}
      {onComplete && (
        <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
          <Text style={styles.completeButtonText}>Complete Lesson</Text>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.secondaryText,
    marginBottom: 20,
  },
  visualizationContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  controlsContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sliderRow: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  sliderWrapper: {
    gap: 4,
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderEndLabel: {
    fontSize: 11,
    color: COLORS.secondaryText,
  },
  metricsContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  metricsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  metricsGrid: {
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.secondaryText,
    width: 80,
  },
  metricBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  metricFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    width: 36,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  insightsContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.secondaryText,
    lineHeight: 18,
  },
  insightBold: {
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 20,
  },
  toggleText: {
    fontSize: 13,
    color: COLORS.secondaryText,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ShroudTensionSimulator;
