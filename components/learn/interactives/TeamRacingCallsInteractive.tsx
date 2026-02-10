/**
 * Team Racing Call Book Interactive Component
 *
 * Teaches World Sailing Call Book scenarios for team racing.
 * Scenarios organized by section (A-F) with step-through
 * explanations and umpire decision reveal.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import Svg, { G, Line, Circle, Rect, Text as SvgText, Defs, Polygon } from 'react-native-svg';
import { TopDownSailboatSVG } from './shared';
import type { CallBookScenario, CallBookSection } from './data/teamRacingCallsData';
import { ALL_CALL_BOOK_SCENARIOS } from './data/teamRacingCallsData';

interface TeamRacingCallsInteractiveProps {
  onComplete?: () => void;
}

const SECTIONS: CallBookSection[] = ['A', 'B', 'C', 'D', 'E', 'F'];
const SEC_COLORS: Record<CallBookSection, string> = {
  A: '#3B82F6', B: '#22C55E', C: '#F97316', D: '#8B5CF6', E: '#14B8A6', F: '#EF4444',
};
const SEC_LABELS: Record<CallBookSection, string> = {
  A: 'Right of Way', B: 'Transitions', C: 'Marks', D: 'Limitations', E: 'Seamanship', F: 'Penalties',
};
const MARK_LABELS: Record<string, string> = { windward: 'WM', leeward: 'LM', gate: 'G', start: 'S' };
const ZONE_R = 50;

function diffBg(d: string) {
  if (d === 'beginner') return '#DCFCE7';
  if (d === 'intermediate') return '#FEF9C3';
  if (d === 'advanced') return '#FEE2E2';
  return '#F1F5F9';
}

export function TeamRacingCallsInteractive({ onComplete }: TeamRacingCallsInteractiveProps) {
  const [activeSection, setActiveSection] = useState<CallBookSection | null>(null);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const decOp = useSharedValue(0);

  const scenarios = useMemo(
    () => (activeSection ? ALL_CALL_BOOK_SCENARIOS.filter((s) => s.section === activeSection) : ALL_CALL_BOOK_SCENARIOS),
    [activeSection],
  );
  const scenario = scenarios[scenarioIdx] as CallBookScenario | undefined;
  const total = scenario?.steps.length ?? 0;
  const step = scenario?.steps[stepIdx];

  const reset = useCallback(() => { setStepIdx(0); setRevealed(false); decOp.value = 0; }, [decOp]);

  const nextStep = useCallback(() => {
    if (!scenario) return;
    if (stepIdx < total - 1) { setStepIdx((p) => p + 1); return; }
    if (!revealed) { setRevealed(true); decOp.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }); }
  }, [scenario, stepIdx, total, revealed, decOp]);

  const prevStep = useCallback(() => {
    if (revealed) { setRevealed(false); decOp.value = 0; return; }
    if (stepIdx > 0) setStepIdx((p) => p - 1);
  }, [stepIdx, revealed, decOp]);

  const nextScenario = useCallback(() => {
    if (scenarioIdx < scenarios.length - 1) { setScenarioIdx((p) => p + 1); reset(); } else { onComplete?.(); }
  }, [scenarioIdx, scenarios.length, onComplete, reset]);

  const prevScenario = useCallback(() => {
    if (scenarioIdx > 0) { setScenarioIdx((p) => p - 1); reset(); }
  }, [scenarioIdx, reset]);

  const toggleSection = useCallback((s: CallBookSection) => {
    setActiveSection((prev) => (prev === s ? null : s));
    setScenarioIdx(0); reset();
  }, [reset]);

  const decAnim = useAnimatedStyle(() => ({
    opacity: decOp.value,
    transform: [{ translateY: withTiming(revealed ? 0 : 12, { duration: 400 }) }],
  }));

  if (!scenario) return <View style={s.root}><Text style={s.empty}>No scenarios found.</Text></View>;

  const secColor = SEC_COLORS[scenario.section];
  const isLast = stepIdx >= total - 1;
  const isLastS = scenarioIdx >= scenarios.length - 1;
  const prevDisabled = stepIdx === 0 && !revealed;

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.row}>
          <Text style={s.title}>Call Book Scenarios</Text>
          <View style={[s.badge, { backgroundColor: secColor }]}>
            <Text style={s.badgeTxt}>{scenario.section}</Text>
          </View>
        </View>
        <Text style={s.counter}>
          Scenario {scenarioIdx + 1}/{scenarios.length} | Step {Math.min(stepIdx + 1, total)}/{total}
        </Text>
      </View>

      {/* Section Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterWrap} contentContainerStyle={s.filterInner}>
        {SECTIONS.map((sec) => {
          const on = activeSection === sec;
          return (
            <TouchableOpacity key={sec} style={[s.chip, { borderColor: SEC_COLORS[sec] }, on && { backgroundColor: SEC_COLORS[sec] }]} onPress={() => toggleSection(sec)} activeOpacity={0.7}>
              <Text style={[s.chipTxt, on && { color: '#FFF' }]}>{sec}: {SEC_LABELS[sec]}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* SVG Canvas */}
      <View style={s.canvas}>
        <Svg width="100%" height={340} viewBox="0 0 400 500" preserveAspectRatio="xMidYMid meet">
          <Defs />
          <Rect x="0" y="0" width="400" height="500" fill="#0C4A6E" rx="8" />
          <Rect x="0" y="0" width="400" height="500" fill="#0369A1" opacity={0.3} rx="8" />
          {/* Wind arrow */}
          <G>
            <Line x1="200" y1="20" x2="200" y2="70" stroke="#FFF" strokeWidth="2" opacity={0.7} />
            <Polygon points="192,70 200,85 208,70" fill="#FFF" opacity={0.7} />
            <SvgText x="200" y="15" textAnchor="middle" fill="#FFF" fontSize="11" fontWeight="600" opacity={0.8}>WIND</SvgText>
          </G>
          {/* Marks */}
          {scenario.marks?.map((mk, i) => {
            const lbl = MARK_LABELS[mk.type] ?? 'M';
            const zone = mk.type === 'windward' || mk.type === 'leeward' || mk.type === 'gate';
            return (
              <G key={`m${i}`}>
                {zone && <Circle cx={mk.x} cy={mk.y} r={ZONE_R} fill="none" stroke="#FFF" strokeWidth="1" strokeDasharray="6,4" opacity={0.35} />}
                <Circle cx={mk.x} cy={mk.y} r={8} fill="#F97316" stroke="#FFF" strokeWidth="1.5" />
                <SvgText x={mk.x} y={mk.y + 4} textAnchor="middle" fill="#FFF" fontSize="8" fontWeight="700">{lbl}</SvgText>
              </G>
            );
          })}
          {/* Collision line */}
          {scenario.boats.length >= 2 && (
            <Line x1={scenario.boats[0].x} y1={scenario.boats[0].y} x2={scenario.boats[1].x} y2={scenario.boats[1].y} stroke="#EF4444" strokeWidth="1.5" strokeDasharray="6,4" opacity={0.5} />
          )}
          {/* Boats */}
          {scenario.boats.map((b) => {
            const hl = step?.highlight.includes(b.id) ?? false;
            const col = b.team === 'blue' ? '#3B82F6' : '#EF4444';
            const row = b.isRightOfWay;
            const hasRow = scenario.boats.some((x) => x.isRightOfWay);
            return (
              <G key={b.id}>
                {row && <Circle cx={b.x} cy={b.y} r={hl ? 32 : 28} fill="#22C55E" opacity={0.2} />}
                {!row && hasRow && <Circle cx={b.x} cy={b.y} r={hl ? 32 : 28} fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="4,3" opacity={0.6} />}
                {hl && <Circle cx={b.x} cy={b.y} r={36} fill="none" stroke="#FACC15" strokeWidth="2" opacity={0.7} />}
                <G transform={`translate(${b.x - 12}, ${b.y - 20})`}>
                  <TopDownSailboatSVG hullColor={col} rotation={b.heading} windDirection={scenario.windDirection} scale={0.5} showWake={false} label={b.label} />
                </G>
                <Rect x={b.x - 14} y={b.y + 18} width={28} height={14} rx={4} fill={col} opacity={0.9} />
                <SvgText x={b.x} y={b.y + 28} textAnchor="middle" fill="#FFF" fontSize="9" fontWeight="700">{b.label}</SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Info Panel */}
      <View style={s.info}>
        <Text style={s.sTitle}>{scenario.title}</Text>
        <Text style={s.sDesc}>{scenario.description}</Text>
        <View style={s.rulesRow}>
          {scenario.rules.map((r) => <View key={r} style={s.rule}><Text style={s.ruleTxt}>{r}</Text></View>)}
          <View style={[s.diff, { backgroundColor: diffBg(scenario.difficulty) }]}>
            <Text style={s.diffTxt}>{scenario.difficulty}</Text>
          </View>
        </View>
        {/* Current step */}
        <View style={s.stepBox}>
          <View style={s.stepHdr}>
            <Ionicons name="footsteps-outline" size={16} color="#3B82F6" />
            <Text style={s.stepLbl}>Step {stepIdx + 1}</Text>
          </View>
          <Text style={s.stepDesc}>{step?.description}</Text>
          <Text style={s.stepOut}>{step?.outcome}</Text>
        </View>
        {/* Umpire decision */}
        {revealed && (
          <Animated.View style={[s.decBox, decAnim]}>
            <View style={s.decHdr}>
              <Ionicons name="hammer-outline" size={18} color="#15803D" />
              <Text style={s.decHdrTxt}>Umpire Decision</Text>
            </View>
            <Text style={s.decTxt}>{scenario.umpireDecision}</Text>
          </Animated.View>
        )}
        {/* Key Principle */}
        {revealed && (
          <Animated.View style={[s.prinBox, decAnim]}>
            <Ionicons name="bulb-outline" size={16} color="#0369A1" />
            <Text style={s.prinTxt}>{scenario.keyPrinciple}</Text>
          </Animated.View>
        )}
      </View>

      {/* Step nav */}
      <View style={s.nav}>
        <TouchableOpacity style={[s.btn, prevDisabled && s.dis]} onPress={prevStep} disabled={prevDisabled} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={prevDisabled ? '#94A3B8' : '#1E293B'} />
          <Text style={[s.btnTxt, prevDisabled && s.disTxt]}>Prev Step</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.btnP, revealed && isLast && s.btnG]} onPress={revealed ? nextScenario : nextStep} activeOpacity={0.7}>
          <Text style={s.btnPTxt}>
            {revealed ? (isLastS ? 'Finish' : 'Next Scenario') : isLast ? 'Show Decision' : 'Next Step'}
          </Text>
          <Ionicons name={revealed && isLastS ? 'checkmark-circle' : 'chevron-forward'} size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Scenario nav */}
      <View style={s.sNav}>
        <TouchableOpacity style={[s.sBtn, scenarioIdx === 0 && s.dis]} onPress={prevScenario} disabled={scenarioIdx === 0} activeOpacity={0.7}>
          <Ionicons name="play-back" size={14} color={scenarioIdx === 0 ? '#94A3B8' : '#64748B'} />
          <Text style={[s.sNavTxt, scenarioIdx === 0 && s.disTxt]}>Prev Scenario</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.sBtn, isLastS && s.dis]} onPress={nextScenario} disabled={isLastS} activeOpacity={0.7}>
          <Text style={[s.sNavTxt, isLastS && s.disTxt]}>Next Scenario</Text>
          <Ionicons name="play-forward" size={14} color={isLastS ? '#94A3B8' : '#64748B'} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF' },
  empty: { textAlign: 'center', color: '#64748B', fontSize: 14, marginTop: 60 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  badge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  counter: { fontSize: 12, color: '#64748B', marginTop: 4 },
  filterWrap: { maxHeight: 44, marginBottom: 8 },
  filterInner: { paddingHorizontal: 16, gap: 8, flexDirection: 'row', alignItems: 'center' },
  chip: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5 },
  chipTxt: { fontSize: 12, fontWeight: '600', color: '#475569' },
  canvas: { marginHorizontal: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0C4A6E' },
  info: { paddingHorizontal: 16, paddingTop: 14 },
  sTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  sDesc: { fontSize: 13, color: '#475569', lineHeight: 19, marginBottom: 10 },
  rulesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  rule: { backgroundColor: '#DBEAFE', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  ruleTxt: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  diff: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  diffTxt: { fontSize: 11, fontWeight: '600', color: '#1E293B', textTransform: 'capitalize' },
  stepBox: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#3B82F6' },
  stepHdr: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  stepLbl: { fontSize: 13, fontWeight: '700', color: '#3B82F6' },
  stepDesc: { fontSize: 13, color: '#1E293B', lineHeight: 19, marginBottom: 6 },
  stepOut: { fontSize: 12, color: '#64748B', fontStyle: 'italic', lineHeight: 17 },
  decBox: { backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#22C55E' },
  decHdr: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  decHdrTxt: { fontSize: 14, fontWeight: '700', color: '#15803D' },
  decTxt: { fontSize: 13, color: '#1E293B', lineHeight: 19 },
  prinBox: { backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginBottom: 10, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  prinTxt: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 19, fontWeight: '500' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 6, gap: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#F1F5F9' },
  btnTxt: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  btnP: { flex: 1, backgroundColor: '#3B82F6', justifyContent: 'center' },
  btnG: { backgroundColor: '#22C55E' },
  btnPTxt: { fontSize: 13, fontWeight: '700', color: '#FFF', textAlign: 'center', marginRight: 4 },
  dis: { opacity: 0.4 },
  disTxt: { color: '#94A3B8' },
  sNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 10 },
  sBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10 },
  sNavTxt: { fontSize: 12, color: '#64748B', fontWeight: '500' },
});

export default TeamRacingCallsInteractive;
