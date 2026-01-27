/**
 * IOSEventManagement - iOS Settings-Style Event Screen
 *
 * Settings-style grouped list layout for event management:
 * - Status section with disclosure rows
 * - Management section with navigation rows
 * - Inset grouped list styling
 * - Trailing accessories (chevron, badge, switch)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Switch,
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
interface EventDetails {
  id: string;
  name: string;
  status: 'draft' | 'published' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed';
  startDate: Date;
  endDate?: Date;
  venue?: string;
  entryCount: number;
  maxEntries?: number;
  pendingEntries: number;
  checkedInCount: number;
  totalRaces: number;
  completedRaces: number;
  isPublished: boolean;
  registrationOpen: boolean;
}

interface IOSEventManagementProps {
  event: EventDetails;
  onNavigate?: (section: 'entries' | 'check-in' | 'results' | 'races' | 'documents' | 'settings' | 'share') => void;
  onTogglePublished?: (published: boolean) => void;
  onToggleRegistration?: (open: boolean) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Status badge configuration
function getStatusInfo(status: EventDetails['status']): {
  label: string;
  color: string;
} {
  switch (status) {
    case 'draft':
      return { label: 'Draft', color: IOS_COLORS.systemGray };
    case 'published':
      return { label: 'Published', color: IOS_COLORS.systemBlue };
    case 'registration_open':
      return { label: 'Registration Open', color: IOS_COLORS.systemGreen };
    case 'registration_closed':
      return { label: 'Registration Closed', color: IOS_COLORS.systemOrange };
    case 'in_progress':
      return { label: 'In Progress', color: IOS_COLORS.systemPurple };
    case 'completed':
      return { label: 'Completed', color: IOS_COLORS.systemTeal };
    default:
      return { label: 'Unknown', color: IOS_COLORS.systemGray };
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// List Row Component
interface ListRowProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  showChevron?: boolean;
  badge?: number;
  destructive?: boolean;
}

function ListRow({
  icon,
  iconColor = IOS_COLORS.systemBlue,
  title,
  subtitle,
  trailing,
  onPress,
  isFirst,
  isLast,
  showChevron = true,
  badge,
  destructive = false,
}: ListRowProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (onPress) {
      triggerHaptic('impactLight');
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
    <>
      {/* Leading Icon */}
      {icon && (
        <View style={[styles.rowIcon, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
      )}

      {/* Content */}
      <View style={styles.rowContent}>
        <Text
          style={[
            styles.rowTitle,
            destructive && styles.rowTitleDestructive,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Trailing */}
      <View style={styles.rowTrailing}>
        {badge !== undefined && badge > 0 && (
          <View style={styles.rowBadge}>
            <Text style={styles.rowBadgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
        {trailing}
        {onPress && showChevron && (
          <Ionicons name="chevron-forward" size={18} color={IOS_COLORS.systemGray3} />
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        style={[
          styles.row,
          isFirst && styles.rowFirst,
          isLast && styles.rowLast,
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
        accessibilityLabel={title}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <View
      style={[
        styles.row,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
      ]}
    >
      {content}
    </View>
  );
}

// Section Component
interface ListSectionProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
}

function ListSection({ title, footer, children }: ListSectionProps) {
  const childArray = React.Children.toArray(children);

  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.sectionList}>
        {React.Children.map(childArray, (child, index) =>
          React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<ListRowProps>, {
                isFirst: index === 0,
                isLast: index === childArray.length - 1,
              })
            : child
        )}
      </View>
      {footer && <Text style={styles.sectionFooter}>{footer}</Text>}
    </View>
  );
}

// Main Component
export function IOSEventManagement({
  event,
  onNavigate,
  onTogglePublished,
  onToggleRegistration,
}: IOSEventManagementProps) {
  const statusInfo = getStatusInfo(event.status);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Event Header */}
      <View style={styles.header}>
        <Text style={styles.eventName}>{event.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
        <Text style={styles.dateText}>
          {formatDate(event.startDate)}
          {event.endDate && ` – ${formatDate(event.endDate)}`}
        </Text>
        {event.venue && <Text style={styles.venueText}>{event.venue}</Text>}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{event.entryCount}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{event.checkedInCount}</Text>
          <Text style={styles.statLabel}>Checked In</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {event.completedRaces}/{event.totalRaces}
          </Text>
          <Text style={styles.statLabel}>Races</Text>
        </View>
      </View>

      {/* Status Section */}
      <ListSection title="STATUS">
        <ListRow
          icon="globe-outline"
          iconColor={IOS_COLORS.systemBlue}
          title="Published"
          showChevron={false}
          trailing={
            <Switch
              value={event.isPublished}
              onValueChange={(value) => {
                triggerHaptic('selection');
                onTogglePublished?.(value);
              }}
              trackColor={{ true: IOS_COLORS.systemGreen }}
            />
          }
        />
        <ListRow
          icon="person-add-outline"
          iconColor={IOS_COLORS.systemGreen}
          title="Registration Open"
          showChevron={false}
          trailing={
            <Switch
              value={event.registrationOpen}
              onValueChange={(value) => {
                triggerHaptic('selection');
                onToggleRegistration?.(value);
              }}
              trackColor={{ true: IOS_COLORS.systemGreen }}
            />
          }
        />
      </ListSection>

      {/* Management Section */}
      <ListSection title="MANAGEMENT">
        <ListRow
          icon="people-outline"
          iconColor={IOS_COLORS.systemBlue}
          title="Entries"
          subtitle={
            event.maxEntries
              ? `${event.entryCount} of ${event.maxEntries}`
              : `${event.entryCount} registered`
          }
          badge={event.pendingEntries}
          onPress={() => onNavigate?.('entries')}
        />
        <ListRow
          icon="checkbox-outline"
          iconColor={IOS_COLORS.systemGreen}
          title="Check-In"
          subtitle={`${event.checkedInCount} checked in`}
          onPress={() => onNavigate?.('check-in')}
        />
        <ListRow
          icon="trophy-outline"
          iconColor={IOS_COLORS.systemOrange}
          title="Results"
          subtitle={`${event.completedRaces} of ${event.totalRaces} races scored`}
          onPress={() => onNavigate?.('results')}
        />
        <ListRow
          icon="flag-outline"
          iconColor={IOS_COLORS.systemPurple}
          title="Races"
          subtitle={`${event.totalRaces} scheduled`}
          onPress={() => onNavigate?.('races')}
        />
      </ListSection>

      {/* Documents Section */}
      <ListSection title="DOCUMENTS">
        <ListRow
          icon="document-text-outline"
          iconColor={IOS_COLORS.systemTeal}
          title="Notice of Race"
          onPress={() => onNavigate?.('documents')}
        />
        <ListRow
          icon="document-outline"
          iconColor={IOS_COLORS.systemIndigo}
          title="Sailing Instructions"
          onPress={() => onNavigate?.('documents')}
        />
      </ListSection>

      {/* Share Section */}
      <ListSection title="SHARE">
        <ListRow
          icon="share-outline"
          iconColor={IOS_COLORS.systemBlue}
          title="Share Event"
          onPress={() => onNavigate?.('share')}
        />
      </ListSection>

      {/* Settings Section */}
      <ListSection>
        <ListRow
          icon="settings-outline"
          iconColor={IOS_COLORS.systemGray}
          title="Event Settings"
          onPress={() => onNavigate?.('settings')}
        />
      </ListSection>
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
    paddingTop: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.lg,
    paddingHorizontal: IOS_SPACING.lg,
  },
  eventName: {
    fontSize: IOS_TYPOGRAPHY.title2.fontSize,
    fontWeight: '700',
    color: IOS_COLORS.label,
    textAlign: 'center',
    marginBottom: IOS_SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.xs,
    borderRadius: IOS_RADIUS.full,
    marginBottom: IOS_SPACING.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '600',
  },
  dateText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
  },
  venueText: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: IOS_SPACING.xs,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.lg,
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
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: IOS_COLORS.separator,
  },
  statValue: {
    fontSize: IOS_TYPOGRAPHY.title2.fontSize,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  statLabel: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.xs,
  },

  // Section
  section: {
    marginBottom: IOS_SPACING.lg,
  },
  sectionTitle: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
    paddingHorizontal: IOS_SPACING.lg + IOS_SPACING.lg,
    marginBottom: IOS_SPACING.sm,
  },
  sectionList: {
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
  sectionFooter: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.secondaryLabel,
    paddingHorizontal: IOS_SPACING.lg + IOS_SPACING.lg,
    marginTop: IOS_SPACING.sm,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    gap: IOS_SPACING.md,
    minHeight: 52,
  },
  rowFirst: {
    borderTopLeftRadius: IOS_RADIUS.md,
    borderTopRightRadius: IOS_RADIUS.md,
  },
  rowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: IOS_RADIUS.md,
    borderBottomRightRadius: IOS_RADIUS.md,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: IOS_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    color: IOS_COLORS.label,
  },
  rowTitleDestructive: {
    color: IOS_COLORS.systemRed,
  },
  rowSubtitle: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  rowBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: IOS_COLORS.systemRed,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  rowBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default IOSEventManagement;
