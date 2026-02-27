/**
 * CompositionModule
 *
 * Shows composition planning for a drawing session.
 * Phase-aware: Plan shows full planning UI, Draw shows minimal overlay reminder,
 * Critique shows final vs planned comparison.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Grid3x3,
  RatioIcon,
  Maximize2,
  Eye,
  ChevronRight,
} from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData } from '@/components/cards/types';

interface CompositionModuleProps extends ContentModuleProps<CardRaceData> {}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface GridOption {
  id: string;
  label: string;
  icon: typeof Grid3x3;
}

const GRID_OPTIONS: GridOption[] = [
  { id: 'rule-of-thirds', label: 'Rule of Thirds', icon: Grid3x3 },
  { id: 'golden-section', label: 'Golden Section', icon: RatioIcon },
  { id: 'diagonal', label: 'Diagonal', icon: Maximize2 },
];

interface ValueStudy {
  id: string;
  label: string;
  distribution: string;
  color: string;
}

const VALUE_STUDIES: ValueStudy[] = [
  { id: 'v1', label: 'High Key', distribution: '70/20/10', color: '#D1D5DB' },
  { id: 'v2', label: 'Balanced', distribution: '40/35/25', color: '#9CA3AF' },
  { id: 'v3', label: 'Low Key', distribution: '15/25/60', color: '#4B5563' },
];

const MOCK_COMPOSITION = {
  type: 'Rule of Thirds',
  aspectRatio: '3:4 Portrait',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function CompositionModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: CompositionModuleProps) {
  const [selectedGrid, setSelectedGrid] = useState('rule-of-thirds');
  const [selectedValue, setSelectedValue] = useState('v2');

  if (isCollapsed) return null;

  if (phase === 'on_water') {
    return <OverlayReminder selectedGrid={selectedGrid} />;
  }

  if (phase === 'after_race') {
    return <PlannedVsFinal />;
  }

  // days_before (Plan)
  return (
    <View style={styles.container}>
      {/* Composition type + aspect ratio */}
      <View style={styles.headerRow}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{MOCK_COMPOSITION.type}</Text>
          <Text style={styles.subtitle}>{MOCK_COMPOSITION.aspectRatio}</Text>
        </View>
        <View style={styles.sketchPlaceholder}>
          <Grid3x3 size={18} color="#9CA3AF" />
        </View>
      </View>

      {/* Grid overlay selector */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>GRID OVERLAY</Text>
        <View style={styles.gridOptions}>
          {GRID_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = selectedGrid === option.id;
            return (
              <Pressable
                key={option.id}
                style={[styles.gridCard, selected && styles.gridCardSelected]}
                onPress={() => setSelectedGrid(option.id)}
              >
                <Icon
                  size={18}
                  color={selected ? '#E64A19' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.gridCardLabel,
                    selected && styles.gridCardLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Value studies */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>VALUE STUDIES</Text>
        <View style={styles.valueRow}>
          {VALUE_STUDIES.map((study) => {
            const selected = selectedValue === study.id;
            return (
              <Pressable
                key={study.id}
                style={[
                  styles.valueCard,
                  selected && styles.valueCardSelected,
                ]}
                onPress={() => setSelectedValue(study.id)}
              >
                <View
                  style={[styles.valueSwatch, { backgroundColor: study.color }]}
                />
                <Text style={styles.valueLabel}>{study.label}</Text>
                <Text style={styles.valueDist}>{study.distribution}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Phase sub-components
// ---------------------------------------------------------------------------

function OverlayReminder({ selectedGrid }: { selectedGrid: string }) {
  const option = GRID_OPTIONS.find((g) => g.id === selectedGrid) ?? GRID_OPTIONS[0];
  const Icon = option.icon;
  return (
    <View style={styles.container}>
      <View style={styles.reminderRow}>
        <Icon size={16} color="#E64A19" />
        <Text style={styles.reminderText}>
          Active overlay: <Text style={{ fontWeight: '600' }}>{option.label}</Text>
        </Text>
      </View>
      <Text style={styles.reminderHint}>
        Tap to toggle overlay on your canvas
      </Text>
    </View>
  );
}

function PlannedVsFinal() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>PLANNED VS FINAL</Text>
      <View style={styles.comparisonRow}>
        <View style={styles.comparisonPane}>
          <Grid3x3 size={18} color="#9CA3AF" />
          <Text style={styles.comparisonLabel}>Planned</Text>
        </View>
        <ChevronRight size={14} color="#9CA3AF" />
        <View style={styles.comparisonPane}>
          <Eye size={18} color="#9CA3AF" />
          <Text style={styles.comparisonLabel}>Final</Text>
        </View>
      </View>
      <Text style={styles.comparisonNote}>
        Compare your initial composition plan to the finished piece
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  sketchPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.6,
  },
  gridOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  gridCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gridCardSelected: {
    backgroundColor: '#FFF5F2',
    borderColor: '#E64A19',
  },
  gridCardLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  gridCardLabelSelected: {
    color: '#E64A19',
  },
  valueRow: {
    flexDirection: 'row',
    gap: 8,
  },
  valueCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  valueCardSelected: {
    borderColor: '#E64A19',
    backgroundColor: '#FFF5F2',
  },
  valueSwatch: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  valueLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1F2937',
  },
  valueDist: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  // Overlay reminder (Draw phase)
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderText: {
    fontSize: 13,
    color: '#1F2937',
  },
  reminderHint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 24,
  },
  // Comparison (Critique phase)
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comparisonPane: {
    flex: 1,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  comparisonLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  comparisonNote: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default CompositionModule;
