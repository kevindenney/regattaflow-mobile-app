/**
 * Comprehensive Race Entry Component
 * Complete race strategy planning interface with AI-powered auto-suggest
 */

import TacticalRaceMap from '@/components/race-strategy/TacticalRaceMap';
import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast';
import { useRaceSuggestions } from '@/hooks/useRaceSuggestions';
import { createLogger } from '@/lib/utils/logger';
import { useAuth } from '@/providers/AuthProvider';
import { ComprehensiveRaceExtractionAgent } from '@/services/agents/ComprehensiveRaceExtractionAgent';
import { PDFExtractionService } from '@/services/PDFExtractionService';
import type { RaceSuggestion } from '@/services/RaceSuggestionService';
import { RaceWeatherService } from '@/services/RaceWeatherService';
import { sailorBoatService } from '@/services/SailorBoatService';
import { supabase } from '@/services/supabase';
import type { CourseMark, RaceEventWithDetails } from '@/types/raceEvents';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  Anchor,
  Calendar,
  ChevronDown,
  ChevronLeft,
  Clock,
  FileText,
  Flag,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Radio,
  Route,
  Sparkles,
  Upload,
  X,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { AIValidationScreen, type ExtractedData, type FieldConfidenceMap, type MultiRaceExtractedData } from './AIValidationScreen';
import { BoatSelector } from './BoatSelector';
import { MultiRaceSelectionScreen } from './MultiRaceSelectionScreen';
import { RaceSuggestionsDrawer } from './RaceSuggestionsDrawer';
import { VenueLocationPicker } from './VenueLocationPicker';
import { RacePrepLearningCard } from './RacePrepLearningCard';
import { RaceTypeSelector, type RaceType } from './RaceTypeSelector';
import { DistanceRouteMap, type RouteWaypoint } from './DistanceRouteMap';
import { RigTuningCard } from '@/components/race-detail/RigTuningCard';
import { useRaceTuningRecommendation } from '@/hooks/useRaceTuningRecommendation';
import { ExtractionPreferencesDialog, type ExtractionPreferences, DEFAULT_PREFERENCES } from './ExtractionPreferencesDialog';

export interface ExtractionMetadata {
  racingAreaName?: string;
  extractedMarks?: Array<{ name: string; type: string }>;
  venueId?: string;
  raceName?: string;
}

interface ComprehensiveRaceEntryProps {
  onSubmit?: (raceId: string, metadata?: ExtractionMetadata) => void;
  onCancel?: () => void;
  existingRaceId?: string;
  initialCourseId?: string;
  initialCourseName?: string;
}

interface StartSequence {
  class: string;
  warning: string;
  start: string;
  flag?: string; // Class flag (e.g., "Numeral 3", "Alpha")
}

interface MarkBoat {
  mark: string;
  boat: string;
  position: string;
}

interface ClassDivision {
  name: string;
  fleet_size: number;
}

const logger = createLogger('ComprehensiveRaceEntry');
export function ComprehensiveRaceEntry({
  onSubmit,
  onCancel,
  existingRaceId,
  initialCourseId,
  initialCourseName,
}: ComprehensiveRaceEntryProps) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processingSuggestionId, setProcessingSuggestionId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basic', 'timing'])
  );

  // Race Suggestions
  console.log('🏁 [ComprehensiveRaceEntry] Component rendering, user:', user?.id);
  const {
    suggestions,
    loading: suggestionsLoading,
    refresh: refreshSuggestions,
    acceptSuggestion,
    dismissSuggestion,
  } = useRaceSuggestions();
  console.log('🏁 [ComprehensiveRaceEntry] Suggestions state:', { suggestions, suggestionsLoading });

  // AI Freeform Input
  const [freeformText, setFreeformText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [currentDocType, setCurrentDocType] = useState<'nor' | 'si' | 'other' | null>(null);
  // AI Quick Entry section is collapsed by default in edit mode
  const [aiQuickEntryExpanded, setAiQuickEntryExpanded] = useState(!existingRaceId);

  // Multi-document processing state
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{
    id: string;
    filename: string;
    docType: 'NOR' | 'SI' | 'SSI' | 'Appendix' | 'Calendar' | 'Amendment' | 'other';
    status: 'pending' | 'extracting' | 'complete' | 'error';
    content?: string;
    error?: string;
  }>>([]);
  const [aggregationStatus, setAggregationStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [aggregationMetadata, setAggregationMetadata] = useState<{
    documents_processed?: number;
    document_types?: string[];
    conflicts_found?: number;
    gaps_identified?: string[];
    overall_confidence?: number;
  } | null>(null);

  // AI Validation Screen (Phase 3)
  const [showValidationScreen, setShowValidationScreen] = useState(false);
  const [extractedDataForValidation, setExtractedDataForValidation] = useState<ExtractedData | null>(null);
  const [confidenceScoresForValidation, setConfidenceScoresForValidation] = useState<FieldConfidenceMap>({});

  // Multi-Race Selection (Phase 3)
  const [showMultiRaceSelection, setShowMultiRaceSelection] = useState(false);
  const [multiRaceData, setMultiRaceData] = useState<MultiRaceExtractedData | null>(null);
  const [isCreatingMultipleRaces, setIsCreatingMultipleRaces] = useState(false);
  const [multiRaceProgress, setMultiRaceProgress] = useState<{ current: number; total: number; raceName: string } | null>(null);

  // Track documents to upload after race creation
  const [pendingDocuments, setPendingDocuments] = useState<Array<{
    file: { uri: string; name: string; mimeType: string; size: number };
    docType: 'nor' | 'si' | 'other';
    extractedText: string;
  }>>([]);

  // Extraction preferences dialog
  const [showExtractionPreferences, setShowExtractionPreferences] = useState(false);
  const [extractionPreferences, setExtractionPreferences] = useState<ExtractionPreferences>(DEFAULT_PREFERENCES);
  const [pendingExtractionText, setPendingExtractionText] = useState<string>('');

  // Race Type (Fleet vs Distance)
  const [raceType, setRaceType] = useState<'fleet' | 'distance'>('fleet');

  // Basic Information
  const [raceName, setRaceName] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [venue, setVenue] = useState('');
  const [venueCoordinates, setVenueCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [description, setDescription] = useState('');
  const [selectedBoatId, setSelectedBoatId] = useState<string | undefined>();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Timing & Sequence
  const [warningSignalTime, setWarningSignalTime] = useState('10:00');
  const [warningSignalType, setWarningSignalType] = useState('both');
  const [preparatoryMinutes, setPreparatoryMinutes] = useState('4');
  const [classIntervalMinutes, setClassIntervalMinutes] = useState('5');
  const [totalStarts, setTotalStarts] = useState('1');
  const [startSequence, setStartSequence] = useState<StartSequence[]>([]);
  const [plannedFinishTime, setPlannedFinishTime] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('');

  // Communications & Control
  const [vhfChannel, setVhfChannel] = useState('');
  const [vhfBackupChannel, setVhfBackupChannel] = useState('');
  const [safetyChannel, setSafetyChannel] = useState('VHF 16');
  // Store full VHF channels array with purposes for metadata
  const [vhfChannelsDetailed, setVhfChannelsDetailed] = useState<Array<{
    channel: string;
    purpose: string;
    classes?: string[];
  }>>([]);
  const [rcBoatName, setRcBoatName] = useState('');
  const [rcBoatPosition, setRcBoatPosition] = useState('');
  const [markBoats, setMarkBoats] = useState<MarkBoat[]>([]);
  const [raceOfficer, setRaceOfficer] = useState('');
  const [protestCommittee, setProtestCommittee] = useState('');

  // Course & Start Area
  const [startAreaName, setStartAreaName] = useState('');
  const [startAreaDescription, setStartAreaDescription] = useState('');
  const [startLineLength, setStartLineLength] = useState('');
  const [potentialCourses, setPotentialCourses] = useState<string[]>([]);
  
  // Finish Area
  const [finishAreaName, setFinishAreaName] = useState('');
  const [finishAreaDescription, setFinishAreaDescription] = useState('');
  const [finishAreaCoordinates, setFinishAreaCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [courseSelectionCriteria, setCourseSelectionCriteria] = useState('');
  const [courseDiagramUrl, setCourseDiagramUrl] = useState('');

  // Racing Area Polygon (user-drawn boundary)
  const [racingAreaPolygon, setRacingAreaPolygon] = useState<[number, number][] | null>(null);
  const [showRacingAreaMap, setShowRacingAreaMap] = useState(true);

  // Race Rules & Penalties
  const [scoringSystem, setScoringSystem] = useState('Low Point');
  const [penaltySystem, setPenaltySystem] = useState('720°');
  const [penaltyDetails, setPenaltyDetails] = useState('');
  const [specialRules, setSpecialRules] = useState<string[]>([]);
  const [sailingInstructionsUrl, setSailingInstructionsUrl] = useState('');
  const [noticeOfRaceUrl, setNoticeOfRaceUrl] = useState('');

  // Class & Fleet
  const [classDivisions, setClassDivisions] = useState<ClassDivision[]>([{ name: '', fleet_size: 0 }]);
  const [classSuggestion, setClassSuggestion] = useState<{
    name?: string;
    boatName?: string;
    sailNumber?: string | null;
    message?: string;
  } | null>(null);
  const [classSuggestionLoading, setClassSuggestionLoading] = useState(false);
  const [hasManualClassEdit, setHasManualClassEdit] = useState(false);
  const lastSuggestedClassRef = useRef<string | null>(null);
  const previousBoatIdRef = useRef<string | undefined>(undefined);
  const hasManualClassEditRef = useRef(false);

  useEffect(() => {
    hasManualClassEditRef.current = hasManualClassEdit;
  }, [hasManualClassEdit]);
  const [expectedFleetSize, setExpectedFleetSize] = useState('');

  // Weather & Conditions
  const [expectedWindDirection, setExpectedWindDirection] = useState('');
  const [expectedWindSpeedMin, setExpectedWindSpeedMin] = useState('');
  const [expectedWindSpeedMax, setExpectedWindSpeedMax] = useState('');
  const [expectedConditions, setExpectedConditions] = useState('');
  const [tideAtStart, setTideAtStart] = useState('');

  // Tactical Notes
  const [venueSpecificNotes, setVenueSpecificNotes] = useState('');
  const [favoredSide, setFavoredSide] = useState('');
  const [laylineStrategy, setLaylineStrategy] = useState('');
  const [startStrategy, setStartStrategy] = useState('');

  // Registration & Logistics
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [entryFeeAmount, setEntryFeeAmount] = useState('');
  const [entryFeeCurrency, setEntryFeeCurrency] = useState('USD');
  const [checkInTime, setCheckInTime] = useState('');
  const [skipperBriefingTime, setSkipperBriefingTime] = useState('');

  // AI Suggestions
  const [aiSuggesting, setAiSuggesting] = useState(false);

  // Store original weather data when editing (to preserve historical forecasts)
  const [originalWeatherData, setOriginalWeatherData] = useState<{
    wind?: any;
    tide?: any;
    weather_provider?: string;
    weather_fetched_at?: string;
    weather_confidence?: number;
  } | null>(null);

  // Rig Tuning Recommendation - automatically shows when forecast & boat class are available
  const tuningBoatClass = classSuggestion?.name || classDivisions?.[0]?.name || undefined;
  const tuningWindSpeed = expectedWindSpeedMin ? parseInt(expectedWindSpeedMin) : 
                          expectedWindSpeedMax ? parseInt(expectedWindSpeedMax) : undefined;
  
  const {
    recommendation: rigTuningRecommendation,
    loading: rigTuningLoading,
    refresh: refreshRigTuning,
  } = useRaceTuningRecommendation({
    className: tuningBoatClass,
    averageWindSpeed: tuningWindSpeed,
    windMin: expectedWindSpeedMin ? parseInt(expectedWindSpeedMin) : undefined,
    windMax: expectedWindSpeedMax ? parseInt(expectedWindSpeedMax) : undefined,
    enabled: !!(tuningBoatClass && tuningWindSpeed),
  });

  // NOR Document Fields
  const [supplementarySIUrl, setSupplementarySIUrl] = useState('');
  const [norAmendments, setNorAmendments] = useState<Array<{ url?: string; date: string; description: string }>>([]);

  // Governing Rules
  const [racingRulesSystem, setRacingRulesSystem] = useState('');
  const [classRules, setClassRules] = useState('');
  const [prescriptions, setPrescriptions] = useState('');
  const [additionalDocuments, setAdditionalDocuments] = useState<string[]>([]);

  // Eligibility & Entry
  const [eligibilityRequirements, setEligibilityRequirements] = useState('');
  const [entryFormUrl, setEntryFormUrl] = useState('');
  const [entryDeadline, setEntryDeadline] = useState('');
  const [lateEntryPolicy, setLateEntryPolicy] = useState('');

  // Schedule Details
  const [eventSeriesName, setEventSeriesName] = useState('');
  const [eventType, setEventType] = useState('');
  const [racingDays, setRacingDays] = useState<string[]>([]);
  const [racesPerDay, setRacesPerDay] = useState('');
  const [firstWarningSignal, setFirstWarningSignal] = useState('');
  const [reserveDays, setReserveDays] = useState<string[]>([]);

  // Course Information
  const [courseAttachmentReference, setCourseAttachmentReference] = useState('');
  const [courseAreaDesignation, setCourseAreaDesignation] = useState('');

  // Scoring System (Enhanced)
  const [seriesRacesRequired, setSeriesRacesRequired] = useState('');
  const [discardsPolicy, setDiscardsPolicy] = useState('');

  // Safety
  const [safetyRequirements, setSafetyRequirements] = useState('');
  const [retirementNotificationRequirements, setRetirementNotificationRequirements] = useState('');

  // Insurance
  const [minimumInsuranceCoverage, setMinimumInsuranceCoverage] = useState('');
  const [insurancePolicyReference, setInsurancePolicyReference] = useState('');

  // Prizes
  const [prizesDescription, setPrizesDescription] = useState('');
  const [prizePresentationDetails, setPrizePresentationDetails] = useState('');

  // === NEW: Time Limits ===
  const [absoluteTimeLimit, setAbsoluteTimeLimit] = useState('');
  const [cutOffPoints, setCutOffPoints] = useState<Array<{location: string; time: string}>>([]);

  // === Distance Racing Fields ===
  const [routeWaypoints, setRouteWaypoints] = useState<RouteWaypoint[]>([]);
  const [totalDistanceNm, setTotalDistanceNm] = useState('');
  const [timeLimitHours, setTimeLimitHours] = useState('');
  const [startFinishSameLocation, setStartFinishSameLocation] = useState(true);
  const [finishVenue, setFinishVenue] = useState(''); // For point-to-point races

  // === NEW: Race Office & Contacts ===
  const [raceOfficeLocation, setRaceOfficeLocation] = useState('');
  const [raceOfficePhone, setRaceOfficePhone] = useState<string[]>([]);
  const [contactEmail, setContactEmail] = useState('');

  // === NEW: Entry Information (from NOR) ===
  const [entryFees, setEntryFees] = useState<Array<{type: string; amount: string; deadline?: string}>>([]);
  const [eligibleClasses, setEligibleClasses] = useState<string[]>([]);
  const [safetyBriefingDetails, setSafetyBriefingDetails] = useState('');

  // === NEW: Prizegiving ===
  const [prizegivingDate, setPrizegivingDate] = useState('');
  const [prizegivingTime, setPrizegivingTime] = useState('');
  const [prizegivingLocation, setPrizegivingLocation] = useState('');

  // Load existing race data if in edit mode
  useEffect(() => {
    if (!existingRaceId) return;

    const loadRaceData = async () => {
      try {
        setLoading(true);
        logger.debug('[ComprehensiveRaceEntry] Loading race data for:', existingRaceId);
        logger.debug('[ComprehensiveRaceEntry] existingRaceId type:', typeof existingRaceId);
        logger.debug('[ComprehensiveRaceEntry] existingRaceId length:', existingRaceId.length);

        const { data: race, error} = await supabase
          .from('regattas')
          .select('*')
          .eq('id', existingRaceId)
          .single();

        if (error) {
          logger.error('[ComprehensiveRaceEntry] Error loading race:', {
            error,
            errorCode: error.code,
            errorMessage: error.message,
            existingRaceId
          });
          Alert.alert('Error', `Failed to load race data: ${error.message}`);
          return;
        }

        if (!race) {
          logger.error('[ComprehensiveRaceEntry] Race not found for ID:', existingRaceId);
          Alert.alert('Error', 'Race not found');
          return;
        }

        logger.debug('[ComprehensiveRaceEntry] Loaded race successfully:', {
          id: race.id,
          name: race.name,
          boat_id: race.boat_id,
          class_id: race.class_id,
          hasMetadata: !!race.metadata
        });

        // Populate basic fields
        setRaceName(race.name || '');
        setVenue(race.metadata?.venue_name || '');
        setDescription(race.metadata?.description || '');

        // Populate dates
        if (race.start_date) {
          const date = new Date(race.start_date);
          setRaceDate(date.toISOString().split('T')[0]); // YYYY-MM-DD
        }

        // Populate venue coordinates
        if (race.metadata?.racing_area_coordinates) {
          setVenueCoordinates(race.metadata.racing_area_coordinates);
        }

        // Populate boat selection
        logger.debug('[ComprehensiveRaceEntry] Setting boat and class IDs:', {
          boat_id: race.boat_id,
          class_id: race.class_id,
          metadata_class_id: race.metadata?.class_id
        });
        setSelectedBoatId(race.boat_id || undefined);
        setSelectedClassId(race.class_id || race.metadata?.class_id || null);

        // Populate timing & start sequence (from top-level fields)
        if (race.warning_signal_time) setWarningSignalTime(race.warning_signal_time);
        if (race.warning_signal_type) setWarningSignalType(race.warning_signal_type);
        if (race.preparatory_signal_minutes) setPreparatoryMinutes(race.preparatory_signal_minutes.toString());
        if (race.class_interval_minutes) setClassIntervalMinutes(race.class_interval_minutes.toString());
        if (race.total_starts) setTotalStarts(race.total_starts.toString());
        if (race.start_sequence_details) setStartSequence(race.start_sequence_details);
        if (race.planned_finish_time) setPlannedFinishTime(race.planned_finish_time);
        if (race.time_limit_minutes) setTimeLimitMinutes(race.time_limit_minutes.toString());

        // Populate communications (from top-level fields)
        if (race.vhf_channel) setVhfChannel(race.vhf_channel);
        if (race.vhf_backup_channel) setVhfBackupChannel(race.vhf_backup_channel);
        if (race.safety_channel) setSafetyChannel(race.safety_channel);
        if (race.rc_boat_name) setRcBoatName(race.rc_boat_name);
        if (race.rc_boat_position) setRcBoatPosition(race.rc_boat_position);
        if (race.mark_boat_positions) setMarkBoats(race.mark_boat_positions);
        if (race.race_officer) setRaceOfficer(race.race_officer);
        if (race.protest_committee) setProtestCommittee(race.protest_committee);

        // Populate course & start area (from top-level fields)
        if (race.start_area_name) setStartAreaName(race.start_area_name);
        if (race.start_area_description) setStartAreaDescription(race.start_area_description);
        if (race.start_line_length_meters) setStartLineLength(race.start_line_length_meters.toString());
        if (race.potential_courses) setPotentialCourses(race.potential_courses);
        if (race.course_selection_criteria) setCourseSelectionCriteria(race.course_selection_criteria);
        if (race.course_diagram_url) setCourseDiagramUrl(race.course_diagram_url);
        
        // Finish area
        if (race.finish_area_name) setFinishAreaName(race.finish_area_name);
        if (race.finish_area_description) setFinishAreaDescription(race.finish_area_description);
        if (race.finish_area_coordinates) setFinishAreaCoordinates(race.finish_area_coordinates);

        // Populate rules & penalties (from top-level fields)
        if (race.scoring_system) setScoringSystem(race.scoring_system);
        if (race.penalty_system) setPenaltySystem(race.penalty_system);
        if (race.penalty_details) setPenaltyDetails(race.penalty_details);
        if (race.special_rules) setSpecialRules(race.special_rules);
        if (race.sailing_instructions_url) setSailingInstructionsUrl(race.sailing_instructions_url);
        if (race.notice_of_race_url) setNoticeOfRaceUrl(race.notice_of_race_url);

        // Populate class & fleet (from top-level fields)
        if (race.class_divisions && Array.isArray(race.class_divisions) && race.class_divisions.length > 0) {
          setClassDivisions(race.class_divisions);
          if (race.class_divisions.some((div: ClassDivision) => div.name?.trim())) {
            setHasManualClassEdit(true);
            hasManualClassEditRef.current = true;
            lastSuggestedClassRef.current = race.class_divisions[0]?.name ?? null;
          }
        } else if (race.metadata?.class_name) {
          setClassDivisions([{ name: race.metadata.class_name, fleet_size: race.expected_fleet_size || 0 }]);
          setHasManualClassEdit(true);
          hasManualClassEditRef.current = true;
          lastSuggestedClassRef.current = race.metadata.class_name;
        }
        if (race.expected_fleet_size) setExpectedFleetSize(race.expected_fleet_size.toString());

        // Populate weather conditions (from top-level fields)
        if (race.expected_wind_direction) setExpectedWindDirection(race.expected_wind_direction.toString());
        if (race.expected_wind_speed_min) setExpectedWindSpeedMin(race.expected_wind_speed_min.toString());
        if (race.expected_wind_speed_max) setExpectedWindSpeedMax(race.expected_wind_speed_max.toString());
        if (race.expected_conditions) setExpectedConditions(race.expected_conditions);
        if (race.tide_at_start) setTideAtStart(race.tide_at_start);

        // Populate tactical (from top-level fields)
        if (race.venue_specific_notes) setVenueSpecificNotes(race.venue_specific_notes);
        if (race.favored_side) setFavoredSide(race.favored_side);
        if (race.layline_strategy) setLaylineStrategy(race.layline_strategy);
        if (race.start_strategy) setStartStrategy(race.start_strategy);

        // Populate registration & logistics (from top-level fields)
        if (race.registration_deadline) setRegistrationDeadline(race.registration_deadline);
        if (race.entry_fee_amount) setEntryFeeAmount(race.entry_fee_amount.toString());
        if (race.entry_fee_currency) setEntryFeeCurrency(race.entry_fee_currency);
        if (race.check_in_time) setCheckInTime(race.check_in_time);
        if (race.skipper_briefing_time) setSkipperBriefingTime(race.skipper_briefing_time);

        // Populate NOR document fields
        if (race.supplementary_si_url) setSupplementarySIUrl(race.supplementary_si_url);
        if (race.nor_amendments) setNorAmendments(race.nor_amendments);

        // Populate governing rules
        if (race.governing_rules?.racing_rules_system) setRacingRulesSystem(race.governing_rules.racing_rules_system);
        if (race.governing_rules?.class_rules) setClassRules(race.governing_rules.class_rules);
        if (race.governing_rules?.prescriptions) setPrescriptions(race.governing_rules.prescriptions);
        if (race.governing_rules?.additional_documents) setAdditionalDocuments(race.governing_rules.additional_documents);

        // Populate eligibility & entry
        if (race.eligibility_requirements) setEligibilityRequirements(race.eligibility_requirements);
        if (race.entry_form_url) setEntryFormUrl(race.entry_form_url);
        if (race.entry_deadline) setEntryDeadline(race.entry_deadline);
        if (race.late_entry_policy) setLateEntryPolicy(race.late_entry_policy);

        // Populate schedule details
        if (race.event_series_name) setEventSeriesName(race.event_series_name);
        if (race.event_type) setEventType(race.event_type);
        if (race.racing_days) setRacingDays(race.racing_days);
        if (race.races_per_day) setRacesPerDay(race.races_per_day.toString());
        if (race.first_warning_signal) setFirstWarningSignal(race.first_warning_signal);
        if (race.reserve_days) setReserveDays(race.reserve_days);

        // Populate enhanced course information
        if (race.course_attachment_reference) setCourseAttachmentReference(race.course_attachment_reference);
        if (race.course_area_designation) setCourseAreaDesignation(race.course_area_designation);

        // Populate enhanced scoring
        if (race.series_races_required) setSeriesRacesRequired(race.series_races_required.toString());
        if (race.discards_policy) setDiscardsPolicy(race.discards_policy);

        // Populate safety
        if (race.safety_requirements) setSafetyRequirements(race.safety_requirements);
        if (race.retirement_notification_requirements) setRetirementNotificationRequirements(race.retirement_notification_requirements);

        // Populate insurance
        if (race.minimum_insurance_coverage) setMinimumInsuranceCoverage(race.minimum_insurance_coverage.toString());
        if (race.insurance_policy_reference) setInsurancePolicyReference(race.insurance_policy_reference);

        // Populate prizes
        if (race.prizes_description) setPrizesDescription(race.prizes_description);
        if (race.prize_presentation_details) setPrizePresentationDetails(race.prize_presentation_details);

        // IMPORTANT: Store original weather data to preserve historical forecasts
        if (race.metadata?.wind || race.metadata?.tide) {
          setOriginalWeatherData({
            wind: race.metadata.wind,
            tide: race.metadata.tide,
            weather_provider: race.metadata.weather_provider,
            weather_fetched_at: race.metadata.weather_fetched_at,
            weather_confidence: race.metadata.weather_confidence,
          });
        }

        logger.debug('[ComprehensiveRaceEntry] Race data loaded successfully');
      } catch (err: any) {
        console.error('[ComprehensiveRaceEntry] Error loading race:', err);
        Alert.alert('Error', 'Failed to load race data');
      } finally {
        setLoading(false);
      }
    };

    loadRaceData();
  }, [existingRaceId]);

  useEffect(() => {
    if (previousBoatIdRef.current && previousBoatIdRef.current !== selectedBoatId) {
      setHasManualClassEdit(false);
      hasManualClassEditRef.current = false;
      lastSuggestedClassRef.current = null;
      setSelectedClassId(null);
    }

    previousBoatIdRef.current = selectedBoatId;
  }, [selectedBoatId]);

  useEffect(() => {
    if (hasManualClassEdit && classSuggestion?.name) {
      setClassSuggestion(null);
    }
  }, [hasManualClassEdit, classSuggestion?.name]);

  useEffect(() => {
    logger.debug('[useEffect:selectedBoatId] Triggered with boat ID:', selectedBoatId);

    if (!selectedBoatId) {
      logger.debug('[useEffect:selectedBoatId] No boat ID, clearing class suggestion');
      setClassSuggestion(null);
      setClassSuggestionLoading(false);
      setSelectedClassId(null);
      return;
    }

    logger.debug('[useEffect:selectedBoatId] Starting boat class suggestion loading');
    let cancelled = false;
    setClassSuggestionLoading(true);

    const loadBoatForSuggestion = async () => {
      try {
        logger.debug('[loadBoatForSuggestion] Loading boat:', selectedBoatId);
        const boat = await sailorBoatService.getBoat(selectedBoatId);
        logger.debug('[loadBoatForSuggestion] Boat loaded:', {
          boatId: boat?.id,
          boatName: boat?.name,
          hasBoatClass: !!boat?.boat_class,
          boatClassId: boat?.boat_class?.id,
          boatClassName: boat?.boat_class?.name
        });

        if (cancelled) return;

        setClassSuggestionLoading(false);

        if (!boat) {
          logger.warn('[loadBoatForSuggestion] Boat not found:', selectedBoatId);
          setClassSuggestion({
            message: 'Unable to load boat details. Select a class manually.',
          });
          setSelectedClassId(null);
          return;
        }

        if (boat.boat_class?.name) {
          logger.debug('[loadBoatForSuggestion] Setting class from boat_class');
          setClassSuggestion({
            name: boat.boat_class.name,
            boatName: boat.name,
            sailNumber: boat.sail_number || null,
          });
          // FIXED: Added optional chaining to prevent null reference error
          setSelectedClassId(boat.boat_class?.id || null);

          if (!hasManualClassEditRef.current) {
            setClassDivisions((prev) => {
              const next = prev.length > 0 ? [...prev] : [{ name: '', fleet_size: 0 }];
              const currentName = next[0]?.name?.trim();
              if (!currentName || currentName === lastSuggestedClassRef.current) {
                next[0] = {
                  ...(next[0] || { fleet_size: 0 }),
                  name: boat.boat_class?.name || '',
                };
                lastSuggestedClassRef.current = boat.boat_class?.name || null;
              }
              return next;
            });
          }
        } else {
          setClassSuggestion({
            message: `Boat ${boat.name}${boat.sail_number ? ` (${boat.sail_number})` : ''} doesn't have a class yet. Choose the class below to unlock tuning.`,
          });
          setSelectedClassId(null);
        }
      } catch (error) {
        console.error('[ComprehensiveRaceEntry] Failed to fetch boat for class suggestion:', error);
        if (!cancelled) {
          setClassSuggestionLoading(false);
          setClassSuggestion({
            message: 'Unable to fetch boat details. Select a class manually.',
          });
          setSelectedClassId(null);
        }
      }
    };

    loadBoatForSuggestion();

    return () => {
      cancelled = true;
    };
  }, [selectedBoatId]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  /**
   * Detect document type from filename and content
   */
  const detectDocumentType = (filename: string, content: string): 'NOR' | 'SI' | 'SSI' | 'Appendix' | 'Calendar' | 'Amendment' | 'other' => {
    const lower = filename.toLowerCase();
    const contentLower = content.toLowerCase();

    if (lower.includes('amendment') || contentLower.includes('amendment')) return 'Amendment';
    if (lower.includes('nor') || lower.includes('notice')) return 'NOR';
    if (lower.includes('si') && !lower.includes('ssi')) return 'SI';
    if (lower.includes('ssi') || lower.includes('standard sailing')) return 'SSI';
    if (lower.includes('appendix') || lower.includes('attachment')) return 'Appendix';
    if (lower.endsWith('.csv') || lower.includes('calendar')) return 'Calendar';

    // Content-based detection
    if (contentLower.includes('notice of race')) return 'NOR';
    if (contentLower.includes('sailing instructions') && !contentLower.includes('standard')) return 'SI';
    if (contentLower.includes('standard sailing instructions')) return 'SSI';
    if (contentLower.includes('appendix')) return 'Appendix';

    return 'other';
  };

  const handleFileUpload = async (docType: 'nor' | 'si' | 'other') => {
    try {
      logger.debug('=== FILE UPLOAD STARTED ===');
      logger.debug('[handleFileUpload] Document type:', docType);
      logger.debug('[handleFileUpload] Current user:', user?.id ? 'Authenticated' : 'NOT AUTHENTICATED');
      logger.debug('[handleFileUpload] User ID:', user?.id);
      logger.debug('[handleFileUpload] User email:', user?.email);
      logger.debug('[handleFileUpload] Platform:', Platform.OS);
      logger.debug('[handleFileUpload] Opening document picker...');

      if (!user) {
        console.error('[handleFileUpload] No user authenticated!');
        Alert.alert('Not Authenticated', 'Please log in to upload documents');
        return;
      }

      setCurrentDocType(docType);

      // Pick document(s) - now supports multiple files
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'image/*'],
        copyToCacheDirectory: true,
        multiple: true, // Enable multi-file selection
      });

      logger.debug('[handleFileUpload] Document picker result:', JSON.stringify(result, null, 2));

      if (result.canceled) {
        logger.debug('[handleFileUpload] User cancelled');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        console.error('[handleFileUpload] No assets in result:', result);
        Alert.alert('Error', 'No file was selected');
        return;
      }

      logger.debug(`[handleFileUpload] Processing ${result.assets.length} file(s)...`);

      // Process each file
      for (const file of result.assets) {
        logger.debug('[handleFileUpload] Processing file:', file.name);

        // Create document entry with pending status
        const docId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newDoc = {
          id: docId,
          filename: file.name,
          docType: 'other' as any, // Will be detected after extraction
          status: 'extracting' as const,
        };

        setUploadedDocuments(prev => [...prev, newDoc]);

        try {
          let documentText = '';

          // Extract text based on file type
          if (file.mimeType === 'text/plain') {
            logger.debug('[handleFileUpload] Reading plain text file...');
            documentText = await FileSystem.readAsStringAsync(file.uri);
            logger.debug('[handleFileUpload] Plain text read successfully:', documentText.length, 'characters');
          } else if (file.mimeType === 'application/pdf') {
            logger.debug('[handleFileUpload] Extracting PDF text...');
            const extractionResult = await PDFExtractionService.extractText(file.uri, {
              maxPages: 50,
            });

            if (extractionResult.success && extractionResult.text) {
              documentText = extractionResult.text;
              logger.debug('[handleFileUpload] PDF text extracted successfully:', documentText.length, 'characters');
            } else {
              throw new Error(extractionResult.error || 'PDF extraction failed');
            }
          } else if (file.mimeType?.startsWith('image/')) {
            throw new Error('Image OCR not yet supported');
          } else {
            throw new Error(`Unsupported file type: ${file.mimeType}`);
          }

          // Detect document type
          const detectedType = detectDocumentType(file.name, documentText);
          logger.debug('[handleFileUpload] Detected document type:', detectedType);

          // Update document status to complete
          setUploadedDocuments(prev => prev.map(doc =>
            doc.id === docId
              ? { ...doc, status: 'complete' as const, content: documentText, docType: detectedType }
              : doc
          ));

          // Store document for upload after race creation
          setPendingDocuments(prev => [...prev, {
            file: {
              uri: file.uri,
              name: file.name,
              mimeType: file.mimeType || 'application/octet-stream',
              size: file.size || 0
            },
            docType: docType,
            extractedText: documentText
          }]);

          logger.debug('[handleFileUpload] Document processed successfully:', file.name);
        } catch (fileError: any) {
          console.error('[handleFileUpload] Error processing file:', file.name, fileError);

          // Update document status to error
          setUploadedDocuments(prev => prev.map(doc =>
            doc.id === docId
              ? { ...doc, status: 'error' as const, error: fileError.message }
              : doc
          ));
        }
      }

      setCurrentDocType(null);
      logger.debug('[handleFileUpload] All files processed');
      logger.debug('=== FILE UPLOAD COMPLETED ===');
    } catch (error: any) {
      console.error('=== FILE UPLOAD ERROR ===');
      console.error('[handleFileUpload] Error type:', error.constructor.name);
      console.error('[handleFileUpload] Error message:', error.message);
      console.error('[handleFileUpload] Error stack:', error.stack);
      console.error('[handleFileUpload] Full error:', error);
      setExtracting(false);
      setCurrentDocType(null);
      Alert.alert('Upload Error', error.message || 'Failed to upload document');
    }
  };

  /**
   * Fetch a remote PDF with graceful fallback when the origin blocks CORS requests in web builds.
   */
  const fetchPdfBlobWithFallback = async (url: string) => {
    // Helper to add timeout to any promise
    const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Request timed out after ${ms / 1000}s (${label})`)), ms)
        ),
      ]);
    };

    const attemptFetch = async (targetUrl: string, viaProxy: string | null) => {
      logger.debug('[fetchPdfBlobWithFallback] Attempting fetch', {
        url: targetUrl,
        mode: viaProxy ? `proxy:${viaProxy}` : 'direct',
      });

      // Add auth header if using Supabase edge function
      const headers: HeadersInit = {};
      if (viaProxy === 'supabase-pdf-proxy') {
        const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        if (anonKey) {
          headers['apikey'] = anonKey;
          headers['Authorization'] = `Bearer ${anonKey}`;
        }
      }

      // Use 12 second timeout for proxy requests, 25 seconds for direct
      const timeoutMs = viaProxy ? 12000 : 25000;
      const response = await withTimeout(
        fetch(targetUrl, { headers }),
        timeoutMs,
        viaProxy || 'direct'
      );

      // Check content type first to see if proxy returned JSON error
      const responseContentType = response.headers.get('content-type') || '';
      
      if (!response.ok) {
        // Try to parse JSON error from proxy
        if (responseContentType.includes('application/json')) {
          try {
            const errorJson = await response.json();
            const errorMsg = errorJson.error || `Failed to fetch PDF: ${response.status}`;
            const hint = errorJson.hint || '';
            throw new Error(hint ? `${errorMsg}\n\n${hint}` : errorMsg);
          } catch (jsonError) {
            // If JSON parse fails, fall through to default error
          }
        }
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }

      // Even with 200 OK, check if it's a JSON error (shouldn't happen with updated proxy)
      if (responseContentType.includes('application/json')) {
        const jsonResponse = await response.json();
        if (jsonResponse.error) {
          throw new Error(jsonResponse.error);
        }
      }

      const blob = await response.blob();
      logger.debug('[fetchPdfBlobWithFallback] Blob size (bytes):', blob.size);

      return {
        blob,
        contentType: responseContentType,
        viaProxy,
      };
    };

    const shouldUseProxyFirst = (() => {
      if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
      try {
        const targetOrigin = new URL(url, window.location.href).origin;
        return targetOrigin !== window.location.origin;
      } catch (originError) {
        logger.warn('[fetchPdfBlobWithFallback] Unable to determine origin, defaulting to proxy-first', originError);
        return true;
      }
    })();

    const tryProxyChain = async (originalError: any) => {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const proxies = [
        ...(supabaseUrl
          ? [
              {
                name: 'supabase-pdf-proxy',
                buildUrl: (target: string) =>
                  `${supabaseUrl}/functions/v1/pdf-proxy?url=${encodeURIComponent(target)}`,
              },
            ]
          : []),
        {
          name: 'allorigins',
          buildUrl: (target: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
        },
        {
          name: 'corsproxy-io',
          buildUrl: (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
        },
        {
          name: 'thingproxy',
          buildUrl: (target: string) => `https://thingproxy.freeboard.io/fetch/${target}`,
        },
      ];

      let lastProxyError: any = null;
      for (const proxy of proxies) {
        try {
          logger.warn('[fetchPdfBlobWithFallback] Using proxy due to direct fetch failure:', proxy.name);
          console.log(`🔄 Trying proxy: ${proxy.name}`);
          const proxiedUrl = proxy.buildUrl(url);
          return await attemptFetch(proxiedUrl, proxy.name);
        } catch (proxyError: any) {
          const errorMsg = proxyError?.message || String(proxyError);
          console.error(`❌ Proxy ${proxy.name} failed:`, errorMsg);
          logger.error('[fetchPdfBlobWithFallback] Proxy fetch failed:', proxy.name, proxyError);
          lastProxyError = proxyError;
        }
      }

      const friendlyError = new Error(
        'Unable to download PDF because the hosting site blocks cross-origin requests. Download the file manually and upload it, or paste the text directly.'
      );
      (friendlyError as any).cause = lastProxyError || originalError;
      throw friendlyError;
    };

    if (!shouldUseProxyFirst) {
      try {
        return await attemptFetch(url, null);
      } catch (error: any) {
        logger.error('[fetchPdfBlobWithFallback] Direct fetch failed:', error);
        logger.error('[fetchPdfBlobWithFallback] Error name:', error?.name);
        logger.error('[fetchPdfBlobWithFallback] Error message:', error?.message);

        const message = error?.message?.toLowerCase?.() || '';
        const isCorsError =
          error?.name === 'TypeError' ||
          message.includes('failed to fetch') ||
          message.includes('network request failed') ||
          message.includes('cors');

        logger.debug('[fetchPdfBlobWithFallback] Is CORS error?', isCorsError);
        logger.debug('[fetchPdfBlobWithFallback] Platform.OS:', Platform.OS);

        if (Platform.OS === 'web' && isCorsError) {
          return tryProxyChain(error);
        }

        throw error;
      }
    } else {
      logger.warn('[fetchPdfBlobWithFallback] Skipping direct fetch on web due to cross-origin URL');
      return tryProxyChain(new Error('Cross-origin fetch requires proxy'));
    }
  };

  const extractFromText = async (text: string) => {
    logger.debug('[extractFromText] Starting extraction...');
    logger.debug('[extractFromText] Text length:', text.length);

    if (!text.trim()) {
      logger.debug('[extractFromText] No text provided');
      Alert.alert('No Text', 'Please enter race information to extract');
      setExtracting(false);
      return;
    }

    let documentText = text;

    // Extract all URLs from the text (handles multiple URLs pasted together)
    const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
    const urls = text.match(urlPattern) || [];
    
    if (urls.length > 0) {
      logger.debug('[extractFromText] Detected URL input(s):', urls);

      try {
        const extractedTexts: string[] = [];
        const successfulUrls: string[] = [];
        const failedUrls: { url: string; error: string }[] = [];
        
        // Process each URL
        for (const url of urls) {
          try {
            logger.debug(`[extractFromText] Processing URL: ${url}`);
            const { blob, contentType, viaProxy } = await fetchPdfBlobWithFallback(url);
            logger.debug('[extractFromText] Content-Type:', contentType || '(none provided)', '| Source:', viaProxy ? `proxy:${viaProxy}` : 'direct');

            const isPdfContentType = contentType?.toLowerCase().includes('pdf');
            const looksLikePdf = isPdfContentType || url.toLowerCase().endsWith('.pdf');

            if (!looksLikePdf) {
              failedUrls.push({ url, error: `Not a PDF (received ${contentType || 'unknown'})` });
              continue;
            }

            const blobUrl = URL.createObjectURL(blob);

            logger.debug('[extractFromText] PDF downloaded, extracting text...');

            // Extract text from PDF
            const extractionResult = await PDFExtractionService.extractText(blobUrl, {
              maxPages: 50,
            });

            // Clean up blob URL
            URL.revokeObjectURL(blobUrl);

            if (!extractionResult.success || !extractionResult.text) {
              failedUrls.push({ url, error: extractionResult.error || 'Extraction failed' });
              continue;
            }

            const urlFilename = url.split('/').pop() || 'document.pdf';
            extractedTexts.push(`=== PDF: ${decodeURIComponent(urlFilename)} ===\n\n${extractionResult.text}`);
            successfulUrls.push(url);
            logger.debug('[extractFromText] PDF text extracted successfully:', extractionResult.text.length, 'characters');
          } catch (urlError: any) {
            failedUrls.push({ url, error: urlError.message || 'Unknown error' });
            logger.error(`[extractFromText] Failed to process URL: ${url}`, urlError);
          }
        }
        
        // Handle results
        if (extractedTexts.length === 0) {
          const errorDetails = failedUrls.map(f => `• ${f.url.split('/').pop()}: ${f.error}`).join('\n');
          throw new Error(`Failed to extract text from any PDF.\n\n${errorDetails}`);
        }
        
        // Combine all extracted texts
        documentText = extractedTexts.join('\n\n' + '='.repeat(50) + '\n\n');
        
        // Update the text area with extracted content
        const summary = urls.length === 1 
          ? `PDF extracted successfully`
          : `Extracted ${successfulUrls.length}/${urls.length} PDFs${failedUrls.length > 0 ? ` (${failedUrls.length} failed)` : ''}`;
        setFreeformText(`=== ${summary} ===\n\n${documentText}`);

      } catch (error: any) {
        console.error('[extractFromText] URL fetch/extraction error:', error);
        console.error('[extractFromText] Error message:', error?.message);
        const errorMsg = error.message || 'Could not fetch or extract PDF from URL. Please check the URL and try again.';
        // Alert.alert may not work on web, so also log prominently
        console.error('❌ PDF FETCH FAILED:', errorMsg);
        Alert.alert('PDF Fetch Failed', errorMsg);
        setExtracting(false);
        return;
      }
    }

    try {
      logger.debug('[extractFromText] Creating agent...');
      const agent = new ComprehensiveRaceExtractionAgent();
      logger.debug('[extractFromText] Calling extractRaceDetails...');
      logger.debug('[extractFromText] Document length:', documentText.length, 'characters');

      const result = await agent.extractRaceDetails(documentText);
      logger.debug('[extractFromText] Result:', result);

      if (!result.success || !result.data) {
        console.error('[extractFromText] Extraction failed:', result.error);
        Alert.alert('Extraction Failed', result.error || 'Could not extract race details');
        setExtracting(false);
        return;
      }

      // Check if this is a multi-race extraction
      const data = result.data as any;
      if (data.multipleRaces && data.races && data.races.length > 1) {
        logger.debug('[extractFromText] Multi-race extraction detected:', data.races.length, 'races');
        logger.debug('[extractFromText] Document type:', data.documentType);

        // Store the multi-race data for the selection screen
        setMultiRaceData(data);
        setShowMultiRaceSelection(true);
        setExtracting(false);
        setUploadedFileName('');
        return;
      }

      // Handle single race (either directly or first race from multi-race response)
      const singleRaceData = data.races && data.races.length === 1 ? data.races[0] : data;

      // Check if this is a partial extraction
      const isPartialExtraction = (result as any).partialExtraction;
      const missingFieldsMessage = (result as any).missingFields;

      if (isPartialExtraction) {
        logger.debug('[extractFromText] Partial extraction - some fields missing:', missingFieldsMessage);
      }

      logger.debug('[extractFromText] Extracted', Object.keys(singleRaceData).length, 'fields');

      // Phase 3: Show AI Validation Screen instead of auto-filling
      // Generate confidence scores for extracted fields
      const overallConfidence = result.confidence || singleRaceData.confidenceScores?.overall || 0.7;
      const confidenceScores: FieldConfidenceMap = singleRaceData.confidenceScores || {};

      // Fill in missing confidence scores
      Object.keys(singleRaceData).forEach(key => {
        if (!confidenceScores[key]) {
          const value = singleRaceData[key];
          // Assign confidence based on whether field was extracted and overall confidence
          if (value && value !== '' && value !== null && value !== undefined) {
            // High confidence for key fields that were extracted
            if (['raceName', 'raceDate', 'venue'].includes(key)) {
              confidenceScores[key] = Math.min(overallConfidence + 0.1, 1.0);
            } else {
              confidenceScores[key] = overallConfidence;
            }
          } else {
            // Low confidence for missing fields
            confidenceScores[key] = 0.3;
          }
        }
      });

      logger.debug('[extractFromText] Showing validation screen with', Object.keys(singleRaceData).length, 'fields');

      // Store extracted data and confidence scores
      setExtractedDataForValidation(singleRaceData);
      setConfidenceScoresForValidation(confidenceScores);

      // Show validation screen
      setShowValidationScreen(true);
      setExtracting(false); // Stop loading spinner
      setUploadedFileName(''); // Reset filename
    } catch (error: any) {
      console.error('[extractFromText] Error:', error);
      Alert.alert('Error', error.message || 'Failed to extract race details');
    } finally {
      setExtracting(false);
    }
  };

  const handleExtractFromText = async () => {
    logger.debug('[handleExtractFromText] Button clicked!');
    // Show preferences dialog first
    setPendingExtractionText(freeformText);
    setShowExtractionPreferences(true);
  };

  const handleExtractionPreferencesConfirm = async (preferences: ExtractionPreferences) => {
    logger.debug('[handleExtractionPreferencesConfirm] Preferences:', preferences);
    setExtractionPreferences(preferences);
    setShowExtractionPreferences(false);
    setExtracting(true);
    await extractFromText(pendingExtractionText);
  };

  /**
   * Process multiple uploaded documents using Edge Function multi-document mode
   */
  const processMultipleDocuments = async () => {
    logger.debug('[processMultipleDocuments] Starting multi-document processing...');

    const completedDocs = uploadedDocuments.filter(doc => doc.status === 'complete' && doc.content);

    if (completedDocs.length === 0) {
      Alert.alert('No Documents', 'Please upload at least one document first');
      return;
    }

    if (completedDocs.length === 1) {
      // Single document mode - use existing extraction
      logger.debug('[processMultipleDocuments] Only one document, using single-document mode');
      setExtracting(true);
      await extractFromText(completedDocs[0].content!);
      return;
    }

    try {
      setExtracting(true);
      setAggregationStatus('processing');

      logger.debug(`[processMultipleDocuments] Processing ${completedDocs.length} documents...`);

      // Prepare documents for Edge Function
      const documents = completedDocs.map(doc => ({
        filename: doc.filename,
        content: doc.content!,
        type: doc.docType
      }));

      // Call Edge Function with multi-document mode
      const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/extract-race-details`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            mode: 'multi',
            documents: documents
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Edge Function error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      logger.debug('[processMultipleDocuments] Edge Function result:', result);

      // Extract aggregation metadata
      if (result.aggregation_metadata) {
        setAggregationMetadata(result.aggregation_metadata);
        setAggregationStatus('complete');
      }

      // Extract race data and confidence scores
      const data = result.race_data || result;
      const confidenceScores: FieldConfidenceMap = result.confidence_by_field || {};

      // Override with overall confidence if field-level not provided
      const overallConfidence = result.aggregation_metadata?.overall_confidence || 0.7;
      Object.keys(data).forEach(key => {
        if (!confidenceScores[key]) {
          confidenceScores[key] = overallConfidence;
        }
      });

      // Show validation screen
      setExtractedDataForValidation(data);
      setConfidenceScoresForValidation(confidenceScores);
      setShowValidationScreen(true);

    } catch (error: any) {
      console.error('[processMultipleDocuments] Error:', error);
      setAggregationStatus('error');
      Alert.alert('Processing Error', error.message || 'Failed to process documents');
    } finally {
      setExtracting(false);
    }
  };

  /**
   * Phase 3: Handle AI Validation Screen Confirmation
   * Populate all form fields with validated data
   */
  const handleValidationConfirm = (validatedData: ExtractedData) => {
    logger.debug('=== VALIDATION CONFIRM CALLED ===');
    logger.debug('[handleValidationConfirm] Validated data keys:', Object.keys(validatedData));
    logger.debug('[handleValidationConfirm] Marks count:', validatedData.marks?.length || 0);
    logger.debug('[handleValidationConfirm] Racing area:', validatedData.racingArea);

    // Auto-fill all validated fields
    if (validatedData.raceName) setRaceName(validatedData.raceName);
    if (validatedData.raceDate) setRaceDate(validatedData.raceDate);
    if (validatedData.venue) setVenue(validatedData.venue);
    if (validatedData.description) setDescription(validatedData.description);

    // Timing & Sequence
    if (validatedData.warningSignalTime) setWarningSignalTime(validatedData.warningSignalTime);
    if (validatedData.warningSignalType) setWarningSignalType(validatedData.warningSignalType);
    if (validatedData.preparatoryMinutes != null) setPreparatoryMinutes(validatedData.preparatoryMinutes.toString());
    if (validatedData.classIntervalMinutes != null) setClassIntervalMinutes(validatedData.classIntervalMinutes.toString());
    if (validatedData.totalStarts != null) setTotalStarts(validatedData.totalStarts.toString());
    if (validatedData.startSequence) setStartSequence(validatedData.startSequence);
    if (validatedData.plannedFinishTime) setPlannedFinishTime(validatedData.plannedFinishTime);
    if (validatedData.timeLimitMinutes != null) setTimeLimitMinutes(validatedData.timeLimitMinutes.toString());

    // Communications - handle multi-channel VHF array
    if (validatedData.vhfChannels && Array.isArray(validatedData.vhfChannels) && validatedData.vhfChannels.length > 0) {
      // Store the full detailed array for metadata
      setVhfChannelsDetailed(validatedData.vhfChannels);
      
      // Find the primary/race committee channel, or use the first one
      const primaryChannel = validatedData.vhfChannels.find(
        ch => ch.purpose?.toLowerCase().includes('race committee') || 
              ch.purpose?.toLowerCase().includes('inner') ||
              !ch.purpose?.toLowerCase().includes('safety')
      ) || validatedData.vhfChannels[0];
      
      // Set primary channel
      if (primaryChannel) {
        setVhfChannel(primaryChannel.channel);
      }
      
      // Find backup channel (second non-safety channel, or outer starting line)
      const backupChannel = validatedData.vhfChannels.find(
        ch => ch !== primaryChannel && 
              !ch.purpose?.toLowerCase().includes('safety') &&
              ch.purpose?.toLowerCase().includes('outer')
      );
      if (backupChannel) {
        setVhfBackupChannel(backupChannel.channel);
      }
      
      // Find safety channel
      const safetyVhf = validatedData.vhfChannels.find(
        ch => ch.purpose?.toLowerCase().includes('safety') || 
              ch.purpose?.toLowerCase().includes('watch') ||
              ch.purpose?.toLowerCase().includes('listening')
      );
      if (safetyVhf) {
        setSafetyChannel(`VHF ${safetyVhf.channel}`);
      }
    } else {
      // Legacy single channel handling
      if (validatedData.vhfChannel) setVhfChannel(validatedData.vhfChannel);
      if (validatedData.vhfBackupChannel) setVhfBackupChannel(validatedData.vhfBackupChannel);
      if (validatedData.safetyChannel) setSafetyChannel(validatedData.safetyChannel);
    }
    if (validatedData.rcBoatName) setRcBoatName(validatedData.rcBoatName);
    if (validatedData.rcBoatPosition) setRcBoatPosition(validatedData.rcBoatPosition);
    if (validatedData.markBoats) setMarkBoats(validatedData.markBoats);
    if (validatedData.raceOfficer) setRaceOfficer(validatedData.raceOfficer);
    if (validatedData.protestCommittee) setProtestCommittee(validatedData.protestCommittee);

    // Course
    if (validatedData.startAreaName) setStartAreaName(validatedData.startAreaName);
    if (validatedData.startAreaDescription) setStartAreaDescription(validatedData.startAreaDescription || '');
    if (validatedData.startLineLength != null) setStartLineLength(validatedData.startLineLength.toString());
    if (validatedData.potentialCourses) setPotentialCourses(validatedData.potentialCourses || []);
    if (validatedData.courseSelectionCriteria) setCourseSelectionCriteria(validatedData.courseSelectionCriteria || '');
    if (validatedData.courseDiagramUrl) setCourseDiagramUrl(validatedData.courseDiagramUrl || '');
    
    // Finish area
    if (validatedData.finishAreaName) setFinishAreaName(validatedData.finishAreaName);
    if (validatedData.finishAreaDescription) setFinishAreaDescription(validatedData.finishAreaDescription || '');

    // Rules
    if (validatedData.scoringSystem) setScoringSystem(validatedData.scoringSystem || '');
    if (validatedData.penaltySystem) setPenaltySystem(validatedData.penaltySystem || '');
    if (validatedData.penaltyDetails) setPenaltyDetails(validatedData.penaltyDetails || '');
    if (validatedData.specialRules) setSpecialRules(validatedData.specialRules || []);
    if (validatedData.sailingInstructionsUrl) setSailingInstructionsUrl(validatedData.sailingInstructionsUrl || '');
    if (validatedData.noticeOfRaceUrl) setNoticeOfRaceUrl(validatedData.noticeOfRaceUrl || '');

    // Fleet
    if (validatedData.classDivisions) setClassDivisions(validatedData.classDivisions || []);
    if (validatedData.expectedFleetSize != null) setExpectedFleetSize(validatedData.expectedFleetSize.toString());

    // Weather
    if (validatedData.expectedWindDirection != null) setExpectedWindDirection(validatedData.expectedWindDirection.toString());
    if (validatedData.expectedWindSpeedMin != null) setExpectedWindSpeedMin(validatedData.expectedWindSpeedMin.toString());
    if (validatedData.expectedWindSpeedMax != null) setExpectedWindSpeedMax(validatedData.expectedWindSpeedMax.toString());
    if (validatedData.expectedConditions) setExpectedConditions(validatedData.expectedConditions || '');
    if (validatedData.tideAtStart) setTideAtStart(validatedData.tideAtStart || '');

    // Tactical
    if (validatedData.venueSpecificNotes) setVenueSpecificNotes(validatedData.venueSpecificNotes || '');
    if (validatedData.favoredSide) setFavoredSide(validatedData.favoredSide || '');
    if (validatedData.laylineStrategy) setLaylineStrategy(validatedData.laylineStrategy || '');
    if (validatedData.startStrategy) setStartStrategy(validatedData.startStrategy || '');

    // Registration
    if (validatedData.registrationDeadline) setRegistrationDeadline(validatedData.registrationDeadline || '');
    if (validatedData.entryFeeAmount != null) setEntryFeeAmount(validatedData.entryFeeAmount.toString());
    if (validatedData.entryFeeCurrency) setEntryFeeCurrency(validatedData.entryFeeCurrency || '');
    if (validatedData.checkInTime) setCheckInTime(validatedData.checkInTime || '');
    if (validatedData.skipperBriefingTime) setSkipperBriefingTime(validatedData.skipperBriefingTime || '');

    // NOR Documents
    if (validatedData.supplementarySIUrl) setSupplementarySIUrl(validatedData.supplementarySIUrl || '');
    if (validatedData.norAmendments) setNorAmendments(validatedData.norAmendments || []);

    // Governing Rules & Eligibility
    if (validatedData.racingRulesSystem) setRacingRulesSystem(validatedData.racingRulesSystem || '');
    if (validatedData.classRules) setClassRules(validatedData.classRules || '');
    if (validatedData.prescriptions) setPrescriptions(validatedData.prescriptions || '');
    if (validatedData.additionalDocuments) setAdditionalDocuments(validatedData.additionalDocuments || []);
    if (validatedData.eligibilityRequirements) setEligibilityRequirements(validatedData.eligibilityRequirements || '');
    if (validatedData.entryFormUrl) setEntryFormUrl(validatedData.entryFormUrl || '');
    if (validatedData.entryDeadline) setEntryDeadline(validatedData.entryDeadline || '');
    if (validatedData.lateEntryPolicy) setLateEntryPolicy(validatedData.lateEntryPolicy || '');

    // Schedule Details
    if (validatedData.eventSeriesName) setEventSeriesName(validatedData.eventSeriesName || '');
    if (validatedData.eventType) setEventType(validatedData.eventType || '');
    if (validatedData.racingDays) {
      setRacingDays(Array.isArray(validatedData.racingDays) ? validatedData.racingDays : [validatedData.racingDays]);
    }
    if (validatedData.racesPerDay != null) setRacesPerDay(validatedData.racesPerDay.toString());
    if (validatedData.firstWarningSignal) setFirstWarningSignal(validatedData.firstWarningSignal || '');
    if (validatedData.reserveDays) {
      setReserveDays(Array.isArray(validatedData.reserveDays) ? validatedData.reserveDays : [validatedData.reserveDays]);
    }

    // Course Attachments & Designations
    if (validatedData.courseAttachmentReference) setCourseAttachmentReference(validatedData.courseAttachmentReference || '');
    if (validatedData.courseAreaDesignation) setCourseAreaDesignation(validatedData.courseAreaDesignation || '');

    // Series Scoring Enhancements
    if (validatedData.seriesRacesRequired != null) setSeriesRacesRequired(validatedData.seriesRacesRequired.toString());
    if (validatedData.discardsPolicy) setDiscardsPolicy(validatedData.discardsPolicy || '');

    // Safety & Insurance
    if (validatedData.safetyRequirements) setSafetyRequirements(validatedData.safetyRequirements || '');
    if (validatedData.retirementNotificationRequirements) setRetirementNotificationRequirements(validatedData.retirementNotificationRequirements || '');
    if (validatedData.minimumInsuranceCoverage != null) setMinimumInsuranceCoverage(validatedData.minimumInsuranceCoverage.toString());
    if (validatedData.insurancePolicyReference) setInsurancePolicyReference(validatedData.insurancePolicyReference || '');

    // Prizes
    if (validatedData.prizesDescription) setPrizesDescription(validatedData.prizesDescription || '');
    if (validatedData.prizePresentationDetails) setPrizePresentationDetails(validatedData.prizePresentationDetails || '');

    // === NEW FIELDS ===
    // Time Limits
    if (validatedData.absoluteTimeLimit) setAbsoluteTimeLimit(validatedData.absoluteTimeLimit);
    if (validatedData.cutOffPoints && Array.isArray(validatedData.cutOffPoints)) {
      setCutOffPoints(validatedData.cutOffPoints);
    }
    
    // Race Office & Contacts
    if (validatedData.raceOfficeLocation) setRaceOfficeLocation(validatedData.raceOfficeLocation);
    if (validatedData.raceOfficePhone && Array.isArray(validatedData.raceOfficePhone)) {
      setRaceOfficePhone(validatedData.raceOfficePhone);
    }
    if (validatedData.contactEmail) setContactEmail(validatedData.contactEmail);
    
    // Entry Information
    if (validatedData.entryFees && Array.isArray(validatedData.entryFees)) {
      setEntryFees(validatedData.entryFees);
    }
    if (validatedData.eligibleClasses && Array.isArray(validatedData.eligibleClasses)) {
      setEligibleClasses(validatedData.eligibleClasses);
    }
    if (validatedData.safetyBriefingDetails) setSafetyBriefingDetails(validatedData.safetyBriefingDetails);
    
    // Prizegiving
    if (validatedData.prizegivingDate) setPrizegivingDate(validatedData.prizegivingDate);
    if (validatedData.prizegivingTime) setPrizegivingTime(validatedData.prizegivingTime);
    if (validatedData.prizegivingLocation) setPrizegivingLocation(validatedData.prizegivingLocation);

    // Expand all sections so user can see extracted data
    setExpandedSections(new Set(['basic', 'timing', 'comms', 'course', 'rules', 'fleet']));

    // Hide validation screen (but keep extractedDataForValidation for mark saving!)
    setShowValidationScreen(false);
    // DON'T clear extractedDataForValidation - we need it to save marks!
    // setExtractedDataForValidation(null);
    logger.debug('[handleValidationConfirm] extractedDataForValidation state after confirm:', extractedDataForValidation);
    logger.debug('[handleValidationConfirm] Marks still in state:', extractedDataForValidation?.marks?.length || 0);

    // Show different message based on completeness
    const message = validatedData.raceDate
      ? 'Data validated and populated. Review and edit as needed.'
      : 'Data populated! Please fill in the missing race date and any other required fields.';

    Alert.alert('Success!', message, [{ text: 'OK' }]);
  };

  /**
   * Phase 3: Handle AI Validation Screen Cancellation
   */
  const handleValidationCancel = () => {
    logger.debug('[handleValidationCancel] User cancelled validation');
    setShowValidationScreen(false);
    setExtractedDataForValidation(null);
    setConfidenceScoresForValidation({});
  };

  /**
   * Create a single race from extracted data
   * Used by batch multi-race creation
   */
  const createRaceFromExtractedData = async (raceData: ExtractedData): Promise<string | null> => {
    console.log('📋 [CREATE] createRaceFromExtractedData STARTED for:', raceData.raceName);
    
    if (!user?.id) {
      console.log('❌ [CREATE] No user found - aborting');
      logger.error('[createRaceFromExtractedData] No user found');
      return null;
    }
    console.log('✅ [CREATE] User found:', user.id);

    // Validate minimum required fields
    if (!raceData.raceName?.trim()) {
      console.log('❌ [CREATE] Race has no name - skipping');
      logger.warn('[createRaceFromExtractedData] Skipping race with no name');
      return null;
    }
    console.log('✅ [CREATE] Race name validated:', raceData.raceName);

    try {
      // Skip weather fetch for batch creation - it can be fetched later when viewing race
      // This significantly speeds up batch race creation
      const venueName = raceData.venue || raceData.venueVariant || 'Unknown Venue';
      console.log('📍 [CREATE] Venue:', venueName);

      const insertData = {
        created_by: user.id,
        name: raceData.raceName.trim(),
        start_date: raceData.raceDate || null,
        description: raceData.description?.trim() || null,
        metadata: {
          venue_name: venueName,
          wind: { direction: 'Variable', speedMin: 8, speedMax: 15 },
          tide: { state: 'slack' as const, height: 1.0 },
          series_name: raceData.raceSeriesName || null,
        },
        status: 'planned',
        warning_signal_time: raceData.warningSignalTime || null,
        vhf_channel: raceData.vhfChannel || null,
        safety_channel: raceData.safetyChannel || 'VHF 16',
        race_officer: raceData.raceOfficer || null,
        scoring_system: raceData.scoringSystem || 'Low Point',
        sailing_instructions_url: null,
        notice_of_race_url: null,
        event_series_name: raceData.raceSeriesName || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('💾 [CREATE] About to insert into Supabase...');
      console.log('💾 [CREATE] Insert data keys:', Object.keys(insertData));
      
      // Try a simpler approach - just do the insert directly
      console.log('💾 [CREATE] Calling supabase.from("regattas").insert()...');
      
      const { data, error } = await supabase
        .from('regattas')
        .insert(insertData)
        .select('id')
        .single();

      console.log('💾 [CREATE] Supabase insert completed!');
      console.log('💾 [CREATE] Error:', error);
      console.log('💾 [CREATE] Data:', data);

      if (error) {
        console.log('❌ [CREATE] Supabase insert FAILED:', error.message);
        logger.error('[createRaceFromExtractedData] Insert error:', error);
        return null;
      }
      
      console.log('✅ [CREATE] Race inserted successfully with ID:', data?.id);

      logger.debug('[createRaceFromExtractedData] Created race:', data.id, raceData.raceName);
      return data.id;
    } catch (error) {
      logger.error('[createRaceFromExtractedData] Error:', error);
      return null;
    }
  };

  /**
   * Batch create multiple races from selection
   */
  const handleBatchCreateRaces = async (selectedRaces: ExtractedData[]) => {
    console.log('🚀 [BATCH] handleBatchCreateRaces STARTED with', selectedRaces.length, 'races');
    logger.debug('[handleBatchCreateRaces] Creating', selectedRaces.length, 'races');
    
    setIsCreatingMultipleRaces(true);
    const createdRaceIds: string[] = [];
    const failedRaces: string[] = [];

    try {
      for (let i = 0; i < selectedRaces.length; i++) {
        const race = selectedRaces[i];
        console.log(`🏁 [BATCH] Processing race ${i + 1}/${selectedRaces.length}:`, race.raceName);
        
        setMultiRaceProgress({
          current: i + 1,
          total: selectedRaces.length,
          raceName: race.raceName || `Race ${i + 1}`,
        });

        console.log(`📝 [BATCH] Calling createRaceFromExtractedData for:`, race.raceName);
        const raceId = await createRaceFromExtractedData(race);
        console.log(`✅ [BATCH] createRaceFromExtractedData returned:`, raceId);
        
        if (raceId) {
          createdRaceIds.push(raceId);
          console.log(`✅ [BATCH] Race created successfully:`, raceId);
        } else {
          failedRaces.push(race.raceName || `Race ${i + 1}`);
          console.log(`❌ [BATCH] Race creation failed for:`, race.raceName);
        }
      }

      // Show results
      setIsCreatingMultipleRaces(false);
      setMultiRaceProgress(null);
      setShowMultiRaceSelection(false);
      setMultiRaceData(null);

      if (createdRaceIds.length === selectedRaces.length) {
        // All succeeded - show message and navigate
        const message = `Successfully added ${createdRaceIds.length} races to your calendar!`;
        if (Platform.OS === 'web') {
          window.alert(message);
          router.replace('/(tabs)/races');
        } else {
          Alert.alert(
            'Races Created!',
            message,
            [{
              text: 'View Races',
              onPress: () => router.replace('/(tabs)/races'),
            }]
          );
        }
      } else if (createdRaceIds.length > 0) {
        // Some failed
        const message = `Created ${createdRaceIds.length} of ${selectedRaces.length} races.\n\nFailed: ${failedRaces.join(', ')}`;
        if (Platform.OS === 'web') {
          window.alert(message);
          router.replace('/(tabs)/races');
        } else {
          Alert.alert(
            'Partially Complete',
            message,
            [{
              text: 'View Races',
              onPress: () => router.replace('/(tabs)/races'),
            }]
          );
        }
      } else {
        // All failed
        const errorMsg = 'Failed to create races. Please try again or add them manually.';
        if (Platform.OS === 'web') {
          window.alert(errorMsg);
        } else {
          Alert.alert('Error', errorMsg);
        }
      }
    } catch (error) {
      logger.error('[handleBatchCreateRaces] Error:', error);
      setIsCreatingMultipleRaces(false);
      setMultiRaceProgress(null);
      const errorMsg = 'An error occurred while creating races. Please try again.';
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    }
  };

  const handleHeaderBack = useCallback(() => {
    if (onCancel) {
      onCancel();
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/races');
    }
  }, [onCancel, router]);

  /**
   * Handle race suggestion selection
   */
  const handleSelectSuggestion = async (suggestion: RaceSuggestion) => {
    console.log('✨ [ComprehensiveRaceEntry] Suggestion selected:', suggestion);
    logger.debug('[handleSelectSuggestion] canAddDirectly:', suggestion.canAddDirectly);

    // Set processing state
    setProcessingSuggestionId(suggestion.id);

    try {
      // If suggestion has enough data, create race directly
      if (suggestion.canAddDirectly) {
        await handleDirectRaceCreation(suggestion);
        return;
      }

      // Otherwise, fill the form with suggestion data
      logger.debug('[handleSelectSuggestion] Filling form with suggestion:', suggestion.raceData);

      // Auto-fill the form with suggestion data
      if (suggestion.raceData.raceName) {
        setRaceName(suggestion.raceData.raceName);
      }
      if (suggestion.raceData.venue) {
        setVenue(suggestion.raceData.venue);
      }
      if (suggestion.raceData.startDate) {
        const parsedDate = new Date(suggestion.raceData.startDate);
        if (!Number.isNaN(parsedDate.getTime())) {
          setRaceDate(parsedDate.toISOString().slice(0, 10));
        }
      }
      if (suggestion.raceData.boatClass) {
        setBoatClass(suggestion.raceData.boatClass);
      }
      if (suggestion.raceData.venueCoordinates) {
        setVenueCoordinates(suggestion.raceData.venueCoordinates);
      }
      if (suggestion.raceData.description) {
        setDescription(suggestion.raceData.description);
      }

      // Record that the suggestion was accepted
      await acceptSuggestion(suggestion.id);

      // Show success toast
      toast.show({
        placement: 'top',
        render: () => (
          <Toast action="success" variant="solid">
            <ToastTitle>Suggestion Applied</ToastTitle>
            <ToastDescription>
              Race details filled from: {suggestion.reason}
            </ToastDescription>
          </Toast>
        ),
      });
    } finally {
      setProcessingSuggestionId(null);
    }
  };

  /**
   * Directly create a race from a suggestion
   */
  const handleDirectRaceCreation = async (suggestion: RaceSuggestion) => {
    console.log('🚀 [ComprehensiveRaceEntry] Creating race directly from suggestion:', suggestion);
    logger.debug('[handleDirectRaceCreation] Starting direct race creation');

    // Validate required fields
    if (!suggestion.raceData.raceName) {
      Alert.alert('Error', 'Cannot create race: missing race name');
      return;
    }
    if (!suggestion.raceData.startDate) {
      Alert.alert('Error', 'Cannot create race: missing start date');
      return;
    }
    if (!suggestion.raceData.venue && !suggestion.raceData.venueCoordinates) {
      Alert.alert('Error', 'Cannot create race: missing venue information');
      return;
    }

    setSaving(true);

    try {
      if (!user?.id) {
        Alert.alert('Authentication Error', 'You must be logged in to create a race');
        return;
      }

      // Fetch weather data
      logger.debug('[handleDirectRaceCreation] Fetching weather data...');
      const weatherData = suggestion.raceData.venueCoordinates
        ? await RaceWeatherService.fetchWeatherByCoordinates(
            suggestion.raceData.venueCoordinates.lat,
            suggestion.raceData.venueCoordinates.lng,
            suggestion.raceData.startDate,
            suggestion.raceData.venue || 'Racing Area'
          )
        : suggestion.raceData.venue
        ? await RaceWeatherService.fetchWeatherByVenueName(
            suggestion.raceData.venue,
            suggestion.raceData.startDate
          )
        : null;

      // Prepare race data
      const raceData = {
        created_by: user.id,
        name: suggestion.raceData.raceName.trim(),
        start_date: suggestion.raceData.startDate,
        description: suggestion.raceData.description?.trim() || null,
        boat_id: selectedBoatId || null,
        class_id: selectedClassId ?? null,
        metadata: {
          venue_name: suggestion.raceData.venue?.trim() || 'Racing Area',
          racing_area_coordinates: suggestion.raceData.venueCoordinates || undefined,
          weather_data: weatherData || undefined,
          source: 'suggestion',
          suggestion_id: suggestion.id,
          boat_class: suggestion.raceData.boatClass || undefined,
          race_series: suggestion.raceData.raceSeries || undefined,
          registration_url: suggestion.raceData.registrationUrl || undefined,
        },
      };

      // Create race
      logger.debug('[handleDirectRaceCreation] Creating race in database...');
      const { data, error } = await supabase
        .from('regattas')
        .insert(raceData)
        .select('id')
        .single();

      if (error) {
        console.error('[handleDirectRaceCreation] Error creating race:', error);
        throw error;
      }

      logger.debug('[handleDirectRaceCreation] Race created successfully:', data.id);

      // Download and attach documents if URLs are provided
      if (suggestion.raceData.documentUrls) {
        logger.debug('[handleDirectRaceCreation] Downloading race documents...');
        const documentPromises = [];

        if (suggestion.raceData.documentUrls.nor) {
          documentPromises.push(
            downloadAndAttachDocument(
              data.id,
              suggestion.raceData.documentUrls.nor,
              'NOR'
            )
          );
        }

        if (suggestion.raceData.documentUrls.si) {
          documentPromises.push(
            downloadAndAttachDocument(
              data.id,
              suggestion.raceData.documentUrls.si,
              'SI'
            )
          );
        }

        // Wait for all documents to download/attach (but don't fail if they error)
        await Promise.allSettled(documentPromises);
      }

      // Record that the suggestion was accepted
      await acceptSuggestion(suggestion.id);

      // Show success toast
      toast.show({
        placement: 'top',
        render: () => (
          <Toast action="success" variant="solid">
            <ToastTitle>Race Added to Calendar</ToastTitle>
            <ToastDescription>
              {suggestion.raceData.raceName} has been added successfully
            </ToastDescription>
          </Toast>
        ),
      });

      // Navigate to the race detail page
      logger.debug('[handleDirectRaceCreation] Navigating to race detail page');
      if (onSubmit) {
        onSubmit(data.id);
      } else {
        router.push(`/(tabs)/race/scrollable/${data.id}` as any);
      }
    } catch (error: any) {
      console.error('[handleDirectRaceCreation] Error:', error);
      Alert.alert('Error', error.message || 'Failed to create race from suggestion');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Download and attach a document to a race
   */
  const downloadAndAttachDocument = async (
    raceId: string,
    documentUrl: string,
    docType: 'NOR' | 'SI'
  ) => {
    try {
      logger.debug('[downloadAndAttachDocument] Downloading:', { raceId, documentUrl, docType });

      // For now, just store the URL in metadata
      // TODO: Actually download and upload to Supabase storage
      const { error } = await supabase
        .from('regattas')
        .update({
          metadata: supabase.raw(`
            jsonb_set(
              COALESCE(metadata, '{}'::jsonb),
              '{document_urls, ${docType.toLowerCase()}}',
              '"${documentUrl}"'::jsonb
            )
          `)
        })
        .eq('id', raceId);

      if (error) {
        console.error('[downloadAndAttachDocument] Error:', error);
      } else {
        logger.debug('[downloadAndAttachDocument] Document URL stored successfully');
      }
    } catch (error) {
      console.error('[downloadAndAttachDocument] Error:', error);
      // Don't throw - we don't want to fail race creation if document download fails
    }
  };

  /**
   * Handle dismissing a suggestion
   */
  const handleDismissSuggestion = async (suggestionId: string) => {
    console.log('❌ [ComprehensiveRaceEntry] Suggestion dismissed:', suggestionId);
    await dismissSuggestion(suggestionId);
  };

  /**
   * Handle racing area polygon selection from map
  */
  const handleRacingAreaSelected = useCallback((coordinates: [number, number][]) => {
    setRacingAreaPolygon(coordinates);

    if (!coordinates || coordinates.length === 0) {
      return;
    }

    // Compute centroid (simple average since all points assumed to be close)
    const { lat, lng } = coordinates.reduce(
      (acc, [pointLng, pointLat]) => {
        acc.lat += pointLat;
        acc.lng += pointLng;
        return acc;
      },
      { lat: 0, lng: 0 }
    );
    const centroid = {
      lat: lat / coordinates.length,
      lng: lng / coordinates.length,
    };

    setVenueCoordinates((current) => {
      if (
        current &&
        Math.abs(current.lat - centroid.lat) < 0.0001 &&
        Math.abs(current.lng - centroid.lng) < 0.0001
      ) {
        return current;
      }
      return centroid;
    });

    setVenue((current) => {
      if (current && current.trim().length > 0) {
        return current;
      }

      const formatter = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      });
      return `Racing Area @ ${formatter.format(centroid.lat)}°, ${formatter.format(centroid.lng)}°`;
    });

    // Propagate coordinates to validation/extraction metadata
    setExtractedDataForValidation((existing) => {
      if (!existing) {
        return existing;
      }
      return {
        ...existing,
        metadata: {
          ...existing.metadata,
          venue_coordinates: centroid,
          venue_name:
            existing.metadata?.venue_name && existing.metadata.venue_name.trim().length > 0
              ? existing.metadata.venue_name
              : `Racing Area @ ${centroid.lat.toFixed(3)}°, ${centroid.lng.toFixed(3)}°`,
        },
      };
    });

  }, []);

  /**
   * Upload pending documents to Supabase Storage and create database records
   */
  const uploadPendingDocuments = async (regattaId: string) => {
    if (pendingDocuments.length === 0) {
      logger.debug('[uploadPendingDocuments] No documents to upload');
      return;
    }

    logger.debug(`[uploadPendingDocuments] Uploading ${pendingDocuments.length} documents for regatta ${regattaId}`);

    for (const doc of pendingDocuments) {
      try {
        logger.debug('[uploadPendingDocuments] Processing:', doc.file.name);

        // Read file content
        let fileData: string;
        if (Platform.OS === 'web') {
          // For web, fetch the blob
          const response = await fetch(doc.file.uri);
          const blob = await response.blob();
          fileData = blob as any; // Supabase client handles blob upload
        } else {
          // For native, read as base64
          fileData = await FileSystem.readAsStringAsync(doc.file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }

        // Upload to Supabase Storage
        const fileExt = doc.file.name.split('.').pop() || 'pdf';
        const fileName = `${regattaId}/${Date.now()}_${doc.file.name}`;
        const storagePath = `race-documents/${fileName}`;

        logger.debug('[uploadPendingDocuments] Uploading to storage:', storagePath);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(storagePath, fileData, {
            contentType: doc.file.mimeType,
            upsert: false,
          });

        if (uploadError) {
          console.error('[uploadPendingDocuments] Storage upload error:', uploadError);
          throw uploadError;
        }

        logger.debug('[uploadPendingDocuments] Upload successful:', uploadData);

        // Get public URL (or signed URL if bucket is private)
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(storagePath);

        // Create document record in database
        const documentRecord = {
          user_id: user?.id,
          regatta_id: regattaId,
          filename: doc.file.name,
          title: doc.file.name,
          file_path: storagePath,
          file_size: doc.file.size,
          mime_type: doc.file.mimeType,
          document_type: doc.docType === 'nor' ? 'notice_of_race' : doc.docType === 'si' ? 'sailing_instructions' : 'other',
          processing_status: 'completed',
          extracted_content: doc.extractedText,
          used_for_extraction: true,
          extraction_timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        logger.debug('[uploadPendingDocuments] Creating document record:', documentRecord.filename);

        const { error: dbError } = await supabase
          .from('documents')
          .insert(documentRecord);

        if (dbError) {
          console.error('[uploadPendingDocuments] Database insert error:', dbError);
          throw dbError;
        }

        logger.debug('[uploadPendingDocuments] Document record created successfully');
      } catch (error: any) {
        console.error('[uploadPendingDocuments] Error uploading document:', doc.file.name, error);
        // Continue with other documents even if one fails
        Alert.alert(
          'Document Upload Warning',
          `Failed to upload "${doc.file.name}": ${error.message}. Other documents may have been uploaded successfully.`
        );
      }
    }

    logger.debug('[uploadPendingDocuments] All documents processed');
  };

  const handleSubmit = async () => {
    logger.debug('=== HANDLESUBMIT CALLED ===');
    // Normalize fields that might come in as arrays/objects from suggestions or prefill
    const normalizedClassRules =
      typeof classRules === 'string'
        ? classRules.trim()
        : Array.isArray(classRules)
        ? classRules
            .map((item) => (typeof item === 'string' ? item.trim() : String(item)))
            .filter(Boolean)
            .join(', ')
        : classRules
        ? String(classRules)
        : null;

    logger.debug('[handleSubmit] raceName:', raceName);
    logger.debug('[handleSubmit] raceDate:', raceDate);
    logger.debug('[handleSubmit] venue:', venue);
    logger.debug('[handleSubmit] saving state:', saving);

    // Validation
    if (!raceName.trim()) {
      logger.debug('[handleSubmit] VALIDATION FAILED: No race name');
      Alert.alert('Required', 'Please enter a race name');
      return;
    }
    if (!raceDate) {
      logger.debug('[handleSubmit] VALIDATION FAILED: No race date');
      Alert.alert('Required', 'Please enter a race date');
      return;
    }
    // Allow omission of venue as long as we have coordinates (e.g. drawn racing area)
    const hasVenueText = venue.trim().length > 0;
    const hasCoordinates = Boolean(
      (venueCoordinates && !Number.isNaN(venueCoordinates.lat) && !Number.isNaN(venueCoordinates.lng)) ||
      (racingAreaPolygon && racingAreaPolygon.length >= 3)
    );
    if (!hasVenueText && !hasCoordinates) {
      logger.debug('[handleSubmit] VALIDATION FAILED: No venue text or coordinates');
      Alert.alert('Required', 'Please enter a venue or draw a racing area so we can determine the location.');
      return;
    }

    logger.debug('[handleSubmit] Validation passed, setting saving=true');
    setSaving(true);

    try {
      logger.debug('[handleSubmit] Starting try block...');

      // Use user from AuthProvider hook (already authenticated)
      logger.debug('[handleSubmit] Checking authenticated user...');

      if (!user?.id) {
        console.error('[handleSubmit] No user found in AuthProvider');
        Alert.alert('Authentication Error', 'You must be logged in to create a race. Please log in and try again.');
        setSaving(false);
        return;
      }

      logger.debug('[handleSubmit] User email:', user.email);

      // Weather data handling:
      // - Edit mode: Preserve original weather data (historical forecast)
      // - Create mode: Fetch fresh weather data
      let weatherData = null;

      if (existingRaceId && originalWeatherData) {
        // Editing existing race - preserve original weather data
        logger.debug('[handleSubmit] Edit mode: Preserving original weather data');
        logger.debug('[handleSubmit] Original weather provider:', originalWeatherData.weather_provider);
        weatherData = {
          wind: originalWeatherData.wind,
          tide: originalWeatherData.tide,
          provider: originalWeatherData.weather_provider,
          fetchedAt: originalWeatherData.weather_fetched_at,
          confidence: originalWeatherData.weather_confidence,
        };
      } else {
        // Creating new race - fetch fresh weather data
        logger.debug('[handleSubmit] Create mode: Fetching weather data for race...');
        weatherData = venueCoordinates
          ? await RaceWeatherService.fetchWeatherByCoordinates(
              venueCoordinates.lat,
              venueCoordinates.lng,
              raceDate,
              venue.trim(),
              { warningSignalTime: warningSignalTime || null }
            )
          : await RaceWeatherService.fetchWeatherByVenueName(
              venue.trim(),
              raceDate,
              { warningSignalTime: warningSignalTime || null }
            );
      }

      const primaryClassEntry = classDivisions.find((d) => d.name?.trim());
      const primaryClassName = primaryClassEntry?.name?.trim() || null;

      const raceData = {
        created_by: user.id,
        name: raceName.trim(),
        start_date: raceDate,
        description: description.trim() || null,
        boat_id: selectedBoatId || null,
        class_id: selectedClassId ?? null,
        metadata: {
          venue_name: venue.trim(),
          // Store racing area coordinates if selected on map
          racing_area_coordinates: venueCoordinates || undefined,
          // Store real weather data if available, otherwise use defaults
          wind: weatherData?.wind || { direction: 'Variable', speedMin: 8, speedMax: 15 },
          tide: weatherData?.tide || { state: 'slack' as const, height: 1.0 },
          weather_provider: weatherData?.provider,
          weather_fetched_at: weatherData?.fetchedAt,
          weather_confidence: weatherData?.confidence,
          // Store full VHF channels array with purposes
          vhf_channels: vhfChannelsDetailed.length > 0 ? vhfChannelsDetailed : undefined,
          ...(selectedClassId ? { class_id: selectedClassId } : {}),
          ...(primaryClassName ? { class_name: primaryClassName } : {}),
        },
        status: 'planned',

        // Timing & Sequence
        warning_signal_time: warningSignalTime || null,
        warning_signal_type: warningSignalType || null,
        preparatory_signal_minutes: preparatoryMinutes ? parseInt(preparatoryMinutes) : 4,
        class_interval_minutes: classIntervalMinutes ? parseInt(classIntervalMinutes) : 5,
        total_starts: totalStarts ? parseInt(totalStarts) : 1,
        start_sequence_details: startSequence.length > 0 ? startSequence : null,
        planned_finish_time: plannedFinishTime || null,
        time_limit_minutes: timeLimitMinutes ? parseInt(timeLimitMinutes) : null,

        // Communications
        vhf_channel: vhfChannel.trim() || null,
        vhf_backup_channel: vhfBackupChannel.trim() || null,
        safety_channel: safetyChannel.trim() || 'VHF 16',
        rc_boat_name: rcBoatName.trim() || null,
        rc_boat_position: rcBoatPosition.trim() || null,
        mark_boat_positions: markBoats.length > 0 ? markBoats : null,
        race_officer: raceOfficer.trim() || null,
        protest_committee: protestCommittee.trim() || null,

        // Course & Start Area
        start_area_name: startAreaName.trim() || null,
        start_area_description: startAreaDescription.trim() || null,
        start_line_length_meters: startLineLength ? parseFloat(startLineLength) : null,
        potential_courses: potentialCourses.length > 0 ? potentialCourses : null,
        course_selection_criteria: courseSelectionCriteria.trim() || null,
        course_diagram_url: courseDiagramUrl.trim() || null,
        
        // Finish area
        finish_area_name: finishAreaName.trim() || null,
        finish_area_description: finishAreaDescription.trim() || null,
        finish_area_coordinates: finishAreaCoordinates || null,
        // Save racing area polygon as GeoJSON for display on race detail map
        racing_area_polygon: racingAreaPolygon && racingAreaPolygon.length >= 3 ? {
          type: 'Polygon',
          coordinates: [[...racingAreaPolygon, racingAreaPolygon[0]]] // Close the polygon
        } : null,

        // Rules & Penalties
        scoring_system: scoringSystem || 'Low Point',
        penalty_system: penaltySystem || '720°',
        penalty_details: penaltyDetails?.trim() || null,
        special_rules: specialRules?.length > 0 ? specialRules : null,
        sailing_instructions_url: sailingInstructionsUrl?.trim() || null,
        notice_of_race_url: noticeOfRaceUrl?.trim() || null,

        // Fleet
        class_divisions: classDivisions?.filter((d) => d.name?.trim()).length > 0 ? classDivisions : null,
        expected_fleet_size: expectedFleetSize ? parseInt(expectedFleetSize) : null,

        // Weather
        expected_wind_direction: expectedWindDirection ? parseInt(expectedWindDirection) : null,
        expected_wind_speed_min: expectedWindSpeedMin ? parseInt(expectedWindSpeedMin) : null,
        expected_wind_speed_max: expectedWindSpeedMax ? parseInt(expectedWindSpeedMax) : null,
        expected_conditions: expectedConditions?.trim() || null,
        tide_at_start: tideAtStart?.trim() || null,

        // Tactical
        venue_specific_notes: venueSpecificNotes?.trim() || null,
        favored_side: favoredSide || null,
        layline_strategy: laylineStrategy || null,
        start_strategy: startStrategy || null,

        // Registration
        registration_deadline: registrationDeadline || null,
        entry_fee_amount: entryFeeAmount ? parseFloat(entryFeeAmount) : null,
        entry_fee_currency: entryFeeCurrency || 'USD',
        check_in_time: checkInTime || null,
        skipper_briefing_time: skipperBriefingTime || null,

        // NOR Document Fields
        supplementary_si_url: supplementarySIUrl?.trim() || null,
        nor_amendments: norAmendments?.length > 0 ? norAmendments : null,

        // Governing Rules
        governing_rules: {
          racing_rules_system: racingRulesSystem?.trim() || null,
          class_rules: normalizedClassRules || null,
          prescriptions: prescriptions?.trim() || null,
          additional_documents: additionalDocuments?.filter(d => d?.trim()).length > 0 ? additionalDocuments : null,
        },

        // Eligibility & Entry
        eligibility_requirements: eligibilityRequirements?.trim() || null,
        entry_form_url: entryFormUrl?.trim() || null,
        entry_deadline: entryDeadline || null,
        late_entry_policy: lateEntryPolicy?.trim() || null,

        // Schedule Details
        event_series_name: eventSeriesName?.trim() || null,
        event_type: eventType?.trim() || null,
        racing_days: racingDays?.length > 0 ? racingDays : null,
        races_per_day: racesPerDay ? parseInt(racesPerDay) : null,
        first_warning_signal: firstWarningSignal || null,
        reserve_days: reserveDays?.length > 0 ? reserveDays : null,

        // Enhanced Course Information
        course_attachment_reference: courseAttachmentReference?.trim() || null,
        course_area_designation: courseAreaDesignation?.trim() || null,

        // Enhanced Scoring
        series_races_required: seriesRacesRequired ? parseInt(seriesRacesRequired) : null,
        discards_policy: discardsPolicy?.trim() || null,

        // Safety
        safety_requirements: safetyRequirements?.trim() || null,
        retirement_notification_requirements: retirementNotificationRequirements?.trim() || null,

        // Insurance
        minimum_insurance_coverage: minimumInsuranceCoverage ? parseFloat(minimumInsuranceCoverage) : null,
        insurance_policy_reference: insurancePolicyReference?.trim() || null,

        // Prizes
        prizes_description: prizesDescription?.trim() || null,
        prize_presentation_details: prizePresentationDetails?.trim() || null,

        // Race Type (Fleet vs Distance)
        race_type: raceType,
        
        // Distance Racing Fields (only populated for distance races)
        route_waypoints: raceType === 'distance' && routeWaypoints.length > 0 ? routeWaypoints : null,
        total_distance_nm: raceType === 'distance' && totalDistanceNm ? parseFloat(totalDistanceNm) : null,
        time_limit_hours: raceType === 'distance' && timeLimitHours ? parseFloat(timeLimitHours) : null,
        start_finish_same_location: raceType === 'distance' ? startFinishSameLocation : null,

        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingRaceId) {
        // Update existing race
        const { error } = await supabase
          .from('regattas')
          .update(raceData)
          .eq('id', existingRaceId);

        if (error) throw error;

        // Upload any pending documents
        if (pendingDocuments.length > 0) {
          logger.debug('[handleSubmit] Uploading pending documents for existing race...');
          await uploadPendingDocuments(existingRaceId);
        }

        Alert.alert('Success', 'Race updated successfully!');

        // For updates, also pass metadata (though CourseSetupPrompt won't show for edits)
        const extractionMetadata: ExtractionMetadata = {
          raceName: raceName,
          racingAreaName: startAreaName || undefined,
          extractedMarks: extractedDataForValidation?.marks || undefined,
          venueId: undefined,
        };

        onSubmit?.(existingRaceId, extractionMetadata);
      } else {
        // Create new race
        logger.debug('[handleSubmit] ===== CREATING NEW RACE =====');
        logger.debug('[handleSubmit] Authenticated user ID:', user.id);
        logger.debug('[handleSubmit] Race data keys:', Object.keys(raceData));

        logger.debug('[handleSubmit] Calling supabase.from("regattas").insert()...');
        const { data, error } = await supabase
          .from('regattas')
          .insert(raceData)
          .select('id')
          .single();

        logger.debug('[handleSubmit] ===== INSERT COMPLETE =====');
        logger.debug('[handleSubmit] Insert returned error:', error);

        if (error) {
          console.error('[handleSubmit] Race creation error:', error);
          throw error;
        }

        logger.debug('[handleSubmit] ===== RACE CREATED SUCCESSFULLY =====');
        logger.debug('[handleSubmit] Race ID:', data.id);
        logger.debug('[handleSubmit] Race ID type:', typeof data?.id);
        logger.debug('[handleSubmit] Race ID length:', data?.id?.length);

        // Create a race_event for this regatta (needed for marks storage)
        // race_events are individual races within a regatta
        let raceEventId: string | null = null;

        if (extractedDataForValidation?.marks || extractedDataForValidation?.racingArea) {
          logger.debug('[handleSubmit] Creating race_event for marks storage...');

          const raceEventData = {
            regatta_id: data.id,
            name: raceName.trim(),
            event_date: raceDate,
            start_time: warningSignalTime || null,
            status: 'planned',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { data: raceEventResult, error: raceEventError } = await supabase
            .from('race_events')
            .insert(raceEventData)
            .select('id')
            .single();

          if (raceEventError) {
            console.error('[handleSubmit] Error creating race_event:', raceEventError);
            Alert.alert('Warning', 'Race created but course marks could not be saved');
          } else {
            raceEventId = raceEventResult.id;
            logger.debug('[handleSubmit] Race event created:', raceEventId);
          }
        }

        // Save extracted marks to database (if any)
        if (raceEventId && extractedDataForValidation?.marks && extractedDataForValidation.marks.length > 0) {
          logger.debug('[handleSubmit] Saving', extractedDataForValidation.marks.length, 'extracted marks to database...');

          const marksToInsert = extractedDataForValidation.marks.map(mark => ({
            race_id: raceEventId,
            name: mark.name,
            mark_type: mark.type,
            latitude: mark.latitude,
            longitude: mark.longitude,
            color: mark.color || null,
            shape: mark.shape || null,
            description: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const { error: marksError } = await supabase
            .from('race_marks')
            .insert(marksToInsert);

          if (marksError) {
            console.error('[handleSubmit] Error saving marks:', marksError);
            // Don't throw - race was created successfully, just log the error
            Alert.alert('Warning', 'Race created but some marks could not be saved');
          } else {
            logger.debug('[handleSubmit] Marks saved successfully');
          }
        }

        // Save racing area to database (if any)
        // Priority 1: User-drawn polygon from map
        // Priority 2: Extracted racing area from AI
        if (raceEventId && (racingAreaPolygon || extractedDataForValidation?.racingArea)) {
          logger.debug('[handleSubmit] Saving racing area to database...');

          let racingAreaData: any = {
            race_id: raceEventId,
            area_type: 'racing',
            description: `Racing area for ${raceName}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Use user-drawn polygon if available
          if (racingAreaPolygon && racingAreaPolygon.length >= 3) {
            logger.debug('[handleSubmit] Using user-drawn racing area polygon:', racingAreaPolygon.length, 'points');

            racingAreaData.polygon_coordinates = racingAreaPolygon;

            // Calculate bounding box from polygon coordinates
            const lats = racingAreaPolygon.map(p => p[1]); // p[1] is latitude
            const lngs = racingAreaPolygon.map(p => p[0]); // p[0] is longitude

            racingAreaData.bounds_north = Math.max(...lats);
            racingAreaData.bounds_south = Math.min(...lats);
            racingAreaData.bounds_east = Math.max(...lngs);
            racingAreaData.bounds_west = Math.min(...lngs);
          }
          // Fall back to AI-extracted bounds if no user polygon
          else if (extractedDataForValidation?.racingArea) {
            logger.debug('[handleSubmit] Using AI-extracted racing area bounds');

            racingAreaData.bounds_north = extractedDataForValidation.racingArea.bounds.north;
            racingAreaData.bounds_south = extractedDataForValidation.racingArea.bounds.south;
            racingAreaData.bounds_east = extractedDataForValidation.racingArea.bounds.east;
            racingAreaData.bounds_west = extractedDataForValidation.racingArea.bounds.west;
          }

          const { error: areaError } = await supabase
            .from('racing_areas')
            .insert(racingAreaData);

          if (areaError) {
            console.error('[handleSubmit] Error saving racing area:', areaError);
            // Don't throw - race was created successfully, just log the error
            Alert.alert('Warning', 'Race created but racing area could not be saved');
          } else {
            logger.debug('[handleSubmit] Racing area saved successfully');
          }
        }

        // Upload any pending documents
        if (pendingDocuments.length > 0) {
          logger.debug('[handleSubmit] Uploading', pendingDocuments.length, 'pending documents...');
          await uploadPendingDocuments(data.id);
          logger.debug('[handleSubmit] Document upload complete');
        }

        logger.debug('[handleSubmit] All operations complete, showing success toast...');

        const successMessage = raceName
          ? `${raceName} is ready in your planner.`
          : 'Your new race is ready to review.';

        toast.show({
          placement: Platform.select({ web: 'top', default: 'top' }),
          duration: 5000,
          render: ({ id }) => (
            <Toast
              action="success"
              variant="solid"
              className="max-w-[360px] web:max-w-[420px]"
            >
              <View className="flex-row items-start">
                <View className="flex-1 pr-2">
                  <ToastTitle>Race created</ToastTitle>
                  <ToastDescription className="mt-1 text-sm">
                    {successMessage}
                  </ToastDescription>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss success message"
                  onPress={() => toast.close(id)}
                >
                  <X size={16} color="#F9FAFB" />
                </Pressable>
              </View>
            </Toast>
          ),
        });

        logger.debug('[handleSubmit] Toast shown, preparing to navigate...');

        // Small delay to ensure database transaction is committed
        await new Promise(resolve => setTimeout(resolve, 300));

        // Prepare extraction metadata for CourseSetupPrompt
        const extractionMetadata: ExtractionMetadata = {
          raceName: raceName || data.name,
          racingAreaName: startAreaName || undefined,
          extractedMarks: extractedDataForValidation?.marks || undefined,
          venueId: undefined, // Will be populated from venue lookup if needed
        };

        logger.debug('[handleSubmit] ===== CALLING ONSUBMIT CALLBACK =====');
        logger.debug('[handleSubmit] Regatta ID:', data.id);
        logger.debug('[handleSubmit] Race Event ID:', raceEventId);

        try {
          if (onSubmit) {
            // Pass regatta ID (race detail screen expects this)
            // Race detail screen will look up associated race_event to load marks
            logger.debug('[handleSubmit] Passing regatta ID:', data.id);
            onSubmit(data.id, extractionMetadata);
            logger.debug('[handleSubmit] onSubmit callback completed');
          } else {
            logger.debug('[handleSubmit] No onSubmit callback provided');
          }
        } catch (navError) {
          console.error('[handleSubmit] Navigation error:', navError);
          // Don't throw - race was created successfully
        }
      }
    } catch (error: any) {
      console.error('=== ERROR IN HANDLESUBMIT ===');
      console.error('[handleSubmit] Error type:', typeof error);
      console.error('[handleSubmit] Error constructor:', error?.constructor?.name);
      console.error('[handleSubmit] Error message:', error?.message);
      console.error('[handleSubmit] Error stack:', error?.stack);
      console.error('[handleSubmit] Full error object:', error);
      Alert.alert('Error', error.message || 'Failed to save race');
    } finally {
      logger.debug('[handleSubmit] Finally block - setting saving=false');
      setSaving(false);
    }
  };

  const addStartSequence = () => {
    setStartSequence([...startSequence, { class: '', warning: '', start: '', flag: '' }]);
  };

  const removeStartSequence = (index: number) => {
    setStartSequence(startSequence.filter((_, i) => i !== index));
  };

  const addMarkBoat = () => {
    setMarkBoats([...markBoats, { mark: '', boat: '', position: '' }]);
  };

  const removeMarkBoat = (index: number) => {
    setMarkBoats(markBoats.filter((_, i) => i !== index));
  };

  const addClassDivision = () => {
    setClassDivisions([...classDivisions, { name: '', fleet_size: 0 }]);
  };

  const removeClassDivision = (index: number) => {
    setClassDivisions(classDivisions.filter((_, i) => i !== index));
  };

  // Helper to check if a section has data filled
  const getSectionStatus = (sectionKey: string): 'empty' | 'partial' | 'complete' => {
    switch (sectionKey) {
      case 'basic':
        if (raceName && raceDate && venue) return 'complete';
        if (raceName || raceDate || venue) return 'partial';
        return 'empty';
      case 'timing':
        if (warningSignalTime && firstWarningSignal) return 'complete';
        if (warningSignalTime || firstWarningSignal) return 'partial';
        return 'empty';
      case 'comms':
        if (vhfChannel) return 'complete';
        return 'empty';
      case 'course':
        if (courseAreaDesignation || potentialCourses.length > 0) return 'complete';
        return 'empty';
      case 'fleet':
        if (classDivisions.length > 0 && classDivisions[0]?.name) return 'complete';
        return 'empty';
      default:
        return 'empty';
    }
  };

  const renderSectionHeader = (
    title: string,
    icon: React.ReactNode,
    sectionKey: string,
    required = false
  ) => {
    const status = getSectionStatus(sectionKey);
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <Pressable
        onPress={() => toggleSection(sectionKey)}
        className={`flex-row items-center justify-between px-4 py-3 rounded-lg mb-2 ${
          status === 'complete' ? 'bg-green-50 border border-green-200' :
          status === 'partial' ? 'bg-amber-50 border border-amber-200' :
          'bg-sky-50 border border-sky-100'
        }`}
      >
        <View className="flex-row items-center gap-2">
          {/* Status indicator */}
          {status === 'complete' ? (
            <View className="w-5 h-5 bg-green-500 rounded-full items-center justify-center">
              <Text className="text-white text-xs font-bold">✓</Text>
            </View>
          ) : status === 'partial' ? (
            <View className="w-5 h-5 bg-amber-400 rounded-full items-center justify-center">
              <Text className="text-white text-xs font-bold">•</Text>
            </View>
          ) : (
            icon
          )}
          <Text className={`text-base font-semibold ${
            status === 'complete' ? 'text-green-800' :
            status === 'partial' ? 'text-amber-800' :
            'text-gray-900'
          }`}>
            {title}
            {required && <Text className="text-red-500"> *</Text>}
          </Text>
        </View>
        <ChevronDown
          size={20}
          color={status === 'complete' ? '#16a34a' : status === 'partial' ? '#d97706' : '#64748B'}
          style={{
            transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
          }}
        />
      </Pressable>
    );
  };

  const renderInputField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    options?: {
      placeholder?: string;
      multiline?: boolean;
      keyboardType?: 'default' | 'numeric' | 'email-address';
      required?: boolean;
    }
  ) => (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-2">
        {label}
        {options?.required && <Text className="text-red-500"> *</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={options?.placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={options?.multiline}
        numberOfLines={options?.multiline ? 3 : 1}
        keyboardType={options?.keyboardType}
        className={`bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 ${
          options?.multiline ? 'min-h-[80px]' : ''
        }`}
      />
    </View>
  );

  // Get user's boat classes for extraction preferences
  const userBoatClasses = classSuggestion?.name ? [classSuggestion.name] : [];

  // Extraction Preferences Dialog
  const extractionPreferencesDialog = (
    <ExtractionPreferencesDialog
      visible={showExtractionPreferences}
      onClose={() => setShowExtractionPreferences(false)}
      onConfirm={handleExtractionPreferencesConfirm}
      userBoatClasses={userBoatClasses}
      documentPreview={pendingExtractionText.slice(0, 200)}
    />
  );

  // Phase 3: Show multi-race selection screen if active
  if (showMultiRaceSelection && multiRaceData) {
    // Show progress overlay if creating multiple races
    if (isCreatingMultipleRaces && multiRaceProgress) {
      return (
        <View className="flex-1 bg-gray-900/95 items-center justify-center px-8">
          <View className="bg-white rounded-2xl p-8 w-full max-w-sm items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-xl font-bold text-gray-900 mt-6 text-center">
              Creating Races...
            </Text>
            <Text className="text-base text-gray-600 mt-2 text-center">
              {multiRaceProgress.current} of {multiRaceProgress.total}
            </Text>
            <Text className="text-sm text-gray-500 mt-1 text-center">
              {multiRaceProgress.raceName}
            </Text>
            <View className="w-full bg-gray-200 rounded-full h-2 mt-6">
              <View 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${(multiRaceProgress.current / multiRaceProgress.total) * 100}%` }}
              />
            </View>
          </View>
        </View>
      );
    }

    return (
      <MultiRaceSelectionScreen
        extractedData={multiRaceData}
        onConfirm={(selectedRaces) => {
          logger.debug('[MultiRaceSelection] User selected', selectedRaces.length, 'races');
          
          if (selectedRaces.length === 0) {
            if (Platform.OS === 'web') {
              window.alert('Please select at least one race to create.');
            } else {
              Alert.alert('No Races Selected', 'Please select at least one race to create.');
            }
            return;
          }

          if (selectedRaces.length === 1) {
            // Single race selected - go through validation flow
            setExtractedDataForValidation(selectedRaces[0]);
            setConfidenceScoresForValidation(selectedRaces[0].confidenceScores || {});
            setShowMultiRaceSelection(false);
            setShowValidationScreen(true);
          } else {
            // Multiple races - confirm batch creation
            if (Platform.OS === 'web') {
              const confirmed = window.confirm(
                `You've selected ${selectedRaces.length} races from this document.\n\nEach race will be created with the extracted details. You can edit them individually after creation.\n\nCreate ${selectedRaces.length} races?`
              );
              if (confirmed) {
                handleBatchCreateRaces(selectedRaces);
              }
            } else {
              Alert.alert(
                'Create Multiple Races',
                `You've selected ${selectedRaces.length} races from this document.\n\nEach race will be created with the extracted details. You can edit them individually after creation.`,
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: `Create ${selectedRaces.length} Races`,
                    onPress: () => handleBatchCreateRaces(selectedRaces),
                  },
                ]
              );
            }
          }
        }}
        onCancel={() => {
          logger.debug('[MultiRaceSelection] User cancelled');
          setShowMultiRaceSelection(false);
          setMultiRaceData(null);
        }}
      />
    );
  }

  // Phase 3: Show validation screen if active
  if (showValidationScreen && extractedDataForValidation) {
    return (
      <AIValidationScreen
        extractedData={extractedDataForValidation}
        confidenceScores={confidenceScoresForValidation}
        onConfirm={handleValidationConfirm}
        onCancel={handleValidationCancel}
        userBoatClass={extractionPreferences.userBoatClass || classSuggestion?.name}
        filterToUserClass={extractionPreferences.filterToMyClass}
      />
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Compact Header */}
      <View className="bg-sky-600 pt-12 pb-3 px-4">
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={handleHeaderBack}
            className="flex-row items-center gap-1"
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Return to the previous screen"
          >
            <ChevronLeft color="#FFFFFF" size={20} />
            <Text className="text-white font-medium text-base">Back</Text>
          </Pressable>
          
          {/* Centered Title */}
          <View className="absolute left-0 right-0 items-center pointer-events-none">
            <Text className="text-white text-lg font-bold">
              {existingRaceId ? 'Edit Race' : 'Add Race'}
            </Text>
          </View>
          
          {/* Right side - show race info badge if extracted */}
          {raceName ? (
            <View className="bg-white/20 rounded-lg px-2 py-1 max-w-[140px]">
              <Text className="text-white text-xs font-medium" numberOfLines={1}>
                {raceName}
              </Text>
            </View>
          ) : (
            <View style={{ width: 60 }} /> 
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-3 pb-4" showsVerticalScrollIndicator={false}>
        {/* Race Type Selector - Compact version at top */}
        <View className="mb-4">
          <RaceTypeSelector
            value={raceType}
            onChange={(type) => setRaceType(type)}
            size="compact"
          />
        </View>

        {/* Course Ready Banner - Only when applicable */}
        {initialCourseId && !existingRaceId && (
          <View className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 mb-4 flex-row items-center gap-2">
            <MapPin size={16} color="#0369A1" />
            <Text className="text-sm text-cyan-800 flex-1">
              Course "{initialCourseName}" ready to apply after saving
            </Text>
          </View>
        )}

        {/* Race Suggestions - Only show when user has club/fleet suggestions */}
        {!existingRaceId && suggestions && suggestions.total > 0 && (
          <RaceSuggestionsDrawer
            suggestions={suggestions}
            loading={suggestionsLoading}
            processingSuggestionId={processingSuggestionId}
            onSelectSuggestion={handleSelectSuggestion}
            onDismissSuggestion={handleDismissSuggestion}
            onRefresh={refreshSuggestions}
          />
        )}

        {/* AI Quick Entry - Primary Action, Always Expanded */}
        <View className="bg-white border border-purple-200 rounded-xl mb-4 overflow-hidden shadow-sm">
          {/* Header - More compact */}
          <View className="flex-row items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-sky-50 border-b border-purple-100">
            <Sparkles size={18} color="#9333ea" />
            <Text className="text-base font-bold text-purple-900 flex-1">
              AI Quick Entry
            </Text>
            <Pressable 
              onPress={() => setAiQuickEntryExpanded(!aiQuickEntryExpanded)}
              className="p-1"
            >
              <ChevronDown 
                size={18} 
                color="#9333ea" 
                style={{ transform: [{ rotate: aiQuickEntryExpanded ? '180deg' : '0deg' }] }}
              />
            </Pressable>
          </View>
          
          {aiQuickEntryExpanded && (
          <View className="p-4">
          {/* Upload Button - Primary CTA */}
          <Pressable
            onPress={() => handleFileUpload('other')}
            disabled={extracting}
            className={`flex-row items-center justify-center gap-2 py-3 px-4 rounded-lg mb-3 ${
              extracting && currentDocType === 'other'
                ? 'bg-purple-100'
                : 'bg-purple-600'
            }`}
          >
            {extracting && currentDocType === 'other' ? (
              <ActivityIndicator color="#9333ea" size="small" />
            ) : (
              <Upload size={18} color="#FFFFFF" />
            )}
            <Text className={`font-semibold ${extracting && currentDocType === 'other' ? 'text-purple-700' : 'text-white'}`}>
              {extracting && currentDocType === 'other' ? 'Processing...' : 'Upload NOR / SI Documents'}
            </Text>
          </Pressable>

          {/* Uploaded Documents List */}
          {uploadedDocuments.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-purple-900 mb-2">
                Uploaded Documents ({uploadedDocuments.length})
              </Text>

              {uploadedDocuments.map((doc) => (
                <View key={doc.id} className="flex-row items-center gap-2 bg-white border border-purple-200 rounded-lg px-3 py-2 mb-2">
                  {/* Status Icon */}
                  {doc.status === 'extracting' && <ActivityIndicator size="small" color="#9333ea" />}
                  {doc.status === 'complete' && (
                    <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
                      <Text className="text-white text-xs font-bold">✓</Text>
                    </View>
                  )}
                  {doc.status === 'error' && (
                    <View className="w-6 h-6 bg-red-500 rounded-full items-center justify-center">
                      <Text className="text-white text-xs font-bold">✗</Text>
                    </View>
                  )}

                  {/* Document Info */}
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                      {doc.filename}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <View className="bg-purple-100 px-2 py-0.5 rounded">
                        <Text className="text-xs text-purple-800 font-semibold">
                          {doc.docType}
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-600">
                        {doc.status === 'extracting' && 'Extracting...'}
                        {doc.status === 'complete' && 'Ready'}
                        {doc.status === 'error' && `Error: ${doc.error}`}
                      </Text>
                    </View>
                  </View>

                  {/* Remove Button */}
                  <Pressable
                    onPress={() => {
                      setUploadedDocuments(prev => prev.filter(d => d.id !== doc.id));
                    }}
                  >
                    <X size={20} color="#DC2626" />
                  </Pressable>
                </View>
              ))}

              {/* Process Documents Button */}
              {uploadedDocuments.filter(d => d.status === 'complete').length > 0 && (
                <Pressable
                  onPress={processMultipleDocuments}
                  disabled={extracting || aggregationStatus === 'processing'}
                  className={`flex-row items-center justify-center gap-2 py-3 px-4 rounded-lg mt-2 ${
                    extracting || aggregationStatus === 'processing' ? 'bg-gray-300' : 'bg-purple-600'
                  }`}
                >
                  {extracting || aggregationStatus === 'processing' ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text className="text-white font-semibold text-base">
                        {aggregationStatus === 'processing' ? 'Aggregating Documents...' : 'Processing...'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} color="white" />
                      <Text className="text-white font-semibold text-base">
                        Process {uploadedDocuments.filter(d => d.status === 'complete').length} Document(s)
                      </Text>
                    </>
                  )}
                </Pressable>
              )}

              {/* Aggregation Metadata */}
              {aggregationMetadata && (
                <View className="bg-green-50 border border-green-300 rounded-lg p-3 mt-3">
                  <Text className="text-sm font-bold text-green-900 mb-2">
                    Aggregation Summary
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    <View className="bg-white px-2 py-1 rounded border border-green-200">
                      <Text className="text-xs text-green-800">
                        📄 {aggregationMetadata.documents_processed} docs processed
                      </Text>
                    </View>
                    <View className="bg-white px-2 py-1 rounded border border-green-200">
                      <Text className="text-xs text-green-800">
                        ✓ {Math.round((aggregationMetadata.overall_confidence || 0) * 100)}% confidence
                      </Text>
                    </View>
                    {aggregationMetadata.conflicts_found !== undefined && aggregationMetadata.conflicts_found > 0 && (
                      <View className="bg-yellow-100 px-2 py-1 rounded border border-yellow-300">
                        <Text className="text-xs text-yellow-800">
                          ⚠️ {aggregationMetadata.conflicts_found} conflict(s)
                        </Text>
                      </View>
                    )}
                    {aggregationMetadata.gaps_identified && aggregationMetadata.gaps_identified.length > 0 && (
                      <View className="bg-blue-100 px-2 py-1 rounded border border-blue-300">
                        <Text className="text-xs text-blue-800">
                          ℹ️ {aggregationMetadata.gaps_identified.length} gap(s)
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Divider */}
          <View className="flex-row items-center gap-2 mb-3">
            <View className="flex-1 h-px bg-purple-300" />
            <Text className="text-xs text-purple-700 font-semibold">OR PASTE TEXT/URL</Text>
            <View className="flex-1 h-px bg-purple-300" />
          </View>

          <TextInput
            value={freeformText}
            onChangeText={(text) => {
              logger.debug('[ComprehensiveRaceEntry] Text changed, length:', text.length);
              setFreeformText(text);
            }}
            placeholder="Paste a PDF URL (e.g., https://example.com/sailing-instructions.pdf) OR paste text: 'Croucher Series Race 3 at Victoria Harbour, Nov 17 2025, 2 starts (Dragon 10:00, J/70 10:05), VHF 72, PRO: John Smith, 720° penalty system...'"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            className="bg-white border border-purple-300 rounded-lg px-4 py-3 text-base text-gray-900 min-h-[120px] mb-3"
            textAlignVertical="top"
            editable={!extracting}
          />
          <Pressable
            onPress={() => {
              logger.debug('[ComprehensiveRaceEntry] Extract button clicked!');
              logger.debug('[ComprehensiveRaceEntry] freeformText length:', freeformText.length);
              handleExtractFromText();
            }}
            disabled={extracting || !freeformText.trim()}
            className={`flex-row items-center justify-center gap-2 py-3 px-4 rounded-lg ${
              extracting || !freeformText.trim() ? 'bg-gray-300' : 'bg-purple-600'
            }`}
            style={{ minHeight: 48 }}
          >
            {extracting ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-semibold text-base">
                  Extracting with AI...
                </Text>
              </>
            ) : (
              <>
                <Sparkles size={18} color="white" />
                <Text className="text-white font-semibold text-base">
                  Extract & Auto-Fill All Fields
                </Text>
              </>
            )}
          </Pressable>
        </View>
        )}
        </View>

        {/* Race Prep Learning Card - Removed from Add Race screen; shown on Race Detail screen instead */}

        {/* Extracted Marks Display */}
        {extractedDataForValidation?.marks && extractedDataForValidation.marks.length > 0 && (
          <View className="bg-green-50 border-2 border-green-300 rounded-xl p-4 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <MapPin size={20} color="#059669" />
                <Text className="text-lg font-bold text-green-900">
                  Extracted Course Marks
                </Text>
              </View>
              <View className="bg-green-600 px-3 py-1 rounded-full">
                <Text className="text-white font-bold text-sm">
                  {extractedDataForValidation.marks.length} marks
                </Text>
              </View>
            </View>

            <Text className="text-sm text-green-800 mb-3">
              These marks will be saved to your race course when you click "Create Race"
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row gap-2"
            >
              {extractedDataForValidation.marks.map((mark, idx) => (
                <View
                  key={idx}
                  className="bg-white border border-green-300 rounded-lg p-3 min-w-[160px]"
                >
                  <View className="flex-row items-center gap-2 mb-2">
                    <View className="bg-green-100 px-2 py-1 rounded">
                      <Text className="text-green-800 font-bold text-xs">
                        {mark.type || 'Mark'}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-base font-bold text-gray-900 mb-1">
                    {mark.name}
                  </Text>
                  <Text className="text-xs text-gray-600 mb-1">
                    📍 {mark.latitude.toFixed(6)}, {mark.longitude.toFixed(6)}
                  </Text>
                  {mark.color && (
                    <Text className="text-xs text-gray-600">
                      Color: {mark.color}
                    </Text>
                  )}
                  {mark.shape && (
                    <Text className="text-xs text-gray-600">
                      Shape: {mark.shape}
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>

            {extractedDataForValidation?.racingArea && (
              <View className="mt-3 pt-3 border-t border-green-200">
                <Text className="text-sm font-semibold text-green-900 mb-1">
                  Racing Area Bounds
                </Text>
                <Text className="text-xs text-green-800">
                  N: {extractedDataForValidation.racingArea.bounds.north.toFixed(6)} |
                  S: {extractedDataForValidation.racingArea.bounds.south.toFixed(6)} |
                  E: {extractedDataForValidation.racingArea.bounds.east.toFixed(6)} |
                  W: {extractedDataForValidation.racingArea.bounds.west.toFixed(6)}
                </Text>
              </View>
            )}

          </View>
        )}

        {/* Divider */}
        <View className="flex-row items-center gap-3 mb-6">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="text-sm text-gray-500 font-semibold">OR FILL MANUALLY</Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>

        {/* Basic Information */}
        {renderSectionHeader('Basic Information', <Calendar size={20} color="#0284c7" />, 'basic', true)}
        {expandedSections.has('basic') && (
          <View className="mb-4">
            {renderInputField('Race Name', raceName, setRaceName, {
              placeholder: raceType === 'distance' 
                ? 'e.g., Around Hong Kong Island Race 2025'
                : 'e.g., Hong Kong Dragon Championship 2025',
              required: true,
            })}
            {renderInputField('Race Date', raceDate, setRaceDate, {
              placeholder: 'YYYY-MM-DD',
              required: true,
            })}
            {/* Venue Location Picker with Map */}
            <VenueLocationPicker
              value={venue}
              onChangeText={setVenue}
              coordinates={venueCoordinates}
              onCoordinatesChange={setVenueCoordinates}
              placeholder="e.g., Victoria Harbour, Hong Kong"
            />

            <Pressable
              onPress={() => setShowRacingAreaMap(!showRacingAreaMap)}
              className={`flex-row items-center justify-between p-3 border rounded-lg mb-4 ${
                raceType === 'distance' 
                  ? 'bg-purple-50 border-purple-200' 
                  : 'bg-sky-50 border-sky-200'
              }`}
            >
              <View className="flex-row items-center gap-2">
                <MapPin size={18} color={raceType === 'distance' ? '#9333ea' : '#0284c7'} />
                <Text className={`text-sm font-semibold ${raceType === 'distance' ? 'text-purple-700' : 'text-sky-700'}`}>
                  {showRacingAreaMap ? 'Hide' : 'Show'} Map & {raceType === 'distance' ? 'Define Route' : 'Define Racing Area'}
                </Text>
              </View>
              <ChevronDown
                size={18}
                color={raceType === 'distance' ? '#9333ea' : '#0284c7'}
                style={{
                  transform: [{ rotate: showRacingAreaMap ? '180deg' : '0deg' }],
                }}
              />
            </Pressable>

            {showRacingAreaMap && (
              <View className="mb-4">
                {/* DISTANCE RACING: Route Waypoint Map */}
                {raceType === 'distance' ? (
                  <>
                    <DistanceRouteMap
                      waypoints={routeWaypoints}
                      onWaypointsChange={setRouteWaypoints}
                      initialCenter={venueCoordinates || { lat: 22.28, lng: 114.16 }}
                      onTotalDistanceChange={(distance) => setTotalDistanceNm(distance.toString())}
                    />
                    
                    {routeWaypoints.length > 0 && (
                      <View className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <Text className="text-sm font-semibold text-purple-800">
                          ✅ Route Defined: {routeWaypoints.length} waypoints, {totalDistanceNm} nm
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  /* FLEET RACING: Racing Area Map */
                  <>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Racing Area Boundary
                    </Text>
                    <Text className="text-xs text-gray-500 mb-3">
                      Click "Draw Racing Area" to define the general boundary where racing will occur. You can add specific course marks later.
                    </Text>

                    {/* Prepare race event data for map */}
                    {(() => {
                      // Convert extracted marks to CourseMark format (if any)
                      const courseMarks: CourseMark[] = extractedDataForValidation?.marks
                        ? extractedDataForValidation.marks.map((mark, idx) => ({
                            id: `mark-${idx}`,
                            race_event_id: 'temp-event-id',
                            mark_name: mark.name || `Mark ${idx + 1}`,
                            mark_type: (mark.type || 'windward') as any,
                            position: null as any,
                            coordinates_lat: (mark as any).latitude || (mark as any).coordinates?.lat || 0,
                            coordinates_lng: (mark as any).longitude || (mark as any).coordinates?.lng || 0,
                            sequence_number: idx + 1,
                            rounding_direction: (mark as any).roundingDirection || 'port',
                            extracted_from: 'ai_pdf',
                            confidence_score: (mark as any).confidence || 0.8,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                          }))
                        : [];

                      // Create mock race event for map (works with or without marks)
                      // Safe date parsing - handle invalid dates
                      let safeStartTime: string;
                      try {
                        if (raceDate && raceDate.trim()) {
                          const parsedDate = new Date(raceDate);
                          safeStartTime = isNaN(parsedDate.getTime())
                            ? new Date().toISOString()
                            : parsedDate.toISOString();
                        } else {
                          safeStartTime = new Date().toISOString();
                        }
                      } catch {
                        safeStartTime = new Date().toISOString();
                      }

                      const mockRaceEvent: RaceEventWithDetails = {
                        id: 'temp-event-id',
                        user_id: user?.id || 'temp-user',
                        race_name: raceName || 'New Race',
                        race_series: null,
                        boat_class: null,
                        start_time: safeStartTime,
                        racing_area_name: venue || null,
                        extraction_status: 'completed',
                        extraction_method: 'ai_auto',
                        race_status: 'scheduled',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        venue: venueCoordinates ? {
                          id: 'temp-venue',
                          name: venue,
                          coordinates_lat: venueCoordinates.lat,
                          coordinates_lng: venueCoordinates.lng,
                          country: '',
                          region: 'global',
                        } : undefined,
                      };

                      return (
                        <View style={{ height: 500 }}>
                          <TacticalRaceMap
                            raceEvent={mockRaceEvent}
                            marks={courseMarks}
                            onRacingAreaSelected={handleRacingAreaSelected}
                            showControls={false}
                            allowAreaSelection={true}
                            externalLayers={{ depth: false }}
                          />
                        </View>
                      );
                    })()}

                    {/* Show selected polygon info */}
                    {racingAreaPolygon && (
                      <View className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <Text className="text-sm font-semibold text-green-800">
                          ✅ Racing Area Defined
                        </Text>
                        <Text className="text-xs text-green-700 mt-1">
                          {racingAreaPolygon.length} boundary points captured. This will be saved with your race.
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {/* Info message about course marks */}
                {(!extractedDataForValidation?.marks || extractedDataForValidation.marks.length === 0) && (
                  <View className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <View className="flex-row items-center gap-2">
                      <AlertCircle size={16} color="#0284c7" />
                      <Text className="text-sm font-semibold text-blue-700">
                        No Course Marks Yet
                      </Text>
                    </View>
                    <Text className="text-xs text-blue-600 mt-2">
                      You can draw the racing area now and add specific course marks later by uploading sailing instructions or entering them manually.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {renderInputField('Description', description, setDescription, {
              placeholder: 'Race series, event details...',
              multiline: true,
            })}

            {/* Boat Selection */}
            <BoatSelector
              selectedBoatId={selectedBoatId}
              onSelect={setSelectedBoatId}
              showQuickAdd={true}
            />
          </View>
        )}

        {/* Timing & Sequence */}
        {renderSectionHeader('Timing & Start Sequence', <Clock size={20} color="#0284c7" />, 'timing')}
        {expandedSections.has('timing') && (
          <View className="mb-4">
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                {renderInputField('First Warning', warningSignalTime, setWarningSignalTime, {
                  placeholder: '10:00',
                })}
              </View>
              <View className="flex-1">
                {renderInputField('Total Starts', totalStarts, setTotalStarts, {
                  keyboardType: 'numeric',
                  placeholder: '1',
                })}
              </View>
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                {renderInputField('Prep Signal (min)', preparatoryMinutes, setPreparatoryMinutes, {
                  keyboardType: 'numeric',
                  placeholder: '4',
                })}
              </View>
              <View className="flex-1">
                {renderInputField('Class Interval (min)', classIntervalMinutes, setClassIntervalMinutes, {
                  keyboardType: 'numeric',
                  placeholder: '5',
                })}
              </View>
            </View>

            {renderInputField('Time Limit (minutes)', timeLimitMinutes, setTimeLimitMinutes, {
              keyboardType: 'numeric',
              placeholder: '90',
            })}

            {/* Start Sequence Details */}
            <Text className="text-sm font-semibold text-gray-700 mb-2">Start Sequence</Text>
            {startSequence.map((seq, idx) => (
              <View key={idx} className="mb-3">
                <View className="flex-row gap-2 mb-1">
                  <TextInput
                    value={seq.class}
                    onChangeText={(text) => {
                      const newSeq = [...startSequence];
                      newSeq[idx].class = text;
                      setStartSequence(newSeq);
                    }}
                    placeholder="Class (e.g., Dragon)"
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <TextInput
                    value={seq.flag || ''}
                    onChangeText={(text) => {
                      const newSeq = [...startSequence];
                      newSeq[idx].flag = text;
                      setStartSequence(newSeq);
                    }}
                    placeholder="Flag (e.g., Numeral 3)"
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <Pressable onPress={() => removeStartSequence(idx)} className="justify-center">
                    <X size={20} color="#DC2626" />
                  </Pressable>
                </View>
                <View className="flex-row gap-2">
                  <TextInput
                    value={seq.warning}
                    onChangeText={(text) => {
                      const newSeq = [...startSequence];
                      newSeq[idx].warning = text;
                      setStartSequence(newSeq);
                    }}
                    placeholder="Warning (e.g., 10:55)"
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <TextInput
                    value={seq.start}
                    onChangeText={(text) => {
                      const newSeq = [...startSequence];
                      newSeq[idx].start = text;
                      setStartSequence(newSeq);
                    }}
                    placeholder="Start (e.g., 11:00)"
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </View>
              </View>
            ))}
            <Pressable onPress={addStartSequence} className="flex-row items-center gap-2 mt-2">
              <Plus size={16} color="#0284c7" />
              <Text className="text-sm font-semibold text-sky-600">Add Start</Text>
            </Pressable>
          </View>
        )}

        {/* Distance Racing Section - Only shown for distance races */}
        {raceType === 'distance' && (
          <>
            {renderSectionHeader('Route & Distance', <Navigation size={20} color="#7C3AED" />, 'distance')}
            {expandedSections.has('distance') && (
              <View className="mb-4">
                {/* Total Distance */}
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    {renderInputField('Total Distance (nm)', totalDistanceNm, setTotalDistanceNm, {
                      keyboardType: 'numeric',
                      placeholder: '45',
                    })}
                  </View>
                  <View className="flex-1">
                    {renderInputField('Time Limit (hours)', timeLimitHours, setTimeLimitHours, {
                      keyboardType: 'numeric',
                      placeholder: '12',
                    })}
                  </View>
                </View>

                {/* Start/Finish Location */}
                <View className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-semibold text-purple-900">
                      Start & Finish Location
                    </Text>
                    <Pressable
                      onPress={() => setStartFinishSameLocation(!startFinishSameLocation)}
                      className="flex-row items-center gap-2"
                    >
                      <View
                        className={`w-5 h-5 rounded border-2 items-center justify-center ${
                          startFinishSameLocation
                            ? 'bg-purple-600 border-purple-600'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        {startFinishSameLocation && (
                          <Text className="text-white text-xs font-bold">✓</Text>
                        )}
                      </View>
                      <Text className="text-sm text-purple-700">Same location</Text>
                    </Pressable>
                  </View>
                  
                  {!startFinishSameLocation && (
                    <View className="mt-2">
                      {renderInputField('Finish Location', finishVenue, setFinishVenue, {
                        placeholder: 'e.g., Middle Island Marina',
                      })}
                      <Text className="text-xs text-purple-600 mt-1">
                        Start location is set in Basic Information above
                      </Text>
                    </View>
                  )}
                </View>

                {/* Route Waypoints */}
                <Text className="text-sm font-semibold text-gray-700 mb-2">Route Waypoints</Text>
                <Text className="text-xs text-gray-500 mb-3">
                  Add waypoints, gates, and marks along the race route
                </Text>
                
                {routeWaypoints.map((waypoint, idx) => (
                  <View key={idx} className="mb-3 bg-gray-50 rounded-lg p-3">
                    <View className="flex-row gap-2 mb-2">
                      <TextInput
                        value={waypoint.name}
                        onChangeText={(text) => {
                          const newWaypoints = [...routeWaypoints];
                          newWaypoints[idx].name = text;
                          setRouteWaypoints(newWaypoints);
                        }}
                        placeholder="Waypoint name"
                        className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                      <View className="bg-purple-100 rounded-lg px-2 py-2">
                        <Text className="text-xs font-semibold text-purple-700">
                          {waypoint.type.toUpperCase()}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          const newWaypoints = routeWaypoints.filter((_, i) => i !== idx);
                          setRouteWaypoints(newWaypoints);
                        }}
                        className="justify-center"
                      >
                        <X size={20} color="#DC2626" />
                      </Pressable>
                    </View>
                    <View className="flex-row gap-2">
                      <TextInput
                        value={waypoint.latitude.toString()}
                        onChangeText={(text) => {
                          const newWaypoints = [...routeWaypoints];
                          newWaypoints[idx].latitude = parseFloat(text) || 0;
                          setRouteWaypoints(newWaypoints);
                        }}
                        placeholder="Latitude"
                        keyboardType="numeric"
                        className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                      <TextInput
                        value={waypoint.longitude.toString()}
                        onChangeText={(text) => {
                          const newWaypoints = [...routeWaypoints];
                          newWaypoints[idx].longitude = parseFloat(text) || 0;
                          setRouteWaypoints(newWaypoints);
                        }}
                        placeholder="Longitude"
                        keyboardType="numeric"
                        className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </View>
                  </View>
                ))}

                {/* Add Waypoint Buttons */}
                <View className="flex-row flex-wrap gap-2 mt-2">
                  {routeWaypoints.length === 0 && (
                    <Pressable
                      onPress={() => setRouteWaypoints([
                        ...routeWaypoints,
                        { name: 'Start', latitude: 0, longitude: 0, type: 'start', required: true }
                      ])}
                      className="flex-row items-center gap-1 bg-green-100 px-3 py-2 rounded-lg"
                    >
                      <Flag size={14} color="#059669" />
                      <Text className="text-sm font-semibold text-green-700">Add Start</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => setRouteWaypoints([
                      ...routeWaypoints,
                      { name: '', latitude: 0, longitude: 0, type: 'waypoint', required: true }
                    ])}
                    className="flex-row items-center gap-1 bg-purple-100 px-3 py-2 rounded-lg"
                  >
                    <Plus size={14} color="#7C3AED" />
                    <Text className="text-sm font-semibold text-purple-700">Add Waypoint</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setRouteWaypoints([
                      ...routeWaypoints,
                      { name: '', latitude: 0, longitude: 0, type: 'gate', required: true }
                    ])}
                    className="flex-row items-center gap-1 bg-amber-100 px-3 py-2 rounded-lg"
                  >
                    <Navigation size={14} color="#D97706" />
                    <Text className="text-sm font-semibold text-amber-700">Add Gate</Text>
                  </Pressable>
                  {!routeWaypoints.find(w => w.type === 'finish') && (
                    <Pressable
                      onPress={() => setRouteWaypoints([
                        ...routeWaypoints,
                        { name: 'Finish', latitude: 0, longitude: 0, type: 'finish', required: true }
                      ])}
                      className="flex-row items-center gap-1 bg-red-100 px-3 py-2 rounded-lg"
                    >
                      <Anchor size={14} color="#DC2626" />
                      <Text className="text-sm font-semibold text-red-700">Add Finish</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </>
        )}

        {/* Communications & Race Control */}
        {renderSectionHeader('Communications & Control', <Radio size={20} color="#0284c7" />, 'comms')}
        {expandedSections.has('comms') && (
          <View className="mb-4">
            {/* Show detailed VHF channels if available */}
            {vhfChannelsDetailed.length > 0 ? (
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">VHF Channels</Text>
                {vhfChannelsDetailed.map((ch, idx) => (
                  <View key={idx} className="flex-row items-center gap-2 mb-2 bg-sky-50 rounded-lg px-3 py-2">
                    <View className="bg-sky-600 rounded-md px-2 py-1">
                      <Text className="text-white font-bold text-sm">Ch {ch.channel}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-800">{ch.purpose}</Text>
                      {ch.classes && ch.classes.length > 0 && (
                        <Text className="text-xs text-gray-500">{ch.classes.join(', ')}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  {renderInputField('VHF Channel', vhfChannel, setVhfChannel, {
                    placeholder: '72',
                  })}
                </View>
                <View className="flex-1">
                  {renderInputField('Backup Channel', vhfBackupChannel, setVhfBackupChannel, {
                    placeholder: '73',
                  })}
                </View>
              </View>
            )}

            {renderInputField('RC Boat Name', rcBoatName, setRcBoatName, {
              placeholder: 'Committee Boat Alpha',
            })}
            {renderInputField('RC Boat Position', rcBoatPosition, setRcBoatPosition, {
              placeholder: 'East end of start line',
            })}
            {renderInputField('Race Officer', raceOfficer, setRaceOfficer, {
              placeholder: 'Principal Race Officer name',
            })}

            {/* Mark Boats */}
            <Text className="text-sm font-semibold text-gray-700 mb-2 mt-4">Mark Boats</Text>
            {markBoats.map((boat, idx) => (
              <View key={idx} className="flex-row gap-2 mb-2">
                <TextInput
                  value={boat.mark}
                  onChangeText={(text) => {
                    const newBoats = [...markBoats];
                    newBoats[idx].mark = text;
                    setMarkBoats(newBoats);
                  }}
                  placeholder="Mark"
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <TextInput
                  value={boat.boat}
                  onChangeText={(text) => {
                    const newBoats = [...markBoats];
                    newBoats[idx].boat = text;
                    setMarkBoats(newBoats);
                  }}
                  placeholder="Boat"
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <Pressable onPress={() => removeMarkBoat(idx)} className="justify-center">
                  <X size={20} color="#DC2626" />
                </Pressable>
              </View>
            ))}
            <Pressable onPress={addMarkBoat} className="flex-row items-center gap-2 mt-2">
              <Plus size={16} color="#0284c7" />
              <Text className="text-sm font-semibold text-sky-600">Add Mark Boat</Text>
            </Pressable>
          </View>
        )}

        {/* Course Details */}
        {renderSectionHeader('Course Details', <Navigation size={20} color="#0284c7" />, 'course')}
        {expandedSections.has('course') && (
          <View className="mb-4">
            {/* Start Lines are now shown via the StartLines extraction component above */}
            
            {/* Finish Area */}
            <View className="mb-2">
              <Text className="text-sm font-semibold text-gray-700">Finish Area</Text>
            </View>
            {renderInputField('Finish Area Name', finishAreaName, setFinishAreaName, {
              placeholder: 'Club Finishing Line',
            })}
            {renderInputField('Finish Area Description', finishAreaDescription, setFinishAreaDescription, {
              placeholder: 'Between ODM and IDM from west to east',
              multiline: true,
            })}
            
            {renderInputField('Course Description', courseSelectionCriteria, setCourseSelectionCriteria, {
              placeholder: 'Hong Kong Island to Starboard (26nm)',
              multiline: true,
            })}
            {renderInputField('Course Diagram URL', courseDiagramUrl, setCourseDiagramUrl, {
              placeholder: 'https://...',
            })}
          </View>
        )}

        {/* Time Limits - Important for racers */}
        {(absoluteTimeLimit || cutOffPoints.length > 0) && (
          <View className="mb-4 bg-amber-50 rounded-xl p-4 border border-amber-200">
            <View className="flex-row items-center gap-2 mb-3">
              <AlertCircle size={18} color="#d97706" />
              <Text className="text-base font-bold text-amber-800">Time Limits</Text>
            </View>
            
            {absoluteTimeLimit && (
              <View className="flex-row items-center gap-2 mb-2">
                <View className="bg-amber-600 rounded-md px-2 py-1">
                  <Text className="text-white font-bold text-sm">{absoluteTimeLimit}</Text>
                </View>
                <Text className="text-sm text-amber-700">Absolute time limit</Text>
              </View>
            )}
            
            {cutOffPoints.length > 0 && (
              <View className="mt-2">
                <Text className="text-xs font-semibold text-amber-600 mb-1">CUT-OFF POINTS</Text>
                {cutOffPoints.map((point, idx) => (
                  <View key={idx} className="flex-row items-center gap-2 mb-1">
                    <View className="bg-amber-500 rounded px-2 py-0.5">
                      <Text className="text-white font-semibold text-xs">{point.time}</Text>
                    </View>
                    <Text className="text-sm text-amber-700">{point.location}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Entry Information - From NOR */}
        {(entryFees.length > 0 || eligibleClasses.length > 0 || safetyBriefingDetails) && (
          <View className="mb-4 bg-green-50 rounded-xl p-4 border border-green-200">
            <View className="flex-row items-center gap-2 mb-3">
              <FileText size={18} color="#16a34a" />
              <Text className="text-base font-bold text-green-800">Entry Information</Text>
            </View>
            
            {/* Entry Fees */}
            {entryFees.length > 0 && (
              <View className="mb-3">
                <Text className="text-xs font-semibold text-green-600 mb-2">ENTRY FEES</Text>
                <View className="flex-row flex-wrap gap-2">
                  {entryFees.map((fee, idx) => (
                    <View key={idx} className="bg-white rounded-lg px-3 py-2 border border-green-200">
                      <Text className="text-xs text-green-600 font-medium">{fee.type}</Text>
                      <Text className="text-sm font-bold text-green-800">{fee.amount}</Text>
                      {fee.deadline && (
                        <Text className="text-xs text-green-500">by {fee.deadline}</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Eligible Classes */}
            {eligibleClasses.length > 0 && (
              <View className="mb-3">
                <Text className="text-xs font-semibold text-green-600 mb-1">ELIGIBLE CLASSES</Text>
                <Text className="text-sm text-green-700">{eligibleClasses.join(' • ')}</Text>
              </View>
            )}
            
            {/* Safety Briefing */}
            {safetyBriefingDetails && (
              <View className="bg-white rounded-lg px-3 py-2 border border-green-200">
                <Text className="text-xs font-semibold text-green-600">SAFETY BRIEFING</Text>
                <Text className="text-sm text-green-800">{safetyBriefingDetails}</Text>
              </View>
            )}
          </View>
        )}

        {/* Race Office & Contacts */}
        {(raceOfficeLocation || raceOfficePhone.length > 0 || contactEmail) && (
          <View className="mb-4 bg-blue-50 rounded-xl p-4 border border-blue-200">
            <View className="flex-row items-center gap-2 mb-3">
              <Radio size={18} color="#2563eb" />
              <Text className="text-base font-bold text-blue-800">Race Office</Text>
            </View>
            
            {raceOfficeLocation && (
              <View className="flex-row items-center gap-2 mb-2">
                <MapPin size={14} color="#3b82f6" />
                <Text className="text-sm text-blue-700">{raceOfficeLocation}</Text>
              </View>
            )}
            
            {raceOfficePhone.length > 0 && (
              <View className="flex-row items-center gap-2 mb-2">
                <Phone size={14} color="#3b82f6" />
                <Text className="text-sm text-blue-700">{raceOfficePhone.join(' / ')}</Text>
              </View>
            )}
            
            {contactEmail && (
              <View className="flex-row items-center gap-2">
                <Mail size={14} color="#3b82f6" />
                <Text className="text-sm text-blue-700">{contactEmail}</Text>
              </View>
            )}
          </View>
        )}

        {/* Race Rules & Penalties */}
        {renderSectionHeader('Rules & Penalties', <Flag size={20} color="#0284c7" />, 'rules')}
        {expandedSections.has('rules') && (
          <View className="mb-4">
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                {renderInputField('Scoring System', scoringSystem, setScoringSystem, {
                  placeholder: 'Low Point',
                })}
              </View>
              <View className="flex-1">
                {renderInputField('Penalty System', penaltySystem, setPenaltySystem, {
                  placeholder: '720°',
                })}
              </View>
            </View>

            {renderInputField('Penalty Details', penaltyDetails, setPenaltyDetails, {
              placeholder: 'Additional penalty rules',
              multiline: true,
            })}
            {renderInputField('Sailing Instructions URL', sailingInstructionsUrl, setSailingInstructionsUrl, {
              placeholder: 'https://...',
            })}
            {renderInputField('Notice of Race URL', noticeOfRaceUrl, setNoticeOfRaceUrl, {
              placeholder: 'https://...',
            })}
          </View>
        )}

        {/* Class & Fleet */}
        {renderSectionHeader('Class & Fleet', <MapPin size={20} color="#0284c7" />, 'fleet')}
        {expandedSections.has('fleet') && (
          <View className="mb-4">
            {renderInputField('Expected Fleet Size', expectedFleetSize, setExpectedFleetSize, {
              keyboardType: 'numeric',
              placeholder: '20',
            })}

            <Text className="text-sm font-semibold text-gray-700 mb-2 mt-4">Class Divisions</Text>
            {classDivisions.map((div, idx) => (
              <View key={idx} className="flex-row gap-2 mb-2">
                <TextInput
                  value={div.name}
                  onChangeText={(text) => {
                    const newDivs = [...classDivisions];
                    newDivs[idx].name = text;
                    setClassDivisions(newDivs);
                    if (idx === 0) {
                      const trimmed = text.trim();
                      const manual = trimmed.length > 0;
                      setHasManualClassEdit(manual);
                      hasManualClassEditRef.current = manual;
                      if (!manual) {
                        lastSuggestedClassRef.current = null;
                        setSelectedClassId(null);
                      }
                    }
                  }}
                  placeholder="Class Name"
                  className="flex-[2] bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <TextInput
                  value={div.fleet_size != null ? div.fleet_size.toString() : '0'}
                  onChangeText={(text) => {
                    const newDivs = [...classDivisions];
                    newDivs[idx].fleet_size = parseInt(text) || 0;
                    setClassDivisions(newDivs);
                  }}
                  placeholder="Size"
                  keyboardType="numeric"
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                {classDivisions.length > 1 && (
                  <Pressable onPress={() => removeClassDivision(idx)} className="justify-center">
                    <X size={20} color="#DC2626" />
                  </Pressable>
                )}
              </View>
            ))}
            <Pressable onPress={addClassDivision} className="flex-row items-center gap-2 mt-2">
              <Plus size={16} color="#0284c7" />
              <Text className="text-sm font-semibold text-sky-600">Add Class</Text>
            </Pressable>

            {classSuggestionLoading && (
              <View className="flex-row items-center gap-2 mt-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <ActivityIndicator size="small" color="#0284c7" />
                <Text className="text-xs text-blue-700">Matching your boat to likely class divisions…</Text>
              </View>
            )}

            {!classSuggestionLoading && classSuggestion && (
              <View
                className={`flex-row items-start gap-2 mt-3 px-3 py-2 rounded-lg border ${classSuggestion.name ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}
              >
                <MaterialCommunityIcons
                  name={classSuggestion.name ? 'lightbulb-on-outline' : 'alert-circle-outline'}
                  size={18}
                  color={classSuggestion.name ? '#0284c7' : '#b45309'}
                  style={{ marginTop: 2 }}
                />
                <View className="flex-1">
                  {classSuggestion.name ? (
                    <>
                      <Text className="text-xs font-semibold text-blue-700">
                        Suggested class: {classSuggestion.name}
                      </Text>
                      <Text className="text-xs text-blue-600 mt-1">
                        Based on boat {classSuggestion.boatName}
                        {classSuggestion.sailNumber ? ` (${classSuggestion.sailNumber})` : ''}. You can change this if needed.
                      </Text>
                    </>
                  ) : (
                    <Text className="text-xs text-amber-700">
                      {classSuggestion.message}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Weather info is fetched dynamically based on race area - no manual entry needed */}

        {/* Rig Tuning - Shows when boat class and wind forecast are available */}
        {tuningBoatClass && tuningWindSpeed && (
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons name="wrench-clock" size={20} color="#059669" />
                <Text className="text-base font-bold text-green-800">Rig Tuning for {tuningBoatClass}</Text>
              </View>
              {tuningWindSpeed && (
                <View className="bg-sky-100 px-2 py-1 rounded-full">
                  <Text className="text-xs font-semibold text-sky-700">{tuningWindSpeed} kts forecast</Text>
                </View>
              )}
            </View>
            
            <RigTuningCard
              raceId={existingRaceId || 'new-race'}
              boatClassName={tuningBoatClass}
              recommendation={rigTuningRecommendation}
              loading={rigTuningLoading}
              onRefresh={refreshRigTuning}
            />
            
            {!rigTuningRecommendation && !rigTuningLoading && (
              <View className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                <Text className="text-sm text-amber-800">
                  No tuning guide found for {tuningBoatClass}. Add a tuning guide in Settings → Boat to unlock race-day rig checklists.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Redundant sections removed - now shown in colored info cards above:
            - Registration & Logistics → Entry Information card
            - Governing Rules & Eligibility → Entry Information + Rules sections
            - Event Schedule → Basic Info + Timing sections
            - Course & Area Details → Course Details section
            - Series Scoring → Rules & Penalties section
        */}

        {/* Safety & Insurance - Keep this as useful for manual entry */}
        {renderSectionHeader('Safety & Insurance', <AlertCircle size={20} color="#0284c7" />, 'safety')}
        {expandedSections.has('safety') && (
          <View className="mb-4">
            {renderInputField('Safety Requirements', safetyRequirements, setSafetyRequirements, {
              placeholder: 'Safety equipment and check-in requirements',
              multiline: true,
            })}
            {renderInputField('Retirement Notification', retirementNotificationRequirements, setRetirementNotificationRequirements, {
              placeholder: 'How to notify retirement from race',
              multiline: true,
            })}
            {renderInputField('Minimum Insurance Coverage', minimumInsuranceCoverage, setMinimumInsuranceCoverage, {
              keyboardType: 'numeric',
              placeholder: 'e.g., 1000000',
            })}
            {renderInputField('Insurance Policy Reference', insurancePolicyReference, setInsurancePolicyReference, {
              placeholder: 'e.g., HKSAR law requirements',
            })}
          </View>
        )}

        {/* Prizes typically in NOR, not SI - removed from extraction flow */}

        {/* Document References */}
        {renderSectionHeader('Document References', <Upload size={20} color="#0284c7" />, 'documents')}
        {expandedSections.has('documents') && (
          <View className="mb-4">
            {renderInputField('Supplementary SI URL', supplementarySIUrl, setSupplementarySIUrl, {
              placeholder: 'URL to supplementary sailing instructions',
            })}

            <Text className="text-sm font-semibold text-gray-700 mb-2">NOR Amendments</Text>
            {norAmendments.map((amendment, idx) => (
              <View key={idx} className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-xs font-semibold text-gray-600">Amendment {idx + 1}</Text>
                  <Pressable onPress={() => setNorAmendments(norAmendments.filter((_, i) => i !== idx))}>
                    <X size={16} color="#DC2626" />
                  </Pressable>
                </View>
                <TextInput
                  value={amendment.url || ''}
                  onChangeText={(text) => {
                    const updated = [...norAmendments];
                    updated[idx].url = text;
                    setNorAmendments(updated);
                  }}
                  placeholder="Amendment URL"
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
                />
                <TextInput
                  value={amendment.date}
                  onChangeText={(text) => {
                    const updated = [...norAmendments];
                    updated[idx].date = text;
                    setNorAmendments(updated);
                  }}
                  placeholder="Date (YYYY-MM-DD)"
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
                />
                <TextInput
                  value={amendment.description}
                  onChangeText={(text) => {
                    const updated = [...norAmendments];
                    updated[idx].description = text;
                    setNorAmendments(updated);
                  }}
                  placeholder="Description"
                  multiline
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </View>
            ))}
            <Pressable
              onPress={() => setNorAmendments([...norAmendments, { date: '', description: '' }])}
              className="flex-row items-center gap-2 mt-2"
            >
              <Plus size={16} color="#0284c7" />
              <Text className="text-sm font-semibold text-sky-600">Add Amendment</Text>
            </Pressable>
          </View>
        )}

        {/* Spacer for floating button + tab bar */}
        <View className="h-40" />
      </ScrollView>

      {/* Floating Action Buttons */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 pb-20"
        style={{ 
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <View className="flex-row gap-3">
          {onCancel && (
            <Pressable
              onPress={onCancel}
              className="flex-1 bg-gray-100 py-3.5 rounded-xl items-center justify-center border border-gray-300"
            >
              <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => {
              logger.debug('=== CREATE RACE BUTTON PRESSED ===');
              logger.debug('[Button] disabled:', saving);
              logger.debug('[Button] Calling handleSubmit...');
              handleSubmit();
            }}
            disabled={saving}
            className={`flex-1 py-3.5 rounded-xl items-center justify-center flex-row gap-2 ${
              saving ? 'bg-gray-400' : 'bg-sky-600'
            }`}
          >
            {saving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons 
                  name={existingRaceId ? "content-save" : "plus-circle"} 
                  size={20} 
                  color="white" 
                />
                <Text className="text-white font-semibold text-base">
                  {existingRaceId ? 'Save Changes' : 'Create Race'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* Extraction Preferences Dialog */}
      {extractionPreferencesDialog}
    </View>
  );
}
