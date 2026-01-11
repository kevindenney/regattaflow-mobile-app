/**
 * HelmBalanceInteractive Component
 *
 * Demonstrates how mast rake affects:
 * - Center of Effort (CE) position
 * - Center of Lateral Resistance (CLR) relationship
 * - Weather/lee helm balance
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Line, Path, Circle, Text as SvgText, Polygon, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';
import Slider from '@react-native-community/slider';

interface HelmBalanceInteractiveProps {
  onComplete?: () => void;
}

const COLORS = {
  hull: '#374151',
  mast: '#1F2937',
  sail: 'rgba(59, 130, 246, 0.2)',
  sailOutline: '#3B82F6',
  ce: '#EF4444', // Center of Effort - red
  clr: '#10B981', // Center of Lateral Resistance - green
  rudder: '#6B7280',
  water: '#DBEAFE',
  arrow: '#F59E0B',
  text: '#1F2937',
  secondaryText: '#6B7280',
  background: '#FFFFFF',
  cardBg: '#F9FAFB',
};

export function HelmBalanceInteractive({ onComplete }: HelmBalanceInteractiveProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Mast rake: 0 = vertical, positive = aft rake
  const [mastRake, setMastRake] = useState(50); // 0-100 scale, 50 = neutral
  const [windStrength, setWindStrength] = useState(50);

  // Calculate derived values
  const calculations = useMemo(() => {
    // Convert slider to actual rake angle (degrees)
    const rakeAngle = (mastRake - 50) * 0.1; // -5 to +5 degrees

    // CE moves aft with more rake
    const ceOffset = (mastRake - 50) * 0.3; // Positive = CE moves aft

    // Helm balance: positive = weather helm, negative = lee helm
    // More rake = more weather helm
    const helmBalance = (mastRake - 50) * 2; // -100 to +100 scale

    // Rudder angle needed to compensate (opposite of helm)
    const rudderAngle = -helmBalance * 0.15;

    // Drag from rudder correction
    const rudderDrag = Math.abs(rudderAngle) * 2;

    // Ideal helm is slight weather helm (5-10%)
    const isIdeal = helmBalance >= 5 && helmBalance <= 15;
    const isNeutral = Math.abs(helmBalance) < 5;
    const isWeather = helmBalance > 15;
    const isLee = helmBalance < -5;

    return {
      rakeAngle,
      ceOffset,
      helmBalance,
      rudderAngle,
      rudderDrag,
      isIdeal,
      isNeutral,
      isWeather,
      isLee,
    };
  }, [mastRake, windStrength]);

  // SVG dimensions
  const svgWidth = isMobile ? width - 32 : 400;
  const svgHeight = 280;
  const centerX = svgWidth / 2;
  const waterLine = 180;

  // Boat geometry
  const hullLength = 180;
  const hullStart = centerX - hullLength / 2;
  const hullEnd = centerX + hullLength / 2;

  // Mast position (moves slightly with rake for visualization)
  const mastBase = { x: centerX - 20, y: waterLine - 10 };
  const mastHeight = 120;
  const rakeOffset = calculations.rakeAngle * 3;
  const mastTop = { x: mastBase.x + rakeOffset, y: mastBase.y - mastHeight };

  // CE position (centroid of sail area, affected by rake)
  const ceY = mastBase.y - mastHeight * 0.4;
  const ceX = mastBase.x + calculations.ceOffset + rakeOffset * 0.5;

  // CLR position (fixed on hull centerline, roughly 40% back from bow)
  const clrX = hullStart + hullLength * 0.45;
  const clrY = waterLine + 15;

  // Hull path
  const getHullPath = () => {
    const bowX = hullStart;
    const sternX = hullEnd;
    const bowY = waterLine - 5;
    const sternY = waterLine;
    const keelDepth = 35;

    return `M ${bowX} ${bowY}
            Q ${bowX - 10} ${bowY + 10} ${bowX + 10} ${waterLine + keelDepth}
            L ${sternX - 30} ${waterLine + keelDepth}
            Q ${sternX} ${waterLine + 10} ${sternX} ${sternY}
            L ${bowX} ${bowY}`;
  };

  // Sail shape
  const getSailPath = () => {
    const sailFoot = { x: mastBase.x + 60, y: mastBase.y - 15 };
    const depth = 15 + windStrength * 0.1;

    return `M ${mastTop.x} ${mastTop.y}
            Q ${mastTop.x + depth + 20} ${(mastTop.y + sailFoot.y) / 2} ${sailFoot.x} ${sailFoot.y}
            L ${mastBase.x} ${mastBase.y - 10}
            L ${mastTop.x} ${mastTop.y}`;
  };

  // Rudder
  const rudderPivot = { x: hullEnd - 15, y: waterLine + 5 };
  const rudderLength = 25;
  const rudderAngleRad = (calculations.rudderAngle * Math.PI) / 180;
  const rudderEnd = {
    x: rudderPivot.x - Math.sin(rudderAngleRad) * rudderLength,
    y: rudderPivot.y + Math.cos(rudderAngleRad) * rudderLength,
  };

  // Get helm description
  const getHelmDescription = () => {
    if (calculations.isIdeal) return { text: 'Ideal - Slight Weather Helm', color: '#10B981' };
    if (calculations.isNeutral) return { text: 'Neutral Helm', color: '#3B82F6' };
    if (calculations.isWeather) return { text: 'Heavy Weather Helm', color: '#F59E0B' };
    if (calculations.isLee) return { text: 'Lee Helm (Dangerous)', color: '#EF4444' };
    return { text: 'Weather Helm', color: '#F59E0B' };
  };

  const helmDesc = getHelmDescription();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="compass-outline" size={24} color={COLORS.text} />
        <Text style={styles.title}>Helm Balance & Mast Rake</Text>
      </View>

      <Text style={styles.subtitle}>
        Adjust mast rake to see how it affects the balance between Center of Effort and Center of Lateral Resistance
      </Text>

      {/* Main visualization */}
      <View style={styles.visualizationContainer}>
        <Svg width={svgWidth} height={svgHeight}>
          <Defs>
            <LinearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={COLORS.water} stopOpacity="0.5" />
              <Stop offset="100%" stopColor={COLORS.water} stopOpacity="0.9" />
            </LinearGradient>
          </Defs>

          {/* Water */}
          <Path d={`M 0 ${waterLine} L ${svgWidth} ${waterLine} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`}
            fill="url(#waterGrad)" />

          {/* Water line */}
          <Line x1={0} y1={waterLine} x2={svgWidth} y2={waterLine} stroke="#93C5FD" strokeWidth={2} />

          {/* Hull */}
          <Path d={getHullPath()} fill={COLORS.hull} />

          {/* Rudder */}
          <Line
            x1={rudderPivot.x} y1={rudderPivot.y}
            x2={rudderEnd.x} y2={rudderEnd.y}
            stroke={COLORS.rudder}
            strokeWidth={4}
            strokeLinecap="round"
          />

          {/* Mast */}
          <Line
            x1={mastBase.x} y1={mastBase.y - 10}
            x2={mastTop.x} y2={mastTop.y}
            stroke={COLORS.mast}
            strokeWidth={4}
          />

          {/* Sail */}
          <Path d={getSailPath()} fill={COLORS.sail} stroke={COLORS.sailOutline} strokeWidth={1.5} />

          {/* CE marker */}
          <Circle cx={ceX} cy={ceY} r={8} fill={COLORS.ce} />
          <SvgText x={ceX} y={ceY - 15} fontSize={11} fill={COLORS.ce} textAnchor="middle" fontWeight="600">CE</SvgText>

          {/* CLR marker */}
          <Circle cx={clrX} cy={clrY} r={8} fill={COLORS.clr} />
          <SvgText x={clrX} y={clrY + 25} fontSize={11} fill={COLORS.clr} textAnchor="middle" fontWeight="600">CLR</SvgText>

          {/* Line connecting CE to CLR */}
          <Line
            x1={ceX} y1={ceY}
            x2={clrX} y2={clrY}
            stroke="#9CA3AF"
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          {/* Turning moment arrow */}
          {Math.abs(calculations.helmBalance) > 5 && (
            <G>
              <Path
                d={calculations.helmBalance > 0
                  ? `M ${hullEnd + 20} ${waterLine - 30} A 30 30 0 0 1 ${hullEnd + 20} ${waterLine + 10}`
                  : `M ${hullStart - 20} ${waterLine - 30} A 30 30 0 0 0 ${hullStart - 20} ${waterLine + 10}`
                }
                stroke={COLORS.arrow}
                strokeWidth={2}
                fill="none"
              />
              <SvgText
                x={calculations.helmBalance > 0 ? hullEnd + 35 : hullStart - 35}
                y={waterLine - 10}
                fontSize={10}
                fill={COLORS.arrow}
                textAnchor="middle"
              >
                {calculations.helmBalance > 0 ? 'Weather' : 'Lee'}
              </SvgText>
            </G>
          )}

          {/* Wind indicator */}
          <G>
            <Line x1={30} y1={40} x2={30} y2={80} stroke={COLORS.arrow} strokeWidth={2} />
            <Path d="M 25 45 L 30 35 L 35 45" fill={COLORS.arrow} />
            <SvgText x={30} y={95} fontSize={10} fill={COLORS.secondaryText} textAnchor="middle">WIND</SvgText>
          </G>

          {/* Rake angle indicator */}
          <G>
            {/* Vertical reference line */}
            <Line
              x1={mastBase.x} y1={mastBase.y - 10}
              x2={mastBase.x} y2={mastTop.y}
              stroke="#D1D5DB"
              strokeWidth={1}
              strokeDasharray="3,3"
            />
            {/* Angle arc */}
            {Math.abs(calculations.rakeAngle) > 0.5 && (
              <SvgText
                x={mastBase.x + rakeOffset / 2 + 15}
                y={mastTop.y + 30}
                fontSize={10}
                fill={COLORS.secondaryText}
              >
                {calculations.rakeAngle.toFixed(1)}°
              </SvgText>
            )}
          </G>
        </Svg>
      </View>

      {/* Helm status */}
      <View style={[styles.helmStatus, { backgroundColor: helmDesc.color + '15', borderColor: helmDesc.color }]}>
        <Text style={[styles.helmStatusText, { color: helmDesc.color }]}>{helmDesc.text}</Text>
        <Text style={styles.helmBalanceValue}>
          {calculations.helmBalance > 0 ? '+' : ''}{calculations.helmBalance.toFixed(0)}% helm
        </Text>
      </View>

      {/* Control */}
      <View style={styles.controlsContainer}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Mast Rake</Text>
          <View style={styles.sliderWrapper}>
            <Text style={styles.sliderValue}>{calculations.rakeAngle.toFixed(1)}°</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={mastRake}
              onValueChange={setMastRake}
              minimumTrackTintColor={COLORS.ce}
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor={COLORS.ce}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderEndLabel}>Forward (Lee helm)</Text>
              <Text style={styles.sliderEndLabel}>Aft (Weather helm)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Rudder angle:</Text>
          <Text style={styles.metricValue}>{calculations.rudderAngle.toFixed(1)}°</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Rudder drag:</Text>
          <View style={styles.dragBar}>
            <View style={[styles.dragFill, { width: `${Math.min(calculations.rudderDrag * 10, 100)}%` }]} />
          </View>
        </View>
      </View>

      {/* Key insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Understanding Helm Balance</Text>

        <View style={styles.insightItem}>
          <View style={[styles.insightDot, { backgroundColor: COLORS.ce }]} />
          <Text style={styles.insightText}>
            <Text style={styles.insightBold}>CE (Center of Effort)</Text> is where all sail forces combine.
            More rake moves it aft.
          </Text>
        </View>

        <View style={styles.insightItem}>
          <View style={[styles.insightDot, { backgroundColor: COLORS.clr }]} />
          <Text style={styles.insightText}>
            <Text style={styles.insightBold}>CLR (Center of Lateral Resistance)</Text> is where the hull resists sideways motion.
          </Text>
        </View>

        <View style={styles.insightItem}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.insightText}>
            <Text style={styles.insightBold}>Ideal:</Text> CE slightly aft of CLR creates mild weather helm (5-10%).
            This gives feel and helps you point higher.
          </Text>
        </View>

        <View style={styles.insightItem}>
          <Ionicons name="warning" size={16} color="#EF4444" />
          <Text style={styles.insightText}>
            <Text style={styles.insightBold}>Avoid lee helm!</Text> The boat will bear away in gusts,
            which is dangerous and slow.
          </Text>
        </View>
      </View>

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
    lineHeight: 20,
  },
  visualizationContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  helmStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  helmStatusText: {
    fontSize: 15,
    fontWeight: '600',
  },
  helmBalanceValue: {
    fontSize: 14,
    color: COLORS.secondaryText,
    fontVariant: ['tabular-nums'],
  },
  controlsContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sliderRow: {
    marginBottom: 8,
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
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 13,
    color: COLORS.secondaryText,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  dragBar: {
    width: 100,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  dragFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },
  insightsContainer: {
    backgroundColor: '#F0FDF4',
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
    gap: 10,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  insightDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
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

export default HelmBalanceInteractive;
