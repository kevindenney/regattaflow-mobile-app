/**
 * IOSCoachDashboard - iOS HIG Coach Dashboard
 *
 * Apple-style coach dashboard with:
 * - Personalized greeting header
 * - "Today's Schedule" section (timeline style)
 * - "Needs Attention" section with notification items
 * - Quick actions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

// Types
interface CoachProfile {
  name: string;
  avatarUrl?: string;
}

interface ScheduleItem {
  id: string;
  clientName: string;
  clientAvatarUrl?: string;
  type: 'analysis' | 'live' | 'race_day' | 'call';
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'pending' | 'needs_prep';
  notes?: string;
}

interface AttentionItem {
  id: string;
  type: 'prep_needed' | 'new_lead' | 'pending_payment' | 'review_request' | 'goal_achieved';
  title: string;
  subtitle: string;
  timestamp: Date;
  actionLabel?: string;
}

interface QuickStat {
  label: string;
  value: string | number;
  trend?: { direction: 'up' | 'down' | 'neutral'; value: string };
}

interface IOSCoachDashboardProps {
  profile: CoachProfile;
  todaySchedule: ScheduleItem[];
  attentionItems: AttentionItem[];
  stats?: QuickStat[];
  onScheduleItemPress?: (item: ScheduleItem) => void;
  onAttentionItemPress?: (item: AttentionItem) => void;
  onSeeFullSchedule?: () => void;
  onQuickAction?: (action: 'plan_session' | 'view_clients' | 'check_earnings') => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Greeting helper
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Session type configuration
function getSessionTypeInfo(type: ScheduleItem['type']): {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  label: string;
} {
  switch (type) {
    case 'analysis':
      return { icon: 'analytics', color: IOS_COLORS.systemBlue, label: 'Video Analysis' };
    case 'live':
      return { icon: 'videocam', color: IOS_COLORS.systemGreen, label: 'Live Session' };
    case 'race_day':
      return { icon: 'boat', color: IOS_COLORS.systemOrange, label: 'Race Day' };
    case 'call':
      return { icon: 'call', color: IOS_COLORS.systemPurple, label: 'Call' };
    default:
      return { icon: 'calendar', color: IOS_COLORS.systemGray, label: 'Session' };
  }
}

// Attention type configuration
function getAttentionTypeInfo(type: AttentionItem['type']): {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
} {
  switch (type) {
    case 'prep_needed':
      return { icon: 'alert-circle', color: IOS_COLORS.systemOrange };
    case 'new_lead':
      return { icon: 'person-add', color: IOS_COLORS.systemBlue };
    case 'pending_payment':
      return { icon: 'card', color: IOS_COLORS.systemGreen };
    case 'review_request':
      return { icon: 'star', color: IOS_COLORS.systemYellow };
    case 'goal_achieved':
      return { icon: 'trophy', color: IOS_COLORS.systemOrange };
    default:
      return { icon: 'notifications', color: IOS_COLORS.systemGray };
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatTimeAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Schedule Item Component
interface ScheduleItemRowProps {
  item: ScheduleItem;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function ScheduleItemRow({ item, onPress, isFirst, isLast }: ScheduleItemRowProps) {
  const scale = useSharedValue(1);
  const typeInfo = getSessionTypeInfo(item.type);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.scheduleItem, animatedStyle]}
      onPress={() => {
        triggerHaptic('impactLight');
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.98, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
    >
      {/* Timeline indicator */}
      <View style={styles.timelineColumn}>
        <Text style={styles.timeText}>{formatTime(item.startTime)}</Text>
        <View style={styles.timelineLine}>
          {!isFirst && <View style={styles.lineTop} />}
          <View style={[styles.timelineDot, { backgroundColor: typeInfo.color }]} />
          {!isLast && <View style={styles.lineBottom} />}
        </View>
      </View>

      {/* Content */}
      <View style={styles.scheduleContent}>
        <View style={styles.scheduleHeader}>
          <View style={[styles.typeIcon, { backgroundColor: `${typeInfo.color}15` }]}>
            <Ionicons name={typeInfo.icon} size={16} color={typeInfo.color} />
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.clientName}>{item.clientName}</Text>
            <Text style={styles.sessionType}>{typeInfo.label}</Text>
          </View>
          {item.status === 'needs_prep' && (
            <View style={styles.prepBadge}>
              <Text style={styles.prepBadgeText}>Prep</Text>
            </View>
          )}
        </View>
        {item.notes && (
          <Text style={styles.sessionNotes} numberOfLines={1}>
            {item.notes}
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={IOS_COLORS.systemGray3} />
    </AnimatedPressable>
  );
}

// Attention Item Component
interface AttentionItemRowProps {
  item: AttentionItem;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function AttentionItemRow({ item, onPress, isFirst, isLast }: AttentionItemRowProps) {
  const scale = useSharedValue(1);
  const typeInfo = getAttentionTypeInfo(item.type);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.attentionItem,
        isFirst && styles.attentionItemFirst,
        isLast && styles.attentionItemLast,
        animatedStyle,
      ]}
      onPress={() => {
        triggerHaptic('impactLight');
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.98, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
    >
      <View style={[styles.attentionIcon, { backgroundColor: `${typeInfo.color}15` }]}>
        <Ionicons name={typeInfo.icon} size={18} color={typeInfo.color} />
      </View>

      <View style={styles.attentionContent}>
        <Text style={styles.attentionTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.attentionSubtitle} numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>

      <View style={styles.attentionTrailing}>
        <Text style={styles.attentionTime}>{formatTimeAgo(item.timestamp)}</Text>
        <Ionicons name="chevron-forward" size={18} color={IOS_COLORS.systemGray3} />
      </View>
    </AnimatedPressable>
  );
}

// Quick Action Button
interface QuickActionButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  onPress: () => void;
}

function QuickActionButton({ icon, label, color, onPress }: QuickActionButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.quickAction, animatedStyle]}
      onPress={() => {
        triggerHaptic('impactLight');
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.95, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </AnimatedPressable>
  );
}

// Main Component
export function IOSCoachDashboard({
  profile,
  todaySchedule,
  attentionItems,
  stats,
  onScheduleItemPress,
  onAttentionItemPress,
  onSeeFullSchedule,
  onQuickAction,
}: IOSCoachDashboardProps) {
  const upcomingSessions = todaySchedule.filter(
    (s) => s.startTime.getTime() > Date.now()
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting Header */}
      <View style={styles.header}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.coachName}>{profile.name.split(' ')[0]}</Text>
          </View>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={IOS_COLORS.systemGray3} />
            </View>
          )}
        </View>

        {/* Quick Stats */}
        {stats && stats.length > 0 && (
          <View style={styles.statsRow}>
            {stats.map((stat, index) => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                {stat.trend && (
                  <View style={styles.trendBadge}>
                    <Ionicons
                      name={stat.trend.direction === 'up' ? 'arrow-up' : stat.trend.direction === 'down' ? 'arrow-down' : 'remove'}
                      size={10}
                      color={stat.trend.direction === 'up' ? IOS_COLORS.systemGreen : stat.trend.direction === 'down' ? IOS_COLORS.systemRed : IOS_COLORS.systemGray}
                    />
                    <Text
                      style={[
                        styles.trendText,
                        {
                          color: stat.trend.direction === 'up'
                            ? IOS_COLORS.systemGreen
                            : stat.trend.direction === 'down'
                            ? IOS_COLORS.systemRed
                            : IOS_COLORS.systemGray,
                        },
                      ]}
                    >
                      {stat.trend.value}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.quickActionsRow}>
          <QuickActionButton
            icon="calendar"
            label="Plan Session"
            color={IOS_COLORS.systemBlue}
            onPress={() => onQuickAction?.('plan_session')}
          />
          <QuickActionButton
            icon="people"
            label="Clients"
            color={IOS_COLORS.systemPurple}
            onPress={() => onQuickAction?.('view_clients')}
          />
          <QuickActionButton
            icon="card"
            label="Earnings"
            color={IOS_COLORS.systemGreen}
            onPress={() => onQuickAction?.('check_earnings')}
          />
        </View>
      </View>

      {/* Today's Schedule */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TODAY'S SCHEDULE</Text>
          {onSeeFullSchedule && (
            <Pressable
              style={styles.seeAllButton}
              onPress={() => {
                triggerHaptic('impactLight');
                onSeeFullSchedule();
              }}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={14} color={IOS_COLORS.systemBlue} />
            </Pressable>
          )}
        </View>

        {upcomingSessions.length > 0 ? (
          <View style={styles.scheduleList}>
            {upcomingSessions.map((item, index) => (
              <ScheduleItemRow
                key={item.id}
                item={item}
                onPress={() => onScheduleItemPress?.(item)}
                isFirst={index === 0}
                isLast={index === upcomingSessions.length - 1}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptySchedule}>
            <View style={styles.emptyIcon}>
              <Ionicons name="sunny" size={32} color={IOS_COLORS.systemOrange} />
            </View>
            <Text style={styles.emptyTitle}>All clear today!</Text>
            <Text style={styles.emptySubtitle}>No more sessions scheduled</Text>
          </View>
        )}
      </View>

      {/* Needs Attention */}
      {attentionItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>NEEDS ATTENTION</Text>
            <View style={styles.attentionBadge}>
              <Text style={styles.attentionBadgeText}>{attentionItems.length}</Text>
            </View>
          </View>

          <View style={styles.attentionList}>
            {attentionItems.map((item, index) => (
              <AttentionItemRow
                key={item.id}
                item={item}
                onPress={() => onAttentionItemPress?.(item)}
                isFirst={index === 0}
                isLast={index === attentionItems.length - 1}
              />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  scrollContent: {
    paddingBottom: IOS_SPACING.xxxl,
  },

  // Header
  header: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.md,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: IOS_TYPOGRAPHY.title3.fontSize,
    color: IOS_COLORS.secondaryLabel,
  },
  coachName: {
    fontSize: IOS_TYPOGRAPHY.largeTitle.fontSize,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
  },
  statItem: {
    flex: 1,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: IOS_TYPOGRAPHY.title2.fontSize,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  statLabel: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: IOS_SPACING.xs,
  },
  trendText: {
    fontSize: IOS_TYPOGRAPHY.caption2.fontSize,
    fontWeight: '500',
  },

  // Sections
  section: {
    marginTop: IOS_SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.sm,
  },
  sectionTitle: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  attentionBadge: {
    backgroundColor: IOS_COLORS.systemRed,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  attentionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
  },
  quickAction: {
    flex: 1,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.md,
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },

  // Schedule List
  scheduleList: {
    paddingHorizontal: IOS_SPACING.lg,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.md,
    gap: IOS_SPACING.md,
  },
  timelineColumn: {
    width: 60,
    alignItems: 'center',
  },
  timeText: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: IOS_SPACING.xs,
  },
  timelineLine: {
    flex: 1,
    alignItems: 'center',
  },
  lineTop: {
    width: 2,
    height: 10,
    backgroundColor: IOS_COLORS.systemGray4,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  lineBottom: {
    width: 2,
    flex: 1,
    backgroundColor: IOS_COLORS.systemGray4,
    marginTop: 2,
  },
  scheduleContent: {
    flex: 1,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.md,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: IOS_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  sessionType: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  prepBadge: {
    backgroundColor: IOS_COLORS.systemOrange,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  prepBadgeText: {
    fontSize: IOS_TYPOGRAPHY.caption2.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sessionNotes: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: IOS_SPACING.sm,
  },

  // Empty Schedule
  emptySchedule: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.xl,
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${IOS_COLORS.systemOrange}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: IOS_SPACING.sm,
  },
  emptyTitle: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  emptySubtitle: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
  },

  // Attention List
  attentionList: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.md,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  attentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  attentionItemFirst: {
    borderTopLeftRadius: IOS_RADIUS.md,
    borderTopRightRadius: IOS_RADIUS.md,
  },
  attentionItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: IOS_RADIUS.md,
    borderBottomRightRadius: IOS_RADIUS.md,
  },
  attentionIcon: {
    width: 36,
    height: 36,
    borderRadius: IOS_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attentionContent: {
    flex: 1,
    minWidth: 0,
  },
  attentionTitle: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  attentionSubtitle: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  attentionTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  attentionTime: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.tertiaryLabel,
  },
});

export default IOSCoachDashboard;
