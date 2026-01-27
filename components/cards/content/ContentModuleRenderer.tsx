/**
 * ContentModuleRenderer Component
 *
 * Maps content module IDs to their corresponding components.
 * Handles error boundaries and loading states for each module.
 */

import React, { Suspense } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  CloudSun,
  Compass,
  Navigation,
  Sailboat,
  Users,
  FileText,
  Timer,
  Waves,
  User,
  Flag,
  Map,
  Trophy,
  BookOpen,
  Share2,
} from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import { RacePhase, CardRaceData } from '@/components/cards/types';
import { AccordionSection } from '@/components/races/AccordionSection';
import { getModuleLabel } from './moduleConfig';
import type { RaceType, ContentModuleId, CONTENT_MODULE_INFO } from '@/types/raceCardContent';

// Import content modules (lazy loaded for performance)
// For now we use placeholder modules, will be replaced with actual implementations
const ConditionsModule = React.lazy(() => import('./modules/ConditionsModule'));
const StrategyModule = React.lazy(() => import('./modules/StrategyModule'));
const CourseModule = React.lazy(() => import('./modules/CourseModule'));
const RigSetupModule = React.lazy(() => import('./modules/RigSetupModule'));
const FleetAnalysisModule = React.lazy(() => import('./modules/FleetAnalysisModule'));
const ChecklistModule = React.lazy(() => import('./modules/ChecklistModule'));
const ShareWithTeamModule = React.lazy(() => import('./modules/ShareWithTeamModule'));

interface ContentModuleRendererProps {
  /** Module ID to render */
  moduleId: ContentModuleId;
  /** Race data */
  race: CardRaceData;
  /** Current race phase */
  phase: RacePhase;
  /** Race type */
  raceType: RaceType;
  /** Whether this module is collapsed */
  isCollapsed: boolean;
  /** Callback to toggle collapse */
  onToggleCollapse: () => void;
  /** Callback to hide this module */
  onHide?: () => void;
}

/**
 * Module loading fallback
 */
function ModuleLoadingFallback() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

/**
 * Get icon component for a module
 */
function getModuleIconComponent(moduleId: ContentModuleId) {
  const iconMap: Record<ContentModuleId, React.ComponentType<any>> = {
    conditions: CloudSun,
    strategy: Compass,
    rig_setup: Sailboat,
    course: Navigation,
    fleet_analysis: Users,
    regulatory: FileText,
    checklist: FileText,
    start_sequence: Timer,
    tide_currents: Waves,
    competitor_notes: User,
    team_assignments: Users,
    match_opponent: Flag,
    distance_waypoints: Map,
    results_preview: Trophy,
    learning_notes: BookOpen,
    share_with_team: Share2,
  };
  return iconMap[moduleId] || FileText;
}

/**
 * Placeholder module for unimplemented modules
 */
function PlaceholderModule({
  moduleId,
  raceType,
}: {
  moduleId: ContentModuleId;
  raceType: RaceType;
}) {
  const label = getModuleLabel(moduleId, raceType);

  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderText}>{label}</Text>
      <Text style={styles.placeholderSubtext}>Coming soon</Text>
    </View>
  );
}

/**
 * Renders a content module based on its ID
 */
export function ContentModuleRenderer({
  moduleId,
  race,
  phase,
  raceType,
  isCollapsed,
  onToggleCollapse,
  onHide,
}: ContentModuleRendererProps) {
  const label = getModuleLabel(moduleId, raceType);

  // DEBUG: Log module rendering
  if (typeof window !== 'undefined' && (window as any).__PERIOD_DEBUG__?.enabled) {
    (window as any).__PERIOD_DEBUG__.log('ContentModuleRenderer', label, { moduleId, raceType, phase, raceId: race.id, isCollapsed });
  }

  // Get the module component based on ID
  const renderModuleContent = () => {
    const moduleProps = {
      race,
      phase,
      raceType,
      isCollapsed,
      onToggleCollapse,
    };

    switch (moduleId) {
      case 'conditions':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <ConditionsModule {...moduleProps} />
          </Suspense>
        );

      case 'strategy':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <StrategyModule {...moduleProps} />
          </Suspense>
        );

      case 'course':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <CourseModule {...moduleProps} />
          </Suspense>
        );

      case 'rig_setup':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <RigSetupModule {...moduleProps} />
          </Suspense>
        );

      case 'fleet_analysis':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <FleetAnalysisModule {...moduleProps} />
          </Suspense>
        );

      case 'checklist':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <ChecklistModule {...moduleProps} />
          </Suspense>
        );

      case 'share_with_team':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <ShareWithTeamModule {...moduleProps} />
          </Suspense>
        );

      // Placeholder for unimplemented modules
      case 'regulatory':
      case 'start_sequence':
      case 'tide_currents':
      case 'competitor_notes':
      case 'team_assignments':
      case 'match_opponent':
      case 'distance_waypoints':
      case 'results_preview':
      case 'learning_notes':
      default:
        return <PlaceholderModule moduleId={moduleId} raceType={raceType} />;
    }
  };

  const IconComponent = getModuleIconComponent(moduleId);

  return (
    <View style={styles.accordionContainer}>
      <AccordionSection
        title={label}
        icon={<IconComponent size={16} color={IOS_COLORS.blue} />}
        defaultExpanded={!isCollapsed}
        onToggle={(expanded) => {
          // AccordionSection reports the new expanded state, but onToggleCollapse expects toggle behavior
          // If the component controls its own state, this callback may just be informational
          onToggleCollapse?.();
        }}
      >
        {renderModuleContent()}
      </AccordionSection>
    </View>
  );
}

const styles = StyleSheet.create({
  accordionContainer: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
  },
  placeholderContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: IOS_COLORS.gray2,
  },
});

export default ContentModuleRenderer;
