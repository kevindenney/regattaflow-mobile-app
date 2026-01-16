/**
 * EditRaceForm - Apple HIG-compliant race editor
 *
 * A streamlined form for editing race data with:
 * - Clear section-based layout
 * - Progressive disclosure (advanced options collapsed)
 * - iOS-style form rows with inline editing
 * - Danger zone for delete action
 *
 * No AI Quick Entry - manual editing only for cleaner UX.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

// Only import DateTimePicker on native platforms
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}
import {
  Calendar,
  CalendarDays,
  Clock,
  MapPin,
  Radio,
  Sailboat,
  Navigation,
  ChevronLeft,
  Flag,
  FileText,
  Settings,
  AlertTriangle,
  Trash2,
  X,
  Check,
  Target,
  Users,
  User,
  Hash,
  Trophy,
  Scale,
  UserPlus,
  Shield,
  DollarSign,
  Cloud,
  Award,
  Building,
  Ship,
  Link,
  Mail,
  Wind,
  Plus,
  Minus,
} from 'lucide-react-native';

import { EditFormSection } from './EditFormSection';
import { EditFormRow } from './EditFormRow';
import { AccordionSection } from '../AccordionSection';
import { RaceTypeSelector, type RaceType } from '../RaceTypeSelector';
import { LocationMapPicker } from '../LocationMapPicker';
import { BoatSelector } from '../AddRaceDialog/BoatSelector';
import { DistanceRouteMap, type RouteWaypoint } from '@/components/races/DistanceRouteMap';
import { TufteTokens, colors } from '@/constants/designSystem';
import { IOS_COLORS } from '@/components/cards/constants';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('EditRaceForm');

// =============================================================================
// TYPES
// =============================================================================

export interface EditRaceFormProps {
  /** Race ID to edit */
  raceId: string;
  /** Callback when race is saved */
  onSave?: (raceId: string) => void;
  /** Callback when editing is cancelled */
  onCancel?: () => void;
  /** Callback when race is deleted */
  onDelete?: (raceId: string) => void;
}

interface RaceFormData {
  // Basic
  name: string;
  date: string;
  startTime: string;
  venue: string;
  venueCoordinates: { lat: number; lng: number } | null;
  description: string;

  // Type
  raceType: RaceType;

  // Boat Selection
  boatId: string | null;
  classId: string | null;

  // Fleet Details
  boatClass: string;
  expectedFleetSize: string;
  courseType: string;

  // Distance Details
  totalDistanceNm: string;
  finishVenue: string;
  routeWaypoints: Array<{
    name: string;
    lat: number;
    lng: number;
    type?: string;
  }>;

  // Match Racing Details
  opponentName: string;
  matchRound: string;
  totalRounds: string;
  seriesFormat: string;
  hasUmpire: boolean;

  // Team Racing Details
  yourTeamName: string;
  opponentTeamName: string;
  heatNumber: string;
  teamSize: string;
  teamMembers: string;

  // Communications
  vhfChannel: string;
  safetyChannel: string;

  // Advanced - Start Sequence
  warningSignalTime: string;
  preparatoryMinutes: string;

  // Advanced - Rules
  scoringSystem: string;
  penaltySystem: string;

  // Advanced - Registration
  registrationDeadline: string;
  entryFeeAmount: string;
  checkInTime: string;
  skipperBriefingTime: string;

  // Advanced - Tactical
  venueSpecificNotes: string;
  startStrategy: string;

  // Extracted Details - Distance Racing
  timeLimitHours: string;
  routeDescription: string;

  // Extracted Details - Prohibited Areas
  prohibitedAreas: Array<{
    name: string;
    description?: string;
    coordinates?: Array<{ lat: number; lng: number }>;
  }>;

  // Extracted Details - Tide Gates
  tideGates: Array<{
    name: string;
    time: string;
    direction?: string;
  }>;

  // Extracted Details - Entry Fees
  entryFees: Array<{
    description: string;
    amount: number;
    currency?: string;
    deadline?: string;
  }>;

  // Extracted Details - Crew
  minimumCrew: string;
  crewRequirements: string;

  // Extracted Details - Scoring
  scoringFormula: string;

  // Extracted Details - Motoring Division
  motoringDivisionAvailable: boolean;
  motoringDivisionRules: string;

  // Extracted Details - Contact
  organizingAuthority: string;
  contactEmail: string;
  eventWebsite: string;

  // Extracted Details - Schedule
  schedule: Array<{
    date?: string;
    time?: string;
    event: string;
    location?: string;
    mandatory?: boolean;
  }>;

  // Extracted Details - Safety
  safetyRequirements: string;
  retirementNotification: string;
  insuranceRequirements: string;

  // Extracted Details - Traffic & Navigation
  trafficSeparationSchemes: Array<{
    name: string;
    description?: string;
  }>;
  startAreaDescription: string;

  // Extracted Details - Scoring
  handicapSystems: string[];

  // Extracted Details - VHF Channels (enhanced)
  vhfChannels: Array<{
    channel: string;
    purpose?: string;
  }>;

  // Extracted Details - Weather
  expectedConditions: string;
  expectedWindDirection: string;
  expectedWindSpeedMin: string;
  expectedWindSpeedMax: string;

  // Extracted Details - Rules & Prizes
  classRules: string[];
  prizesDescription: string;
}

const DEFAULT_FORM_DATA: RaceFormData = {
  name: '',
  date: '',
  startTime: '',
  venue: '',
  venueCoordinates: null,
  description: '',
  raceType: 'fleet',
  boatId: null,
  classId: null,
  boatClass: '',
  expectedFleetSize: '',
  courseType: '',
  totalDistanceNm: '',
  finishVenue: '',
  routeWaypoints: [],
  // Match Racing
  opponentName: '',
  matchRound: '',
  totalRounds: '',
  seriesFormat: '',
  hasUmpire: false,
  // Team Racing
  yourTeamName: '',
  opponentTeamName: '',
  heatNumber: '',
  teamSize: '',
  teamMembers: '',
  // Communications
  vhfChannel: '',
  safetyChannel: 'VHF 16',
  warningSignalTime: '',
  preparatoryMinutes: '4',
  scoringSystem: 'Low Point',
  penaltySystem: '720',
  registrationDeadline: '',
  entryFeeAmount: '',
  checkInTime: '',
  skipperBriefingTime: '',
  venueSpecificNotes: '',
  startStrategy: '',
  // Extracted Details
  timeLimitHours: '',
  routeDescription: '',
  prohibitedAreas: [],
  tideGates: [],
  entryFees: [],
  minimumCrew: '',
  crewRequirements: '',
  scoringFormula: '',
  motoringDivisionAvailable: false,
  motoringDivisionRules: '',
  organizingAuthority: '',
  contactEmail: '',
  eventWebsite: '',
  // New extracted details
  schedule: [],
  safetyRequirements: '',
  retirementNotification: '',
  insuranceRequirements: '',
  trafficSeparationSchemes: [],
  startAreaDescription: '',
  handicapSystems: [],
  vhfChannels: [],
  expectedConditions: '',
  expectedWindDirection: '',
  expectedWindSpeedMin: '',
  expectedWindSpeedMax: '',
  classRules: [],
  prizesDescription: '',
};

// =============================================================================
// COMPONENT
// =============================================================================

export function EditRaceForm({
  raceId,
  onSave,
  onCancel,
  onDelete,
}: EditRaceFormProps) {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<RaceFormData>(DEFAULT_FORM_DATA);
  const [originalData, setOriginalData] = useState<RaceFormData>(DEFAULT_FORM_DATA);
  const [raceName, setRaceName] = useState('');
  // Track which table the race was loaded from (for correct save/delete)
  const [sourceTable, setSourceTable] = useState<'regattas' | 'race_events'>('regattas');

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Web-specific date/time input state
  const [webDateInput, setWebDateInput] = useState('');
  const [webTimeInput, setWebTimeInput] = useState('');

  // Location picker state
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Route map state (for distance races - unified map component)
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [tempWaypoints, setTempWaypoints] = useState<RouteWaypoint[]>([]);

  // ==========================================================================
  // DATA LOADING
  // ==========================================================================

  useEffect(() => {
    loadRaceData();
  }, [raceId]);

  const loadRaceData = async () => {
    try {
      setLoading(true);
      logger.debug('[EditRaceForm] Loading race data for:', raceId);

      // First try regattas table
      let race: any = null;
      let isRaceEvent = false;

      const { data: regattaData, error: regattaError } = await supabase
        .from('regattas')
        .select('*')
        .eq('id', raceId)
        .single();

      if (regattaError) {
        // If regatta not found, try race_events table
        logger.debug('[EditRaceForm] Not found in regattas, trying race_events');
        const { data: raceEvent, error: raceEventError } = await supabase
          .from('race_events')
          .select('*')
          .eq('id', raceId)
          .single();

        if (raceEventError || !raceEvent) {
          logger.error('[EditRaceForm] Error loading race:', regattaError);
          Alert.alert('Error', 'Failed to load race data');
          return;
        }

        // Normalize race_events data to match expected format
        race = {
          ...raceEvent,
          start_date: raceEvent.start_time || raceEvent.event_date,
          // Map race_events fields to regatta-like structure
          metadata: {
            venue: raceEvent.location,
            boat_class: raceEvent.boat_class,
            course_type: raceEvent.course_type,
            opponent_name: raceEvent.opponent_name,
            match_round: raceEvent.match_round,
            total_rounds: raceEvent.total_rounds,
            series_format: raceEvent.series_format,
            has_umpire: raceEvent.has_umpire,
            your_team_name: raceEvent.your_team_name,
            opponent_team_name: raceEvent.opponent_team_name,
            heat_number: raceEvent.heat_number,
            team_size: raceEvent.team_size,
            team_members: raceEvent.team_members,
          },
          expected_fleet_size: raceEvent.expected_fleet_size,
          race_type: raceEvent.race_type,
          vhf_channel: raceEvent.vhf_channel,
          _source: 'race_events',
        };
        isRaceEvent = true;
        setSourceTable('race_events');
        logger.debug('[EditRaceForm] Loaded from race_events:', race.name);
      } else {
        race = regattaData;
        setSourceTable('regattas');
      }

      if (!race) {
        Alert.alert('Error', 'Race not found');
        return;
      }

      // Extract metadata for fields stored in JSON
      const metadata = race.metadata || {};

      // Extract date and time from start_date timestamp
      let dateStr = '';
      let timeStr = '';
      if (race.start_date) {
        const startDate = new Date(race.start_date);
        dateStr = startDate.toISOString().split('T')[0];
        // Use first_warning_signal if available, otherwise extract from start_date
        if (race.first_warning_signal) {
          // Normalize to HH:MM format (strip seconds if present)
          const timeParts = race.first_warning_signal.split(':');
          timeStr = `${timeParts[0]}:${timeParts[1] || '00'}`;
        } else {
          const hours = startDate.getUTCHours().toString().padStart(2, '0');
          const minutes = startDate.getUTCMinutes().toString().padStart(2, '0');
          timeStr = `${hours}:${minutes}`;
        }
      }

      // Map database fields to form data
      // Note: Some fields are stored in metadata JSONB since columns don't exist
      const loadedData: RaceFormData = {
        name: race.name || '',
        date: dateStr,
        startTime: timeStr,
        // Check venue_name first (standard), then venue (legacy), then start_area_name (column)
        venue: metadata.venue_name || metadata.venue || race.start_area_name || '',
        // Prioritize direct DB columns (latitude/longitude), fall back to legacy metadata
        venueCoordinates: (race.latitude && race.longitude)
          ? { lat: race.latitude, lng: race.longitude }
          : metadata.venue_coordinates || null,
        description: race.description || '',
        raceType: race.race_type || 'fleet',
        // Boat Selection
        boatId: race.boat_id || null,
        classId: race.class_id || null,
        boatClass: metadata.boat_class || metadata.class_name || '',
        expectedFleetSize: race.expected_fleet_size?.toString() || '',
        courseType: metadata.course_type || race.course_area_designation || '',
        totalDistanceNm: race.total_distance_nm?.toString() || '',
        finishVenue: race.finish_area_name || '',
        routeWaypoints: metadata.route_waypoints || [],
        // Match Racing (stored in metadata)
        opponentName: metadata.opponent_name || '',
        matchRound: metadata.match_round?.toString() || '',
        totalRounds: metadata.total_rounds?.toString() || '',
        seriesFormat: metadata.series_format || '',
        hasUmpire: metadata.has_umpire || false,
        // Team Racing (stored in metadata)
        yourTeamName: metadata.your_team_name || '',
        opponentTeamName: metadata.opponent_team_name || '',
        heatNumber: metadata.heat_number?.toString() || '',
        teamSize: metadata.team_size?.toString() || '',
        teamMembers: metadata.team_members || '',
        // Communications
        vhfChannel: race.vhf_channel || '',
        safetyChannel: race.safety_channel || 'VHF 16',
        warningSignalTime: race.warning_signal_time || '',
        preparatoryMinutes: race.preparatory_signal_minutes?.toString() || '4',
        scoringSystem: race.scoring_system || 'Low Point',
        penaltySystem: race.penalty_system || '720',
        registrationDeadline: race.registration_deadline ? new Date(race.registration_deadline).toISOString().split('T')[0] : '',
        entryFeeAmount: race.entry_fee_amount?.toString() || '',
        checkInTime: race.check_in_time || '',
        skipperBriefingTime: race.skipper_briefing_time || '',
        venueSpecificNotes: race.venue_specific_notes || '',
        startStrategy: race.start_strategy || '',
        // Extracted Details - Distance Racing
        timeLimitHours: race.time_limit_hours?.toString() || '',
        routeDescription: race.route_description || '',
        // Extracted Details - Course/Navigation
        prohibitedAreas: race.prohibited_areas || [],
        tideGates: race.tide_gates || [],
        trafficSeparationSchemes: race.traffic_separation_schemes || [],
        startAreaDescription: race.start_area_description || '',
        // Extracted Details - Entry & Registration
        entryFees: race.entry_fees || [],
        // Extracted Details - Crew
        minimumCrew: race.minimum_crew?.toString() || '',
        crewRequirements: race.crew_requirements || '',
        // Extracted Details - Safety
        safetyRequirements: race.safety_requirements || '',
        retirementNotification: race.retirement_notification || '',
        insuranceRequirements: race.insurance_requirements || '',
        // Extracted Details - Scoring
        scoringFormula: race.scoring_formula || '',
        handicapSystems: race.handicap_systems || [],
        // Extracted Details - Motoring Division
        motoringDivisionAvailable: race.motoring_division_available || false,
        motoringDivisionRules: race.motoring_division_rules || '',
        // Extracted Details - Communications (enhanced)
        vhfChannels: race.vhf_channels || [],
        // Extracted Details - Organization
        organizingAuthority: race.organizing_authority || '',
        eventWebsite: race.event_website || '',
        contactEmail: race.contact_email || '',
        // Extracted Details - Weather
        expectedConditions: race.expected_conditions || '',
        expectedWindDirection: race.expected_wind_direction || '',
        expectedWindSpeedMin: race.expected_wind_speed_min?.toString() || '',
        expectedWindSpeedMax: race.expected_wind_speed_max?.toString() || '',
        // Extracted Details - Schedule
        schedule: race.schedule || [],
        // Extracted Details - Rules & Prizes
        classRules: race.class_rules || [],
        prizesDescription: race.prizes_description || '',
      };

      setFormData(loadedData);
      setOriginalData(loadedData);
      setRaceName(race.name || 'Edit Race');

      logger.debug('[EditRaceForm] Loaded race successfully');
    } catch (err) {
      logger.error('[EditRaceForm] Unexpected error:', err);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // FORM HANDLERS
  // ==========================================================================

  const updateField = useCallback(<K extends keyof RaceFormData>(
    field: K,
    value: RaceFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);

  // ==========================================================================
  // DATE/TIME HANDLERS
  // ==========================================================================

  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      updateField('date', dateStr);
    }
  }, [updateField]);

  const handleTimeChange = useCallback((event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      updateField('startTime', `${hours}:${minutes}`);
    }
  }, [updateField]);

  const handleLocationSelect = useCallback((location: { name: string; lat: number; lng: number }) => {
    updateField('venue', location.name);
    updateField('venueCoordinates', { lat: location.lat, lng: location.lng });
    setShowLocationPicker(false);
  }, [updateField]);

  const handleBoatSelect = useCallback((boatId: string | null, classId: string | null, className: string | null) => {
    updateField('boatId', boatId);
    updateField('classId', classId);
    if (className) {
      updateField('boatClass', className);
    }
  }, [updateField]);

  // ==========================================================================
  // DISTANCE ROUTE MAP HANDLERS (Unified map component for distance races)
  // ==========================================================================

  // Convert form waypoints to RouteWaypoint format for DistanceRouteMap
  const formWaypointsToRouteWaypoints = useCallback((
    waypoints: RaceFormData['routeWaypoints']
  ): RouteWaypoint[] => {
    return waypoints.map((wp, idx) => ({
      id: `waypoint-${idx}`,
      name: wp.name || `Waypoint ${idx + 1}`,
      latitude: wp.lat,
      longitude: wp.lng,
      type: (wp.type as RouteWaypoint['type']) || 'waypoint',
      required: true,
    }));
  }, []);

  // Convert RouteWaypoint back to form format
  const routeWaypointsToFormWaypoints = useCallback((
    waypoints: RouteWaypoint[]
  ): RaceFormData['routeWaypoints'] => {
    return waypoints.map((wp) => ({
      name: wp.name,
      lat: wp.latitude,
      lng: wp.longitude,
      type: wp.type,
    }));
  }, []);

  const handleOpenRouteMap = useCallback(() => {
    setTempWaypoints(formWaypointsToRouteWaypoints(formData.routeWaypoints));
    setShowRouteMap(true);
  }, [formData.routeWaypoints, formWaypointsToRouteWaypoints]);

  const handleSaveWaypoints = useCallback(() => {
    updateField('routeWaypoints', routeWaypointsToFormWaypoints(tempWaypoints));
    setShowRouteMap(false);
  }, [tempWaypoints, updateField, routeWaypointsToFormWaypoints]);

  const handleTotalDistanceChange = useCallback((distance: number) => {
    updateField('totalDistanceNm', distance.toFixed(1));
  }, [updateField]);

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    try {
      return new Date(dateStr);
    } catch {
      return new Date();
    }
  };

  const parseTime = (timeStr: string): Date => {
    const date = new Date();
    if (!timeStr) return date;
    try {
      const [hours, minutes] = timeStr.split(':');
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    } catch {}
    return date;
  };

  // ==========================================================================
  // SAVE HANDLER
  // ==========================================================================

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save changes');
      return;
    }

    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Race name is required');
      return;
    }

    if (!formData.date) {
      Alert.alert('Validation Error', 'Race date is required');
      return;
    }

    // Match Racing validation
    if (formData.raceType === 'match' && !formData.opponentName.trim()) {
      Alert.alert('Validation Error', 'Opponent name is required for match racing');
      return;
    }

    // Team Racing validation
    if (formData.raceType === 'team') {
      if (!formData.yourTeamName.trim()) {
        Alert.alert('Validation Error', 'Your team name is required for team racing');
        return;
      }
      if (!formData.opponentTeamName.trim()) {
        Alert.alert('Validation Error', 'Opponent team name is required for team racing');
        return;
      }
    }

    try {
      setSaving(true);

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // First, fetch existing metadata to preserve other fields
      const { data: existingRace } = await supabase
        .from('regattas')
        .select('metadata')
        .eq('id', raceId)
        .single();

      const existingMetadata = existingRace?.metadata || {};

      // Build start_date from date and time
      let startDate: string | null = null;
      if (formData.date) {
        const timeStr = formData.startTime || '00:00';
        // Check if time already has seconds (HH:MM:SS vs HH:MM)
        const hasSeconds = timeStr.split(':').length >= 3;
        startDate = hasSeconds
          ? `${formData.date}T${timeStr}`
          : `${formData.date}T${timeStr}:00`;
      }

      // Build metadata object for fields without dedicated columns
      const metadata = {
        ...existingMetadata,
        // Venue info (use venue_name to match rest of codebase)
        venue_name: formData.venue || null,
        venue_coordinates: formData.venueCoordinates,
        // Fleet racing
        boat_class: formData.boatClass || null,
        course_type: formData.courseType || null,
        // Match racing
        opponent_name: formData.opponentName || null,
        match_round: formData.matchRound ? parseInt(formData.matchRound, 10) : null,
        total_rounds: formData.totalRounds ? parseInt(formData.totalRounds, 10) : null,
        series_format: formData.seriesFormat || null,
        has_umpire: formData.hasUmpire,
        // Team racing
        your_team_name: formData.yourTeamName || null,
        opponent_team_name: formData.opponentTeamName || null,
        heat_number: formData.heatNumber ? parseInt(formData.heatNumber, 10) : null,
        team_size: formData.teamSize ? parseInt(formData.teamSize, 10) : null,
        team_members: formData.teamMembers || null,
        // Distance racing route
        route_waypoints: formData.routeWaypoints.length > 0 ? formData.routeWaypoints : null,
      };

      // Map form fields to actual database column names
      const updateData: Record<string, unknown> = {
        name: formData.name.trim(),
        start_date: startDate,
        first_warning_signal: formData.startTime || null,
        start_area_name: formData.venue || null,
        description: formData.description || null,
        race_type: formData.raceType,
        // Boat selection
        boat_id: formData.boatId || null,
        class_id: formData.classId || null,
        // Fleet Racing fields (columns that exist)
        expected_fleet_size: formData.expectedFleetSize ? parseInt(formData.expectedFleetSize, 10) : null,
        course_area_designation: formData.courseType || null,
        // Distance Racing fields
        total_distance_nm: formData.totalDistanceNm ? parseFloat(formData.totalDistanceNm) : null,
        finish_area_name: formData.finishVenue || null,
        // Communications
        vhf_channel: formData.vhfChannel || null,
        safety_channel: formData.safetyChannel || null,
        warning_signal_time: formData.warningSignalTime || null,
        preparatory_signal_minutes: formData.preparatoryMinutes ? parseInt(formData.preparatoryMinutes, 10) : null,
        scoring_system: formData.scoringSystem || null,
        penalty_system: formData.penaltySystem || null,
        registration_deadline: formData.registrationDeadline ? `${formData.registrationDeadline}T00:00:00` : null,
        entry_fee_amount: formData.entryFeeAmount ? parseFloat(formData.entryFeeAmount) : null,
        check_in_time: formData.checkInTime || null,
        skipper_briefing_time: formData.skipperBriefingTime || null,
        venue_specific_notes: formData.venueSpecificNotes || null,
        start_strategy: formData.startStrategy || null,
        // Extracted Details - Distance Racing
        time_limit_hours: formData.timeLimitHours ? parseFloat(formData.timeLimitHours) : null,
        route_description: formData.routeDescription || null,
        // Extracted Details - Course/Navigation
        prohibited_areas: formData.prohibitedAreas.length > 0 ? formData.prohibitedAreas : null,
        tide_gates: formData.tideGates.length > 0 ? formData.tideGates : null,
        traffic_separation_schemes: formData.trafficSeparationSchemes.length > 0 ? formData.trafficSeparationSchemes : null,
        start_area_description: formData.startAreaDescription || null,
        // Extracted Details - Entry & Registration
        entry_fees: formData.entryFees.length > 0 ? formData.entryFees : null,
        entry_deadline: formData.registrationDeadline ? `${formData.registrationDeadline}T00:00:00` : null,
        // Extracted Details - Crew
        minimum_crew: formData.minimumCrew ? parseInt(formData.minimumCrew, 10) : null,
        crew_requirements: formData.crewRequirements || null,
        // Extracted Details - Safety
        safety_requirements: formData.safetyRequirements || null,
        retirement_notification: formData.retirementNotification || null,
        insurance_requirements: formData.insuranceRequirements || null,
        // Extracted Details - Scoring
        scoring_formula: formData.scoringFormula || null,
        handicap_systems: formData.handicapSystems.length > 0 ? formData.handicapSystems : null,
        // Extracted Details - Motoring Division
        motoring_division_available: formData.motoringDivisionAvailable,
        motoring_division_rules: formData.motoringDivisionRules || null,
        // Extracted Details - Communications (enhanced)
        vhf_channels: formData.vhfChannels.length > 0 ? formData.vhfChannels : null,
        // Extracted Details - Organization
        organizing_authority: formData.organizingAuthority || null,
        event_website: formData.eventWebsite || null,
        contact_email: formData.contactEmail || null,
        // Extracted Details - Weather
        expected_conditions: formData.expectedConditions || null,
        expected_wind_direction: formData.expectedWindDirection || null,
        expected_wind_speed_min: formData.expectedWindSpeedMin ? parseInt(formData.expectedWindSpeedMin, 10) : null,
        expected_wind_speed_max: formData.expectedWindSpeedMax ? parseInt(formData.expectedWindSpeedMax, 10) : null,
        // Extracted Details - Schedule
        schedule: formData.schedule.length > 0 ? formData.schedule : null,
        // Extracted Details - Rules & Prizes
        class_rules: formData.classRules.length > 0 ? formData.classRules : null,
        prizes_description: formData.prizesDescription || null,
        // Store extended data in metadata JSONB
        metadata,
        updated_at: new Date().toISOString(),
      };

      logger.debug('[EditRaceForm] Saving with data:', updateData);
      logger.debug('[EditRaceForm] Source table:', sourceTable);

      let error: any = null;

      if (sourceTable === 'race_events') {
        // Map to race_events column names
        const raceEventData = {
          name: formData.name.trim(),
          event_date: formData.date || null,
          start_time: startDate,
          location: formData.venue || null,
          latitude: formData.venueCoordinates?.lat || null,
          longitude: formData.venueCoordinates?.lng || null,
          race_type: formData.raceType,
          vhf_channel: formData.vhfChannel || null,
          notes: formData.description || null,
          course_type: formData.courseType || null,
          expected_fleet_size: formData.expectedFleetSize ? parseInt(formData.expectedFleetSize, 10) : null,
          boat_class: formData.boatClass || null,
          total_distance_nm: formData.totalDistanceNm ? parseFloat(formData.totalDistanceNm) : null,
          // Match racing
          opponent_name: formData.opponentName || null,
          match_round: formData.matchRound ? parseInt(formData.matchRound, 10) : null,
          total_rounds: formData.totalRounds ? parseInt(formData.totalRounds, 10) : null,
          series_format: formData.seriesFormat || null,
          has_umpire: formData.hasUmpire,
          // Team racing
          your_team_name: formData.yourTeamName || null,
          opponent_team_name: formData.opponentTeamName || null,
          heat_number: formData.heatNumber ? parseInt(formData.heatNumber, 10) : null,
          team_size: formData.teamSize ? parseInt(formData.teamSize, 10) : null,
          team_members: formData.teamMembers ? JSON.parse(`["${formData.teamMembers}"]`) : null,
          updated_at: new Date().toISOString(),
        };

        logger.debug('[EditRaceForm] Saving to race_events:', raceEventData);
        const result = await supabase
          .from('race_events')
          .update(raceEventData)
          .eq('id', raceId);
        error = result.error;
      } else {
        // Save to regattas table
        const result = await supabase
          .from('regattas')
          .update(updateData)
          .eq('id', raceId);
        error = result.error;
      }

      if (error) {
        logger.error('[EditRaceForm] Save error:', error);
        Alert.alert('Error', `Failed to save changes: ${error.message}`);
        return;
      }

      logger.debug('[EditRaceForm] Race updated successfully to', sourceTable);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Navigate back immediately without alert for smoother UX
      onSave?.(raceId);
    } catch (err) {
      logger.error('[EditRaceForm] Unexpected save error:', err);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================================
  // DELETE HANDLER
  // ==========================================================================

  const handleDelete = () => {
    Alert.alert(
      'Delete Race',
      `Are you sure you want to delete "${formData.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);

              logger.debug('[EditRaceForm] Deleting from', sourceTable);
              const { error } = await supabase
                .from(sourceTable)
                .delete()
                .eq('id', raceId);

              if (error) {
                logger.error('[EditRaceForm] Delete error:', error);
                Alert.alert('Error', 'Failed to delete race');
                return;
              }

              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }

              onDelete?.(raceId);
            } catch (err) {
              logger.error('[EditRaceForm] Unexpected delete error:', err);
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  // ==========================================================================
  // CANCEL HANDLER
  // ==========================================================================

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => onCancel?.(),
          },
        ]
      );
    } else {
      onCancel?.();
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading race...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Edit Race
        </Text>

        <TouchableOpacity
          style={[styles.headerButton, styles.saveButton]}
          onPress={handleSave}
          disabled={saving || !hasChanges}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary[600]} />
          ) : (
            <Text style={[
              styles.saveText,
              !hasChanges && styles.saveTextDisabled
            ]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Race Type Section */}
          <View style={styles.raceTypeSection}>
            <RaceTypeSelector
              value={formData.raceType}
              onChange={(type) => updateField('raceType', type)}
              size="compact"
              showAllTypes
            />
          </View>

          {/* Basic Information */}
          <EditFormSection
            title="Basic Information"
            icon={<FileText size={16} color={colors.neutral[500]} />}
          >
            <EditFormRow
              label="Race Name"
              value={formData.name}
              placeholder="Enter race name"
              required
              onChangeText={(text) => updateField('name', text)}
            />
            <EditFormRow
              label="Date"
              value={formatDate(formData.date)}
              placeholder="Select date"
              required
              accessory="chevron"
              onPress={() => setShowDatePicker(true)}
            />
            <EditFormRow
              label="Start Time"
              value={formatTime(formData.startTime)}
              placeholder="Select time"
              accessory="chevron"
              onPress={() => setShowTimePicker(true)}
            />
            <EditFormRow
              label="Location"
              value={formData.venue || 'Select racing area'}
              placeholder="Select racing area"
              accessory="chevron"
              onPress={() => setShowLocationPicker(true)}
              showSeparator={false}
            />
          </EditFormSection>

          {/* Boat Selection (for fleet and distance races) */}
          {(formData.raceType === 'fleet' || formData.raceType === 'distance') && (
            <EditFormSection
              title="Your Boat"
              icon={<Sailboat size={16} color={colors.neutral[500]} />}
            >
              <View style={styles.boatSelectorContainer}>
                <BoatSelector
                  selectedBoatId={formData.boatId}
                  onSelect={handleBoatSelect}
                  label="Boat"
                  placeholder="Select your boat (optional)"
                />
              </View>
            </EditFormSection>
          )}

          {/* Fleet Details (conditional) */}
          {formData.raceType === 'fleet' && (
            <EditFormSection
              title="Fleet Details"
              icon={<Sailboat size={16} color={colors.neutral[500]} />}
            >
              <EditFormRow
                label="Boat Class"
                value={formData.boatClass}
                placeholder="e.g., IRC Div 1, J/70"
                onChangeText={(text) => updateField('boatClass', text)}
              />
              <EditFormRow
                label="Expected Fleet Size"
                value={formData.expectedFleetSize}
                placeholder="Number of boats"
                inputMode="numeric"
                onChangeText={(text) => updateField('expectedFleetSize', text)}
              />
              <EditFormRow
                label="Course Type"
                value={formData.courseType}
                placeholder="e.g., Windward-Leeward"
                onChangeText={(text) => updateField('courseType', text)}
                showSeparator={false}
              />
            </EditFormSection>
          )}

          {/* Distance Details (conditional) */}
          {formData.raceType === 'distance' && (
            <EditFormSection
              title="Distance Details"
              icon={<Navigation size={16} color={colors.neutral[500]} />}
            >
              <EditFormRow
                label="Total Distance"
                value={formData.totalDistanceNm ? `${formData.totalDistanceNm} nm` : ''}
                placeholder="Distance in nautical miles"
                inputMode="decimal"
                onChangeText={(text) => updateField('totalDistanceNm', text.replace(' nm', ''))}
              />
              <EditFormRow
                label="Finish Location"
                value={formData.finishVenue}
                placeholder="Same as start or different"
                onChangeText={(text) => updateField('finishVenue', text)}
              />
              <EditFormRow
                label="Route Waypoints"
                value={
                  formData.routeWaypoints.length > 0
                    ? `${formData.routeWaypoints.length} waypoints`
                    : 'Design route'
                }
                placeholder="Design route"
                accessory="chevron"
                onPress={handleOpenRouteMap}
                showSeparator={false}
              />
            </EditFormSection>
          )}

          {/* Match Racing Details (conditional) */}
          {formData.raceType === 'match' && (
            <EditFormSection
              title="Match Racing"
              icon={<Target size={16} color={colors.neutral[500]} />}
            >
              <EditFormRow
                label="Opponent Name"
                value={formData.opponentName}
                placeholder="Enter opponent's name"
                required
                onChangeText={(text) => updateField('opponentName', text)}
              />
              <EditFormRow
                label="Match Round"
                value={formData.matchRound}
                placeholder="e.g., Quarter-final"
                onChangeText={(text) => updateField('matchRound', text)}
              />
              <EditFormRow
                label="Total Rounds"
                value={formData.totalRounds}
                placeholder="Number of rounds"
                inputMode="numeric"
                onChangeText={(text) => updateField('totalRounds', text)}
              />
              <EditFormRow
                label="Series Format"
                value={formData.seriesFormat}
                placeholder="e.g., Best of 5"
                onChangeText={(text) => updateField('seriesFormat', text)}
              />
              <EditFormRow
                label="Umpired"
                value={formData.hasUmpire ? 'Yes' : 'No'}
                accessory="chevron"
                onPress={() => updateField('hasUmpire', !formData.hasUmpire)}
                showSeparator={false}
              />
            </EditFormSection>
          )}

          {/* Team Racing Details (conditional) */}
          {formData.raceType === 'team' && (
            <EditFormSection
              title="Team Racing"
              icon={<Users size={16} color={colors.neutral[500]} />}
            >
              <EditFormRow
                label="Your Team"
                value={formData.yourTeamName}
                placeholder="Enter your team name"
                required
                onChangeText={(text) => updateField('yourTeamName', text)}
              />
              <EditFormRow
                label="Opponent Team"
                value={formData.opponentTeamName}
                placeholder="Enter opponent team name"
                required
                onChangeText={(text) => updateField('opponentTeamName', text)}
              />
              <EditFormRow
                label="Heat Number"
                value={formData.heatNumber}
                placeholder="e.g., Heat 3"
                inputMode="numeric"
                onChangeText={(text) => updateField('heatNumber', text)}
              />
              <EditFormRow
                label="Team Size"
                value={formData.teamSize}
                placeholder="Boats per team"
                inputMode="numeric"
                onChangeText={(text) => updateField('teamSize', text)}
              />
              <EditFormRow
                label="Team Members"
                value={formData.teamMembers}
                placeholder="List team members"
                onChangeText={(text) => updateField('teamMembers', text)}
                showSeparator={false}
              />
            </EditFormSection>
          )}

          {/* Communications */}
          <EditFormSection
            title="Communications"
            icon={<Radio size={16} color={colors.neutral[500]} />}
          >
            <EditFormRow
              label="VHF Channel"
              value={formData.vhfChannel}
              placeholder="e.g., 72"
              inputMode="numeric"
              onChangeText={(text) => updateField('vhfChannel', text)}
            />
            <EditFormRow
              label="Safety Channel"
              value={formData.safetyChannel}
              placeholder="VHF 16"
              onChangeText={(text) => updateField('safetyChannel', text)}
              showSeparator={false}
            />
          </EditFormSection>

          {/* Advanced Options (Collapsible) */}
          <View style={styles.advancedSection}>
            <AccordionSection
              title="Start Sequence"
              icon={<Flag size={18} color={colors.neutral[500]} />}
              subtitle="Timing and signals"
            >
              <View style={styles.accordionContent}>
                <EditFormRow
                  label="Warning Signal Time"
                  value={formatTime(formData.warningSignalTime)}
                  placeholder="Select time"
                  accessory="chevron"
                  onPress={() => {/* Would open time picker */}}
                />
                <EditFormRow
                  label="Preparatory Minutes"
                  value={formData.preparatoryMinutes}
                  placeholder="4"
                  inputMode="numeric"
                  onChangeText={(text) => updateField('preparatoryMinutes', text)}
                  showSeparator={false}
                />
              </View>
            </AccordionSection>

            <AccordionSection
              title="Rules & Scoring"
              icon={<FileText size={18} color={colors.neutral[500]} />}
              subtitle="Penalties and scoring system"
            >
              <View style={styles.accordionContent}>
                <EditFormRow
                  label="Scoring System"
                  value={formData.scoringSystem}
                  placeholder="Low Point"
                  onChangeText={(text) => updateField('scoringSystem', text)}
                />
                <EditFormRow
                  label="Penalty System"
                  value={formData.penaltySystem}
                  placeholder="720"
                  onChangeText={(text) => updateField('penaltySystem', text)}
                  showSeparator={false}
                />
              </View>
            </AccordionSection>

            <AccordionSection
              title="Registration"
              icon={<Calendar size={18} color={colors.neutral[500]} />}
              subtitle="Entry and check-in details"
            >
              <View style={styles.accordionContent}>
                <EditFormRow
                  label="Registration Deadline"
                  value={formData.registrationDeadline}
                  placeholder="Enter deadline"
                  onChangeText={(text) => updateField('registrationDeadline', text)}
                />
                <EditFormRow
                  label="Entry Fee"
                  value={formData.entryFeeAmount ? `$${formData.entryFeeAmount}` : ''}
                  placeholder="Amount"
                  inputMode="decimal"
                  onChangeText={(text) => updateField('entryFeeAmount', text.replace('$', ''))}
                />
                <EditFormRow
                  label="Check-in Time"
                  value={formData.checkInTime}
                  placeholder="Enter time"
                  onChangeText={(text) => updateField('checkInTime', text)}
                />
                <EditFormRow
                  label="Skipper Briefing"
                  value={formData.skipperBriefingTime}
                  placeholder="Enter time"
                  onChangeText={(text) => updateField('skipperBriefingTime', text)}
                  showSeparator={false}
                />
              </View>
            </AccordionSection>

            <AccordionSection
              title="Tactical Notes"
              icon={<MapPin size={18} color={colors.neutral[500]} />}
              subtitle="Venue and strategy info"
            >
              <View style={styles.accordionContent}>
                <EditFormRow
                  label="Venue Notes"
                  value={formData.venueSpecificNotes}
                  placeholder="Local knowledge, hazards..."
                  onChangeText={(text) => updateField('venueSpecificNotes', text)}
                />
                <EditFormRow
                  label="Start Strategy"
                  value={formData.startStrategy}
                  placeholder="Favored end, approach..."
                  onChangeText={(text) => updateField('startStrategy', text)}
                  showSeparator={false}
                />
              </View>
            </AccordionSection>

            {/* Extracted Details - Entry & Registration */}
            <AccordionSection
              title="Entry & Fees"
              icon={<DollarSign size={18} color={colors.neutral[500]} />}
              subtitle="Entry fees and deadlines"
            >
              <View style={styles.accordionContent}>
                <EditFormRow
                  label="Entry Fees"
                  value={formData.entryFees.length > 0
                    ? formData.entryFees.map(f => `${f.type || 'Fee'}: ${f.currency || '$'}${f.amount}`).join(', ')
                    : ''}
                  placeholder="No entry fees specified"
                />
                <EditFormRow
                  label="Entry Deadline"
                  value={formData.registrationDeadline}
                  placeholder="YYYY-MM-DD"
                  onChangeText={(text) => updateField('registrationDeadline', text)}
                  showSeparator={false}
                />
              </View>
            </AccordionSection>

            {/* Extracted Details - Crew & Safety */}
            <AccordionSection
              title="Crew & Safety"
              icon={<Shield size={18} color={colors.neutral[500]} />}
              subtitle="Requirements and procedures"
            >
              <View style={styles.accordionContent}>
                <EditFormRow
                  label="Minimum Crew"
                  value={formData.minimumCrew}
                  placeholder="Number of crew"
                  inputMode="numeric"
                  onChangeText={(text) => updateField('minimumCrew', text)}
                />
                <EditFormRow
                  label="Crew Requirements"
                  value={formData.crewRequirements}
                  placeholder="Experience, certifications..."
                  onChangeText={(text) => updateField('crewRequirements', text)}
                />
                <EditFormRow
                  label="Safety Requirements"
                  value={formData.safetyRequirements}
                  placeholder="Equipment, procedures..."
                  onChangeText={(text) => updateField('safetyRequirements', text)}
                />
                <EditFormRow
                  label="Retirement Notification"
                  value={formData.retirementNotification}
                  placeholder="Notification procedure..."
                  onChangeText={(text) => updateField('retirementNotification', text)}
                />
                <EditFormRow
                  label="Insurance Requirements"
                  value={formData.insuranceRequirements}
                  placeholder="Third-party, coverage..."
                  onChangeText={(text) => updateField('insuranceRequirements', text)}
                  showSeparator={false}
                />
              </View>
            </AccordionSection>

            {/* Extracted Details - Event Schedule */}
            <AccordionSection
              title="Event Schedule"
              icon={<CalendarDays size={18} color={colors.neutral[500]} />}
              subtitle="Race day timeline"
            >
              <View style={styles.accordionContent}>
                {formData.schedule.length > 0 ? (
                  formData.schedule.map((event, idx) => (
                    <EditFormRow
                      key={idx}
                      label={event.time || 'TBD'}
                      value={event.event}
                      placeholder="Event description"
                      showSeparator={idx < formData.schedule.length - 1}
                    />
                  ))
                ) : (
                  <EditFormRow
                    label="Schedule"
                    value=""
                    placeholder="No schedule events"
                    showSeparator={false}
                  />
                )}
              </View>
            </AccordionSection>

            {/* Extracted Details - Course & Navigation (distance/fleet only) */}
            {(formData.raceType === 'distance' || formData.raceType === 'fleet') && (
              <AccordionSection
                title="Course & Navigation"
                icon={<Navigation size={18} color={colors.neutral[500]} />}
                subtitle="Hazards and tide gates"
              >
                <View style={styles.accordionContent}>
                  <EditFormRow
                    label="Start Area Description"
                    value={formData.startAreaDescription}
                    placeholder="Start line details..."
                    onChangeText={(text) => updateField('startAreaDescription', text)}
                  />
                  <EditFormRow
                    label="Prohibited Areas"
                    value={formData.prohibitedAreas.length > 0
                      ? `${formData.prohibitedAreas.length} area(s)`
                      : ''}
                    placeholder="No prohibited areas"
                  />
                  <EditFormRow
                    label="Tide Gates"
                    value={formData.tideGates.length > 0
                      ? formData.tideGates.map(t => t.location || t.name).join(', ')
                      : ''}
                    placeholder="No tide gates"
                  />
                  <EditFormRow
                    label="Traffic Separation"
                    value={formData.trafficSeparationSchemes.length > 0
                      ? `${formData.trafficSeparationSchemes.length} scheme(s)`
                      : ''}
                    placeholder="No traffic schemes"
                    showSeparator={false}
                  />
                </View>
              </AccordionSection>
            )}

            {/* Extracted Details - Motoring Division (distance only) */}
            {formData.raceType === 'distance' && (
              <AccordionSection
                title="Motoring Division"
                icon={<Ship size={18} color={colors.neutral[500]} />}
                subtitle="Motor sailing rules"
              >
                <View style={styles.accordionContent}>
                  <EditFormRow
                    label="Available"
                    value={formData.motoringDivisionAvailable ? 'Yes' : 'No'}
                    accessory="chevron"
                    onPress={() => updateField('motoringDivisionAvailable', !formData.motoringDivisionAvailable)}
                  />
                  {formData.motoringDivisionAvailable && (
                    <EditFormRow
                      label="Rules"
                      value={formData.motoringDivisionRules}
                      placeholder="Motoring rules..."
                      onChangeText={(text) => updateField('motoringDivisionRules', text)}
                      showSeparator={false}
                    />
                  )}
                </View>
              </AccordionSection>
            )}

            {/* Extracted Details - Scoring & Handicap */}
            <AccordionSection
              title="Scoring & Handicap"
              icon={<Trophy size={18} color={colors.neutral[500]} />}
              subtitle="Scoring formula and systems"
            >
              <View style={styles.accordionContent}>
                <EditFormRow
                  label="Scoring Formula"
                  value={formData.scoringFormula}
                  placeholder="e.g., IRC, HKPN..."
                  onChangeText={(text) => updateField('scoringFormula', text)}
                />
                <EditFormRow
                  label="Handicap Systems"
                  value={formData.handicapSystems.length > 0
                    ? formData.handicapSystems.join(', ')
                    : ''}
                  placeholder="No handicap systems"
                  showSeparator={false}
                />
              </View>
            </AccordionSection>

            {/* Extracted Details - Communications (enhanced) */}
            <AccordionSection
              title="VHF Channels"
              icon={<Radio size={18} color={colors.neutral[500]} />}
              subtitle="Radio frequencies"
            >
              <View style={styles.accordionContent}>
                {formData.vhfChannels.length > 0 ? (
                  formData.vhfChannels.map((ch, idx) => (
                    <EditFormRow
                      key={idx}
                      label={`CH ${ch.channel}`}
                      value={ch.purpose || ''}
                      placeholder="Purpose"
                      showSeparator={idx < formData.vhfChannels.length - 1}
                    />
                  ))
                ) : (
                  <EditFormRow
                    label="Channels"
                    value={formData.vhfChannel || ''}
                    placeholder="No channels specified"
                    showSeparator={false}
                  />
                )}
              </View>
            </AccordionSection>

            {/* Extracted Details - Organization */}
            <AccordionSection
              title="Organization"
              icon={<Building size={18} color={colors.neutral[500]} />}
              subtitle="Organizer contact info"
            >
              <View style={styles.accordionContent}>
                <EditFormRow
                  label="Organizing Authority"
                  value={formData.organizingAuthority}
                  placeholder="Club or organization..."
                  onChangeText={(text) => updateField('organizingAuthority', text)}
                />
                <EditFormRow
                  label="Event Website"
                  value={formData.eventWebsite}
                  placeholder="https://..."
                  onChangeText={(text) => updateField('eventWebsite', text)}
                />
                <EditFormRow
                  label="Contact Email"
                  value={formData.contactEmail}
                  placeholder="email@example.com"
                  onChangeText={(text) => updateField('contactEmail', text)}
                  showSeparator={false}
                />
              </View>
            </AccordionSection>

            {/* Extracted Details - Weather */}
            <AccordionSection
              title="Expected Weather"
              icon={<Cloud size={18} color={colors.neutral[500]} />}
              subtitle="Conditions forecast"
            >
              <View style={styles.accordionContent}>
                <EditFormRow
                  label="Conditions"
                  value={formData.expectedConditions}
                  placeholder="Weather description..."
                  onChangeText={(text) => updateField('expectedConditions', text)}
                />
                <EditFormRow
                  label="Wind Direction"
                  value={formData.expectedWindDirection}
                  placeholder="e.g., SW"
                  onChangeText={(text) => updateField('expectedWindDirection', text)}
                />
                <EditFormRow
                  label="Wind Speed Min"
                  value={formData.expectedWindSpeedMin}
                  placeholder="Knots"
                  inputMode="numeric"
                  onChangeText={(text) => updateField('expectedWindSpeedMin', text)}
                />
                <EditFormRow
                  label="Wind Speed Max"
                  value={formData.expectedWindSpeedMax}
                  placeholder="Knots"
                  inputMode="numeric"
                  onChangeText={(text) => updateField('expectedWindSpeedMax', text)}
                  showSeparator={false}
                />
              </View>
            </AccordionSection>

            {/* Extracted Details - Rules */}
            <AccordionSection
              title="Class Rules"
              icon={<FileText size={18} color={colors.neutral[500]} />}
              subtitle="Applicable rules"
            >
              <View style={styles.accordionContent}>
                <EditFormRow
                  label="Rules"
                  value={formData.classRules.length > 0
                    ? formData.classRules.join(', ')
                    : ''}
                  placeholder="No class rules specified"
                  showSeparator={false}
                />
              </View>
            </AccordionSection>

            {/* Extracted Details - Prizes */}
            <AccordionSection
              title="Prizes"
              icon={<Award size={18} color={colors.neutral[500]} />}
              subtitle="Awards and trophies"
            >
              <View style={styles.accordionContent}>
                <EditFormRow
                  label="Prizes"
                  value={formData.prizesDescription}
                  placeholder="Prize description..."
                  onChangeText={(text) => updateField('prizesDescription', text)}
                  showSeparator={false}
                />
              </View>
            </AccordionSection>
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerZone}>
            <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={saving}
            >
              <Trash2 size={18} color={colors.danger[600]} />
              <Text style={styles.deleteButtonText}>Delete Race</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker - Native */}
      {showDatePicker && Platform.OS !== 'web' && DateTimePicker && (
        <DateTimePicker
          value={parseDate(formData.date)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Time Picker - Native */}
      {showTimePicker && Platform.OS !== 'web' && DateTimePicker && (
        <DateTimePicker
          value={parseTime(formData.startTime)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {/* Date Picker - Web */}
      {showDatePicker && Platform.OS === 'web' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity
            style={styles.webPickerOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.webPickerContainer}>
              <Text style={styles.webPickerTitle}>Select Date</Text>
              <TextInput
                style={styles.webPickerInput}
                value={webDateInput || formData.date}
                onChangeText={setWebDateInput}
                placeholder="YYYY-MM-DD"
                autoFocus
              />
              <View style={styles.webPickerButtons}>
                <TouchableOpacity
                  style={styles.webPickerCancelButton}
                  onPress={() => {
                    setWebDateInput('');
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.webPickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.webPickerConfirmButton}
                  onPress={() => {
                    if (webDateInput) {
                      updateField('date', webDateInput);
                    }
                    setWebDateInput('');
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.webPickerConfirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Time Picker - Web */}
      {showTimePicker && Platform.OS === 'web' && (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <TouchableOpacity
            style={styles.webPickerOverlay}
            activeOpacity={1}
            onPress={() => setShowTimePicker(false)}
          >
            <View style={styles.webPickerContainer}>
              <Text style={styles.webPickerTitle}>Select Time</Text>
              <TextInput
                style={styles.webPickerInput}
                value={webTimeInput || formData.startTime}
                onChangeText={setWebTimeInput}
                placeholder="HH:MM (24h format)"
                autoFocus
              />
              <View style={styles.webPickerButtons}>
                <TouchableOpacity
                  style={styles.webPickerCancelButton}
                  onPress={() => {
                    setWebTimeInput('');
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={styles.webPickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.webPickerConfirmButton}
                  onPress={() => {
                    if (webTimeInput) {
                      updateField('startTime', webTimeInput);
                    }
                    setWebTimeInput('');
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={styles.webPickerConfirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Location Map Picker */}
      <LocationMapPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectLocation={handleLocationSelect}
        raceType={formData.raceType}
        initialLocation={formData.venueCoordinates}
        initialName={formData.venue}
      />

      {/* Route Map for Distance Races (unified map component - works on web + native) */}
      <Modal
        visible={showRouteMap}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowRouteMap(false)}
      >
        <SafeAreaView style={styles.mapModalContainer}>
          <View style={styles.mapModalHeader}>
            <TouchableOpacity style={styles.mapModalButton} onPress={() => setShowRouteMap(false)}>
              <X size={24} color={colors.neutral[500]} />
            </TouchableOpacity>
            <Text style={styles.mapModalTitle}>Plot Route</Text>
            <TouchableOpacity
              style={[styles.mapModalButton, styles.mapModalSaveButton]}
              onPress={handleSaveWaypoints}
            >
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.mapModalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.mapContainer}>
            <DistanceRouteMap
              waypoints={tempWaypoints}
              onWaypointsChange={setTempWaypoints}
              onTotalDistanceChange={handleTotalDistanceChange}
              initialCenter={
                formData.venueCoordinates
                  ? { lat: formData.venueCoordinates.lat, lng: formData.venueCoordinates.lng }
                  : undefined
              }
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.neutral[500],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: TufteTokens.spacing.section,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: colors.border.light,
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.neutral[900],
    textAlign: 'center',
  },
  cancelText: {
    fontSize: 17,
    color: colors.primary[600],
  },
  saveButton: {
    alignItems: 'flex-end',
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary[600],
  },
  saveTextDisabled: {
    color: colors.neutral[300],
  },

  // Content
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: TufteTokens.spacing.section,
  },

  // Race Type Section
  raceTypeSection: {
    paddingHorizontal: TufteTokens.spacing.section,
    marginBottom: TufteTokens.spacing.section,
  },

  // Boat Selector
  boatSelectorContainer: {
    paddingHorizontal: TufteTokens.spacing.section,
    paddingVertical: TufteTokens.spacing.compact,
  },

  // Advanced Section
  advancedSection: {
    marginHorizontal: TufteTokens.spacing.section,
    marginBottom: TufteTokens.spacing.section + 8,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: IOS_COLORS.label,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  accordionContent: {
    marginTop: -TufteTokens.spacing.section,
    marginHorizontal: -TufteTokens.spacing.section,
  },

  // Danger Zone
  dangerZone: {
    marginHorizontal: TufteTokens.spacing.section,
    marginBottom: TufteTokens.spacing.section,
  },
  dangerZoneTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: TufteTokens.spacing.compact,
    paddingHorizontal: TufteTokens.spacing.section,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TufteTokens.spacing.compact,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.danger[200],
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.danger[600],
  },

  // Bottom padding for scroll
  bottomPadding: {
    height: 40,
  },

  // Web Date/Time Picker styles
  webPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webPickerContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 20,
    width: 300,
    shadowColor: IOS_COLORS.label,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  webPickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: 16,
    textAlign: 'center',
  },
  webPickerInput: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.neutral[900],
    backgroundColor: colors.background.secondary,
    marginBottom: 16,
  },
  webPickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  webPickerCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  webPickerCancelText: {
    fontSize: 16,
    color: colors.neutral[500],
  },
  webPickerConfirmButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  webPickerConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.systemBackground,
  },

  // Route Map Modal styles
  mapModalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  mapModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  mapModalButton: {
    padding: 8,
  },
  mapModalSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  mapModalSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
});

export default EditRaceForm;
