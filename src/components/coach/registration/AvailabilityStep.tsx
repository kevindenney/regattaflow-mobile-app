import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CoachRegistrationForm } from '../../../types/coach';

interface AvailabilityStepProps {
  data: CoachRegistrationForm;
  updateData: (section: keyof CoachRegistrationForm, data: any) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  isLastStep: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['9:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

export default function AvailabilityStep({ data, updateData }: AvailabilityStepProps) {
  const [availability, setAvailability] = useState(
    data.availability.length > 0
      ? data.availability
      : [
          { day_of_week: 1, start_time: '09:00', end_time: '17:00', is_recurring: true },
          { day_of_week: 2, start_time: '09:00', end_time: '17:00', is_recurring: true },
          { day_of_week: 3, start_time: '09:00', end_time: '17:00', is_recurring: true },
          { day_of_week: 4, start_time: '09:00', end_time: '17:00', is_recurring: true },
          { day_of_week: 5, start_time: '09:00', end_time: '17:00', is_recurring: true },
        ]
  );

  useEffect(() => {
    updateData('availability', availability);
  }, [availability, updateData]);

  const toggleDay = (dayIndex: number) => {
    const hasDay = availability.some(slot => slot.day_of_week === dayIndex);
    if (hasDay) {
      setAvailability(prev => prev.filter(slot => slot.day_of_week !== dayIndex));
    } else {
      setAvailability(prev => [...prev, {
        day_of_week: dayIndex,
        start_time: '09:00',
        end_time: '17:00',
        is_recurring: true,
      }]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Availability</Text>
        <Text style={styles.subtitle}>Set your typical weekly coaching availability</Text>
      </View>

      <View style={styles.daysContainer}>
        {DAYS.map((day, index) => {
          const hasDay = availability.some(slot => slot.day_of_week === index);
          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayButton, hasDay && styles.dayButtonSelected]}
              onPress={() => toggleDay(index)}
            >
              <Text style={[styles.dayButtonText, hasDay && styles.dayButtonTextSelected]}>
                {day.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.selectedText}>
        {availability.length} days selected (9:00 AM - 5:00 PM)
      </Text>

      <Text style={styles.note}>
        Note: This is a simplified version. Full implementation would include custom time ranges, timezone handling, etc.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20 },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', lineHeight: 22 },
  daysContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  dayButton: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
  dayButtonSelected: { borderColor: '#0066CC', backgroundColor: '#0066CC' },
  dayButtonText: { fontSize: 16, color: '#666' },
  dayButtonTextSelected: { color: '#FFFFFF' },
  selectedText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  note: { fontSize: 14, color: '#666', fontStyle: 'italic', marginTop: 20, textAlign: 'center' },
});