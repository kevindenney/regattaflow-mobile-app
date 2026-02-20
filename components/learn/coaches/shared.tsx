/**
 * Shared sub-components for the Coaches views
 *
 * Extracted from the original CoachesContent.tsx monolith so that
 * SailorDiscoveryView, SailorCoachDashboard, and CoachModeView can
 * all reuse the same building blocks.
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { format } from 'date-fns';
import { IOS_COLORS } from '@/components/cards/constants';
import { TufteTokens } from '@/constants/designSystem';
import type { CoachingSession } from '@/services/CoachingService';

// ─── Types ──────────────────────────────────────────────────────────────────

export type DashboardMetric = {
  label: string;
  value: string;
  helper: string;
};

export type FeedbackItem = {
  id: string;
  coach: string;
  sailor: string;
  sessionType: string;
  summary: string;
  rating: number;
  date: string;
};

export type ResourceItem = {
  id: string;
  title: string;
  category: string;
  readTime: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export const sessionScheduledDate = (session: CoachingSession) => {
  if (session.scheduled_at) return new Date(session.scheduled_at);
  if (session.start_time) return new Date(session.start_time);
  if ((session as any).session_date) return new Date((session as any).session_date);
  return new Date();
};

export const sessionCompletedDate = (session: CoachingSession) => {
  if (session.completed_at) return new Date(session.completed_at);
  if ((session as any).updated_at) return new Date((session as any).updated_at);
  return sessionScheduledDate(session);
};

export const formatSessionType = (type: string) => {
  const mapping: Record<string, string> = {
    on_water: 'On-Water Training',
    video_review: 'Video Review',
    strategy: 'Race Strategy',
    boat_setup: 'Boat Setup',
    fitness: 'Fitness Coaching',
    mental_coaching: 'Mental Coaching',
    one_on_one: 'One-on-One',
    group: 'Group Session',
    race_debrief: 'Race Debrief',
  };
  return mapping[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
};

// ─── Mock Data ──────────────────────────────────────────────────────────────

export const MOCK_SESSIONS: CoachingSession[] = [
  {
    id: 'mock-session-1',
    coach_id: 'coach_emily',
    sailor_id: 'sailor_ava',
    session_type: 'strategy',
    duration_minutes: 75,
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
    status: 'confirmed',
    location_notes: 'Royal HKYC \u00B7 Dock C',
    focus_areas: ['start_line', 'wind_shifts', 'mark_rounding'],
    goals: 'Build pre-start routine for oscillating breeze',
    currency: 'USD',
    paid: true,
    fee_amount: 22000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    coach: {
      id: 'coach_emily',
      display_name: 'Emily Carter',
      profile_photo_url: null,
    },
  },
  {
    id: 'mock-session-2',
    coach_id: 'coach_luke',
    sailor_id: 'sailor_mateo',
    session_type: 'video_review',
    duration_minutes: 60,
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 54).toISOString(),
    status: 'scheduled',
    location_notes: 'Zoom',
    focus_areas: ['downwind_modes', 'overtaking'],
    homework: 'Pull mark rounding clips',
    currency: 'USD',
    paid: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    coach: {
      id: 'coach_luke',
      display_name: 'Luke Anders',
      profile_photo_url: null,
    },
  },
  {
    id: 'mock-session-3',
    coach_id: 'coach_sophia',
    sailor_id: 'sailor_hannah',
    session_type: 'boat_setup',
    duration_minutes: 90,
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    status: 'pending',
    location_notes: 'Dockside tuning',
    focus_areas: ['rig_tension', 'mast_rake'],
    goals: 'Baseline rig tune for 18-22kt',
    currency: 'USD',
    paid: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    coach: {
      id: 'coach_sophia',
      display_name: 'Sophia Lin',
      profile_photo_url: null,
    },
  },
] as CoachingSession[];

export const MOCK_COACHES = [
  {
    id: 'coach_emily',
    user_id: 'user_emily',
    display_name: 'Emily Carter',
    profile_photo_url: null,
    bio: 'Olympic strategist \u00B7 Match racing specialist',
    specialties: ['pre-starts', 'match_racing', 'race_strategy'],
    experience_years: 12,
    certifications: ['World Sailing L3 Coach'],
    available_for_sessions: true,
    hourly_rate: 24000,
    currency: 'USD',
    based_at: 'Hong Kong',
    available_locations: ['Asia Pacific'],
    total_sessions: 318,
    total_clients: 64,
    average_rating: 4.9,
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    hourly_rate_usd: 24000,
    rating: 4.9,
  },
  {
    id: 'coach_luke',
    user_id: 'user_luke',
    display_name: 'Luke Anders',
    profile_photo_url: null,
    bio: 'AC40 flight controller \u00B7 Downwind VMG specialist',
    specialties: ['downwind_modes', 'foiling', 'video_analysis'],
    experience_years: 8,
    certifications: ['US Sailing L2 Coach'],
    available_for_sessions: true,
    hourly_rate: 20000,
    currency: 'USD',
    based_at: 'San Francisco',
    available_locations: ['Remote', 'San Francisco'],
    total_sessions: 204,
    total_clients: 51,
    average_rating: 4.8,
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    hourly_rate_usd: 20000,
    rating: 4.8,
  },
  {
    id: 'coach_sophia',
    user_id: 'user_sophia',
    display_name: 'Sophia Lin',
    profile_photo_url: null,
    bio: 'Former Volvo Ocean Race \u00B7 Rig tuning expert',
    specialties: ['boat_speed', 'rig_tune', 'sail_shape'],
    experience_years: 15,
    certifications: ['RYA High Performance'],
    available_for_sessions: true,
    hourly_rate: 22000,
    currency: 'USD',
    based_at: 'Hong Kong',
    available_locations: ['Hong Kong', 'Singapore'],
    total_sessions: 412,
    total_clients: 83,
    average_rating: 5,
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    hourly_rate_usd: 22000,
    rating: 5,
  },
];

export const MOCK_FEEDBACK: FeedbackItem[] = [
  {
    id: 'feedback-1',
    coach: 'Emily Carter',
    sailor: 'Ava Thompson',
    sessionType: 'Race Strategy',
    summary: 'Shift recognition routine locked in during practice.',
    rating: 5,
    date: format(new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), 'MMM d'),
  },
  {
    id: 'feedback-2',
    coach: 'Luke Anders',
    sailor: 'Mateo Ruiz',
    sessionType: 'Video Review',
    summary: 'Downwind mode selection breakthrough.',
    rating: 4,
    date: format(new Date(Date.now() - 1000 * 60 * 60 * 24 * 6), 'MMM d'),
  },
];

export const MOCK_RESOURCES: ResourceItem[] = [
  {
    id: 'resource-1',
    title: 'Five drills to teach start line time-on-distance intuition',
    category: 'Training Plans',
    readTime: '7 min',
  },
  {
    id: 'resource-2',
    title: 'Using polar overlays to accelerate heavy-air coaching blocks',
    category: 'Analytics',
    readTime: '5 min',
  },
];

export const MOCK_METRICS: DashboardMetric[] = [
  { label: 'Upcoming', value: '3', helper: 'sessions' },
  { label: 'Coaches', value: '6', helper: 'active' },
  { label: 'Rating', value: '4.8', helper: 'avg' },
  { label: 'Hours', value: '11.5', helper: 'this month' },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

export function TufteSection({
  title,
  action,
  onActionPress,
  children,
}: {
  title: string;
  action?: string;
  onActionPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action && onActionPress && (
          <TouchableOpacity onPress={onActionPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.sectionAction}>{action}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

export function TufteSessionRow({
  session,
  onPress,
  isLast,
}: {
  session: CoachingSession;
  onPress: () => void;
  isLast: boolean;
}) {
  const scheduledDate = sessionScheduledDate(session);
  const coachName = session.coach?.display_name || 'Coach pending';
  const sessionType = formatSessionType(session.session_type || '');
  const location = session.location_notes || '';

  const statusColor = session.status === 'confirmed'
    ? IOS_COLORS.green
    : session.status === 'pending'
      ? IOS_COLORS.orange
      : IOS_COLORS.blue;

  return (
    <TouchableOpacity
      style={[styles.sessionRow, isLast && styles.sessionRowLast]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.sessionLeft}>
        <View style={styles.sessionDateBox}>
          <Text style={styles.sessionDateDay}>{format(scheduledDate, 'd')}</Text>
          <Text style={styles.sessionDateMonth}>{format(scheduledDate, 'MMM')}</Text>
        </View>
      </View>
      <View style={styles.sessionContent}>
        <View style={styles.sessionTopRow}>
          <Text style={styles.sessionCoach}>{coachName}</Text>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>
        <Text style={styles.sessionType}>{sessionType}</Text>
        <Text style={styles.sessionMeta}>
          {format(scheduledDate, 'h:mm a')}
          {location ? ` \u00B7 ${location}` : ''}
        </Text>
      </View>
      <Text style={styles.sessionChevron}>{'\u203A'}</Text>
    </TouchableOpacity>
  );
}

export function TufteFeedbackRow({
  feedback,
  isLast,
}: {
  feedback: FeedbackItem;
  isLast: boolean;
}) {
  return (
    <View style={[styles.feedbackRow, isLast && styles.feedbackRowLast]}>
      <View style={styles.feedbackTop}>
        <Text style={styles.feedbackCoach}>{feedback.coach}</Text>
        <View style={styles.feedbackRating}>
          <Text style={styles.feedbackRatingText}>{'\u2605'} {feedback.rating.toFixed(1)}</Text>
          <Text style={styles.feedbackDate}>{feedback.date}</Text>
        </View>
      </View>
      <Text style={styles.feedbackType}>{feedback.sessionType}</Text>
      <Text style={styles.feedbackSummary} numberOfLines={2}>{feedback.summary}</Text>
    </View>
  );
}

export function TufteResourceRow({
  resource,
  isLast,
}: {
  resource: ResourceItem;
  isLast: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.resourceRow, isLast && styles.resourceRowLast]} activeOpacity={0.6}>
      <View style={styles.resourceContent}>
        <Text style={styles.resourceCategory}>{resource.category}</Text>
        <Text style={styles.resourceTitle} numberOfLines={2}>{resource.title}</Text>
      </View>
      <View style={styles.resourceRight}>
        <Text style={styles.resourceTime}>{resource.readTime}</Text>
        <Text style={styles.resourceChevron}>{'\u203A'}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function MetricsRow({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <View style={styles.metricsRow}>
      {metrics.map((metric) => (
        <View key={metric.label} style={styles.metricItem}>
          <Text style={styles.metricValue}>{metric.value}</Text>
          <Text style={styles.metricLabel}>{metric.label}</Text>
          <Text style={styles.metricHelper}>{metric.helper}</Text>
        </View>
      ))}
    </View>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

export const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingBottom: 8,
    paddingHorizontal: TufteTokens.spacing.section,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: TufteTokens.spacing.section,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.color,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  metricHelper: {
    fontSize: 10,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 1,
  },
  quickActionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: TufteTokens.borders.hairline,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderColor: TufteTokens.borders.color,
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: TufteTokens.spacing.section,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.colorSubtle,
    minHeight: 44,
  },
  quickActionRowLast: {
    borderBottomWidth: 0,
  },
  quickActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickActionLabel: {
    fontSize: 15,
    color: IOS_COLORS.label,
  },
  quickActionChevron: {
    fontSize: 18,
    color: IOS_COLORS.gray3,
  },
  sessionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: TufteTokens.borders.hairline,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderColor: TufteTokens.borders.color,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: TufteTokens.spacing.section,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.colorSubtle,
    minHeight: 72,
  },
  sessionRowLast: {
    borderBottomWidth: 0,
  },
  sessionLeft: {
    marginRight: 12,
  },
  sessionDateBox: {
    width: 40,
    alignItems: 'center',
  },
  sessionDateDay: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  sessionDateMonth: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
  },
  sessionContent: {
    flex: 1,
    gap: 2,
  },
  sessionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionCoach: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sessionType: {
    fontSize: 13,
    color: IOS_COLORS.blue,
  },
  sessionMeta: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
  sessionChevron: {
    fontSize: 18,
    color: IOS_COLORS.gray3,
    marginLeft: 8,
  },
  coachesContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: TufteTokens.borders.hairline,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderColor: TufteTokens.borders.color,
  },
  feedbackContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: TufteTokens.borders.hairline,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderColor: TufteTokens.borders.color,
  },
  feedbackRow: {
    paddingVertical: 12,
    paddingHorizontal: TufteTokens.spacing.section,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.colorSubtle,
  },
  feedbackRowLast: {
    borderBottomWidth: 0,
  },
  feedbackTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  feedbackCoach: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  feedbackRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackRatingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F59E0B',
  },
  feedbackDate: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
  },
  feedbackType: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  feedbackSummary: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  resourcesContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: TufteTokens.borders.hairline,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderColor: TufteTokens.borders.color,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: TufteTokens.spacing.section,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.colorSubtle,
    minHeight: 56,
  },
  resourceRowLast: {
    borderBottomWidth: 0,
  },
  resourceContent: {
    flex: 1,
    gap: 2,
  },
  resourceCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resourceTitle: {
    fontSize: 14,
    color: IOS_COLORS.label,
    lineHeight: 18,
  },
  resourceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  resourceTime: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
  resourceChevron: {
    fontSize: 18,
    color: IOS_COLORS.gray3,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.tertiaryLabel,
  },
  becomeCoachContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: TufteTokens.borders.hairline,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderColor: TufteTokens.borders.color,
  },
  becomeCoachContent: {
    paddingVertical: 20,
    paddingHorizontal: TufteTokens.spacing.section,
  },
  becomeCoachTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 8,
  },
  becomeCoachDescription: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
    marginBottom: 16,
  },
  becomeCoachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 20,
  },
  becomeCoachButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subtleCoachPrompt: {
    paddingHorizontal: TufteTokens.spacing.section,
    paddingVertical: 16,
  },
  subtleCoachLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtleCoachText: {
    fontSize: 13,
    color: IOS_COLORS.blue,
  },
  coachDashboardContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: TufteTokens.borders.hairline,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderColor: TufteTokens.borders.color,
  },
  // Discovery view hero styles
  discoveryHero: {
    paddingVertical: 32,
    paddingHorizontal: TufteTokens.spacing.section,
    alignItems: 'center',
  },
  discoveryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 8,
    textAlign: 'center',
  },
  discoverySubtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 22,
    marginTop: 20,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: IOS_COLORS.blue,
    borderRadius: 20,
    marginTop: 16,
  },
  secondaryCtaText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
});
