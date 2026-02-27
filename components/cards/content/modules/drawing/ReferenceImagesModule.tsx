/**
 * ReferenceImagesModule
 *
 * Displays reference images for a drawing session.
 * Phase-aware: Plan shows selected references, Draw shows quick-access strip,
 * Critique shows side-by-side comparison placeholder.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Image,
  Camera,
  Palette,
  User,
  Plus,
  ChevronRight,
  Columns2,
} from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData, RacePhase } from '@/components/cards/types';

interface ReferenceImagesModuleProps extends ContentModuleProps<CardRaceData> {}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface ReferenceItem {
  id: string;
  title: string;
  source: string;
  type: 'photo' | 'artwork' | 'life';
  color: string;
}

const MOCK_REFERENCES: ReferenceItem[] = [
  {
    id: 'ref-1',
    title: 'Morning Light on Harbor',
    source: 'Unsplash',
    type: 'photo',
    color: '#5B8FA8',
  },
  {
    id: 'ref-2',
    title: 'Sargent - Watercolor Study',
    source: 'Met Museum',
    type: 'artwork',
    color: '#C9A86C',
  },
  {
    id: 'ref-3',
    title: 'Still Life Setup',
    source: 'Studio Photo',
    type: 'life',
    color: '#8B6F4E',
  },
];

const TYPE_ICON: Record<ReferenceItem['type'], typeof Camera> = {
  photo: Camera,
  artwork: Palette,
  life: User,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ReferenceImagesModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: ReferenceImagesModuleProps) {
  if (isCollapsed) return null;

  if (phase === 'on_water') {
    return <QuickAccessStrip />;
  }

  if (phase === 'after_race') {
    return <ComparisonPlaceholder />;
  }

  // days_before (Plan)
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {MOCK_REFERENCES.map((ref) => {
          const Icon = TYPE_ICON[ref.type];
          return (
            <View key={ref.id} style={styles.gridItem}>
              <View style={[styles.thumbnail, { backgroundColor: ref.color }]}>
                <Icon size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.refTitle} numberOfLines={1}>
                {ref.title}
              </Text>
              <View style={styles.refMeta}>
                <Text style={styles.refSource} numberOfLines={1}>
                  {ref.source}
                </Text>
                <Text style={styles.refTypeBadge}>
                  {ref.type.toUpperCase()}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Empty slot */}
        <Pressable style={({ pressed }) => [styles.gridItem, pressed && styles.pressed]}>
          <View style={[styles.thumbnail, styles.thumbnailEmpty]}>
            <Plus size={22} color="#9CA3AF" />
          </View>
          <Text style={[styles.refTitle, { color: '#9CA3AF' }]}>Add Image</Text>
        </Pressable>
      </View>

      <Pressable style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
        <Plus size={16} color="#E64A19" />
        <Text style={styles.addButtonText}>Add Reference</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Phase sub-components
// ---------------------------------------------------------------------------

function QuickAccessStrip() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>QUICK ACCESS</Text>
      <View style={styles.strip}>
        {MOCK_REFERENCES.map((ref) => {
          const Icon = TYPE_ICON[ref.type];
          return (
            <Pressable
              key={ref.id}
              style={({ pressed }) => [styles.stripItem, pressed && styles.pressed]}
            >
              <View style={[styles.stripThumb, { backgroundColor: ref.color }]}>
                <Icon size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.stripLabel} numberOfLines={1}>
                {ref.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ComparisonPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>SIDE-BY-SIDE COMPARISON</Text>
      <View style={styles.comparisonRow}>
        <View style={styles.comparisonPane}>
          <Image size={20} color="#9CA3AF" />
          <Text style={styles.comparisonLabel}>Reference</Text>
        </View>
        <Columns2 size={16} color="#9CA3AF" />
        <View style={styles.comparisonPane}>
          <Image size={20} color="#9CA3AF" />
          <Text style={styles.comparisonLabel}>Your Drawing</Text>
        </View>
      </View>
      <Pressable style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
        <ChevronRight size={14} color="#E64A19" />
        <Text style={styles.addButtonText}>Select images to compare</Text>
      </Pressable>
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '47%',
    gap: 4,
  },
  thumbnail: {
    height: 80,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailEmpty: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  refTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#1F2937',
  },
  refMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refSource: {
    fontSize: 11,
    color: '#6B7280',
    flex: 1,
  },
  refTypeBadge: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E64A19',
    backgroundColor: '#FFF5F2',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E64A19',
  },
  pressed: {
    opacity: 0.7,
  },
  // Quick-access strip
  strip: {
    flexDirection: 'row',
    gap: 10,
  },
  stripItem: {
    alignItems: 'center',
    gap: 4,
    width: 72,
  },
  stripThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Comparison
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comparisonPane: {
    flex: 1,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  comparisonLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});

export default ReferenceImagesModule;
