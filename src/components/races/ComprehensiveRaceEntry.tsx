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
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/services/supabase';
import { ComprehensiveRaceExtractionAgent } from '@/src/services/agents/ComprehensiveRaceExtractionAgent';
import { PDFExtractionService } from '@/src/services/PDFExtractionService';

interface ComprehensiveRaceEntryProps {
  onSubmit?: (raceId: string) => void;
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
  const [description, setDescription] = useState('');

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

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
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

      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'image/*'],
        copyToCacheDirectory: true,
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

      const file = result.assets[0];
      console.log('[handleFileUpload] File selected:', {
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        uri: file.uri,
      });
      setUploadedFileName(file.name);
      setExtracting(true);
      console.log('[handleFileUpload] Set extracting=true, uploadedFileName=', file.name);

      let documentText = '';

      // Extract text based on file type
      if (file.mimeType === 'text/plain') {
        console.log('[handleFileUpload] Reading plain text file...');
        try {
          documentText = await FileSystem.readAsStringAsync(file.uri);
          console.log('[handleFileUpload] Plain text read successfully:', documentText.length, 'characters');
        } catch (readError: any) {
          console.error('[handleFileUpload] Error reading text file:', readError);
          setExtracting(false);
          Alert.alert('Read Error', `Failed to read text file: ${readError.message}`);
          return;
        }
      } else if (file.mimeType === 'application/pdf') {
        console.log('[handleFileUpload] Extracting PDF text...');
        console.log('[handleFileUpload] Calling PDFExtractionService.extractText...');

        try {
          const extractionResult = await PDFExtractionService.extractText(file.uri, {
            maxPages: 50,
          });

          console.log('[handleFileUpload] PDFExtractionService result:', {
            success: extractionResult.success,
            textLength: extractionResult.text?.length,
            pages: extractionResult.pages,
            error: extractionResult.error,
          });

          if (extractionResult.success && extractionResult.text) {
            documentText = extractionResult.text;
            console.log('[handleFileUpload] PDF text extracted successfully:', documentText.length, 'characters');
            console.log('[handleFileUpload] First 200 chars:', documentText.substring(0, 200));
          } else {
            console.error('[handleFileUpload] PDF extraction failed:', extractionResult.error);
            setExtracting(false);
            Alert.alert(
              'PDF Extraction Failed',
              extractionResult.error || 'Could not extract text from PDF. Please try a text file or paste the content manually.'
            );
            return;
          }
        } catch (pdfError: any) {
          console.error('[handleFileUpload] PDF extraction exception:', pdfError);
          setExtracting(false);
          Alert.alert('PDF Error', `Failed to extract PDF: ${pdfError.message}`);
          return;
        }
      } else if (file.mimeType?.startsWith('image/')) {
        console.log('[handleFileUpload] Image file detected:', file.mimeType);
        setExtracting(false);
        Alert.alert(
          'Image OCR Not Yet Supported',
          'Image OCR is coming soon. For now, please upload a PDF or text file, or paste the content manually.'
        );
        return;
      } else {
        console.warn('[handleFileUpload] Unsupported file type:', file.mimeType);
        setExtracting(false);
        Alert.alert('Unsupported File', `File type "${file.mimeType}" is not supported. Please upload a PDF or text file.`);
        return;
      }

      // Now append document text with label
      console.log('[handleFileUpload] Document text extracted successfully, length:', documentText.length);
      console.log('[handleFileUpload] Appending to freeformText state...');

      const docTypeLabels = {
        nor: 'NOTICE OF RACE',
        si: 'SAILING INSTRUCTIONS',
        other: 'OTHER DOCUMENT'
      };

      const separator = freeformText.trim() ? '\n\n---\n\n' : '';
      const labeledText = `${separator}=== ${docTypeLabels[docType]} (${file.name}) ===\n\n${documentText}`;

      setFreeformText(prevText => prevText + labeledText);

      // Store document for upload after race creation
      setPendingDocuments(prev => [...prev, {
        file: {
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType || 'application/octet-stream',
          size: file.size || 0
        },
        docType,
        extractedText: documentText
      }]);

      setCurrentDocType(null);
      setExtracting(false); // Reset extracting state
      setUploadedFileName(''); // Reset filename
      console.log('[handleFileUpload] Text appended and document queued for upload');
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
      const result = await agent.extractRaceDetails(documentText);
      console.log('[extractFromText] Result:', result);

      if (!result.success || !result.data) {
        Alert.alert('Extraction Failed', result.error || 'Could not extract race details');
        setExtracting(false);
        return;
      }

      const data = result.data;
      console.log('[extractFromText] Extracted', Object.keys(data).length, 'fields');

      // Auto-fill all extracted fields
      if (data.raceName) setRaceName(data.raceName);
      if (data.raceDate) setRaceDate(data.raceDate);
      if (data.venue) setVenue(data.venue);
      if (data.description) setDescription(data.description);

      // Timing & Sequence
      if (data.warningSignalTime) setWarningSignalTime(data.warningSignalTime);
      if (data.warningSignalType) setWarningSignalType(data.warningSignalType);
      if (data.preparatoryMinutes) setPreparatoryMinutes(data.preparatoryMinutes.toString());
      if (data.classIntervalMinutes) setClassIntervalMinutes(data.classIntervalMinutes.toString());
      if (data.totalStarts) setTotalStarts(data.totalStarts.toString());
      if (data.startSequence) setStartSequence(data.startSequence);
      if (data.plannedFinishTime) setPlannedFinishTime(data.plannedFinishTime);
      if (data.timeLimitMinutes) setTimeLimitMinutes(data.timeLimitMinutes.toString());

      // Communications
      if (data.vhfChannel) setVhfChannel(data.vhfChannel);
      if (data.vhfBackupChannel) setVhfBackupChannel(data.vhfBackupChannel);
      if (data.safetyChannel) setSafetyChannel(data.safetyChannel);
      if (data.rcBoatName) setRcBoatName(data.rcBoatName);
      if (data.rcBoatPosition) setRcBoatPosition(data.rcBoatPosition);
      if (data.markBoats) setMarkBoats(data.markBoats);
      if (data.raceOfficer) setRaceOfficer(data.raceOfficer);
      if (data.protestCommittee) setProtestCommittee(data.protestCommittee);

      // Course
      if (data.startAreaName) setStartAreaName(data.startAreaName);
      if (data.startAreaDescription) setStartAreaDescription(data.startAreaDescription);
      if (data.startLineLength) setStartLineLength(data.startLineLength.toString());
      if (data.potentialCourses) setPotentialCourses(data.potentialCourses);
      if (data.courseSelectionCriteria) setCourseSelectionCriteria(data.courseSelectionCriteria);
      if (data.courseDiagramUrl) setCourseDiagramUrl(data.courseDiagramUrl);

      // Rules
      if (data.scoringSystem) setScoringSystem(data.scoringSystem);
      if (data.penaltySystem) setPenaltySystem(data.penaltySystem);
      if (data.penaltyDetails) setPenaltyDetails(data.penaltyDetails);
      if (data.specialRules) setSpecialRules(data.specialRules);
      if (data.sailingInstructionsUrl) setSailingInstructionsUrl(data.sailingInstructionsUrl);
      if (data.noticeOfRaceUrl) setNoticeOfRaceUrl(data.noticeOfRaceUrl);

      // Fleet
      if (data.classDivisions) setClassDivisions(data.classDivisions);
      if (data.expectedFleetSize) setExpectedFleetSize(data.expectedFleetSize.toString());

      // Weather
      if (data.expectedWindDirection) setExpectedWindDirection(data.expectedWindDirection.toString());
      if (data.expectedWindSpeedMin) setExpectedWindSpeedMin(data.expectedWindSpeedMin.toString());
      if (data.expectedWindSpeedMax) setExpectedWindSpeedMax(data.expectedWindSpeedMax.toString());
      if (data.expectedConditions) setExpectedConditions(data.expectedConditions);
      if (data.tideAtStart) setTideAtStart(data.tideAtStart);

      // Tactical
      if (data.venueSpecificNotes) setVenueSpecificNotes(data.venueSpecificNotes);
      if (data.favoredSide) setFavoredSide(data.favoredSide);
      if (data.laylineStrategy) setLaylineStrategy(data.laylineStrategy);
      if (data.startStrategy) setStartStrategy(data.startStrategy);

      // Registration
      if (data.registrationDeadline) setRegistrationDeadline(data.registrationDeadline);
      if (data.entryFeeAmount) setEntryFeeAmount(data.entryFeeAmount.toString());
      if (data.entryFeeCurrency) setEntryFeeCurrency(data.entryFeeCurrency);
      if (data.checkInTime) setCheckInTime(data.checkInTime);
      if (data.skipperBriefingTime) setSkipperBriefingTime(data.skipperBriefingTime);

      // Expand all sections so user can see extracted data
      setExpandedSections(new Set(['basic', 'timing', 'comms', 'course', 'rules', 'fleet', 'weather', 'tactical', 'logistics']));

      const successMessage = uploadedFileName
        ? `Extracted ${Object.keys(data).length} fields from "${uploadedFileName}" with ${Math.round((result.confidence || 0) * 100)}% confidence.`
        : `Extracted ${Object.keys(data).length} fields with ${Math.round((result.confidence || 0) * 100)}% confidence.`;

      Alert.alert('Success!', `${successMessage} Review and edit as needed.`, [{ text: 'OK' }]);

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
    // Validation
    if (!raceName.trim()) {
      Alert.alert('Required', 'Please enter a race name');
      return;
    }
    if (!raceDate) {
      Alert.alert('Required', 'Please enter a race date');
      return;
    }
    if (!venue.trim()) {
      Alert.alert('Required', 'Please enter a venue');
      return;
    }

    setSaving(true);

    try {
      const raceData = {
        created_by: user?.id,
        name: raceName.trim(),
        start_date: raceDate,
        description: description.trim() || null,
        metadata: {
          venue_name: venue.trim(),
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
        onSubmit?.(existingRaceId);
      } else {
        // Create new race
        console.log('[handleSubmit] Creating new race...');
        const { data, error } = await supabase
          .from('regattas')
          .insert(raceData)
          .select('id')
          .single();

        if (error) {
          console.error('[handleSubmit] Race creation error:', error);
          throw error;
        }

        console.log('[handleSubmit] Race created successfully with ID:', data.id);

        // Upload any pending documents
        if (pendingDocuments.length > 0) {
          console.log('[handleSubmit] Uploading', pendingDocuments.length, 'pending documents...');
          await uploadPendingDocuments(data.id);
          console.log('[handleSubmit] Document upload complete');
        }

        Alert.alert('Success', 'Race created successfully!');

        // Small delay to ensure database transaction is committed
        await new Promise(resolve => setTimeout(resolve, 300));

        console.log('[handleSubmit] Navigating to race detail:', data.id);
        onSubmit?.(data.id);
      }
    } catch (error: any) {
      console.error('Error saving race:', error);
      Alert.alert('Error', error.message || 'Failed to save race');
    } finally {
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
          <Text className="text-sm text-purple-800 mb-3">
            Upload PDF/document, paste a PDF URL, or paste text. AI will automatically extract and fill all fields below.
          </Text>

          {/* Three Upload Buttons */}
          <View className="flex-row gap-2 mb-3">
            {/* Notice of Race */}
            <Pressable
              onPress={() => handleFileUpload('nor')}
              disabled={extracting}
              className={`flex-1 items-center py-3 px-2 rounded-lg border-2 ${
                extracting && currentDocType === 'nor'
                  ? 'bg-sky-100 border-sky-400'
                  : 'bg-white border-sky-300'
              }`}
            >
              {extracting && currentDocType === 'nor' ? (
                <ActivityIndicator color="#0284c7" size="small" />
              ) : (
                <MaterialCommunityIcons name="file-document" size={24} color="#0284c7" />
              )}
              <Text className="text-sky-700 font-semibold text-xs mt-1 text-center">
                Notice of Race
              </Text>
            </Pressable>

            {/* Sailing Instructions */}
            <Pressable
              onPress={() => handleFileUpload('si')}
              disabled={extracting}
              className={`flex-1 items-center py-3 px-2 rounded-lg border-2 ${
                extracting && currentDocType === 'si'
                  ? 'bg-sky-100 border-sky-400'
                  : 'bg-white border-sky-300'
              }`}
            >
              {extracting && currentDocType === 'si' ? (
                <ActivityIndicator color="#0284c7" size="small" />
              ) : (
                <MaterialCommunityIcons name="sail-boat" size={24} color="#0284c7" />
              )}
              <Text className="text-sky-700 font-semibold text-xs mt-1 text-center">
                Sailing Instructions
              </Text>
            </Pressable>

            {/* Other Documents */}
            <Pressable
              onPress={() => handleFileUpload('other')}
              disabled={extracting}
              className={`flex-1 items-center py-3 px-2 rounded-lg border-2 ${
                extracting && currentDocType === 'other'
                  ? 'bg-sky-100 border-sky-400'
                  : 'bg-white border-sky-300'
              }`}
            >
              {extracting && currentDocType === 'other' ? (
                <ActivityIndicator color="#0284c7" size="small" />
              ) : (
                <MaterialCommunityIcons name="file-multiple" size={24} color="#0284c7" />
              )}
              <Text className="text-sky-700 font-semibold text-xs mt-1 text-center">
                Other Docs
              </Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View className="flex-row items-center gap-2 mb-3">
            <View className="flex-1 h-px bg-purple-300" />
            <Text className="text-xs text-purple-700 font-semibold">OR PASTE TEXT/URL</Text>
            <View className="flex-1 h-px bg-purple-300" />
          </View>

          <TextInput
            value={freeformText}
            onChangeText={setFreeformText}
            placeholder="Paste a PDF URL (e.g., https://example.com/sailing-instructions.pdf) OR paste text: 'Croucher Series Race 3 at Victoria Harbour, Nov 17 2025, 2 starts (Dragon 10:00, J/70 10:05), VHF 72, PRO: John Smith, 720° penalty system...'"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            className="bg-white border border-purple-300 rounded-lg px-4 py-3 text-base text-gray-900 min-h-[120px] mb-3"
            textAlignVertical="top"
            editable={!extracting}
          />
          <Pressable
            onPress={handleExtractFromText}
            disabled={extracting || !freeformText.trim()}
            className={`flex-row items-center justify-center gap-2 py-3 px-4 rounded-lg ${
              extracting || !freeformText.trim() ? 'bg-gray-300' : 'bg-purple-600'
            }`}
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
            {renderInputField('Venue', venue, setVenue, {
              placeholder: 'e.g., Victoria Harbour, Hong Kong',
              required: true,
            })}
            {renderInputField('Description', description, setDescription, {
              placeholder: 'Race series, event details...',
              multiline: true,
            })}
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

        {/* Course & Start Area */}
        {renderSectionHeader('Course & Start Area', <Navigation size={20} color="#0284c7" />, 'course')}
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
                  value={div.fleet_size.toString()}
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
            onPress={handleSubmit}
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
