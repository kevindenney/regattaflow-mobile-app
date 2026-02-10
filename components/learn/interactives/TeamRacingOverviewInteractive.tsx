/**
 * Team Racing Overview Interactive
 * Walks through an entire team race step by step from pre-start to finish,
 * illustrating how positions, tactics, and combinations evolve.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { runOnJS, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { G, Line, Circle, Rect, Text as SvgText, Path, Defs, Polygon } from 'react-native-svg';
import { RACE_TIMELINE, TEAM_RACING_OVERVIEW, type RaceTimelineStep } from './data/teamRacingOverviewData';
import { TopDownSailboatSVG } from './shared';

const PHASE_COLORS: Record<string, string> = {
  'Pre-Start': '#94A3B8',
  'Start': '#F97316',
  'First Beat': '#3B82F6',
  'Upwind': '#3B82F6',
  'Top Mark': '#8B5CF6',
  'Top Mark 2': '#8B5CF6',
  'Downwind': '#10B981',
  'Bottom Mark': '#F59E0B',
  'Final Beat': '#3B82F6',
  'Finish': '#EF4444',
};

function getPhaseColor(phase: string): string {
  return PHASE_COLORS[phase] ?? '#64748B';
}

interface TeamRacingOverviewInteractiveProps {
  onComplete?: () => void;
}

export function TeamRacingOverviewInteractive({ onComplete }: TeamRacingOverviewInteractiveProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewedSteps, setViewedSteps] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = RACE_TIMELINE.length;
  const step: RaceTimelineStep = RACE_TIMELINE[stepIndex];
  const phaseColor = getPhaseColor(step.phase);

  // Pulse animation for boats
  const pulse = useSharedValue(1);
  useEffect(() => { pulse.value = withRepeat(withTiming(1.15, { duration: 600 }), -1, true); }, [pulse]);
  const [pulseVal, setPulseVal] = useState(1);
  useDerivedValue(() => { runOnJS(setPulseVal)(pulse.value); return null; }, []);

  // Track viewed steps & fire onComplete
  useEffect(() => {
    setViewedSteps((prev) => new Set(prev).add(step.id));
  }, [step.id]);
  useEffect(() => {
    if (viewedSteps.size >= RACE_TIMELINE.length) onComplete?.();
  }, [viewedSteps, onComplete]);

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, totalSteps]);

  const handlePlayPause = useCallback(() => {
    if (stepIndex >= totalSteps - 1) setStepIndex(0);
    setIsPlaying((p) => !p);
  }, [stepIndex, totalSteps]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    setStepIndex((p) => (p > 0 ? p - 1 : totalSteps - 1));
  }, [totalSteps]);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    setStepIndex((p) => (p < totalSteps - 1 ? p + 1 : 0));
  }, [totalSteps]);

  const annStyle = (type: string) => ({
    bg: type === 'action' ? '#DBEAFE' : type === 'warning' ? '#FEF3C7' : '#F1F5F9',
    fg: type === 'action' ? '#1E40AF' : type === 'warning' ? '#92400E' : '#475569',
  });

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Phase badge + step title */}
      <View style={s.card}>
        <View style={s.row}>
          <View style={[s.badge, { backgroundColor: phaseColor + '20' }]}>
            <Text style={[s.badgeText, { color: phaseColor }]}>{step.phase}</Text>
          </View>
        </View>
        <Text style={s.title}>{step.title}</Text>
      </View>

      {/* SVG Canvas */}
      <View style={s.svgWrap}>
        <Svg width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid meet">
          <Defs><Polygon id="wah" points="0,0 5,12 -5,12" fill="#64748B" /></Defs>
          <Rect width="400" height="600" fill="#E0EFFE" />
          {/* Water ripples */}
          {[100, 300, 500].map((y, i) => (
            <Path key={y} d={`M0 ${y} Q100 ${y - 5},200 ${y} T400 ${y}`} stroke="#B4D4F0" strokeWidth="0.8" fill="none" opacity={0.5 - i * 0.1} />
          ))}
          {/* Course boundaries */}
          <Line x1="60" y1="80" x2="60" y2="520" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="6,6" opacity={0.5} />
          <Line x1="340" y1="80" x2="340" y2="520" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="6,6" opacity={0.5} />
          {/* Wind arrow */}
          <Line x1="355" y1="15" x2="355" y2="55" stroke="#64748B" strokeWidth="2" />
          <Polygon points="350,55 355,65 360,55" fill="#64748B" />
          <SvgText x="355" y="12" textAnchor="middle" fontSize="10" fill="#64748B" fontWeight="600">WIND</SvgText>
          {/* Marks */}
          {step.marks.map((m, i) => {
            const markColor = m.type === 'start' ? '#10B981' : '#F97316';
            const markStroke = m.type === 'start' ? '#059669' : '#EA580C';
            const markLabel = m.type === 'windward' ? 'WM' : m.type === 'leeward' ? 'LM' : m.type === 'start' ? 'S' : 'G';
            return (
              <G key={i}>
                <Circle cx={m.x} cy={m.y} r={m.type === 'start' ? 6 : 8} fill={markColor} stroke={markStroke} strokeWidth="2" />
                <SvgText x={m.x + 14} y={m.y + 4} fontSize="9" fill="#94A3B8" fontWeight="500">{markLabel}</SvgText>
              </G>
            );
          })}
          {/* Boats */}
          {step.boats.map((b) => {
            const color = b.team === 'blue' ? '#3B82F6' : '#EF4444';
            const sc = 0.35;
            return (
              <G key={b.id}>
                <Circle cx={b.x} cy={b.y} r={20 * pulseVal} fill="none" stroke={color} strokeWidth="1.5" opacity={0.3} />
                <G transform={`translate(${b.x - 25 * sc}, ${b.y - 40 * sc})`}>
                  <TopDownSailboatSVG hullColor={color} rotation={b.heading} scale={sc} showWake={false} windDirection={step.windDirection} label={b.label} />
                </G>
              </G>
            );
          })}
          {/* Annotations */}
          {step.annotations.map((a, i) => {
            const { bg, fg } = annStyle(a.type);
            return (
              <G key={i}>
                <Rect x={a.x - 2} y={a.y - 10} width={a.text.length * 6.5 + 8} height={16} rx="4" fill={bg} opacity={0.9} />
                <SvgText x={a.x + 2} y={a.y + 1} fontSize="9" fontWeight="600" fill={fg}>{a.text}</SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Combination display */}
      {step.combination && (
        <View style={s.comboRow}>
          <View style={s.comboBlock}>
            <Text style={s.comboLabel}>Blue</Text>
            <Text style={[s.comboPositions, { color: '#3B82F6' }]}>{step.combination.blue.join('-')}</Text>
            <Text style={[s.comboTotal, { color: '#3B82F6' }]}>= {step.combination.blueTotal}</Text>
          </View>
          <View style={s.comboVs}>
            <Text style={s.comboVsText}>vs</Text>
            <View style={[s.comboIndicator, { backgroundColor: step.combination.blueWinning ? '#DCFCE7' : '#FEE2E2' }]}>
              <Ionicons
                name={step.combination.blueWinning ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={step.combination.blueWinning ? '#16A34A' : '#DC2626'}
              />
              <Text style={[s.comboIndicatorText, { color: step.combination.blueWinning ? '#16A34A' : '#DC2626' }]}>
                {step.combination.blueWinning ? 'Blue Winning' : 'Red Winning'}
              </Text>
            </View>
          </View>
          <View style={s.comboBlock}>
            <Text style={s.comboLabel}>Red</Text>
            <Text style={[s.comboPositions, { color: '#EF4444' }]}>{step.combination.red.join('-')}</Text>
            <Text style={[s.comboTotal, { color: '#EF4444' }]}>= {step.combination.redTotal}</Text>
          </View>
        </View>
      )}

      {/* Step description card */}
      <View style={s.card}>
        <Text style={s.desc}>{step.description}</Text>
      </View>

      {/* Key insight card */}
      <View style={s.insightCard}>
        <View style={s.insightHeader}>
          <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
          <Text style={s.insightLabel}>Key Insight</Text>
        </View>
        <Text style={s.insightText}>{step.keyInsight}</Text>
      </View>

      {/* Play/pause controls */}
      <View style={s.controls}>
        <TouchableOpacity onPress={handlePrev} style={s.skipBtn}>
          <Ionicons name="play-skip-back" size={18} color="#475569" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePlayPause} style={[s.playBtn, { backgroundColor: phaseColor }]}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} style={s.skipBtn}>
          <Ionicons name="play-skip-forward" size={18} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* Step dots */}
      <View style={s.dots}>
        {RACE_TIMELINE.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => { setIsPlaying(false); setStepIndex(i); }}
            style={[
              s.dot,
              i === stepIndex && { backgroundColor: phaseColor, transform: [{ scale: 1.3 }] },
              viewedSteps.has(RACE_TIMELINE[i].id) && i !== stepIndex && { backgroundColor: '#94A3B8' },
            ]}
          />
        ))}
      </View>
      <Text style={s.counter}>Step {stepIndex + 1} of {totalSteps}</Text>
    </ScrollView>
  );
}

const shadow = Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' as any } : { elevation: 2 };

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 12, gap: 10, paddingBottom: 32 },
  card: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, gap: 6, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  svgWrap: { width: '100%', aspectRatio: 400 / 600, backgroundColor: '#E0EFFE', borderRadius: 12, overflow: 'hidden', ...shadow },
  comboRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 14, borderRadius: 12, ...shadow },
  comboBlock: { alignItems: 'center', gap: 2, flex: 1 },
  comboLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  comboPositions: { fontSize: 18, fontWeight: '700' },
  comboTotal: { fontSize: 14, fontWeight: '600' },
  comboVs: { alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  comboVsText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  comboIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  comboIndicatorText: { fontSize: 10, fontWeight: '700' },
  desc: { fontSize: 14, color: '#475569', lineHeight: 20 },
  insightCard: { backgroundColor: '#FFFBEB', padding: 14, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: '#FEF3C7', ...shadow },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  insightLabel: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  insightText: { fontSize: 13, color: '#78350F', lineHeight: 19 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  skipBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  playBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' },
  counter: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
});

export default TeamRacingOverviewInteractive;
