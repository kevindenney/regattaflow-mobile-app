/**
 * Self-Assessment Screen
 *
 * Standalone route for logging competency attempts.
 * Accepts search params:
 *   - eventId:       (optional) links attempt to a specific event
 *   - competencyId:  (optional) pre-selects a competency
 *
 * If competencyId is provided, opens the SelfAssessmentFlow directly.
 * Otherwise, shows a competency picker first.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useInterest } from '@/providers/InterestProvider';
import { useCompetencyProgress } from '@/hooks/useCompetencyProgress';
import { SelfAssessmentFlow } from '@/components/competency/SelfAssessmentFlow';
import type { Competency, CompetencyWithProgress, LogAttemptPayload } from '@/types/competency';

export default function SelfAssessmentScreen() {
  const { eventId, competencyId } = useLocalSearchParams<{
    eventId?: string;
    competencyId?: string;
  }>();
  const { currentInterest } = useInterest();
  const { competencies, isLoading, logNewAttempt } = useCompetencyProgress();
  const insets = useSafeAreaInsets();

  const accentColor = currentInterest?.accent_color ?? '#0097A7';

  // ---- State ----

  const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null);
  const [showFlow, setShowFlow] = useState(false);

  // If competencyId is provided, auto-select it when data loads
  const preselected = useMemo(() => {
    if (!competencyId || !competencies) return null;
    return competencies.find((c) => c.id === competencyId) ?? null;
  }, [competencyId, competencies]);

  // Auto-open flow if competency is pre-selected
  React.useEffect(() => {
    if (preselected && !showFlow) {
      setSelectedCompetency(preselected);
      setShowFlow(true);
    }
  }, [preselected, showFlow]);

  // ---- Handlers ----

  const handleSelectCompetency = useCallback((c: CompetencyWithProgress) => {
    setSelectedCompetency(c);
    setShowFlow(true);
  }, []);

  const handleCloseFlow = useCallback(() => {
    setShowFlow(false);
    setSelectedCompetency(null);
    // If we came with a preselected competency, go back
    if (competencyId) {
      router.back();
    }
  }, [competencyId]);

  const handleSubmit = useCallback(
    async (payload: LogAttemptPayload) => {
      await logNewAttempt(payload);
      setShowFlow(false);
      setSelectedCompetency(null);
      router.back();
    },
    [logNewAttempt],
  );

  // ---- Group competencies by category ----

  const grouped = useMemo(() => {
    if (!competencies) return [];
    const groups: Record<string, CompetencyWithProgress[]> = {};
    for (const c of competencies) {
      const cat = c.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    }
    return Object.entries(groups).map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.competency_number - b.competency_number),
    }));
  }, [competencies]);

  // ---- Loading ----

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ title: 'Log Attempt', headerBackTitle: 'Back' }} />
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  // ---- Render ----

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ title: 'Log Attempt', headerBackTitle: 'Back' }} />

      {/* Competency Picker */}
      <FlatList
        data={grouped}
        keyExtractor={(item) => item.category}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select a Competency</Text>
            <Text style={styles.headerSubtitle}>
              Choose the competency you practiced to log your attempt
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.categorySection}>
            <Text style={styles.categoryLabel}>{item.category}</Text>
            {item.items.map((c) => {
              const status = c.progress?.status ?? 'not_started';
              return (
                <Pressable
                  key={c.id}
                  style={({ pressed }) => [
                    styles.competencyRow,
                    pressed && styles.competencyRowPressed,
                  ]}
                  onPress={() => handleSelectCompetency(c)}
                >
                  <View style={[styles.numberBadge, { backgroundColor: accentColor }]}>
                    <Text style={styles.numberText}>{c.competency_number}</Text>
                  </View>
                  <View style={styles.competencyInfo}>
                    <Text style={styles.competencyTitle} numberOfLines={1}>
                      {c.title}
                    </Text>
                    <Text style={styles.competencyStatus}>{status.replace(/_/g, ' ')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </Pressable>
              );
            })}
          </View>
        )}
      />

      {/* Self-Assessment Modal */}
      {selectedCompetency && (
        <SelfAssessmentFlow
          visible={showFlow}
          competency={selectedCompetency}
          eventId={eventId}
          onSubmit={handleSubmit}
          onClose={handleCloseFlow}
          accentColor={accentColor}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  competencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  competencyRowPressed: {
    opacity: 0.7,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  numberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  competencyInfo: {
    flex: 1,
    marginRight: 8,
  },
  competencyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  competencyStatus: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
});
