/**
 * TufteAddRaceForm Component
 *
 * Single-page Add Race form following Edward Tufte's design principles.
 * Replaces the multi-step wizard with a unified, scrollable form.
 *
 * Features:
 * - Inline race type selector (segmented control)
 * - Collapsible AI extraction section
 * - Smart defaults (date +7 days, time 14:00)
 * - Conditional type-specific fields
 * - Real-time validation
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, MapPin, ChevronRight } from 'lucide-react-native';
import { format, addDays } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { tufteFormStyles, TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from './tufteFormStyles';
import { TUFTE_BACKGROUND, IOS_COLORS } from '@/components/cards/constants';
import { TufteRaceTypeSelector } from './TufteRaceTypeSelector';
import { TufteSectionLabel } from './TufteSectionLabel';
import { TufteFieldRow } from './TufteFieldRow';
import { TufteFleetFields } from './TufteFleetFields';
import { TufteDistanceFields } from './TufteDistanceFields';
import { TufteMatchFields } from './TufteMatchFields';
import { TufteTeamFields } from './TufteTeamFields';
import { LocationMapPicker } from '../LocationMapPicker';
import { ExtractedDetailsSummary } from './ExtractedDetailsSummary';
import { UnifiedDocumentInput } from '@/components/documents/UnifiedDocumentInput';

import type { RaceType } from '../RaceTypeSelector';
import type { RaceFormData } from './RaceDetailsStep';
import type { FleetRaceData } from './FleetRaceFields';
import type { DistanceRaceData } from './DistanceRaceFields';
import type { MatchRaceData } from './MatchRaceFields';
import type { TeamRaceData } from './TeamRaceFields';
import type { ExtractedRaceData } from '../ExtractionResults';
import type { CourseMark, RouteWaypoint } from '@/hooks/useAddRace';
import type { MultiRaceExtractedData, ExtractedData } from '../AIValidationScreen';
import { MultiRaceSelectionScreen } from '../MultiRaceSelectionScreen';

// =============================================================================
// TYPES
// =============================================================================

interface TufteAddRaceFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: RaceFormData) => Promise<void>;
}

interface FormState {
  raceType: RaceType;
  // Common fields
  name: string;
  date: string;
  time: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  vhfChannel: string;
  notes: string;
  // Course/Map data from AI extraction or manual entry
  marks: CourseMark[];
  routeWaypoints: RouteWaypoint[];
  racingAreaPolygon: Array<{ lat: number; lng: number }>;
  // Type-specific
  fleet: FleetRaceData;
  distance: DistanceRaceData;
  match: MatchRaceData;
  team: TeamRaceData;
}

interface FormErrors {
  [key: string]: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY_LAST_LOCATION = '@regattaflow/lastRaceLocation';

interface LastLocationData {
  name: string;
  lat?: number;
  lng?: number;
}

const getSmartDefaults = (lastLocationData?: LastLocationData): FormState => {
  const nextWeek = addDays(new Date(), 7);
  return {
    raceType: 'fleet',
    name: '',
    date: format(nextWeek, 'yyyy-MM-dd'),
    time: '14:00',
    location: lastLocationData?.name || '',
    latitude: lastLocationData?.lat || null,
    longitude: lastLocationData?.lng || null,
    vhfChannel: '',
    notes: '',
    // Course/Map data - empty until AI extraction or manual entry
    marks: [],
    routeWaypoints: [],
    racingAreaPolygon: [],
    fleet: {},
    distance: {},
    match: {},
    team: {},
  };
};

// =============================================================================
// COMPONENT
// =============================================================================

export function TufteAddRaceForm({ visible, onClose, onSave }: TufteAddRaceFormProps) {
  // State
  const [formState, setFormState] = useState<FormState>(getSmartDefaults());
  const [errors, setErrors] = useState<FormErrors>({});
  const [aiExtractedFields, setAiExtractedFields] = useState<Set<string>>(new Set());
  const [extractedDetailsData, setExtractedDetailsData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastLocationData, setLastLocationData] = useState<LastLocationData | undefined>();
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  // Key to force remount of document input section when modal opens
  const [documentInputKey, setDocumentInputKey] = useState(0);
  // Multi-race selection state
  const [showMultiRaceModal, setShowMultiRaceModal] = useState(false);
  const [multiRaceData, setMultiRaceData] = useState<MultiRaceExtractedData | null>(null);
  const [isCreatingMultiple, setIsCreatingMultiple] = useState(false);
  // Source document tracking for provenance
  const [sourceDocumentIds, setSourceDocumentIds] = useState<string[]>([]);

  // Load last used location (now with coordinates)
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_LAST_LOCATION).then((value) => {
      if (value) {
        try {
          // Try to parse as JSON (new format with coordinates)
          const parsed = JSON.parse(value) as LastLocationData;
          setLastLocationData(parsed);
          setFormState((prev) => ({
            ...prev,
            location: prev.location || parsed.name,
            latitude: prev.latitude || parsed.lat || null,
            longitude: prev.longitude || parsed.lng || null,
          }));
        } catch {
          // Fallback for old format (plain string)
          const data = { name: value };
          setLastLocationData(data);
          setFormState((prev) => ({
            ...prev,
            location: prev.location || value,
          }));
        }
      }
    });
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setFormState(getSmartDefaults(lastLocationData));
      setErrors({});
      setAiExtractedFields(new Set());
      setExtractedDetailsData(null);
      setShowLocationPicker(false);
      // Reset multi-race state
      setShowMultiRaceModal(false);
      setMultiRaceData(null);
      setIsCreatingMultiple(false);
      // Reset source document tracking
      setSourceDocumentIds([]);
      // Increment key to force remount of document input section, clearing its internal state
      setDocumentInputKey((prev) => prev + 1);
    }
  }, [visible, lastLocationData]);

  // Handlers
  const handleRaceTypeSelect = useCallback((type: RaceType) => {
    setFormState((prev) => ({ ...prev, raceType: type }));
  }, []);

  const handleFieldChange = useCallback((field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const handleFleetChange = useCallback((data: FleetRaceData) => {
    setFormState((prev) => ({ ...prev, fleet: data }));
  }, []);

  const handleDistanceChange = useCallback((data: DistanceRaceData) => {
    setFormState((prev) => ({ ...prev, distance: data }));
  }, []);

  const handleMatchChange = useCallback((data: MatchRaceData) => {
    setFormState((prev) => ({ ...prev, match: data }));
    // Clear match-specific errors
    if (errors['match.opponentName']) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next['match.opponentName'];
        return next;
      });
    }
  }, [errors]);

  const handleTeamChange = useCallback((data: TeamRaceData) => {
    setFormState((prev) => ({ ...prev, team: data }));
    // Clear team-specific errors
    setErrors((prev) => {
      const next = { ...prev };
      delete next['team.yourTeamName'];
      delete next['team.opponentTeamName'];
      return next;
    });
  }, []);

  const handleLocationSelect = useCallback((location: { name: string; lat: number; lng: number }) => {
    setFormState((prev) => ({
      ...prev,
      location: location.name,
      latitude: location.lat,
      longitude: location.lng,
    }));
    setShowLocationPicker(false);
    // Clear location error if any
    if (errors.location) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.location;
        return next;
      });
    }
  }, [errors]);

  const handleAIExtracted = useCallback((data: ExtractedRaceData, rawData?: any) => {
    const newAiFields = new Set<string>();
    const updates: Partial<FormState> = {};

    // Set race type from extraction if available
    if (rawData?.raceType && ['fleet', 'distance', 'match', 'team'].includes(rawData.raceType)) {
      updates.raceType = rawData.raceType as RaceType;
      newAiFields.add('raceType');
    }

    // Extract basic fields
    data.basic?.forEach((field) => {
      const lowerLabel = field.label.toLowerCase();
      if (lowerLabel.includes('name') && field.value) {
        updates.name = field.value;
        newAiFields.add('name');
      } else if (lowerLabel.includes('date') && field.value) {
        updates.date = field.value;
        newAiFields.add('date');
      } else if (lowerLabel.includes('time') && field.value) {
        updates.time = field.value;
        newAiFields.add('time');
      } else if (lowerLabel.includes('location') && field.value) {
        updates.location = field.value;
        newAiFields.add('location');
      }
    });

    // Extract VHF channel from raw data first (get just the channel number)
    if (rawData?.vhfChannels && rawData.vhfChannels.length > 0) {
      const channel = rawData.vhfChannels[0].channel;
      if (channel) {
        updates.vhfChannel = channel.toString();
        newAiFields.add('vhfChannel');
      }
    }
    // Fallback to conditions display data
    if (!updates.vhfChannel) {
      data.conditions?.forEach((field) => {
        const lowerLabel = field.label.toLowerCase();
        if (lowerLabel.includes('vhf') && field.value) {
          // Extract just the number if formatted as "Ch 72 (purpose)"
          const match = field.value.match(/\d+/);
          updates.vhfChannel = match ? match[0] : field.value;
          newAiFields.add('vhfChannel');
        }
      });
    }

    // Populate distance-specific fields from raw data
    if (rawData?.raceType === 'distance') {
      const distanceData: DistanceRaceData = {};

      if (rawData.totalDistanceNm) {
        distanceData.totalDistanceNm = rawData.totalDistanceNm.toString();
        newAiFields.add('distance.totalDistanceNm');
      }
      if (rawData.timeLimitHours) {
        distanceData.timeLimitHours = rawData.timeLimitHours.toString();
        newAiFields.add('distance.timeLimitHours');
      }

      // Build route description from waypoints
      if (rawData.routeWaypoints && rawData.routeWaypoints.length > 0) {
        const waypointNames = rawData.routeWaypoints.map((wp: any) => wp.name).join(' → ');
        distanceData.routeDescription = waypointNames;
        newAiFields.add('distance.routeDescription');
      } else if (rawData.courseDescription) {
        distanceData.routeDescription = rawData.courseDescription;
        newAiFields.add('distance.routeDescription');
      }

      // Start and finish at different locations for most distance races
      if (rawData.startAreaName && rawData.finishAreaName) {
        distanceData.startFinishSameLocation = rawData.startAreaName === rawData.finishAreaName;
      }

      updates.distance = distanceData;
    }

    // Populate fleet-specific fields from raw data
    if (rawData?.raceType === 'fleet') {
      const fleetData: FleetRaceData = {};

      if (rawData.courseType) {
        fleetData.courseType = rawData.courseType;
        newAiFields.add('fleet.courseType');
      }
      if (rawData.numberOfLegs) {
        fleetData.numberOfLegs = rawData.numberOfLegs.toString();
        newAiFields.add('fleet.numberOfLegs');
      }
      if (rawData.eligibleClasses && rawData.eligibleClasses.length > 0) {
        fleetData.boatClass = rawData.eligibleClasses[0];
        newAiFields.add('fleet.boatClass');
      }

      updates.fleet = fleetData;
    }

    // Extract course marks with GPS coordinates (for tactical map)
    if (rawData?.marks && Array.isArray(rawData.marks) && rawData.marks.length > 0) {
      updates.marks = rawData.marks.map((mark: any) => ({
        name: mark.name || 'Unknown Mark',
        latitude: mark.latitude,
        longitude: mark.longitude,
        type: mark.type || 'waypoint',
        color: mark.color,
        shape: mark.shape,
      }));
      newAiFields.add('marks');
    }

    // Extract route waypoints for distance races (for tactical map)
    if (rawData?.routeWaypoints && Array.isArray(rawData.routeWaypoints) && rawData.routeWaypoints.length > 0) {
      updates.routeWaypoints = rawData.routeWaypoints.map((wp: any) => ({
        name: wp.name || 'Waypoint',
        latitude: wp.latitude,
        longitude: wp.longitude,
        type: wp.type || 'waypoint',
        required: wp.required ?? true,
        passingSide: wp.passingSide,
        notes: wp.notes,
        order: wp.order,
      }));
      newAiFields.add('routeWaypoints');
    }

    // Extract racing area polygon if available
    if (rawData?.racingAreaCoordinates && Array.isArray(rawData.racingAreaCoordinates) && rawData.racingAreaCoordinates.length > 0) {
      updates.racingAreaPolygon = rawData.racingAreaCoordinates.map((coord: any) => ({
        lat: coord.latitude || coord.lat,
        lng: coord.longitude || coord.lng,
      }));
      newAiFields.add('racingAreaPolygon');
    }

    setFormState((prev) => ({ ...prev, ...updates }));
    setAiExtractedFields(newAiFields);

    // Store raw extraction data for details summary
    // Handle both wrapper format { multipleRaces, races } and direct race data
    if (rawData) {
      const dataToStore = rawData.races?.[0] || rawData;
      setExtractedDetailsData(dataToStore);
    }
  }, []);

  // Multi-race detection handler
  const handleMultiRaceDetected = useCallback((data: MultiRaceExtractedData) => {
    setMultiRaceData(data);
    setShowMultiRaceModal(true);
  }, []);

  // Helper function to populate form with a single race's data
  const populateFormWithRace = useCallback((race: ExtractedData) => {
    const newAiFields = new Set<string>();
    const updates: Partial<FormState> = {};

    // Set race type from extraction if available
    if (race.raceType && ['fleet', 'distance', 'match', 'team'].includes(race.raceType)) {
      updates.raceType = race.raceType as RaceType;
      newAiFields.add('raceType');
    }

    // Basic fields
    if (race.raceName) {
      updates.name = race.raceName;
      newAiFields.add('name');
    }
    if (race.raceDate) {
      updates.date = race.raceDate;
      newAiFields.add('date');
    }
    if (race.warningSignalTime) {
      updates.time = race.warningSignalTime;
      newAiFields.add('time');
    }
    if (race.venue) {
      updates.location = race.venue;
      newAiFields.add('location');
    }

    // VHF channel
    if (race.vhfChannels && race.vhfChannels.length > 0) {
      updates.vhfChannel = race.vhfChannels[0].channel;
      newAiFields.add('vhfChannel');
    } else if (race.vhfChannel) {
      updates.vhfChannel = race.vhfChannel;
      newAiFields.add('vhfChannel');
    }

    setFormState((prev) => ({ ...prev, ...updates }));
    setAiExtractedFields(newAiFields);
    setExtractedDetailsData(race);
  }, []);

  // Helper to build RaceFormData from ExtractedData
  const buildRaceFormData = useCallback((race: ExtractedData): RaceFormData => {
    const raceType = (race.raceType as RaceType) || 'fleet';

    const data: RaceFormData = {
      name: race.raceName || 'Untitled Race',
      date: race.raceDate || format(new Date(), 'yyyy-MM-dd'),
      time: race.warningSignalTime || '14:00',
      location: race.venue || '',
      raceType,
      vhfChannel: race.vhfChannels?.[0]?.channel || race.vhfChannel,
    };

    // Add extracted details
    (data as any).extractedDetails = race;

    return data;
  }, []);

  // Multi-race confirmation handler
  const handleMultiRaceConfirm = useCallback(async (selectedRaces: ExtractedData[]) => {
    if (selectedRaces.length === 0) {
      setShowMultiRaceModal(false);
      return;
    }

    if (selectedRaces.length === 1) {
      // Single race selected - populate form and let user continue editing
      populateFormWithRace(selectedRaces[0]);
      setShowMultiRaceModal(false);
      return;
    }

    // Multiple races selected - create all of them
    setIsCreatingMultiple(true);
    try {
      for (const race of selectedRaces) {
        const formData = buildRaceFormData(race);
        await onSave(formData);
      }
      // Close everything on success
      setShowMultiRaceModal(false);
      onClose();
    } catch (error) {
      console.error('[TufteAddRaceForm] Failed to create multiple races:', error);
      // Keep modal open so user can retry or select fewer races
    } finally {
      setIsCreatingMultiple(false);
    }
  }, [populateFormWithRace, buildRaceFormData, onSave, onClose]);

  // Multi-race cancel handler
  const handleMultiRaceCancel = useCallback(() => {
    setShowMultiRaceModal(false);
    setMultiRaceData(null);
  }, []);

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Required common fields
    if (!formState.name.trim()) newErrors.name = 'Race name is required';
    if (!formState.date) newErrors.date = 'Date is required';
    if (!formState.time) newErrors.time = 'Start time is required';
    if (!formState.location.trim()) newErrors.location = 'Location is required';

    // Type-specific validation
    if (formState.raceType === 'match') {
      if (!formState.match.opponentName?.trim()) {
        newErrors['match.opponentName'] = 'Opponent name is required';
      }
    }

    if (formState.raceType === 'team') {
      if (!formState.team.yourTeamName?.trim()) {
        newErrors['team.yourTeamName'] = 'Your team name is required';
      }
      if (!formState.team.opponentTeamName?.trim()) {
        newErrors['team.opponentTeamName'] = 'Opponent team is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  const isFormValid = useMemo(() => {
    const hasRequiredCommon =
      formState.name.trim() &&
      formState.date &&
      formState.time &&
      formState.location.trim();

    if (!hasRequiredCommon) return false;

    if (formState.raceType === 'match') {
      if (!formState.match.opponentName?.trim()) return false;
    }

    if (formState.raceType === 'team') {
      if (!formState.team.yourTeamName?.trim()) return false;
      if (!formState.team.opponentTeamName?.trim()) return false;
    }

    return true;
  }, [formState]);

  const handleSave = useCallback(async () => {
    if (!validateForm() || isSaving) return;

    setIsSaving(true);
    try {
      // Save last location with coordinates for future defaults
      if (formState.location.trim()) {
        const locationData: LastLocationData = {
          name: formState.location.trim(),
          lat: formState.latitude || undefined,
          lng: formState.longitude || undefined,
        };
        await AsyncStorage.setItem(STORAGE_KEY_LAST_LOCATION, JSON.stringify(locationData));
      }

      // Build RaceFormData
      const raceData: RaceFormData = {
        name: formState.name.trim(),
        date: formState.date,
        time: formState.time,
        location: formState.location.trim(),
        latitude: formState.latitude || undefined,
        longitude: formState.longitude || undefined,
        raceType: formState.raceType,
        vhfChannel: formState.vhfChannel.trim() || undefined,
        notes: formState.notes.trim() || undefined,
      };

      // Add type-specific data
      if (formState.raceType === 'fleet') {
        raceData.fleet = formState.fleet;
      } else if (formState.raceType === 'distance') {
        raceData.distance = formState.distance;
      } else if (formState.raceType === 'match') {
        raceData.match = formState.match;
      } else if (formState.raceType === 'team') {
        raceData.team = formState.team;
      }

      // Add course/map data from AI extraction or manual entry
      if (formState.marks.length > 0) {
        (raceData as any).marks = formState.marks;
      }
      if (formState.routeWaypoints.length > 0) {
        (raceData as any).routeWaypoints = formState.routeWaypoints;
      }
      if (formState.racingAreaPolygon.length > 0) {
        (raceData as any).racingAreaPolygon = formState.racingAreaPolygon;
      }

      // Add extracted details data for persistence
      if (extractedDetailsData) {
        (raceData as any).extractedDetails = extractedDetailsData;
      }

      // Add source document IDs for provenance tracking
      if (sourceDocumentIds.length > 0) {
        (raceData as any).sourceDocumentIds = sourceDocumentIds;
      }

      await onSave(raceData);
      onClose();
    } catch (error) {
      console.error('[TufteAddRaceForm] Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [formState, validateForm, isSaving, onSave, onClose, extractedDetailsData, sourceDocumentIds]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.headerButton} onPress={handleClose}>
              <X size={24} color={IOS_COLORS.gray} />
            </Pressable>
            <Text style={styles.headerTitle}>Add Race</Text>
            <Pressable
              style={[styles.headerSaveButton, !isFormValid && styles.headerSaveButtonDisabled]}
              onPress={handleSave}
              disabled={!isFormValid || isSaving}
            >
              <Text style={styles.headerSaveText}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>

          {/* Form Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Race Type Selector */}
            <TufteRaceTypeSelector
              selectedType={formState.raceType}
              onSelect={handleRaceTypeSelect}
            />

            {/* Unified Document Input - AI Extraction with source tracking */}
            <UnifiedDocumentInput
              key={documentInputKey}
              mode="race_creation"
              defaultDocumentType="nor"
              onExtractionComplete={(data, rawData, documentId) => {
                handleAIExtracted(data, rawData);
                if (documentId) {
                  setSourceDocumentIds((prev) => [...prev, documentId]);
                }
              }}
              onMultiRaceDetected={handleMultiRaceDetected}
              compact={false}
              raceType={formState.raceType}
            />

            {/* Race Details - editable fields for NOR/SI information */}
            {/* Always shown in editable mode; extracted values are pre-populated */}
            <ExtractedDetailsSummary
              data={extractedDetailsData}
              onChange={setExtractedDetailsData}
            />

            {/* Essentials Section */}
            <TufteSectionLabel first>ESSENTIALS</TufteSectionLabel>

            <TufteFieldRow
              label="Race name"
              value={formState.name}
              onChangeText={(v) => handleFieldChange('name', v)}
              placeholder="e.g., Club Championship Race 1"
              required
              error={errors.name}
              aiExtracted={aiExtractedFields.has('name')}
              autoFocus
            />

            <View style={styles.row}>
              <TufteFieldRow
                label="Date"
                value={formState.date}
                onChangeText={(v) => handleFieldChange('date', v)}
                placeholder="YYYY-MM-DD"
                required
                halfWidth
                error={errors.date}
                aiExtracted={aiExtractedFields.has('date')}
              />
              <TufteFieldRow
                label="Start time"
                value={formState.time}
                onChangeText={(v) => handleFieldChange('time', v)}
                placeholder="HH:MM"
                required
                halfWidth
                error={errors.time}
                aiExtracted={aiExtractedFields.has('time')}
              />
            </View>

            {/* Location - Tap to open map picker */}
            <Pressable
              style={[
                styles.locationRow,
                errors.location && styles.locationRowError,
              ]}
              onPress={() => setShowLocationPicker(true)}
            >
              <View style={styles.locationLeft}>
                <MapPin size={20} color={formState.location ? IOS_COLORS.blue : TUFTE_FORM_COLORS.placeholder} />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>
                    Location <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <Text
                    style={[
                      styles.locationValue,
                      !formState.location && styles.locationPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {formState.location || 'Tap to select on map'}
                  </Text>
                  {formState.latitude && formState.longitude && (
                    <Text style={styles.locationCoords}>
                      {formState.latitude.toFixed(4)}, {formState.longitude.toFixed(4)}
                    </Text>
                  )}
                </View>
              </View>
              <ChevronRight size={20} color={TUFTE_FORM_COLORS.placeholder} />
            </Pressable>
            {errors.location && (
              <Text style={styles.errorText}>{errors.location}</Text>
            )}

            {/* Type-Specific Fields */}
            {formState.raceType === 'fleet' && (
              <TufteFleetFields
                data={formState.fleet}
                onChange={handleFleetChange}
                aiExtractedFields={aiExtractedFields}
              />
            )}

            {formState.raceType === 'distance' && (
              <TufteDistanceFields
                data={formState.distance}
                onChange={handleDistanceChange}
                aiExtractedFields={aiExtractedFields}
              />
            )}

            {formState.raceType === 'match' && (
              <TufteMatchFields
                data={formState.match}
                onChange={handleMatchChange}
                errors={errors}
                aiExtractedFields={aiExtractedFields}
              />
            )}

            {formState.raceType === 'team' && (
              <TufteTeamFields
                data={formState.team}
                onChange={handleTeamChange}
                errors={errors}
                aiExtractedFields={aiExtractedFields}
              />
            )}

            {/* Optional Section */}
            <TufteSectionLabel>OPTIONAL</TufteSectionLabel>

            <TufteFieldRow
              label="VHF Channel"
              value={formState.vhfChannel}
              onChangeText={(v) => handleFieldChange('vhfChannel', v)}
              placeholder="e.g., 72"
              keyboardType="numeric"
              aiExtracted={aiExtractedFields.has('vhfChannel')}
            />

            <TufteFieldRow
              label="Notes"
              value={formState.notes}
              onChangeText={(v) => handleFieldChange('notes', v)}
              placeholder="Any additional notes..."
              multiline
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Location Map Picker Modal */}
      <LocationMapPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectLocation={handleLocationSelect}
        raceType={formState.raceType}
        initialLocation={
          formState.latitude && formState.longitude
            ? { lat: formState.latitude, lng: formState.longitude }
            : null
        }
        initialName={formState.location}
      />

      {/* Multi-Race Selection Modal */}
      <Modal
        visible={showMultiRaceModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleMultiRaceCancel}
      >
        {multiRaceData && (
          <MultiRaceSelectionScreen
            extractedData={multiRaceData}
            onConfirm={handleMultiRaceConfirm}
            onCancel={handleMultiRaceCancel}
          />
        )}
      </Modal>
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: TUFTE_FORM_SPACING.lg,
    paddingVertical: TUFTE_FORM_SPACING.md,
    backgroundColor: TUFTE_BACKGROUND,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE_FORM_COLORS.separator,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.label,
  },
  headerSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 8,
  },
  headerSaveButtonDisabled: {
    opacity: 0.5,
  },
  headerSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: TUFTE_FORM_SPACING.lg,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  // Location picker row styles
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: TUFTE_FORM_COLORS.separator,
  },
  locationRowError: {
    borderColor: IOS_COLORS.red,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.secondaryLabel,
    marginBottom: 2,
  },
  requiredStar: {
    color: IOS_COLORS.red,
  },
  locationValue: {
    fontSize: 16,
    color: TUFTE_FORM_COLORS.label,
  },
  locationPlaceholder: {
    color: TUFTE_FORM_COLORS.placeholder,
  },
  locationCoords: {
    fontSize: 11,
    color: TUFTE_FORM_COLORS.tertiaryLabel,
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: IOS_COLORS.red,
    marginTop: -8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
});

export default TufteAddRaceForm;
