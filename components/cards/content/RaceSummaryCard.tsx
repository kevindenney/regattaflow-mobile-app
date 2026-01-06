/**
 * RaceSummaryCard - Position 0 (Default View)
 *
 * The primary race card showing:
 * - Race name and series
 * - Date and time
 * - Countdown timer
 * - Venue
 * - Weather conditions (wind, tide)
 * - VHF channel
 * - Fleet size/class
 *
 * This is the first card users see when navigating to a race.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import {
  MapPin,
  Radio,
  Wind,
  Waves,
  Sailboat,
  Clock,
  Calendar,
} from 'lucide-react-native';

import { CardContentProps } from '../types';
import { CardMenu, type CardMenuItem } from '@/components/shared/CardMenu';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Calculate countdown to race start
 */
function calculateCountdown(date: string, startTime?: string): {
  days: number;
  hours: number;
  minutes: number;
  isPast: boolean;
  isToday: boolean;
  isTomorrow: boolean;
} {
  const now = new Date();
  const raceDate = new Date(date);

  // Set start time if provided
  if (startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    raceDate.setHours(hours || 0, minutes || 0, 0, 0);
  }

  const diffMs = raceDate.getTime() - now.getTime();
  const isPast = diffMs < 0;

  const absDiffMs = Math.abs(diffMs);
  const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));

  // Check if today or tomorrow
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const raceDayStart = new Date(raceDate);
  raceDayStart.setHours(0, 0, 0, 0);

  const isToday = raceDayStart.getTime() === today.getTime();
  const isTomorrow = raceDayStart.getTime() === tomorrow.getTime();

  return { days, hours, minutes, isPast, isToday, isTomorrow };
}

/**
 * Format date for display
 */
function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time for display
 */
function formatTime(time?: string): string {
  if (!time) return 'TBD';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

/**
 * Get urgency color based on countdown
 */
function getUrgencyColor(days: number, hours: number, isPast: boolean): {
  bg: string;
  text: string;
  label: string;
} {
  if (isPast) {
    return { bg: '#F3F4F6', text: '#6B7280', label: 'Completed' };
  }
  if (days === 0 && hours < 2) {
    return { bg: '#FEE2E2', text: '#DC2626', label: 'Starting Soon' };
  }
  if (days === 0) {
    return { bg: '#FFEDD5', text: '#C2410C', label: 'Today' };
  }
  if (days <= 1) {
    return { bg: '#FEF3C7', text: '#92400E', label: 'Tomorrow' };
  }
  if (days <= 7) {
    return { bg: '#D1FAE5', text: '#065F46', label: 'This Week' };
  }
  return { bg: '#E0E7FF', text: '#3730A3', label: 'Upcoming' };
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RaceSummaryCard({
  race,
  cardType,
  isActive,
  dimensions,
  canManage,
  onEdit,
  onDelete,
}: CardContentProps) {
  // Calculate countdown
  const countdown = useMemo(
    () => calculateCountdown(race.date, race.startTime),
    [race.date, race.startTime]
  );

  // Get urgency colors
  const urgency = useMemo(
    () => getUrgencyColor(countdown.days, countdown.hours, countdown.isPast),
    [countdown.days, countdown.hours, countdown.isPast]
  );

  // Extract VHF channel
  const vhfChannel = race.vhf_channel || (race as any).critical_details?.vhf_channel;

  // Build menu items for card management
  const menuItems = useMemo((): CardMenuItem[] => {
    const items: CardMenuItem[] = [];
    if (onEdit) {
      items.push({ label: 'Edit Race', icon: 'create-outline', onPress: onEdit });
    }
    if (onDelete) {
      items.push({ label: 'Delete Race', icon: 'trash-outline', onPress: onDelete, variant: 'destructive' });
    }
    return items;
  }, [onEdit, onDelete]);

  return (
    <View style={styles.container}>
      {/* Header: Race Name & Status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.raceName} numberOfLines={2}>
            {race.name}
          </Text>
          {race.venue && (
            <View style={styles.venueRow}>
              <MapPin size={14} color="#6B7280" />
              <Text style={styles.venueText}>{race.venue}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: urgency.bg }]}>
            <Text style={[styles.statusText, { color: urgency.text }]}>
              {urgency.label}
            </Text>
          </View>
          {canManage && menuItems.length > 0 && (
            <CardMenu items={menuItems} />
          )}
        </View>
      </View>

      {/* Countdown Timer */}
      <View style={styles.countdownSection}>
        {countdown.isPast ? (
          <Text style={styles.countdownPast}>Race Completed</Text>
        ) : (
          <>
            <View style={styles.countdownRow}>
              {countdown.days > 0 && (
                <View style={styles.countdownUnit}>
                  <Text style={styles.countdownValue}>{countdown.days}</Text>
                  <Text style={styles.countdownLabel}>days</Text>
                </View>
              )}
              <View style={styles.countdownUnit}>
                <Text style={styles.countdownValue}>{countdown.hours}</Text>
                <Text style={styles.countdownLabel}>hrs</Text>
              </View>
              <View style={styles.countdownUnit}>
                <Text style={styles.countdownValue}>{countdown.minutes}</Text>
                <Text style={styles.countdownLabel}>min</Text>
              </View>
            </View>
            <Text style={styles.countdownSubtext}>until start</Text>
          </>
        )}
      </View>

      {/* Date & Time */}
      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeItem}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.dateTimeText}>{formatDate(race.date)}</Text>
        </View>
        <View style={styles.dateTimeItem}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.dateTimeText}>{formatTime(race.startTime)}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Conditions */}
      <View style={styles.conditionsSection}>
        <View style={styles.conditionsGrid}>
          {/* Wind */}
          <View style={styles.conditionCard}>
            <View style={styles.conditionHeader}>
              <Wind size={18} color="#3B82F6" />
              <Text style={styles.conditionLabel}>Wind</Text>
            </View>
            {race.wind ? (
              <View>
                <Text style={styles.conditionValue}>
                  {race.wind.speedMin}-{race.wind.speedMax} kts
                </Text>
                <Text style={styles.conditionDetail}>{race.wind.direction}</Text>
              </View>
            ) : (
              <Text style={styles.conditionEmpty}>--</Text>
            )}
          </View>

          {/* Tide */}
          <View style={styles.conditionCard}>
            <View style={styles.conditionHeader}>
              <Waves size={18} color="#06B6D4" />
              <Text style={styles.conditionLabel}>Tide</Text>
            </View>
            {race.tide ? (
              <View>
                <Text style={styles.conditionValue}>
                  {race.tide.state.charAt(0).toUpperCase() + race.tide.state.slice(1)}
                </Text>
                {race.tide.height !== undefined && (
                  <Text style={styles.conditionDetail}>{race.tide.height.toFixed(1)}m</Text>
                )}
              </View>
            ) : (
              <Text style={styles.conditionEmpty}>--</Text>
            )}
          </View>
        </View>
      </View>

      {/* Footer: VHF & Class */}
      <View style={styles.footer}>
        {vhfChannel && (
          <View style={styles.footerItem}>
            <Radio size={14} color="#10B981" />
            <Text style={styles.footerLabel}>VHF</Text>
            <Text style={styles.footerValue}>{vhfChannel}</Text>
          </View>
        )}
        {race.boatClass && (
          <View style={styles.footerItem}>
            <Sailboat size={14} color="#8B5CF6" />
            <Text style={styles.footerLabel}>Class</Text>
            <Text style={styles.footerValue}>{race.boatClass}</Text>
          </View>
        )}
      </View>

      {/* Swipe indicator */}
      <View style={styles.swipeHint}>
        <View style={styles.swipeIndicator} />
      </View>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  raceName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Countdown
  countdownSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 16,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  countdownUnit: {
    alignItems: 'center',
  },
  countdownValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  countdownLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: -4,
  },
  countdownSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  countdownPast: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Date & Time
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },

  // Conditions
  conditionsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  conditionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  conditionCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  conditionLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  conditionValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  conditionDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  conditionEmpty: {
    fontSize: 18,
    color: '#D1D5DB',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  // Swipe hint
  swipeHint: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
});

export default RaceSummaryCard;
