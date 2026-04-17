/**
 * CompetencyCardList — Grouped list of CompetencyCard items for
 * "Working On" and "Needs Attention" views.
 *
 * Groups by category with section headers. Shows an empty state when no items.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CompetencyWithProgress } from '@/types/competency';
import { CompetencyCard } from './CompetencyCard';

interface Props {
  competencies: CompetencyWithProgress[];
  onCompetencyPress: (competencyId: string) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: string;
}

interface Section {
  category: string;
  items: CompetencyWithProgress[];
}

export function CompetencyCardList({
  competencies,
  onCompetencyPress,
  emptyTitle = 'Nothing here yet',
  emptySubtitle = 'Capabilities you work on will appear here',
  emptyIcon = 'checkmark-circle-outline',
}: Props) {
  const sections = useMemo<Section[]>(() => {
    const map = new Map<string, CompetencyWithProgress[]>();
    for (const c of competencies) {
      const existing = map.get(c.category);
      if (existing) {
        existing.push(c);
      } else {
        map.set(c.category, [c]);
      }
    }
    return Array.from(map.entries()).map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.sort_order - b.sort_order),
    }));
  }, [competencies]);

  if (competencies.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name={emptyIcon as any} size={40} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {sections.map((section) => (
        <View key={section.category} style={styles.section}>
          <Text style={styles.sectionHeader}>{section.category}</Text>
          <View style={styles.sectionCards}>
            {section.items.map((c) => (
              <CompetencyCard
                key={c.id}
                competency={c}
                onPress={onCompetencyPress}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 2,
  },
  sectionCards: {
    gap: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
