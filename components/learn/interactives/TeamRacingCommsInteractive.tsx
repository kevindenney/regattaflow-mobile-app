/**
 * Team Racing Communications Interactive
 * A call library with category filters, expandable cards with scenario
 * visualizations, and progress tracking for explored calls.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Line, Circle, Rect, Text as SvgText, Path, Defs, Polygon } from 'react-native-svg';
import {
  type TeamRacingCall,
  type CallCategory,
  TEAM_RACING_CALLS,
  CALLS_BY_CATEGORY,
  COMMS_OVERVIEW,
} from './data/teamRacingCommsData';
import { TopDownSailboatSVG } from './shared';

const CATEGORY_COLORS: Record<CallCategory, string> = {
  combination: '#3B82F6',
  play: '#F97316',
  position: '#10B981',
  situational: '#8B5CF6',
};

const CATEGORY_LABELS: Record<CallCategory, string> = {
  combination: 'Combination',
  play: 'Play',
  position: 'Position',
  situational: 'Situational',
};

const FILTERS: { label: string; categories: CallCategory[] }[] = [
  { label: 'All', categories: [] },
  { label: 'Combination', categories: ['combination'] },
  { label: 'Play', categories: ['play'] },
  { label: 'Position', categories: ['position'] },
  { label: 'Situational', categories: ['situational'] },
];

interface TeamRacingCommsInteractiveProps {
  onComplete?: () => void;
}

export function TeamRacingCommsInteractive({ onComplete }: TeamRacingCommsInteractiveProps) {
  const [filterIdx, setFilterIdx] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewedCalls, setViewedCalls] = useState<Set<string>>(new Set());

  const filteredCalls = useMemo(() => {
    const f = FILTERS[filterIdx];
    return f.categories.length === 0
      ? TEAM_RACING_CALLS
      : TEAM_RACING_CALLS.filter((c) => f.categories.includes(c.category));
  }, [filterIdx]);

  // Track viewed calls when expanded
  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => {
      const next = prev === id ? null : id;
      if (next) {
        setViewedCalls((s) => new Set(s).add(id));
      }
      return next;
    });
  }, []);

  // Fire onComplete when 75%+ calls viewed
  useEffect(() => {
    if (viewedCalls.size >= Math.ceil(TEAM_RACING_CALLS.length * 0.75)) {
      onComplete?.();
    }
  }, [viewedCalls, onComplete]);

  const annStyle = (type: string) => ({
    bg: type === 'action' ? '#DBEAFE' : type === 'warning' ? '#FEF3C7' : '#F1F5F9',
    fg: type === 'action' ? '#1E40AF' : type === 'warning' ? '#92400E' : '#475569',
  });

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Title + description */}
      <View style={s.card}>
        <Text style={s.title}>{COMMS_OVERVIEW.title}</Text>
        <Text style={s.desc}>{COMMS_OVERVIEW.description}</Text>
      </View>

      {/* Category filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {FILTERS.map((f, i) => {
          const active = i === filterIdx;
          const c = f.categories.length > 0 ? CATEGORY_COLORS[f.categories[0]] : '#64748B';
          return (
            <TouchableOpacity
              key={f.label}
              style={[s.filterChip, active && { backgroundColor: c, borderColor: c }]}
              onPress={() => setFilterIdx(i)}
            >
              <Text style={[s.filterText, active && { color: '#FFF' }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Call cards */}
      {filteredCalls.map((call) => {
        const expanded = expandedId === call.id;
        const color = CATEGORY_COLORS[call.category];
        const viewed = viewedCalls.has(call.id);

        return (
          <TouchableOpacity
            key={call.id}
            style={[s.callCard, expanded && { borderLeftColor: color, borderLeftWidth: 3 }]}
            onPress={() => handleToggle(call.id)}
            activeOpacity={0.7}
          >
            {/* Header row */}
            <View style={s.callHeader}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.callText}>"{call.call}"</Text>
                <View style={s.row}>
                  <View style={[s.badge, { backgroundColor: color + '20' }]}>
                    <Text style={[s.badgeText, { color }]}>{CATEGORY_LABELS[call.category]}</Text>
                  </View>
                  {viewed && (
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginLeft: 6 }} />
                  )}
                </View>
              </View>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#94A3B8" />
            </View>

            {/* Collapsed: show meaning */}
            {!expanded && <Text style={s.meaningPreview} numberOfLines={2}>{call.meaning}</Text>}

            {/* Expanded details */}
            {expanded && (
              <View style={s.expandedContent}>
                <View style={{ gap: 4 }}>
                  <Text style={s.sectionLabel}>Meaning</Text>
                  <Text style={s.sectionText}>{call.meaning}</Text>
                </View>
                <View style={{ gap: 4 }}>
                  <Text style={s.sectionLabel}>When to Use</Text>
                  <Text style={s.sectionText}>{call.whenToUse}</Text>
                </View>
                <View style={{ gap: 4 }}>
                  <Text style={s.sectionLabel}>Example</Text>
                  <Text style={[s.sectionText, { fontStyle: 'italic' }]}>{call.example}</Text>
                </View>

                {/* Scenario SVG */}
                {call.scenarioBoats && call.scenarioBoats.length > 0 && (
                  <View style={s.svgWrap}>
                    <Svg width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid meet">
                      <Defs>
                        <Polygon id="comms-wa" points="0,0 5,12 -5,12" fill="#64748B" />
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
                      {call.scenarioMarks?.map((m, i) => (
                        <G key={`m${i}`}>
                          <Circle cx={m.x} cy={m.y} r="8" fill="#F97316" stroke="#EA580C" strokeWidth="2" />
                          <SvgText x={m.x + 14} y={m.y + 4} fontSize="9" fill="#94A3B8" fontWeight="500">
                            {m.type === 'windward' ? 'WM' : 'LM'}
                          </SvgText>
                        </G>
                      ))}
                      {/* Boats */}
                      {call.scenarioBoats.map((b) => {
                        const boatColor = b.team === 'blue' ? '#3B82F6' : '#EF4444';
                        const sc = 0.35;
                        return (
                          <G key={b.id}>
                            <G transform={`translate(${b.x - 25 * sc}, ${b.y - 40 * sc})`}>
                              <TopDownSailboatSVG
                                hullColor={boatColor}
                                rotation={b.heading}
                                scale={sc}
                                showWake={false}
                                windDirection={call.windDirection ?? 0}
                                label={b.label}
                              />
                            </G>
                          </G>
                        );
                      })}
                      {/* Annotations */}
                      {call.scenarioAnnotations?.map((a, i) => {
                        const { bg, fg } = annStyle(a.type);
                        return (
                          <G key={`a${i}`}>
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
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Progress counter */}
      <View style={s.progressRow}>
        <Ionicons name="checkmark-circle-outline" size={16} color="#64748B" />
        <Text style={s.counter}>
          {viewedCalls.size} of {TEAM_RACING_CALLS.length} calls explored
        </Text>
      </View>
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
  title: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  desc: { fontSize: 13, color: '#475569', lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  callCard: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    borderLeftWidth: 0,
    borderLeftColor: 'transparent',
    ...shadow,
  },
  callHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  callText: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  meaningPreview: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  expandedContent: { gap: 12, marginTop: 4 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  sectionText: { fontSize: 13, color: '#475569', lineHeight: 19 },
  svgWrap: {
    width: '100%',
    aspectRatio: 400 / 600,
    backgroundColor: '#E0EFFE',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
    ...shadow,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  counter: { fontSize: 13, color: '#64748B', fontWeight: '500' },
});

export default TeamRacingCommsInteractive;
