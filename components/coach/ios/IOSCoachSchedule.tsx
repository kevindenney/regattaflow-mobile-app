/**
 * IOSCoachSchedule - Native Calendar View
 *
 * Apple Calendar-style schedule:
 * - Calendar view at top with dots on days with events
 * - Day detail list below
 * - Color-coded event types (session, available, blocked)
 * - Week/month toggle
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
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
interface ScheduleEvent {
  id: string;
  type: 'session' | 'available' | 'blocked' | 'race_day';
  title: string;
  subtitle?: string;
  startTime: Date;
  endTime: Date;
  clientName?: string;
  clientAvatarUrl?: string;
  notes?: string;
}

interface IOSCoachScheduleProps {
  events: ScheduleEvent[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onEventPress?: (event: ScheduleEvent) => void;
  onAddEvent?: (date: Date) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Event type configuration
function getEventTypeInfo(type: ScheduleEvent['type']): {
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
} {
  switch (type) {
    case 'session':
      return { color: IOS_COLORS.systemBlue, icon: 'person', label: 'Session' };
    case 'available':
      return { color: IOS_COLORS.systemGreen, icon: 'checkmark-circle', label: 'Available' };
    case 'blocked':
      return { color: IOS_COLORS.systemGray, icon: 'close-circle', label: 'Blocked' };
    case 'race_day':
      return { color: IOS_COLORS.systemOrange, icon: 'boat', label: 'Race Day' };
    default:
      return { color: IOS_COLORS.systemGray, icon: 'calendar', label: 'Event' };
  }
}

// Date helpers
function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDateHeader(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, tomorrow)) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  // Add padding days from previous month
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(date);
  }

  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // Add padding days from next month
  const endPadding = 6 - lastDay.getDay();
  for (let i = 1; i <= endPadding; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

// Calendar Day Cell
interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  eventColors: string[];
  onPress: () => void;
}

function CalendarDayCell({ date, isCurrentMonth, isSelected, isToday, eventColors, onPress }: DayCell) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.dayCell, animatedStyle]}
      onPress={() => {
        triggerHaptic('selection');
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.9, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
    >
      <View
        style={[
          styles.dayNumber,
          isSelected && styles.dayNumberSelected,
          isToday && !isSelected && styles.dayNumberToday,
        ]}
      >
        <Text
          style={[
            styles.dayText,
            !isCurrentMonth && styles.dayTextOutside,
            isSelected && styles.dayTextSelected,
            isToday && !isSelected && styles.dayTextToday,
          ]}
        >
          {date.getDate()}
        </Text>
      </View>

      {/* Event dots */}
      {eventColors.length > 0 && (
        <View style={styles.eventDots}>
          {eventColors.slice(0, 3).map((color, index) => (
            <View
              key={index}
              style={[styles.eventDot, { backgroundColor: color }]}
            />
          ))}
        </View>
      )}
    </AnimatedPressable>
  );
}

// Event Row
interface EventRowProps {
  event: ScheduleEvent;
  onPress: () => void;
}

function EventRow({ event, onPress }: EventRowProps) {
  const scale = useSharedValue(1);
  const typeInfo = getEventTypeInfo(event.type);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.eventRow, animatedStyle]}
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
      {/* Time Column */}
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{formatTime(event.startTime)}</Text>
        <Text style={styles.timeDuration}>
          {Math.round((event.endTime.getTime() - event.startTime.getTime()) / 60000)} min
        </Text>
      </View>

      {/* Color Bar */}
      <View style={[styles.eventColorBar, { backgroundColor: typeInfo.color }]} />

      {/* Content */}
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle} numberOfLines={1}>
          {event.title}
        </Text>
        {event.subtitle && (
          <Text style={styles.eventSubtitle} numberOfLines={1}>
            {event.subtitle}
          </Text>
        )}
        {event.clientName && (
          <View style={styles.clientRow}>
            <Ionicons name="person-circle" size={14} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.clientName}>{event.clientName}</Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={IOS_COLORS.systemGray3} />
    </AnimatedPressable>
  );
}

// Main Component
export function IOSCoachSchedule({
  events,
  selectedDate: initialSelectedDate,
  onDateSelect,
  onEventPress,
  onAddEvent,
}: IOSCoachScheduleProps) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate || today);
  const [currentMonth, setCurrentMonth] = useState({
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth(),
  });

  // Get days for current month view
  const calendarDays = useMemo(
    () => getMonthDays(currentMonth.year, currentMonth.month),
    [currentMonth]
  );

  // Map events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    events.forEach((event) => {
      const key = event.startTime.toDateString();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(event);
    });
    return map;
  }, [events]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    const dateKey = selectedDate.toDateString();
    return (eventsByDate.get(dateKey) || []).sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
  }, [selectedDate, eventsByDate]);

  // Navigation
  const goToPreviousMonth = () => {
    triggerHaptic('impactLight');
    setCurrentMonth((prev) => ({
      year: prev.month === 0 ? prev.year - 1 : prev.year,
      month: prev.month === 0 ? 11 : prev.month - 1,
    }));
  };

  const goToNextMonth = () => {
    triggerHaptic('impactLight');
    setCurrentMonth((prev) => ({
      year: prev.month === 11 ? prev.year + 1 : prev.year,
      month: prev.month === 11 ? 0 : prev.month + 1,
    }));
  };

  const goToToday = () => {
    triggerHaptic('impactLight');
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth({
      year: today.getFullYear(),
      month: today.getMonth(),
    });
    onDateSelect?.(today);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const monthLabel = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <Pressable style={styles.navButton} onPress={goToPreviousMonth}>
          <Ionicons name="chevron-back" size={24} color={IOS_COLORS.systemBlue} />
        </Pressable>

        <Pressable onPress={goToToday}>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
        </Pressable>

        <Pressable style={styles.navButton} onPress={goToNextMonth}>
          <Ionicons name="chevron-forward" size={24} color={IOS_COLORS.systemBlue} />
        </Pressable>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day, index) => (
          <Text key={index} style={styles.weekdayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((date, index) => {
          const dateKey = date.toDateString();
          const dateEvents = eventsByDate.get(dateKey) || [];
          const eventColors = dateEvents.map((e) => getEventTypeInfo(e.type).color);

          return (
            <CalendarDayCell
              key={index}
              date={date}
              isCurrentMonth={date.getMonth() === currentMonth.month}
              isSelected={isSameDay(date, selectedDate)}
              isToday={isSameDay(date, today)}
              eventColors={eventColors}
              onPress={() => handleDateSelect(date)}
            />
          );
        })}
      </View>

      {/* Selected Date Events */}
      <View style={styles.eventsSection}>
        <View style={styles.eventsSectionHeader}>
          <Text style={styles.eventsSectionTitle}>
            {formatDateHeader(selectedDate)}
          </Text>
          {onAddEvent && (
            <Pressable
              style={styles.addEventButton}
              onPress={() => {
                triggerHaptic('impactLight');
                onAddEvent(selectedDate);
              }}
            >
              <Ionicons name="add" size={20} color={IOS_COLORS.systemBlue} />
            </Pressable>
          )}
        </View>

        <ScrollView
          style={styles.eventsScrollView}
          contentContainerStyle={styles.eventsContent}
          showsVerticalScrollIndicator={false}
        >
          {selectedDateEvents.length > 0 ? (
            selectedDateEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onPress={() => onEventPress?.(event)}
              />
            ))
          ) : (
            <View style={styles.emptyEvents}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={32} color={IOS_COLORS.systemGray3} />
              </View>
              <Text style={styles.emptyTitle}>No Events</Text>
              <Text style={styles.emptySubtitle}>
                Nothing scheduled for this day
              </Text>
              {onAddEvent && (
                <Pressable
                  style={styles.addButton}
                  onPress={() => {
                    triggerHaptic('impactLight');
                    onAddEvent(selectedDate);
                  }}
                >
                  <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Add Event</Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { type: 'session', label: 'Session' },
          { type: 'available', label: 'Available' },
          { type: 'blocked', label: 'Blocked' },
        ].map((item) => {
          const typeInfo = getEventTypeInfo(item.type as ScheduleEvent['type']);
          return (
            <View key={item.type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: typeInfo.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },

  // Calendar Header
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  navButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },

  // Weekday Row
  weekdayRow: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    paddingVertical: IOS_SPACING.sm,
    paddingHorizontal: IOS_SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },

  // Calendar Grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.md,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberSelected: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  dayNumberToday: {
    backgroundColor: `${IOS_COLORS.systemRed}15`,
  },
  dayText: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    color: IOS_COLORS.label,
  },
  dayTextOutside: {
    color: IOS_COLORS.tertiaryLabel,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayTextToday: {
    color: IOS_COLORS.systemRed,
    fontWeight: '600',
  },
  eventDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 6,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Events Section
  eventsSection: {
    flex: 1,
    marginTop: IOS_SPACING.md,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.sm,
  },
  eventsSectionTitle: {
    fontSize: IOS_TYPOGRAPHY.title3.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  addEventButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventsScrollView: {
    flex: 1,
  },
  eventsContent: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.xxxl,
  },

  // Event Row
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    marginBottom: IOS_SPACING.sm,
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
  timeColumn: {
    width: 60,
    paddingVertical: IOS_SPACING.md,
    paddingLeft: IOS_SPACING.md,
    alignItems: 'center',
  },
  timeText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  timeDuration: {
    fontSize: IOS_TYPOGRAPHY.caption2.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  eventColorBar: {
    width: 4,
    alignSelf: 'stretch',
    marginLeft: IOS_SPACING.sm,
  },
  eventContent: {
    flex: 1,
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.md,
  },
  eventTitle: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  eventSubtitle: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  clientName: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.secondaryLabel,
  },

  // Empty State
  emptyEvents: {
    alignItems: 'center',
    paddingVertical: IOS_SPACING.xxxl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: IOS_COLORS.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: IOS_SPACING.md,
  },
  emptyTitle: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.xs,
  },
  emptySubtitle: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: IOS_SPACING.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.systemBlue,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    borderRadius: IOS_RADIUS.md,
  },
  addButtonText: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.secondaryLabel,
  },
});

export default IOSCoachSchedule;
