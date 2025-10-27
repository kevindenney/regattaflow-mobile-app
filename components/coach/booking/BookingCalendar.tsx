import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CoachAvailability, CoachingSession } from '../../../types/coach';
import { CoachMarketplaceService } from '../../../services/CoachService';

interface BookingCalendarProps {
  coachId: string;
  serviceId: string;
  onSlotSelected: (slot: BookingSlot) => void;
}

export interface BookingSlot {
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December'];

export default function BookingCalendar({ coachId, serviceId, onSlotSelected }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availability, setAvailability] = useState<CoachAvailability[]>([]);
  const [bookedSessions, setBookedSessions] = useState<CoachingSession[]>([]);
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailability();
  }, [coachId]);

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots(selectedDate);
    }
  }, [selectedDate, availability, bookedSessions]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      // In a real implementation, these would be separate API calls
      const coachProfile = await CoachMarketplaceService.getCoachProfile(coachId);
      setAvailability(coachProfile.availability);

      // Load booked sessions for the current month
      const sessions = await CoachMarketplaceService.getUserSessions(coachId, 'coach');
      setBookedSessions(sessions);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.filter(slot => slot.day_of_week === dayOfWeek);

    const slots: BookingSlot[] = [];

    dayAvailability.forEach(avail => {
      // Parse start and end times
      const [startHour, startMin] = avail.start_time.split(':').map(Number);
      const [endHour, endMin] = avail.end_time.split(':').map(Number);

      // Generate hourly slots
      for (let hour = startHour; hour < endHour; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);

        const slotEnd = new Date(date);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        // Check if slot is already booked
        const isBooked = bookedSessions.some(session => {
          const sessionStart = new Date(session.scheduled_start);
          const sessionEnd = new Date(session.scheduled_end);
          return sessionStart <= slotStart && sessionEnd > slotStart;
        });

        // Check if slot is in the past
        const isPast = slotStart < new Date();

        slots.push({
          date,
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
          isAvailable: !isBooked && !isPast,
        });
      }
    });

    setAvailableSlots(slots);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
    setSelectedDate(null);
    setAvailableSlots([]);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSlotSelect = (slot: BookingSlot) => {
    if (slot.isAvailable) {
      onSlotSelected(slot);
    }
  };

  const isDateAvailable = (date: Date) => {
    const dayOfWeek = date.getDay();
    return availability.some(slot => slot.day_of_week === dayOfWeek);
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${period}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading availability...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => handleMonthChange('prev')}>
          <Text style={styles.monthNavButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => handleMonthChange('next')}>
          <Text style={styles.monthNavButton}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={styles.weekDays}>
        {DAYS.map(day => (
          <Text key={day} style={styles.weekDay}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {getDaysInMonth(currentMonth).map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={styles.emptyDay} />;
          }

          const isToday = date.toDateString() === new Date().toDateString();
          const isSelected = selectedDate?.toDateString() === date.toDateString();
          const isAvailable = isDateAvailable(date) && date >= new Date();
          const isPast = date < new Date();

          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[
                styles.day,
                isToday && styles.dayToday,
                isSelected && styles.daySelected,
                !isAvailable && styles.dayUnavailable,
                isPast && styles.dayPast,
              ]}
              onPress={() => isAvailable && handleDateSelect(date)}
              disabled={!isAvailable}
            >
              <Text style={[
                styles.dayText,
                isToday && styles.dayTextToday,
                isSelected && styles.dayTextSelected,
                !isAvailable && styles.dayTextUnavailable,
                isPast && styles.dayTextPast,
              ]}>
                {date.getDate()}
              </Text>
              {isAvailable && !isPast && (
                <View style={styles.availabilityDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Time Slots */}
      {selectedDate && (
        <View style={styles.timeSlotsSection}>
          <Text style={styles.timeSlotsTitle}>
            Available Times for {selectedDate.toLocaleDateString()}
          </Text>
          <ScrollView
            style={styles.timeSlotsContainer}
            showsVerticalScrollIndicator={false}
          >
            {availableSlots.length > 0 ? (
              <View style={styles.timeSlotsGrid}>
                {availableSlots.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlot,
                      !slot.isAvailable && styles.timeSlotUnavailable,
                    ]}
                    onPress={() => handleSlotSelect(slot)}
                    disabled={!slot.isAvailable}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      !slot.isAvailable && styles.timeSlotTextUnavailable,
                    ]}>
                      {formatTime(slot.startTime)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.noSlotsText}>
                No available times for this date
              </Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  monthNavButton: {
    fontSize: 28,
    color: '#0066CC',
    paddingHorizontal: 16,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  weekDays: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 8,
  },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayToday: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  daySelected: {
    backgroundColor: '#0066CC',
    borderRadius: 8,
  },
  dayUnavailable: {
    opacity: 0.3,
  },
  dayPast: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  dayTextToday: {
    color: '#0066CC',
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayTextUnavailable: {
    color: '#CCC',
  },
  dayTextPast: {
    color: '#CCC',
  },
  availabilityDot: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00AA33',
  },
  timeSlotsSection: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  timeSlotsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  timeSlotsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#E6F3FF',
    borderRadius: 8,
    marginBottom: 8,
    minWidth: 90,
  },
  timeSlotUnavailable: {
    backgroundColor: '#F5F5F5',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0066CC',
    textAlign: 'center',
  },
  timeSlotTextUnavailable: {
    color: '#999',
  },
  noSlotsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
});