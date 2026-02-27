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
  ClipboardList,
  Heart,
  Activity,
  Stethoscope,
  Syringe,
  Clock,
  MessageSquare,
  Shield,
  Brain,
  Pen,
  Palette,
  Camera,
  Image,
  Ruler,
  Eye,
  Layers,
  Dumbbell,
  Flame,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
} from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import { RacePhase, CardRaceData } from '@/components/cards/types';
import { AccordionSection } from '@/components/races/AccordionSection';
import { getModuleLabelForInterest } from './moduleConfig';
import { useInterestEventConfig } from '@/hooks/useInterestEventConfig';
import type { RaceType, ContentModuleId } from '@/types/raceCardContent';

// Import content modules (lazy loaded for performance)
// For now we use placeholder modules, will be replaced with actual implementations
const ConditionsModule = React.lazy(() => import('./modules/ConditionsModule'));
const StrategyModule = React.lazy(() => import('./modules/StrategyModule'));
const CourseModule = React.lazy(() => import('./modules/CourseModule'));
const RigSetupModule = React.lazy(() => import('./modules/RigSetupModule'));
const FleetAnalysisModule = React.lazy(() => import('./modules/FleetAnalysisModule'));
const ChecklistModule = React.lazy(() => import('./modules/ChecklistModule'));
const ShareWithTeamModule = React.lazy(() => import('./modules/ShareWithTeamModule'));
const CompetencyLogModule = React.lazy(() => import('./modules/CompetencyLogModule'));

// Nursing content modules
const PatientOverviewModule = React.lazy(() => import('./modules/nursing/PatientOverviewModule'));
const MedicationsModule = React.lazy(() => import('./modules/nursing/MedicationsModule'));
const ProceduresModule = React.lazy(() => import('./modules/nursing/ProceduresModule'));
const ClinicalObjectivesModule = React.lazy(() => import('./modules/nursing/ClinicalObjectivesModule'));

// Drawing content modules
const ReferenceImagesModule = React.lazy(() => import('./modules/drawing/ReferenceImagesModule'));
const CompositionModule = React.lazy(() => import('./modules/drawing/CompositionModule'));
const TechniqueFocusModule = React.lazy(() => import('./modules/drawing/TechniqueFocusModule'));
const MaterialsModule = React.lazy(() => import('./modules/drawing/MaterialsModule'));

// Fitness content modules
const WorkoutPlanModule = React.lazy(() => import('./modules/fitness/WorkoutPlanModule'));
const WarmupModule = React.lazy(() => import('./modules/fitness/WarmupModule'));
const NutritionModule = React.lazy(() => import('./modules/fitness/NutritionModule'));
const GoalsModule = React.lazy(() => import('./modules/fitness/GoalsModule'));

interface ContentModuleRendererProps {
  /** Module ID to render */
  moduleId: ContentModuleId;
  /** Race data */
  race: CardRaceData;
  /** Current race phase */
  phase: RacePhase;
  /** Race type or event subtype */
  raceType: RaceType;
  /** Whether this module is collapsed */
  isCollapsed: boolean;
  /** Callback to toggle collapse */
  onToggleCollapse: () => void;
  /** Callback to hide this module */
  onHide?: () => void;
  /** Optional explicit event subtype ID for label overrides */
  subtypeId?: string;
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
 * Get icon component for a module.
 * Covers sailing module IDs + common nursing/drawing/fitness module IDs.
 */
function getModuleIconComponent(moduleId: string): React.ComponentType<any> {
  const iconMap: Record<string, React.ComponentType<any>> = {
    // Sailing modules
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

    // Nursing modules
    patient_overview: ClipboardList,
    medications: Syringe,
    procedures: Activity,
    clinical_objectives: Target,
    lab_values: BarChart3,
    care_plan: FileText,
    unit_protocols: Shield,
    preceptor_goals: User,
    drug_reference: BookOpen,
    share_with_preceptor: Share2,
    time_log: Clock,
    competency_log: Trophy,
    preceptor_feedback: MessageSquare,
    clinical_hours: Clock,

    // Drawing modules
    reference_images: Image,
    composition: Layers,
    technique_focus: Pen,
    materials: Palette,
    color_study: Palette,
    value_study: Eye,
    artist_study: BookOpen,
    time_plan: Clock,
    share_with_instructor: Share2,
    timer: Timer,
    progress_photos: Camera,
    instructor_feedback: MessageSquare,
    portfolio_tag: Flag,

    // Fitness modules
    workout_plan: Dumbbell,
    warmup: Flame,
    nutrition: Heart,
    goals: Target,
    previous_session: TrendingUp,
    body_status: Activity,
    program_context: BarChart3,
    share_with_coach: Share2,
    program_adjustments: Zap,
  };
  return iconMap[moduleId] || FileText;
}

/**
 * Placeholder module for unimplemented modules.
 * Shows the module label and description from the interest config.
 */
function PlaceholderModule({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderText}>{label}</Text>
      {description ? (
        <Text style={styles.placeholderSubtext}>{description}</Text>
      ) : (
        <Text style={styles.placeholderSubtext}>Coming soon</Text>
      )}
    </View>
  );
}

/**
 * Renders a content module based on its ID.
 * Interest-aware: uses the current interest's event config for labels and icons.
 */
export function ContentModuleRenderer({
  moduleId,
  race,
  phase,
  raceType,
  isCollapsed,
  onToggleCollapse,
  onHide,
  subtypeId,
}: ContentModuleRendererProps) {
  const eventConfig = useInterestEventConfig();
  const label = getModuleLabelForInterest(eventConfig, moduleId, subtypeId ?? raceType);

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

      case 'competency_log':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <CompetencyLogModule {...moduleProps} />
          </Suspense>
        );

      case 'learning_notes':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <CompetencyLogModule {...moduleProps} />
          </Suspense>
        );

      // ---- Nursing modules ----
      case 'patient_overview':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <PatientOverviewModule {...moduleProps} />
          </Suspense>
        );

      case 'medications':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <MedicationsModule {...moduleProps} />
          </Suspense>
        );

      case 'procedures':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <ProceduresModule {...moduleProps} />
          </Suspense>
        );

      case 'clinical_objectives':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <ClinicalObjectivesModule {...moduleProps} />
          </Suspense>
        );

      // ---- Drawing modules ----
      case 'reference_images':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <ReferenceImagesModule {...moduleProps} />
          </Suspense>
        );

      case 'composition':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <CompositionModule {...moduleProps} />
          </Suspense>
        );

      case 'technique_focus':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <TechniqueFocusModule {...moduleProps} />
          </Suspense>
        );

      case 'materials':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <MaterialsModule {...moduleProps} />
          </Suspense>
        );

      // ---- Fitness modules ----
      case 'workout_plan':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <WorkoutPlanModule {...moduleProps} />
          </Suspense>
        );

      case 'warmup':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <WarmupModule {...moduleProps} />
          </Suspense>
        );

      case 'nutrition':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <NutritionModule {...moduleProps} />
          </Suspense>
        );

      case 'goals':
        return (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <GoalsModule {...moduleProps} />
          </Suspense>
        );

      // Placeholder for unimplemented modules (sailing + all other interests)
      case 'regulatory':
      case 'start_sequence':
      case 'tide_currents':
      case 'competitor_notes':
      case 'team_assignments':
      case 'match_opponent':
      case 'distance_waypoints':
      case 'results_preview':
      default: {
        const moduleInfo = eventConfig.moduleInfo[moduleId as string];
        return <PlaceholderModule label={label} description={moduleInfo?.description} />;
      }
    }
  };

  const IconComponent = getModuleIconComponent(moduleId as string);

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
