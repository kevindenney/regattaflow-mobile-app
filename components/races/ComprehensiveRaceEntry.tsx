/**
 * Comprehensive Race Entry Component
 * Complete race strategy planning interface with AI-powered auto-suggest
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import {
  Calendar,
  Clock,
  MapPin,
  Radio,
  Flag,
  Navigation,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Plus,
  X,
  Upload,
  FileText,
} from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { ComprehensiveRaceExtractionAgent } from '@/services/agents/ComprehensiveRaceExtractionAgent';
import { PDFExtractionService } from '@/services/PDFExtractionService';
import { RaceWeatherService } from '@/services/RaceWeatherService';
import { BoatSelector } from './BoatSelector';
import { AIValidationScreen, type ExtractedData, type FieldConfidenceMap } from './AIValidationScreen';
import { VenueLocationPicker } from './VenueLocationPicker';
import TacticalRaceMap from '@/components/race-strategy/TacticalRaceMap';
import type { CourseMark, RaceEventWithDetails } from '@/types/raceEvents';

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
}

interface StartSequence {
  class: string;
  warning: string;
  start: string;
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

export function ComprehensiveRaceEntry({
  onSubmit,
  onCancel,
  existingRaceId,
}: ComprehensiveRaceEntryProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basic', 'timing'])
  );

  // AI Freeform Input
  const [freeformText, setFreeformText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [currentDocType, setCurrentDocType] = useState<'nor' | 'si' | 'other' | null>(null);

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

  // Track documents to upload after race creation
  const [pendingDocuments, setPendingDocuments] = useState<Array<{
    file: { uri: string; name: string; mimeType: string; size: number };
    docType: 'nor' | 'si' | 'other';
    extractedText: string;
  }>>([]);

  // Basic Information
  const [raceName, setRaceName] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [venue, setVenue] = useState('');
  const [venueCoordinates, setVenueCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [description, setDescription] = useState('');
  const [selectedBoatId, setSelectedBoatId] = useState<string | undefined>();

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
  const [courseSelectionCriteria, setCourseSelectionCriteria] = useState('');
  const [courseDiagramUrl, setCourseDiagramUrl] = useState('');

  // Racing Area Polygon (user-drawn boundary)
  const [racingAreaPolygon, setRacingAreaPolygon] = useState<[number, number][] | null>(null);
  const [showRacingAreaMap, setShowRacingAreaMap] = useState(false);

  // Race Rules & Penalties
  const [scoringSystem, setScoringSystem] = useState('Low Point');
  const [penaltySystem, setPenaltySystem] = useState('720°');
  const [penaltyDetails, setPenaltyDetails] = useState('');
  const [specialRules, setSpecialRules] = useState<string[]>([]);
  const [sailingInstructionsUrl, setSailingInstructionsUrl] = useState('');
  const [noticeOfRaceUrl, setNoticeOfRaceUrl] = useState('');

  // Class & Fleet
  const [classDivisions, setClassDivisions] = useState<ClassDivision[]>([{ name: '', fleet_size: 0 }]);
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

  // Load existing race data if in edit mode
  useEffect(() => {
    if (!existingRaceId) return;

    const loadRaceData = async () => {
      try {
        setLoading(true);
        console.log('[ComprehensiveRaceEntry] Loading race data for:', existingRaceId);

        const { data: race, error} = await supabase
          .from('regattas')
          .select('*')
          .eq('id', existingRaceId)
          .single();

        if (error) {
          console.error('[ComprehensiveRaceEntry] Error loading race:', error);
          Alert.alert('Error', 'Failed to load race data');
          return;
        }

        if (!race) {
          console.error('[ComprehensiveRaceEntry] Race not found');
          Alert.alert('Error', 'Race not found');
          return;
        }

        console.log('[ComprehensiveRaceEntry] Loaded race:', race);

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
        setSelectedBoatId(race.boat_id || undefined);

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

        // Populate rules & penalties (from top-level fields)
        if (race.scoring_system) setScoringSystem(race.scoring_system);
        if (race.penalty_system) setPenaltySystem(race.penalty_system);
        if (race.penalty_details) setPenaltyDetails(race.penalty_details);
        if (race.special_rules) setSpecialRules(race.special_rules);
        if (race.sailing_instructions_url) setSailingInstructionsUrl(race.sailing_instructions_url);
        if (race.notice_of_race_url) setNoticeOfRaceUrl(race.notice_of_race_url);

        // Populate class & fleet (from top-level fields)
        if (race.class_divisions) setClassDivisions(race.class_divisions);
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

        // IMPORTANT: Store original weather data to preserve historical forecasts
        if (race.metadata?.wind || race.metadata?.tide) {
          setOriginalWeatherData({
            wind: race.metadata.wind,
            tide: race.metadata.tide,
            weather_provider: race.metadata.weather_provider,
            weather_fetched_at: race.metadata.weather_fetched_at,
            weather_confidence: race.metadata.weather_confidence,
          });
          console.log('[ComprehensiveRaceEntry] Preserved original weather data:', {
            provider: race.metadata.weather_provider,
            fetched_at: race.metadata.weather_fetched_at,
          });
        }

        console.log('[ComprehensiveRaceEntry] Race data loaded successfully');
      } catch (err: any) {
        console.error('[ComprehensiveRaceEntry] Error loading race:', err);
        Alert.alert('Error', 'Failed to load race data');
      } finally {
        setLoading(false);
      }
    };

    loadRaceData();
  }, [existingRaceId]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

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
      console.log('=== FILE UPLOAD STARTED ===');
      console.log('[handleFileUpload] Document type:', docType);
      console.log('[handleFileUpload] Current user:', user?.id ? 'Authenticated' : 'NOT AUTHENTICATED');
      console.log('[handleFileUpload] User ID:', user?.id);
      console.log('[handleFileUpload] User email:', user?.email);
      console.log('[handleFileUpload] Platform:', Platform.OS);
      console.log('[handleFileUpload] Opening document picker...');

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

      console.log('[handleFileUpload] Document picker result:', JSON.stringify(result, null, 2));

      if (result.canceled) {
        console.log('[handleFileUpload] User cancelled');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        console.error('[handleFileUpload] No assets in result:', result);
        Alert.alert('Error', 'No file was selected');
        return;
      }

      console.log(`[handleFileUpload] Processing ${result.assets.length} file(s)...`);

      // Process each file
      for (const file of result.assets) {
        console.log('[handleFileUpload] Processing file:', file.name);

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
            console.log('[handleFileUpload] Reading plain text file...');
            documentText = await FileSystem.readAsStringAsync(file.uri);
            console.log('[handleFileUpload] Plain text read successfully:', documentText.length, 'characters');
          } else if (file.mimeType === 'application/pdf') {
            console.log('[handleFileUpload] Extracting PDF text...');
            const extractionResult = await PDFExtractionService.extractText(file.uri, {
              maxPages: 50,
            });

            if (extractionResult.success && extractionResult.text) {
              documentText = extractionResult.text;
              console.log('[handleFileUpload] PDF text extracted successfully:', documentText.length, 'characters');
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
          console.log('[handleFileUpload] Detected document type:', detectedType);

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

          console.log('[handleFileUpload] Document processed successfully:', file.name);
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
      console.log('[handleFileUpload] All files processed');
      console.log('=== FILE UPLOAD COMPLETED ===');
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

  const extractFromText = async (text: string) => {
    console.log('[extractFromText] Starting extraction...');
    console.log('[extractFromText] Text length:', text.length);

    if (!text.trim()) {
      console.log('[extractFromText] No text provided');
      Alert.alert('No Text', 'Please enter race information to extract');
      setExtracting(false);
      return;
    }

    let documentText = text;

    // Check if input is a URL
    const urlRegex = /^https?:\/\//i;
    if (urlRegex.test(text.trim())) {
      console.log('[extractFromText] Detected URL input:', text.trim());

      try {
        // Fetch PDF from URL
        console.log('[extractFromText] Fetching PDF from URL...');
        const response = await fetch(text.trim());

        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        console.log('[extractFromText] Content-Type:', contentType);

        if (!contentType?.includes('pdf')) {
          Alert.alert('Invalid File Type', `Expected a PDF but received ${contentType}. Please provide a URL to a PDF document.`);
          setExtracting(false);
          return;
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        console.log('[extractFromText] PDF downloaded, extracting text...');

        // Extract text from PDF
        const extractionResult = await PDFExtractionService.extractText(blobUrl, {
          maxPages: 50,
        });

        // Clean up blob URL
        URL.revokeObjectURL(blobUrl);

        if (!extractionResult.success || !extractionResult.text) {
          throw new Error(extractionResult.error || 'Failed to extract text from PDF');
        }

        documentText = extractionResult.text;
        console.log('[extractFromText] PDF text extracted successfully:', documentText.length, 'characters');

        // Update the text area with extracted content
        const urlFilename = text.trim().split('/').pop() || 'document.pdf';
        setFreeformText(`=== PDF FROM URL (${urlFilename}) ===\n\n${documentText}`);

      } catch (error: any) {
        console.error('[extractFromText] URL fetch/extraction error:', error);
        Alert.alert('PDF Fetch Failed', error.message || 'Could not fetch or extract PDF from URL. Please check the URL and try again.');
        setExtracting(false);
        return;
      }
    }

    try {
      console.log('[extractFromText] Creating agent...');
      const agent = new ComprehensiveRaceExtractionAgent();
      console.log('[extractFromText] Calling extractRaceDetails...');
      console.log('[extractFromText] Document length:', documentText.length, 'characters');

      const result = await agent.extractRaceDetails(documentText);
      console.log('[extractFromText] Result:', result);

      if (!result.success || !result.data) {
        console.error('[extractFromText] Extraction failed:', result.error);
        Alert.alert('Extraction Failed', result.error || 'Could not extract race details');
        setExtracting(false);
        return;
      }

      // Check if this is a partial extraction
      const isPartialExtraction = (result as any).partialExtraction;
      const missingFieldsMessage = (result as any).missingFields;

      if (isPartialExtraction) {
        console.log('[extractFromText] Partial extraction - some fields missing:', missingFieldsMessage);
      }

      const data = result.data;
      console.log('[extractFromText] Extracted', Object.keys(data).length, 'fields');

      // Phase 3: Show AI Validation Screen instead of auto-filling
      // Generate confidence scores for extracted fields
      const overallConfidence = result.confidence || 0.7;
      const confidenceScores: FieldConfidenceMap = {};

      Object.keys(data).forEach(key => {
        const value = data[key];
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
      });

      console.log('[extractFromText] Showing validation screen with', Object.keys(data).length, 'fields');

      // Store extracted data and confidence scores
      setExtractedDataForValidation(data);
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
    console.log('[handleExtractFromText] Button clicked!');
    setExtracting(true);
    await extractFromText(freeformText);
  };

  /**
   * Process multiple uploaded documents using Edge Function multi-document mode
   */
  const processMultipleDocuments = async () => {
    console.log('[processMultipleDocuments] Starting multi-document processing...');

    const completedDocs = uploadedDocuments.filter(doc => doc.status === 'complete' && doc.content);

    if (completedDocs.length === 0) {
      Alert.alert('No Documents', 'Please upload at least one document first');
      return;
    }

    if (completedDocs.length === 1) {
      // Single document mode - use existing extraction
      console.log('[processMultipleDocuments] Only one document, using single-document mode');
      setExtracting(true);
      await extractFromText(completedDocs[0].content!);
      return;
    }

    try {
      setExtracting(true);
      setAggregationStatus('processing');

      console.log(`[processMultipleDocuments] Processing ${completedDocs.length} documents...`);

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
      console.log('[processMultipleDocuments] Edge Function result:', result);

      // Extract aggregation metadata
      if (result.aggregation_metadata) {
        setAggregationMetadata(result.aggregation_metadata);
        setAggregationStatus('complete');
        console.log('[processMultipleDocuments] Aggregation metadata:', result.aggregation_metadata);
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
    console.log('=== VALIDATION CONFIRM CALLED ===');
    console.log('[handleValidationConfirm] Validated data keys:', Object.keys(validatedData));
    console.log('[handleValidationConfirm] Marks count:', validatedData.marks?.length || 0);
    console.log('[handleValidationConfirm] Marks data:', validatedData.marks);
    console.log('[handleValidationConfirm] Racing area:', validatedData.racingArea);

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

    // Communications
    if (validatedData.vhfChannel) setVhfChannel(validatedData.vhfChannel);
    if (validatedData.vhfBackupChannel) setVhfBackupChannel(validatedData.vhfBackupChannel);
    if (validatedData.safetyChannel) setSafetyChannel(validatedData.safetyChannel);
    if (validatedData.rcBoatName) setRcBoatName(validatedData.rcBoatName);
    if (validatedData.rcBoatPosition) setRcBoatPosition(validatedData.rcBoatPosition);
    if (validatedData.markBoats) setMarkBoats(validatedData.markBoats);
    if (validatedData.raceOfficer) setRaceOfficer(validatedData.raceOfficer);
    if (validatedData.protestCommittee) setProtestCommittee(validatedData.protestCommittee);

    // Course
    if (validatedData.startAreaName) setStartAreaName(validatedData.startAreaName);
    if (validatedData.startAreaDescription) setStartAreaDescription(validatedData.startAreaDescription);
    if (validatedData.startLineLength != null) setStartLineLength(validatedData.startLineLength.toString());
    if (validatedData.potentialCourses) setPotentialCourses(validatedData.potentialCourses);
    if (validatedData.courseSelectionCriteria) setCourseSelectionCriteria(validatedData.courseSelectionCriteria);
    if (validatedData.courseDiagramUrl) setCourseDiagramUrl(validatedData.courseDiagramUrl);

    // Rules
    if (validatedData.scoringSystem) setScoringSystem(validatedData.scoringSystem);
    if (validatedData.penaltySystem) setPenaltySystem(validatedData.penaltySystem);
    if (validatedData.penaltyDetails) setPenaltyDetails(validatedData.penaltyDetails);
    if (validatedData.specialRules) setSpecialRules(validatedData.specialRules);
    if (validatedData.sailingInstructionsUrl) setSailingInstructionsUrl(validatedData.sailingInstructionsUrl);
    if (validatedData.noticeOfRaceUrl) setNoticeOfRaceUrl(validatedData.noticeOfRaceUrl);

    // Fleet
    if (validatedData.classDivisions) setClassDivisions(validatedData.classDivisions);
    if (validatedData.expectedFleetSize != null) setExpectedFleetSize(validatedData.expectedFleetSize.toString());

    // Weather
    if (validatedData.expectedWindDirection != null) setExpectedWindDirection(validatedData.expectedWindDirection.toString());
    if (validatedData.expectedWindSpeedMin != null) setExpectedWindSpeedMin(validatedData.expectedWindSpeedMin.toString());
    if (validatedData.expectedWindSpeedMax != null) setExpectedWindSpeedMax(validatedData.expectedWindSpeedMax.toString());
    if (validatedData.expectedConditions) setExpectedConditions(validatedData.expectedConditions);
    if (validatedData.tideAtStart) setTideAtStart(validatedData.tideAtStart);

    // Tactical
    if (validatedData.venueSpecificNotes) setVenueSpecificNotes(validatedData.venueSpecificNotes);
    if (validatedData.favoredSide) setFavoredSide(validatedData.favoredSide);
    if (validatedData.laylineStrategy) setLaylineStrategy(validatedData.laylineStrategy);
    if (validatedData.startStrategy) setStartStrategy(validatedData.startStrategy);

    // Registration
    if (validatedData.registrationDeadline) setRegistrationDeadline(validatedData.registrationDeadline);
    if (validatedData.entryFeeAmount != null) setEntryFeeAmount(validatedData.entryFeeAmount.toString());
    if (validatedData.entryFeeCurrency) setEntryFeeCurrency(validatedData.entryFeeCurrency);
    if (validatedData.checkInTime) setCheckInTime(validatedData.checkInTime);
    if (validatedData.skipperBriefingTime) setSkipperBriefingTime(validatedData.skipperBriefingTime);

    // Expand all sections so user can see extracted data
    setExpandedSections(new Set(['basic', 'timing', 'comms', 'course', 'rules', 'fleet', 'weather', 'tactical', 'logistics']));

    // Hide validation screen (but keep extractedDataForValidation for mark saving!)
    setShowValidationScreen(false);
    // DON'T clear extractedDataForValidation - we need it to save marks!
    // setExtractedDataForValidation(null);
    console.log('[handleValidationConfirm] extractedDataForValidation state after confirm:', extractedDataForValidation);
    console.log('[handleValidationConfirm] Marks still in state:', extractedDataForValidation?.marks?.length || 0);

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
    console.log('[handleValidationCancel] User cancelled validation');
    setShowValidationScreen(false);
    setExtractedDataForValidation(null);
    setConfidenceScoresForValidation({});
  };

  /**
   * Handle racing area polygon selection from map
   */
  const handleRacingAreaSelected = (coordinates: [number, number][]) => {
    setRacingAreaPolygon(coordinates);
    console.log('✅ Racing area polygon captured:', coordinates.length, 'points');
  };

  /**
   * Upload pending documents to Supabase Storage and create database records
   */
  const uploadPendingDocuments = async (regattaId: string) => {
    if (pendingDocuments.length === 0) {
      console.log('[uploadPendingDocuments] No documents to upload');
      return;
    }

    console.log(`[uploadPendingDocuments] Uploading ${pendingDocuments.length} documents for regatta ${regattaId}`);

    for (const doc of pendingDocuments) {
      try {
        console.log('[uploadPendingDocuments] Processing:', doc.file.name);

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

        console.log('[uploadPendingDocuments] Uploading to storage:', storagePath);

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

        console.log('[uploadPendingDocuments] Upload successful:', uploadData);

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

        console.log('[uploadPendingDocuments] Creating document record:', documentRecord.filename);

        const { error: dbError } = await supabase
          .from('documents')
          .insert(documentRecord);

        if (dbError) {
          console.error('[uploadPendingDocuments] Database insert error:', dbError);
          throw dbError;
        }

        console.log('[uploadPendingDocuments] Document record created successfully');
      } catch (error: any) {
        console.error('[uploadPendingDocuments] Error uploading document:', doc.file.name, error);
        // Continue with other documents even if one fails
        Alert.alert(
          'Document Upload Warning',
          `Failed to upload "${doc.file.name}": ${error.message}. Other documents may have been uploaded successfully.`
        );
      }
    }

    console.log('[uploadPendingDocuments] All documents processed');
  };

  const handleSubmit = async () => {
    console.log('=== HANDLESUBMIT CALLED ===');
    console.log('[handleSubmit] raceName:', raceName);
    console.log('[handleSubmit] raceDate:', raceDate);
    console.log('[handleSubmit] venue:', venue);
    console.log('[handleSubmit] saving state:', saving);

    // Validation
    if (!raceName.trim()) {
      console.log('[handleSubmit] VALIDATION FAILED: No race name');
      Alert.alert('Required', 'Please enter a race name');
      return;
    }
    if (!raceDate) {
      console.log('[handleSubmit] VALIDATION FAILED: No race date');
      Alert.alert('Required', 'Please enter a race date');
      return;
    }
    if (!venue.trim()) {
      console.log('[handleSubmit] VALIDATION FAILED: No venue');
      Alert.alert('Required', 'Please enter a venue');
      return;
    }

    console.log('[handleSubmit] Validation passed, setting saving=true');
    setSaving(true);

    try {
      console.log('[handleSubmit] Starting try block...');

      // Use user from AuthProvider hook (already authenticated)
      console.log('[handleSubmit] Checking authenticated user...');

      if (!user?.id) {
        console.error('[handleSubmit] No user found in AuthProvider');
        Alert.alert('Authentication Error', 'You must be logged in to create a race. Please log in and try again.');
        setSaving(false);
        return;
      }

      console.log('[handleSubmit] ✅ Authenticated user ID:', user.id);
      console.log('[handleSubmit] User email:', user.email);

      // Weather data handling:
      // - Edit mode: Preserve original weather data (historical forecast)
      // - Create mode: Fetch fresh weather data
      let weatherData = null;

      if (existingRaceId && originalWeatherData) {
        // Editing existing race - preserve original weather data
        console.log('[handleSubmit] Edit mode: Preserving original weather data');
        console.log('[handleSubmit] Original weather provider:', originalWeatherData.weather_provider);
        weatherData = {
          wind: originalWeatherData.wind,
          tide: originalWeatherData.tide,
          provider: originalWeatherData.weather_provider,
          fetchedAt: originalWeatherData.weather_fetched_at,
          confidence: originalWeatherData.weather_confidence,
        };
      } else {
        // Creating new race - fetch fresh weather data
        console.log('[handleSubmit] Create mode: Fetching weather data for race...');
        weatherData = venueCoordinates
          ? await RaceWeatherService.fetchWeatherByCoordinates(
              venueCoordinates.lat,
              venueCoordinates.lng,
              raceDate,
              venue.trim()
            )
          : await RaceWeatherService.fetchWeatherByVenueName(
              venue.trim(),
              raceDate
            );
        console.log('[handleSubmit] Weather data:', weatherData);
      }

      const raceData = {
        created_by: user.id,
        name: raceName.trim(),
        start_date: raceDate,
        description: description.trim() || null,
        boat_id: selectedBoatId || null,
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

        // Rules & Penalties
        scoring_system: scoringSystem || 'Low Point',
        penalty_system: penaltySystem || '720°',
        penalty_details: penaltyDetails.trim() || null,
        special_rules: specialRules.length > 0 ? specialRules : null,
        sailing_instructions_url: sailingInstructionsUrl.trim() || null,
        notice_of_race_url: noticeOfRaceUrl.trim() || null,

        // Fleet
        class_divisions: classDivisions.filter((d) => d.name.trim()).length > 0 ? classDivisions : null,
        expected_fleet_size: expectedFleetSize ? parseInt(expectedFleetSize) : null,

        // Weather
        expected_wind_direction: expectedWindDirection ? parseInt(expectedWindDirection) : null,
        expected_wind_speed_min: expectedWindSpeedMin ? parseInt(expectedWindSpeedMin) : null,
        expected_wind_speed_max: expectedWindSpeedMax ? parseInt(expectedWindSpeedMax) : null,
        expected_conditions: expectedConditions.trim() || null,
        tide_at_start: tideAtStart.trim() || null,

        // Tactical
        venue_specific_notes: venueSpecificNotes.trim() || null,
        favored_side: favoredSide || null,
        layline_strategy: laylineStrategy || null,
        start_strategy: startStrategy || null,

        // Registration
        registration_deadline: registrationDeadline || null,
        entry_fee_amount: entryFeeAmount ? parseFloat(entryFeeAmount) : null,
        entry_fee_currency: entryFeeCurrency || 'USD',
        check_in_time: checkInTime || null,
        skipper_briefing_time: skipperBriefingTime || null,

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
          console.log('[handleSubmit] Uploading pending documents for existing race...');
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
        console.log('[handleSubmit] ===== CREATING NEW RACE =====');
        console.log('[handleSubmit] Authenticated user ID:', user.id);
        console.log('[handleSubmit] Race data keys:', Object.keys(raceData));
        console.log('[handleSubmit] Race data preview:', {
          created_by: raceData.created_by,
          name: raceData.name,
          start_date: raceData.start_date,
          status: raceData.status
        });

        console.log('[handleSubmit] Calling supabase.from("regattas").insert()...');
        const { data, error } = await supabase
          .from('regattas')
          .insert(raceData)
          .select('id')
          .single();

        console.log('[handleSubmit] ===== INSERT COMPLETE =====');
        console.log('[handleSubmit] Insert returned data:', data);
        console.log('[handleSubmit] Insert returned error:', error);

        if (error) {
          console.error('[handleSubmit] Race creation error:', error);
          throw error;
        }

        console.log('[handleSubmit] ===== RACE CREATED SUCCESSFULLY =====');
        console.log('[handleSubmit] Race ID:', data.id);
        console.log('[handleSubmit] Race ID type:', typeof data?.id);
        console.log('[handleSubmit] Race ID length:', data?.id?.length);

        // Create a race_event for this regatta (needed for marks storage)
        // race_events are individual races within a regatta
        let raceEventId: string | null = null;

        if (extractedDataForValidation?.marks || extractedDataForValidation?.racingArea) {
          console.log('[handleSubmit] Creating race_event for marks storage...');

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
            console.log('[handleSubmit] Race event created:', raceEventId);
          }
        }

        // Save extracted marks to database (if any)
        if (raceEventId && extractedDataForValidation?.marks && extractedDataForValidation.marks.length > 0) {
          console.log('[handleSubmit] Saving', extractedDataForValidation.marks.length, 'extracted marks to database...');

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
            console.log('[handleSubmit] Marks saved successfully');
          }
        }

        // Save racing area to database (if any)
        // Priority 1: User-drawn polygon from map
        // Priority 2: Extracted racing area from AI
        if (raceEventId && (racingAreaPolygon || extractedDataForValidation?.racingArea)) {
          console.log('[handleSubmit] Saving racing area to database...');

          let racingAreaData: any = {
            race_id: raceEventId,
            area_type: 'racing',
            description: `Racing area for ${raceName}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Use user-drawn polygon if available
          if (racingAreaPolygon && racingAreaPolygon.length >= 3) {
            console.log('[handleSubmit] Using user-drawn racing area polygon:', racingAreaPolygon.length, 'points');

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
            console.log('[handleSubmit] Using AI-extracted racing area bounds');

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
            console.log('[handleSubmit] Racing area saved successfully');
          }
        }

        // Upload any pending documents
        if (pendingDocuments.length > 0) {
          console.log('[handleSubmit] Uploading', pendingDocuments.length, 'pending documents...');
          await uploadPendingDocuments(data.id);
          console.log('[handleSubmit] Document upload complete');
        }

        console.log('[handleSubmit] All operations complete, showing success alert...');

        if (Platform.OS === 'web') {
          // Web: Use window.alert for immediate feedback
          window.alert('Race created successfully!');
        } else {
          // Mobile: Use React Native Alert
          Alert.alert('Success', 'Race created successfully!');
        }

        console.log('[handleSubmit] Alert shown, preparing to navigate...');

        // Small delay to ensure database transaction is committed
        await new Promise(resolve => setTimeout(resolve, 300));

        // Prepare extraction metadata for CourseSetupPrompt
        const extractionMetadata: ExtractionMetadata = {
          raceName: raceName || data.name,
          racingAreaName: startAreaName || undefined,
          extractedMarks: extractedDataForValidation?.marks || undefined,
          venueId: undefined, // Will be populated from venue lookup if needed
        };

        console.log('[handleSubmit] ===== CALLING ONSUBMIT CALLBACK =====');
        console.log('[handleSubmit] Regatta ID:', data.id);
        console.log('[handleSubmit] Race Event ID:', raceEventId);
        console.log('[handleSubmit] Extraction metadata:', extractionMetadata);

        try {
          if (onSubmit) {
            // Pass regatta ID (race detail screen expects this)
            // Race detail screen will look up associated race_event to load marks
            console.log('[handleSubmit] Passing regatta ID:', data.id);
            onSubmit(data.id, extractionMetadata);
            console.log('[handleSubmit] onSubmit callback completed');
          } else {
            console.log('[handleSubmit] No onSubmit callback provided');
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
      console.log('[handleSubmit] Finally block - setting saving=false');
      setSaving(false);
    }
  };

  const addStartSequence = () => {
    setStartSequence([...startSequence, { class: '', warning: '', start: '' }]);
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

  const renderSectionHeader = (
    title: string,
    icon: React.ReactNode,
    sectionKey: string,
    required = false
  ) => (
    <Pressable
      onPress={() => toggleSection(sectionKey)}
      className="flex-row items-center justify-between bg-sky-50 px-4 py-3 rounded-lg mb-2"
    >
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-base font-semibold text-gray-900">
          {title}
          {required && <Text className="text-red-500"> *</Text>}
        </Text>
      </View>
      <ChevronDown
        size={20}
        color="#64748B"
        style={{
          transform: [{ rotate: expandedSections.has(sectionKey) ? '180deg' : '0deg' }],
        }}
      />
    </Pressable>
  );

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

  // Phase 3: Show validation screen if active
  if (showValidationScreen && extractedDataForValidation) {
    return (
      <AIValidationScreen
        extractedData={extractedDataForValidation}
        confidenceScores={confidenceScoresForValidation}
        onConfirm={handleValidationConfirm}
        onCancel={handleValidationCancel}
      />
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-sky-600 pt-12 pb-6 px-4">
        <Text className="text-white text-2xl font-bold">
          {existingRaceId ? 'Edit' : 'Add'} Race
        </Text>
        <Text className="text-white/90 text-sm mt-1">
          Complete race strategy planning
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        {/* AI Freeform Text Input */}
        <View className="bg-gradient-to-r from-purple-50 to-sky-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Sparkles size={20} color="#9333ea" />
            <Text className="text-lg font-bold text-purple-900">
              AI Quick Entry
            </Text>
          </View>
          <Text className="text-sm text-purple-800 mb-2">
            Upload PDF/document, paste a PDF URL, or paste text. AI will automatically extract and fill all fields below.
          </Text>
          <View className="bg-purple-100 rounded-lg p-3 mb-3">
            <View className="flex-row items-start gap-2">
              <AlertCircle size={16} color="#7c3aed" style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-xs font-semibold text-purple-900 mb-1">
                  What AI Extracts
                </Text>
                <Text className="text-xs text-purple-800">
                  AI will find: race name, date, time, venue, class, and course details. {'\n'}
                  Note: Most clubs don't publish GPS coordinates—you'll add course marks in the Strategy tab.
                </Text>
              </View>
            </View>
          </View>

          {/* Upload Buttons - Supports Multiple Files */}
          <View className="flex-row gap-2 mb-3">
            {/* Upload Documents Button (All Types) */}
            <Pressable
              onPress={() => handleFileUpload('other')}
              disabled={extracting}
              className={`flex-1 items-center py-3 px-2 rounded-lg border-2 ${
                extracting && currentDocType === 'other'
                  ? 'bg-purple-100 border-purple-400'
                  : 'bg-white border-purple-300'
              }`}
            >
              {extracting && currentDocType === 'other' ? (
                <ActivityIndicator color="#9333ea" size="small" />
              ) : (
                <Upload size={24} color="#9333ea" />
              )}
              <Text className="text-purple-700 font-semibold text-xs mt-1 text-center">
                Upload Documents
              </Text>
              <Text className="text-purple-600 text-[10px] mt-0.5 text-center">
                (Select multiple)
              </Text>
            </Pressable>
          </View>

          {/* Info about multi-document support */}
          <View className="bg-purple-50 rounded-lg p-2 mb-3">
            <Text className="text-xs text-purple-800 text-center">
              💡 Select multiple documents at once! AI will automatically detect document types (NOR, SI, Appendix, etc.) and combine information.
            </Text>
          </View>

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
              console.log('[ComprehensiveRaceEntry] Text changed, length:', text.length);
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
              console.log('[ComprehensiveRaceEntry] Extract button clicked!');
              console.log('[ComprehensiveRaceEntry] freeformText length:', freeformText.length);
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
              placeholder: 'e.g., Hong Kong Dragon Championship 2025',
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

            {/* Show Map & Define Racing Area Button */}
            <Pressable
              onPress={() => setShowRacingAreaMap(!showRacingAreaMap)}
              className="flex-row items-center justify-between p-3 bg-sky-50 border border-sky-200 rounded-lg mb-4"
            >
              <View className="flex-row items-center gap-2">
                <MapPin size={18} color="#0284c7" />
                <Text className="text-sm font-semibold text-sky-700">
                  {showRacingAreaMap ? 'Hide' : 'Show'} Map & Define Racing Area
                </Text>
              </View>
              <ChevronDown
                size={18}
                color="#0284c7"
                style={{
                  transform: [{ rotate: showRacingAreaMap ? '180deg' : '0deg' }],
                }}
              />
            </Pressable>

            {/* Racing Area Map - Show when toggled */}
            {showRacingAreaMap && (
              <View className="mb-4">
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
              <View key={idx} className="flex-row gap-2 mb-2">
                <TextInput
                  value={seq.class}
                  onChangeText={(text) => {
                    const newSeq = [...startSequence];
                    newSeq[idx].class = text;
                    setStartSequence(newSeq);
                  }}
                  placeholder="Class"
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <TextInput
                  value={seq.warning}
                  onChangeText={(text) => {
                    const newSeq = [...startSequence];
                    newSeq[idx].warning = text;
                    setStartSequence(newSeq);
                  }}
                  placeholder="Warning"
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <TextInput
                  value={seq.start}
                  onChangeText={(text) => {
                    const newSeq = [...startSequence];
                    newSeq[idx].start = text;
                    setStartSequence(newSeq);
                  }}
                  placeholder="Start"
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <Pressable onPress={() => removeStartSequence(idx)} className="justify-center">
                  <X size={20} color="#DC2626" />
                </Pressable>
              </View>
            ))}
            <Pressable onPress={addStartSequence} className="flex-row items-center gap-2 mt-2">
              <Plus size={16} color="#0284c7" />
              <Text className="text-sm font-semibold text-sky-600">Add Start</Text>
            </Pressable>
          </View>
        )}

        {/* Communications & Race Control */}
        {renderSectionHeader('Communications & Control', <Radio size={20} color="#0284c7" />, 'comms')}
        {expandedSections.has('comms') && (
          <View className="mb-4">
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
            {renderInputField('Start Area Name', startAreaName, setStartAreaName, {
              placeholder: 'Starting Area A',
            })}
            {renderInputField('Start Area Description', startAreaDescription, setStartAreaDescription, {
              placeholder: 'Detailed location description',
              multiline: true,
            })}
            {renderInputField('Start Line Length (m)', startLineLength, setStartLineLength, {
              keyboardType: 'numeric',
              placeholder: '100',
            })}
            {renderInputField('Course Selection Criteria', courseSelectionCriteria, setCourseSelectionCriteria, {
              placeholder: 'Based on wind direction and strength',
              multiline: true,
            })}
            {renderInputField('Course Diagram URL', courseDiagramUrl, setCourseDiagramUrl, {
              placeholder: 'https://...',
            })}
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
          </View>
        )}

        {/* Weather & Conditions */}
        {renderSectionHeader('Weather & Conditions', <AlertCircle size={20} color="#0284c7" />, 'weather')}
        {expandedSections.has('weather') && (
          <View className="mb-4">
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                {renderInputField('Wind Dir (°)', expectedWindDirection, setExpectedWindDirection, {
                  keyboardType: 'numeric',
                  placeholder: '180',
                })}
              </View>
              <View className="flex-1">
                {renderInputField('Wind Min (kts)', expectedWindSpeedMin, setExpectedWindSpeedMin, {
                  keyboardType: 'numeric',
                  placeholder: '8',
                })}
              </View>
              <View className="flex-1">
                {renderInputField('Wind Max (kts)', expectedWindSpeedMax, setExpectedWindSpeedMax, {
                  keyboardType: 'numeric',
                  placeholder: '12',
                })}
              </View>
            </View>

            {renderInputField('Expected Conditions', expectedConditions, setExpectedConditions, {
              placeholder: 'Light air, Moderate breeze, Strong winds',
            })}
            {renderInputField('Tide at Start', tideAtStart, setTideAtStart, {
              placeholder: 'High tide +2:30',
            })}
          </View>
        )}

        {/* Tactical & Strategic Notes */}
        {renderSectionHeader('Tactical Strategy', <Sparkles size={20} color="#0284c7" />, 'tactical')}
        {expandedSections.has('tactical') && (
          <View className="mb-4">
            {renderInputField('Venue-Specific Notes', venueSpecificNotes, setVenueSpecificNotes, {
              placeholder: 'Local knowledge, venue tactics...',
              multiline: true,
            })}

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                {renderInputField('Favored Side', favoredSide, setFavoredSide, {
                  placeholder: 'Left/Right/Middle',
                })}
              </View>
              <View className="flex-1">
                {renderInputField('Start Strategy', startStrategy, setStartStrategy, {
                  placeholder: 'Pin/Boat/Middle',
                })}
              </View>
            </View>

            {renderInputField('Layline Strategy', laylineStrategy, setLaylineStrategy, {
              placeholder: 'Conservative, Aggressive, Middle third',
            })}
          </View>
        )}

        {/* Registration & Logistics */}
        {renderSectionHeader('Registration & Logistics', <Calendar size={20} color="#0284c7" />, 'logistics')}
        {expandedSections.has('logistics') && (
          <View className="mb-4">
            {renderInputField('Registration Deadline', registrationDeadline, setRegistrationDeadline, {
              placeholder: 'YYYY-MM-DD HH:MM',
            })}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-[2]">
                {renderInputField('Entry Fee', entryFeeAmount, setEntryFeeAmount, {
                  keyboardType: 'numeric',
                  placeholder: '100',
                })}
              </View>
              <View className="flex-1">
                {renderInputField('Currency', entryFeeCurrency, setEntryFeeCurrency, {
                  placeholder: 'USD',
                })}
              </View>
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                {renderInputField('Check-in Time', checkInTime, setCheckInTime, {
                  placeholder: '08:00',
                })}
              </View>
              <View className="flex-1">
                {renderInputField('Briefing Time', skipperBriefingTime, setSkipperBriefingTime, {
                  placeholder: '09:00',
                })}
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-6 mb-8">
          {onCancel && (
            <Pressable
              onPress={onCancel}
              className="flex-1 bg-gray-300 py-4 rounded-xl items-center justify-center"
            >
              <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => {
              console.log('=== CREATE RACE BUTTON PRESSED ===');
              console.log('[Button] disabled:', saving);
              console.log('[Button] Calling handleSubmit...');
              handleSubmit();
            }}
            disabled={saving}
            className={`flex-1 py-4 rounded-xl items-center justify-center ${
              saving ? 'bg-gray-400' : 'bg-sky-600'
            }`}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {existingRaceId ? 'Update Race' : 'Create Race'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
