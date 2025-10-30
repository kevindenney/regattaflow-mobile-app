/**
 * CrewAvailabilityCalendar Component
 * Calendar view of crew availability with ability to set/update availability
 */

import {
  AvailabilityStatus,
  CrewAvailability,
  crewManagementService,
  CrewMember,
} from '@/services/crewManagementService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface CrewAvailabilityCalendarProps {
  crewMember: CrewMember;
  onUpdate?: () => void;
}

interface CalendarDay {
  date: string;
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  availability?: AvailabilityStatus;
}

export function CrewAvailabilityCalendar({
  crewMember,
  onUpdate,
}: CrewAvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<CrewAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);
  const [newAvailability, setNewAvailability] = useState<{
    status: AvailabilityStatus;
    reason: string;
    notes: string;
  }>({
    status: 'available',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    loadAvailability();
  }, [crewMember.id, currentDate]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const data = await crewManagementService.getCrewAvailability(
        crewMember.id,
        startDate,
        endDate
      );
      setAvailability(data);
    } catch (err) {
      console.error('Error loading availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day).toISOString().split('T')[0];
      days.push({
        date,
        day,
        month: month - 1,
        year,
        isCurrentMonth: false,
        availability: getAvailabilityForDate(date),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day).toISOString().split('T')[0];
      days.push({
        date,
        day,
        month,
        year,
        isCurrentMonth: true,
        availability: getAvailabilityForDate(date),
      });
    }

    // Next month days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day).toISOString().split('T')[0];
      days.push({
        date,
        day,
        month: month + 1,
        year,
        isCurrentMonth: false,
        availability: getAvailabilityForDate(date),
      });
    }

    return days;
  };

  const getAvailabilityForDate = (date: string): AvailabilityStatus | undefined => {
    const avail = availability.find(
      (a) => date >= a.startDate && date <= a.endDate
    );
    return avail?.status;
  };

  const getAvailabilityColor = (status?: AvailabilityStatus) => {
    switch (status) {
      case 'available':
        return '#10B981';
      case 'unavailable':
        return '#EF4444';
      case 'tentative':
        return '#F59E0B';
      default:
        return undefined;
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayPress = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return;

    // If selecting a range, set start or end
    if (!selectedRange) {
      setSelectedRange({ startDate: day.date, endDate: day.date });
    } else if (selectedRange.startDate === selectedRange.endDate) {
      // Extend range
      const start = selectedRange.startDate;
      setSelectedRange({
        startDate: day.date < start ? day.date : start,
        endDate: day.date > start ? day.date : start,
      });
    } else {
      // Reset to new start
      setSelectedRange({ startDate: day.date, endDate: day.date });
    }
  };

  const handleSetAvailability = () => {
    if (!selectedRange) {
      Alert.alert('Error', 'Please select a date range');
      return;
    }

    setShowAddModal(true);
  };

  const handleSaveAvailability = async () => {
    if (!selectedRange) return;

    try {
      await crewManagementService.setCrewAvailability(crewMember.id, {
        startDate: selectedRange.startDate,
        endDate: selectedRange.endDate,
        status: newAvailability.status,
        reason: newAvailability.reason || undefined,
        notes: newAvailability.notes || undefined,
      });

      Alert.alert('Success', 'Availability updated');
      setShowAddModal(false);
      setSelectedRange(null);
      setNewAvailability({ status: 'available', reason: '', notes: '' });
      loadAvailability();
      onUpdate?.();
    } catch (err: any) {
      if (err?.queuedForSync && err?.entity) {
        setAvailability(prev => [...prev, err.entity as CrewAvailability]);
        Alert.alert('Offline', 'Availability will sync once you are back online.');
        setShowAddModal(false);
        setSelectedRange(null);
        setNewAvailability({ status: 'available', reason: '', notes: '' });
        onUpdate?.();
      } else {
        console.error('Error saving availability:', err);
        Alert.alert('Error', 'Failed to save availability');
      }
    }
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }

  const calendarDays = getCalendarDays();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={20} color="#3B82F6" />
        </TouchableOpacity>

        <Text style={styles.monthYear}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>

        <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Week days */}
      <View style={styles.weekDaysRow}>
        {weekDays.map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          const isSelected =
            selectedRange &&
            day.date >= selectedRange.startDate &&
            day.date <= selectedRange.endDate;
          const color = getAvailabilityColor(day.availability);

          return (
            <TouchableOpacity
              key={`${day.date}-${index}`}
              style={[
                styles.dayCell,
                !day.isCurrentMonth && styles.dayCellInactive,
                isSelected && styles.dayCellSelected,
              ]}
              onPress={() => handleDayPress(day)}
              disabled={!day.isCurrentMonth}
            >
              <Text
                style={[
                  styles.dayText,
                  !day.isCurrentMonth && styles.dayTextInactive,
                  isSelected && styles.dayTextSelected,
                ]}
              >
                {day.day}
              </Text>
              {color && (
                <View style={[styles.availabilityDot, { backgroundColor: color }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action buttons */}
      {selectedRange && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSelectedRange(null)}
          >
            <Text style={styles.clearButtonText}>Clear Selection</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.setButton} onPress={handleSetAvailability}>
            <Ionicons name="calendar" size={18} color="#FFFFFF" />
            <Text style={styles.setButtonText}>Set Availability</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>Tentative</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Unavailable</Text>
        </View>
      </View>

      {/* Set availability modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Availability</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedRange && (
              <View style={styles.dateRange}>
                <Text style={styles.dateRangeText}>
                  {new Date(selectedRange.startDate).toLocaleDateString()} -{' '}
                  {new Date(selectedRange.endDate).toLocaleDateString()}
                </Text>
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusButtons}>
                  {(['available', 'tentative', 'unavailable'] as AvailabilityStatus[]).map(
                    (status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusButton,
                          newAvailability.status === status && styles.statusButtonActive,
                          newAvailability.status === status && {
                            backgroundColor: getAvailabilityColor(status),
                          },
                        ]}
                        onPress={() =>
                          setNewAvailability({ ...newAvailability, status })
                        }
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            newAvailability.status === status &&
                              styles.statusButtonTextActive,
                          ]}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Reason (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={newAvailability.reason}
                  onChangeText={(reason) =>
                    setNewAvailability({ ...newAvailability, reason })
                  }
                  placeholder="e.g., Vacation, Work commitment"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newAvailability.notes}
                  onChangeText={(notes) =>
                    setNewAvailability({ ...newAvailability, notes })
                  }
                  placeholder="Additional details..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSaveAvailability}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Save Availability</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    position: 'relative',
  },
  dayCellInactive: {
    opacity: 0.3,
  },
  dayCellSelected: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    color: '#1E293B',
  },
  dayTextInactive: {
    color: '#94A3B8',
  },
  dayTextSelected: {
    fontWeight: '600',
    color: '#3B82F6',
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  setButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  setButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  dateRange: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
    textAlign: 'center',
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  statusButtonActive: {
    borderColor: 'transparent',
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
