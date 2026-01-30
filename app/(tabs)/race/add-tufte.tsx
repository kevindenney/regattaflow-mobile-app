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
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import {
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Info,
  Link,
  Map,
  MapPin,
  Navigation,
  Sailboat,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
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
import { UnifiedDocumentInput } from '@/components/documents/UnifiedDocumentInput';
import { ComprehensiveRaceExtractionAgent } from '@/services/agents/ComprehensiveRaceExtractionAgent';
import { geocodeExtractedLocations, geocodeSingleLocation } from '@/services/location/geocodeExtractedLocations';
import { PDFExtractionService } from '@/services/PDFExtractionService';
import { supabase } from '@/services/supabase';
import type { RaceSuggestion } from '@/services/RaceSuggestionService';

import type { RaceType } from '@/components/races/RaceTypeSelector';

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
  aiSelectedFile: DocumentPicker.DocumentPickerAsset | null;
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
  const { user, isGuest } = useAuth();

  // Form state
  const getInitialState = (): FormState => ({
    raceType: 'fleet',
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
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  // Race suggestions from the full suggestion engine
  const {
    suggestions,
    loading: suggestionsLoading,
    acceptSuggestion,
    dismissSuggestion,
  } = useRaceSuggestions();

  // Multi-race detection state
  const [showMultiRaceModal, setShowMultiRaceModal] = useState(false);
  const [multiRaceData, setMultiRaceData] = useState<MultiRaceExtractedData | null>(null);
  const [isCreatingMultiple, setIsCreatingMultiple] = useState(false);

  // SSI document state
  const [ssiDocumentId, setSsiDocumentId] = useState<string | null>(null);

  // Course position editor state
  const [showCoursePositionEditor, setShowCoursePositionEditor] = useState(false);
  const [positionedCourse, setPositionedCourse] = useState<PositionedCourse | null>(null);

  // Reset form when screen is focused
  useFocusEffect(
    useCallback(() => {
      setForm(getInitialState());
      setIsExtracting(false);
      setIsSaving(false);
      setCalculatedDistance(null);
      setShowRouteMap(false);
      setSsiDocumentId(null);
      setShowCoursePositionEditor(false);
      setPositionedCourse(null);
      setShowAllSuggestions(false);
      logger.debug('[AddRaceScreen] Form reset on focus');
    }, [])
  );

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

  // Handle AI extraction
  const handleExtract = useCallback(async () => {
    logger.debug('[AddRaceScreen] handleExtract called, isExtracting:', isExtracting);

    if (isExtracting) return;

    let textContent = '';

    // Get content based on input method
    if (form.aiInputMethod === 'paste') {
      textContent = form.aiInputText.trim();
      if (textContent.length < 20) {
        Alert.alert('Error', 'Please paste more text to extract from');
        return;
      }
    } else if (form.aiInputMethod === 'upload' && form.aiSelectedFile) {
      setIsExtracting(true);
      try {
        const result = await PDFExtractionService.extractText(form.aiSelectedFile.uri, { maxPages: 50 });
        if (!result.success || !result.text) {
          throw new Error(result.error || 'Failed to extract text from PDF');
        }
        textContent = result.text;
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'PDF extraction failed');
        setIsExtracting(false);
        return;
      }
    } else if (form.aiInputMethod === 'url') {
      let url = form.aiInputText.trim();
      // Normalize URL - add https:// if no protocol specified
      if (!url.startsWith('http')) {
        if (url.startsWith('www.')) {
          url = `https://${url}`;
        } else {
          Alert.alert('Error', 'Please enter a valid URL');
          return;
        }
      }

      setIsExtracting(true);
      try {
        const isPdfUrl = url.toLowerCase().includes('.pdf') || url.includes('_files/ugd/');

        if (isPdfUrl) {
          const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
          const response = await fetch(`${supabaseUrl}/functions/v1/extract-pdf-text`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ url }),
          });
          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.error || `Failed to extract PDF: ${response.status}`);
          }
          textContent = result.text;
        } else {
          const response = await fetch(url);
          textContent = await response.text();
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Could not fetch content from URL';
        Alert.alert('Error', errorMsg);
        setIsExtracting(false);
        return;
      }
    }

    if (!textContent || textContent.length < 20) {
      Alert.alert('Error', 'Not enough content to extract');
      setIsExtracting(false);
      return;
    }

    setIsExtracting(true);

    try {
      const agent = new ComprehensiveRaceExtractionAgent();
      const result = await agent.extractRaceDetails(textContent);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Extraction failed');
      }

      // Check for multiple races
      if (result.data.multipleRaces && result.data.races && result.data.races.length > 1) {
        logger.debug('[AddRaceScreen] Multiple races detected:', result.data.races.length);
        setMultiRaceData(result.data as MultiRaceExtractedData);
        setShowMultiRaceModal(true);
        setIsExtracting(false);
        return;
      }

      // Apply extracted data to form (single race)
      const extracted = result.data;
      const aiFields = new Set<string>();
      const updates: Partial<FormState> = {};

      if (extracted.raceName) { updates.name = extracted.raceName; aiFields.add('name'); }
      if (extracted.raceDate || extracted.date) { updates.date = extracted.raceDate || extracted.date; aiFields.add('date'); }
      if (extracted.warningSignalTime || extracted.startTime) { updates.time = extracted.warningSignalTime || extracted.startTime; aiFields.add('time'); }
      if (extracted.venue || extracted.location) { updates.location = extracted.venue || extracted.location; aiFields.add('location'); }
      if (extracted.raceType && ['fleet', 'distance', 'match', 'team'].includes(extracted.raceType)) {
        updates.raceType = extracted.raceType as RaceType;
        aiFields.add('raceType');
      }

      // VHF Channel
      if (extracted.vhfChannels?.length > 0) {
        updates.vhfChannel = extracted.vhfChannels[0].channel?.toString() || '';
        aiFields.add('vhfChannel');
      }

      // Distance-specific
      if (extracted.totalDistanceNm) { updates.totalDistanceNm = extracted.totalDistanceNm.toString(); aiFields.add('totalDistanceNm'); }
      if (extracted.timeLimitHours) { updates.timeLimitHours = extracted.timeLimitHours.toString(); aiFields.add('timeLimitHours'); }
      if (extracted.courseDescription) { updates.routeDescription = extracted.courseDescription; aiFields.add('routeDescription'); }

      // Fleet-specific
      if (extracted.courseType) { updates.courseType = extracted.courseType; aiFields.add('courseType'); }
      if (extracted.numberOfLegs) { updates.numberOfLaps = extracted.numberOfLegs.toString(); aiFields.add('numberOfLaps'); }
      if (extracted.boatClass) { updates.boatClass = extracted.boatClass; aiFields.add('boatClass'); }

      // Route waypoints
      if (extracted.routeWaypoints?.length > 0) {
        const mappedWaypoints = extracted.routeWaypoints.map((wp: any, i: number) => ({
          id: `wp-${Date.now()}-${i}`,
          name: wp.name || `Waypoint ${i + 1}`,
          latitude: wp.latitude || 0,
          longitude: wp.longitude || 0,
          type: wp.type || 'waypoint',
          required: wp.type === 'start' || wp.type === 'finish',
        }));

        // FIX: Don't filter here! Keep ALL waypoints - geocoding will fill in coordinates
        // The filter was removing waypoints without coordinates BEFORE geocoding could run
        updates.routeWaypoints = mappedWaypoints;

        if (updates.routeWaypoints.length > 0) aiFields.add('routeWaypoints');
      }

      // Course marks
      if (extracted.marks?.length > 0) {
        updates.marks = extracted.marks;
        aiFields.add('marks');
      }

      // Map raw extraction to ExtractedDetailsData for display in ExtractedDetailsSummary
      const extractedDetails: ExtractedDetailsData = {
        schedule: extracted.schedule,
        minimumCrew: extracted.minimumCrew,
        crewRequirements: extracted.crewRequirements,
        minorSailorRules: extracted.minorSailorRules,
        prohibitedAreas: extracted.prohibitedAreas?.map((a: any) => ({
          name: a.name,
          description: a.description,
        })),
        startAreaName: extracted.startAreaName,
        startAreaDescription: extracted.startAreaDescription,
        finishAreaName: extracted.finishAreaName,
        finishAreaDescription: extracted.finishAreaDescription,
        routeWaypoints: extracted.routeWaypoints?.map((wp: any) => ({
          name: wp.name,
          latitude: wp.latitude,
          longitude: wp.longitude,
          type: wp.type,
          notes: wp.notes,
        })),
        trafficSeparationSchemes: extracted.trafficSeparationSchemes?.map((t: any) => t.name),
        tideGates: extracted.tideGates?.map((tg: any) => ({
          location: tg.location,
          optimalTime: tg.optimalPassingTime,
          notes: tg.notes,
        })),
        entryFees: extracted.entryFeeAmount ? [{
          type: 'Entry Fee',
          amount: `${extracted.entryFeeCurrency || 'HKD'} ${extracted.entryFeeAmount}`,
        }] : undefined,
        entryDeadline: extracted.entryDeadline,
        entryFormUrl: extracted.entryFormUrl,
        scoringFormulaDescription: extracted.scoringFormulaDescription,
        handicapSystem: extracted.scoringSystem ? [extracted.scoringSystem] : undefined,
        motoringDivisionAvailable: extracted.motoringDivisionAvailable,
        motoringDivisionRules: extracted.motoringDivisionRules,
        vhfChannels: extracted.vhfChannels,
        organizingAuthority: extracted.organizingAuthority,
        eventWebsite: extracted.eventWebsite,
        safetyRequirements: extracted.safetyRequirements,
        retirementNotification: extracted.retirementNotificationRequirements,
        insuranceRequirements: extracted.insurancePolicyReference,
        classRules: extracted.classRules ? [extracted.classRules] : undefined,
        eligibilityRequirements: extracted.eligibilityRequirements,
        expectedConditions: extracted.expectedConditions,
        expectedWindDirection: extracted.expectedWindDirection?.toString(),
        expectedWindSpeedMin: extracted.expectedWindSpeedMin,
        expectedWindSpeedMax: extracted.expectedWindSpeedMax,
        prizesDescription: extracted.prizesDescription,
      };

      // =========================================================================
      // GEOCODING PHASE: Auto-geocode locations that have names but no coordinates
      // =========================================================================
      const regionHint = extracted.venue || extracted.location || 'Hong Kong';

      // 1. Geocode START area if it has a name but no coordinates
      if (extractedDetails.startAreaName) {
        try {
          const startResult = await geocodeSingleLocation(extractedDetails.startAreaName, regionHint);
          if (startResult) {
            logger.debug('[AddRaceScreen] Geocoded start area:', extractedDetails.startAreaName, startResult);
            extractedDetails.startAreaCoordinates = startResult;
          }
        } catch (err) {
          logger.warn('[AddRaceScreen] Failed to geocode start area:', err);
        }
      }

      // 2. Geocode FINISH area if it has a name but no coordinates
      if (extractedDetails.finishAreaName) {
        try {
          const finishResult = await geocodeSingleLocation(extractedDetails.finishAreaName, regionHint);
          if (finishResult) {
            logger.debug('[AddRaceScreen] Geocoded finish area:', extractedDetails.finishAreaName, finishResult);
            extractedDetails.finishAreaCoordinates = finishResult;
          }
        } catch (err) {
          logger.warn('[AddRaceScreen] Failed to geocode finish area:', err);
        }
      }

      // 3. Geocode ROUTE WAYPOINTS (peaks) that don't have coordinates
      if (extractedDetails.routeWaypoints && extractedDetails.routeWaypoints.length > 0) {
        try {
          const waypointsToGeocode = extractedDetails.routeWaypoints.map(wp => ({
            name: wp.name,
            latitude: wp.latitude,
            longitude: wp.longitude,
            type: wp.type,
            notes: wp.notes,
          }));

          const geocodedWaypoints = await geocodeExtractedLocations(waypointsToGeocode, regionHint);

          extractedDetails.routeWaypoints = geocodedWaypoints;

          // Also update the form's routeWaypoints for map display
          const waypointsWithCoords = geocodedWaypoints.filter(wp => wp.latitude && wp.longitude);
          const waypointsWithoutCoords = geocodedWaypoints.filter(wp => !wp.latitude || !wp.longitude);

          // Calculate a default position for waypoints that failed geocoding
          // Use the center of successfully geocoded waypoints, or default to Hong Kong
          let defaultLat = 22.3193; // Hong Kong default
          let defaultLng = 114.1694;

          if (waypointsWithCoords.length > 0) {
            defaultLat = waypointsWithCoords.reduce((sum, wp) => sum + wp.latitude!, 0) / waypointsWithCoords.length;
            defaultLng = waypointsWithCoords.reduce((sum, wp) => sum + wp.longitude!, 0) / waypointsWithCoords.length;
          }

          // Include ALL waypoints - those with coords and those needing positioning
          const allWaypoints = [
            ...waypointsWithCoords.map((wp, i) => ({
              id: `wp-${Date.now()}-${i}`,
              name: wp.name,
              latitude: wp.latitude!,
              longitude: wp.longitude!,
              type: (wp.type as 'start' | 'waypoint' | 'gate' | 'finish') || 'waypoint',
              required: wp.type === 'start' || wp.type === 'finish',
              needsPositioning: false,
            })),
            // Place failed geocoding waypoints at default position with offset so they don't stack
            ...waypointsWithoutCoords.map((wp, i) => ({
              id: `wp-${Date.now()}-needs-${i}`,
              name: wp.name,
              latitude: defaultLat + (i * 0.01), // Slight offset so they don't stack
              longitude: defaultLng + (i * 0.01),
              type: (wp.type as 'start' | 'waypoint' | 'gate' | 'finish') || 'waypoint',
              required: wp.type === 'start' || wp.type === 'finish',
              needsPositioning: true, // Flag for UI to show differently
            })),
          ];

          if (allWaypoints.length > 0) {
            updates.routeWaypoints = allWaypoints;
            aiFields.add('routeWaypoints');
          }
        } catch (err) {
          logger.warn('[AddRaceScreen] Failed to geocode waypoints:', err);
        }
      }

      // 4. Geocode PROHIBITED AREAS that don't have coordinates
      if (extractedDetails.prohibitedAreas && extractedDetails.prohibitedAreas.length > 0) {
        try {
          const areasToGeocode = extractedDetails.prohibitedAreas.map(area => ({
            name: area.name,
            description: area.description,
            latitude: undefined as number | undefined,
            longitude: undefined as number | undefined,
          }));

          const geocodedAreas = await geocodeExtractedLocations(areasToGeocode, regionHint);

          extractedDetails.prohibitedAreas = geocodedAreas.map((area, i) => ({
            name: area.name,
            description: extractedDetails.prohibitedAreas![i].description,
            coordinates: area.latitude && area.longitude
              ? [{ lat: area.latitude, lng: area.longitude }]
              : undefined,
          }));

          logger.debug('[AddRaceScreen] Geocoded prohibited areas:', geocodedAreas.filter(a => a.latitude).length);
        } catch (err) {
          logger.warn('[AddRaceScreen] Failed to geocode prohibited areas:', err);
        }
      }

      logger.debug('[AddRaceScreen] Geocoding phase complete');

      setForm(prev => ({
        ...prev,
        ...updates,
        aiExtractedFields: aiFields,
        extractionComplete: true,
        // Keep AI section expanded - don't auto-collapse after extraction
        extractedDetails,
      }));

      // Auto-show route map if any geocoded course elements exist
      const hasWaypoints = updates.routeWaypoints && updates.routeWaypoints.length > 0;
      const hasStartArea = extractedDetails.startAreaCoordinates?.lat && extractedDetails.startAreaCoordinates?.lng;
      const hasFinishArea = extractedDetails.finishAreaCoordinates?.lat && extractedDetails.finishAreaCoordinates?.lng;
      const hasProhibitedAreas = extractedDetails.prohibitedAreas?.some(a => a.coordinates?.[0]?.lat);

      if (hasWaypoints || hasStartArea || hasFinishArea || hasProhibitedAreas) {
        setShowRouteMap(true);
        logger.debug('[AddRaceScreen] Auto-showing route map:', {
          waypoints: updates.routeWaypoints?.length || 0,
          hasStartArea: !!hasStartArea,
          hasFinishArea: !!hasFinishArea,
          prohibitedAreas: extractedDetails.prohibitedAreas?.filter(a => a.coordinates?.[0]).length || 0,
        });
      }

      logger.debug('[AddRaceScreen] Extraction complete:', { fieldsExtracted: aiFields.size });
    } catch (err) {
      logger.error('[AddRaceScreen] Extraction failed:', err);
      Alert.alert('Extraction Failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsExtracting(false);
    }
  }, [form.aiInputMethod, form.aiInputText, form.aiSelectedFile, isExtracting]);

  // Handle file pick
  const handleFilePick = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setForm(prev => ({ ...prev, aiSelectedFile: result.assets[0] }));
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to select file');
    }
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
    if (form.raceType === 'match' && !form.opponentName.trim()) return false;
    if (form.raceType === 'team' && (!form.yourTeamName.trim() || !form.opponentTeamName.trim())) return false;
    return true;
  }, [form]);

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
      };

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
        race_type: form.raceType,
        vhf_channel: form.vhfChannel || null,
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
    router.canGoBack() ? router.back() : router.replace('/(tabs)/races');
  }, [router]);

  // Check if we can extract
  const canExtract = useMemo(() => {
    if (form.aiInputMethod === 'paste') return form.aiInputText.trim().length > 20;
    if (form.aiInputMethod === 'upload') return form.aiSelectedFile !== null;
    if (form.aiInputMethod === 'url') {
      const url = form.aiInputText.trim();
      // Accept URLs with http/https or starting with www.
      return url.startsWith('http') || url.startsWith('www.');
    }
    return false;
  }, [form.aiInputMethod, form.aiInputText, form.aiSelectedFile]);

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
          <Text style={styles.headerTitle}>Add Race</Text>
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
          {/* Race Suggestion Chips */}
          <RaceSuggestionChips
            suggestions={suggestions}
            loading={suggestionsLoading}
            onUseSuggestion={applySuggestion}
            onDismissSuggestion={handleDismissSuggestion}
            onSeeAll={() => setShowAllSuggestions(true)}
          />

          {/* Race Type Selector */}
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
            loading={suggestionsLoading}
            onSelectSuggestion={(suggestion) => {
              applySuggestion(suggestion);
              setShowAllSuggestions(false);
            }}
            onDismissSuggestion={handleDismissSuggestion}
          />
        </SafeAreaView>
      </Modal>

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
