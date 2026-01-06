/**
 * MarkRoundingCard - Position 9
 *
 * Apple Human Interface Guidelines (HIG) compliant design:
 * - iOS system colors
 * - SF Pro typography
 * - Race-type aware strategy templates
 * - Clean section-based layout
 */

import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { CornerDownRight, MapPin, Target, Users, ChevronDown } from 'lucide-react-native';

import { CardContentProps } from '../types';
import { getTemplateForCardType, RaceType } from '../templates/defaultTemplates';
import { StrategyTemplateRenderer } from '../templates/StrategyTemplateRenderer';
import { detectRaceType } from '@/lib/races/raceDataUtils';
import { useSectionAction } from '@/hooks/useSectionAction';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import { WatchScheduleCreator } from '@/components/tools/WatchScheduleCreator';
import type { WatchSchedule } from '@/types/watchSchedule';

// =============================================================================
// iOS SYSTEM COLORS (Apple HIG)
// =============================================================================

const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  teal: '#5AC8FA',
  cyan: '#32ADE6',
  indigo: '#5856D6',
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
};

// Race type colors (iOS-aligned)
const RACE_TYPE_COLORS = {
  fleet: IOS_COLORS.indigo,
  distance: IOS_COLORS.purple,
  match: IOS_COLORS.orange,
  team: IOS_COLORS.teal,
};

export function MarkRoundingCard({
  race,
  cardType,
  isActive,
  isExpanded,
  onToggleExpand,
  dimensions,
}: CardContentProps) {
  const [enhancedData, setEnhancedData] = useState(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Modal state for Watch Schedule Creator
  const [watchScheduleModalVisible, setWatchScheduleModalVisible] = useState(false);

  // Hook for race preparation data (includes strategy notes persistence)
  const { intentions, updateStrategyNote, updateIntentions } = useRacePreparation({
    raceEventId: race.id,
    autoSave: true,
    debounceMs: 1000,
  });

  // Handle opening tools (for modal-based tools like Watch Schedule Creator)
  const handleOpenTool = useCallback((toolId: string, toolName: string) => {
    if (toolId === 'watch-schedule-creator') {
      setWatchScheduleModalVisible(true);
    }
  }, []);

  // Hook for handling section actions (tools, learning modules)
  const { handleSectionAction } = useSectionAction({
    raceId: race.id,
    onOpenTool: handleOpenTool,
  });

  // Handle saving the watch schedule
  const handleSaveWatchSchedule = useCallback(
    (schedule: WatchSchedule) => {
      updateIntentions({ watchSchedule: schedule });
      setWatchScheduleModalVisible(false);
    },
    [updateIntentions]
  );

  // Get strategy notes from intentions
  const userNotes = intentions.strategyNotes || {};

  // Callback for when user changes a note
  const handleUserNoteChange = useCallback(
    (sectionId: string, note: string) => {
      updateStrategyNote(sectionId, note);
    },
    [updateStrategyNote]
  );

  // Detect race type for template selection
  const detectedRaceType = useMemo((): RaceType => {
    const explicit = race.race_type as RaceType | undefined;
    const distance = (race as any).total_distance_nm;
    return detectRaceType(race.name, explicit as any, distance) as RaceType;
  }, [race.name, race.race_type, (race as any).total_distance_nm]);

  // Get the appropriate template for this race type
  const template = useMemo(() => {
    return getTemplateForCardType('mark_rounding', detectedRaceType);
  }, [detectedRaceType]);

  const handleEnhance = useCallback(async () => {
    setIsEnhancing(true);
    setTimeout(() => {
      setIsEnhancing(false);
    }, 2000);
  }, []);

  const isDistanceRace = detectedRaceType === 'distance';
  const isMatchRace = detectedRaceType === 'match';
  const isTeamRace = detectedRaceType === 'team';

  // Get icon and color based on race type (iOS colors)
  const getIconAndColor = () => {
    if (isDistanceRace) return { Icon: MapPin, color: RACE_TYPE_COLORS.distance };
    if (isMatchRace) return { Icon: Target, color: RACE_TYPE_COLORS.match };
    if (isTeamRace) return { Icon: Users, color: RACE_TYPE_COLORS.team };
    return { Icon: CornerDownRight, color: RACE_TYPE_COLORS.fleet };
  };

  const { Icon, color } = getIconAndColor();

  // Get race type label
  const getRaceTypeLabel = () => {
    if (isDistanceRace) return 'Distance';
    if (isMatchRace) return 'Match';
    if (isTeamRace) return 'Team';
    return 'Fleet';
  };

  if (!template) return null;

  // Get first section title for collapsed preview
  const firstSectionTitle = template.sections?.[0]?.title || 'Mark Rounding';

  // ==========================================================================
  // COLLAPSED VIEW (Apple HIG Design)
  // ==========================================================================
  if (!isExpanded) {
    return (
      <View style={styles.container}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>MARK ROUNDING</Text>
          <View style={[styles.raceTypeBadge, { backgroundColor: `${color}20` }]}>
            <Icon size={12} color={color} />
            <Text style={[styles.raceTypeBadgeText, { color }]}>
              {getRaceTypeLabel()}
            </Text>
          </View>
        </View>

        {/* Strategy Title */}
        <Text style={styles.strategyTitle}>{template.title}</Text>

        {/* Collapsed Content */}
        <View style={styles.collapsedContent}>
          {/* Key Focus Card */}
          <View style={[styles.focusCard, { borderLeftColor: color }]}>
            <Text style={styles.focusLabel}>Key Focus</Text>
            <Text style={styles.focusValue} numberOfLines={2}>
              {firstSectionTitle}
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color }]}>{template.sections?.length || 0}</Text>
              <Text style={styles.statLabel}>Areas</Text>
            </View>
          </View>

          {/* More indicator */}
          <View style={styles.moreIndicatorRow}>
            <Text style={styles.moreIndicatorText}>View full strategy</Text>
            <ChevronDown size={14} color={IOS_COLORS.gray} />
          </View>
        </View>

        {/* Swipe Indicator */}
        <View style={styles.swipeHintBottom}>
          <View style={styles.swipeIndicator} />
        </View>
      </View>
    );
  }

  // ==========================================================================
  // EXPANDED VIEW (Apple HIG Design)
  // ==========================================================================
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>MARK ROUNDING</Text>
        <View style={[styles.raceTypeBadge, { backgroundColor: `${color}20` }]}>
          <Icon size={12} color={color} />
          <Text style={[styles.raceTypeBadgeText, { color }]}>
            {getRaceTypeLabel()}
          </Text>
        </View>
      </View>

      {/* Strategy Title */}
      <Text style={styles.strategyTitle}>{template.title}</Text>

      {/* Template Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <StrategyTemplateRenderer
          template={template}
          race={race}
          enhancedData={enhancedData}
          isEnhancing={isEnhancing}
          onEnhance={handleEnhance}
          showEnhanceButton={true}
          onSectionAction={handleSectionAction}
          userNotes={userNotes}
          onUserNoteChange={handleUserNoteChange}
          savedWatchSchedule={intentions.watchSchedule}
        />
      </ScrollView>

      {/* Swipe Indicator */}
      <View style={styles.swipeHintBottom}>
        <View style={styles.swipeIndicator} />
      </View>

      {/* Watch Schedule Creator Modal */}
      <WatchScheduleCreator
        visible={watchScheduleModalVisible}
        onClose={() => setWatchScheduleModalVisible(false)}
        onSave={handleSaveWatchSchedule}
        raceId={race.id}
        raceName={race.name}
        raceStart={race.start_time}
        estimatedDuration={(race as any).estimated_duration_hours || 12}
      />
    </View>
  );
}

// =============================================================================
// STYLES (Apple HIG Compliant)
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },

  // Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.8,
  },
  raceTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  raceTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Strategy Title
  strategyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 16,
  },

  // Collapsed Content
  collapsedContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },

  // Focus Card
  focusCard: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
  },
  focusLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  focusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
    lineHeight: 22,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginTop: 2,
  },

  // More Indicator
  moreIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
  },
  moreIndicatorText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },

  // Scroll
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },

  // Swipe Indicator
  swipeHintBottom: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeIndicator: {
    width: 36,
    height: 4,
    backgroundColor: IOS_COLORS.gray4,
    borderRadius: 2,
  },
});

export default MarkRoundingCard;
