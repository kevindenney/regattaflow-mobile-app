/**
 * Team Racing Tactics Interactive
 * Visualizes tactical plays (mark traps, dial-ups/downs, pass-backs, screens)
 * with animated boat positions on a windward-leeward course.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { runOnJS, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { G, Line, Circle, Rect, Text as SvgText, Path, Defs, Polygon } from 'react-native-svg';
import { ALL_TACTICAL_PLAYS, type TacticalPlay, type TacticalPlayType } from './data/teamRacingTacticsData';
import { TopDownSailboatSVG } from './shared';

const TYPE_COLORS: Record<TacticalPlayType, string> = {
  'mark-trap': '#F97316', 'slow-up': '#F97316', 'dial-up': '#3B82F6', 'dial-down': '#8B5CF6',
  'pass-back': '#10B981', 'screen': '#14B8A6',
};
const TYPE_LABELS: Record<TacticalPlayType, string> = {
  'mark-trap': 'Mark Trap', 'slow-up': 'Slow-Up', 'dial-up': 'Dial-Up', 'dial-down': 'Dial-Down',
  'pass-back': 'Pass-Back', 'screen': 'Screen',
};
const FILTERS: { label: string; types: TacticalPlayType[] }[] = [
  { label: 'All', types: [] },
  { label: 'Mark Traps', types: ['mark-trap'] },
  { label: 'Dial Plays', types: ['dial-up', 'dial-down'] },
  { label: 'Pass-Backs', types: ['pass-back'] },
  { label: 'Screens', types: ['screen'] },
];

function comboSum(c: string): number { return c.split('-').map(Number).reduce((a, b) => a + b, 0); }

interface TeamRacingTacticsInteractiveProps { onComplete?: () => void; }

export function TeamRacingTacticsInteractive({ onComplete }: TeamRacingTacticsInteractiveProps) {
  const [filterIdx, setFilterIdx] = useState(0);
  const [playIndex, setPlayIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [viewedPlays, setViewedPlays] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulse animation for active boat highlight
  const pulse = useSharedValue(1);
  useEffect(() => { pulse.value = withRepeat(withTiming(1.15, { duration: 600 }), -1, true); }, [pulse]);
  const [pulseVal, setPulseVal] = useState(1);
  useDerivedValue(() => { runOnJS(setPulseVal)(pulse.value); return null; }, []);

  const filteredPlays = useMemo(() => {
    const g = FILTERS[filterIdx];
    return g.types.length === 0 ? ALL_TACTICAL_PLAYS : ALL_TACTICAL_PLAYS.filter((p) => g.types.includes(p.type));
  }, [filterIdx]);

  const play: TacticalPlay = filteredPlays[playIndex] ?? filteredPlays[0];
  const step = play.steps[stepIndex];
  const totalSteps = play.steps.length;
  const beforeSum = comboSum(play.combinationBefore);
  const afterSum = comboSum(play.combinationAfter);
  const isImproving = afterSum < beforeSum;

  // Track viewed plays & fire onComplete
  useEffect(() => {
    if (stepIndex === totalSteps - 1) setViewedPlays((p) => new Set(p).add(play.id));
  }, [stepIndex, totalSteps, play.id]);
  useEffect(() => { if (viewedPlays.size >= ALL_TACTICAL_PLAYS.length) onComplete?.(); }, [viewedPlays, onComplete]);

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setStepIndex((p) => { if (p >= totalSteps - 1) { setIsPlaying(false); return p; } return p + 1; });
      }, 2000);
    } else if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, totalSteps]);

  useEffect(() => { setStepIndex(0); setIsPlaying(false); }, [playIndex]);
  useEffect(() => { setPlayIndex(0); setStepIndex(0); setIsPlaying(false); }, [filterIdx]);

  const handlePlayPause = useCallback(() => {
    if (stepIndex >= totalSteps - 1) setStepIndex(0);
    setIsPlaying((p) => !p);
  }, [stepIndex, totalSteps]);
  const handlePrevPlay = useCallback(() => setPlayIndex((p) => (p > 0 ? p - 1 : filteredPlays.length - 1)), [filteredPlays.length]);
  const handleNextPlay = useCallback(() => setPlayIndex((p) => (p < filteredPlays.length - 1 ? p + 1 : 0)), [filteredPlays.length]);

  const annStyle = (type: string) => ({
    bg: type === 'action' ? '#DBEAFE' : type === 'warning' ? '#FEF3C7' : '#F1F5F9',
    fg: type === 'action' ? '#1E40AF' : type === 'warning' ? '#92400E' : '#475569',
  });

  const diffColors: Record<string, { bg: string; fg: string }> = {
    beginner: { bg: '#DCFCE7', fg: '#166534' },
    intermediate: { bg: '#FEF3C7', fg: '#92400E' },
    advanced: { bg: '#FEE2E2', fg: '#991B1B' },
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {FILTERS.map((g, i) => {
          const active = i === filterIdx;
          const c = g.types.length > 0 ? TYPE_COLORS[g.types[0]] : '#64748B';
          return (
            <TouchableOpacity key={g.label} style={[s.filterChip, active && { backgroundColor: c, borderColor: c }]} onPress={() => setFilterIdx(i)}>
              <Text style={[s.filterText, active && { color: '#FFF' }]}>{g.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Header */}
      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.title}>{play.title}</Text>
          <View style={[s.badge, { backgroundColor: TYPE_COLORS[play.type] + '20' }]}>
            <Text style={[s.badgeText, { color: TYPE_COLORS[play.type] }]}>{TYPE_LABELS[play.type]}</Text>
          </View>
        </View>
        <Text style={s.sub}>Step {stepIndex + 1} of {totalSteps}</Text>
      </View>

      {/* SVG Canvas */}
      <View style={s.svgWrap}>
        <Svg width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid meet">
          <Defs><Polygon id="wah" points="0,0 5,12 -5,12" fill="#64748B" /></Defs>
          <Rect width="400" height="600" fill="#E0EFFE" />
          {[100, 300, 500].map((y, i) => (
            <Path key={y} d={`M0 ${y} Q100 ${y - 5},200 ${y} T400 ${y}`} stroke="#B4D4F0" strokeWidth="0.8" fill="none" opacity={0.5 - i * 0.1} />
          ))}
          <Line x1="60" y1="80" x2="60" y2="520" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="6,6" opacity={0.5} />
          <Line x1="340" y1="80" x2="340" y2="520" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="6,6" opacity={0.5} />
          {/* Wind arrow */}
          <Line x1="355" y1="15" x2="355" y2="55" stroke="#64748B" strokeWidth="2" />
          <Polygon points="350,55 355,65 360,55" fill="#64748B" />
          <SvgText x="355" y="12" textAnchor="middle" fontSize="10" fill="#64748B" fontWeight="600">WIND</SvgText>
          {/* Marks */}
          {step.marks.map((m, i) => (
            <G key={i}>
              <Circle cx={m.x} cy={m.y} r="8" fill="#F97316" stroke="#EA580C" strokeWidth="2" />
              <SvgText x={m.x + 14} y={m.y + 4} fontSize="9" fill="#94A3B8" fontWeight="500">{m.type === 'windward' ? 'WM' : 'LM'}</SvgText>
            </G>
          ))}
          {/* Boats */}
          {step.boats.map((b) => {
            const active = step.activeBoat === b.id;
            const color = b.team === 'blue' ? '#3B82F6' : '#EF4444';
            const sc = 0.35;
            return (
              <G key={b.id}>
                {active && <Circle cx={b.x} cy={b.y} r={20 * pulseVal} fill="none" stroke={color} strokeWidth="2" opacity={0.4} />}
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
      <View style={s.comboRow}>
        <View style={s.comboBlock}>
          <Text style={s.comboLabel}>Before</Text>
          <Text style={s.comboVal}>{play.combinationBefore} = {beforeSum}</Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color={isImproving ? '#10B981' : '#EF4444'} />
        <View style={s.comboBlock}>
          <Text style={s.comboLabel}>After</Text>
          <Text style={[s.comboVal, { color: isImproving ? '#10B981' : '#EF4444' }]}>{play.combinationAfter} = {afterSum}</Text>
        </View>
      </View>

      {/* Step description */}
      <View style={s.card}><Text style={s.desc}>{step.description}</Text></View>

      {/* Play controls */}
      <View style={s.controls}>
        <TouchableOpacity onPress={handlePrevPlay} style={s.skipBtn}><Ionicons name="play-skip-back" size={18} color="#475569" /></TouchableOpacity>
        <TouchableOpacity onPress={handlePlayPause} style={s.playBtn}><Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#FFF" /></TouchableOpacity>
        <TouchableOpacity onPress={handleNextPlay} style={s.skipBtn}><Ionicons name="play-skip-forward" size={18} color="#475569" /></TouchableOpacity>
      </View>

      {/* Step dots */}
      <View style={s.dots}>
        {play.steps.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => { setIsPlaying(false); setStepIndex(i); }}
            style={[s.dot, i === stepIndex && { backgroundColor: TYPE_COLORS[play.type], transform: [{ scale: 1.3 }] }]} />
        ))}
      </View>
      <Text style={s.counter}>Play {playIndex + 1} of {filteredPlays.length}</Text>

      {/* Expandable info panel */}
      <TouchableOpacity style={s.toggle} onPress={() => setShowInfo(!showInfo)}>
        <Ionicons name={showInfo ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
        <Text style={s.toggleText}>{showInfo ? 'Hide Details' : 'Show Details'}</Text>
      </TouchableOpacity>
      {showInfo && (
        <View style={s.infoPanel}>
          <View style={s.row}>
            <Text style={s.infoLabel}>Difficulty</Text>
            <View style={[s.diffBadge, { backgroundColor: diffColors[play.difficulty].bg }]}>
              <Text style={[s.diffText, { color: diffColors[play.difficulty].fg }]}>{play.difficulty.charAt(0).toUpperCase() + play.difficulty.slice(1)}</Text>
            </View>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={s.infoLabel}>Objective</Text>
            <Text style={s.infoText}>{play.objective}</Text>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={s.infoLabel}>Key Rules</Text>
            {play.keyRules.map((r, i) => (
              <View key={i} style={s.ruleRow}>
                <Ionicons name="book-outline" size={13} color="#3B82F6" style={{ marginTop: 2 }} />
                <Text style={s.ruleText}>{r}</Text>
              </View>
            ))}
          </View>
          <View style={s.tipBox}>
            <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
            <Text style={s.tipText}>{play.proTip}</Text>
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
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  card: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, gap: 4, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700', color: '#1E293B', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  sub: { fontSize: 12, color: '#94A3B8' },
  svgWrap: { width: '100%', aspectRatio: 400 / 600, backgroundColor: '#E0EFFE', borderRadius: 12, overflow: 'hidden', ...shadow },
  comboRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: '#FFF', padding: 12, borderRadius: 12, ...shadow },
  comboBlock: { alignItems: 'center', gap: 2 },
  comboLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  comboVal: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  desc: { fontSize: 14, color: '#475569', lineHeight: 20 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  skipBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  playBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' },
  counter: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  toggleText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  infoPanel: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, gap: 12, ...shadow },
  infoLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  infoText: { fontSize: 13, color: '#475569', lineHeight: 18 },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  diffText: { fontSize: 11, fontWeight: '700' },
  ruleRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  ruleText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 17 },
  tipBox: { flexDirection: 'row', gap: 8, backgroundColor: '#FFFBEB', padding: 12, borderRadius: 10, alignItems: 'flex-start' },
  tipText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 },
});

export default TeamRacingTacticsInteractive;
