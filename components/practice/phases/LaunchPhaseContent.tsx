/**
 * LaunchPhaseContent
 *
 * Content for the Launch phase (session day, before start):
 * - Safety briefing
 * - Communication check
 * - Current conditions
 * - Warm-up plan
 * - Rig setup
 */

import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Wind, Waves, Compass } from 'lucide-react-native';
import { IOS_COLORS, TUFTE_TEXT } from '@/components/cards/constants';
import { TufteChecklistSection } from '../tufte/TufteChecklistSection';
import { TufteDrillRow } from '../tufte/TufteDrillRow';
import { sparkline } from '@/lib/tufte';
import {
  getCategoriesForPracticePhase,
  getPracticeItemsGroupedByCategory,
  PracticeChecklistCompletion,
} from '@/lib/checklists/practiceChecklists';
import type { PracticeSession } from '@/types/practice';

interface LaunchPhaseContentProps {
  session: PracticeSession;
  completions: Record<string, PracticeChecklistCompletion>;
  onToggleItem: (itemId: string) => void;
  onItemAction?: (itemId: string) => void;
  // Optional weather data
  windSpeed?: { current: number; forecast: number[] };
  windDirection?: number;
  waveHeight?: number;
}

export function LaunchPhaseContent({
  session,
  completions,
  onToggleItem,
  onItemAction,
  windSpeed,
  windDirection,
  waveHeight,
}: LaunchPhaseContentProps) {
  // Get checklist items for launch phase
  const categories = getCategoriesForPracticePhase('practice_launch');
  const itemsByCategory = getPracticeItemsGroupedByCategory('practice_launch');

  // Drill count for warm-up context
  const drillCount = session.drills?.length || 0;
  const totalDuration = session.drills?.reduce(
    (sum, d) => sum + (d.plannedDurationMinutes || d.drill?.durationMinutes || 0),
    0
  ) || 0;

  // Wind direction as compass text
  const getWindDirectionText = (degrees: number | undefined) => {
    if (degrees === undefined) return '—';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Conditions Summary (if available) */}
      {(windSpeed || session.windSpeedMin || session.windSpeedMax) && (
        <View style={styles.conditionsCard}>
          <Text style={styles.sectionLabel}>CONDITIONS</Text>
          <View style={styles.conditionsGrid}>
            {/* Wind */}
            <View style={styles.conditionItem}>
              <Wind size={16} color={IOS_COLORS.blue} />
              <View style={styles.conditionData}>
                <Text style={styles.conditionValue}>
                  {windSpeed?.current ||
                    session.windSpeedMin ||
                    '—'}{' '}
                  {session.windSpeedMax ? `- ${session.windSpeedMax}` : ''} kt
                </Text>
                {windSpeed?.forecast && (
                  <Text style={styles.sparkline}>
                    {sparkline(windSpeed.forecast, { width: 8 })}
                  </Text>
                )}
              </View>
            </View>

            {/* Direction */}
            <View style={styles.conditionItem}>
              <Compass size={16} color={IOS_COLORS.gray} />
              <View style={styles.conditionData}>
                <Text style={styles.conditionValue}>
                  {getWindDirectionText(windDirection || session.windDirection)}
                  {session.windDirection ? ` ${session.windDirection}°` : ''}
                </Text>
              </View>
            </View>

            {/* Waves (if available) */}
            {waveHeight !== undefined && (
              <View style={styles.conditionItem}>
                <Waves size={16} color={IOS_COLORS.cyan} />
                <View style={styles.conditionData}>
                  <Text style={styles.conditionValue}>
                    {waveHeight.toFixed(1)} m
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Session Overview */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewRow}>
          <Text style={styles.overviewLabel}>Today's Session</Text>
          <Text style={styles.overviewValue}>
            {drillCount} drills · {totalDuration} min
          </Text>
        </View>
        {session.focusAreas?.[0] && (
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Primary Focus</Text>
            <Text style={styles.overviewValue}>
              {session.focusAreas[0].skillArea
                ?.split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')}
            </Text>
          </View>
        )}
      </View>

      {/* First 2 Drills Preview */}
      {session.drills && session.drills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FIRST DRILLS</Text>
          <View style={styles.drillsList}>
            {session.drills.slice(0, 2).map((drill, index) => (
              <TufteDrillRow
                key={drill.id}
                drill={drill}
                index={index}
              />
            ))}
          </View>
        </View>
      )}

      {/* Checklist Sections */}
      {categories.map((category) => {
        const items = itemsByCategory[category];
        if (!items || items.length === 0) return null;

        return (
          <TufteChecklistSection
            key={category}
            category={category}
            items={items}
            completions={completions}
            onToggleItem={onToggleItem}
            onItemAction={(item) => onItemAction?.(item.id)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },
  conditionsCard: {
    backgroundColor: `${IOS_COLORS.blue}08`,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 100,
  },
  conditionData: {
    gap: 2,
  },
  conditionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: TUFTE_TEXT,
    fontVariant: ['tabular-nums'],
  },
  sparkline: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: IOS_COLORS.blue,
  },
  overviewCard: {
    gap: 8,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: TUFTE_TEXT,
  },
  drillsList: {
    gap: 2,
  },
});

export default LaunchPhaseContent;
