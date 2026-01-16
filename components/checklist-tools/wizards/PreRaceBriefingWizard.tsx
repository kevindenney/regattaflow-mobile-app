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

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
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
} from 'lucide-react-native';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';
import { supabase } from '@/services/supabase';
import { DemoRaceService } from '@/services/DemoRaceService';

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
  // Schedule
  schedule?: Array<{
    date: string;
    time: string;
    event: string;
    location?: string;
    mandatory?: boolean;
  }>;
  entry_deadline?: string;
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

// Helper to fetch race data with extracted details
async function fetchRaceData(raceEventId: string): Promise<ExtractedRaceData | null> {
  // Check if this is a demo race
  if (DemoRaceService.isDemoRace(raceEventId)) {
    const demoRace = DemoRaceService.getDemoRaceById(raceEventId);
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
        route_waypoints
      `)
      .eq('id', raceEventId)
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
  raceEventId,
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

  // Fetch race data on mount
  useEffect(() => {
    if (!raceEventId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchRaceData(raceEventId);
        setRaceData(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load race data'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [raceEventId]);

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
      if (!raceData) return false;

      switch (tabId) {
        case 'schedule':
          return !!(
            raceData.schedule?.length ||
            raceData.entry_deadline ||
            raceData.start_date
          );
        case 'course':
          return !!(
            raceData.start_area_name ||
            raceData.prohibited_areas?.length ||
            raceData.route_waypoints?.length ||
            raceData.tide_gates?.length
          );
        case 'requirements':
          return !!(
            raceData.entry_fees?.length ||
            raceData.minimum_crew ||
            raceData.crew_requirements ||
            raceData.safety_requirements
          );
        case 'comms':
          return !!(
            raceData.vhf_channels?.length ||
            raceData.vhf_channel ||
            raceData.organizing_authority ||
            raceData.contact_email
          );
        case 'scoring':
          return !!(
            raceData.scoring_formula ||
            raceData.handicap_systems?.length ||
            raceData.prizes_description
          );
        default:
          return false;
      }
    },
    [raceData]
  );

  // Render Schedule tab
  const renderScheduleTab = () => {
    if (!raceData) return <EmptySection message="No schedule data available" />;

    const hasKeyDates = raceData.start_date || raceData.entry_deadline || raceData.time_limit_hours;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer} showsVerticalScrollIndicator={false}>
        {/* Key Dates Card */}
        {hasKeyDates && (
          <DataCard>
            {raceData.start_date && (
              <DataField
                icon={<Calendar size={16} color={IOS_COLORS.blue} />}
                label="Race Date"
                value={formatDate(raceData.start_date)}
              />
            )}
            {raceData.entry_deadline && (
              <DataField
                icon={<Clock size={16} color={IOS_COLORS.orange} />}
                label="Entry Deadline"
                value={formatDate(raceData.entry_deadline)}
              />
            )}
            {raceData.time_limit_hours && (
              <DataField
                icon={<Clock size={16} color={IOS_COLORS.red} />}
                label="Time Limit"
                value={`${raceData.time_limit_hours} hours`}
              />
            )}
          </DataCard>
        )}

        {/* Schedule Events */}
        {raceData.schedule && raceData.schedule.length > 0 && (
          <>
            <SectionHeader title="Event Schedule" />
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

        {!sectionHasData('schedule') && (
          <EmptySection message="No schedule data extracted. Upload NOR/SI to see schedule details." />
        )}
      </ScrollView>
    );
  };

  // Render Course tab
  const renderCourseTab = () => {
    if (!raceData) return <EmptySection message="No course data available" />;

    const hasStartInfo = raceData.start_area_name || raceData.start_area_description || raceData.total_distance_nm;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer} showsVerticalScrollIndicator={false}>
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

        {!sectionHasData('course') && (
          <EmptySection message="No course data extracted. Upload NOR/SI to see course details." />
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
          <EmptySection message="No requirements data extracted. Upload NOR/SI to see entry requirements." />
        )}
      </ScrollView>
    );
  };

  // Render Comms tab
  const renderCommsTab = () => {
    if (!raceData) return <EmptySection message="No communications data available" />;

    const hasVhf = raceData.vhf_channels?.length || raceData.vhf_channel;
    const hasContacts = raceData.organizing_authority || raceData.contact_email || raceData.event_website;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer} showsVerticalScrollIndicator={false}>
        {/* VHF Channels */}
        {hasVhf && (
          <>
            <SectionHeader title="VHF Channels" />
            <DataCard>
              {raceData.vhf_channels?.map((ch, idx) => (
                <DataField
                  key={idx}
                  icon={<Radio size={16} color={IOS_COLORS.green} />}
                  label={`Ch ${ch.channel}`}
                  value={ch.purpose || 'Race communications'}
                />
              ))}
              {!raceData.vhf_channels?.length && raceData.vhf_channel && (
                <DataField
                  icon={<Radio size={16} color={IOS_COLORS.green} />}
                  label="Race Channel"
                  value={`Ch ${raceData.vhf_channel}`}
                />
              )}
            </DataCard>
          </>
        )}

        {/* Contact Info Card */}
        {hasContacts && (
          <>
            <SectionHeader title="Contact Information" />
            <DataCard>
              {raceData.organizing_authority && (
                <DataField
                  icon={<Users size={16} color={IOS_COLORS.blue} />}
                  label="Organizing Authority"
                  value={raceData.organizing_authority}
                />
              )}
              {raceData.contact_email && (
                <DataField
                  icon={<FileText size={16} color={IOS_COLORS.purple} />}
                  label="Contact Email"
                  value={raceData.contact_email}
                  url={`mailto:${raceData.contact_email}`}
                />
              )}
              {raceData.event_website && (
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
        {raceData.retirement_notification && (
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

        {!sectionHasData('comms') && (
          <EmptySection message="No communications data extracted. Upload NOR/SI to see contact details." />
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
          <EmptySection message="No scoring data extracted. Upload NOR/SI to see scoring details." />
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
});

export default PreRaceBriefingWizard;
