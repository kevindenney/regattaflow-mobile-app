/**
 * MainsailControlsInteractive Component
 *
 * Demonstrates how vang, cunningham, and outhaul affect mainsail shape:
 * - Vang: Leech tension and twist
 * - Cunningham: Luff tension and draft position
 * - Outhaul: Foot depth
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Line, Path, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import Slider from '@react-native-community/slider';

interface MainsailControlsInteractiveProps {
  onComplete?: () => void;
}

const COLORS = {
  mast: '#374151',
  boom: '#4B5563',
  sail: 'rgba(59, 130, 246, 0.15)',
  sailOutline: '#3B82F6',
  vang: '#EF4444',
  cunningham: '#8B5CF6',
  outhaul: '#10B981',
  draft: '#F59E0B',
  text: '#1F2937',
  secondaryText: '#6B7280',
  background: '#FFFFFF',
  cardBg: '#F9FAFB',
};

type ControlType = 'vang' | 'cunningham' | 'outhaul';

export function MainsailControlsInteractive({ onComplete }: MainsailControlsInteractiveProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Control values (0-100 scale)
  const [vang, setVang] = useState(50);
  const [cunningham, setCunningham] = useState(30);
  const [outhaul, setOuthaul] = useState(50);
  const [activeControl, setActiveControl] = useState<ControlType>('vang');

  // Calculate derived sail shape values
  const calculations = useMemo(() => {
    // Leech twist: more vang = less twist
    const leechTwist = 30 - (vang / 100) * 25; // 5-30 degrees

    // Draft position: cunningham moves draft forward
    // 0% cunningham = draft at 50%, 100% = draft at 35%
    const draftPosition = 50 - (cunningham / 100) * 15; // 35-50% from luff

    // Foot depth: outhaul controls fullness at foot
    // 0% outhaul = full (deep), 100% = flat
    const footDepth = 15 - (outhaul / 100) * 10; // 5-15 units

    // Overall power
    const power = (100 - vang * 0.3) * (1 - outhaul / 200) * (1 + (50 - cunningham) / 200);

    // Pointing ability
    const pointing = vang * 0.4 + outhaul * 0.3 + cunningham * 0.2;

    return {
      leechTwist,
      draftPosition,
      footDepth,
      power: Math.min(100, Math.max(0, power)),
      pointing: Math.min(100, Math.max(0, pointing)),
    };
  }, [vang, cunningham, outhaul]);

  // SVG dimensions
  const svgWidth = isMobile ? width - 32 : 350;
  const svgHeight = 300;

  // Sail geometry
  const mastBase = { x: 80, y: 270 };
  const mastTop = { x: 80, y: 40 };
  const boomEnd = { x: 280, y: 260 };

  // Calculate sail shape with controls applied
  const getSailPath = () => {
    const { leechTwist, draftPosition, footDepth } = calculations;

    // Luff (leading edge along mast) - cunningham affects tension/shape here
    const luffCurve = cunningham > 50 ? -3 : 3; // Negative = tighter/flatter

    // Foot (bottom edge along boom) - outhaul affects depth
    const footMidX = (mastBase.x + boomEnd.x) / 2;
    const footMidY = mastBase.y - footDepth;

    // Leech (trailing edge) - vang affects twist
    const leechMidY = (mastTop.y + boomEnd.y) / 2;
    const leechMidX = boomEnd.x + 10 - leechTwist * 0.5;

    // Head twist point (top of leech twists off with less vang)
    const headX = mastTop.x + 30 + leechTwist * 1.5;
    const headY = mastTop.y + 10;

    return `
      M ${mastTop.x} ${mastTop.y}
      Q ${mastTop.x + luffCurve} ${(mastTop.y + mastBase.y) / 2} ${mastBase.x} ${mastBase.y}
      Q ${footMidX} ${footMidY} ${boomEnd.x} ${boomEnd.y}
      Q ${leechMidX} ${leechMidY} ${headX} ${headY}
      L ${mastTop.x} ${mastTop.y}
    `;
  };

  // Draft stripe position
  const getDraftStripe = () => {
    const { draftPosition } = calculations;
    const stripeX = mastBase.x + (boomEnd.x - mastBase.x) * (draftPosition / 100);
    return {
      x1: stripeX - 10,
      y1: mastTop.y + 50,
      x2: stripeX + 20,
      y2: mastBase.y - 30,
    };
  };

  const draftStripe = getDraftStripe();

  // Control info
  const controlInfo: Record<ControlType, { name: string; color: string; description: string; effect: string }> = {
    vang: {
      name: 'Vang (Kicker)',
      color: COLORS.vang,
      description: 'Controls boom height and leech tension',
      effect: 'More = tighter leech, less twist. Less = more twist, depowers top of sail.',
    },
    cunningham: {
      name: 'Cunningham',
      color: COLORS.cunningham,
      description: 'Tensions the luff, moves draft forward',
      effect: 'More = draft forward, flatter entry. Use in heavy air to depower.',
    },
    outhaul: {
      name: 'Outhaul',
      color: COLORS.outhaul,
      description: 'Controls foot depth along the boom',
      effect: 'More = flat foot, better pointing. Less = full foot, more power.',
    },
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="options-outline" size={24} color={COLORS.text} />
        <Text style={styles.title}>Mainsail Controls</Text>
      </View>

      <Text style={styles.subtitle}>
        Adjust vang, cunningham, and outhaul to see how they shape the mainsail
      </Text>

      {/* Main visualization */}
      <View style={styles.visualizationContainer}>
        <Svg width={svgWidth} height={svgHeight}>
          <Defs>
            <LinearGradient id="sailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={COLORS.sailOutline} stopOpacity="0.25" />
              <Stop offset="50%" stopColor={COLORS.sailOutline} stopOpacity="0.15" />
              <Stop offset="100%" stopColor={COLORS.sailOutline} stopOpacity="0.05" />
            </LinearGradient>
          </Defs>

          {/* Wind indicator */}
          <G>
            <Line x1={svgWidth - 40} y1={30} x2={svgWidth - 40} y2={70} stroke={COLORS.draft} strokeWidth={2} />
            <Path d={`M ${svgWidth - 45} 35 L ${svgWidth - 40} 25 L ${svgWidth - 35} 35`} fill={COLORS.draft} />
            <SvgText x={svgWidth - 40} y={85} fontSize={10} fill={COLORS.secondaryText} textAnchor="middle">WIND</SvgText>
          </G>

          {/* Sail */}
          <Path d={getSailPath()} fill="url(#sailGrad)" stroke={COLORS.sailOutline} strokeWidth={1.5} />

          {/* Draft stripe indicator */}
          <Line
            x1={draftStripe.x1} y1={draftStripe.y1}
            x2={draftStripe.x2} y2={draftStripe.y2}
            stroke={COLORS.draft}
            strokeWidth={2}
            strokeDasharray="5,3"
          />
          <SvgText
            x={draftStripe.x1 - 5}
            y={draftStripe.y1 - 10}
            fontSize={10}
            fill={COLORS.draft}
            textAnchor="end"
          >
            Draft {calculations.draftPosition.toFixed(0)}%
          </SvgText>

          {/* Mast */}
          <Line
            x1={mastBase.x} y1={mastBase.y}
            x2={mastTop.x} y2={mastTop.y}
            stroke={COLORS.mast}
            strokeWidth={5}
          />

          {/* Boom */}
          <Line
            x1={mastBase.x} y1={mastBase.y - 5}
            x2={boomEnd.x} y2={boomEnd.y}
            stroke={COLORS.boom}
            strokeWidth={4}
          />

          {/* Vang line */}
          <Line
            x1={mastBase.x + 30} y1={mastBase.y + 5}
            x2={mastBase.x + 60} y2={boomEnd.y - 10}
            stroke={COLORS.vang}
            strokeWidth={activeControl === 'vang' ? 3 : 2}
            opacity={activeControl === 'vang' ? 1 : 0.5}
          />

          {/* Cunningham indicator (at tack) */}
          <Circle
            cx={mastBase.x}
            cy={mastBase.y - 15}
            r={activeControl === 'cunningham' ? 8 : 5}
            fill={COLORS.cunningham}
            opacity={activeControl === 'cunningham' ? 1 : 0.5}
          />

          {/* Outhaul indicator (at clew) */}
          <Circle
            cx={boomEnd.x - 5}
            cy={boomEnd.y - 5}
            r={activeControl === 'outhaul' ? 8 : 5}
            fill={COLORS.outhaul}
            opacity={activeControl === 'outhaul' ? 1 : 0.5}
          />

          {/* Twist indicator arc */}
          <Path
            d={`M ${mastTop.x + 30} ${mastTop.y + 10} A 25 25 0 0 1 ${mastTop.x + 30 + calculations.leechTwist * 1.2} ${mastTop.y + 25}`}
            stroke={COLORS.vang}
            strokeWidth={1.5}
            fill="none"
            opacity={0.7}
          />
          <SvgText
            x={mastTop.x + 55}
            y={mastTop.y + 5}
            fontSize={10}
            fill={COLORS.vang}
          >
            Twist {calculations.leechTwist.toFixed(0)}°
          </SvgText>

          {/* Foot depth indicator */}
          <Line
            x1={(mastBase.x + boomEnd.x) / 2}
            y1={mastBase.y}
            x2={(mastBase.x + boomEnd.x) / 2}
            y2={mastBase.y - calculations.footDepth}
            stroke={COLORS.outhaul}
            strokeWidth={1.5}
            strokeDasharray="3,2"
          />
        </Svg>
      </View>

      {/* Control selector tabs */}
      <View style={styles.tabContainer}>
        {(['vang', 'cunningham', 'outhaul'] as ControlType[]).map((control) => (
          <TouchableOpacity
            key={control}
            style={[
              styles.tab,
              activeControl === control && { backgroundColor: controlInfo[control].color + '20', borderColor: controlInfo[control].color },
            ]}
            onPress={() => setActiveControl(control)}
          >
            <View style={[styles.tabDot, { backgroundColor: controlInfo[control].color }]} />
            <Text style={[styles.tabText, activeControl === control && { color: controlInfo[control].color }]}>
              {control.charAt(0).toUpperCase() + control.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active control info */}
      <View style={[styles.controlInfo, { borderLeftColor: controlInfo[activeControl].color }]}>
        <Text style={styles.controlName}>{controlInfo[activeControl].name}</Text>
        <Text style={styles.controlDescription}>{controlInfo[activeControl].description}</Text>
        <Text style={styles.controlEffect}>{controlInfo[activeControl].effect}</Text>
      </View>

      {/* Sliders */}
      <View style={styles.controlsContainer}>
        <View style={styles.sliderRow}>
          <View style={styles.sliderHeader}>
            <View style={[styles.sliderDot, { backgroundColor: COLORS.vang }]} />
            <Text style={styles.sliderLabel}>Vang</Text>
            <Text style={styles.sliderValue}>{vang.toFixed(0)}%</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            value={vang}
            onValueChange={setVang}
            onSlidingStart={() => setActiveControl('vang')}
            minimumTrackTintColor={COLORS.vang}
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor={COLORS.vang}
          />
        </View>

        <View style={styles.sliderRow}>
          <View style={styles.sliderHeader}>
            <View style={[styles.sliderDot, { backgroundColor: COLORS.cunningham }]} />
            <Text style={styles.sliderLabel}>Cunningham</Text>
            <Text style={styles.sliderValue}>{cunningham.toFixed(0)}%</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            value={cunningham}
            onValueChange={setCunningham}
            onSlidingStart={() => setActiveControl('cunningham')}
            minimumTrackTintColor={COLORS.cunningham}
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor={COLORS.cunningham}
          />
        </View>

        <View style={styles.sliderRow}>
          <View style={styles.sliderHeader}>
            <View style={[styles.sliderDot, { backgroundColor: COLORS.outhaul }]} />
            <Text style={styles.sliderLabel}>Outhaul</Text>
            <Text style={styles.sliderValue}>{outhaul.toFixed(0)}%</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            value={outhaul}
            onValueChange={setOuthaul}
            onSlidingStart={() => setActiveControl('outhaul')}
            minimumTrackTintColor={COLORS.outhaul}
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor={COLORS.outhaul}
          />
        </View>
      </View>

      {/* Performance metrics */}
      <View style={styles.metricsContainer}>
        <Text style={styles.metricsTitle}>Resulting Sail Shape</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Power</Text>
            <View style={styles.metricBar}>
              <View style={[styles.metricFill, { width: `${calculations.power}%`, backgroundColor: '#F59E0B' }]} />
            </View>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Pointing</Text>
            <View style={styles.metricBar}>
              <View style={[styles.metricFill, { width: `${calculations.pointing}%`, backgroundColor: '#10B981' }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Quick tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Quick Reference</Text>
        <View style={styles.tipRow}>
          <Text style={styles.tipCondition}>Light air:</Text>
          <Text style={styles.tipAction}>Vang off, Cunningham off, Outhaul eased</Text>
        </View>
        <View style={styles.tipRow}>
          <Text style={styles.tipCondition}>Medium:</Text>
          <Text style={styles.tipAction}>Moderate all controls for balance</Text>
        </View>
        <View style={styles.tipRow}>
          <Text style={styles.tipCondition}>Heavy air:</Text>
          <Text style={styles.tipAction}>Vang on, Cunningham on, Outhaul tight</Text>
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
    marginBottom: 16,
  },
  visualizationContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: COLORS.cardBg,
  },
  tabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryText,
  },
  controlInfo: {
    backgroundColor: COLORS.cardBg,
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  controlName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  controlDescription: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginBottom: 6,
  },
  controlEffect: {
    fontSize: 12,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  controlsContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sliderRow: {
    marginBottom: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sliderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sliderLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
    width: 40,
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    height: 36,
  },
  metricsContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  metricsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  metricsGrid: {
    gap: 10,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricLabel: {
    fontSize: 13,
    color: COLORS.secondaryText,
    width: 60,
  },
  metricBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  metricFill: {
    height: '100%',
    borderRadius: 5,
  },
  tipsContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  tipCondition: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    width: 70,
  },
  tipAction: {
    flex: 1,
    fontSize: 12,
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

export default MainsailControlsInteractive;
