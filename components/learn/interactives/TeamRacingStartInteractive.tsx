/**
 * Team Racing Start Interactive
 * Visualizes coordinated team start strategies with countdown timer,
 * role assignments, step-through animations, and strategy selector.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { runOnJS, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { G, Line, Circle, Rect, Text as SvgText, Path, Defs, Polygon } from 'react-native-svg';
import {
  TEAM_START_STRATEGIES,
  START_OVERVIEW,
  type TeamStartStrategy,
  type StartStep,
} from './data/teamRacingStartData';
import { TopDownSailboatSVG } from './shared';

const DIFF_COLORS: Record<string, { bg: string; fg: string }> = {
  beginner: { bg: '#DCFCE7', fg: '#166534' },
  intermediate: { bg: '#FEF3C7', fg: '#92400E' },
  advanced: { bg: '#FEE2E2', fg: '#991B1B' },
};

interface TeamRacingStartInteractiveProps {
  onComplete?: () => void;
}

export function TeamRacingStartInteractive({ onComplete }: TeamRacingStartInteractiveProps) {
  const [strategyIndex, setStrategyIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [viewedStrategies, setViewedStrategies] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulse animation for active boats
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.15, { duration: 600 }), -1, true);
  }, [pulse]);
  const [pulseVal, setPulseVal] = useState(1);
  useDerivedValue(() => {
    runOnJS(setPulseVal)(pulse.value);
    return null;
  }, []);

  const strategy: TeamStartStrategy = TEAM_START_STRATEGIES[strategyIndex] ?? TEAM_START_STRATEGIES[0];
  const step: StartStep = strategy.steps[stepIndex];
  const totalSteps = strategy.steps.length;
  const timeToStart = step.timeToStart;

  // Track viewed strategies & fire onComplete
  useEffect(() => {
    if (stepIndex === totalSteps - 1) setViewedStrategies((s) => new Set(s).add(strategy.id));
  }, [stepIndex, totalSteps, strategy.id]);
  useEffect(() => {
    if (viewedStrategies.size >= TEAM_START_STRATEGIES.length) onComplete?.();
  }, [viewedStrategies, onComplete]);

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setStepIndex((p) => {
          if (p >= totalSteps - 1) {
            setIsPlaying(false);
            return p;
          }
          return p + 1;
        });
      }, 2500);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalSteps]);

  useEffect(() => {
    setStepIndex(0);
    setIsPlaying(false);
    setShowInfo(false);
  }, [strategyIndex]);

  const handlePlayPause = useCallback(() => {
    if (stepIndex >= totalSteps - 1) setStepIndex(0);
    setIsPlaying((p) => !p);
  }, [stepIndex, totalSteps]);

  const annStyle = (type: string) => ({
    bg: type === 'action' ? '#DBEAFE' : type === 'warning' ? '#FEF3C7' : '#F1F5F9',
    fg: type === 'action' ? '#1E40AF' : type === 'warning' ? '#92400E' : '#475569',
  });

  // Get blue boats for role assignment display
  const blueBoats = useMemo(
    () => step.boats.filter((b) => b.team === 'blue'),
    [step.boats],
  );

  // Match role assignments to current step boats
  const roleMap = useMemo(() => {
    const map: Record<string, { role: string; task: string }> = {};
    for (const ra of strategy.roleAssignments) {
      map[ra.boatId] = { role: ra.role, task: ra.task };
    }
    return map;
  }, [strategy.roleAssignments]);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Strategy selector chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {TEAM_START_STRATEGIES.map((strat, i) => {
          const active = i === strategyIndex;
          const viewed = viewedStrategies.has(strat.id);
          return (
            <TouchableOpacity
              key={strat.id}
              style={[s.filterChip, active && { backgroundColor: '#3B82F6', borderColor: '#3B82F6' }]}
              onPress={() => setStrategyIndex(i)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[s.filterText, active && { color: '#FFF' }]}>{strat.name}</Text>
                {viewed && <Ionicons name="checkmark-circle" size={14} color={active ? '#FFF' : '#10B981'} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Strategy name + description */}
      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.title}>{strategy.name}</Text>
          <View style={[s.diffBadge, { backgroundColor: DIFF_COLORS[strategy.difficulty].bg }]}>
            <Text style={[s.diffText, { color: DIFF_COLORS[strategy.difficulty].fg }]}>
              {strategy.difficulty.charAt(0).toUpperCase() + strategy.difficulty.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={s.desc}>{strategy.description}</Text>
      </View>

      {/* Time-to-start badge */}
      <View style={[s.timeBadge, timeToStart === 0 && { backgroundColor: '#FEE2E2' }]}>
        <Text style={[s.timeNumber, timeToStart === 0 && { color: '#DC2626' }]}>
          {timeToStart}
        </Text>
        <Text style={[s.timeLabel, timeToStart === 0 && { color: '#DC2626' }]}>
          {timeToStart === 0 ? 'START!' : 'seconds to start'}
        </Text>
      </View>

      {/* SVG Canvas */}
      <View style={s.svgWrap}>
        <Svg width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid meet">
          <Defs>
            <Polygon id="start-wa" points="0,0 5,12 -5,12" fill="#64748B" />
          </Defs>
          <Rect width="400" height="600" fill="#E0EFFE" />
          {[100, 300, 500].map((y, i) => (
            <Path
              key={y}
              d={`M0 ${y} Q100 ${y - 5},200 ${y} T400 ${y}`}
              stroke="#B4D4F0"
              strokeWidth="0.8"
              fill="none"
              opacity={0.5 - i * 0.1}
            />
          ))}
          {/* Wind arrow */}
          <Line x1="355" y1="15" x2="355" y2="55" stroke="#64748B" strokeWidth="2" />
          <Polygon points="350,55 355,65 360,55" fill="#64748B" />
          <SvgText x="355" y="12" textAnchor="middle" fontSize="10" fill="#64748B" fontWeight="600">
            WIND
          </SvgText>
          {/* Marks */}
          {step.marks.map((m, i) => {
            const isStart = m.type === 'start';
            return (
              <G key={`mk${i}`}>
                <Circle
                  cx={m.x}
                  cy={m.y}
                  r={isStart ? 6 : 8}
                  fill={isStart ? '#10B981' : '#F97316'}
                  stroke={isStart ? '#059669' : '#EA580C'}
                  strokeWidth="2"
                />
                <SvgText x={m.x + 12} y={m.y + 4} fontSize="9" fill="#94A3B8" fontWeight="500">
                  {m.type === 'windward' ? 'WM' : m.type === 'start' ? '' : 'LM'}
                </SvgText>
              </G>
            );
          })}
          {/* Start line */}
          {step.marks.filter((m) => m.type === 'start').length >= 2 && (
            <Line
              x1={step.marks.filter((m) => m.type === 'start')[0].x}
              y1={step.marks.filter((m) => m.type === 'start')[0].y}
              x2={step.marks.filter((m) => m.type === 'start')[1].x}
              y2={step.marks.filter((m) => m.type === 'start')[1].y}
              stroke="#10B981"
              strokeWidth="2"
              strokeDasharray="8,4"
              opacity={0.6}
            />
          )}
          {/* Boats */}
          {step.boats.map((b) => {
            const color = b.team === 'blue' ? '#3B82F6' : '#EF4444';
            const isBlue = b.team === 'blue';
            const sc = 0.35;
            return (
              <G key={b.id}>
                {isBlue && (
                  <Circle
                    cx={b.x}
                    cy={b.y}
                    r={18 * pulseVal}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    opacity={0.3}
                  />
                )}
                <G transform={`translate(${b.x - 25 * sc}, ${b.y - 40 * sc})`}>
                  <TopDownSailboatSVG
                    hullColor={color}
                    rotation={b.heading}
                    scale={sc}
                    showWake={false}
                    windDirection={step.windDirection}
                    label={b.label}
                  />
                </G>
              </G>
            );
          })}
          {/* Annotations */}
          {step.annotations.map((a, i) => {
            const { bg, fg } = annStyle(a.type);
            return (
              <G key={`ann${i}`}>
                <Rect
                  x={a.x - 2}
                  y={a.y - 10}
                  width={a.text.length * 6.5 + 8}
                  height={16}
                  rx="4"
                  fill={bg}
                  opacity={0.9}
                />
                <SvgText x={a.x + 2} y={a.y + 1} fontSize="9" fontWeight="600" fill={fg}>
                  {a.text}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Step description */}
      <View style={s.card}>
        <Text style={s.sub}>Step {stepIndex + 1} of {totalSteps}</Text>
        <Text style={s.desc}>{step.description}</Text>
      </View>

      {/* Role assignments card */}
      <View style={s.rolesCard}>
        <Text style={s.rolesTitle}>Role Assignments</Text>
        {blueBoats.map((boat) => {
          const assignment = roleMap[boat.id];
          return (
            <View key={boat.id} style={s.roleRow}>
              <View style={s.roleBoatBadge}>
                <Text style={s.roleBoatLabel}>{boat.label}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.roleName}>{assignment?.role ?? boat.role}</Text>
                <Text style={s.roleTask}>{assignment?.task ?? ''}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Controls */}
      <View style={s.controls}>
        <TouchableOpacity onPress={handlePlayPause} style={s.playBtn}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Step dots */}
      <View style={s.dots}>
        {strategy.steps.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              setIsPlaying(false);
              setStepIndex(i);
            }}
            style={[s.dot, i === stepIndex && { backgroundColor: '#3B82F6', transform: [{ scale: 1.3 }] }]}
          />
        ))}
      </View>
      <Text style={s.counter}>
        Strategy {strategyIndex + 1} of {TEAM_START_STRATEGIES.length}
      </Text>

      {/* Expandable: post-start combination + key principles */}
      <TouchableOpacity style={s.toggle} onPress={() => setShowInfo(!showInfo)}>
        <Ionicons name={showInfo ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
        <Text style={s.toggleText}>{showInfo ? 'Hide Details' : 'Show Details'}</Text>
      </TouchableOpacity>
      {showInfo && (
        <View style={s.infoPanel}>
          <View style={{ gap: 4 }}>
            <Text style={s.infoLabel}>Objective</Text>
            <Text style={s.infoText}>{strategy.objective}</Text>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={s.infoLabel}>Post-Start Combination</Text>
            <View style={s.comboBadge}>
              <Ionicons name="trophy-outline" size={14} color="#3B82F6" />
              <Text style={s.comboText}>{strategy.postStartCombination}</Text>
            </View>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={s.infoLabel}>Key Principles</Text>
            {strategy.keyPrinciples.map((p, i) => (
              <View key={i} style={s.principleRow}>
                <Ionicons name="flag-outline" size={13} color="#3B82F6" style={{ marginTop: 2 }} />
                <Text style={s.principleText}>{p}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const shadow = Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' as any } : { elevation: 2 };

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 12, gap: 10, paddingBottom: 32 },
  filterRow: { gap: 8, paddingVertical: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  card: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, gap: 6, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700', color: '#1E293B', flex: 1 },
  sub: { fontSize: 12, color: '#94A3B8' },
  desc: { fontSize: 13, color: '#475569', lineHeight: 19 },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  diffText: { fontSize: 11, fontWeight: '700' },
  timeBadge: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 16,
    ...shadow,
  },
  timeNumber: { fontSize: 32, fontWeight: '800', color: '#1E293B' },
  timeLabel: { fontSize: 12, fontWeight: '500', color: '#64748B', marginTop: -2 },
  svgWrap: {
    width: '100%',
    aspectRatio: 400 / 600,
    backgroundColor: '#E0EFFE',
    borderRadius: 12,
    overflow: 'hidden',
    ...shadow,
  },
  rolesCard: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    ...shadow,
  },
  rolesTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  roleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  roleBoatBadge: {
    width: 32,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBoatLabel: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  roleName: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  roleTask: { fontSize: 12, color: '#64748B', lineHeight: 17 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' },
  counter: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  toggleText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  infoPanel: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, gap: 12, ...shadow },
  infoLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  infoText: { fontSize: 13, color: '#475569', lineHeight: 18 },
  comboBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
  },
  comboText: { flex: 1, fontSize: 13, color: '#1E40AF', fontWeight: '600', lineHeight: 18 },
  principleRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  principleText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 17 },
});

export default TeamRacingStartInteractive;
