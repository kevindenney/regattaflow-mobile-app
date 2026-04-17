/**
 * CompetencyProgressSection — Orchestrator for Reflect → Progress capabilities.
 *
 * Manages view state (Working On | All | Needs Attention) and renders:
 *   SummaryBar → ViewToggle → CardList (with search on "All")
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  useCompetencyReflectData,
  type CompetencyReflectView,
} from '@/hooks/useCompetencyReflectData';
import { CompetencySummaryBar } from './CompetencySummaryBar';
import { CompetencyViewToggle } from './CompetencyViewToggle';
import { CompetencyCardList } from './CompetencyCardList';

export function CompetencyProgressSection() {
  const [activeView, setActiveView] = useState<CompetencyReflectView>('working_on');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    allCompetencies,
    aggregate,
    workingOn,
    needsAttention,
    actionableSummary,
  } = useCompetencyReflectData();

  const total = aggregate.total;
  const completed = aggregate.byStatus.competent ?? 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleCompetencyPress = useCallback((competencyId: string) => {
    router.push(`/competency-detail?competencyId=${competencyId}`);
  }, []);

  // Filter all competencies by search query
  const filteredAll = useMemo(() => {
    if (!searchQuery.trim()) return allCompetencies;
    const q = searchQuery.toLowerCase();
    return allCompetencies.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q),
    );
  }, [allCompetencies, searchQuery]);

  return (
    <View style={styles.container}>
      <CompetencySummaryBar
        summary={actionableSummary}
        total={total}
        completed={completed}
        percent={percent}
      />

      <CompetencyViewToggle
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view);
          if (view !== 'all') setSearchQuery('');
        }}
        workingOnCount={workingOn.length}
        needsAttentionCount={needsAttention.length}
      />

      {activeView === 'working_on' && (
        <CompetencyCardList
          competencies={workingOn}
          onCompetencyPress={handleCompetencyPress}
          emptyTitle="Nothing in progress"
          emptySubtitle="Capabilities linked to your recent activities will appear here"
          emptyIcon="flame-outline"
        />
      )}

      {activeView === 'needs_attention' && (
        <CompetencyCardList
          competencies={needsAttention}
          onCompetencyPress={handleCompetencyPress}
          emptyTitle="All caught up"
          emptySubtitle="No capabilities need attention right now"
          emptyIcon="checkmark-circle-outline"
        />
      )}

      {activeView === 'all' && (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search capabilities..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
          <CompetencyCardList
            competencies={filteredAll}
            onCompetencyPress={handleCompetencyPress}
            emptyTitle="No matches"
            emptySubtitle="Try a different search term"
            emptyIcon="search-outline"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    padding: 0,
  },
});
