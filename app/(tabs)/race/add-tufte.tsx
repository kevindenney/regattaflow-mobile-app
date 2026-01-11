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

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  ChevronLeft,
  Sparkles,
  Map,
  ChevronDown,
  ChevronRight,
  MapPin,
  FileText,
  Link,
  Sailboat,
  Users,
  Trophy,
  Navigation,
  CheckCircle,
  Info,
} from 'lucide-react-native';
import { format, addDays } from 'date-fns';
import * as DocumentPicker from 'expo-document-picker';

import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import { ComprehensiveRaceExtractionAgent } from '@/services/agents/ComprehensiveRaceExtractionAgent';
import { PDFExtractionService } from '@/services/PDFExtractionService';
import { LocationMapPicker } from '@/components/races/LocationMapPicker';
import { BoatSelector } from '@/components/races/AddRaceDialog/BoatSelector';
import { DistanceRouteMap } from '@/components/races/DistanceRouteMap';

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

interface ClubEventSuggestion {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  clubName: string;
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
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function AddRaceScreen() {
  const router = useRouter();
  const { user } = useAuth();

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
    aiExpanded: false,
    aiInputText: '',
    aiInputMethod: 'paste',
    aiSelectedFile: null,
    aiExtractedFields: new Set(),
    extractionComplete: false,
  });

  const [form, setForm] = useState<FormState>(getInitialState());
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [clubSuggestion, setClubSuggestion] = useState<ClubEventSuggestion | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);

  // Reset form when screen is focused
  useFocusEffect(
    useCallback(() => {
      setForm(getInitialState());
      setIsExtracting(false);
      setIsSaving(false);
      setClubSuggestion(null);
      setCalculatedDistance(null);
      setShowRouteMap(false);
      logger.debug('[AddRaceScreen] Form reset on focus');

      // Load club suggestion
      loadClubSuggestion();
    }, [])
  );

  // Load club event suggestion
  const loadClubSuggestion = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: memberships } = await supabase
        .from('club_members')
        .select('club_id, clubs(id, name)')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!memberships || memberships.length === 0) return;

      const clubIds = memberships.map((m: any) => m.club_id);

      const { data: events } = await supabase
        .from('club_events')
        .select('*')
        .in('club_id', clubIds)
        .gte('start_date', new Date().toISOString())
        .in('status', ['published', 'registration_open'])
        .order('start_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (events) {
        const club = memberships.find((m: any) => m.club_id === events.club_id)?.clubs as any;
        setClubSuggestion({
          id: events.id,
          title: events.title,
          date: events.start_date.split('T')[0],
          time: events.start_date.includes('T') ? events.start_date.split('T')[1]?.substring(0, 5) : undefined,
          location: events.location_name,
          clubName: club?.name || 'Your club',
        });
      }
    } catch (error) {
      logger.error('[AddRaceScreen] Failed to load club suggestion:', error);
    }
  }, [user?.id]);

  // Apply club suggestion
  const applyClubSuggestion = useCallback(() => {
    if (!clubSuggestion) return;

    setForm(prev => ({
      ...prev,
      name: clubSuggestion.title,
      date: clubSuggestion.date,
      time: clubSuggestion.time || '12:00',
      location: clubSuggestion.location || '',
    }));
    setClubSuggestion(null);
  }, [clubSuggestion]);

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
      const url = form.aiInputText.trim();
      if (!url.startsWith('http')) {
        Alert.alert('Error', 'Please enter a valid URL');
        return;
      }

      setIsExtracting(true);
      try {
        const isPdfUrl = url.toLowerCase().includes('.pdf') || url.includes('_files/ugd/');

        if (isPdfUrl) {
          const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
          const response = await fetch(`${supabaseUrl}/functions/v1/extract-pdf-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
          const result = await response.json();
          if (!result.success) throw new Error(result.error);
          textContent = result.text;
        } else {
          const response = await fetch(url);
          textContent = await response.text();
        }
      } catch (err) {
        Alert.alert('Error', 'Could not fetch content from URL');
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

      // Apply extracted data to form
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
        updates.routeWaypoints = extracted.routeWaypoints.map((wp: any, i: number) => ({
          id: `wp-${Date.now()}-${i}`,
          name: wp.name || `Waypoint ${i + 1}`,
          latitude: wp.latitude || 0,
          longitude: wp.longitude || 0,
          type: wp.type || 'waypoint',
          required: wp.type === 'start' || wp.type === 'finish',
        })).filter((wp: RouteWaypoint) => wp.latitude !== 0 || wp.longitude !== 0);
        if (updates.routeWaypoints.length > 0) aiFields.add('routeWaypoints');
      }

      // Course marks
      if (extracted.marks?.length > 0) {
        updates.marks = extracted.marks;
        aiFields.add('marks');
      }

      setForm(prev => ({
        ...prev,
        ...updates,
        aiExtractedFields: aiFields,
        extractionComplete: true,
        aiExpanded: false,
      }));

      // Auto-show route map if waypoints were extracted
      if (updates.routeWaypoints && updates.routeWaypoints.length > 0) {
        setShowRouteMap(true);
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
    if (!isFormValid || !user?.id || isSaving) return;

    setIsSaving(true);
    try {
      const startTime = `${form.date}T${form.time}:00`;

      // Build metadata
      const metadata: Record<string, any> = {
        venue_name: form.location || null,
      };

      // Build race data
      const raceData: Record<string, any> = {
        name: form.name.trim(),
        start_date: startTime,
        created_by: user.id,
        status: 'planned',
        race_type: form.raceType,
        vhf_channel: form.vhfChannel || null,
      };

      // Add location name
      if (form.location) {
        raceData.start_area_name = form.location;
      }

      // Add coordinates to metadata (no dedicated column exists)
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

      logger.debug('[AddRaceScreen] Saving race:', raceData);

      const { data: newRace, error } = await supabase
        .from('regattas')
        .insert(raceData)
        .select()
        .single();

      if (error) throw error;

      // Save NOR document if extracted from URL
      if (form.aiInputMethod === 'url' && form.aiInputText.trim().startsWith('http') && newRace?.id) {
        try {
          const url = form.aiInputText.trim();
          const { data: doc } = await supabase
            .from('documents')
            .insert({
              user_id: user.id,
              filename: url.split('/').pop() || 'notice-of-race.pdf',
              title: `${form.name} - Notice of Race`,
              file_path: url,
              mime_type: 'application/pdf',
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
  }, [form, isFormValid, user?.id, isSaving, calculatedDistance, router]);

  const handleClose = useCallback(() => {
    router.canGoBack() ? router.back() : router.replace('/(tabs)/races');
  }, [router]);

  // Check if we can extract
  const canExtract = useMemo(() => {
    if (form.aiInputMethod === 'paste') return form.aiInputText.trim().length > 20;
    if (form.aiInputMethod === 'upload') return form.aiSelectedFile !== null;
    if (form.aiInputMethod === 'url') return form.aiInputText.trim().startsWith('http');
    return false;
  }, [form.aiInputMethod, form.aiInputText, form.aiSelectedFile]);

  // Get venue center for route map
  const mapCenter = useMemo(() => {
    if (form.latitude && form.longitude) {
      return { lat: form.latitude, lng: form.longitude };
    }
    if (form.routeWaypoints.length > 0) {
      return { lat: form.routeWaypoints[0].latitude, lng: form.routeWaypoints[0].longitude };
    }
    return { lat: 22.28, lng: 114.16 }; // Default: Hong Kong
  }, [form.latitude, form.longitude, form.routeWaypoints]);

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
          {/* Club Suggestion Banner */}
          {clubSuggestion && (
            <Pressable style={styles.suggestionBanner} onPress={applyClubSuggestion}>
              <View style={styles.suggestionContent}>
                <Info size={16} color={COLORS.success} />
                <View style={styles.suggestionText}>
                  <Text style={styles.suggestionTitle}>Upcoming from {clubSuggestion.clubName}</Text>
                  <Text style={styles.suggestionSubtitle}>{clubSuggestion.title} • {clubSuggestion.date}</Text>
                </View>
              </View>
              <Text style={styles.suggestionAction}>Use</Text>
            </Pressable>
          )}

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

          {/* AI Extraction Section */}
          <View style={styles.section}>
            <Pressable
              style={styles.sectionHeader}
              onPress={() => updateField('aiExpanded', !form.aiExpanded)}
            >
              <View style={styles.sectionHeaderLeft}>
                <Sparkles size={14} color={COLORS.accent} />
                <Text style={styles.sectionLabel}>AI EXTRACTION</Text>
                {form.extractionComplete && (
                  <CheckCircle size={14} color={COLORS.success} style={{ marginLeft: 4 }} />
                )}
              </View>
              <ChevronDown
                size={18}
                color={COLORS.secondary}
                style={{ transform: [{ rotate: form.aiExpanded ? '180deg' : '0deg' }] }}
              />
            </Pressable>

            {form.aiExpanded && (
              <View style={styles.aiContent}>
                {/* Input Method Tabs */}
                <View style={styles.methodTabs}>
                  {(['paste', 'upload', 'url'] as const).map((method) => (
                    <Pressable
                      key={method}
                      style={[styles.methodTab, form.aiInputMethod === method && styles.methodTabActive]}
                      onPress={() => updateField('aiInputMethod', method)}
                    >
                      {method === 'upload' ? (
                        <FileText size={14} color={form.aiInputMethod === method ? COLORS.accent : COLORS.tertiary} />
                      ) : method === 'url' ? (
                        <Link size={14} color={form.aiInputMethod === method ? COLORS.accent : COLORS.tertiary} />
                      ) : null}
                      <Text style={[styles.methodTabText, form.aiInputMethod === method && styles.methodTabTextActive]}>
                        {method === 'paste' ? 'Paste' : method === 'upload' ? 'PDF' : 'URL'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Input Area */}
                {form.aiInputMethod === 'paste' && (
                  <TextInput
                    style={styles.textArea}
                    value={form.aiInputText}
                    onChangeText={(text) => updateField('aiInputText', text)}
                    placeholder="Paste race notice, sailing instructions, or any text..."
                    placeholderTextColor={COLORS.tertiary}
                    multiline
                    textAlignVertical="top"
                  />
                )}

                {form.aiInputMethod === 'upload' && (
                  <Pressable style={styles.uploadArea} onPress={handleFilePick}>
                    <FileText size={24} color={COLORS.secondary} />
                    <Text style={styles.uploadText}>
                      {form.aiSelectedFile ? form.aiSelectedFile.name : 'Tap to select PDF'}
                    </Text>
                  </Pressable>
                )}

                {form.aiInputMethod === 'url' && (
                  <TextInput
                    style={styles.urlInput}
                    value={form.aiInputText}
                    onChangeText={(text) => updateField('aiInputText', text)}
                    placeholder="https://example.com/notice-of-race.pdf"
                    placeholderTextColor={COLORS.tertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                )}

                {/* Extract Button */}
                <Pressable
                  style={[styles.extractButton, (!canExtract || isExtracting) && styles.extractButtonDisabled]}
                  onPress={handleExtract}
                  disabled={!canExtract || isExtracting}
                >
                  {isExtracting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Sparkles size={16} color="#FFFFFF" />
                      <Text style={styles.extractButtonText}>Extract Race Details</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </View>

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
              <FieldRow
                label="Course Type"
                value={form.courseType}
                onChangeText={(v) => updateField('courseType', v)}
                placeholder="e.g., Windward-Leeward"
                aiExtracted={form.aiExtractedFields.has('courseType')}
              />
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
    paddingVertical: 12,
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

  // Suggestion banner
  suggestionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
  suggestionAction: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
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
});
