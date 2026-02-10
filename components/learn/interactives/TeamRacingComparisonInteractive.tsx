/**
 * Team Racing Comparison Interactive
 * Shows comparison cards across fleet, match, and team racing formats
 * across multiple dimensions to highlight what makes team racing unique.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COMPARISON_DIMENSIONS, TEAM_RACING_COMPARISON, type ComparisonDimension } from './data/teamRacingComparisonData';

const COLUMN_COLORS = {
  fleet: { header: '#64748B', headerBg: '#64748B' + '15', border: '#E2E8F0' },
  match: { header: '#F97316', headerBg: '#F97316' + '15', border: '#FED7AA' },
  team: { header: '#3B82F6', headerBg: '#3B82F6' + '15', border: '#3B82F6' },
};

interface TeamRacingComparisonInteractiveProps {
  onComplete?: () => void;
}

export function TeamRacingComparisonInteractive({ onComplete }: TeamRacingComparisonInteractiveProps) {
  const [cardIndex, setCardIndex] = useState(0);
  const [viewedCards, setViewedCards] = useState<Set<string>>(new Set());

  const totalCards = COMPARISON_DIMENSIONS.length;
  const dimension: ComparisonDimension = COMPARISON_DIMENSIONS[cardIndex];

  // Track viewed cards & fire onComplete
  useEffect(() => {
    setViewedCards((prev) => new Set(prev).add(dimension.id));
  }, [dimension.id]);
  useEffect(() => {
    if (viewedCards.size >= COMPARISON_DIMENSIONS.length) onComplete?.();
  }, [viewedCards, onComplete]);

  const handlePrev = useCallback(() => {
    setCardIndex((p) => (p > 0 ? p - 1 : totalCards - 1));
  }, [totalCards]);

  const handleNext = useCallback(() => {
    setCardIndex((p) => (p < totalCards - 1 ? p + 1 : 0));
  }, [totalCards]);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Dimension icon + title header */}
      <View style={s.headerCard}>
        <View style={s.headerRow}>
          <View style={s.iconCircle}>
            <Ionicons name={dimension.icon as any} size={22} color="#3B82F6" />
          </View>
          <Text style={s.headerTitle}>{dimension.dimension}</Text>
        </View>
      </View>

      {/* Three-column comparison */}
      <View style={s.columnsContainer}>
        {/* Fleet column */}
        <View style={[s.column, { borderColor: COLUMN_COLORS.fleet.border }]}>
          <View style={[s.columnHeader, { backgroundColor: COLUMN_COLORS.fleet.headerBg }]}>
            <Text style={[s.columnHeaderText, { color: COLUMN_COLORS.fleet.header }]}>Fleet</Text>
          </View>
          <View style={s.columnBody}>
            <Text style={s.summaryText}>{dimension.fleet.summary}</Text>
            <Text style={s.detailText}>{dimension.fleet.detail}</Text>
          </View>
        </View>

        {/* Match column */}
        <View style={[s.column, { borderColor: COLUMN_COLORS.match.border }]}>
          <View style={[s.columnHeader, { backgroundColor: COLUMN_COLORS.match.headerBg }]}>
            <Text style={[s.columnHeaderText, { color: COLUMN_COLORS.match.header }]}>Match</Text>
          </View>
          <View style={s.columnBody}>
            <Text style={s.summaryText}>{dimension.match.summary}</Text>
            <Text style={s.detailText}>{dimension.match.detail}</Text>
          </View>
        </View>

        {/* Team column (highlighted) */}
        <View style={[s.column, s.teamColumn, { borderColor: COLUMN_COLORS.team.border }]}>
          <View style={[s.columnHeader, { backgroundColor: COLUMN_COLORS.team.headerBg }]}>
            <Text style={[s.columnHeaderText, { color: COLUMN_COLORS.team.header }]}>Team</Text>
          </View>
          <View style={s.columnBody}>
            <Text style={[s.summaryText, { color: '#1E40AF' }]}>{dimension.team.summary}</Text>
            <Text style={s.detailText}>{dimension.team.detail}</Text>
          </View>
        </View>
      </View>

      {/* Team Racing Highlight callout */}
      <View style={s.highlightCard}>
        <View style={s.highlightHeader}>
          <Ionicons name="star" size={14} color="#3B82F6" />
          <Text style={s.highlightLabel}>What makes team racing unique</Text>
        </View>
        <Text style={s.highlightText}>{dimension.teamHighlight}</Text>
      </View>

      {/* Navigation: prev/next buttons, dots, counter */}
      <View style={s.controls}>
        <TouchableOpacity onPress={handlePrev} style={s.navBtn}>
          <Ionicons name="chevron-back" size={20} color="#475569" />
        </TouchableOpacity>
        <View style={s.dots}>
          {COMPARISON_DIMENSIONS.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setCardIndex(i)}
              style={[
                s.dot,
                i === cardIndex && { backgroundColor: '#3B82F6', transform: [{ scale: 1.3 }] },
                viewedCards.has(COMPARISON_DIMENSIONS[i].id) && i !== cardIndex && { backgroundColor: '#94A3B8' },
              ]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={handleNext} style={s.navBtn}>
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </TouchableOpacity>
      </View>
      <Text style={s.counter}>{cardIndex + 1} of {totalCards}</Text>
    </ScrollView>
  );
}

const shadow = Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' as any } : { elevation: 2 };

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 12, gap: 12, paddingBottom: 32 },
  headerCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, ...shadow },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', flex: 1 },
  columnsContainer: { gap: 10 },
  column: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, overflow: 'hidden', ...shadow },
  teamColumn: { borderWidth: 2, backgroundColor: '#F8FBFF' },
  columnHeader: { paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  columnHeaderText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  columnBody: { padding: 12, gap: 8 },
  summaryText: { fontSize: 14, fontWeight: '700', color: '#1E293B', lineHeight: 20 },
  detailText: { fontSize: 13, color: '#64748B', lineHeight: 19 },
  highlightCard: { backgroundColor: '#EFF6FF', padding: 14, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: '#BFDBFE', ...shadow },
  highlightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  highlightLabel: { fontSize: 12, fontWeight: '700', color: '#1E40AF' },
  highlightText: { fontSize: 13, color: '#1E3A5F', lineHeight: 19 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' },
  counter: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
});

export default TeamRacingComparisonInteractive;
