/**
 * Team Racing Umpire Signals Interactive
 * Teaches umpire flag signals and penalty system in team racing (Appendix D).
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Animated, { useSharedValue, withTiming, withRepeat, withSequence, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { G, Line, Circle, Rect, Text as SvgText, Polygon } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { TopDownSailboatSVG } from './shared';
import {
  UMPIRE_SIGNALS, PENALTY_SCENARIOS, PENALTY_COMPLETIONS,
  type UmpireSignal, type PenaltyScenario,
} from './data/teamRacingUmpireData';

type TabMode = 'signals' | 'scenarios';
interface TeamRacingUmpireSignalsInteractiveProps { onComplete?: () => void }

// ── Flag SVG ─────────────────────────────────────────────────────────────────
function FlagSVG({ colors, size = 60 }: { colors: string[]; size?: number }) {
  const w = size, h = size * 0.67;
  if (colors.length === 0) {
    return (
      <Svg width={w} height={h + 10} viewBox={`0 0 ${w} ${h + 10}`}>
        <Line x1="4" y1="0" x2="4" y2={h + 10} stroke="#64748B" strokeWidth="2" />
        <Rect x="8" y="4" width={w - 12} height={h - 4} fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4,3" />
        <SvgText x={w / 2 + 2} y={h / 2 + 2} fontSize="10" fill="#94A3B8" textAnchor="middle">None</SvgText>
      </Svg>
    );
  }
  if (colors.length === 1) {
    return (
      <Svg width={w} height={h + 10} viewBox={`0 0 ${w} ${h + 10}`}>
        <Line x1="4" y1="0" x2="4" y2={h + 10} stroke="#64748B" strokeWidth="2" />
        <Rect x="8" y="4" width={w - 12} height={h - 4} fill={colors[0]} stroke="#1E293B" strokeWidth="1" rx="1" />
      </Svg>
    );
  }
  return (
    <Svg width={w} height={h + 10} viewBox={`0 0 ${w} ${h + 10}`}>
      <Line x1="4" y1="0" x2="4" y2={h + 10} stroke="#64748B" strokeWidth="2" />
      <Rect x="8" y="4" width={w - 12} height={h - 4} fill={colors[1]} stroke="#1E293B" strokeWidth="1" rx="1" />
      <Polygon points={`8,4 ${w - 4},4 8,${h}`} fill={colors[0]} />
      <Rect x="8" y="4" width={w - 12} height={h - 4} fill="none" stroke="#1E293B" strokeWidth="1" rx="1" />
    </Svg>
  );
}

// ── Animated flag with gentle wave ───────────────────────────────────────────
function AnimatedFlag({ colors, size }: { colors: string[]; size?: number }) {
  const rotation = useSharedValue(0);
  React.useEffect(() => {
    rotation.value = withRepeat(withSequence(withTiming(5, { duration: 800 }), withTiming(-5, { duration: 800 })), -1, true);
  }, [rotation]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  return <Animated.View style={animStyle}><FlagSVG colors={colors} size={size} /></Animated.View>;
}

// ── Signal Card ──────────────────────────────────────────────────────────────
function SignalCard({ signal }: { signal: UmpireSignal }) {
  const soundLabel = signal.sound === 'none' ? 'No sound' : signal.sound === 'one short' ? 'One short blast' : 'One long blast';
  return (
    <View style={s.signalCard}>
      <View style={s.flagContainer}><AnimatedFlag colors={signal.flagColors} /></View>
      <Text style={s.signalName}>{signal.name}</Text>
      <View style={s.signalDetailRow}>
        <Ionicons name="volume-medium-outline" size={14} color="#64748B" />
        <Text style={s.signalDetailText}>{soundLabel}</Text>
      </View>
      <Text style={s.signalMeaning}>{signal.meaning}</Text>
      <View style={s.actionBox}>
        <Text style={s.actionLabel}>Sailor Action</Text>
        <Text style={s.actionText}>{signal.sailorAction}</Text>
      </View>
    </View>
  );
}

// ── Scenario Canvas ──────────────────────────────────────────────────────────
function ScenarioCanvas({ scenario }: { scenario: PenaltyScenario }) {
  const boats = scenario.boats.filter((b) => !b.id.startsWith('mark'));
  const marks = scenario.boats.filter((b) => b.id.startsWith('mark'));
  const sc = (v: number) => (v / 600) * 400;
  return (
    <View style={s.canvasWrapper}>
      <Svg width="100%" height={280} viewBox="0 0 400 400">
        <Rect x="0" y="0" width="400" height="400" fill="#E0F2FE" rx="8" />
        <G>
          <Line x1="200" y1="15" x2="200" y2="55" stroke="#64748B" strokeWidth="2" />
          <Polygon points="192,55 200,70 208,55" fill="#64748B" />
          <SvgText x="200" y="12" fontSize="10" fill="#64748B" textAnchor="middle">WIND</SvgText>
        </G>
        {marks.map((m) => (
          <G key={m.id}>
            <Circle cx={sc(m.x)} cy={sc(m.y)} r="8" fill="#F97316" stroke="#FFF" strokeWidth="2" />
            <SvgText x={sc(m.x)} y={sc(m.y) - 14} fontSize="9" fill="#64748B" textAnchor="middle">{m.label}</SvgText>
          </G>
        ))}
        {boats.length >= 2 && (
          <Circle cx={sc((boats[0].x + boats[1].x) / 2)} cy={sc((boats[0].y + boats[1].y) / 2)}
            r="55" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="6,4" opacity={0.5} />
        )}
        <G>
          <Rect x="30" y="180" width="24" height="12" rx="3" fill="#94A3B8" stroke="#475569" strokeWidth="1" />
          <SvgText x="42" y="176" fontSize="8" fill="#475569" textAnchor="middle">Umpire</SvgText>
        </G>
        {boats.map((boat) => (
          <G key={boat.id} transform={`translate(${sc(boat.x) - 25}, ${sc(boat.y) - 40})`}>
            <TopDownSailboatSVG hullColor={boat.team === 'blue' ? '#3B82F6' : '#EF4444'}
              rotation={boat.heading} windDirection={scenario.windDirection} scale={0.65} showWake={false} />
          </G>
        ))}
        {boats.map((boat) => (
          <SvgText key={`l-${boat.id}`} x={sc(boat.x)} y={sc(boat.y) + 30} fontSize="9"
            fill={boat.team === 'blue' ? '#1D4ED8' : '#B91C1C'} fontWeight="600" textAnchor="middle">
            {boat.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

// ── Scenario Panel ───────────────────────────────────────────────────────────
function ScenarioPanel({ scenario }: { scenario: PenaltyScenario }) {
  const signalData = UMPIRE_SIGNALS.find((sig) => sig.id === scenario.signal);
  const penaltyType = scenario.signal === 'yellow-flag' ? 'scoring' : scenario.signal === 'black-flag' ? 'two-turns' : 'one-turn';
  const completion = PENALTY_COMPLETIONS.find((p) => p.type === penaltyType);
  const showCompletion = completion && scenario.signal !== 'green-white' && scenario.signal !== 'no-flag';
  return (
    <View style={s.scenarioPanel}>
      <Text style={s.scenarioTitle}>{scenario.title}</Text>
      <Text style={s.scenarioDesc}>{scenario.description}</Text>
      <View style={s.violationBox}>
        <Text style={s.violationLabel}>Violation</Text>
        <Text style={s.violationText}>{scenario.violation}</Text>
      </View>
      {scenario.rulesBroken.length > 0 && (
        <View style={s.rulesRow}>
          {scenario.rulesBroken.map((rule, i) => (
            <View key={i} style={s.ruleBadge}><Text style={s.ruleBadgeText}>{rule}</Text></View>
          ))}
        </View>
      )}
      {signalData && (
        <View style={s.signalUsedRow}>
          <Text style={s.signalUsedLabel}>Signal:</Text>
          <FlagSVG colors={signalData.flagColors} size={36} />
          <Text style={s.signalUsedName}>{signalData.name}</Text>
        </View>
      )}
      <View style={s.outcomeBox}>
        <Ionicons name="megaphone-outline" size={16} color="#1E40AF" />
        <Text style={s.outcomeText}>{scenario.outcome}</Text>
      </View>
      {showCompletion && (
        <View style={s.completionBox}>
          <Text style={s.completionTitle}>Penalty Completion ({completion.type})</Text>
          {completion.steps.map((step, i) => (
            <View key={i} style={s.stepRow}>
              <Text style={s.stepNumber}>{i + 1}.</Text>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
          <Text style={s.teamNote}>{completion.teamRacingNote}</Text>
        </View>
      )}
    </View>
  );
}

// ── Quiz builder ─────────────────────────────────────────────────────────────
interface QuizQuestion {
  type: 'signal' | 'scenario'; prompt: string;
  options: string[]; correctIndex: number; flagColors?: string[];
}
function buildQuiz(): QuizQuestion[] {
  const shuffled = [...UMPIRE_SIGNALS].sort(() => Math.random() - 0.5).slice(0, 4);
  const signalQs: QuizQuestion[] = shuffled.map((sig) => {
    const wrong = UMPIRE_SIGNALS.filter((x) => x.id !== sig.id).sort(() => Math.random() - 0.5).slice(0, 3).map((x) => x.meaning.split('.')[0]);
    const correct = sig.meaning.split('.')[0];
    const opts = [...wrong, correct].sort(() => Math.random() - 0.5);
    return { type: 'signal', prompt: `What does the ${sig.name} mean?`, options: opts, correctIndex: opts.indexOf(correct), flagColors: sig.flagColors };
  });
  const correctMap: Record<string, string> = { 'red-flag': 'Red Flag (Penalty)', 'green-white': 'Green & White (No Penalty)', 'black-flag': 'Black Flag (DSQ)', 'yellow-flag': 'Yellow Flag (Scoring Penalty)' };
  const signalOpts = Object.values(correctMap);
  const scenarioQs: QuizQuestion[] = [...PENALTY_SCENARIOS].sort(() => Math.random() - 0.5).slice(0, 3).map((sc) => {
    const correct = correctMap[sc.signal] ?? signalOpts[0];
    const opts = [...signalOpts].sort(() => Math.random() - 0.5);
    return { type: 'scenario', prompt: `${sc.title}: ${sc.violation.split('.')[0]}. What penalty?`, options: opts, correctIndex: opts.indexOf(correct) };
  });
  return [...signalQs, ...scenarioQs];
}

// ── Main Component ───────────────────────────────────────────────────────────
export function TeamRacingUmpireSignalsInteractive({ onComplete }: TeamRacingUmpireSignalsInteractiveProps) {
  const [activeTab, setActiveTab] = useState<TabMode>('signals');
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions] = useState<QuizQuestion[]>(() => buildQuiz());
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const isWeb = Platform.OS === 'web';
  const scenario = PENALTY_SCENARIOS[scenarioIdx];
  const quizQ = quizQuestions[quizIdx];

  const handleQuizAnswer = useCallback((idx: number) => {
    if (quizAnswer !== null) return;
    setQuizAnswer(idx);
    if (idx === quizQ.correctIndex) setQuizScore((v) => v + 1);
  }, [quizAnswer, quizQ]);

  const handleQuizNext = useCallback(() => {
    if (quizIdx < quizQuestions.length - 1) { setQuizIdx((i) => i + 1); setQuizAnswer(null); }
    else { setFinished(true); onComplete?.(); }
  }, [quizIdx, quizQuestions.length, onComplete]);

  if (finished) {
    return (
      <View style={s.container}>
        <View style={s.finishedCard}>
          <Ionicons name="flag" size={56} color="#10B981" />
          <Text style={s.finishedTitle}>Umpire Signals Complete!</Text>
          <Text style={s.finishedScore}>{quizScore}/{quizQuestions.length} ({Math.round((quizScore / quizQuestions.length) * 100)}%)</Text>
          <Text style={s.finishedMsg}>You now understand how umpire decisions work in team racing.</Text>
        </View>
      </View>
    );
  }

  if (quizMode) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.quizHeader}>Quiz: Question {quizIdx + 1} of {quizQuestions.length}</Text>
        {quizQ.flagColors && <View style={s.quizFlagRow}><FlagSVG colors={quizQ.flagColors} size={52} /></View>}
        <Text style={s.quizPrompt}>{quizQ.prompt}</Text>
        <View style={s.optionsContainer}>
          {quizQ.options.map((opt, i) => (
            <TouchableOpacity key={i} disabled={quizAnswer !== null} onPress={() => handleQuizAnswer(i)}
              style={[s.optionBtn, quizAnswer === i && (i === quizQ.correctIndex ? s.correctOpt : s.incorrectOpt), quizAnswer !== null && i === quizQ.correctIndex && s.correctOpt]}>
              <Text style={s.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {quizAnswer !== null && (
          <TouchableOpacity style={s.nextBtn} onPress={handleQuizNext}>
            <Text style={s.nextBtnText}>{quizIdx < quizQuestions.length - 1 ? 'Next Question' : 'Finish'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  const atFirst = scenarioIdx === 0;
  const atLast = scenarioIdx === PENALTY_SCENARIOS.length - 1;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.tabBar}>
        {(['signals', 'scenarios'] as TabMode[]).map((tab) => (
          <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab === 'signals' ? 'Signals' : 'Scenarios'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'signals' && (
        <View style={isWeb ? s.signalGrid : undefined}>
          {UMPIRE_SIGNALS.map((sig) => <SignalCard key={sig.id} signal={sig} />)}
        </View>
      )}

      {activeTab === 'scenarios' && (
        <View style={{ gap: 16 }}>
          <ScenarioCanvas scenario={scenario} />
          <ScenarioPanel scenario={scenario} />
          <View style={s.navRow}>
            <TouchableOpacity style={[s.navBtn, atFirst && s.navBtnDisabled]} disabled={atFirst} onPress={() => setScenarioIdx((i) => i - 1)}>
              <Ionicons name="chevron-back" size={18} color={atFirst ? '#CBD5E1' : '#3B82F6'} />
              <Text style={[s.navBtnText, atFirst && s.navBtnTextDisabled]}>Previous</Text>
            </TouchableOpacity>
            <Text style={s.navCounter}>{scenarioIdx + 1} / {PENALTY_SCENARIOS.length}</Text>
            <TouchableOpacity style={[s.navBtn, atLast && s.navBtnDisabled]} disabled={atLast} onPress={() => setScenarioIdx((i) => i + 1)}>
              <Text style={[s.navBtnText, atLast && s.navBtnTextDisabled]}>Next</Text>
              <Ionicons name="chevron-forward" size={18} color={atLast ? '#CBD5E1' : '#3B82F6'} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={s.quizBtn} onPress={() => setQuizMode(true)}>
        <Ionicons name="school-outline" size={20} color="#FFFFFF" />
        <Text style={s.quizBtnText}>Take the Quiz</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const shadow = Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' as any } : { elevation: 2 };

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#94A3B8' },
  tabTextActive: { color: '#3B82F6' },
  signalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 } as any,
  signalCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, gap: 8, ...(Platform.OS === 'web' ? { width: 'calc(50% - 8px)' as any, ...shadow } : shadow), marginBottom: Platform.OS === 'web' ? 0 : 12 },
  flagContainer: { alignItems: 'center', paddingVertical: 8 },
  signalName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  signalDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  signalDetailText: { fontSize: 13, color: '#64748B' },
  signalMeaning: { fontSize: 13, color: '#475569', lineHeight: 18 },
  actionBox: { backgroundColor: '#F0FDF4', borderRadius: 8, padding: 10, marginTop: 4 },
  actionLabel: { fontSize: 11, fontWeight: '700', color: '#15803D', marginBottom: 2 },
  actionText: { fontSize: 12, color: '#166534', lineHeight: 17 },
  canvasWrapper: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', ...shadow },
  scenarioPanel: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, gap: 12, ...shadow },
  scenarioTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  scenarioDesc: { fontSize: 13, color: '#475569', lineHeight: 19 },
  violationBox: { borderLeftWidth: 4, borderLeftColor: '#EF4444', backgroundColor: '#FEF2F2', borderRadius: 6, padding: 12 },
  violationLabel: { fontSize: 11, fontWeight: '700', color: '#B91C1C', marginBottom: 4 },
  violationText: { fontSize: 13, color: '#991B1B', lineHeight: 18 },
  rulesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ruleBadge: { backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  ruleBadgeText: { fontSize: 12, fontWeight: '600', color: '#1D4ED8' },
  signalUsedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  signalUsedLabel: { fontSize: 13, fontWeight: '600', color: '#475569' },
  signalUsedName: { fontSize: 13, color: '#1E293B', fontWeight: '600', flexShrink: 1 },
  outcomeBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 8, padding: 12 },
  outcomeText: { fontSize: 13, color: '#1E40AF', lineHeight: 18, flex: 1 },
  completionBox: { backgroundColor: '#FFFBEB', borderRadius: 8, padding: 12, gap: 6 },
  completionTitle: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  stepRow: { flexDirection: 'row', gap: 6 },
  stepNumber: { fontSize: 12, fontWeight: '700', color: '#B45309' },
  stepText: { fontSize: 12, color: '#78350F', lineHeight: 17, flex: 1 },
  teamNote: { fontSize: 11, color: '#92400E', fontStyle: 'italic', marginTop: 4, lineHeight: 16 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 4 },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 14, fontWeight: '600', color: '#3B82F6' },
  navBtnTextDisabled: { color: '#CBD5E1' },
  navCounter: { fontSize: 13, color: '#64748B' },
  quizBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3B82F6', borderRadius: 10, padding: 14, marginTop: 8 },
  quizBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  quizHeader: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  quizFlagRow: { alignItems: 'center', paddingVertical: 8 },
  quizPrompt: { fontSize: 16, fontWeight: '700', color: '#1E293B', lineHeight: 22 },
  optionsContainer: { gap: 10 },
  optionBtn: { padding: 14, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', ...shadow },
  correctOpt: { backgroundColor: '#DCFCE7', borderColor: '#10B981' },
  incorrectOpt: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  optionText: { fontSize: 14, color: '#475569' },
  nextBtn: { backgroundColor: '#3B82F6', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  finishedCard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  finishedTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  finishedScore: { fontSize: 18, fontWeight: '600', color: '#10B981' },
  finishedMsg: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },
});

export default TeamRacingUmpireSignalsInteractive;
