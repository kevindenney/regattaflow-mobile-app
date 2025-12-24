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
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExistingModal, setShowExistingModal] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<CrewAvailability | null>(null);
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
      // Load a wider date range (3 months) to ensure availability persists across navigation
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0)
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
      Alert.alert('Error', 'Failed to load availability. Please try again.');
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
      setSaving(true);
      const saved = await crewManagementService.setCrewAvailability(crewMember.id, {
        startDate: selectedRange.startDate,
        endDate: selectedRange.endDate,
        status: newAvailability.status,
        reason: newAvailability.reason || undefined,
        notes: newAvailability.notes || undefined,
      });

      // Add to local state immediately for instant feedback
      setAvailability(prev => [...prev, saved]);
      
      Alert.alert('Success', 'Availability saved successfully');
      setShowAddModal(false);
      setSelectedRange(null);
      setNewAvailability({ status: 'available', reason: '', notes: '' });
      
      // Reload to ensure we have the latest data
      await loadAvailability();
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
        Alert.alert(
          'Error', 
          err?.message || 'Failed to save availability. Please try again.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAvailability = async (availabilityId: string) => {
    Alert.alert(
      'Delete Availability',
      'Are you sure you want to delete this availability entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await crewManagementService.deleteCrewAvailability(availabilityId);
              setAvailability(prev => prev.filter(a => a.id !== availabilityId));
              setShowExistingModal(false);
              setSelectedAvailability(null);
              await loadAvailability();
              onUpdate?.();
              Alert.alert('Success', 'Availability deleted');
            } catch (err: any) {
              console.error('Error deleting availability:', err);
              Alert.alert('Error', 'Failed to delete availability. Please try again.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleDayPress = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return;

    // Check if this day has existing availability
    const existingAvail = availability.find(
      (a) => day.date >= a.startDate && day.date <= a.endDate
    );

    if (existingAvail) {
      setSelectedAvailability(existingAvail);
      setShowExistingModal(true);
      return;
    }

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

      {/* Selected range info */}
      {selectedRange && (
        <View style={styles.selectedRangeInfo}>
          <View style={styles.selectedRangeContent}>
            <Ionicons name="calendar-outline" size={16} color="#3B82F6" />
            <Text style={styles.selectedRangeText}>
              {new Date(selectedRange.startDate).toLocaleDateString()} - {new Date(selectedRange.endDate).toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.clearButtonSmall}
            onPress={() => setSelectedRange(null)}
          >
            <Ionicons name="close" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      )}

      {/* Action buttons */}
      {selectedRange && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSelectedRange(null)}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.setButton, saving && styles.setButtonDisabled]} 
            onPress={handleSetAvailability}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="calendar" size={18} color="#FFFFFF" />
                <Text style={styles.setButtonText}>Set Availability</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Existing availability list */}
      {availability.length > 0 && (
        <View style={styles.existingSection}>
          <Text style={styles.existingTitle}>Existing Availability</Text>
          <ScrollView style={styles.existingList} nestedScrollEnabled>
            {availability.map((avail) => (
              <TouchableOpacity
                key={avail.id}
                style={styles.existingItem}
                onPress={() => {
                  setSelectedAvailability(avail);
                  setShowExistingModal(true);
                }}
              >
                <View style={[styles.existingDot, { backgroundColor: getAvailabilityColor(avail.status) }]} />
                <View style={styles.existingContent}>
                  <Text style={styles.existingDate}>
                    {new Date(avail.startDate).toLocaleDateString()} - {new Date(avail.endDate).toLocaleDateString()}
                  </Text>
                  <Text style={styles.existingStatus}>
                    {avail.status.charAt(0).toUpperCase() + avail.status.slice(1)}
                    {avail.reason && ` • ${avail.reason}`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </ScrollView>
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

            <TouchableOpacity 
              style={[styles.submitButton, saving && styles.submitButtonDisabled]} 
              onPress={handleSaveAvailability}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Save Availability</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* View/Edit existing availability modal */}
      <Modal
        visible={showExistingModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowExistingModal(false);
          setSelectedAvailability(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Availability Details</Text>
              <TouchableOpacity onPress={() => {
                setShowExistingModal(false);
                setSelectedAvailability(null);
              }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedAvailability && (
              <ScrollView style={styles.existingDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date Range</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedAvailability.startDate).toLocaleDateString()} - {new Date(selectedAvailability.endDate).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getAvailabilityColor(selectedAvailability.status) + '15' }]}>
                    <View style={[styles.statusBadgeDot, { backgroundColor: getAvailabilityColor(selectedAvailability.status) }]} />
                    <Text style={[styles.statusBadgeText, { color: getAvailabilityColor(selectedAvailability.status) }]}>
                      {selectedAvailability.status.charAt(0).toUpperCase() + selectedAvailability.status.slice(1)}
                    </Text>
                  </View>
                </View>

                {selectedAvailability.reason && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reason</Text>
                    <Text style={styles.detailValue}>{selectedAvailability.reason}</Text>
                  </View>
                )}

                {selectedAvailability.notes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailValue}>{selectedAvailability.notes}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteAvailability(selectedAvailability.id)}
                  disabled={saving}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.deleteButtonText}>Delete Availability</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
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
  selectedRangeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  selectedRangeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  selectedRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  clearButtonSmall: {
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
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
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  setButtonDisabled: {
    opacity: 0.6,
  },
  setButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  existingSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  existingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  existingList: {
    maxHeight: 200,
  },
  existingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  existingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  existingContent: {
    flex: 1,
  },
  existingDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  existingStatus: {
    fontSize: 12,
    color: '#64748B',
  },
  existingDetails: {
    maxHeight: 400,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: '#1E293B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    marginTop: 16,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  submitButtonDisabled: {
    opacity: 0.6,
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
