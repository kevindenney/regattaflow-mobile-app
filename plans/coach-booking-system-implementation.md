# Coach Booking System Implementation Plan
*Living Document - Created: October 4, 2025*

## Overview
Complete implementation of the coach discovery and booking system with enhanced filters, payment integration, and automated email notifications. This plan builds on existing CoachingService infrastructure and integrates with Stripe payments and SendGrid emails.

## Current State Assessment

### ✅ Already Implemented
- **CoachingService.ts** (Lines 1-1096) - Comprehensive service with:
  - Coach discovery with filters (lines 1018-1059)
  - Availability slot management (lines 609-726)
  - Booking request creation (lines 732-798)
  - Session management (lines 429-603)
  - Client relationship tracking (lines 224-425)
  - Accept/reject booking workflows (lines 866-1012)

- **Coach Discovery Screen** (`/src/app/coach/discover.tsx`) - Fully functional with:
  - Manual search mode with filters (location, rating, price, specialties)
  - AI-powered matching mode using CoachMatchingAgent
  - Display of compatibility scores and skill gap analysis
  - Coach cards with ratings and session counts

- **Booking Form** (`/src/app/coach/book.tsx`) - Partially implemented with:
  - Session type selection
  - Venue/location selection
  - Message to coach
  - Basic payment flow structure (needs completion)

- **EmailService.ts** - SendGrid integration with templates defined

### ❌ Missing/Incomplete
1. Enhanced discovery filters (boat class, timezone, availability date ranges)
2. Complete payment integration in booking flow
3. Email notification triggers (currently defined but not called)
4. Booking request approval workflow UI
5. Calendar integration (.ics file generation)
6. Session reminder system
7. Booking cancellation with refunds

## Implementation Plan

### Phase 1: Enhanced Coach Discovery (Day 1-2)

#### 1.1 Add Missing Filters to Discovery Screen
**File**: `/src/app/coach/discover.tsx`

**New Filters to Add:**
```typescript
// Add to filters state (line 44-49)
const [filters, setFilters] = useState({
  location: '',
  minRating: 0,
  maxHourlyRate: 0,
  specialties: [] as string[],
  boatClass: '', // NEW
  timezone: '', // NEW
  availability: 'any' as 'next_7_days' | 'next_30_days' | 'flexible' | 'any', // NEW
  sessionType: 'any' as 'on_water' | 'video_review' | 'strategy_planning' | 'any', // NEW
});
```

**UI Components to Add (after line 434):**

1. **Boat Class Dropdown**:
```typescript
<View style={styles.filterItem}>
  <Text style={styles.filterLabel}>Boat Class</Text>
  <Picker
    selectedValue={filters.boatClass}
    onValueChange={(value) => setFilters({ ...filters, boatClass: value })}
    style={styles.picker}
  >
    <Picker.Item label="All Classes" value="" />
    <Picker.Item label="Dragon" value="dragon" />
    <Picker.Item label="J/70" value="j70" />
    <Picker.Item label="J/80" value="j80" />
    <Picker.Item label="Etchells" value="etchells" />
    <Picker.Item label="Swan 47" value="swan_47" />
    {/* Add more classes from database */}
  </Picker>
</View>
```

2. **Timezone Picker**:
```typescript
<View style={styles.filterItem}>
  <Text style={styles.filterLabel}>Preferred Timezone</Text>
  <Picker
    selectedValue={filters.timezone}
    onValueChange={(value) => setFilters({ ...filters, timezone: value })}
    style={styles.picker}
  >
    <Picker.Item label="Any Timezone" value="" />
    <Picker.Item label="America/New_York (EST)" value="America/New_York" />
    <Picker.Item label="America/Los_Angeles (PST)" value="America/Los_Angeles" />
    <Picker.Item label="Europe/London (GMT)" value="Europe/London" />
    <Picker.Item label="Asia/Hong_Kong (HKT)" value="Asia/Hong_Kong" />
    <Picker.Item label="Australia/Sydney (AEST)" value="Australia/Sydney" />
  </Picker>
</View>
```

3. **Availability Filter**:
```typescript
<View style={styles.filterItem}>
  <Text style={styles.filterLabel}>Availability</Text>
  <View style={styles.ratingButtons}>
    {[
      { value: 'any', label: 'Any Time' },
      { value: 'next_7_days', label: 'Next 7 Days' },
      { value: 'next_30_days', label: 'Next 30 Days' },
      { value: 'flexible', label: 'Flexible' },
    ].map((option) => (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.ratingButton,
          filters.availability === option.value && styles.ratingButtonActive,
        ]}
        onPress={() => setFilters({ ...filters, availability: option.value as any })}
      >
        <Text
          style={[
            styles.ratingButtonText,
            filters.availability === option.value && styles.ratingButtonTextActive,
          ]}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>
```

4. **Session Type Filter**:
```typescript
<View style={styles.filterItem}>
  <Text style={styles.filterLabel}>Session Type</Text>
  <View style={styles.specialtyChips}>
    {[
      { value: 'any', label: 'Any Type' },
      { value: 'on_water', label: 'On-Water Coaching' },
      { value: 'video_review', label: 'Video Review' },
      { value: 'strategy_planning', label: 'Strategy Planning' },
    ].map((option) => (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.specialtyChip,
          filters.sessionType === option.value && styles.specialtyChipActive,
        ]}
        onPress={() => setFilters({ ...filters, sessionType: option.value as any })}
      >
        <Text
          style={[
            styles.specialtyChipText,
            filters.sessionType === option.value && styles.specialtyChipTextActive,
          ]}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>
```

#### 1.2 Update CoachingService Discovery Query
**File**: `/src/services/CoachingService.ts`

**Modify `discoverCoaches` function (lines 1021-1059):**
```typescript
async discoverCoaches(filters?: {
  location?: string;
  specializations?: string[];
  minRating?: number;
  maxHourlyRate?: number;
  languages?: string[];
  boatClass?: string; // NEW
  timezone?: string; // NEW
  availability?: 'next_7_days' | 'next_30_days' | 'flexible' | 'any'; // NEW
  sessionType?: string; // NEW
}): Promise<CoachProfile[]> {
  let query = supabase
    .from('coach_profiles')
    .select('*')
    .eq('verification_status', 'verified')
    .eq('available_for_sessions', true)
    .order('rating', { ascending: false });

  // Existing filters...
  if (filters?.location) {
    query = query.or(`based_at.eq.${filters.location},available_locations.cs.{${filters.location}}`);
  }

  if (filters?.minRating) {
    query = query.gte('average_rating', filters.minRating);
  }

  if (filters?.maxHourlyRate) {
    query = query.lte('hourly_rate', filters.maxHourlyRate);
  }

  if (filters?.specializations && filters.specializations.length > 0) {
    query = query.contains('specialties', filters.specializations);
  }

  // NEW: Boat class filter
  if (filters?.boatClass) {
    query = query.contains('boat_classes_coached', [filters.boatClass]);
  }

  // NEW: Timezone filter
  if (filters?.timezone) {
    query = query.eq('timezone', filters.timezone);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error discovering coaches:', error);
    throw error;
  }

  let coaches = data || [];

  // NEW: Filter by availability window
  if (filters?.availability && filters.availability !== 'any') {
    const now = new Date();
    let endDate: Date;

    if (filters.availability === 'next_7_days') {
      endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (filters.availability === 'next_30_days') {
      endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      // 'flexible' - no specific range, just check they have future availability
      endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    }

    // For each coach, check if they have availability in the time window
    const coachesWithAvailability = await Promise.all(
      coaches.map(async (coach) => {
        const slots = await this.getAvailabilitySlots(coach.id, now, endDate, true);
        return slots.length > 0 ? coach : null;
      })
    );

    coaches = coachesWithAvailability.filter((c) => c !== null) as CoachProfile[];
  }

  return coaches;
}
```

#### 1.3 Enhance Coach Cards Display
**File**: `/src/app/coach/discover.tsx`

**Update coach card to show quick stats (after line 498):**
```typescript
{/* Quick Stats Bar */}
<View style={styles.quickStats}>
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{coach.total_sessions || 0}</Text>
    <Text style={styles.statLabel}>Sessions</Text>
  </View>
  <View style={styles.statItem}>
    <Text style={styles.statValue}>
      {coach.average_rating?.toFixed(1) || '0.0'}★
    </Text>
    <Text style={styles.statLabel}>Rating</Text>
  </View>
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{coach.total_clients || 0}</Text>
    <Text style={styles.statLabel}>Clients</Text>
  </View>
</View>

{/* Action Buttons */}
<View style={styles.actionButtons}>
  <TouchableOpacity
    style={styles.viewProfileButton}
    onPress={() => router.push(`/coach/${coach.id}`)}
  >
    <Text style={styles.viewProfileText}>View Profile</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={styles.bookNowButton}
    onPress={() => router.push(`/coach/${coach.id}?action=book`)}
  >
    <Text style={styles.bookNowText}>Book Now</Text>
  </TouchableOpacity>
</View>
```

**Add styles:**
```typescript
quickStats: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  paddingVertical: 12,
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  marginTop: 12,
},
statItem: {
  alignItems: 'center',
},
statValue: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#007AFF',
},
statLabel: {
  fontSize: 12,
  color: '#666',
  marginTop: 2,
},
actionButtons: {
  flexDirection: 'row',
  gap: 8,
  marginTop: 12,
},
viewProfileButton: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#007AFF',
  alignItems: 'center',
},
viewProfileText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#007AFF',
},
bookNowButton: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 8,
  backgroundColor: '#007AFF',
  alignItems: 'center',
},
bookNowText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#FFFFFF',
},
```

---

### Phase 2: Complete Booking Flow (Day 3-4)

#### 2.1 Create Coach Profile Screen with Availability Calendar
**File**: `/src/app/coach/[id].tsx` (needs enhancement)

**Key Features:**
1. Full coach profile display
2. Interactive availability calendar
3. Quick booking button
4. Reviews and testimonials
5. Coach statistics

**Implementation:**
```typescript
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
import { coachingService } from '@/src/services/CoachingService';

export default function CoachProfileScreen() {
  const router = useRouter();
  const { id, action } = useLocalSearchParams<{ id: string; action?: string }>();
  const [coach, setCoach] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoachProfile();
  }, [id]);

  useEffect(() => {
    if (action === 'book' && coach) {
      // Auto-scroll to calendar
    }
  }, [action, coach]);

  const loadCoachProfile = async () => {
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
    } catch (error) {
      console.error('Error loading coach profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};

    availability.forEach((slot) => {
      const date = new Date(slot.start_time).toISOString().split('T')[0];
      marked[date] = {
        marked: true,
        dotColor: '#007AFF',
        activeOpacity: 0,
      };
    });

    if (selectedDate) {
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
                  {specialty.replace('_', ' ')}
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
          onDayPress={(day) => setSelectedDate(day.dateString)}
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
              pathname: '/coach/custom-request',
              params: {
                coachId: coach.id,
                coachName: coach.display_name,
              },
            })
          }
        >
          <Text style={styles.customRequestText}>
            Request a Custom Time
          </Text>
        </TouchableOpacity>
      </View>

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
});
```

#### 2.2 Complete Booking Form Payment Integration
**File**: `/src/app/coach/book.tsx`

**Issues to Fix:**
1. PaymentService import is platform-specific but used generically
2. Payment flow needs proper error handling
3. Calendar attachment generation missing

**Updated Implementation:**

```typescript
// Fix imports at top (replace lines 15-16)
import { Platform } from 'react-native';

// Platform-specific payment imports
let PaymentService: any;
if (Platform.OS === 'web') {
  PaymentService = require('@/src/services/PaymentService.web').PaymentService;
} else {
  PaymentService = require('@/src/services/PaymentService.native').PaymentService;
}

// Update handleSubmitBooking function (lines 67-155)
const handleSubmitBooking = async () => {
  try {
    setLoading(true);

    const totalCost = calculateSessionCost();
    const totalCostCents = Math.round(totalCost * 100);

    // Step 1: Create the booking request
    const booking = await coachingService.createBookingRequest(
      params.coachId,
      new Date(params.startTime),
      new Date(params.endTime),
      {
        sessionType,
        message: message.trim() || undefined,
        availabilitySlotId: params.slotId,
        totalAmountCents: totalCostCents,
      }
    );

    // Booking request created successfully
    Alert.alert(
      'Booking Request Sent',
      `Your booking request has been sent to ${params.coachName}. You'll receive an email when they respond.`,
      [
        {
          text: 'OK',
          onPress: () => router.replace('/coach/my-bookings'),
        },
      ]
    );

    // Email notifications are handled automatically by CoachingService.createBookingRequest
  } catch (error) {
    console.error('Error creating booking:', error);
    Alert.alert('Error', 'Failed to send booking request. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

**Notes:**
- Payment is processed AFTER coach accepts (not during booking request)
- This matches the CoachingService implementation which uses `accept_booking` RPC
- Email notifications are already triggered in CoachingService lines 785-795

#### 2.3 Add CoachingService Missing Functions

**File**: `/src/services/CoachingService.ts`

These functions are **already implemented**. No changes needed:
- ✅ `createBooking()` - Line 732 (`createBookingRequest`)
- ✅ `getCoachAvailability()` - Line 645 (`getAvailabilitySlots`)
- ✅ `confirmSession()` - Line 867 (`acceptBookingRequest`) - creates session
- ✅ `cancelSession()` - Line 965 (`cancelBookingRequest`)
- ✅ `completeSession()` - Need to add this

**Add Complete Session Function (after line 1012):**
```typescript
/**
 * Complete a coaching session
 */
async completeSession(
  sessionId: string,
  completionData: {
    sessionNotes?: string;
    homework?: string;
    rating?: number;
  }
): Promise<void> {
  const { data: session, error: sessionError } = await supabase
    .from('coaching_sessions')
    .select(`
      *,
      coach:coach_profiles!coach_id (
        display_name,
        stripe_account_id,
        user_id,
        users!coach_profiles_user_id_fkey (
          email,
          full_name
        )
      ),
      sailor:users!sailor_id (
        email,
        full_name
      )
    `)
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error('Session not found');
  }

  // Update session to completed
  const { error: updateError } = await supabase
    .from('coaching_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      session_notes: completionData.sessionNotes,
      homework: completionData.homework,
    })
    .eq('id', sessionId);

  if (updateError) {
    console.error('Error completing session:', updateError);
    throw updateError;
  }

  // Trigger payout to coach (if using Stripe Connect)
  if (session.paid && session.coach?.stripe_account_id) {
    // Trigger Stripe Connect payout via Edge Function
    const { error: payoutError } = await supabase.functions.invoke(
      'process-coach-payout',
      {
        body: {
          sessionId: sessionId,
          coachStripeAccountId: session.coach.stripe_account_id,
          amount: session.fee_amount,
        },
      }
    );

    if (payoutError) {
      console.error('Error processing coach payout:', payoutError);
      // Don't throw - payout can be retried manually
    }
  }

  // Send completion email to sailor
  const { emailService } = await import('./EmailService');
  await emailService.sendSessionCompletionNotification({
    sailor_name: session.sailor?.full_name || 'Sailor',
    sailor_email: session.sailor?.email || '',
    coach_name: session.coach?.display_name || 'Coach',
    session_type: session.session_type,
    session_date: session.scheduled_at || session.started_at || '',
    session_notes: completionData.sessionNotes,
    homework: completionData.homework,
  });

  // Request feedback from sailor
  await emailService.sendFeedbackRequest({
    sailor_name: session.sailor?.full_name || 'Sailor',
    sailor_email: session.sailor?.email || '',
    coach_name: session.coach?.display_name || 'Coach',
    session_id: sessionId,
  });
}
```

#### 2.4 Create Booking Request Workflow UI

**File**: `/src/app/coach/my-bookings.tsx` (NEW)

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { coachingService } from '@/src/services/CoachingService';

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const statusFilter =
        filter === 'all' ? undefined : filter;
      const results = await coachingService.getSailorBookingRequests(
        statusFilter
      );
      setBookings(results);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await coachingService.cancelBookingRequest(bookingId, 'Cancelled by sailor');
      loadBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const renderStatusBadge = (status: string) => {
    const statusColors: any = {
      pending: '#F59E0B',
      accepted: '#10B981',
      rejected: '#EF4444',
      cancelled: '#6B7280',
    };

    return (
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: statusColors[status] || '#6B7280' },
        ]}
      >
        <Text style={styles.statusText}>{status.toUpperCase()}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {['all', 'pending', 'accepted', 'rejected'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              filter === status && styles.filterTabActive,
            ]}
            onPress={() => setFilter(status)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === status && styles.filterTabTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.bookingsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {bookings.length === 0 ? (
          <Text style={styles.emptyText}>No bookings found</Text>
        ) : (
          bookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.coachName}>
                  {booking.coach?.display_name}
                </Text>
                {renderStatusBadge(booking.status)}
              </View>

              <View style={styles.bookingDetails}>
                <Text style={styles.sessionType}>
                  {booking.session_type.replace('_', ' ')}
                </Text>
                <Text style={styles.datetime}>
                  {new Date(booking.requested_start_time).toLocaleDateString(
                    'en-US',
                    {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    }
                  )}
                </Text>
                <Text style={styles.amount}>
                  ${(booking.total_amount_cents / 100).toFixed(2)}
                </Text>
              </View>

              {booking.sailor_message && (
                <View style={styles.messageContainer}>
                  <Text style={styles.messageLabel}>Your message:</Text>
                  <Text style={styles.messageText}>
                    {booking.sailor_message}
                  </Text>
                </View>
              )}

              {booking.coach_response && (
                <View style={styles.responseContainer}>
                  <Text style={styles.responseLabel}>Coach response:</Text>
                  <Text style={styles.responseText}>
                    {booking.coach_response}
                  </Text>
                </View>
              )}

              {booking.status === 'pending' && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelBooking(booking.id)}
                >
                  <Text style={styles.cancelButtonText}>Cancel Request</Text>
                </TouchableOpacity>
              )}

              {booking.status === 'accepted' && (
                <TouchableOpacity
                  style={styles.viewSessionButton}
                  onPress={() =>
                    router.push(`/coach/session/${booking.session_id}`)
                  }
                >
                  <Text style={styles.viewSessionText}>View Session</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
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
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  bookingsList: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 32,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  coachName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bookingDetails: {
    marginBottom: 12,
  },
  sessionType: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  datetime: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  messageContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  responseContainer: {
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  responseLabel: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: '#333',
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  viewSessionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewSessionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

---

### Phase 3: Email Notification System (Day 5)

#### 3.1 Complete EmailService Templates

**File**: `/src/services/EmailService.ts`

**Add Missing Template Functions (after line 100):**

```typescript
/**
 * Send session completion notification to sailor
 */
async sendSessionCompletionNotification(data: {
  sailor_name: string;
  sailor_email: string;
  coach_name: string;
  session_type: string;
  session_date: string;
  session_notes?: string;
  homework?: string;
}): Promise<void> {
  const template = this.generateSessionCompletionTemplate(data);
  await this.sendEmail({
    to: data.sailor_email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send feedback request email
 */
async sendFeedbackRequest(data: {
  sailor_name: string;
  sailor_email: string;
  coach_name: string;
  session_id: string;
}): Promise<void> {
  const template = this.generateFeedbackRequestTemplate(data);
  await this.sendEmail({
    to: data.sailor_email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send 24-hour session reminder
 */
async sendSessionReminder(data: {
  participant_name: string;
  participant_email: string;
  coach_name?: string;
  sailor_name?: string;
  session_type: string;
  session_date: string;
  location?: string;
  preparation_notes?: string;
}): Promise<void> {
  const template = this.generateSessionReminderTemplate(data);
  await this.sendEmail({
    to: data.participant_email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Generate session completion email template
 */
private generateSessionCompletionTemplate(data: {
  sailor_name: string;
  coach_name: string;
  session_type: string;
  session_date: string;
  session_notes?: string;
  homework?: string;
}): EmailTemplate {
  const subject = `Session Complete: ${data.session_type} with ${data.coach_name}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007AFF; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .section { margin-bottom: 20px; }
          .notes { background: #E8F4FD; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .homework { background: #FFF7ED; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .button { display: inline-block; background: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⛵ Session Complete!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.sailor_name},</p>
            <p>Your coaching session with <strong>${data.coach_name}</strong> has been completed.</p>

            <div class="section">
              <h3>Session Details</h3>
              <p>
                <strong>Type:</strong> ${data.session_type}<br>
                <strong>Date:</strong> ${new Date(data.session_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>

            ${data.session_notes ? `
              <div class="notes">
                <h3>📝 Session Notes</h3>
                <p>${data.session_notes}</p>
              </div>
            ` : ''}

            ${data.homework ? `
              <div class="homework">
                <h3>📚 Homework & Next Steps</h3>
                <p>${data.homework}</p>
              </div>
            ` : ''}

            <div class="section">
              <p>We'd love to hear about your experience!</p>
              <a href="${process.env.EXPO_PUBLIC_APP_URL}/feedback?type=session" class="button">
                Leave Feedback
              </a>
            </div>
          </div>
          <div class="footer">
            <p>RegattaFlow - Your Sailing Performance Platform</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Session Complete!

    Hi ${data.sailor_name},

    Your coaching session with ${data.coach_name} has been completed.

    Session Details:
    - Type: ${data.session_type}
    - Date: ${new Date(data.session_date).toLocaleDateString()}

    ${data.session_notes ? `Session Notes:\n${data.session_notes}\n\n` : ''}
    ${data.homework ? `Homework & Next Steps:\n${data.homework}\n\n` : ''}

    We'd love to hear about your experience. Please leave feedback at:
    ${process.env.EXPO_PUBLIC_APP_URL}/feedback?type=session

    RegattaFlow - Your Sailing Performance Platform
  `;

  return { subject, html, text };
}

/**
 * Generate feedback request template
 */
private generateFeedbackRequestTemplate(data: {
  sailor_name: string;
  coach_name: string;
  session_id: string;
}): EmailTemplate {
  const subject = `How was your session with ${data.coach_name}?`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7C3AED; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .stars { font-size: 32px; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⭐ Rate Your Session</h1>
          </div>
          <div class="content">
            <p>Hi ${data.sailor_name},</p>
            <p>Thank you for completing your session with <strong>${data.coach_name}</strong>!</p>
            <p>Your feedback helps us maintain quality coaching and helps other sailors find the right coach.</p>

            <div class="stars">⭐⭐⭐⭐⭐</div>

            <div style="text-align: center;">
              <a href="${process.env.EXPO_PUBLIC_APP_URL}/coach/session/${data.session_id}/feedback" class="button">
                Leave Feedback
              </a>
            </div>

            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              Your feedback will be visible to other sailors and will help ${data.coach_name} improve their coaching services.
            </p>
          </div>
          <div class="footer">
            <p>RegattaFlow - Your Sailing Performance Platform</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Rate Your Session

    Hi ${data.sailor_name},

    Thank you for completing your session with ${data.coach_name}!

    Your feedback helps us maintain quality coaching and helps other sailors find the right coach.

    Please leave your feedback at:
    ${process.env.EXPO_PUBLIC_APP_URL}/coach/session/${data.session_id}/feedback

    RegattaFlow - Your Sailing Performance Platform
  `;

  return { subject, html, text };
}

/**
 * Generate session reminder template
 */
private generateSessionReminderTemplate(data: {
  participant_name: string;
  coach_name?: string;
  sailor_name?: string;
  session_type: string;
  session_date: string;
  location?: string;
  preparation_notes?: string;
}): EmailTemplate {
  const otherParty = data.coach_name || data.sailor_name || 'your session partner';
  const subject = `⏰ Reminder: Coaching session tomorrow with ${otherParty}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F59E0B; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .reminder-box { background: #FFF7ED; border-left: 4px solid #F59E0B; padding: 15px; margin: 15px 0; }
          .prep-notes { background: #E8F4FD; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .button { display: inline-block; background: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Session Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${data.participant_name},</p>
            <p>This is a friendly reminder about your upcoming coaching session:</p>

            <div class="reminder-box">
              <h3>Session Details</h3>
              <p>
                <strong>With:</strong> ${otherParty}<br>
                <strong>Type:</strong> ${data.session_type}<br>
                <strong>When:</strong> ${new Date(data.session_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}<br>
                ${data.location ? `<strong>Location:</strong> ${data.location}<br>` : ''}
              </p>
            </div>

            ${data.preparation_notes ? `
              <div class="prep-notes">
                <h3>📋 Preparation Notes</h3>
                <p>${data.preparation_notes}</p>
              </div>
            ` : ''}

            <div style="text-align: center;">
              <a href="${process.env.EXPO_PUBLIC_APP_URL}/coach/sessions" class="button">
                View Session Details
              </a>
            </div>

            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              Need to reschedule? Please contact ${otherParty} as soon as possible.
            </p>
          </div>
          <div class="footer">
            <p>RegattaFlow - Your Sailing Performance Platform</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Session Reminder

    Hi ${data.participant_name},

    This is a friendly reminder about your upcoming coaching session:

    Session Details:
    - With: ${otherParty}
    - Type: ${data.session_type}
    - When: ${new Date(data.session_date).toLocaleDateString()}
    ${data.location ? `- Location: ${data.location}` : ''}

    ${data.preparation_notes ? `Preparation Notes:\n${data.preparation_notes}\n\n` : ''}

    View session details at:
    ${process.env.EXPO_PUBLIC_APP_URL}/coach/sessions

    Need to reschedule? Please contact ${otherParty} as soon as possible.

    RegattaFlow - Your Sailing Performance Platform
  `;

  return { subject, html, text };
}
```

#### 3.2 Create Session Reminder Background Job

**File**: `/supabase/functions/send-session-reminders/index.ts` (NEW)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all sessions scheduled for 24 hours from now (+/- 1 hour window)
    const now = new Date();
    const reminderWindowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const reminderWindowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: sessions, error } = await supabase
      .from('coaching_sessions')
      .select(`
        *,
        coach:coach_profiles!coach_id (
          display_name,
          users!coach_profiles_user_id_fkey (
            email,
            full_name
          )
        ),
        sailor:users!sailor_id (
          email,
          full_name
        )
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_at', reminderWindowStart.toISOString())
      .lte('scheduled_at', reminderWindowEnd.toISOString())
      .is('reminder_sent', false);

    if (error) throw error;

    console.log(`Found ${sessions?.length || 0} sessions requiring reminders`);

    for (const session of sessions || []) {
      // Send reminder to coach
      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          type: 'session_reminder',
          data: {
            participant_name: session.coach.users.full_name || session.coach.display_name,
            participant_email: session.coach.users.email,
            sailor_name: session.sailor.full_name,
            session_type: session.session_type,
            session_date: session.scheduled_at,
            location: session.location_notes,
          },
        }),
      });

      // Send reminder to sailor
      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          type: 'session_reminder',
          data: {
            participant_name: session.sailor.full_name,
            participant_email: session.sailor.email,
            coach_name: session.coach.display_name,
            session_type: session.session_type,
            session_date: session.scheduled_at,
            location: session.location_notes,
          },
        }),
      });

      // Mark reminder as sent
      await supabase
        .from('coaching_sessions')
        .update({ reminder_sent: true })
        .eq('id', session.id);

      console.log(`✅ Sent reminders for session ${session.id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sessionCount: sessions?.length || 0,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
```

**Add Cron Job** (via Supabase dashboard or config):
```yaml
# In supabase/config.toml
[functions.send-session-reminders]
  schedule = "0 */1 * * *"  # Run every hour
```

---

## Database Schema Updates

**File**: `supabase/migrations/20251004_coach_booking_enhancements.sql` (NEW)

```sql
-- Add missing columns to coach_profiles
ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS boat_classes_coached TEXT[],
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add reminder_sent column to coaching_sessions
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_profiles_boat_classes ON coach_profiles USING GIN(boat_classes_coached);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_timezone ON coach_profiles(timezone);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_scheduled_at ON coaching_sessions(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_reminder_sent ON coaching_sessions(reminder_sent, scheduled_at) WHERE status = 'scheduled';

-- Update coach_match_scores table to store detailed breakdown
ALTER TABLE coach_match_scores
ADD COLUMN IF NOT EXISTS score_breakdown JSONB,
ADD COLUMN IF NOT EXISTS recommendations TEXT[];

COMMENT ON COLUMN coach_match_scores.score_breakdown IS 'Detailed compatibility score breakdown from AI matching';
COMMENT ON COLUMN coach_match_scores.recommendations IS 'Personalized session recommendations from AI';
```

---

## Testing Checklist

### Discovery Testing
- [ ] All filters work correctly (boat class, timezone, availability, session type)
- [ ] AI matching returns coaches sorted by compatibility score
- [ ] Manual search returns filtered results
- [ ] Coach cards display all quick stats correctly
- [ ] "View Profile" and "Book Now" buttons navigate correctly

### Booking Flow Testing
- [ ] Coach profile page loads with availability calendar
- [ ] Calendar shows available dates correctly
- [ ] Selecting a date shows available time slots
- [ ] Booking request is created successfully
- [ ] Email notification is sent to coach
- [ ] Email notification is sent to sailor
- [ ] Booking appears in "My Bookings" screen

### Coach Acceptance Testing
- [ ] Coach receives booking request email
- [ ] Coach can accept booking request
- [ ] Acceptance creates coaching session record
- [ ] Both parties receive confirmation emails with calendar attachments
- [ ] Session appears in both coach and sailor calendars

### Session Completion Testing
- [ ] Coach can mark session as complete
- [ ] Session notes and homework are saved
- [ ] Sailor receives completion email
- [ ] Sailor receives feedback request email
- [ ] Payout is triggered for coach (if applicable)

### Reminder System Testing
- [ ] Cron job runs hourly
- [ ] 24-hour reminders are sent to both parties
- [ ] reminder_sent flag is updated correctly
- [ ] No duplicate reminders are sent

---

## Deployment Steps

1. **Phase 1 (Days 1-2):**
   ```bash
   # Update discovery screen
   git add src/app/coach/discover.tsx
   git add src/services/CoachingService.ts
   git commit -m "feat: enhance coach discovery with boat class, timezone, and availability filters"
   ```

2. **Phase 2 (Days 3-4):**
   ```bash
   # Add coach profile and booking screens
   git add src/app/coach/[id].tsx
   git add src/app/coach/my-bookings.tsx
   git add src/app/coach/book.tsx
   git commit -m "feat: complete coach booking flow with payment integration"
   ```

3. **Phase 3 (Day 5):**
   ```bash
   # Add email templates and reminders
   git add src/services/EmailService.ts
   git add supabase/functions/send-session-reminders/
   git add supabase/migrations/20251004_coach_booking_enhancements.sql
   git commit -m "feat: implement email notifications and session reminders"

   # Deploy database migration
   npx supabase db push

   # Deploy Edge Function
   npx supabase functions deploy send-session-reminders
   ```

---

## Success Metrics

- **Discovery:** Sailors can find coaches matching all filter criteria
- **Booking:** <2 minutes to book a session from discovery to confirmation
- **Email Delivery:** >95% delivery rate for all notifications
- **Session Reminders:** 100% of sessions get 24-hour reminders
- **Feedback Rate:** >60% of completed sessions receive feedback

---

## Future Enhancements (Post-MVP)

1. Video call integration (Zoom/Agora)
2. Group coaching sessions
3. Recurring session bookings
4. Coach performance dashboards
5. Advanced availability rules (vacation, recurring patterns)
6. Multi-currency support
7. Refund handling for cancellations
8. Coach portfolio showcase (before/after videos, case studies)

---

*This plan provides a complete roadmap for implementing the coach booking system. Each phase builds on the previous one and can be tested independently.*
