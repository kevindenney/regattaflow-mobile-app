/**
 * MaterialsModule
 *
 * Shows materials and supplies selected for a drawing session.
 * Phase-aware: Plan shows full materials list with check toggles,
 * Draw shows minimal view, Critique shows notes on material suitability.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Pencil,
  FileText,
  Layers,
  Eraser,
  Ruler,
  Check,
  Circle,
  MessageSquare,
} from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData } from '@/components/cards/types';

interface MaterialsModuleProps extends ContentModuleProps<CardRaceData> {}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface MaterialItem {
  id: string;
  name: string;
  detail: string;
  icon: typeof Pencil;
}

const MOCK_MATERIALS: MaterialItem[] = [
  { id: 'm1', name: 'Graphite', detail: 'Staedtler Mars Lumograph 4B', icon: Pencil },
  { id: 'm2', name: 'Drawing Paper', detail: 'Strathmore 400 Series, 9x12', icon: FileText },
  { id: 'm3', name: 'Blending Stump', detail: 'Tortillon, medium', icon: Layers },
  { id: 'm4', name: 'Kneaded Eraser', detail: 'Prismacolor', icon: Eraser },
  { id: 'm5', name: 'Ruler', detail: '12" metal straightedge', icon: Ruler },
];

const COLOR_SWATCHES = ['#2C3E50', '#7F8C8D', '#BDC3C7', '#D5DBDB'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function MaterialsModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: MaterialsModuleProps) {
  const [packed, setPacked] = useState<Set<string>>(
    new Set(['m1', 'm2', 'm4']),
  );

  if (isCollapsed) return null;

  if (phase === 'on_water') {
    return <MinimalView packedCount={packed.size} total={MOCK_MATERIALS.length} />;
  }

  if (phase === 'after_race') {
    return <SuitabilityNotes />;
  }

  const togglePacked = (id: string) => {
    setPacked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // days_before (Plan)
  return (
    <View style={styles.container}>
      {/* Materials list */}
      <View style={styles.list}>
        {MOCK_MATERIALS.map((item) => {
          const Icon = item.icon;
          const isReady = packed.has(item.id);
          return (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.materialRow,
                pressed && styles.pressed,
              ]}
              onPress={() => togglePacked(item.id)}
            >
              <Icon size={16} color={isReady ? '#E64A19' : '#9CA3AF'} />
              <View style={styles.materialInfo}>
                <Text style={styles.materialName}>{item.name}</Text>
                <Text style={styles.materialDetail}>{item.detail}</Text>
              </View>
              <View
                style={[
                  styles.checkCircle,
                  isReady && styles.checkCircleActive,
                ]}
              >
                {isReady ? (
                  <Check size={12} color="#FFFFFF" />
                ) : (
                  <Circle size={12} color="#D1D5DB" />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Color palette */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TONE PALETTE</Text>
        <View style={styles.swatchRow}>
          {COLOR_SWATCHES.map((color, i) => (
            <View key={i} style={[styles.swatch, { backgroundColor: color }]} />
          ))}
        </View>
      </View>

      {/* Summary */}
      <Text style={styles.summaryText}>
        {packed.size}/{MOCK_MATERIALS.length} items packed
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Phase sub-components
// ---------------------------------------------------------------------------

function MinimalView({
  packedCount,
  total,
}: {
  packedCount: number;
  total: number;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.minimalRow}>
        <Pencil size={14} color="#6B7280" />
        <Text style={styles.minimalText}>
          {packedCount}/{total} materials ready
        </Text>
        {packedCount === total ? (
          <Check size={14} color="#34C759" />
        ) : (
          <Text style={styles.warningDot}>!</Text>
        )}
      </View>
    </View>
  );
}

function SuitabilityNotes() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>MATERIAL NOTES</Text>
      <View style={styles.noteCard}>
        <MessageSquare size={14} color="#6B7280" />
        <Text style={styles.noteText}>
          4B graphite was ideal for the value range needed. Paper tooth handled
          layered cross-hatching well. Consider trying 6B for the darkest
          shadows next session.
        </Text>
      </View>
      <View style={styles.swatchSection}>
        <Text style={styles.sectionLabel}>TONES USED</Text>
        <View style={styles.swatchRow}>
          {COLOR_SWATCHES.map((color, i) => (
            <View key={i} style={[styles.swatch, { backgroundColor: color }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 10,
  },
  list: {
    gap: 2,
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  materialInfo: {
    flex: 1,
    gap: 1,
  },
  materialName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },
  materialDetail: {
    fontSize: 11,
    color: '#6B7280',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#E64A19',
    borderColor: '#E64A19',
  },
  section: {
    gap: 6,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.6,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  // Minimal (Draw phase)
  minimalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  minimalText: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
  },
  warningDot: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF9500',
  },
  // Notes (Critique phase)
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },
  swatchSection: {
    gap: 6,
  },
});

export default MaterialsModule;
