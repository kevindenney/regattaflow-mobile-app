/**
 * ClimbLogCard
 *
 * A component for recording climb times during a 4 Peaks race.
 * Displays each peak with time recording fields and calculates
 * total climb time automatically.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Mountain,
  Clock,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  Timer,
  Edit3,
  Check,
} from 'lucide-react-native';
import {
  type ClimbTask,
  type ClimbTaskStatus,
  calculateClimbTime,
  formatDuration,
  FOUR_PEAKS,
  getPeakById,
} from '@/types/multiActivitySchedule';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#5856D6',
  teal: '#0D9488',
  gray: '#8E8E93',
  gray2: '#636366',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

interface ClimbLogCardProps {
  climbTasks: ClimbTask[];
  onUpdateTask: (taskId: string, updates: Partial<ClimbTask>) => Promise<void>;
  isLoading?: boolean;
}

export function ClimbLogCard({
  climbTasks,
  onUpdateTask,
  isLoading = false,
}: ClimbLogCardProps) {
  // Track which task is expanded
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Track editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Temporary edit values
  const [editValues, setEditValues] = useState<{
    departureFromBoat?: string;
    reportedToRaceControl?: string;
    arrivedBackAtBoat?: string;
    notes?: string;
  }>({});

  // Sort tasks by peak order
  const sortedTasks = useMemo(() => {
    const peakOrder = FOUR_PEAKS.map((p) => p.id);
    return [...climbTasks].sort(
      (a, b) => peakOrder.indexOf(a.peakId) - peakOrder.indexOf(b.peakId)
    );
  }, [climbTasks]);

  // Toggle expansion
  const toggleExpanded = useCallback((taskId: string) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  }, []);

  // Start editing a field
  const startEditing = useCallback(
    (taskId: string, field: string, currentValue?: string) => {
      setEditingTaskId(taskId);
      setEditingField(field);
      setEditValues({ [field]: currentValue || formatCurrentTime() });
    },
    []
  );

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingTaskId(null);
    setEditingField(null);
    setEditValues({});
  }, []);

  // Save edited value
  const saveEdit = useCallback(async () => {
    if (!editingTaskId || !editingField) return;

    setIsSaving(true);
    try {
      const updates: Partial<ClimbTask> = {
        [editingField]: editValues[editingField as keyof typeof editValues],
      };

      // Update status based on what fields are filled
      const task = climbTasks.find((t) => t.id === editingTaskId);
      if (task) {
        const newTask = { ...task, ...updates };
        if (
          newTask.departureFromBoat &&
          newTask.arrivedBackAtBoat
        ) {
          updates.status = 'completed';
          updates.totalClimbTimeMinutes = calculateClimbTime(newTask as ClimbTask);
        } else if (newTask.departureFromBoat) {
          updates.status = 'in_progress';
        }
      }

      await onUpdateTask(editingTaskId, updates);
      cancelEditing();
    } catch (err) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [editingTaskId, editingField, editValues, climbTasks, onUpdateTask, cancelEditing]);

  // Record "now" for a field
  const recordNow = useCallback(
    async (taskId: string, field: string) => {
      const now = new Date().toISOString();
      setIsSaving(true);
      try {
        const updates: Partial<ClimbTask> = { [field]: now };

        // Update status based on what fields are filled
        const task = climbTasks.find((t) => t.id === taskId);
        if (task) {
          const newTask = { ...task, ...updates };
          if (
            newTask.departureFromBoat &&
            newTask.arrivedBackAtBoat
          ) {
            updates.status = 'completed';
            updates.totalClimbTimeMinutes = calculateClimbTime(newTask as ClimbTask);
          } else if (newTask.departureFromBoat) {
            updates.status = 'in_progress';
          }
        }

        await onUpdateTask(taskId, updates);
      } catch (err) {
        Alert.alert('Error', 'Failed to save. Please try again.');
      } finally {
        setIsSaving(false);
      }
    },
    [climbTasks, onUpdateTask]
  );

  // Get status color
  const getStatusColor = (status: ClimbTaskStatus): string => {
    switch (status) {
      case 'completed':
        return IOS_COLORS.green;
      case 'in_progress':
        return IOS_COLORS.orange;
      default:
        return IOS_COLORS.gray;
    }
  };

  // Format time for display
  const formatTimeDisplay = (isoString?: string): string => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={IOS_COLORS.blue} />
          <Text style={styles.loadingText}>Loading climb log...</Text>
        </View>
      </View>
    );
  }

  if (climbTasks.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Mountain size={32} color={IOS_COLORS.gray} />
          <Text style={styles.emptyStateText}>No peaks to track</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Mountain size={20} color={IOS_COLORS.green} />
        <Text style={styles.headerTitle}>Climb Log</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            {climbTasks.filter((t) => t.status === 'completed').length}/
            {climbTasks.length}
          </Text>
        </View>
      </View>

      <View style={styles.taskList}>
        {sortedTasks.map((task, index) => {
          const isExpanded = expandedTaskId === task.id;
          const isEditing = editingTaskId === task.id;
          const statusColor = getStatusColor(task.status);
          const peak = getPeakById(task.peakId);

          return (
            <View key={task.id} style={styles.taskCard}>
              {/* Task Header */}
              <Pressable
                style={styles.taskHeader}
                onPress={() => toggleExpanded(task.id)}
              >
                <View style={styles.taskHeaderLeft}>
                  {task.status === 'completed' ? (
                    <CheckCircle size={24} color={IOS_COLORS.green} />
                  ) : task.status === 'in_progress' ? (
                    <Timer size={24} color={IOS_COLORS.orange} />
                  ) : (
                    <Circle size={24} color={IOS_COLORS.gray} />
                  )}
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskName}>{task.peakName}</Text>
                    <Text style={styles.taskClimbers}>
                      {task.climberNames.join(', ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.taskHeaderRight}>
                  {task.totalClimbTimeMinutes && (
                    <Text style={styles.totalTime}>
                      {formatDuration(task.totalClimbTimeMinutes / 60)}
                    </Text>
                  )}
                  {isExpanded ? (
                    <ChevronUp size={20} color={IOS_COLORS.gray} />
                  ) : (
                    <ChevronDown size={20} color={IOS_COLORS.gray} />
                  )}
                </View>
              </Pressable>

              {/* Expanded Content */}
              {isExpanded && (
                <View style={styles.taskContent}>
                  {/* Departure Time */}
                  <View style={styles.timeRow}>
                    <View style={styles.timeLabel}>
                      <Text style={styles.timeLabelText}>Departure</Text>
                      <Text style={styles.timeLabelHint}>Left boat</Text>
                    </View>
                    {isEditing && editingField === 'departureFromBoat' ? (
                      <View style={styles.editRow}>
                        <TextInput
                          style={styles.timeInput}
                          value={editValues.departureFromBoat}
                          onChangeText={(v) =>
                            setEditValues((prev) => ({ ...prev, departureFromBoat: v }))
                          }
                          placeholder="HH:MM"
                          autoFocus
                        />
                        <Pressable
                          style={styles.saveButton}
                          onPress={saveEdit}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Check size={16} color="#FFFFFF" />
                          )}
                        </Pressable>
                        <Pressable style={styles.cancelButton} onPress={cancelEditing}>
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.timeValueRow}>
                        <Text
                          style={[
                            styles.timeValue,
                            task.departureFromBoat && styles.timeValueFilled,
                          ]}
                        >
                          {formatTimeDisplay(task.departureFromBoat)}
                        </Text>
                        {!task.departureFromBoat ? (
                          <Pressable
                            style={styles.recordNowButton}
                            onPress={() => recordNow(task.id, 'departureFromBoat')}
                            disabled={isSaving}
                          >
                            <Text style={styles.recordNowText}>Record Now</Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            style={styles.editIconButton}
                            onPress={() =>
                              startEditing(
                                task.id,
                                'departureFromBoat',
                                task.departureFromBoat
                              )
                            }
                          >
                            <Edit3 size={14} color={IOS_COLORS.blue} />
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Race Control Time */}
                  <View style={styles.timeRow}>
                    <View style={styles.timeLabel}>
                      <Text style={styles.timeLabelText}>Race Control</Text>
                      <Text style={styles.timeLabelHint}>Reported in</Text>
                    </View>
                    {isEditing && editingField === 'reportedToRaceControl' ? (
                      <View style={styles.editRow}>
                        <TextInput
                          style={styles.timeInput}
                          value={editValues.reportedToRaceControl}
                          onChangeText={(v) =>
                            setEditValues((prev) => ({
                              ...prev,
                              reportedToRaceControl: v,
                            }))
                          }
                          placeholder="HH:MM"
                          autoFocus
                        />
                        <Pressable
                          style={styles.saveButton}
                          onPress={saveEdit}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Check size={16} color="#FFFFFF" />
                          )}
                        </Pressable>
                        <Pressable style={styles.cancelButton} onPress={cancelEditing}>
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.timeValueRow}>
                        <Text
                          style={[
                            styles.timeValue,
                            task.reportedToRaceControl && styles.timeValueFilled,
                          ]}
                        >
                          {formatTimeDisplay(task.reportedToRaceControl)}
                        </Text>
                        {!task.reportedToRaceControl ? (
                          <Pressable
                            style={styles.recordNowButton}
                            onPress={() => recordNow(task.id, 'reportedToRaceControl')}
                            disabled={isSaving}
                          >
                            <Text style={styles.recordNowText}>Record Now</Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            style={styles.editIconButton}
                            onPress={() =>
                              startEditing(
                                task.id,
                                'reportedToRaceControl',
                                task.reportedToRaceControl
                              )
                            }
                          >
                            <Edit3 size={14} color={IOS_COLORS.blue} />
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Arrival Time */}
                  <View style={styles.timeRow}>
                    <View style={styles.timeLabel}>
                      <Text style={styles.timeLabelText}>Arrival</Text>
                      <Text style={styles.timeLabelHint}>Back at boat</Text>
                    </View>
                    {isEditing && editingField === 'arrivedBackAtBoat' ? (
                      <View style={styles.editRow}>
                        <TextInput
                          style={styles.timeInput}
                          value={editValues.arrivedBackAtBoat}
                          onChangeText={(v) =>
                            setEditValues((prev) => ({ ...prev, arrivedBackAtBoat: v }))
                          }
                          placeholder="HH:MM"
                          autoFocus
                        />
                        <Pressable
                          style={styles.saveButton}
                          onPress={saveEdit}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Check size={16} color="#FFFFFF" />
                          )}
                        </Pressable>
                        <Pressable style={styles.cancelButton} onPress={cancelEditing}>
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.timeValueRow}>
                        <Text
                          style={[
                            styles.timeValue,
                            task.arrivedBackAtBoat && styles.timeValueFilled,
                          ]}
                        >
                          {formatTimeDisplay(task.arrivedBackAtBoat)}
                        </Text>
                        {!task.arrivedBackAtBoat ? (
                          <Pressable
                            style={styles.recordNowButton}
                            onPress={() => recordNow(task.id, 'arrivedBackAtBoat')}
                            disabled={isSaving}
                          >
                            <Text style={styles.recordNowText}>Record Now</Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            style={styles.editIconButton}
                            onPress={() =>
                              startEditing(
                                task.id,
                                'arrivedBackAtBoat',
                                task.arrivedBackAtBoat
                              )
                            }
                          >
                            <Edit3 size={14} color={IOS_COLORS.blue} />
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Total Time (calculated) */}
                  {task.totalClimbTimeMinutes && (
                    <View style={styles.totalTimeRow}>
                      <Clock size={16} color={IOS_COLORS.green} />
                      <Text style={styles.totalTimeLabel}>Total Climb Time:</Text>
                      <Text style={styles.totalTimeValue}>
                        {formatDuration(task.totalClimbTimeMinutes / 60)}
                      </Text>
                    </View>
                  )}

                  {/* Notes */}
                  {task.notes && (
                    <View style={styles.notesRow}>
                      <Text style={styles.notesLabel}>Notes:</Text>
                      <Text style={styles.notesValue}>{task.notes}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Helper to get current time formatted
function formatCurrentTime(): string {
  return new Date().toISOString();
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerBadge: {
    backgroundColor: `${IOS_COLORS.green}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },
  taskList: {
    gap: 0,
  },
  taskCard: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  taskHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskInfo: {
    gap: 2,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  taskClimbers: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  taskHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalTime: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  taskContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: IOS_COLORS.background,
    borderRadius: 10,
  },
  timeLabel: {
    flex: 1,
    gap: 2,
  },
  timeLabelText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  timeLabelHint: {
    fontSize: 11,
    color: IOS_COLORS.secondaryLabel,
  },
  timeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    minWidth: 60,
  },
  timeValueFilled: {
    color: IOS_COLORS.label,
  },
  recordNowButton: {
    backgroundColor: IOS_COLORS.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recordNowText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editIconButton: {
    padding: 6,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderWidth: 1,
    borderColor: IOS_COLORS.blue,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
    width: 80,
  },
  saveButton: {
    backgroundColor: IOS_COLORS.green,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    padding: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    color: IOS_COLORS.blue,
  },
  totalTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: `${IOS_COLORS.green}10`,
    borderRadius: 10,
    gap: 8,
  },
  totalTimeLabel: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  totalTimeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: IOS_COLORS.green,
  },
  notesRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
  },
  notesValue: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
});

export default ClimbLogCard;
