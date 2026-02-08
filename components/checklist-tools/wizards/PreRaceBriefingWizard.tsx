/**
 * PreRaceBriefingWizard
 *
 * Unified wizard for reviewing all race documentation (NOR, SI, Course).
 * Presents extracted race data in a tabbed interface with section tracking.
 *
 * Tabs:
 * - Schedule: Dates, deadlines, briefing times
 * - Course: Marks, prohibited areas, start/finish
 * - Requirements: Entry fees, crew, equipment, safety
 * - Comms: VHF channels, contacts
 * - Scoring: Formula, handicaps, prizes
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Calendar,
  Map,
  Shield,
  Radio,
  Trophy,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  Users,
  DollarSign,
  AlertTriangle,
  Navigation,
  Flag,
  Ship,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Wind,
  Sailboat,
  Triangle,
  Award,
  Plus,
  Trash2,
  Hash,
  Anchor,
  Phone,
  MessageCircle,
} from 'lucide-react-native';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';
import { supabase } from '@/services/supabase';
import { DemoRaceService } from '@/services/DemoRaceService';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import type { BriefingSchedule, BriefingComms } from '@/types/raceIntentions';
import CourseMapView from '@/components/courses/CourseMapView';
import {
  courseTemplateService,
  type CourseTemplate,
  type CourseMark as TemplateCourseMark,
} from '@/services/CourseTemplateService';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  purple: '#5856D6',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray2: '#636366',
  gray3: '#48484A',
  gray4: '#3A3A3C',
  gray5: '#2C2C2E',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

// Tab configuration
const BRIEFING_TABS = [
  { id: 'schedule', label: 'Schedule', Icon: Calendar },
  { id: 'course', label: 'Course', Icon: Map },
  { id: 'requirements', label: 'Requirements', Icon: Shield },
  { id: 'comms', label: 'Comms', Icon: Radio },
  { id: 'scoring', label: 'Scoring', Icon: Trophy },
] as const;

type TabId = typeof BRIEFING_TABS[number]['id'];

interface PreRaceBriefingWizardProps extends ChecklistToolProps {
  raceName?: string;
  raceDate?: string | null;
}

interface ExtractedRaceData {
  // Document Links
  notice_of_race_url?: string;
  sailing_instructions_url?: string;
  supplementary_si_url?: string;
  entry_form_url?: string;
  // Schedule
  schedule?: Array<{
    date: string;
    time: string;
    event: string;
    location?: string;
    mandatory?: boolean;
  }>;
  entry_deadline?: string;
  // Schedule - editable fields
  number_of_races?: number;
  number_of_classes?: number;
  start_order?: string[];
  my_class_start_number?: number;
  class_flag?: string;
  social_events?: Array<{ time: string; event: string; location?: string }>;
  awards_ceremony?: { time: string; location?: string; details?: string };
  meet_at_dock_time?: string;
  depart_dock_time?: string;
  // Course
  start_area_name?: string;
  start_area_description?: string;
  prohibited_areas?: Array<{
    name: string;
    description?: string;
    coordinates?: { lat: number; lng: number };
  }>;
  route_waypoints?: Array<{
    name: string;
    type?: string;
    latitude?: number;
    longitude?: number;
  }>;
  traffic_separation_schemes?: string[];
  tide_gates?: Array<{
    location: string;
    optimalTime?: string;
    notes?: string;
  }>;
  // Requirements
  entry_fees?: Array<{
    type: string;
    amount: string;
    currency?: string;
    deadline?: string;
  }>;
  minimum_crew?: number;
  crew_requirements?: string;
  safety_requirements?: string;
  insurance_requirements?: string;
  class_rules?: string[];
  // Comms
  vhf_channels?: Array<{
    channel: string;
    purpose?: string;
  }>;
  organizing_authority?: string;
  event_website?: string;
  contact_email?: string;
  retirement_notification?: string;
  // Scoring
  scoring_formula?: string;
  handicap_systems?: string[];
  prizes_description?: string;
  motoring_division_available?: boolean;
  motoring_division_rules?: string;
  // Other
  name?: string;
  start_date?: string;
  vhf_channel?: string;
  time_limit_hours?: number;
  total_distance_nm?: number;
}

// Helper to convert demo race to extracted data format
function convertDemoRaceToExtractedData(demoRace: ReturnType<typeof DemoRaceService.getDemoRaceById>): ExtractedRaceData | null {
  if (!demoRace) return null;

  return {
    name: demoRace.name,
    start_date: demoRace.start_date,
    vhf_channel: demoRace.metadata.vhf_channel,
    time_limit_hours: demoRace.metadata.time_limit_hours,
    total_distance_nm: demoRace.metadata.total_distance_nm,
    entry_deadline: demoRace.metadata.entry_deadline,
    schedule: demoRace.metadata.schedule,
    entry_fees: demoRace.metadata.entry_fees ? [
      { type: 'Entry Fee', amount: demoRace.metadata.entry_fees }
    ] : undefined,
    // Course data
    start_area_name: demoRace.metadata.start_area_name,
    start_area_description: demoRace.metadata.start_area_description,
    route_waypoints: demoRace.metadata.route_waypoints?.map(wp => ({
      name: wp.name,
      type: 'waypoint',
      latitude: wp.lat,
      longitude: wp.lng,
    })),
    prohibited_areas: demoRace.metadata.prohibited_areas?.map(area => ({
      name: area.name,
      description: area.description,
    })),
    // Comms data
    organizing_authority: demoRace.metadata.venue_name,
    vhf_channels: demoRace.metadata.vhf_channel ? [
      { channel: demoRace.metadata.vhf_channel.replace('Channel ', ''), purpose: 'Race communications' }
    ] : undefined,
  };
}

// Helper to parse coordinate strings like "22.2997, 114.1446"
function parseCoordinateString(coordString: string | undefined): { latitude: number; longitude: number } | null {
  if (!coordString) return null;

  // Match patterns like "22.2997, 114.1446" or "22.2997,114.1446"
  const coordMatch = coordString.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    // Validate coordinates are reasonable (lat: -90 to 90, lng: -180 to 180)
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: lat, longitude: lng };
    }
  }
  return null;
}

// Helper to convert race data to CourseMapView marks format
interface CourseMark {
  id: string;
  name: string;
  type: 'start' | 'mark' | 'finish' | 'gate';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  color?: string;
}

function convertToMarks(raceData: ExtractedRaceData): CourseMark[] {
  const marks: CourseMark[] = [];

  // Add route waypoints as marks
  if (raceData.route_waypoints) {
    raceData.route_waypoints.forEach((wp, idx) => {
      if (wp.latitude && wp.longitude) {
        // Determine mark type based on position or name
        let markType: CourseMark['type'] = 'mark';
        const nameLower = wp.name.toLowerCase();
        if (idx === 0 || nameLower.includes('start')) {
          markType = 'start';
        } else if (idx === raceData.route_waypoints!.length - 1 || nameLower.includes('finish')) {
          markType = 'finish';
        } else if (nameLower.includes('gate')) {
          markType = 'gate';
        }

        marks.push({
          id: `waypoint-${idx}`,
          name: wp.name,
          type: markType,
          coordinates: {
            latitude: wp.latitude,
            longitude: wp.longitude,
          },
        });
      }
    });
  }

  // If no waypoints but we have start_area_name with coordinates, create a start marker
  if (marks.length === 0 && raceData.start_area_name) {
    const parsedCoords = parseCoordinateString(raceData.start_area_name);
    if (parsedCoords) {
      marks.push({
        id: 'start-area',
        name: 'Start Area',
        type: 'start',
        coordinates: parsedCoords,
      });
    }
  }

  return marks;
}

function getCenterCoordinate(raceData: ExtractedRaceData): { latitude: number; longitude: number } | undefined {
  // Try to get center from first waypoint with coordinates
  if (raceData.route_waypoints) {
    const firstWithCoords = raceData.route_waypoints.find(wp => wp.latitude && wp.longitude);
    if (firstWithCoords && firstWithCoords.latitude && firstWithCoords.longitude) {
      return {
        latitude: firstWithCoords.latitude,
        longitude: firstWithCoords.longitude,
      };
    }
  }

  // Try to parse coordinates from start_area_name
  if (raceData.start_area_name) {
    const parsedCoords = parseCoordinateString(raceData.start_area_name);
    if (parsedCoords) {
      return parsedCoords;
    }
  }

  // Default to Hong Kong if no coordinates available
  return { latitude: 22.2793, longitude: 114.1628 };
}

// Helper to fetch race data with extracted details
async function fetchRaceData(regattaId: string): Promise<ExtractedRaceData | null> {
  // Check if this is a demo race
  if (DemoRaceService.isDemoRace(regattaId)) {
    const demoRace = DemoRaceService.getDemoRaceById(regattaId);
    return convertDemoRaceToExtractedData(demoRace);
  }

  try {
    const { data, error } = await supabase
      .from('regattas')
      .select(`
        name,
        start_date,
        vhf_channel,
        time_limit_hours,
        total_distance_nm,
        schedule,
        entry_deadline,
        entry_fees,
        minimum_crew,
        crew_requirements,
        safety_requirements,
        insurance_requirements,
        retirement_notification,
        prohibited_areas,
        traffic_separation_schemes,
        tide_gates,
        start_area_name,
        start_area_description,
        scoring_formula,
        handicap_systems,
        motoring_division_available,
        motoring_division_rules,
        vhf_channels,
        organizing_authority,
        event_website,
        contact_email,
        class_rules,
        prizes_description,
        route_waypoints,
        notice_of_race_url,
        sailing_instructions_url,
        supplementary_si_url,
        entry_form_url
      `)
      .eq('id', regattaId)
      .single();

    if (error) {
      console.error('[PreRaceBriefingWizard] Error fetching race data:', error);
      return null;
    }

    return data as ExtractedRaceData;
  } catch (err) {
    console.error('[PreRaceBriefingWizard] Exception fetching race data:', err);
    return null;
  }
}

// Data field component
function DataField({
  icon,
  label,
  value,
  url,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  url?: string;
}) {
  const handlePress = useCallback(() => {
    if (url) {
      Linking.openURL(url);
    }
  }, [url]);

  return (
    <Pressable
      style={styles.dataField}
      onPress={url ? handlePress : undefined}
      disabled={!url}
    >
      <View style={styles.dataFieldIcon}>{icon}</View>
      <View style={styles.dataFieldContent}>
        <Text style={styles.dataFieldLabel}>{label}</Text>
        <Text style={[styles.dataFieldValue, url && styles.dataFieldLink]}>
          {value}
          {url && <ExternalLink size={12} color={IOS_COLORS.blue} style={{ marginLeft: 4 }} />}
        </Text>
      </View>
    </Pressable>
  );
}

// Card wrapper component for grouped fields
function DataCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.dataCard}>{children}</View>;
}

// Empty state component
function EmptySection({ message }: { message: string }) {
  return (
    <View style={styles.emptySection}>
      <FileText size={48} color={IOS_COLORS.gray3} style={{ marginBottom: 16 }} />
      <Text style={styles.emptySectionText}>{message}</Text>
    </View>
  );
}

// Document links card - shows NOR/SI links when available, and allows adding new ones
function DocumentLinksCard({
  raceData,
  message,
  onSaveUrl,
}: {
  raceData: ExtractedRaceData | null;
  message: string;
  onSaveUrl?: (field: 'notice_of_race_url' | 'sailing_instructions_url', url: string) => void;
}) {
  const [norInput, setNorInput] = useState('');
  const [siInput, setSiInput] = useState('');
  const [savingField, setSavingField] = useState<string | null>(null);

  const hasNor = !!raceData?.notice_of_race_url;
  const hasSi = !!raceData?.sailing_instructions_url;
  const hasSupSi = !!raceData?.supplementary_si_url;
  const hasEntryForm = !!raceData?.entry_form_url;
  const hasEventSite = !!raceData?.event_website;
  const hasAnyLink = hasNor || hasSi || hasSupSi || hasEntryForm || hasEventSite;

  const handleSave = async (field: 'notice_of_race_url' | 'sailing_instructions_url', url: string) => {
    const trimmed = url.trim();
    if (!trimmed || !onSaveUrl) return;
    // Basic URL validation
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return;
    setSavingField(field);
    try {
      await onSaveUrl(field, trimmed);
      if (field === 'notice_of_race_url') setNorInput('');
      else setSiInput('');
    } finally {
      setSavingField(null);
    }
  };

  return (
    <View style={styles.emptySection}>
      <FileText size={40} color={IOS_COLORS.gray3} style={{ marginBottom: 12 }} />
      <Text style={styles.emptySectionText}>{message}</Text>

      {/* Existing document links */}
      {hasAnyLink && (
        <View style={styles.docLinksContainer}>
          {hasNor && (
            <Pressable
              style={styles.docLinkButton}
              onPress={() => Linking.openURL(raceData!.notice_of_race_url!)}
            >
              <FileText size={16} color={IOS_COLORS.blue} />
              <Text style={styles.docLinkText}>Notice of Race</Text>
              <ExternalLink size={14} color={IOS_COLORS.blue} />
            </Pressable>
          )}
          {hasSi && (
            <Pressable
              style={styles.docLinkButton}
              onPress={() => Linking.openURL(raceData!.sailing_instructions_url!)}
            >
              <FileText size={16} color={IOS_COLORS.purple} />
              <Text style={styles.docLinkText}>Sailing Instructions</Text>
              <ExternalLink size={14} color={IOS_COLORS.blue} />
            </Pressable>
          )}
          {hasSupSi && (
            <Pressable
              style={styles.docLinkButton}
              onPress={() => Linking.openURL(raceData!.supplementary_si_url!)}
            >
              <FileText size={16} color={IOS_COLORS.orange} />
              <Text style={styles.docLinkText}>Supplementary SI</Text>
              <ExternalLink size={14} color={IOS_COLORS.blue} />
            </Pressable>
          )}
          {hasEntryForm && (
            <Pressable
              style={styles.docLinkButton}
              onPress={() => Linking.openURL(raceData!.entry_form_url!)}
            >
              <FileText size={16} color={IOS_COLORS.green} />
              <Text style={styles.docLinkText}>Entry Form</Text>
              <ExternalLink size={14} color={IOS_COLORS.blue} />
            </Pressable>
          )}
          {hasEventSite && (
            <Pressable
              style={styles.docLinkButton}
              onPress={() => Linking.openURL(raceData!.event_website!)}
            >
              <ExternalLink size={16} color={IOS_COLORS.blue} />
              <Text style={styles.docLinkText}>Event Website</Text>
              <ExternalLink size={14} color={IOS_COLORS.blue} />
            </Pressable>
          )}
        </View>
      )}

      {/* URL input fields for missing documents */}
      {onSaveUrl && (!hasNor || !hasSi) && (
        <View style={styles.docLinksContainer}>
          {!hasNor && (
            <View style={styles.urlInputRow}>
              <TextInput
                style={styles.urlInput}
                value={norInput}
                onChangeText={setNorInput}
                placeholder="Paste NOR link (https://...)"
                placeholderTextColor={IOS_COLORS.gray}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={() => handleSave('notice_of_race_url', norInput)}
              />
              <Pressable
                style={[
                  styles.urlSaveButton,
                  (!norInput.trim() || savingField === 'notice_of_race_url') && styles.urlSaveButtonDisabled,
                ]}
                onPress={() => handleSave('notice_of_race_url', norInput)}
                disabled={!norInput.trim() || savingField === 'notice_of_race_url'}
              >
                {savingField === 'notice_of_race_url' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.urlSaveButtonText}>Link NOR</Text>
                )}
              </Pressable>
            </View>
          )}
          {!hasSi && (
            <View style={styles.urlInputRow}>
              <TextInput
                style={styles.urlInput}
                value={siInput}
                onChangeText={setSiInput}
                placeholder="Paste SI link (https://...)"
                placeholderTextColor={IOS_COLORS.gray}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={() => handleSave('sailing_instructions_url', siInput)}
              />
              <Pressable
                style={[
                  styles.urlSaveButton,
                  (!siInput.trim() || savingField === 'sailing_instructions_url') && styles.urlSaveButtonDisabled,
                ]}
                onPress={() => handleSave('sailing_instructions_url', siInput)}
                disabled={!siInput.trim() || savingField === 'sailing_instructions_url'}
              >
                {savingField === 'sailing_instructions_url' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.urlSaveButtonText}>Link SI</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// Section header
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

export function PreRaceBriefingWizard({
  item,
  regattaId,
  boatId,
  onComplete,
  onCancel,
  raceName,
  raceDate,
}: PreRaceBriefingWizardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('schedule');
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [raceData, setRaceData] = useState<ExtractedRaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Course layout state
  const [selectedCourseType, setSelectedCourseType] = useState<'windward_leeward' | 'triangle' | 'olympic' | null>(null);
  const [windDirection, setWindDirection] = useState<number>(225); // Default SW
  const [courseTemplates, setCourseTemplates] = useState<CourseTemplate[]>([]);

  // Race preparation hook for persisting schedule & comms data
  const {
    intentions,
    updateIntentions,
    isLoading: isPreparationLoading,
  } = useRacePreparation({ regattaId });

  // Schedule editable state
  const [scheduleData, setScheduleData] = useState({
    numberOfRaces: 0,
    numberOfClasses: 0,
    startOrder: [] as string[],
    myClassStartNumber: undefined as number | undefined,
    classFlag: '',
    socialEvents: [] as Array<{ time: string; event: string; location?: string }>,
    meetAtDockTime: '',
    departDockTime: '',
  });

  // Comms editable state
  const [commsData, setCommsData] = useState<BriefingComms>({});

  // Fetch race data on mount
  useEffect(() => {
    if (!regattaId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchRaceData(regattaId);
        setRaceData(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load race data'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [regattaId]);

  // Sync schedule data from intentions first, then raceData as fallback
  useEffect(() => {
    const saved = intentions?.briefingSchedule;
    if (saved) {
      setScheduleData({
        numberOfRaces: saved.numberOfRaces ?? 0,
        numberOfClasses: saved.numberOfClasses ?? 0,
        startOrder: saved.startOrder ?? [],
        myClassStartNumber: saved.myClassStartNumber,
        classFlag: saved.classFlag ?? '',
        socialEvents: saved.socialEvents ?? [],
        meetAtDockTime: saved.meetAtDockTime ?? '',
        departDockTime: saved.departDockTime ?? '',
      });
    } else if (raceData) {
      setScheduleData({
        numberOfRaces: raceData.number_of_races ?? 0,
        numberOfClasses: raceData.number_of_classes ?? 0,
        startOrder: raceData.start_order ?? [],
        myClassStartNumber: raceData.my_class_start_number,
        classFlag: raceData.class_flag ?? '',
        socialEvents: raceData.social_events ?? [],
        meetAtDockTime: raceData.meet_at_dock_time ?? '',
        departDockTime: raceData.depart_dock_time ?? '',
      });
    }
  }, [raceData, intentions?.briefingSchedule]);

  // Sync comms data from intentions
  useEffect(() => {
    const saved = intentions?.briefingComms;
    if (saved) {
      setCommsData(saved);
    }
  }, [intentions?.briefingComms]);

  // Generate course templates when race data + wind direction available
  useEffect(() => {
    if (!raceData) return;

    const center = getCenterCoordinate(raceData);
    if (!center) return;

    const racingArea = {
      north: center.latitude + 0.01,
      south: center.latitude - 0.01,
      east: center.longitude + 0.01,
      west: center.longitude - 0.01,
      center: { lat: center.latitude, lng: center.longitude },
    };

    const windForecast = {
      direction: windDirection,
      speed: 12,
      time: raceDate || new Date().toISOString(),
      source: 'Manual',
    };

    courseTemplateService
      .generateTemplates(racingArea, windForecast, 'Dragon', windForecast.time)
      .then(setCourseTemplates)
      .catch(() => {});
  }, [raceData, windDirection, raceDate]);

  // Convert selected course template marks to CourseMapView format
  const courseLayoutMarks = useMemo((): CourseMark[] => {
    if (!selectedCourseType || courseTemplates.length === 0) return [];

    const template = courseTemplates.find((t) => t.type === selectedCourseType);
    if (!template) return [];

    return template.marks.map((m, idx) => {
      let markType: CourseMark['type'] = 'mark';
      if (m.type === 'start_pin' || m.type === 'start_boat') markType = 'start';
      else if (m.type === 'finish') markType = 'finish';
      else if (m.type === 'gate') markType = 'gate';

      return {
        id: `layout-${idx}`,
        name: m.name,
        type: markType,
        coordinates: { latitude: m.latitude, longitude: m.longitude },
        color: m.color,
      };
    });
  }, [selectedCourseType, courseTemplates]);

  // Helper to convert degrees to cardinal direction
  const degreesToCardinal = useCallback((degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((degrees % 360) + 360) % 360 / 22.5) % 16;
    return directions[index];
  }, []);

  // Mark section as reviewed
  const markSectionReviewed = useCallback((sectionId: string) => {
    setCompletedSections((prev) => new Set([...prev, sectionId]));
  }, []);

  // Check if current section is reviewed
  const isCurrentSectionReviewed = completedSections.has(activeTab);

  // Can complete when at least one section reviewed (or anytime)
  const canComplete = true; // Allow completion anytime - section tracking is optional

  // Handle tab change
  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
  }, []);

  // Handle complete
  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  }, []);

  // Check if section has data
  const sectionHasData = useCallback(
    (tabId: TabId): boolean => {
      switch (tabId) {
        case 'schedule':
          return !!(
            raceData?.schedule?.length ||
            raceData?.entry_deadline ||
            raceData?.start_date ||
            scheduleData.numberOfRaces ||
            scheduleData.numberOfClasses ||
            scheduleData.startOrder.length ||
            scheduleData.socialEvents.length ||
            scheduleData.meetAtDockTime ||
            scheduleData.departDockTime
          );
        case 'course':
          return !!(
            raceData?.start_area_name ||
            raceData?.prohibited_areas?.length ||
            raceData?.route_waypoints?.length ||
            raceData?.tide_gates?.length
          );
        case 'requirements':
          return !!(
            raceData?.entry_fees?.length ||
            raceData?.minimum_crew ||
            raceData?.crew_requirements ||
            raceData?.safety_requirements
          );
        case 'comms':
          return !!(
            raceData?.vhf_channels?.length ||
            raceData?.vhf_channel ||
            raceData?.organizing_authority ||
            raceData?.contact_email ||
            commsData.safetyChannel ||
            commsData.roPhone ||
            commsData.whatsAppGroup ||
            commsData.backupChannel
          );
        case 'scoring':
          return !!(
            raceData?.scoring_formula ||
            raceData?.handicap_systems?.length ||
            raceData?.prizes_description
          );
        default:
          return false;
      }
    },
    [raceData, scheduleData]
  );

  // Save a document URL to the regattas table and update local state
  const handleSaveDocUrl = useCallback(async (
    field: 'notice_of_race_url' | 'sailing_instructions_url',
    url: string,
  ) => {
    if (!regattaId || DemoRaceService.isDemoRace(regattaId)) return;
    const { error: updateError } = await supabase
      .from('regattas')
      .update({ [field]: url })
      .eq('id', regattaId);

    if (updateError) {
      console.error('[PreRaceBriefingWizard] Failed to save document URL:', updateError);
      return;
    }
    // Update local state so the link appears immediately
    setRaceData(prev => prev ? { ...prev, [field]: url } : prev);
  }, [regattaId]);

  // Debounced save for schedule and comms data
  const scheduleSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commsSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistSchedule = useCallback((data: typeof scheduleData) => {
    if (scheduleSaveTimerRef.current) clearTimeout(scheduleSaveTimerRef.current);
    scheduleSaveTimerRef.current = setTimeout(() => {
      const briefingSchedule: BriefingSchedule = {
        meetAtDockTime: data.meetAtDockTime || undefined,
        departDockTime: data.departDockTime || undefined,
        numberOfRaces: data.numberOfRaces || undefined,
        numberOfClasses: data.numberOfClasses || undefined,
        startOrder: data.startOrder.length > 0 ? data.startOrder : undefined,
        myClassStartNumber: data.myClassStartNumber,
        classFlag: data.classFlag || undefined,
        socialEvents: data.socialEvents.length > 0 ? data.socialEvents : undefined,
      };
      updateIntentions({ briefingSchedule });
    }, 800);
  }, [updateIntentions]);

  const persistComms = useCallback((data: BriefingComms) => {
    if (commsSaveTimerRef.current) clearTimeout(commsSaveTimerRef.current);
    commsSaveTimerRef.current = setTimeout(() => {
      updateIntentions({ briefingComms: data });
    }, 800);
  }, [updateIntentions]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (scheduleSaveTimerRef.current) clearTimeout(scheduleSaveTimerRef.current);
      if (commsSaveTimerRef.current) clearTimeout(commsSaveTimerRef.current);
    };
  }, []);

  // Schedule helpers
  const updateScheduleField = useCallback(<K extends keyof typeof scheduleData>(
    field: K,
    value: (typeof scheduleData)[K]
  ) => {
    setScheduleData(prev => {
      const next = { ...prev, [field]: value };
      persistSchedule(next);
      return next;
    });
  }, [persistSchedule]);

  const addStartOrderItem = useCallback(() => {
    setScheduleData(prev => {
      const next = { ...prev, startOrder: [...prev.startOrder, ''] };
      persistSchedule(next);
      return next;
    });
  }, [persistSchedule]);

  const removeStartOrderItem = useCallback((index: number) => {
    setScheduleData(prev => {
      const next = {
        ...prev,
        startOrder: prev.startOrder.filter((_, i) => i !== index),
        myClassStartNumber:
          prev.myClassStartNumber !== undefined && prev.myClassStartNumber > index + 1
            ? prev.myClassStartNumber - 1
            : prev.myClassStartNumber === index + 1
              ? undefined
              : prev.myClassStartNumber,
      };
      persistSchedule(next);
      return next;
    });
  }, [persistSchedule]);

  const updateStartOrderItem = useCallback((index: number, value: string) => {
    setScheduleData(prev => {
      const next = {
        ...prev,
        startOrder: prev.startOrder.map((item, i) => (i === index ? value : item)),
      };
      persistSchedule(next);
      return next;
    });
  }, [persistSchedule]);

  const addSocialEvent = useCallback(() => {
    setScheduleData(prev => {
      const next = {
        ...prev,
        socialEvents: [...prev.socialEvents, { time: '', event: '' }],
      };
      persistSchedule(next);
      return next;
    });
  }, [persistSchedule]);

  const removeSocialEvent = useCallback((index: number) => {
    setScheduleData(prev => {
      const next = {
        ...prev,
        socialEvents: prev.socialEvents.filter((_, i) => i !== index),
      };
      persistSchedule(next);
      return next;
    });
  }, [persistSchedule]);

  const updateSocialEvent = useCallback((index: number, field: 'time' | 'event' | 'location', value: string) => {
    setScheduleData(prev => {
      const next = {
        ...prev,
        socialEvents: prev.socialEvents.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        ),
      };
      persistSchedule(next);
      return next;
    });
  }, [persistSchedule]);

  // Comms helpers
  const updateCommsField = useCallback(<K extends keyof BriefingComms>(
    field: K,
    value: BriefingComms[K]
  ) => {
    setCommsData(prev => {
      const next = { ...prev, [field]: value };
      persistComms(next);
      return next;
    });
  }, [persistComms]);

  // Render Schedule tab
  const renderScheduleTab = () => {
    const hasAnyData = raceData || scheduleData.numberOfRaces || scheduleData.meetAtDockTime;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer} showsVerticalScrollIndicator={false}>
        {/* Race Day Timeline */}
        <SectionHeader title="Race Day Timeline" />
        <DataCard>
          {raceData?.start_date && (
            <DataField
              icon={<Calendar size={16} color={IOS_COLORS.blue} />}
              label="Race Date"
              value={formatDate(raceData.start_date)}
            />
          )}

          {/* Meet at Dock - editable */}
          <View style={styles.editableRow}>
            <View style={styles.dataFieldIcon}>
              <Anchor size={16} color={IOS_COLORS.green} />
            </View>
            <View style={styles.editableRowContent}>
              <Text style={styles.dataFieldLabel}>Meet at Dock</Text>
              <TextInput
                style={[
                  styles.timeInput,
                  !scheduleData.meetAtDockTime && styles.timeInputEmpty,
                ]}
                value={scheduleData.meetAtDockTime}
                onChangeText={(v) => updateScheduleField('meetAtDockTime', v)}
                placeholder="e.g. 08:30"
                placeholderTextColor={IOS_COLORS.gray}
                keyboardType="numbers-and-punctuation"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Depart to Race Area - editable */}
          <View style={styles.editableRow}>
            <View style={styles.dataFieldIcon}>
              <Navigation size={16} color={IOS_COLORS.blue} />
            </View>
            <View style={styles.editableRowContent}>
              <Text style={styles.dataFieldLabel}>Depart to Race Area</Text>
              <TextInput
                style={[
                  styles.timeInput,
                  !scheduleData.departDockTime && styles.timeInputEmpty,
                ]}
                value={scheduleData.departDockTime}
                onChangeText={(v) => updateScheduleField('departDockTime', v)}
                placeholder="e.g. 09:00"
                placeholderTextColor={IOS_COLORS.gray}
                keyboardType="numbers-and-punctuation"
                returnKeyType="done"
              />
            </View>
          </View>

          {raceData?.entry_deadline && (
            <DataField
              icon={<Clock size={16} color={IOS_COLORS.orange} />}
              label="Entry Deadline"
              value={formatDate(raceData.entry_deadline)}
            />
          )}
        </DataCard>

        {/* Racing Format */}
        <SectionHeader title="Racing Format" />
        <DataCard>
          {/* Number of Races */}
          <View style={styles.editableRow}>
            <View style={styles.dataFieldIcon}>
              <Flag size={16} color={IOS_COLORS.purple} />
            </View>
            <View style={styles.editableRowContent}>
              <Text style={styles.dataFieldLabel}>Number of Races</Text>
              <TextInput
                style={[
                  styles.numberInput,
                  !scheduleData.numberOfRaces && styles.numberInputEmpty,
                ]}
                value={scheduleData.numberOfRaces ? String(scheduleData.numberOfRaces) : ''}
                onChangeText={(v) => {
                  const n = parseInt(v, 10);
                  updateScheduleField('numberOfRaces', isNaN(n) ? 0 : n);
                }}
                placeholder="0"
                placeholderTextColor={IOS_COLORS.gray}
                keyboardType="number-pad"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Number of Classes */}
          <View style={styles.editableRow}>
            <View style={styles.dataFieldIcon}>
              <Hash size={16} color={IOS_COLORS.blue} />
            </View>
            <View style={styles.editableRowContent}>
              <Text style={styles.dataFieldLabel}>Number of Classes</Text>
              <TextInput
                style={[
                  styles.numberInput,
                  !scheduleData.numberOfClasses && styles.numberInputEmpty,
                ]}
                value={scheduleData.numberOfClasses ? String(scheduleData.numberOfClasses) : ''}
                onChangeText={(v) => {
                  const n = parseInt(v, 10);
                  updateScheduleField('numberOfClasses', isNaN(n) ? 0 : n);
                }}
                placeholder="0"
                placeholderTextColor={IOS_COLORS.gray}
                keyboardType="number-pad"
                returnKeyType="done"
              />
            </View>
          </View>

          {raceData?.time_limit_hours && (
            <DataField
              icon={<Clock size={16} color={IOS_COLORS.red} />}
              label="Time Limit"
              value={`${raceData.time_limit_hours} hours`}
            />
          )}
        </DataCard>

        {/* Your Start */}
        <SectionHeader title="Your Start" />
        <DataCard>
          {/* Start Order List */}
          <View style={styles.editableListSection}>
            <View style={styles.editableListHeader}>
              <Text style={styles.editableListTitle}>Start Order</Text>
              <Pressable style={styles.addButton} onPress={addStartOrderItem}>
                <Plus size={16} color={IOS_COLORS.blue} />
                <Text style={styles.addButtonText}>Add Class</Text>
              </Pressable>
            </View>
            {scheduleData.startOrder.length === 0 && (
              <Text style={styles.editableListPlaceholder}>
                Tap "Add Class" to list start order
              </Text>
            )}
            {scheduleData.startOrder.map((className, idx) => (
              <View key={idx} style={styles.listItemRow}>
                <Text style={styles.listItemNumber}>{idx + 1}.</Text>
                <TextInput
                  style={styles.listItemInput}
                  value={className}
                  onChangeText={(v) => updateStartOrderItem(idx, v)}
                  placeholder="Class name"
                  placeholderTextColor={IOS_COLORS.gray}
                  returnKeyType="done"
                />
                {scheduleData.myClassStartNumber === idx + 1 && (
                  <View style={styles.myStartBadge}>
                    <Text style={styles.myStartBadgeText}>YOU</Text>
                  </View>
                )}
                <Pressable
                  style={styles.listItemDelete}
                  onPress={() => removeStartOrderItem(idx)}
                >
                  <Trash2 size={16} color={IOS_COLORS.red} />
                </Pressable>
              </View>
            ))}
          </View>

          {/* Your Class Start Number */}
          {scheduleData.startOrder.length > 0 && (
            <View style={styles.editableRow}>
              <View style={styles.dataFieldIcon}>
                <Sailboat size={16} color={IOS_COLORS.green} />
              </View>
              <View style={styles.editableRowContent}>
                <Text style={styles.dataFieldLabel}>Your Start (Number)</Text>
                <TextInput
                  style={[
                    styles.numberInput,
                    !scheduleData.myClassStartNumber && styles.numberInputEmpty,
                  ]}
                  value={
                    scheduleData.myClassStartNumber
                      ? String(scheduleData.myClassStartNumber)
                      : ''
                  }
                  onChangeText={(v) => {
                    const n = parseInt(v, 10);
                    updateScheduleField(
                      'myClassStartNumber',
                      isNaN(n) || n < 1 ? undefined : n
                    );
                  }}
                  placeholder="e.g. 3"
                  placeholderTextColor={IOS_COLORS.gray}
                  keyboardType="number-pad"
                  returnKeyType="done"
                />
              </View>
            </View>
          )}

          {/* Class Flag */}
          <View style={styles.editableRow}>
            <View style={styles.dataFieldIcon}>
              <Flag size={16} color={IOS_COLORS.orange} />
            </View>
            <View style={styles.editableRowContent}>
              <Text style={styles.dataFieldLabel}>Class Flag</Text>
              <TextInput
                style={[
                  styles.inlineInput,
                  !scheduleData.classFlag && styles.inlineInputEmpty,
                ]}
                value={scheduleData.classFlag}
                onChangeText={(v) => updateScheduleField('classFlag', v)}
                placeholder="e.g. Blue flag with white stripe"
                placeholderTextColor={IOS_COLORS.gray}
                returnKeyType="done"
              />
            </View>
          </View>
        </DataCard>

        {/* Social & Awards */}
        <SectionHeader title="Social & Awards" />
        <DataCard>
          <View style={styles.editableListSection}>
            <View style={styles.editableListHeader}>
              <Text style={styles.editableListTitle}>Events</Text>
              <Pressable style={styles.addButton} onPress={addSocialEvent}>
                <Plus size={16} color={IOS_COLORS.blue} />
                <Text style={styles.addButtonText}>Add Event</Text>
              </Pressable>
            </View>
            {scheduleData.socialEvents.length === 0 && (
              <Text style={styles.editableListPlaceholder}>
                Add social events, awards ceremony, prizegiving
              </Text>
            )}
            {scheduleData.socialEvents.map((socialEvent, idx) => (
              <View key={idx} style={styles.socialEventRow}>
                <View style={styles.socialEventFields}>
                  <TextInput
                    style={styles.socialEventTimeInput}
                    value={socialEvent.time}
                    onChangeText={(v) => updateSocialEvent(idx, 'time', v)}
                    placeholder="Time"
                    placeholderTextColor={IOS_COLORS.gray}
                    keyboardType="numbers-and-punctuation"
                    returnKeyType="next"
                  />
                  <TextInput
                    style={styles.socialEventNameInput}
                    value={socialEvent.event}
                    onChangeText={(v) => updateSocialEvent(idx, 'event', v)}
                    placeholder="Event name"
                    placeholderTextColor={IOS_COLORS.gray}
                    returnKeyType="done"
                  />
                </View>
                <Pressable
                  style={styles.listItemDelete}
                  onPress={() => removeSocialEvent(idx)}
                >
                  <Trash2 size={16} color={IOS_COLORS.red} />
                </Pressable>
              </View>
            ))}
          </View>
        </DataCard>

        {/* Original Schedule Events (read-only, from extracted data) */}
        {raceData?.schedule && raceData.schedule.length > 0 && (
          <>
            <SectionHeader title="Extracted Schedule" />
            <DataCard>
              {raceData.schedule.map((event, idx) => (
                <DataField
                  key={idx}
                  icon={<Calendar size={16} color={idx === 0 ? IOS_COLORS.purple : IOS_COLORS.gray} />}
                  label={`${event.date}${event.time ? ` ${event.time}` : ''}`}
                  value={`${event.event}${event.mandatory ? ' (MANDATORY)' : ''}`}
                />
              ))}
            </DataCard>
          </>
        )}
      </ScrollView>
    );
  };

  // Course type options for the picker
  const COURSE_TYPE_OPTIONS = [
    {
      type: 'windward_leeward' as const,
      label: 'W/L',
      name: 'Windward / Leeward',
      icon: Sailboat,
    },
    {
      type: 'triangle' as const,
      label: 'TRI',
      name: 'Triangle',
      icon: Triangle,
    },
    {
      type: 'olympic' as const,
      label: 'OLY',
      name: 'Olympic / Trapezoid',
      icon: Award,
    },
  ];

  // Wind direction presets
  const WIND_PRESETS = [
    { label: 'N', degrees: 0 },
    { label: 'NE', degrees: 45 },
    { label: 'E', degrees: 90 },
    { label: 'SE', degrees: 135 },
    { label: 'S', degrees: 180 },
    { label: 'SW', degrees: 225 },
    { label: 'W', degrees: 270 },
    { label: 'NW', degrees: 315 },
  ];

  // Render Course tab
  const renderCourseTab = () => {
    if (!raceData) return <EmptySection message="No course data available" />;

    const hasStartInfo = raceData.start_area_name || raceData.start_area_description || raceData.total_distance_nm;

    // Convert race data to map format
    const extractedMarks = convertToMarks(raceData);
    const centerCoordinate = getCenterCoordinate(raceData);

    // Use layout marks if a course type is selected, otherwise extracted marks
    const displayMarks = courseLayoutMarks.length > 0 ? courseLayoutMarks : extractedMarks;
    const hasMapData = displayMarks.length > 0 || centerCoordinate !== undefined;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer} showsVerticalScrollIndicator={false}>
        {/* Course Map - always shown when we have coordinates */}
        {hasMapData && (
          <View style={styles.courseMapContainerLarge}>
            <CourseMapView
              courseMarks={displayMarks}
              centerCoordinate={centerCoordinate}
              compact={true}
            />
          </View>
        )}

        {/* Course Layout Selector */}
        <SectionHeader title="Lay a Course" />
        <DataCard>
          {/* Wind Direction Picker */}
          <View style={styles.windDirectionSection}>
            <View style={styles.windDirectionHeader}>
              <Wind size={16} color={IOS_COLORS.blue} />
              <Text style={styles.windDirectionLabel}>Wind Direction</Text>
              <Text style={styles.windDirectionValue}>
                {Math.round(windDirection)}° {degreesToCardinal(windDirection)}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.windPresetsRow}
            >
              {WIND_PRESETS.map((preset) => {
                const isActive = Math.abs(windDirection - preset.degrees) < 10;
                return (
                  <Pressable
                    key={preset.label}
                    style={[styles.windPresetChip, isActive && styles.windPresetChipActive]}
                    onPress={() => setWindDirection(preset.degrees)}
                  >
                    <Text style={[styles.windPresetText, isActive && styles.windPresetTextActive]}>
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Course Type Picker */}
          <View style={styles.courseTypeSection}>
            <Text style={styles.courseTypeSectionLabel}>Course Type</Text>
            <View style={styles.courseTypeRow}>
              {COURSE_TYPE_OPTIONS.map((option) => {
                const isActive = selectedCourseType === option.type;
                const IconComponent = option.icon;
                return (
                  <Pressable
                    key={option.type}
                    style={[styles.courseTypeCard, isActive && styles.courseTypeCardActive]}
                    onPress={() => setSelectedCourseType(isActive ? null : option.type)}
                  >
                    <IconComponent
                      size={20}
                      color={isActive ? '#FFFFFF' : IOS_COLORS.blue}
                    />
                    <Text style={[styles.courseTypeLabel, isActive && styles.courseTypeLabelActive]}>
                      {option.label}
                    </Text>
                    <Text
                      style={[styles.courseTypeName, isActive && styles.courseTypeNameActive]}
                      numberOfLines={1}
                    >
                      {option.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Selected course template info */}
          {selectedCourseType && courseTemplates.length > 0 && (() => {
            const template = courseTemplates.find((t) => t.type === selectedCourseType);
            if (!template) return null;
            return (
              <View style={styles.courseTemplateInfo}>
                <Text style={styles.courseTemplateDescription}>{template.description}</Text>
                <Text style={styles.courseTemplateMarks}>{template.marks.length} marks</Text>
              </View>
            );
          })()}
        </DataCard>

        {/* Start & Distance Card */}
        {hasStartInfo && (
          <DataCard>
            {raceData.start_area_name && (
              <DataField
                icon={<Flag size={16} color={IOS_COLORS.green} />}
                label="Start Area"
                value={raceData.start_area_name}
              />
            )}
            {raceData.start_area_description && (
              <DataField
                icon={<View style={{ width: 16 }} />}
                label="Start Description"
                value={raceData.start_area_description}
              />
            )}
            {raceData.total_distance_nm && (
              <DataField
                icon={<Navigation size={16} color={IOS_COLORS.blue} />}
                label="Total Distance"
                value={`${raceData.total_distance_nm} nm`}
              />
            )}
          </DataCard>
        )}

        {/* Route Waypoints */}
        {raceData.route_waypoints && raceData.route_waypoints.length > 0 && (
          <>
            <SectionHeader title="Route Waypoints" />
            <DataCard>
              {raceData.route_waypoints.map((wp, idx) => (
                <DataField
                  key={idx}
                  icon={<MapPin size={16} color={IOS_COLORS.blue} />}
                  label={`${idx + 1}. ${wp.type || 'Waypoint'}`}
                  value={wp.name}
                />
              ))}
            </DataCard>
          </>
        )}

        {/* Prohibited Areas */}
        {raceData.prohibited_areas && raceData.prohibited_areas.length > 0 && (
          <>
            <SectionHeader title="Prohibited Areas" />
            <DataCard>
              {raceData.prohibited_areas.map((area, idx) => (
                <DataField
                  key={idx}
                  icon={<AlertTriangle size={16} color={IOS_COLORS.red} />}
                  label={area.name}
                  value={area.description || 'Restricted area'}
                />
              ))}
            </DataCard>
          </>
        )}

        {/* Tide Gates */}
        {raceData.tide_gates && raceData.tide_gates.length > 0 && (
          <>
            <SectionHeader title="Tide Gates" />
            <DataCard>
              {raceData.tide_gates.map((gate, idx) => (
                <DataField
                  key={idx}
                  icon={<Clock size={16} color={IOS_COLORS.purple} />}
                  label={gate.location}
                  value={gate.optimalTime || gate.notes || 'Check tide times'}
                />
              ))}
            </DataCard>
          </>
        )}

        {/* Traffic Separation */}
        {raceData.traffic_separation_schemes && raceData.traffic_separation_schemes.length > 0 && (
          <>
            <SectionHeader title="Traffic Separation Schemes" />
            <DataCard>
              {raceData.traffic_separation_schemes.map((scheme, idx) => (
                <DataField
                  key={idx}
                  icon={<Ship size={16} color={IOS_COLORS.orange} />}
                  label="TSS"
                  value={scheme}
                />
              ))}
            </DataCard>
          </>
        )}

        {!sectionHasData('course') && !selectedCourseType && (
          <DocumentLinksCard raceData={raceData} message="No course data extracted. Link NOR/SI to see course details, or select a course type above." onSaveUrl={handleSaveDocUrl} />
        )}
      </ScrollView>
    );
  };

  // Render Requirements tab
  const renderRequirementsTab = () => {
    if (!raceData) return <EmptySection message="No requirements data available" />;

    const hasCrewInfo = raceData.minimum_crew || raceData.crew_requirements;
    const hasSafetyInfo = raceData.safety_requirements || raceData.insurance_requirements;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer} showsVerticalScrollIndicator={false}>
        {/* Entry Fees */}
        {raceData.entry_fees && raceData.entry_fees.length > 0 && (
          <>
            <SectionHeader title="Entry Fees" />
            <DataCard>
              {raceData.entry_fees.map((fee, idx) => (
                <DataField
                  key={idx}
                  icon={<DollarSign size={16} color={IOS_COLORS.green} />}
                  label={fee.type}
                  value={`${fee.amount}${fee.deadline ? ` (by ${fee.deadline})` : ''}`}
                />
              ))}
            </DataCard>
          </>
        )}

        {/* Crew Requirements Card */}
        {hasCrewInfo && (
          <>
            <SectionHeader title="Crew Requirements" />
            <DataCard>
              {raceData.minimum_crew && (
                <DataField
                  icon={<Users size={16} color={IOS_COLORS.blue} />}
                  label="Minimum Crew"
                  value={String(raceData.minimum_crew)}
                />
              )}
              {raceData.crew_requirements && (
                <DataField
                  icon={<Users size={16} color={IOS_COLORS.purple} />}
                  label="Requirements"
                  value={raceData.crew_requirements}
                />
              )}
            </DataCard>
          </>
        )}

        {/* Safety Requirements Card */}
        {hasSafetyInfo && (
          <>
            <SectionHeader title="Safety & Insurance" />
            <DataCard>
              {raceData.safety_requirements && (
                <DataField
                  icon={<Shield size={16} color={IOS_COLORS.red} />}
                  label="Safety Gear"
                  value={raceData.safety_requirements}
                />
              )}
              {raceData.insurance_requirements && (
                <DataField
                  icon={<Shield size={16} color={IOS_COLORS.orange} />}
                  label="Insurance"
                  value={raceData.insurance_requirements}
                />
              )}
            </DataCard>
          </>
        )}

        {/* Class Rules */}
        {raceData.class_rules && raceData.class_rules.length > 0 && (
          <>
            <SectionHeader title="Class Rules" />
            <DataCard>
              {raceData.class_rules.slice(0, 5).map((rule, idx) => (
                <DataField
                  key={idx}
                  icon={<FileText size={16} color={IOS_COLORS.gray} />}
                  label={`Rule ${idx + 1}`}
                  value={rule}
                />
              ))}
            </DataCard>
          </>
        )}

        {!sectionHasData('requirements') && (
          <DocumentLinksCard raceData={raceData} message="No requirements data extracted. Link NOR/SI to see entry requirements." onSaveUrl={handleSaveDocUrl} />
        )}
      </ScrollView>
    );
  };

  // Render Comms tab
  const renderCommsTab = () => {
    const hasVhf = raceData?.vhf_channels?.length || raceData?.vhf_channel;
    const hasContacts = raceData?.organizing_authority || raceData?.contact_email || raceData?.event_website;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer} showsVerticalScrollIndicator={false}>
        {/* VHF Channels - from extracted race data */}
        {hasVhf && (
          <>
            <SectionHeader title="VHF Channels" />
            <DataCard>
              {raceData?.vhf_channels?.map((ch, idx) => (
                <DataField
                  key={idx}
                  icon={<Radio size={16} color={IOS_COLORS.green} />}
                  label={`Ch ${ch.channel}`}
                  value={ch.purpose || 'Race communications'}
                />
              ))}
              {!raceData?.vhf_channels?.length && raceData?.vhf_channel && (
                <DataField
                  icon={<Radio size={16} color={IOS_COLORS.green} />}
                  label="Race Channel"
                  value={`Ch ${raceData.vhf_channel}`}
                />
              )}
            </DataCard>
          </>
        )}

        {/* Your Comms Notes - editable fields */}
        <SectionHeader title="Your Comms Notes" />
        <DataCard>
          {/* Safety / Rescue Channel */}
          <View style={styles.editableRow}>
            <View style={styles.dataFieldIcon}>
              <Shield size={16} color={IOS_COLORS.red} />
            </View>
            <View style={styles.editableRowContent}>
              <Text style={styles.dataFieldLabel}>Safety / Rescue Channel</Text>
              <TextInput
                style={[
                  styles.inlineInput,
                  !commsData.safetyChannel && styles.inlineInputEmpty,
                ]}
                value={commsData.safetyChannel ?? ''}
                onChangeText={(v) => updateCommsField('safetyChannel', v)}
                placeholder="e.g. Ch 16 or Ch 69"
                placeholderTextColor={IOS_COLORS.gray}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Backup VHF Channel */}
          <View style={styles.editableRow}>
            <View style={styles.dataFieldIcon}>
              <Radio size={16} color={IOS_COLORS.orange} />
            </View>
            <View style={styles.editableRowContent}>
              <Text style={styles.dataFieldLabel}>Backup VHF Channel</Text>
              <TextInput
                style={[
                  styles.inlineInput,
                  !commsData.backupChannel && styles.inlineInputEmpty,
                ]}
                value={commsData.backupChannel ?? ''}
                onChangeText={(v) => updateCommsField('backupChannel', v)}
                placeholder="e.g. Ch 72"
                placeholderTextColor={IOS_COLORS.gray}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Race Officer Phone */}
          <View style={styles.editableRow}>
            <View style={styles.dataFieldIcon}>
              <Phone size={16} color={IOS_COLORS.blue} />
            </View>
            <View style={styles.editableRowContent}>
              <Text style={styles.dataFieldLabel}>Race Officer Phone</Text>
              <TextInput
                style={[
                  styles.inlineInput,
                  !commsData.roPhone && styles.inlineInputEmpty,
                ]}
                value={commsData.roPhone ?? ''}
                onChangeText={(v) => updateCommsField('roPhone', v)}
                placeholder="Phone number"
                placeholderTextColor={IOS_COLORS.gray}
                keyboardType="phone-pad"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* WhatsApp Group */}
          <View style={styles.editableRow}>
            <View style={styles.dataFieldIcon}>
              <MessageCircle size={16} color={IOS_COLORS.green} />
            </View>
            <View style={styles.editableRowContent}>
              <Text style={styles.dataFieldLabel}>WhatsApp / Group Chat</Text>
              <TextInput
                style={[
                  styles.inlineInput,
                  !commsData.whatsAppGroup && styles.inlineInputEmpty,
                ]}
                value={commsData.whatsAppGroup ?? ''}
                onChangeText={(v) => updateCommsField('whatsAppGroup', v)}
                placeholder="Group name or invite link"
                placeholderTextColor={IOS_COLORS.gray}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.editableRow}>
            <View style={styles.dataFieldIcon}>
              <FileText size={16} color={IOS_COLORS.gray} />
            </View>
            <View style={styles.editableRowContent}>
              <Text style={styles.dataFieldLabel}>Comms Notes</Text>
              <TextInput
                style={[
                  styles.inlineInput,
                  !commsData.notes && styles.inlineInputEmpty,
                ]}
                value={commsData.notes ?? ''}
                onChangeText={(v) => updateCommsField('notes', v)}
                placeholder="Other comms info..."
                placeholderTextColor={IOS_COLORS.gray}
                multiline
                returnKeyType="done"
              />
            </View>
          </View>
        </DataCard>

        {/* Contact Info Card - from extracted race data */}
        {hasContacts && (
          <>
            <SectionHeader title="Contact Information" />
            <DataCard>
              {raceData?.organizing_authority && (
                <DataField
                  icon={<Users size={16} color={IOS_COLORS.blue} />}
                  label="Organizing Authority"
                  value={raceData.organizing_authority}
                />
              )}
              {raceData?.contact_email && (
                <DataField
                  icon={<FileText size={16} color={IOS_COLORS.purple} />}
                  label="Contact Email"
                  value={raceData.contact_email}
                  url={`mailto:${raceData.contact_email}`}
                />
              )}
              {raceData?.event_website && (
                <DataField
                  icon={<ExternalLink size={16} color={IOS_COLORS.blue} />}
                  label="Event Website"
                  value="Open Website"
                  url={raceData.event_website}
                />
              )}
            </DataCard>
          </>
        )}

        {/* Retirement */}
        {raceData?.retirement_notification && (
          <>
            <SectionHeader title="Retirement Notification" />
            <DataCard>
              <DataField
                icon={<Flag size={16} color={IOS_COLORS.orange} />}
                label="Procedure"
                value={raceData.retirement_notification}
              />
            </DataCard>
          </>
        )}
      </ScrollView>
    );
  };

  // Render Scoring tab
  const renderScoringTab = () => {
    if (!raceData) return <EmptySection message="No scoring data available" />;

    const hasMainScoring = raceData.scoring_formula || (raceData.handicap_systems && raceData.handicap_systems.length > 0);

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer} showsVerticalScrollIndicator={false}>
        {/* Scoring & Handicap Card */}
        {hasMainScoring && (
          <DataCard>
            {raceData.scoring_formula && (
              <DataField
                icon={<Trophy size={16} color={IOS_COLORS.orange} />}
                label="Scoring System"
                value={raceData.scoring_formula}
              />
            )}
            {raceData.handicap_systems && raceData.handicap_systems.length > 0 && (
              <DataField
                icon={<Flag size={16} color={IOS_COLORS.blue} />}
                label="Handicap"
                value={raceData.handicap_systems.join(', ')}
              />
            )}
          </DataCard>
        )}

        {/* Motoring Division */}
        {raceData.motoring_division_available && (
          <>
            <SectionHeader title="Motoring Division" />
            <DataCard>
              <DataField
                icon={<Ship size={16} color={IOS_COLORS.purple} />}
                label="Available"
                value="Yes"
              />
              {raceData.motoring_division_rules && (
                <DataField
                  icon={<View style={{ width: 16 }} />}
                  label="Rules"
                  value={raceData.motoring_division_rules}
                />
              )}
            </DataCard>
          </>
        )}

        {/* Prizes */}
        {raceData.prizes_description && (
          <>
            <SectionHeader title="Prizes" />
            <DataCard>
              <DataField
                icon={<Trophy size={16} color={IOS_COLORS.green} />}
                label="Awards"
                value={raceData.prizes_description}
              />
            </DataCard>
          </>
        )}

        {!sectionHasData('scoring') && (
          <DocumentLinksCard raceData={raceData} message="No scoring data extracted. Link NOR/SI to see scoring details." onSaveUrl={handleSaveDocUrl} />
        )}
      </ScrollView>
    );
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'schedule':
        return renderScheduleTab();
      case 'course':
        return renderCourseTab();
      case 'requirements':
        return renderRequirementsTab();
      case 'comms':
        return renderCommsTab();
      case 'scoring':
        return renderScoringTab();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={onCancel}>
          <X size={24} color={IOS_COLORS.blue} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pre-Race Briefing</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {raceName || raceData?.name || 'Race Documents Review'}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {BRIEFING_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isCompleted = completedSections.has(tab.id);
          const hasData = sectionHasData(tab.id);
          const TabIcon = tab.Icon;

          return (
            <Pressable
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => handleTabChange(tab.id)}
            >
              <View style={styles.tabIconContainer}>
                <TabIcon
                  size={20}
                  color={isActive ? IOS_COLORS.blue : hasData ? IOS_COLORS.gray : IOS_COLORS.gray3}
                />
                {isCompleted && (
                  <View style={styles.tabCheckBadge}>
                    <Check size={10} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                  !hasData && styles.tabLabelEmpty,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={IOS_COLORS.blue} />
            <Text style={styles.loadingText}>Loading race data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <AlertTriangle size={48} color={IOS_COLORS.red} />
            <Text style={styles.errorText}>Failed to load race data</Text>
          </View>
        ) : (
          renderTabContent()
        )}
      </View>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {/* Section Review Button */}
        {!isCurrentSectionReviewed && (
          <Pressable
            style={styles.markReviewedButton}
            onPress={() => markSectionReviewed(activeTab)}
          >
            <Circle size={20} color={IOS_COLORS.blue} />
            <Text style={styles.markReviewedText}>Mark as Reviewed</Text>
          </Pressable>
        )}
        {isCurrentSectionReviewed && (
          <View style={styles.reviewedBadge}>
            <CheckCircle2 size={20} color={IOS_COLORS.green} />
            <Text style={styles.reviewedText}>Section Reviewed</Text>
          </View>
        )}

        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {completedSections.size}/{BRIEFING_TABS.length} sections reviewed
          </Text>
        </View>

        {/* Complete Button */}
        <Pressable
          style={[styles.completeButton, !canComplete && styles.completeButtonDisabled]}
          onPress={handleComplete}
          disabled={!canComplete}
        >
          <Text
            style={[
              styles.completeButtonText,
              !canComplete && styles.completeButtonTextDisabled,
            ]}
          >
            Complete Briefing
          </Text>
        </Pressable>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  closeButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  tabBar: {
    flexShrink: 0,
    flexGrow: 0,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  tabBarContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tab: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    minWidth: 70,
  },
  tabActive: {
    backgroundColor: IOS_COLORS.blue + '15',
  },
  tabIconContainer: {
    position: 'relative',
  },
  tabCheckBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginTop: 4,
  },
  tabLabelActive: {
    color: IOS_COLORS.blue,
  },
  tabLabelEmpty: {
    color: IOS_COLORS.gray3,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  tabContentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    color: IOS_COLORS.red,
  },
  dataCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dataField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  dataFieldLast: {
    borderBottomWidth: 0,
  },
  dataFieldIcon: {
    width: 24,
    marginRight: 12,
    alignItems: 'center',
  },
  dataFieldContent: {
    flex: 1,
  },
  dataFieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dataFieldValue: {
    fontSize: 15,
    color: IOS_COLORS.label,
    marginTop: 2,
  },
  dataFieldLink: {
    color: IOS_COLORS.blue,
  },
  sectionHeader: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  courseMapContainer: {
    height: 200,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: IOS_COLORS.secondaryBackground,
  },
  courseMapContainerLarge: {
    height: 300,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: IOS_COLORS.secondaryBackground,
  },
  windDirectionSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  windDirectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  windDirectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginLeft: 8,
    flex: 1,
  },
  windDirectionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  windPresetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  windPresetChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.background,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
  },
  windPresetChipActive: {
    backgroundColor: IOS_COLORS.blue,
    borderColor: IOS_COLORS.blue,
  },
  windPresetText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  windPresetTextActive: {
    color: '#FFFFFF',
  },
  courseTypeSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  courseTypeSectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  courseTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  courseTypeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.background,
    borderWidth: 1.5,
    borderColor: IOS_COLORS.separator,
  },
  courseTypeCardActive: {
    backgroundColor: IOS_COLORS.blue,
    borderColor: IOS_COLORS.blue,
  },
  courseTypeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  courseTypeLabelActive: {
    color: '#FFFFFF',
  },
  courseTypeName: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  courseTypeNameActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  courseTemplateInfo: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseTemplateDescription: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    flex: 1,
  },
  courseTemplateMarks: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    marginLeft: 8,
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    marginTop: 8,
  },
  emptySectionText: {
    fontSize: 15,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  docLinksContainer: {
    marginTop: 16,
    width: '100%',
    gap: 8,
  },
  docLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.blue + '0D',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.blue + '25',
  },
  docLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.blue,
    marginLeft: 10,
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.label,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.background,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
  },
  urlSaveButton: {
    backgroundColor: IOS_COLORS.blue,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
  },
  urlSaveButtonDisabled: {
    opacity: 0.4,
  },
  urlSaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 0,
  },
  markReviewedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.blue,
    marginBottom: 12,
  },
  markReviewedText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    marginLeft: 8,
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  reviewedText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.green,
    marginLeft: 8,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  completeButton: {
    backgroundColor: IOS_COLORS.blue,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: IOS_COLORS.gray3,
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completeButtonTextDisabled: {
    color: IOS_COLORS.gray,
  },
  // Schedule editable styles
  editableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  editableRowContent: {
    flex: 1,
  },
  timeInput: {
    fontSize: 15,
    color: IOS_COLORS.label,
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.background,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
    minWidth: 100,
    maxWidth: 140,
  },
  timeInputEmpty: {
    borderColor: IOS_COLORS.blue + '40',
    borderStyle: 'dashed' as const,
  },
  numberInput: {
    fontSize: 15,
    color: IOS_COLORS.label,
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.background,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
    minWidth: 60,
    maxWidth: 80,
    textAlign: 'center',
  },
  numberInputEmpty: {
    borderColor: IOS_COLORS.blue + '40',
    borderStyle: 'dashed' as const,
  },
  inlineInput: {
    fontSize: 15,
    color: IOS_COLORS.label,
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.background,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
  },
  inlineInputEmpty: {
    borderColor: IOS_COLORS.blue + '40',
    borderStyle: 'dashed' as const,
  },
  editableListSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  editableListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  editableListTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editableListPlaceholder: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    paddingVertical: 12,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.blue + '12',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    marginLeft: 4,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  listItemNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    width: 24,
  },
  listItemInput: {
    flex: 1,
    fontSize: 15,
    color: IOS_COLORS.label,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.background,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
    marginRight: 8,
  },
  listItemDelete: {
    padding: 6,
  },
  myStartBadge: {
    backgroundColor: IOS_COLORS.green,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
  },
  myStartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  socialEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  socialEventFields: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  socialEventTimeInput: {
    width: 70,
    fontSize: 14,
    color: IOS_COLORS.label,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.background,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
    textAlign: 'center',
  },
  socialEventNameInput: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.label,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.background,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
    marginRight: 8,
  },
});

export default PreRaceBriefingWizard;
