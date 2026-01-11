/**
 * ExtractedDetailsSummary Component
 *
 * Collapsible section showing all extracted details from AI analysis.
 * Displays rich data that doesn't have dedicated form fields.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  ChevronRight,
  ChevronDown,
  Calendar,
  Users,
  AlertTriangle,
  DollarSign,
  Trophy,
  Radio,
  Ship,
  FileText,
  MapPin,
} from 'lucide-react-native';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from './tufteFormStyles';
import { IOS_COLORS } from '@/components/cards/constants';

interface ScheduleEvent {
  date: string;
  time: string;
  event: string;
  location?: string;
  mandatory?: boolean;
}

interface ProhibitedArea {
  name: string;
  description?: string;
}

interface EntryFee {
  type: string;
  amount: string;
  deadline?: string;
}

interface ExtractedDetailsData {
  // Schedule
  schedule?: ScheduleEvent[];

  // Crew
  minimumCrew?: number;
  crewRequirements?: string;
  minorSailorRules?: string;

  // Areas
  prohibitedAreas?: ProhibitedArea[];
  startAreaName?: string;
  finishAreaName?: string;

  // Entry
  entryFees?: EntryFee[];
  entryDeadline?: string;
  entryFormUrl?: string;

  // Scoring
  scoringFormulaDescription?: string;
  handicapSystem?: string[];

  // Motoring
  motoringDivisionAvailable?: boolean;
  motoringDivisionRules?: string;

  // Communications
  vhfChannels?: Array<{ channel: string; purpose?: string }>;

  // Organization
  organizingAuthority?: string;
  eventWebsite?: string;
  contactEmail?: string;

  // Safety
  classRules?: string[];
  eligibilityRequirements?: string;
}

export interface ExtractedDetailsSummaryProps {
  /** Extracted data from AI */
  data: ExtractedDetailsData | null;
  /** Whether the section is expanded */
  expanded?: boolean;
}

export function ExtractedDetailsSummary({ data, expanded: initialExpanded = false }: ExtractedDetailsSummaryProps) {
  const [expanded, setExpanded] = useState(initialExpanded);

  console.log('[ExtractedDetailsSummary] Rendering with data:', data ? 'present' : 'null');

  if (!data) {
    console.log('[ExtractedDetailsSummary] Data is null, returning null');
    return null;
  }

  console.log('[ExtractedDetailsSummary] Data keys:', Object.keys(data));
  console.log('[ExtractedDetailsSummary] schedule:', data.schedule?.length);
  console.log('[ExtractedDetailsSummary] minimumCrew:', data.minimumCrew);
  console.log('[ExtractedDetailsSummary] prohibitedAreas:', data.prohibitedAreas?.length);
  console.log('[ExtractedDetailsSummary] entryFees:', data.entryFees?.length);
  console.log('[ExtractedDetailsSummary] scoringFormulaDescription:', data.scoringFormulaDescription ? 'present' : 'missing');

  // Count how many detail categories have data
  const detailCount = [
    data.schedule?.length,
    data.minimumCrew || data.crewRequirements,
    data.prohibitedAreas?.length,
    data.entryFees?.length,
    data.scoringFormulaDescription,
    data.motoringDivisionAvailable,
    data.classRules?.length,
  ].filter(Boolean).length;

  console.log('[ExtractedDetailsSummary] detailCount:', detailCount);

  if (detailCount === 0) {
    console.log('[ExtractedDetailsSummary] detailCount is 0, returning null');
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerLeft}>
          <FileText size={16} color={IOS_COLORS.blue} />
          <Text style={styles.headerLabel}>EXTRACTED DETAILS</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{detailCount}</Text>
          </View>
        </View>
        {expanded ? (
          <ChevronDown size={20} color={TUFTE_FORM_COLORS.secondaryLabel} />
        ) : (
          <ChevronRight size={20} color={TUFTE_FORM_COLORS.secondaryLabel} />
        )}
      </Pressable>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.content}>
          {/* Schedule */}
          {data.schedule && data.schedule.length > 0 && (
            <DetailSection
              icon={<Calendar size={16} color={IOS_COLORS.orange} />}
              title="Schedule"
            >
              {data.schedule.map((event, i) => (
                <View key={i} style={styles.scheduleItem}>
                  <Text style={styles.scheduleDate}>
                    {event.date} {event.time}
                  </Text>
                  <Text style={styles.scheduleEvent}>
                    {event.event}
                    {event.mandatory && (
                      <Text style={styles.mandatory}> [MANDATORY]</Text>
                    )}
                  </Text>
                  {event.location && (
                    <Text style={styles.scheduleLocation}>{event.location}</Text>
                  )}
                </View>
              ))}
            </DetailSection>
          )}

          {/* Crew Requirements */}
          {(data.minimumCrew || data.crewRequirements || data.minorSailorRules) && (
            <DetailSection
              icon={<Users size={16} color={IOS_COLORS.purple} />}
              title="Crew Requirements"
            >
              {data.minimumCrew && (
                <Text style={styles.detailText}>
                  Minimum crew: <Text style={styles.highlight}>{data.minimumCrew}</Text>
                </Text>
              )}
              {data.crewRequirements && (
                <Text style={styles.detailText}>{data.crewRequirements}</Text>
              )}
              {data.minorSailorRules && (
                <Text style={styles.detailTextSecondary}>Under 18: {data.minorSailorRules}</Text>
              )}
            </DetailSection>
          )}

          {/* Prohibited Areas */}
          {data.prohibitedAreas && data.prohibitedAreas.length > 0 && (
            <DetailSection
              icon={<AlertTriangle size={16} color={IOS_COLORS.red} />}
              title={`Prohibited Areas (${data.prohibitedAreas.length})`}
            >
              {data.prohibitedAreas.map((area, i) => (
                <Text key={i} style={styles.listItem}>
                  • {area.name}
                  {area.description && area.description !== 'Out of bounds' && (
                    <Text style={styles.listItemNote}> ({area.description})</Text>
                  )}
                </Text>
              ))}
            </DetailSection>
          )}

          {/* Entry Fees */}
          {data.entryFees && data.entryFees.length > 0 && (
            <DetailSection
              icon={<DollarSign size={16} color={IOS_COLORS.green} />}
              title="Entry Fees"
            >
              {data.entryFees.map((fee, i) => (
                <Text key={i} style={styles.detailText}>
                  {fee.type}: <Text style={styles.highlight}>{fee.amount}</Text>
                  {fee.deadline && <Text style={styles.listItemNote}> (by {fee.deadline})</Text>}
                </Text>
              ))}
              {data.entryDeadline && (
                <Text style={styles.detailTextSecondary}>
                  Entry deadline: {data.entryDeadline}
                </Text>
              )}
            </DetailSection>
          )}

          {/* Scoring */}
          {data.scoringFormulaDescription && (
            <DetailSection
              icon={<Trophy size={16} color={IOS_COLORS.yellow} />}
              title="Scoring"
            >
              <Text style={styles.detailText}>{data.scoringFormulaDescription}</Text>
              {data.handicapSystem && data.handicapSystem.length > 0 && (
                <Text style={styles.detailTextSecondary}>
                  Handicap: {data.handicapSystem.join(', ')}
                </Text>
              )}
            </DetailSection>
          )}

          {/* Motoring Division */}
          {data.motoringDivisionAvailable && (
            <DetailSection
              icon={<Ship size={16} color={IOS_COLORS.teal} />}
              title="Motoring Division"
            >
              <Text style={styles.detailText}>
                {data.motoringDivisionRules || 'Available - see sailing instructions'}
              </Text>
            </DetailSection>
          )}

          {/* Start/Finish Areas */}
          {(data.startAreaName || data.finishAreaName) && (
            <DetailSection
              icon={<MapPin size={16} color={IOS_COLORS.blue} />}
              title="Course Areas"
            >
              {data.startAreaName && (
                <Text style={styles.detailText}>Start: {data.startAreaName}</Text>
              )}
              {data.finishAreaName && (
                <Text style={styles.detailText}>Finish: {data.finishAreaName}</Text>
              )}
            </DetailSection>
          )}

          {/* Safety & Rules */}
          {data.classRules && data.classRules.length > 0 && (
            <DetailSection
              icon={<FileText size={16} color={TUFTE_FORM_COLORS.secondaryLabel} />}
              title="Rules & Requirements"
            >
              {data.classRules.map((rule, i) => (
                <Text key={i} style={styles.listItem}>• {rule}</Text>
              ))}
              {data.eligibilityRequirements && (
                <Text style={styles.detailTextSecondary}>
                  Eligibility: {data.eligibilityRequirements}
                </Text>
              )}
            </DetailSection>
          )}

          {/* Contact & Links */}
          {(data.organizingAuthority || data.eventWebsite || data.contactEmail) && (
            <DetailSection
              icon={<Radio size={16} color={TUFTE_FORM_COLORS.secondaryLabel} />}
              title="Contact"
            >
              {data.organizingAuthority && (
                <Text style={styles.detailText}>{data.organizingAuthority}</Text>
              )}
              {data.eventWebsite && (
                <Text style={styles.linkText}>{data.eventWebsite}</Text>
              )}
              {data.contactEmail && (
                <Text style={styles.linkText}>{data.contactEmail}</Text>
              )}
            </DetailSection>
          )}
        </View>
      )}
    </View>
  );
}

// Helper component for detail sections
function DetailSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: TUFTE_FORM_SPACING.lg,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.sectionLabel,
    letterSpacing: 1.2,
  },
  badge: {
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.label,
  },
  sectionContent: {
    paddingLeft: 24,
    gap: 4,
  },
  scheduleItem: {
    marginBottom: 8,
  },
  scheduleDate: {
    fontSize: 12,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  scheduleEvent: {
    fontSize: 14,
    color: TUFTE_FORM_COLORS.label,
  },
  scheduleLocation: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
  mandatory: {
    color: IOS_COLORS.red,
    fontWeight: '600',
    fontSize: 11,
  },
  detailText: {
    fontSize: 14,
    color: TUFTE_FORM_COLORS.label,
    lineHeight: 20,
  },
  detailTextSecondary: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.secondaryLabel,
    lineHeight: 18,
    marginTop: 4,
  },
  highlight: {
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  listItem: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.label,
    lineHeight: 20,
  },
  listItemNote: {
    color: TUFTE_FORM_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
  linkText: {
    fontSize: 13,
    color: IOS_COLORS.blue,
    lineHeight: 20,
  },
});

export default ExtractedDetailsSummary;
