/**
 * ContentModuleRenderer Component
 *
 * Maps content module IDs to their corresponding components.
 * Handles error boundaries and loading states for each module.
 */

import React, { Suspense } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import { RacePhase, CardRaceData } from '@/components/cards/types';
import { CollapsibleModule } from './CollapsibleModule';
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

  return (
    <CollapsibleModule
      title={label}
      moduleId={moduleId}
      isCollapsed={isCollapsed}
      onToggle={onToggleCollapse}
      onHide={onHide}
    >
      {renderModuleContent()}
    </CollapsibleModule>
  );
}

const styles = StyleSheet.create({
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
