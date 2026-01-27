/**
 * ExpandedContentZone Component
 *
 * Displays dynamic content modules in the expanded race card.
 * Content varies based on:
 * - Current race phase (days_before, race_morning, on_water, after_race)
 * - Race type (fleet, match, team, distance)
 * - User preferences (order, visibility, collapse state)
 */

import React, { useCallback, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Settings2, FileText, Map, BookOpen } from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import { RacePhase, CardRaceData } from '@/components/cards/types';
import { useContentModules } from '@/hooks/useContentModules';
import { ContentModuleRenderer } from '@/components/cards/content/ContentModuleRenderer';
import { ContentConfigModal } from '@/components/races/ContentConfigModal';
import { AccordionSection } from '@/components/races/AccordionSection';
import { RaceContentActions } from '@/components/races/RaceContentActions';
import { EducationalChecklist } from '@/components/checklist-tools/EducationalChecklist';
import {
  PRE_RACE_PREPARATION_CONFIG,
  COURSE_INTELLIGENCE_CONFIG,
} from '@/lib/educationalChecklistConfig';
import type { RaceType, ContentModuleId } from '@/types/raceCardContent';

interface ExpandedContentZoneProps {
  /** Race data */
  race: CardRaceData;
  /** Current race phase */
  phase: RacePhase;
  /** Race type */
  raceType: RaceType;
  /** Available height for the content zone */
  availableHeight: number;
  /** Optional race ID for per-race preferences */
  raceId?: string;
}

/**
 * Expanded content zone with scrollable, configurable content modules
 */
export function ExpandedContentZone({
  race,
  phase,
  raceType,
  availableHeight,
  raceId,
}: ExpandedContentZoneProps) {
  const [showConfig, setShowConfig] = useState(false);

  // Get resolved modules and controls
  const {
    modules,
    collapsedModules,
    toggleCollapse,
    updateOrder,
    hideModule,
    showModule,
    resetToDefaults,
    isLoading,
    availableModules,
    hiddenModules,
  } = useContentModules({
    phase,
    raceType,
    raceId,
  });

  const handleOpenConfig = useCallback(() => {
    setShowConfig(true);
  }, []);

  const handleCloseConfig = useCallback(() => {
    setShowConfig(false);
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { height: availableHeight }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: availableHeight }]}>
      {/* Header with config button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {getPhaseTitle(phase)} Content
        </Text>
        <TouchableOpacity
          style={styles.configButton}
          onPress={handleOpenConfig}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Settings2 size={16} color={IOS_COLORS.gray} />
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Scrollable content modules */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={Platform.OS === 'android'}
      >
        {modules.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No content modules configured
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={handleOpenConfig}
            >
              <Text style={styles.emptyStateButtonText}>Configure</Text>
            </TouchableOpacity>
          </View>
        ) : (
          modules.map((moduleId) => (
            <ContentModuleRenderer
              key={moduleId}
              moduleId={moduleId}
              race={race}
              phase={phase}
              raceType={raceType}
              isCollapsed={collapsedModules.has(moduleId)}
              onToggleCollapse={() => toggleCollapse(moduleId)}
              onHide={() => hideModule(moduleId)}
            />
          ))
        )}

        {/* Sailor Discovery - Prep Notes & Post-Race Analysis */}
        <AccordionSection
          title="Your Race Notes"
          icon={<BookOpen size={16} color={IOS_COLORS.purple} />}
          defaultExpanded
          subtitle="Share prep & analysis with fleet"
        >
          <RaceContentActions
            regattaId={raceId || race.id}
            raceName={race.name}
            raceDate={race.startDate as string | Date | undefined}
          />
        </AccordionSection>

        {/* Educational Checklists */}
        <View style={styles.checklistsContainer}>
          <AccordionSection
            title="Pre-Race Preparation"
            icon={<FileText size={16} color={IOS_COLORS.blue} />}
            defaultExpanded
            subtitle="Documents & communications"
          >
            <EducationalChecklist
              config={PRE_RACE_PREPARATION_CONFIG}
              raceId={raceId || race.id}
            />
          </AccordionSection>

          <AccordionSection
            title="Course Intelligence"
            icon={<Map size={16} color={IOS_COLORS.green} />}
            defaultExpanded
            subtitle="Course analysis & strategy"
          >
            <EducationalChecklist
              config={COURSE_INTELLIGENCE_CONFIG}
              raceId={raceId || race.id}
            />
          </AccordionSection>
        </View>
      </ScrollView>

      {/* Configuration modal */}
      <ContentConfigModal
        visible={showConfig}
        onClose={handleCloseConfig}
        phase={phase}
        raceType={raceType}
        currentModules={modules}
        availableModules={availableModules}
        hiddenModules={hiddenModules}
        onUpdateOrder={updateOrder}
        onShowModule={showModule}
        onHideModule={hideModule}
        onResetDefaults={resetToDefaults}
      />
    </View>
  );
}

/**
 * Get human-readable title for a phase
 */
function getPhaseTitle(phase: RacePhase): string {
  switch (phase) {
    case 'days_before':
      return 'Preparation';
    case 'on_water':
      return 'On Water';
    case 'after_race':
      return 'Post Race';
    default:
      return 'Race';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  configButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: IOS_COLORS.gray6,
  },
  divider: {
    height: 1,
    backgroundColor: IOS_COLORS.gray5,
    marginBottom: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    marginBottom: 12,
  },
  emptyStateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.systemBackground,
  },
  checklistsContainer: {
    marginTop: 16,
    gap: 8,
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default ExpandedContentZone;
