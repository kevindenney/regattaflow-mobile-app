/**
 * MeetingPointPicker
 *
 * An interactive panel for setting a crew meeting point and time.
 * Uses the existing LocationMapPicker component and saves to race_events.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ChevronLeft,
  Check,
  MapPin,
  Clock,
  MessageSquare,
  ChevronRight,
} from 'lucide-react-native';
import { LocationMapPicker } from '@/components/races/LocationMapPicker';
import { supabase } from '@/services/supabase';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray2: '#636366',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

interface MeetingLocation {
  name: string;
  lat: number;
  lng: number;
  time: string; // ISO string
  notes?: string;
}

interface MeetingPointPickerProps extends ChecklistToolProps {}

export function MeetingPointPicker({
  item,
  raceEventId,
  boatId,
  onComplete,
  onCancel,
}: MeetingPointPickerProps) {
  // State
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [meetingTime, setMeetingTime] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing meeting location
  useEffect(() => {
    const fetchExisting = async () => {
      if (!raceEventId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('race_events')
          .select('meeting_location, start_time')
          .eq('id', raceEventId)
          .maybeSingle();

        if (error) throw error;

        if (data?.meeting_location) {
          const ml = data.meeting_location as MeetingLocation;
          setLocation({ name: ml.name, lat: ml.lat, lng: ml.lng });
          if (ml.time) {
            setMeetingTime(new Date(ml.time));
          }
          if (ml.notes) {
            setNotes(ml.notes);
          }
        } else if (data?.start_time) {
          // Default to 1 hour before race start
          const startTime = new Date(data.start_time);
          startTime.setHours(startTime.getHours() - 1);
          setMeetingTime(startTime);
        }
      } catch (err) {
        console.error('Failed to fetch meeting location:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExisting();
  }, [raceEventId]);

  // Handle location selection
  const handleLocationSelect = useCallback(
    (loc: { name: string; lat: number; lng: number }) => {
      setLocation(loc);
      setShowLocationPicker(false);
    },
    []
  );

  // Handle time change
  const handleTimeChange = useCallback((event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      setMeetingTime(selectedDate);
    }
  }, []);

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if form is valid
  const isValid = location !== null;

  // Handle save
  const handleSave = useCallback(async () => {
    if (!location || !raceEventId) {
      onComplete();
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const meetingLocation: MeetingLocation = {
        name: location.name,
        lat: location.lat,
        lng: location.lng,
        time: meetingTime.toISOString(),
        notes: notes.trim() || undefined,
      };

      const { error: updateError } = await supabase
        .from('race_events')
        .update({ meeting_location: meetingLocation })
        .eq('id', raceEventId);

      if (updateError) throw updateError;

      onComplete();
    } catch (err) {
      console.error('Failed to save meeting location:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [location, meetingTime, notes, raceEventId, onComplete]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={IOS_COLORS.blue} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Meeting Point</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryIcon}>
          <MapPin size={24} color={IOS_COLORS.blue} />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryTitle}>Set Meeting Location</Text>
          <Text style={styles.summarySubtitle}>
            Where and when to meet before the race
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.blue} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView
            style={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentInner}
          >
            {/* Location Field */}
            <View style={styles.fieldCard}>
              <View style={styles.fieldHeader}>
                <MapPin size={18} color={IOS_COLORS.blue} />
                <Text style={styles.fieldLabel}>LOCATION</Text>
              </View>
              <Pressable
                style={styles.locationButton}
                onPress={() => setShowLocationPicker(true)}
              >
                {location ? (
                  <Text style={styles.locationText}>{location.name}</Text>
                ) : (
                  <Text style={styles.placeholderText}>Tap to select location</Text>
                )}
                <ChevronRight size={18} color={IOS_COLORS.gray} />
              </Pressable>
            </View>

            {/* Time Field */}
            <View style={styles.fieldCard}>
              <View style={styles.fieldHeader}>
                <Clock size={18} color={IOS_COLORS.orange} />
                <Text style={styles.fieldLabel}>TIME</Text>
              </View>
              <Pressable
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timeText}>{formatTime(meetingTime)}</Text>
                <ChevronRight size={18} color={IOS_COLORS.gray} />
              </Pressable>

              {(showTimePicker || Platform.OS === 'ios') && (
                <View style={styles.timePickerContainer}>
                  <DateTimePicker
                    value={meetingTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                    style={styles.timePicker}
                  />
                </View>
              )}
            </View>

            {/* Notes Field */}
            <View style={styles.fieldCard}>
              <View style={styles.fieldHeader}>
                <MessageSquare size={18} color={IOS_COLORS.green} />
                <Text style={styles.fieldLabel}>NOTES (OPTIONAL)</Text>
              </View>
              <TextInput
                style={styles.notesInput}
                placeholder="e.g., Meet at the main dock entrance"
                placeholderTextColor={IOS_COLORS.gray}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Bottom Action */}
          <View style={styles.bottomAction}>
            <Pressable
              style={[
                styles.saveButton,
                (!isValid || isSaving) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!isValid || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={18} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>
                    {isValid ? 'Save Meeting Point' : 'Select Location'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </>
      )}

      {/* Location Map Picker Modal */}
      <LocationMapPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectLocation={handleLocationSelect}
        initialLocation={location}
        initialName={location?.name}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  backText: {
    fontSize: 17,
    color: IOS_COLORS.blue,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    minWidth: 80,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    gap: 12,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  summarySubtitle: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: `${IOS_COLORS.red}15`,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 14,
    color: IOS_COLORS.red,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    gap: 16,
  },
  fieldCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    letterSpacing: 0.5,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: IOS_COLORS.background,
    borderRadius: 10,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    flex: 1,
  },
  placeholderText: {
    fontSize: 15,
    color: IOS_COLORS.gray,
    flex: 1,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: IOS_COLORS.background,
    borderRadius: 10,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  timePickerContainer: {
    marginTop: 8,
  },
  timePicker: {
    height: 120,
  },
  notesInput: {
    fontSize: 15,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.background,
    borderRadius: 10,
    padding: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.blue,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: IOS_COLORS.gray,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MeetingPointPicker;
