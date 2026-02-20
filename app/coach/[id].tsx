import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { coachingService } from '@/services/CoachingService';
import { useCoachingStatus } from '@/hooks/useCoachingStatus';
import { parseISO, isWithinInterval, startOfDay } from 'date-fns';

interface BlockedDate {
  id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  block_type: string;
}

export default function CoachProfileScreen() {
  const router = useRouter();
  const { id, action } = useLocalSearchParams<{ id: string; action?: string }>();
  const { relationship } = useCoachingStatus();
  const [coach, setCoach] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoachProfile();
  }, [id]);

  useEffect(() => {
    if (action === 'book' && coach && availability.length > 0) {
      // Auto-select first available date
      const firstAvailableDate = availability[0]?.start_time;
      if (firstAvailableDate) {
        const dateStr = new Date(firstAvailableDate).toISOString().split('T')[0];
        setSelectedDate(dateStr);
      }
    }
  }, [action, coach, availability]);

  const loadCoachProfile = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const profile = await coachingService.getCoachPublicProfile(id);
      setCoach(profile);

      // Load availability for next 30 days
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const slots = await coachingService.getAvailabilitySlots(
        id,
        now,
        endDate,
        true
      );
      setAvailability(slots);

      // Load blocked dates to filter from calendar
      const blocked = await coachingService.getBlockedDates(id);
      setBlockedDates(blocked);
    } catch (error) {
      console.error('Error loading coach profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if a date falls within any blocked date range
  const isDateBlocked = (dateStr: string): boolean => {
    const checkDate = startOfDay(parseISO(dateStr));
    return blockedDates.some((blocked) => {
      const startDate = startOfDay(parseISO(blocked.start_date));
      const endDate = startOfDay(parseISO(blocked.end_date));
      return isWithinInterval(checkDate, { start: startDate, end: endDate });
    });
  };

  const getMarkedDates = () => {
    const marked: any = {};

    // Mark blocked dates as disabled
    blockedDates.forEach((blocked) => {
      const start = parseISO(blocked.start_date);
      const end = parseISO(blocked.end_date);
      let current = start;
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        marked[dateStr] = {
          disabled: true,
          disableTouchEvent: true,
          textColor: '#CCCCCC',
        };
        current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
      }
    });

    // Mark available dates (skip if blocked)
    availability.forEach((slot) => {
      const date = new Date(slot.start_time).toISOString().split('T')[0];
      if (!marked[date]?.disabled) {
        marked[date] = {
          marked: true,
          dotColor: '#007AFF',
          activeOpacity: 0,
        };
      }
    });

    if (selectedDate && !marked[selectedDate]?.disabled) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#007AFF',
      };
    }

    return marked;
  };

  const getAvailableTimesForDate = (date: string) => {
    return availability.filter((slot) => {
      const slotDate = new Date(slot.start_time).toISOString().split('T')[0];
      return slotDate === date;
    });
  };

  const handleBookSlot = (slot: any) => {
    router.push({
      pathname: '/coach/book',
      params: {
        coachId: coach.id,
        coachName: coach.display_name,
        slotId: slot.id,
        startTime: slot.start_time,
        endTime: slot.end_time,
        hourlyRate: coach.hourly_rate_usd?.toString() || '0',
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!coach) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Coach not found</Text>
        <TouchableOpacity
          style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#007AFF', borderRadius: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const availableTimesForSelectedDate = selectedDate
    ? getAvailableTimesForDate(selectedDate)
    : [];

  return (
    <ScrollView style={styles.container}>
      {/* Coach Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            {coach.profile_photo_url ? (
              <Image
                source={{ uri: coach.profile_photo_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {coach.display_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.coachName}>{coach.display_name}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStars}>★</Text>
              <Text style={styles.ratingValue}>
                {coach.average_rating?.toFixed(1) || '0.0'}
              </Text>
              <Text style={styles.ratingCount}>
                ({coach.total_sessions} sessions)
              </Text>
            </View>
            {coach.based_at && (
              <Text style={styles.location}>📍 {coach.based_at}</Text>
            )}
          </View>
        </View>
        {coach.hourly_rate_usd && (
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>From</Text>
            <Text style={styles.priceValue}>
              ${(coach.hourly_rate_usd / 100).toFixed(0)}/hr
            </Text>
          </View>
        )}
      </View>

      {/* Bio */}
      {coach.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{coach.bio}</Text>
        </View>
      )}

      {/* Specialties */}
      {coach.specialties && coach.specialties.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.specialtiesGrid}>
            {coach.specialties.map((specialty: string, index: number) => (
              <View key={index} style={styles.specialtyBadge}>
                <Text style={styles.specialtyText}>
                  {specialty.replace(/_/g, ' ')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Certifications */}
      {coach.certifications && coach.certifications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {coach.certifications.map((cert: string, index: number) => (
            <View key={index} style={styles.certificationItem}>
              <Text style={styles.certificationIcon}>✓</Text>
              <Text style={styles.certificationText}>{cert}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Availability Calendar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Availability</Text>
        <Calendar
          onDayPress={(day) => {
            // Don't allow selecting blocked dates
            if (!isDateBlocked(day.dateString)) {
              setSelectedDate(day.dateString);
            }
          }}
          markedDates={getMarkedDates()}
          theme={{
            selectedDayBackgroundColor: '#007AFF',
            todayTextColor: '#007AFF',
            arrowColor: '#007AFF',
          }}
        />

        {/* Available Time Slots for Selected Date */}
        {selectedDate && (
          <View style={styles.timeSlotsContainer}>
            <Text style={styles.timeSlotsTitle}>
              Available Times for {new Date(selectedDate).toLocaleDateString()}
            </Text>
            {availableTimesForSelectedDate.length === 0 ? (
              <Text style={styles.noSlotsText}>
                No available slots for this date
              </Text>
            ) : (
              availableTimesForSelectedDate.map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={styles.timeSlot}
                  onPress={() => handleBookSlot(slot)}
                >
                  <View style={styles.timeSlotInfo}>
                    <Text style={styles.timeSlotTime}>
                      {new Date(slot.start_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(slot.end_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                    {slot.notes && (
                      <Text style={styles.timeSlotNotes}>{slot.notes}</Text>
                    )}
                  </View>
                  <Text style={styles.bookSlotButton}>Book →</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>

      {/* Request Custom Time */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Don't see a suitable time?</Text>
        <TouchableOpacity
          style={styles.customRequestButton}
          onPress={() =>
            router.push({
              pathname: '/coach/book',
              params: {
                coachId: coach.id,
                coachName: coach.display_name,
                hourlyRate: coach.hourly_rate_usd?.toString() || '0',
                customRequest: 'true',
              },
            })
          }
        >
          <Text style={styles.customRequestText}>
            Request a Custom Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Subtle coaching prompt for coached sailors */}
      {relationship === 'HAS_COACH' && (
        <View style={styles.coachingPromptSection}>
          <TouchableOpacity
            style={styles.coachingPromptLink}
            onPress={() => router.push('/(auth)/coach-onboarding-welcome')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.coachingPromptText}>Interested in coaching others?</Text>
            <Ionicons name="arrow-forward" size={14} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingStars: {
    fontSize: 18,
    color: '#FFB800',
    marginRight: 4,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  ratingCount: {
    fontSize: 14,
    color: '#666',
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  priceCard: {
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E8F4FD',
    borderRadius: 16,
  },
  specialtyText: {
    fontSize: 14,
    color: '#007AFF',
    textTransform: 'capitalize',
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  certificationIcon: {
    fontSize: 18,
    color: '#10B981',
    marginRight: 8,
  },
  certificationText: {
    fontSize: 14,
    color: '#333',
  },
  timeSlotsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  noSlotsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  timeSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeSlotInfo: {
    flex: 1,
  },
  timeSlotTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeSlotNotes: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  bookSlotButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  customRequestButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customRequestText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  coachingPromptSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  coachingPromptLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coachingPromptText: {
    fontSize: 14,
    color: '#007AFF',
  },
});
