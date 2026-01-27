/**
 * IOSClubDashboard - iOS HIG Club Dashboard
 *
 * Apple-style club management dashboard:
 * - Large title with club logo
 * - Icon grid for main sections (Events, Members, Results, More)
 * - Quick stats summary
 * - Recent activity feed
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
interface ClubStats {
  totalMembers?: number;
  activeEvents?: number;
  upcomingRaces?: number;
  pendingEntries?: number;
}

interface ActivityItem {
  id: string;
  type: 'entry' | 'result' | 'payment' | 'member' | 'event';
  title: string;
  subtitle: string;
  timestamp: Date;
  avatarUrl?: string;
}

interface ClubInfo {
  id: string;
  name: string;
  logoUrl?: string;
  memberCount?: number;
}

interface IOSClubDashboardProps {
  club: ClubInfo;
  stats?: ClubStats;
  recentActivity?: ActivityItem[];
  onSectionPress?: (section: 'events' | 'members' | 'results' | 'settings' | 'earnings' | 'fleets') => void;
  onActivityPress?: (activity: ActivityItem) => void;
  isLoading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Section grid configuration
const SECTIONS = [
  { key: 'events', label: 'Events', icon: 'calendar' as const, color: IOS_COLORS.systemBlue },
  { key: 'members', label: 'Members', icon: 'people' as const, color: IOS_COLORS.systemGreen },
  { key: 'results', label: 'Results', icon: 'trophy' as const, color: IOS_COLORS.systemOrange },
  { key: 'fleets', label: 'Fleets', icon: 'boat' as const, color: IOS_COLORS.systemTeal },
  { key: 'earnings', label: 'Earnings', icon: 'card' as const, color: IOS_COLORS.systemPurple },
  { key: 'settings', label: 'Settings', icon: 'settings' as const, color: IOS_COLORS.systemGray },
] as const;

// Activity type configuration
function getActivityTypeInfo(type: ActivityItem['type']): {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
} {
  switch (type) {
    case 'entry':
      return { icon: 'person-add', color: IOS_COLORS.systemBlue };
    case 'result':
      return { icon: 'trophy', color: IOS_COLORS.systemOrange };
    case 'payment':
      return { icon: 'card', color: IOS_COLORS.systemGreen };
    case 'member':
      return { icon: 'people', color: IOS_COLORS.systemPurple };
    case 'event':
      return { icon: 'calendar', color: IOS_COLORS.systemTeal };
    default:
      return { icon: 'ellipse', color: IOS_COLORS.systemGray };
  }
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

// Section Grid Item
interface SectionItemProps {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  badge?: number;
  onPress: () => void;
}

function SectionItem({ label, icon, color, badge, onPress }: SectionItemProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    triggerHaptic('impactLight');
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.sectionItem, animatedStyle]}
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.95, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.sectionIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={28} color={color} />
        {badge !== undefined && badge > 0 && (
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.sectionLabel}>{label}</Text>
    </AnimatedPressable>
  );
}

// Stats Card
interface StatsCardProps {
  stats?: ClubStats;
}

function StatsCard({ stats }: StatsCardProps) {
  const statItems = [
    { label: 'Members', value: stats?.totalMembers ?? 0, icon: 'people' as const },
    { label: 'Active Events', value: stats?.activeEvents ?? 0, icon: 'calendar' as const },
    { label: 'Upcoming Races', value: stats?.upcomingRaces ?? 0, icon: 'flag' as const },
    { label: 'Pending Entries', value: stats?.pendingEntries ?? 0, icon: 'time' as const },
  ];

  return (
    <View style={styles.statsCard}>
      {statItems.map((item, index) => (
        <View
          key={item.label}
          style={[
            styles.statItem,
            index < statItems.length - 1 && styles.statItemBorder,
          ]}
        >
          <View style={styles.statIconContainer}>
            <Ionicons name={item.icon} size={16} color={IOS_COLORS.secondaryLabel} />
          </View>
          <Text style={styles.statValue}>{item.value}</Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// Activity Row
interface ActivityRowProps {
  activity: ActivityItem;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function ActivityRow({ activity, onPress, isFirst, isLast }: ActivityRowProps) {
  const scale = useSharedValue(1);
  const typeInfo = getActivityTypeInfo(activity.type);

  const handlePress = () => {
    triggerHaptic('impactLight');
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.activityRow,
        isFirst && styles.activityRowFirst,
        isLast && styles.activityRowLast,
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.98, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${activity.title}, ${activity.subtitle}`}
    >
      {/* Leading Icon */}
      <View style={[styles.activityIcon, { backgroundColor: `${typeInfo.color}15` }]}>
        <Ionicons name={typeInfo.icon} size={18} color={typeInfo.color} />
      </View>

      {/* Content */}
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle} numberOfLines={1}>
          {activity.title}
        </Text>
        <Text style={styles.activitySubtitle} numberOfLines={1}>
          {activity.subtitle}
        </Text>
      </View>

      {/* Trailing */}
      <View style={styles.activityTrailing}>
        <Text style={styles.activityTime}>{formatTimeAgo(activity.timestamp)}</Text>
        <Ionicons name="chevron-forward" size={18} color={IOS_COLORS.systemGray3} />
      </View>
    </AnimatedPressable>
  );
}

// Main Component
export function IOSClubDashboard({
  club,
  stats,
  recentActivity = [],
  onSectionPress,
  onActivityPress,
  isLoading = false,
}: IOSClubDashboardProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Club Header */}
      <View style={styles.header}>
        {club.logoUrl ? (
          <Image source={{ uri: club.logoUrl }} style={styles.clubLogo} />
        ) : (
          <View style={styles.clubLogoPlaceholder}>
            <Ionicons name="business" size={32} color={IOS_COLORS.systemGray3} />
          </View>
        )}
        <Text style={styles.clubName}>{club.name}</Text>
        {club.memberCount !== undefined && (
          <Text style={styles.memberCount}>
            {club.memberCount} {club.memberCount === 1 ? 'member' : 'members'}
          </Text>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>OVERVIEW</Text>
        <StatsCard stats={stats} />
      </View>

      {/* Section Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MANAGE</Text>
        <View style={styles.sectionGrid}>
          {SECTIONS.map((section) => (
            <SectionItem
              key={section.key}
              label={section.label}
              icon={section.icon}
              color={section.color}
              badge={section.key === 'events' ? stats?.pendingEntries : undefined}
              onPress={() => onSectionPress?.(section.key as any)}
            />
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
        </View>

        {recentActivity.length > 0 ? (
          <View style={styles.activityList}>
            {recentActivity.map((activity, index) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                onPress={() => onActivityPress?.(activity)}
                isFirst={index === 0}
                isLast={index === recentActivity.length - 1}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyActivity}>
            <View style={styles.emptyIcon}>
              <Ionicons name="time-outline" size={28} color={IOS_COLORS.systemGray3} />
            </View>
            <Text style={styles.emptyText}>No recent activity</Text>
          </View>
        )}
      </View>
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
    alignItems: 'center',
    paddingTop: IOS_SPACING.xl,
    paddingBottom: IOS_SPACING.lg,
    paddingHorizontal: IOS_SPACING.lg,
  },
  clubLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: IOS_SPACING.md,
  },
  clubLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: IOS_SPACING.md,
  },
  clubName: {
    fontSize: IOS_TYPOGRAPHY.title1.fontSize,
    fontWeight: '700',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  memberCount: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.xs,
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
    paddingHorizontal: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.sm,
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
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
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: IOS_SPACING.sm,
  },
  statItemBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: IOS_COLORS.separator,
  },
  statIconContainer: {
    marginBottom: IOS_SPACING.xs,
  },
  statValue: {
    fontSize: IOS_TYPOGRAPHY.title2.fontSize,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  statLabel: {
    fontSize: IOS_TYPOGRAPHY.caption2.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
    textAlign: 'center',
  },

  // Section Grid
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: IOS_SPACING.lg - IOS_SPACING.sm / 2,
    gap: IOS_SPACING.sm,
  },
  sectionItem: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: IOS_SPACING.sm,
    position: 'relative',
  },
  sectionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.systemRed,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionLabel: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },

  // Activity List
  activityList: {
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
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    gap: IOS_SPACING.md,
  },
  activityRowFirst: {
    borderTopLeftRadius: IOS_RADIUS.md,
    borderTopRightRadius: IOS_RADIUS.md,
  },
  activityRowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: IOS_RADIUS.md,
    borderBottomRightRadius: IOS_RADIUS.md,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: IOS_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  activitySubtitle: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  activityTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  activityTime: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.tertiaryLabel,
  },

  // Empty State
  emptyActivity: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.xl,
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: IOS_COLORS.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
});

export default IOSClubDashboard;
