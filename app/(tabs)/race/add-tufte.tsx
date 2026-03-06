/**
 * Add Race Screen - Consolidated
 *
 * Single unified screen for adding races, combining the best features from all previous implementations:
 * - TufteAddRaceForm: All 4 race types, location map picker, boat selector, PDF upload
 * - add-tufte.tsx (original): Route waypoint map editing, Tufte design
 * - add-next-race.tsx: Club event auto-suggestion
 *
 * Design Philosophy (Edward Tufte):
 * - Maximize data-ink ratio
 * - Confidence shown as subtle marginalia
 * - Typography does the heavy lifting
 */

import { useFocusEffect } from '@react-navigation/native';
import { addDays, format } from 'date-fns';
import * as Clipboard from 'expo-clipboard';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Map,
  MapPin,
  Navigation,
  Sailboat,
  Trophy,
  Users,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';
import { BoatSelector } from '@/components/races/AddRaceDialog/BoatSelector';
import { CourseSelector } from '@/components/races/AddRaceDialog/CourseSelector';
import { ExtractedDetailsData, ExtractedDetailsSummary } from '@/components/races/AddRaceDialog/ExtractedDetailsSummary';
import type { ExtractedData, MultiRaceExtractedData } from '@/components/races/AIValidationScreen';
import { CoursePositionEditor } from '@/components/races/CoursePositionEditor';
import { DistanceRouteMap } from '@/components/races/DistanceRouteMap';
import { LocationMapPicker } from '@/components/races/LocationMapPicker';
import type { CourseType as PositionedCourseType, PositionedCourse } from '@/types/courses';
import { MultiRaceSelectionScreen } from '@/components/races/MultiRaceSelectionScreen';
import { RaceSuggestionChips } from '@/components/races/RaceSuggestionChips';
import { RaceSuggestionsDrawer } from '@/components/races/RaceSuggestionsDrawer';
import { createLogger } from '@/lib/utils/logger';
import { useAuth } from '@/providers/AuthProvider';
import { useRaceSuggestions } from '@/hooks/useRaceSuggestions';
import { extractSuggestionFailureSources } from '@/hooks/useRaceSuggestions.errors';
import { UnifiedDocumentInput } from '@/components/documents/UnifiedDocumentInput';
import { supabase } from '@/services/supabase';
import type { RaceSuggestion } from '@/services/RaceSuggestionService';

import type { RaceType } from '@/components/races/RaceTypeSelector';
import { useInterest } from '@/providers/InterestProvider';
import { useInterestEventConfig } from '@/hooks/useInterestEventConfig';
import { useActivityCatalog } from '@/hooks/useActivityCatalog';
import { ActivityCatalog } from '@/components/events/ActivityCatalog';
import { TemplatePreview } from '@/components/events/TemplatePreview';
import type { ActivityTemplate } from '@/types/activities';
import type { EventSubtypeConfig, EventFormField } from '@/types/interestEventConfig';

const logger = createLogger('AddRaceScreen');

// =============================================================================
// DESIGN TOKENS
// =============================================================================

const COLORS = {
  background: TUFTE_BACKGROUND,
  ink: '#1a1a1a',
  secondary: '#666666',
  tertiary: '#999999',
  accent: IOS_COLORS.blue,
  success: '#2D6A4F',
  warning: '#B8860B',
  error: '#BC4749',
  separator: 'rgba(0,0,0,0.08)',
  inputBg: '#FFFFFF',
  inputBorder: '#E5E5E5',
};

const RACE_TYPE_CONFIG: Record<RaceType, { label: string; icon: any; color: string; description: string }> = {
  fleet: { label: 'Fleet', icon: Sailboat, color: '#0066CC', description: 'Buoy/mark racing' },
  distance: { label: 'Distance', icon: Navigation, color: '#059669', description: 'Offshore/passage' },
  match: { label: 'Match', icon: Trophy, color: '#7C3AED', description: '1v1 racing' },
  team: { label: 'Team', icon: Users, color: '#DC2626', description: 'Team vs team' },
};

const SUGGESTION_SOURCE_HINTS: Record<string, string> = {
  club_events: 'club_members -> club_events',
  fleet_races: 'fleet_members -> fleet/boat class races',
  community_races: 'club_members -> regattas(created_by co-members)',
  catalog_matches: 'sailor_boats + race_catalog + saved_catalog_races',
  previous_year: 'regattas(start_date history)',
  patterns: 'regattas -> race_patterns',
  templates: 'race_templates',
};

// Helper function to map course type string to PositionedCourseType
function mapCourseTypeToPositionedType(courseType: string): PositionedCourseType {
  const typeMap: Record<string, PositionedCourseType> = {
    'windward/leeward': 'windward_leeward',
    'windward_leeward': 'windward_leeward',
    'triangle': 'triangle',
    'olympic': 'olympic',
    'trapezoid': 'trapezoid',
  };
  return typeMap[courseType.toLowerCase()] || 'windward_leeward';
}

// =============================================================================
// TYPES
// =============================================================================

interface RouteWaypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'start' | 'waypoint' | 'gate' | 'finish';
  required: boolean;
}

interface CourseMark {
  name: string;
  latitude?: number;
  longitude?: number;
  type: string;
  color?: string;
  shape?: string;
}

interface FormState {
  // Core fields
  raceType: RaceType;
  /** Interest-specific event subtype (e.g., 'clinical_shift', 'drawing_session') */
  eventSubtype: string;
  /** Dynamic field values from config-driven form fields */
  subtypeFields: Record<string, string>;
  name: string;
  date: string;
  time: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  vhfChannel: string;
  notes: string;
  // Boat selection
  boatId: string | null;
  classId: string | null;
  boatClassName: string | null;
  // Fleet-specific
  courseType: string;
  numberOfLaps: string;
  expectedFleetSize: string;
  boatClass: string;
  // Distance-specific
  totalDistanceNm: string;
  timeLimitHours: string;
  routeDescription: string;
  // Match-specific
  opponentName: string;
  matchRound: string;
  // Team-specific
  yourTeamName: string;
  opponentTeamName: string;
  teamSize: string;
  // Route/Course data
  routeWaypoints: RouteWaypoint[];
  marks: CourseMark[];
  // AI extraction state
  aiExpanded: boolean;
  aiInputText: string;
  aiInputMethod: 'paste' | 'upload' | 'url';
  aiSelectedFile: DocumentPickerAsset | null;
  aiExtractedFields: Set<string>;
  extractionComplete: boolean;
  // Extracted details from AI (for display and saving)
  extractedDetails: ExtractedDetailsData | null;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function AddRaceScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    templateId?: string;
    templateTitle?: string;
    templateDescription?: string;
    templateStepType?: string;
    templateModuleIds?: string;
    templateSuggestedCompetencyIds?: string;
  }>();
  const { user, isGuest } = useAuth();
  const { currentInterest } = useInterest();
  const eventConfig = useInterestEventConfig();

  // Activity catalog from followed orgs & coaches
  const {
    templates: catalogTemplates,
    isLoading: catalogLoading,
    enroll: enrollInCatalogTemplate,
  } = useActivityCatalog();

  // Template preview state
  const [previewTemplate, setPreviewTemplate] = useState<ActivityTemplate | null>(null);

  // Derive the interest-aware header title
  const headerTitle = useMemo(() => {
    const slug = currentInterest?.slug;
    if (!slug || slug === 'sail-racing') return 'Add Race';
    if (slug === 'nursing') return 'Add Shift';
    if (slug === 'drawing') return 'Add Session';
    if (slug === 'fitness') return 'Add Workout';
    return 'Add Event';
  }, [currentInterest?.slug]);

  // Form state
  const isSailing = !currentInterest?.slug || currentInterest.slug === 'sail-racing';

  const getInitialState = (): FormState => ({
    raceType: 'fleet',
    eventSubtype: isSailing ? '' : (eventConfig.eventSubtypes[0]?.id ?? ''),
    subtypeFields: {},
    name: '',
    date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    time: '12:00',
    location: '',
    latitude: null,
    longitude: null,
    vhfChannel: '',
    notes: '',
    boatId: null,
    classId: null,
    boatClassName: null,
    courseType: '',
    numberOfLaps: '',
    expectedFleetSize: '',
    boatClass: '',
    totalDistanceNm: '',
    timeLimitHours: '',
    routeDescription: '',
    opponentName: '',
    matchRound: '',
    yourTeamName: '',
    opponentTeamName: '',
    teamSize: '',
    routeWaypoints: [],
    marks: [],
    aiExpanded: true,
    aiInputText: '',
    aiInputMethod: 'paste',
    aiSelectedFile: null,
    aiExtractedFields: new Set(),
    extractionComplete: false,
    extractedDetails: null,
  });

  const [form, setForm] = useState<FormState>(getInitialState());
  const [isSaving, setIsSaving] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [showSuggestionDiagnostics, setShowSuggestionDiagnostics] = useState(false);

  // Race suggestions from the full suggestion engine
  const {
    suggestions,
    diagnostics: suggestionDiagnostics,
    loading: suggestionsLoading,
    error: suggestionsError,
    refresh: refreshSuggestions,
    acceptSuggestion,
    dismissSuggestion,
  } = useRaceSuggestions();

  const suggestionFailureSources = useMemo(() => {
    return extractSuggestionFailureSources(
      suggestionDiagnostics?.failedSources,
      suggestionsError?.message
    );
  }, [suggestionDiagnostics?.failedSources, suggestionsError?.message]);
  const copySuggestionDiagnostics = useCallback(async () => {
    if (!suggestionsError) return;
    const lines = [
      `Last error: ${suggestionsError.message}`,
      'Query path: race_suggestions_cache -> source generators -> race_suggestions_cache upsert',
      ...(suggestionFailureSources.length > 0
        ? suggestionFailureSources.map(
            (source) => `${source}: ${SUGGESTION_SOURCE_HINTS[source] || 'unknown source path'}`
          )
        : ['Source-level failure details unavailable.']),
    ];
    try {
      await Clipboard.setStringAsync(lines.join('\n'));
      Alert.alert('Copied', 'Suggestion diagnostics copied to clipboard.');
    } catch (_error) {
      Alert.alert('Copy failed', 'Clipboard is unavailable on this device.');
    }
  }, [suggestionsError, suggestionFailureSources]);

  // Multi-race detection state
  const [showMultiRaceModal, setShowMultiRaceModal] = useState(false);
  const [multiRaceData, setMultiRaceData] = useState<MultiRaceExtractedData | null>(null);
  const [isCreatingMultiple, setIsCreatingMultiple] = useState(false);

  // Course position editor state
  const [showCoursePositionEditor, setShowCoursePositionEditor] = useState(false);
  const [positionedCourse, setPositionedCourse] = useState<PositionedCourse | null>(null);
  const hasAppliedRouteTemplateRef = useRef(false);

  const routeTemplatePrefill = useMemo(() => {
    const parseListParam = (value?: string): string[] => {
      if (!value) return [];
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.filter((entry) => typeof entry === 'string').map((entry) => entry.trim()).filter(Boolean);
        }
      } catch {
        // ignore parse failure; fallback to empty
      }
      return [];
    };

    return {
      id: typeof searchParams.templateId === 'string' ? searchParams.templateId : '',
      title: typeof searchParams.templateTitle === 'string' ? searchParams.templateTitle : '',
      description: typeof searchParams.templateDescription === 'string' ? searchParams.templateDescription : '',
      stepType: typeof searchParams.templateStepType === 'string' ? searchParams.templateStepType : '',
      moduleIds: parseListParam(searchParams.templateModuleIds),
      suggestedCompetencyIds: parseListParam(searchParams.templateSuggestedCompetencyIds),
    };
  }, [
    searchParams.templateDescription,
    searchParams.templateId,
    searchParams.templateModuleIds,
    searchParams.templateStepType,
    searchParams.templateSuggestedCompetencyIds,
    searchParams.templateTitle,
  ]);

  // Reset form when screen is focused
  useFocusEffect(
    useCallback(() => {
      hasAppliedRouteTemplateRef.current = false;
      setForm(getInitialState());
      setIsSaving(false);
      setCalculatedDistance(null);
      setShowRouteMap(false);
      setShowCoursePositionEditor(false);
      setPositionedCourse(null);
      setShowAllSuggestions(false);
      logger.debug('[AddRaceScreen] Form reset on focus');
    }, [])
  );

  useEffect(() => {
    if (hasAppliedRouteTemplateRef.current) return;
    if (!routeTemplatePrefill.title && !routeTemplatePrefill.stepType && routeTemplatePrefill.moduleIds.length === 0) return;

    const updates: Partial<FormState> = {};
    if (routeTemplatePrefill.title) {
      updates.name = routeTemplatePrefill.title;
    }
    if (!isSailing && routeTemplatePrefill.stepType) {
      const matchingSubtype = eventConfig.eventSubtypes.find((entry) => entry.id === routeTemplatePrefill.stepType);
      if (matchingSubtype) {
        updates.eventSubtype = matchingSubtype.id;
      }
    }
    if (!isSailing && routeTemplatePrefill.description) {
      updates.subtypeFields = {
        learning_objectives: routeTemplatePrefill.description,
      };
    }
    if (routeTemplatePrefill.description) {
      updates.notes = routeTemplatePrefill.description;
    }

    hasAppliedRouteTemplateRef.current = true;
    setForm((prev) => ({
      ...prev,
      ...updates,
      subtypeFields: {
        ...prev.subtypeFields,
        ...(updates.subtypeFields || {}),
      },
    }));
  }, [eventConfig.eventSubtypes, isSailing, routeTemplatePrefill]);

  // Apply a suggestion from the suggestion engine to the form
  const applySuggestion = useCallback((suggestion: RaceSuggestion) => {
    const data = suggestion.raceData;
    const updates: Partial<FormState> = {};

    if (data.raceName) updates.name = data.raceName;
    if (data.startDate) {
      const dateStr = data.startDate.split('T')[0];
      if (dateStr) updates.date = dateStr;
      const timeStr = data.startDate.includes('T')
        ? data.startDate.split('T')[1]?.substring(0, 5)
        : data.time;
      if (timeStr) updates.time = timeStr;
    }
    if (data.time && !updates.time) updates.time = data.time;
    if (data.venue || data.location) updates.location = data.venue || data.location || '';
    if (data.boatClass) updates.boatClass = data.boatClass;
    if (data.raceType && ['fleet', 'distance', 'match', 'team'].includes(data.raceType)) {
      updates.raceType = data.raceType as RaceType;
    }
    if (data.vhfChannel) updates.vhfChannel = data.vhfChannel;
    if (data.totalDistanceNm) updates.totalDistanceNm = data.totalDistanceNm.toString();
    if (data.timeLimitHours) updates.timeLimitHours = data.timeLimitHours.toString();
    if (data.routeDescription) updates.routeDescription = data.routeDescription;
    if (data.courseType) updates.courseType = data.courseType;

    setForm(prev => ({ ...prev, ...updates }));

    // Record acceptance
    acceptSuggestion(suggestion.id);
    logger.debug('[AddRaceScreen] Applied suggestion:', suggestion.id, suggestion.type);
  }, [acceptSuggestion]);

  // Handle suggestion dismissal
  const handleDismissSuggestion = useCallback((suggestionId: string) => {
    dismissSuggestion(suggestionId);
    logger.debug('[AddRaceScreen] Dismissed suggestion:', suggestionId);
  }, [dismissSuggestion]);

  // Update form field
  const updateField = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle boat selection
  const handleBoatSelect = useCallback((boatId: string | null, classId: string | null, className: string | null) => {
    setForm(prev => ({
      ...prev,
      boatId,
      classId,
      boatClassName: className,
      boatClass: className || prev.boatClass,
    }));
  }, []);

  // Handle multi-race selection confirmation
  const handleMultiRaceConfirm = useCallback(async (selectedRaces: ExtractedData[]) => {
    if (!selectedRaces.length) {
      setShowMultiRaceModal(false);
      return;
    }

    // If only one race selected, apply to form like single extraction
    if (selectedRaces.length === 1) {
      const race = selectedRaces[0];
      const aiFields = new Set<string>();
      const updates: Partial<FormState> = {};

      if (race.raceName) { updates.name = race.raceName; aiFields.add('name'); }
      if (race.raceDate) { updates.date = race.raceDate; aiFields.add('date'); }
      if (race.warningSignalTime) { updates.time = race.warningSignalTime; aiFields.add('time'); }
      if (race.venue) { updates.location = race.venue; aiFields.add('location'); }

      setForm(prev => ({
        ...prev,
        ...updates,
        aiExtractedFields: aiFields,
        extractionComplete: true,
      }));

      setShowMultiRaceModal(false);
      setMultiRaceData(null);
      logger.debug('[AddRaceScreen] Applied single race from multi-race selection');
      return;
    }

    // Multiple races selected - create all in database
    if (!user?.id || isGuest) {
      if (Platform.OS === 'web') {
        window.alert('Please sign up to create multiple races at once.');
      } else {
        Alert.alert(
          'Sign Up Required',
          'Please sign up to create multiple races at once.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Up', onPress: () => router.push('/(auth)/signup') }
          ]
        );
      }
      return;
    }

    setIsCreatingMultiple(true);
    try {
      const createdRaces: string[] = [];

      for (const race of selectedRaces) {
        // Normalize time format
        const time = race.warningSignalTime || '12:00';
        const normalizedTime = time.includes(':')
          ? time
          : `${time.slice(0, 2)}:${time.slice(2)}`;
        const startTime = `${race.raceDate}T${normalizedTime}:00`;

        // Build comprehensive race data from extracted NOR fields
        const raceData: Record<string, any> = {
          // === BASIC INFO ===
          name: race.raceName || 'Untitled Race',
          start_date: startTime,
          created_by: user.id,
          status: 'planned',
          race_type: race.raceType || 'distance',
          start_area_name: race.venue || race.venueVariant || race.startAreaName || null,

          // === COMMUNICATIONS ===
          vhf_channel: race.vhfChannel || (race.vhfChannels?.[0]?.channel) || null,
        };

        // === ENTRY & REGISTRATION ===
        if (race.entryFees?.length) raceData.entry_fees = race.entryFees;
        if (race.entryDeadline) raceData.entry_deadline = race.entryDeadline;

        // === CREW & SAFETY ===
        if (race.minimumCrew) raceData.minimum_crew = race.minimumCrew;
        if (race.crewRequirements) raceData.crew_requirements = race.crewRequirements;
        if (race.safetyRequirements) raceData.safety_requirements = race.safetyRequirements;
        if (race.retirementNotification) raceData.retirement_notification = race.retirementNotification;

        // === SCHEDULE ===
        if (race.schedule?.length) raceData.schedule = race.schedule;

        // === COURSE DETAILS ===
        if (race.prohibitedAreas?.length) raceData.prohibited_areas = race.prohibitedAreas;
        if (race.tideGates?.length) raceData.tide_gates = race.tideGates;
        if (race.startAreaDescription) raceData.start_area_description = race.startAreaDescription;

        // === SCORING ===
        if (race.scoringFormulaDescription || race.scoringSystem) {
          raceData.scoring_formula = race.scoringFormulaDescription || race.scoringSystem;
        }
        if (race.handicapSystem?.length) raceData.handicap_systems = race.handicapSystem;

        // === MOTORING DIVISION ===
        if (race.motoringDivisionAvailable !== undefined) raceData.motoring_division_available = race.motoringDivisionAvailable;
        if (race.motoringDivisionRules) raceData.motoring_division_rules = race.motoringDivisionRules;

        // === COMMUNICATIONS (detailed) ===
        if (race.vhfChannels?.length) raceData.vhf_channels = race.vhfChannels;

        // === ORGANIZATION ===
        if (race.organizingAuthority || multiRaceData?.organizingAuthority) {
          raceData.organizing_authority = race.organizingAuthority || multiRaceData?.organizingAuthority;
        }
        if (race.eventWebsite) raceData.event_website = race.eventWebsite;
        if (race.contactEmail) raceData.contact_email = race.contactEmail;

        // === WEATHER ===
        if (race.expectedConditions) raceData.expected_conditions = race.expectedConditions;
        if (race.expectedWindDirection) raceData.expected_wind_direction = race.expectedWindDirection;
        if (race.expectedWindSpeedMin) raceData.expected_wind_speed_min = race.expectedWindSpeedMin;
        if (race.expectedWindSpeedMax) raceData.expected_wind_speed_max = race.expectedWindSpeedMax;

        // === INSURANCE ===
        if (race.insuranceRequirements) raceData.insurance_requirements = race.insuranceRequirements;

        // === PRIZES ===
        if (race.prizesDescription) raceData.prizes_description = race.prizesDescription;

        // === METADATA (for fields that don't have dedicated columns) ===
        raceData.metadata = {
          venue_name: race.venue || null,
          created_from_multi_race: true,
          document_type: multiRaceData?.documentType,
          // Racing rules stored in metadata
          racing_rules_system: race.racingRulesSystem,
          prescriptions: race.prescriptions,
          class_rules: race.classRules,
          ssi_reference: race.ssiReference,
          course_attachment_reference: race.courseAttachmentReference,
          // Eligibility
          eligibility_requirements: race.eligibilityRequirements,
          entry_form_url: race.entryFormUrl,
          sign_on_requirement: race.signOnRequirement,
          crew_list_requirement: race.crewListRequirement,
          safety_briefing_required: race.safetyBriefingRequired,
          // Class & Fleet
          boat_class: race.boatClass,
          class_divisions: race.classDivisions,
          // Course
          course_area: race.courseArea,
          course_selection_criteria: race.courseSelectionCriteria,
          course_description: race.courseDescription,
          potential_courses: race.potentialCourses,
          // Scoring details
          discards_policy: race.discardsPolicy,
          series_races_required: race.seriesRacesRequired,
          // Safety details
          safety_consequences: race.safetyConsequences,
          insurance_required: race.insuranceRequired,
          minimum_insurance_coverage: race.minimumInsuranceCoverage,
          // Race officer & officials
          race_officer: race.raceOfficer,
          class_secretary: race.classSecretary,
          organizer: race.organizer,
          special_designations: race.specialDesignations,
          // Start lines
          start_lines: race.startLines,
          // Series info
          race_series_name: race.raceSeriesName,
          race_number: race.raceNumber,
          total_races_in_series: race.totalRacesInSeries,
          races_per_day: race.racesPerDay,
        };

        const { data: newRace, error } = await supabase
          .from('regattas')
          .insert(raceData)
          .select()
          .single();

        if (error) {
          logger.error('[AddRaceScreen] Failed to create race:', error);
        } else if (newRace) {
          createdRaces.push(newRace.id);
        }
      }

      logger.debug('[AddRaceScreen] Created multiple races:', createdRaces.length);

      if (createdRaces.length > 0) {
        const message = `Successfully created ${createdRaces.length} race${createdRaces.length > 1 ? 's' : ''}.`;
        if (Platform.OS === 'web') {
          window.alert(`Races Created!\n\n${message}`);
          router.replace('/(tabs)/races');
        } else {
          Alert.alert(
            'Races Created!',
            message,
            [{ text: 'View Races', onPress: () => router.replace('/(tabs)/races') }]
          );
        }
      }
    } catch (err) {
      console.error('[handleMultiRaceConfirm] Multi-race creation failed:', err);
      logger.error('[AddRaceScreen] Multi-race creation failed:', err);
      if (Platform.OS === 'web') {
        window.alert('Error: Failed to create races');
      } else {
        Alert.alert('Error', 'Failed to create races');
      }
    } finally {
      setIsCreatingMultiple(false);
      setShowMultiRaceModal(false);
      setMultiRaceData(null);
    }
  }, [user?.id, isGuest, router, multiRaceData]);

  // Handle multi-race modal cancel
  const handleMultiRaceCancel = useCallback(() => {
    setShowMultiRaceModal(false);
    setMultiRaceData(null);
  }, []);

  // Handle location selection
  const handleLocationSelect = useCallback((location: { name: string; lat: number; lng: number }) => {
    setForm(prev => ({
      ...prev,
      location: location.name,
      latitude: location.lat,
      longitude: location.lng,
    }));
    setShowLocationPicker(false);
  }, []);

  // Handle route waypoints change
  const handleWaypointsChange = useCallback((waypoints: RouteWaypoint[]) => {
    setForm(prev => ({ ...prev, routeWaypoints: waypoints }));
  }, []);

  // Validation
  const isFormValid = useMemo(() => {
    if (!form.name.trim() || !form.date || !form.time) return false;
    if (isSailing) {
      if (form.raceType === 'match' && !form.opponentName.trim()) return false;
      if (form.raceType === 'team' && (!form.yourTeamName.trim() || !form.opponentTeamName.trim())) return false;
    } else {
      // For non-sailing: validate required subtype fields
      if (!form.eventSubtype) return false;
      const subtypeConfig = eventConfig.eventSubtypes.find(s => s.id === form.eventSubtype);
      // Fields covered by the main form (date/time pickers) — skip in subtype validation
      const mainFormFields = new Set(['date', 'start_time', 'end_time']);
      if (subtypeConfig?.formFields) {
        for (const field of subtypeConfig.formFields) {
          if (mainFormFields.has(field.id)) continue;
          if (field.required && !form.subtypeFields[field.id]?.trim()) return false;
        }
      }
    }
    return true;
  }, [form, isSailing, eventConfig]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!isFormValid || isSaving) return;
    // For non-guests, we still need a user ID
    if (!isGuest && !user?.id) return;

    setIsSaving(true);
    try {
      // Normalize time format - handle both "10:30" and "1030" formats
      const normalizedTime = form.time.includes(':')
        ? form.time
        : `${form.time.slice(0, 2)}:${form.time.slice(2)}`;
      const startTime = `${form.date}T${normalizedTime}:00`;

      // Build metadata
      const metadata: Record<string, any> = {
        venue_name: form.location || null,
        interest_id: currentInterest?.id ?? null,
      };

      if (routeTemplatePrefill.id) {
        metadata.org_template_id = routeTemplatePrefill.id;
      }
      if (routeTemplatePrefill.title) {
        metadata.org_template_title = routeTemplatePrefill.title;
      }
      if (routeTemplatePrefill.description) {
        metadata.org_template_description = routeTemplatePrefill.description;
      }
      if (routeTemplatePrefill.moduleIds.length > 0) {
        metadata.org_template_module_ids = routeTemplatePrefill.moduleIds;
      }
      if (routeTemplatePrefill.suggestedCompetencyIds.length > 0) {
        metadata.org_template_suggested_competency_ids = routeTemplatePrefill.suggestedCompetencyIds;
      }

      // Guest Restriction: Prevent saving for guests and prompt to sign up
      if (isGuest || !user?.id) {
        Alert.alert(
          'Sign Up Required',
          'Please sign up to create and save races, and access advanced features like AI extraction and weather integration.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign Up',
              onPress: () => router.push('/(auth)/signup')
            }
          ]
        );
        setIsSaving(false);
        return;
      }

      // Authenticated User Saving Logic (Supabase)
      // Build race data
      const raceData: Record<string, any> = {
        name: form.name.trim(),
        start_date: startTime,
        created_by: user.id,
        status: 'planned',
        race_type: isSailing ? form.raceType : null,
        vhf_channel: isSailing ? (form.vhfChannel || null) : null,
      };

      // ... (rest of the existing Supabase logic) ...

      // Add location name
      if (form.location) {
        raceData.start_area_name = form.location;
      }

      // Add coordinates to metadata
      if (form.latitude && form.longitude) {
        metadata.start_coordinates = { lat: form.latitude, lng: form.longitude };
      }

      // Add boat and class if selected
      if (form.boatId) {
        raceData.boat_id = form.boatId;
      }
      if (form.classId) {
        raceData.class_id = form.classId;
      }

      // Type-specific fields
      if (isSailing) {
        if (form.raceType === 'fleet') {
          metadata.course_type = form.courseType || null;
          metadata.number_of_laps = form.numberOfLaps ? parseInt(form.numberOfLaps) : null;
          if (form.expectedFleetSize) raceData.expected_fleet_size = parseInt(form.expectedFleetSize);
          if (form.boatClass) metadata.class_name = form.boatClass;
        } else if (form.raceType === 'distance') {
          if (form.totalDistanceNm) raceData.total_distance_nm = parseFloat(form.totalDistanceNm);
          else if (calculatedDistance) raceData.total_distance_nm = calculatedDistance;
          if (form.timeLimitHours) raceData.time_limit_hours = parseFloat(form.timeLimitHours);
          metadata.route_description = form.routeDescription || null;
        } else if (form.raceType === 'match') {
          metadata.opponent_name = form.opponentName;
          metadata.match_round = form.matchRound || null;
        } else if (form.raceType === 'team') {
          metadata.your_team_name = form.yourTeamName;
          metadata.opponent_team_name = form.opponentTeamName;
          metadata.team_size = form.teamSize ? parseInt(form.teamSize) : null;
        }
      } else {
        // Non-sailing: store event subtype and dynamic fields in metadata
        metadata.event_subtype = form.eventSubtype;
        metadata.interest_slug = currentInterest?.slug;
        // Sync main form date/time into metadata for subtype compatibility
        metadata.date = form.date;
        metadata.start_time = form.time;
        // Copy all subtype-specific form values
        for (const [key, value] of Object.entries(form.subtypeFields)) {
          if (value) metadata[key] = value;
        }
      }

      raceData.metadata = metadata;

      // Add route waypoints
      if (form.routeWaypoints.length > 0) {
        raceData.route_waypoints = form.routeWaypoints.map((wp, i) => ({
          name: wp.name,
          latitude: wp.latitude,
          longitude: wp.longitude,
          type: wp.type,
          required: wp.required,
          order: i + 1,
        }));
      }

      // Add course marks
      if (form.marks.length > 0) {
        raceData.mark_designations = form.marks;
      }

      // Add extracted details to database
      if (form.extractedDetails) {
        const details = form.extractedDetails;

        // Entry & Registration
        if (details.entryFees?.length) raceData.entry_fees = details.entryFees;
        if (details.entryDeadline) raceData.entry_deadline = details.entryDeadline;

        // Crew & Safety
        if (details.minimumCrew) raceData.minimum_crew = details.minimumCrew;
        if (details.crewRequirements) raceData.crew_requirements = details.crewRequirements;
        if (details.safetyRequirements) raceData.safety_requirements = details.safetyRequirements;
        if (details.retirementNotification) raceData.retirement_notification = details.retirementNotification;

        // Schedule
        if (details.schedule?.length) raceData.schedule = details.schedule;

        // Course Details
        if (details.prohibitedAreas?.length) raceData.prohibited_areas = details.prohibitedAreas;
        if (details.tideGates?.length) raceData.tide_gates = details.tideGates;
        if (details.startAreaName) raceData.start_area_name = details.startAreaName;
        if (details.startAreaDescription) raceData.start_area_description = details.startAreaDescription;

        // Scoring
        if (details.scoringFormulaDescription) raceData.scoring_formula = details.scoringFormulaDescription;
        if (details.handicapSystem?.length) raceData.handicap_systems = details.handicapSystem;

        // Motoring
        if (details.motoringDivisionAvailable !== undefined) raceData.motoring_division_available = details.motoringDivisionAvailable;
        if (details.motoringDivisionRules) raceData.motoring_division_rules = details.motoringDivisionRules;

        // Communications
        if (details.vhfChannels?.length) raceData.vhf_channels = details.vhfChannels;

        // Organization
        if (details.organizingAuthority) raceData.organizing_authority = details.organizingAuthority;
        if (details.eventWebsite) raceData.event_website = details.eventWebsite;
        if (details.contactEmail) raceData.contact_email = details.contactEmail;

        // Weather
        if (details.expectedConditions) raceData.expected_conditions = details.expectedConditions;
        if (details.expectedWindDirection) raceData.expected_wind_direction = details.expectedWindDirection;
        if (details.expectedWindSpeedMin) raceData.expected_wind_speed_min = details.expectedWindSpeedMin;
        if (details.expectedWindSpeedMax) raceData.expected_wind_speed_max = details.expectedWindSpeedMax;

        // Insurance
        if (details.insuranceRequirements) raceData.insurance_requirements = details.insuranceRequirements;

        // Prizes
        if (details.prizesDescription) raceData.prizes_description = details.prizesDescription;
      }

      logger.debug('[AddRaceScreen] Saving race:', raceData);

      const { data: newRace, error } = await supabase
        .from('regattas')
        .insert(raceData)
        .select()
        .single();

      if (error) throw error;

      // Save NOR document if extracted from URL
      if (form.aiInputMethod === 'url' && form.aiInputText?.trim() && newRace?.id) {
        try {
          // Normalize URL - add https:// if no protocol specified
          let norUrl = form.aiInputText.trim();
          if (!norUrl.startsWith('http://') && !norUrl.startsWith('https://')) {
            norUrl = `https://${norUrl}`;
          }

          logger.debug('[AddRaceScreen] Saving NOR with normalized URL:', norUrl);

          // Update the race with the NOR URL
          await supabase
            .from('regattas')
            .update({ notice_of_race_url: norUrl })
            .eq('id', newRace.id);

          // Also save to documents table for document management
          const { data: doc } = await supabase
            .from('documents')
            .insert({
              user_id: user.id,
              filename: norUrl.split('/').pop() || 'notice-of-race',
              title: `${form.name} - Notice of Race`,
              file_path: norUrl,
              file_size: 0, // URL reference, no actual file
              mime_type: 'text/html', // Web URL, not necessarily PDF
              document_type: 'nor',
              processing_status: 'completed',
              regatta_id: newRace.id,
              used_for_extraction: true,
              extraction_timestamp: new Date().toISOString(),
            })
            .select()
            .single();

          if (doc) {
            await supabase.from('race_documents').insert({
              regatta_id: newRace.id,
              document_id: doc.id,
              user_id: user.id,
              document_type: 'nor',
            });
            logger.debug('[AddRaceScreen] NOR document saved:', doc.id);
          }
        } catch (docErr) {
          logger.warn('[AddRaceScreen] Failed to save NOR document:', docErr);
        }
      }

      logger.debug('[AddRaceScreen] Race created:', newRace?.id);
      router.replace(`/(tabs)/races?selected=${newRace.id}`);
    } catch (err) {
      logger.error('[AddRaceScreen] Save failed:', err);
      Alert.alert('Error', 'Failed to create race');
    } finally {
      setIsSaving(false);
    }
  }, [form, isFormValid, user?.id, isGuest, isSaving, calculatedDistance, router]);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/races');
  }, [router]);

  // Get venue center for route map
  const mapCenter = useMemo(() => {
    if (form.latitude && form.longitude) {
      return { lat: form.latitude, lng: form.longitude };
    }
    // Try extracted start area coordinates
    if (form.extractedDetails?.startAreaCoordinates) {
      return form.extractedDetails.startAreaCoordinates;
    }
    if (form.routeWaypoints.length > 0) {
      return { lat: form.routeWaypoints[0].latitude, lng: form.routeWaypoints[0].longitude };
    }
    // Try extracted finish area coordinates
    if (form.extractedDetails?.finishAreaCoordinates) {
      return form.extractedDetails.finishAreaCoordinates;
    }
    return { lat: 22.28, lng: 114.16 }; // Default: Hong Kong
  }, [form.latitude, form.longitude, form.routeWaypoints, form.extractedDetails?.startAreaCoordinates, form.extractedDetails?.finishAreaCoordinates]);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleClose} hitSlop={12}>
            <ChevronLeft size={28} color={COLORS.accent} />
          </Pressable>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Pressable
            onPress={handleSave}
            disabled={!isFormValid || isSaving}
            hitSlop={12}
          >
            <Text style={[styles.saveButton, (!isFormValid || isSaving) && styles.saveButtonDisabled]}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Race Suggestion Chips — sailing only (uses catalog_races + club_events) */}
          {isSailing && (
            <>
              <RaceSuggestionChips
                suggestions={suggestions}
                diagnostics={suggestionDiagnostics}
                loading={suggestionsLoading}
                error={suggestionsError}
                onUseSuggestion={applySuggestion}
                onDismissSuggestion={handleDismissSuggestion}
                onSeeAll={() => setShowAllSuggestions(true)}
                onRetry={refreshSuggestions}
              />
              {(suggestionsError || suggestionFailureSources.length > 0) && (
                <View style={styles.suggestionDiagnosticCard}>
                  <View style={styles.suggestionDiagnosticHeader}>
                    <Text style={styles.suggestionDiagnosticTitle}>Suggestion diagnostics</Text>
                    <View style={styles.suggestionDiagnosticActions}>
                      <Pressable onPress={copySuggestionDiagnostics}>
                        <Text style={styles.suggestionDiagnosticToggle}>Copy</Text>
                      </Pressable>
                      <Pressable onPress={() => setShowSuggestionDiagnostics((prev) => !prev)}>
                        <Text style={styles.suggestionDiagnosticToggle}>
                          {showSuggestionDiagnostics ? 'Hide' : 'Show'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  {suggestionsError ? (
                    <Text style={styles.suggestionDiagnosticLine}>
                      Last error: {suggestionsError.message}
                    </Text>
                  ) : null}
                  {showSuggestionDiagnostics && (
                    <View style={styles.suggestionDiagnosticDetails}>
                      <Text style={styles.suggestionDiagnosticLine}>
                        Query path: race_suggestions_cache -&gt; source generators -&gt; race_suggestions_cache upsert
                      </Text>
                      {suggestionFailureSources.length > 0 ? (
                        suggestionFailureSources.map((source) => (
                          <Text key={source} style={styles.suggestionDiagnosticLine}>
                            {source}: {SUGGESTION_SOURCE_HINTS[source] || 'unknown source path'}
                          </Text>
                        ))
                      ) : (
                        <Text style={styles.suggestionDiagnosticLine}>
                          Source-level failure details unavailable.
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )}
            </>
          )}

          {/* Activity Catalog — templates from orgs & coaches */}
          {(catalogTemplates.length > 0 || catalogLoading) && (
            <View style={styles.section}>
              <ActivityCatalog
                templates={catalogTemplates}
                onSelectTemplate={setPreviewTemplate}
                isLoading={catalogLoading}
              />
            </View>
          )}

          {/* Event Type Selector — interest-aware */}
          {isSailing ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>RACE TYPE</Text>
              <View style={styles.raceTypeGrid}>
                {(Object.keys(RACE_TYPE_CONFIG) as RaceType[]).map((type) => {
                  const config = RACE_TYPE_CONFIG[type];
                  const Icon = config.icon;
                  const isSelected = form.raceType === type;
                  return (
                    <Pressable
                      key={type}
                      style={[styles.raceTypeCard, isSelected && { borderColor: config.color }]}
                      onPress={() => updateField('raceType', type)}
                    >
                      <Icon size={20} color={isSelected ? config.color : COLORS.tertiary} />
                      <Text style={[styles.raceTypeLabel, isSelected && { color: config.color }]}>
                        {config.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>EVENT TYPE</Text>
              <View style={styles.raceTypeGrid}>
                {eventConfig.eventSubtypes.map((subtype) => {
                  const isSelected = form.eventSubtype === subtype.id;
                  const accentColor = currentInterest?.accent_color ?? COLORS.accent;
                  return (
                    <Pressable
                      key={subtype.id}
                      style={[styles.raceTypeCard, isSelected && { borderColor: accentColor }]}
                      onPress={() => setForm(prev => ({ ...prev, eventSubtype: subtype.id, subtypeFields: {} }))}
                    >
                      <Text style={[styles.raceTypeLabel, isSelected && { color: accentColor }]}>
                        {subtype.label}
                      </Text>
                      <Text style={[styles.subtypeDescription, isSelected && { color: accentColor }]} numberOfLines={1}>
                        {subtype.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ---- Sailing-specific sections ---- */}
          {isSailing && (
          <>
          {/* Unified Document Input - AI Extraction with source tracking */}
          <UnifiedDocumentInput
            mode="race_creation"
            defaultDocumentType="nor"
            onExtractionComplete={(data, rawData, documentId) => {
              // Apply extracted data to form
              const aiFields = new Set<string>();
              const updates: Partial<FormState> = {};

              if (rawData?.raceName) { updates.name = rawData.raceName; aiFields.add('name'); }
              if (rawData?.raceDate || rawData?.date) { updates.date = rawData.raceDate || rawData.date; aiFields.add('date'); }
              if (rawData?.warningSignalTime || rawData?.startTime) { updates.time = rawData.warningSignalTime || rawData.startTime; aiFields.add('time'); }
              if (rawData?.venue || rawData?.location) { updates.location = rawData.venue || rawData.location; aiFields.add('location'); }
              if (rawData?.raceType && ['fleet', 'distance', 'match', 'team'].includes(rawData.raceType)) {
                updates.raceType = rawData.raceType as RaceType;
                aiFields.add('raceType');
              }

              // VHF Channel
              if (rawData?.vhfChannels?.length > 0) {
                updates.vhfChannel = rawData.vhfChannels[0].channel?.toString() || '';
                aiFields.add('vhfChannel');
              }

              // Distance-specific
              if (rawData?.totalDistanceNm) { updates.totalDistanceNm = rawData.totalDistanceNm.toString(); aiFields.add('totalDistanceNm'); }
              if (rawData?.timeLimitHours) { updates.timeLimitHours = rawData.timeLimitHours.toString(); aiFields.add('timeLimitHours'); }
              if (rawData?.courseDescription) { updates.routeDescription = rawData.courseDescription; aiFields.add('routeDescription'); }

              // Fleet-specific
              if (rawData?.courseType) { updates.courseType = rawData.courseType; aiFields.add('courseType'); }
              if (rawData?.boatClass) { updates.boatClass = rawData.boatClass; aiFields.add('boatClass'); }

              // Build extracted details for display
              const extractedDetails: ExtractedDetailsData = {
                schedule: rawData?.schedule,
                minimumCrew: rawData?.minimumCrew,
                crewRequirements: rawData?.crewRequirements,
                minorSailorRules: rawData?.minorSailorRules,
                prohibitedAreas: rawData?.prohibitedAreas?.map((a: any) => ({
                  name: a.name,
                  description: a.description,
                })),
                startAreaName: rawData?.startAreaName,
                startAreaDescription: rawData?.startAreaDescription,
                finishAreaName: rawData?.finishAreaName,
                finishAreaDescription: rawData?.finishAreaDescription,
                vhfChannels: rawData?.vhfChannels,
                organizingAuthority: rawData?.organizingAuthority,
                eventWebsite: rawData?.eventWebsite,
                safetyRequirements: rawData?.safetyRequirements,
              };

              setForm(prev => ({
                ...prev,
                ...updates,
                aiExtractedFields: aiFields,
                extractionComplete: true,
                extractedDetails,
              }));

              if (documentId) {
                setSsiDocumentId(documentId);
              }
            }}
            onMultiRaceDetected={(data) => {
              setMultiRaceData(data);
              setShowMultiRaceModal(true);
            }}
            compact={false}
            raceType={form.raceType}
            initialExpanded={true}
          />

          {/* Essentials Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ESSENTIALS</Text>

            <FieldRow
              label="Race Name"
              value={form.name}
              onChangeText={(v) => updateField('name', v)}
              placeholder="e.g., Club Championship Race 1"
              required
              aiExtracted={form.aiExtractedFields.has('name')}
            />

            <View style={styles.row}>
              <FieldRow
                label="Date"
                value={form.date}
                onChangeText={(v) => updateField('date', v)}
                placeholder="YYYY-MM-DD"
                required
                halfWidth
                aiExtracted={form.aiExtractedFields.has('date')}
              />
              <FieldRow
                label="Start Time"
                value={form.time}
                onChangeText={(v) => updateField('time', v)}
                placeholder="HH:MM"
                required
                halfWidth
                aiExtracted={form.aiExtractedFields.has('time')}
              />
            </View>

            {/* Location Picker */}
            <Pressable style={styles.locationRow} onPress={() => setShowLocationPicker(true)}>
              <MapPin size={20} color={form.location ? COLORS.accent : COLORS.tertiary} />
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>Location</Text>
                <Text style={[styles.locationValue, !form.location && styles.locationPlaceholder]}>
                  {form.location || 'Tap to select on map'}
                </Text>
                {form.latitude && form.longitude && (
                  <Text style={styles.locationCoords}>
                    {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                  </Text>
                )}
              </View>
              <ChevronRight size={20} color={COLORS.tertiary} />
            </Pressable>

            {/* Boat Selector (Fleet/Distance) */}
            {(form.raceType === 'fleet' || form.raceType === 'distance') && (
              <BoatSelector
                selectedBoatId={form.boatId}
                onSelect={handleBoatSelect}
                label="Your Boat"
                placeholder="Select boat (optional)"
              />
            )}
          </View>

          {/* Type-Specific Fields */}
          {form.raceType === 'fleet' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>FLEET RACING</Text>
              <View style={{ marginBottom: 16 }}>
                <CourseSelector
                  label="Course Type"
                  selectedCourse={form.courseType}
                  onSelect={(courseName) => updateField('courseType', courseName || '')}
                  placeholder="Select course type"
                  aiExtracted={form.aiExtractedFields.has('courseType')}
                />
              </View>

              {/* Position Course on Map Button */}
              {form.courseType && form.latitude && form.longitude && (
                <Pressable
                  style={[styles.mapToggle, { marginBottom: 16 }]}
                  onPress={() => setShowCoursePositionEditor(true)}
                >
                  <Map size={16} color={positionedCourse ? COLORS.success : COLORS.accent} />
                  <Text style={[styles.mapToggleText, positionedCourse && { color: COLORS.success }]}>
                    {positionedCourse ? 'Course Positioned on Map' : 'Position Course on Map'}
                  </Text>
                  <ChevronRight size={18} color={positionedCourse ? COLORS.success : COLORS.accent} />
                </Pressable>
              )}

              <View style={styles.row}>
                <FieldRow
                  label="Laps"
                  value={form.numberOfLaps}
                  onChangeText={(v) => updateField('numberOfLaps', v)}
                  placeholder="3"
                  halfWidth
                  keyboardType="numeric"
                />
                <FieldRow
                  label="Fleet Size"
                  value={form.expectedFleetSize}
                  onChangeText={(v) => updateField('expectedFleetSize', v)}
                  placeholder="20"
                  halfWidth
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {form.raceType === 'distance' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DISTANCE RACING</Text>
              <View style={styles.row}>
                <FieldRow
                  label="Distance (nm)"
                  value={form.totalDistanceNm}
                  onChangeText={(v) => updateField('totalDistanceNm', v)}
                  placeholder={calculatedDistance ? calculatedDistance.toFixed(1) : '25'}
                  halfWidth
                  keyboardType="numeric"
                  aiExtracted={form.aiExtractedFields.has('totalDistanceNm')}
                />
                <FieldRow
                  label="Time Limit (hrs)"
                  value={form.timeLimitHours}
                  onChangeText={(v) => updateField('timeLimitHours', v)}
                  placeholder="8"
                  halfWidth
                  keyboardType="numeric"
                />
              </View>
              <FieldRow
                label="Route Description"
                value={form.routeDescription}
                onChangeText={(v) => updateField('routeDescription', v)}
                placeholder="Start → Mark A → Mark B → Finish"
                multiline
                aiExtracted={form.aiExtractedFields.has('routeDescription')}
              />

              {/* Route Map Section */}
              <Pressable style={styles.mapToggle} onPress={() => setShowRouteMap(!showRouteMap)}>
                <Map size={16} color={COLORS.secondary} />
                <Text style={styles.mapToggleText}>
                  Route Map {form.routeWaypoints.length > 0 && `(${form.routeWaypoints.length} waypoints)`}
                  {calculatedDistance ? ` • ${calculatedDistance.toFixed(1)} nm` : ''}
                </Text>
                <ChevronDown
                  size={18}
                  color={COLORS.secondary}
                  style={{ transform: [{ rotate: showRouteMap ? '180deg' : '0deg' }] }}
                />
              </Pressable>

              {showRouteMap && (
                <View style={styles.mapContainer}>
                  {Platform.OS === 'web' ? (
                    <>
                      <DistanceRouteMap
                        waypoints={form.routeWaypoints}
                        onWaypointsChange={handleWaypointsChange}
                        initialCenter={mapCenter}
                        onTotalDistanceChange={setCalculatedDistance}
                        // Start/Finish areas from AI extraction (geocoded)
                        startArea={form.extractedDetails?.startAreaName && form.extractedDetails?.startAreaCoordinates ? {
                          name: form.extractedDetails.startAreaName,
                          lat: form.extractedDetails.startAreaCoordinates.lat,
                          lng: form.extractedDetails.startAreaCoordinates.lng,
                        } : undefined}
                        finishArea={form.extractedDetails?.finishAreaName && form.extractedDetails?.finishAreaCoordinates ? {
                          name: form.extractedDetails.finishAreaName,
                          lat: form.extractedDetails.finishAreaCoordinates.lat,
                          lng: form.extractedDetails.finishAreaCoordinates.lng,
                        } : undefined}
                        onStartAreaChange={(coords) => {
                          if (form.extractedDetails) {
                            updateField('extractedDetails', {
                              ...form.extractedDetails,
                              startAreaCoordinates: coords,
                            });
                          }
                        }}
                        onFinishAreaChange={(coords) => {
                          if (form.extractedDetails) {
                            updateField('extractedDetails', {
                              ...form.extractedDetails,
                              finishAreaCoordinates: coords,
                            });
                          }
                        }}
                        // Prohibited areas from AI extraction (geocoded)
                        prohibitedAreas={form.extractedDetails?.prohibitedAreas}
                        onProhibitedAreasChange={(areas) => {
                          if (form.extractedDetails) {
                            updateField('extractedDetails', {
                              ...form.extractedDetails,
                              prohibitedAreas: areas,
                            });
                          }
                        }}
                      />
                      {form.routeWaypoints.length === 0 && (
                        <View style={styles.mapHint}>
                          <MapPin size={14} color={COLORS.tertiary} />
                          <Text style={styles.mapHintText}>
                            Click on map to add waypoints
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.mapPlaceholder}>
                      <Map size={32} color={COLORS.tertiary} />
                      <Text style={styles.mapPlaceholderText}>
                        Map editing available on web
                      </Text>
                      {form.routeWaypoints.length > 0 && (
                        <Text style={styles.mapPlaceholderSubtext}>
                          {form.routeWaypoints.length} waypoints from extraction
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {form.raceType === 'match' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MATCH RACING</Text>
              <FieldRow
                label="Opponent"
                value={form.opponentName}
                onChangeText={(v) => updateField('opponentName', v)}
                placeholder="Opponent name"
                required
              />
              <FieldRow
                label="Round"
                value={form.matchRound}
                onChangeText={(v) => updateField('matchRound', v)}
                placeholder="e.g., Quarter Final"
              />
            </View>
          )}

          {form.raceType === 'team' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TEAM RACING</Text>
              <FieldRow
                label="Your Team"
                value={form.yourTeamName}
                onChangeText={(v) => updateField('yourTeamName', v)}
                placeholder="Your team name"
                required
              />
              <FieldRow
                label="Opponent Team"
                value={form.opponentTeamName}
                onChangeText={(v) => updateField('opponentTeamName', v)}
                placeholder="Opponent team name"
                required
              />
              <FieldRow
                label="Team Size"
                value={form.teamSize}
                onChangeText={(v) => updateField('teamSize', v)}
                placeholder="4"
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Optional Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>OPTIONAL</Text>
            <FieldRow
              label="VHF Channel"
              value={form.vhfChannel}
              onChangeText={(v) => updateField('vhfChannel', v)}
              placeholder="72"
              keyboardType="numeric"
              aiExtracted={form.aiExtractedFields.has('vhfChannel')}
            />
            <FieldRow
              label="Notes"
              value={form.notes}
              onChangeText={(v) => updateField('notes', v)}
              placeholder="Any additional notes..."
              multiline
            />
          </View>

          {/* Extracted Race Details (if AI extraction completed) */}
          {form.extractedDetails && (
            <ExtractedDetailsSummary
              data={form.extractedDetails}
              expanded={true}
              onChange={(updatedDetails) => updateField('extractedDetails', updatedDetails)}
            />
          )}
          </>
          )}

          {/* ---- Non-sailing: dynamic form fields from config ---- */}
          {!isSailing && form.eventSubtype && (() => {
            const subtypeConfig = eventConfig.eventSubtypes.find(s => s.id === form.eventSubtype);
            if (!subtypeConfig?.formFields?.length) return null;
            const accentColor = currentInterest?.accent_color ?? COLORS.accent;
            return (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{subtypeConfig.label.toUpperCase()}</Text>
                {subtypeConfig.formFields
                  .filter((field: EventFormField) => !['date', 'start_time', 'end_time'].includes(field.id))
                  .map((field: EventFormField) => {
                  if (field.type === 'select' && field.options) {
                    return (
                      <View key={field.id} style={{ marginBottom: 12 }}>
                        <Text style={styles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
                        <View style={styles.selectGrid}>
                          {field.options.map((opt) => {
                            const isSelected = form.subtypeFields[field.id] === opt.value;
                            return (
                              <Pressable
                                key={opt.value}
                                style={[styles.selectChip, isSelected && { borderColor: accentColor, backgroundColor: accentColor + '12' }]}
                                onPress={() => setForm(prev => ({
                                  ...prev,
                                  subtypeFields: { ...prev.subtypeFields, [field.id]: opt.value },
                                }))}
                              >
                                <Text style={[styles.selectChipText, isSelected && { color: accentColor }]}>
                                  {opt.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    );
                  }
                  if (field.type === 'multi-select' && field.options) {
                    const selectedValues = (form.subtypeFields[field.id] || '').split(',').filter(Boolean);
                    return (
                      <View key={field.id} style={{ marginBottom: 12 }}>
                        <Text style={styles.fieldLabel}>{field.label}</Text>
                        <View style={styles.selectGrid}>
                          {field.options.map((opt) => {
                            const isSelected = selectedValues.includes(opt.value);
                            return (
                              <Pressable
                                key={opt.value}
                                style={[styles.selectChip, isSelected && { borderColor: accentColor, backgroundColor: accentColor + '12' }]}
                                onPress={() => {
                                  const newValues = isSelected
                                    ? selectedValues.filter(v => v !== opt.value)
                                    : [...selectedValues, opt.value];
                                  setForm(prev => ({
                                    ...prev,
                                    subtypeFields: { ...prev.subtypeFields, [field.id]: newValues.join(',') },
                                  }));
                                }}
                              >
                                <Text style={[styles.selectChipText, isSelected && { color: accentColor }]}>
                                  {opt.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    );
                  }
                  if (field.type === 'boolean') {
                    const isChecked = form.subtypeFields[field.id] === 'true';
                    return (
                      <Pressable
                        key={field.id}
                        style={styles.booleanRow}
                        onPress={() => setForm(prev => ({
                          ...prev,
                          subtypeFields: { ...prev.subtypeFields, [field.id]: isChecked ? 'false' : 'true' },
                        }))}
                      >
                        <View style={[styles.booleanCheck, isChecked && { backgroundColor: accentColor, borderColor: accentColor }]}>
                          {isChecked && <Text style={styles.booleanCheckmark}>✓</Text>}
                        </View>
                        <Text style={styles.booleanLabel}>{field.label}</Text>
                      </Pressable>
                    );
                  }
                  // Default: text, number, date, time, duration — render as FieldRow
                  return (
                    <FieldRow
                      key={field.id}
                      label={field.label}
                      value={form.subtypeFields[field.id] || ''}
                      onChangeText={(v) => setForm(prev => ({
                        ...prev,
                        subtypeFields: { ...prev.subtypeFields, [field.id]: v },
                      }))}
                      placeholder={field.placeholder || ''}
                      required={field.required}
                      keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                    />
                  );
                })}
              </View>
            );
          })()}

          {/* Shared Notes Section (all interests) */}
          {!isSailing && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>NOTES</Text>
              <FieldRow
                label="Notes"
                value={form.notes}
                onChangeText={(v) => updateField('notes', v)}
                placeholder="Any additional notes..."
                multiline
              />
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Location Map Picker Modal */}
      <LocationMapPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectLocation={handleLocationSelect}
        raceType={form.raceType}
        initialLocation={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : null}
        initialName={form.location}
      />

      {/* Course Position Editor Modal */}
      <CoursePositionEditor
        visible={showCoursePositionEditor}
        regattaId="" // Will be set after race is created
        initialCourseType={mapCourseTypeToPositionedType(form.courseType)}
        initialLocation={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : undefined}
        onSave={(course) => {
          setPositionedCourse(course);
          setShowCoursePositionEditor(false);
          logger.debug('[AddRaceScreen] Course positioned:', course.marks.length, 'marks');
        }}
        onCancel={() => setShowCoursePositionEditor(false)}
      />

      {/* All Suggestions Modal */}
      <Modal
        visible={showAllSuggestions}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAllSuggestions(false)}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={() => setShowAllSuggestions(false)} hitSlop={12}>
              <ChevronLeft size={28} color={COLORS.accent} />
            </Pressable>
            <Text style={styles.headerTitle}>All Suggestions</Text>
            <View style={{ width: 28 }} />
          </View>
          <RaceSuggestionsDrawer
            suggestions={suggestions}
            diagnostics={suggestionDiagnostics}
            loading={suggestionsLoading}
            error={suggestionsError}
            onSelectSuggestion={(suggestion) => {
              applySuggestion(suggestion);
              setShowAllSuggestions(false);
            }}
            onDismissSuggestion={handleDismissSuggestion}
            onRefresh={refreshSuggestions}
          />
        </SafeAreaView>
      </Modal>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setPreviewTemplate(null)}
        >
          <SafeAreaView style={styles.container} edges={['top']}>
            <TemplatePreview
              template={previewTemplate}
              onEnroll={async (template) => {
                await enrollInCatalogTemplate(template);
                setPreviewTemplate(null);
                // Pre-fill form from template data
                const updates: Partial<FormState> = {};
                if (template.title) updates.name = template.title;
                if (template.scheduledDate) {
                  const d = new Date(template.scheduledDate);
                  updates.date = format(d, 'yyyy-MM-dd');
                  updates.time = format(d, 'HH:mm');
                }
                if (template.location) updates.location = template.location;
                if (template.eventType && ['fleet', 'distance', 'match', 'team'].includes(template.eventType)) {
                  updates.raceType = template.eventType as RaceType;
                }
                // Non-sailing: pre-fill eventSubtype and subtype-specific fields
                if (template.eventSubtype) {
                  updates.eventSubtype = template.eventSubtype;
                }
                if (template.prefilledData && Object.keys(template.prefilledData).length > 0) {
                  const subtypeFields: Record<string, string> = {};
                  for (const [key, value] of Object.entries(template.prefilledData)) {
                    if (typeof value === 'string') subtypeFields[key] = value;
                  }
                  if (Object.keys(subtypeFields).length > 0) {
                    updates.subtypeFields = subtypeFields;
                  }
                }
                setForm(prev => ({ ...prev, ...updates }));
              }}
              onClose={() => setPreviewTemplate(null)}
            />
          </SafeAreaView>
        </Modal>
      )}

      {/* Multi-Race Selection Modal */}
      {showMultiRaceModal && multiRaceData && (
        <View style={styles.multiRaceModalOverlay}>
          <MultiRaceSelectionScreen
            extractedData={multiRaceData}
            onConfirm={handleMultiRaceConfirm}
            onCancel={handleMultiRaceCancel}
          />
          {isCreatingMultiple && (
            <View style={styles.creatingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.creatingText}>Creating races...</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// =============================================================================
// FIELD ROW COMPONENT
// =============================================================================

interface FieldRowProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  halfWidth?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'url';
  aiExtracted?: boolean;
}

function FieldRow({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  halfWidth,
  multiline,
  keyboardType,
  aiExtracted,
}: FieldRowProps) {
  return (
    <View style={[styles.fieldRow, halfWidth && styles.fieldRowHalf]}>
      <View style={styles.fieldLabelRow}>
        {aiExtracted && <View style={styles.aiDot} />}
        <Text style={styles.fieldLabel}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.tertiary}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.ink,
  },
  saveButton: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.accent,
  },
  saveButtonDisabled: {
    color: COLORS.tertiary,
  },
  content: {
    padding: 16,
  },
  suggestionDiagnosticCard: {
    marginTop: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  suggestionDiagnosticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionDiagnosticActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestionDiagnosticTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7F1D1D',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  suggestionDiagnosticToggle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
  },
  suggestionDiagnosticDetails: {
    marginTop: 2,
    gap: 2,
  },
  suggestionDiagnosticLine: {
    fontSize: 12,
    color: '#991B1B',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Race type grid
  raceTypeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  raceTypeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    gap: 4,
  },
  raceTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  subtypeDescription: {
    fontSize: 10,
    color: COLORS.tertiary,
    marginTop: 2,
  },

  // Dynamic form fields (non-sailing)
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.ink,
    marginBottom: 6,
  },
  selectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.inputBg,
  },
  selectChipText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  booleanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  booleanCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  booleanCheckmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  booleanLabel: {
    fontSize: 14,
    color: COLORS.ink,
  },

  // AI extraction
  aiContent: {
    marginTop: 12,
    gap: 12,
  },
  methodTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  methodTabActive: {
    borderColor: COLORS.accent,
    backgroundColor: '#EFF6FF',
  },
  methodTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.tertiary,
  },
  methodTabTextActive: {
    color: COLORS.accent,
  },
  textArea: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    padding: 12,
    fontSize: 15,
    color: COLORS.ink,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  uploadArea: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  urlInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    padding: 12,
    fontSize: 15,
    color: COLORS.ink,
  },
  extractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 8,
  },
  extractButtonDisabled: {
    opacity: 0.5,
  },
  extractButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Field rows
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldRow: {
    marginBottom: 12,
  },
  fieldRowHalf: {
    flex: 1,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    color: COLORS.secondary,
  },
  required: {
    color: COLORS.error,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  fieldInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    padding: 12,
    fontSize: 15,
    color: COLORS.ink,
  },
  fieldInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Location row
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 15,
    color: COLORS.ink,
  },
  locationPlaceholder: {
    color: COLORS.tertiary,
  },
  locationCoords: {
    fontSize: 11,
    color: COLORS.tertiary,
    marginTop: 2,
  },

  // Map
  mapToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
    marginTop: 8,
  },
  mapToggleText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondary,
  },
  mapContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  mapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  mapHintText: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontStyle: 'italic',
  },
  mapPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: COLORS.tertiary,
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },

  // Multi-Race Modal
  multiRaceModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FAFC',
    zIndex: 1000,
  },
  creatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    zIndex: 1001,
  },
  creatingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
