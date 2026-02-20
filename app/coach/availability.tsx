/**
 * Coach Availability Editor
 *
 * Allows coaches to manage their availability post-onboarding:
 * - Weekly recurring schedule
 * - Blocked dates (vacation, regatta days)
 * - Pause accepting new clients toggle
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, addDays, parseISO, isBefore, startOfDay } from 'date-fns';
import { useCoachWorkspace } from '@/hooks/useCoachWorkspace';
import { coachingService } from '@/services/CoachingService';
import { showAlert, showConfirm } from '@/lib/utils/crossPlatformAlert';

const COLORS = {
  primary: '#007AFF',
  primaryLight: '#E5F1FF',
  background: '#F2F2F7',
  card: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#8E8E93',
  separator: '#C6C6C8',
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  border: '#D1D1D6',
};

const DAYS_OF_WEEK = [
  { id: 0, short: 'Sun', long: 'Sunday' },
  { id: 1, short: 'Mon', long: 'Monday' },
  { id: 2, short: 'Tue', long: 'Tuesday' },
  { id: 3, short: 'Wed', long: 'Wednesday' },
  { id: 4, short: 'Thu', long: 'Thursday' },
  { id: 5, short: 'Fri', long: 'Friday' },
  { id: 6, short: 'Sat', long: 'Saturday' },
];

const TIME_BLOCKS = [
  { id: 'morning', label: 'Morning', startHour: 8, endHour: 12, icon: 'sunny-outline' },
  { id: 'afternoon', label: 'Afternoon', startHour: 12, endHour: 17, icon: 'partly-sunny-outline' },
  { id: 'evening', label: 'Evening', startHour: 17, endHour: 21, icon: 'moon-outline' },
];

const BLOCK_TYPES = [
  { id: 'vacation', label: 'Vacation', icon: 'airplane-outline' },
  { id: 'regatta', label: 'Regatta', icon: 'trophy-outline' },
  { id: 'personal', label: 'Personal', icon: 'person-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

interface AvailabilitySlot {
  id: string;
  coach_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  morning?: boolean;
  afternoon?: boolean;
  evening?: boolean;
}

interface BlockedDate {
  id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  block_type: string;
}

export default function CoachAvailabilityEditor() {
  const router = useRouter();
  const { coachId, loading: workspaceLoading } = useCoachWorkspace();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Coach profile state
  const [isAcceptingClients, setIsAcceptingClients] = useState(true);

  // Weekly availability (simplified: day -> time blocks enabled)
  const [weeklySchedule, setWeeklySchedule] = useState<Record<number, { morning: boolean; afternoon: boolean; evening: boolean }>>({});
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);

  // Blocked dates
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);

  // New blocked date form
  const [showBlockedForm, setShowBlockedForm] = useState(false);
  const [newBlockStartDate, setNewBlockStartDate] = useState('');
  const [newBlockEndDate, setNewBlockEndDate] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');
  const [newBlockType, setNewBlockType] = useState('vacation');

  const loadData = useCallback(async () => {
    if (!coachId) return;

    try {
      setLoading(true);

      // Load coach profile for is_accepting_clients
      const profile = await coachingService.getCoachProfileById(coachId);
      if (profile) {
        setIsAcceptingClients((profile as any).is_accepting_clients !== false);
      }

      // Load weekly availability
      const slots = await coachingService.getCoachWeeklyAvailability(coachId);
      setAvailabilitySlots(slots);

      // Build weekly schedule from slots
      const schedule: Record<number, { morning: boolean; afternoon: boolean; evening: boolean }> = {};
      DAYS_OF_WEEK.forEach(day => {
        schedule[day.id] = { morning: false, afternoon: false, evening: false };
      });

      slots.forEach((slot: AvailabilitySlot) => {
        if (slot.day_of_week !== undefined && slot.is_active !== false) {
          // Check which time blocks this slot covers
          if (slot.morning) schedule[slot.day_of_week].morning = true;
          if (slot.afternoon) schedule[slot.day_of_week].afternoon = true;
          if (slot.evening) schedule[slot.day_of_week].evening = true;

          // Also check start_time to determine blocks
          if (slot.start_time) {
            const hour = parseInt(slot.start_time.split(':')[0], 10);
            if (hour >= 8 && hour < 12) schedule[slot.day_of_week].morning = true;
            if (hour >= 12 && hour < 17) schedule[slot.day_of_week].afternoon = true;
            if (hour >= 17) schedule[slot.day_of_week].evening = true;
          }
        }
      });

      setWeeklySchedule(schedule);

      // Load blocked dates
      const blocked = await coachingService.getBlockedDates(coachId);
      setBlockedDates(blocked);

    } catch (error) {
      console.error('Error loading availability:', error);
      showAlert('Error', 'Unable to load availability settings.');
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleBack = () => {
    if (hasChanges) {
      showConfirm(
        'Unsaved Changes',
        'You have unsaved changes. Discard them?',
        () => router.back(),
        { destructive: true }
      );
    } else {
      router.back();
    }
  };

  const toggleAcceptingClients = async () => {
    if (!coachId) return;

    const newValue = !isAcceptingClients;
    setIsAcceptingClients(newValue);

    setSaving(true);
    try {
      const result = await coachingService.updateAcceptingClients(coachId, newValue);
      if (!result.success) {
        setIsAcceptingClients(!newValue); // Revert
        showAlert('Error', result.error || 'Unable to update status.');
      } else {
        showAlert(
          newValue ? 'Profile Visible' : 'Profile Hidden',
          newValue
            ? 'Your profile is now visible in the coach marketplace.'
            : 'Your profile is hidden. Existing clients can still book, but new clients won\'t find you.'
        );
      }
    } catch (error) {
      setIsAcceptingClients(!newValue); // Revert
      showAlert('Error', 'Unable to update status.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTimeBlock = async (dayId: number, block: string) => {
    if (!coachId) return;

    const current = weeklySchedule[dayId] || { morning: false, afternoon: false, evening: false };
    const newValue = !current[block as keyof typeof current];

    // Update local state
    setWeeklySchedule({
      ...weeklySchedule,
      [dayId]: { ...current, [block]: newValue },
    });

    // Find existing slot for this day
    const existingSlot = availabilitySlots.find(s => s.day_of_week === dayId);

    try {
      if (existingSlot) {
        // Update existing slot
        const blockInfo = TIME_BLOCKS.find(b => b.id === block);
        if (blockInfo) {
          await coachingService.updateAvailabilitySlot(existingSlot.id, {
            isAvailable: newValue,
          });
        }
      } else if (newValue) {
        // Create new slot
        const blockInfo = TIME_BLOCKS.find(b => b.id === block);
        if (blockInfo) {
          // Create a date for the next occurrence of this day
          const today = new Date();
          const daysUntil = (dayId - today.getDay() + 7) % 7;
          const nextDay = addDays(today, daysUntil || 7);
          const startTime = new Date(nextDay);
          startTime.setHours(blockInfo.startHour, 0, 0, 0);
          const endTime = new Date(nextDay);
          endTime.setHours(blockInfo.endHour, 0, 0, 0);

          await coachingService.createAvailabilitySlot(coachId, startTime, endTime, {
            recurringPattern: 'weekly',
          });
        }
      }

      setHasChanges(true);
    } catch (error) {
      console.error('Error updating availability:', error);
      // Revert on error
      setWeeklySchedule({
        ...weeklySchedule,
        [dayId]: current,
      });
      showAlert('Error', 'Unable to update availability.');
    }
  };

  const addBlockedDate = async () => {
    if (!coachId || !newBlockStartDate || !newBlockEndDate) {
      showAlert('Missing Info', 'Please select start and end dates.');
      return;
    }

    // Validate dates
    const start = parseISO(newBlockStartDate);
    const end = parseISO(newBlockEndDate);

    if (isBefore(end, start)) {
      showAlert('Invalid Dates', 'End date must be after start date.');
      return;
    }

    if (isBefore(startOfDay(start), startOfDay(new Date()))) {
      showAlert('Invalid Date', 'Start date cannot be in the past.');
      return;
    }

    setSaving(true);
    try {
      const result = await coachingService.addBlockedDate(coachId, {
        start_date: newBlockStartDate,
        end_date: newBlockEndDate,
        reason: newBlockReason || undefined,
        block_type: newBlockType,
      });

      if (result.success) {
        // Add to local state
        setBlockedDates([
          ...blockedDates,
          {
            id: result.id!,
            start_date: newBlockStartDate,
            end_date: newBlockEndDate,
            reason: newBlockReason || undefined,
            block_type: newBlockType,
          },
        ]);

        // Reset form
        setShowBlockedForm(false);
        setNewBlockStartDate('');
        setNewBlockEndDate('');
        setNewBlockReason('');
        setNewBlockType('vacation');

        showAlert('Blocked', 'Time off has been added to your calendar.');
      } else {
        showAlert('Error', result.error || 'Unable to add blocked date.');
      }
    } catch (error) {
      showAlert('Error', 'Unable to add blocked date.');
    } finally {
      setSaving(false);
    }
  };

  const deleteBlockedDate = async (blockedDateId: string) => {
    showConfirm(
      'Remove Block',
      'Remove this blocked time?',
      async () => {
        try {
          const result = await coachingService.deleteBlockedDate(blockedDateId);
          if (result.success) {
            setBlockedDates(blockedDates.filter(b => b.id !== blockedDateId));
          } else {
            showAlert('Error', result.error || 'Unable to remove blocked date.');
          }
        } catch (error) {
          showAlert('Error', 'Unable to remove blocked date.');
        }
      },
      { destructive: true }
    );
  };

  const getBlockTypeInfo = (type: string) => {
    return BLOCK_TYPES.find(t => t.id === type) || BLOCK_TYPES[3];
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);

    if (start === end) {
      return format(startDate, 'MMM d, yyyy');
    }

    if (format(startDate, 'yyyy') === format(endDate, 'yyyy')) {
      if (format(startDate, 'MMM') === format(endDate, 'MMM')) {
        return `${format(startDate, 'MMM d')} - ${format(endDate, 'd, yyyy')}`;
      }
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    }

    return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
  };

  if (workspaceLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading availability...</Text>
      </View>
    );
  }

  if (!coachId) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
        <Text style={[styles.loadingText, { marginTop: 12, fontSize: 17, fontWeight: '600', color: COLORS.label }]}>
          Coach profile not found
        </Text>
        <Text style={[styles.loadingText, { textAlign: 'center', paddingHorizontal: 32 }]}>
          Your coach workspace could not be loaded. Try again or complete onboarding first.
        </Text>
        <TouchableOpacity
          style={{ marginTop: 16, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading availability...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Manage Availability</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Accepting Clients Toggle */}
        <View style={styles.section}>
          <View style={[styles.toggleCard, !isAcceptingClients && styles.toggleCardInactive]}>
            <View style={styles.toggleCardContent}>
              <Ionicons
                name={isAcceptingClients ? 'eye-outline' : 'eye-off-outline'}
                size={24}
                color={isAcceptingClients ? COLORS.success : COLORS.tertiaryLabel}
              />
              <View style={styles.toggleCardText}>
                <Text style={styles.toggleCardTitle}>
                  {isAcceptingClients ? 'Accepting New Clients' : 'Not Accepting Clients'}
                </Text>
                <Text style={styles.toggleCardSubtitle}>
                  {isAcceptingClients
                    ? 'Your profile is visible in the marketplace'
                    : 'Hidden from new clients, existing clients can still book'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.toggleSwitch, isAcceptingClients && styles.toggleSwitchOn]}
              onPress={toggleAcceptingClients}
              disabled={saving}
            >
              <View style={[styles.toggleKnob, isAcceptingClients && styles.toggleKnobOn]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WEEKLY AVAILABILITY</Text>
          <Text style={styles.sectionSubtitle}>
            Select when you're generally available for sessions
          </Text>

          <View style={styles.scheduleCard}>
            {/* Header row */}
            <View style={styles.scheduleHeaderRow}>
              <View style={styles.dayLabelCell} />
              {TIME_BLOCKS.map(block => (
                <View key={block.id} style={styles.timeBlockHeader}>
                  <Ionicons name={block.icon as any} size={16} color={COLORS.secondaryLabel} />
                  <Text style={styles.timeBlockLabel}>{block.label}</Text>
                </View>
              ))}
            </View>

            {/* Day rows */}
            {DAYS_OF_WEEK.map(day => {
              const daySchedule = weeklySchedule[day.id] || { morning: false, afternoon: false, evening: false };
              return (
                <View key={day.id} style={styles.scheduleRow}>
                  <View style={styles.dayLabelCell}>
                    <Text style={styles.dayLabel}>{day.short}</Text>
                  </View>
                  {TIME_BLOCKS.map(block => {
                    const isActive = daySchedule[block.id as keyof typeof daySchedule];
                    return (
                      <TouchableOpacity
                        key={block.id}
                        style={[styles.timeBlockCell, isActive && styles.timeBlockCellActive]}
                        onPress={() => toggleTimeBlock(day.id, block.id)}
                      >
                        {isActive && (
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>

        {/* Blocked Dates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>BLOCKED DATES</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowBlockedForm(true)}
            >
              <Ionicons name="add" size={20} color={COLORS.primary} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            Block off vacation, regatta days, or personal time
          </Text>

          {blockedDates.length === 0 && !showBlockedForm && (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={32} color={COLORS.tertiaryLabel} />
              <Text style={styles.emptyStateText}>No blocked dates</Text>
              <Text style={styles.emptyStateSubtext}>
                Add time off to prevent bookings during those periods
              </Text>
            </View>
          )}

          {blockedDates
            .filter(bd => !isBefore(parseISO(bd.end_date), startOfDay(new Date())))
            .sort((a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime())
            .map(blocked => {
              const typeInfo = getBlockTypeInfo(blocked.block_type);
              return (
                <View key={blocked.id} style={styles.blockedCard}>
                  <View style={styles.blockedIcon}>
                    <Ionicons name={typeInfo.icon as any} size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.blockedInfo}>
                    <Text style={styles.blockedDates}>
                      {formatDateRange(blocked.start_date, blocked.end_date)}
                    </Text>
                    <Text style={styles.blockedType}>{typeInfo.label}</Text>
                    {blocked.reason && (
                      <Text style={styles.blockedReason}>{blocked.reason}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteBlockedDate(blocked.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              );
            })}

          {showBlockedForm && (
            <View style={styles.blockedForm}>
              <Text style={styles.blockedFormTitle}>Block Time Off</Text>

              {/* Date Inputs */}
              <View style={styles.dateRow}>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <TextInput
                    style={styles.dateTextInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.tertiaryLabel}
                    value={newBlockStartDate}
                    onChangeText={setNewBlockStartDate}
                  />
                </View>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>End Date</Text>
                  <TextInput
                    style={styles.dateTextInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.tertiaryLabel}
                    value={newBlockEndDate}
                    onChangeText={setNewBlockEndDate}
                  />
                </View>
              </View>

              {/* Block Type */}
              <Text style={styles.dateLabel}>Type</Text>
              <View style={styles.typeChips}>
                {BLOCK_TYPES.map(type => {
                  const isSelected = newBlockType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                      onPress={() => setNewBlockType(type.id)}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={16}
                        color={isSelected ? '#FFFFFF' : COLORS.secondaryLabel}
                      />
                      <Text style={[styles.typeChipText, isSelected && styles.typeChipTextSelected]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Reason */}
              <TextInput
                style={styles.reasonInput}
                placeholder="Reason (optional)"
                placeholderTextColor={COLORS.tertiaryLabel}
                value={newBlockReason}
                onChangeText={setNewBlockReason}
              />

              {/* Actions */}
              <View style={styles.blockedFormActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowBlockedForm(false);
                    setNewBlockStartDate('');
                    setNewBlockEndDate('');
                    setNewBlockReason('');
                    setNewBlockType('vacation');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={addBlockedDate}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Add Block</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.secondaryLabel,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  headerRight: {
    width: 44,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginBottom: 12,
    marginTop: -8,
  },

  // Toggle Card
  toggleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  toggleCardInactive: {
    borderColor: COLORS.border,
  },
  toggleCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleCardText: {
    flex: 1,
  },
  toggleCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.label,
  },
  toggleCardSubtitle: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginTop: 2,
  },

  // Toggle Switch
  toggleSwitch: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    padding: 2,
  },
  toggleSwitchOn: {
    backgroundColor: COLORS.success,
  },
  toggleKnob: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobOn: {
    marginLeft: 20,
  },

  // Schedule
  scheduleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 12,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabelCell: {
    width: 44,
    justifyContent: 'center',
  },
  timeBlockHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  timeBlockLabel: {
    fontSize: 11,
    color: COLORS.tertiaryLabel,
    marginTop: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  timeBlockCell: {
    flex: 1,
    height: 36,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeBlockCellActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  addButtonText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.card,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginTop: 4,
    textAlign: 'center',
  },

  // Blocked Card
  blockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  blockedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  blockedInfo: {
    flex: 1,
  },
  blockedDates: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.label,
  },
  blockedType: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 2,
  },
  blockedReason: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginTop: 2,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
  },

  // Blocked Form
  blockedForm: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  blockedFormTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.label,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    marginBottom: 6,
  },
  dateTextInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.label,
  },
  typeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeChipText: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
  },
  typeChipTextSelected: {
    color: '#FFFFFF',
  },
  reasonInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.label,
    marginBottom: 16,
  },
  blockedFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 15,
    color: COLORS.tertiaryLabel,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
