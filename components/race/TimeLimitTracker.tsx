/**
 * Time Limit Tracker Component
 * Real-time countdown display with alerts and auto-DNF
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  Vibration,
} from 'react-native';
import { Text } from '@/components/ui/text';
import {
  Clock,
  AlertTriangle,
  PlayCircle,
  Flag,
  CheckCircle,
  Settings,
  X,
  Bell,
  BellOff,
  Users,
  Timer,
  Zap,
} from 'lucide-react-native';
import {
  timeLimitService,
  TimeLimit,
  ActiveTimeLimit,
  TimeLimitStatus,
  TimeLimitAlert,
} from '@/services/TimeLimitService';

interface TimeLimitTrackerProps {
  regattaId: string;
  raceNumber: number;
  fleetId?: string;
  onExpired?: () => void;
  onAutoDNF?: (count: number) => void;
  compact?: boolean;
}

export function TimeLimitTracker({
  regattaId,
  raceNumber,
  fleetId,
  onExpired,
  onAutoDNF,
  compact = false,
}: TimeLimitTrackerProps) {
  const [timeLimit, setTimeLimit] = useState<TimeLimit | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  
  // Countdown state
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  
  // Setup form
  const [raceTimeLimit, setRaceTimeLimit] = useState('90');
  const [finishingWindow, setFinishingWindow] = useState('30');
  const [autoDNFEnabled, setAutoDNFEnabled] = useState(true);
  
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Load time limit
  useEffect(() => {
    loadTimeLimit();
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [regattaId, raceNumber, fleetId]);

  // Start countdown when time limit is active
  useEffect(() => {
    if (timeLimit && (timeLimit.status === 'racing' || timeLimit.status === 'first_finished')) {
      startCountdown();
    } else {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    }
  }, [timeLimit?.status, timeLimit?.race_time_deadline, timeLimit?.finishing_deadline]);

  const loadTimeLimit = async () => {
    setLoading(true);
    try {
      const limit = await timeLimitService.getTimeLimit(regattaId, raceNumber, fleetId);
      setTimeLimit(limit);
      
      if (limit) {
        const remaining = timeLimitService.calculateTimeRemaining(limit);
        setMinutes(remaining.minutes);
        setSeconds(remaining.seconds);
        setIsExpired(remaining.isExpired);
      }
    } catch (error) {
      console.error('Error loading time limit:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    countdownRef.current = setInterval(() => {
      if (!timeLimit) return;

      const remaining = timeLimitService.calculateTimeRemaining(timeLimit);
      setMinutes(remaining.minutes);
      setSeconds(remaining.seconds);
      setIsExpired(remaining.isExpired);

      // Check for warnings
      if (alertsEnabled) {
        if (remaining.minutes === 5 && remaining.seconds === 0) {
          triggerAlert('5 minutes remaining!');
        } else if (remaining.minutes === 1 && remaining.seconds === 0) {
          triggerAlert('1 minute remaining!');
        } else if (remaining.isExpired && !isExpired) {
          triggerAlert('Time limit expired!');
          onExpired?.();
        }
      }
    }, 1000);
  };

  const triggerAlert = (message: string) => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 500, 200, 500]);
    }
    Alert.alert('⏱️ Time Limit', message);
  };

  const handleCreateTimeLimit = async () => {
    try {
      const limit = await timeLimitService.createTimeLimit(
        regattaId,
        raceNumber,
        {
          race_time_limit_minutes: parseInt(raceTimeLimit) || undefined,
          finishing_window_minutes: parseInt(finishingWindow) || 30,
          auto_dnf_enabled: autoDNFEnabled,
        },
        fleetId
      );
      setTimeLimit(limit);
      setShowSetupModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create time limit');
    }
  };

  const handleStartRace = async () => {
    if (!timeLimit) return;
    try {
      const updated = await timeLimitService.recordRaceStart(timeLimit.id);
      setTimeLimit(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to start race timer');
    }
  };

  const handleFirstFinish = async () => {
    if (!timeLimit) return;
    try {
      const updated = await timeLimitService.recordFirstFinish(timeLimit.id);
      setTimeLimit(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to record first finish');
    }
  };

  const handleExpire = async () => {
    if (!timeLimit) return;
    
    Alert.alert(
      'Expire Time Limit',
      'This will mark the time limit as expired. Apply auto-DNF to unfinished boats?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Expire Only',
          onPress: async () => {
            const updated = await timeLimitService.expireTimeLimit(timeLimit.id);
            setTimeLimit(updated);
          },
        },
        {
          text: 'Expire + DNF',
          style: 'destructive',
          onPress: async () => {
            await timeLimitService.expireTimeLimit(timeLimit.id);
            const count = await timeLimitService.applyAutoDNF(timeLimit.id);
            onAutoDNF?.(count);
            loadTimeLimit();
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    if (!timeLimit) return;
    try {
      const updated = await timeLimitService.completeTimeLimit(timeLimit.id);
      setTimeLimit(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to complete time limit');
    }
  };

  const getStatusInfo = () => {
    if (!timeLimit) return null;
    return timeLimitService.getStatusInfo(timeLimit.status);
  };

  const formatTime = () => {
    return timeLimitService.formatTimeRemaining(minutes, seconds);
  };

  // Compact view for race console integration
  if (compact) {
    if (!timeLimit) {
      return (
        <TouchableOpacity
          style={styles.compactSetup}
          onPress={() => setShowSetupModal(true)}
        >
          <Timer size={16} color="#6B7280" />
          <Text style={styles.compactSetupText}>Set Time Limit</Text>
        </TouchableOpacity>
      );
    }

    const statusInfo = getStatusInfo();
    const isActive = timeLimit.status === 'racing' || timeLimit.status === 'first_finished';
    const isWarning = minutes <= 5 && isActive;
    const isCritical = minutes <= 1 && isActive;

    return (
      <View style={[
        styles.compactContainer,
        isCritical && styles.compactCritical,
        isWarning && !isCritical && styles.compactWarning,
      ]}>
        <View style={styles.compactLeft}>
          <Timer size={18} color={isCritical ? '#DC2626' : isWarning ? '#D97706' : '#10B981'} />
          <Text style={[
            styles.compactTime,
            isCritical && styles.compactTimeCritical,
            isWarning && !isCritical && styles.compactTimeWarning,
          ]}>
            {isActive ? formatTime() : statusInfo?.label}
          </Text>
        </View>
        {isActive && (
          <TouchableOpacity
            style={styles.compactButton}
            onPress={() => setAlertsEnabled(!alertsEnabled)}
          >
            {alertsEnabled ? (
              <Bell size={16} color="#6B7280" />
            ) : (
              <BellOff size={16} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Full view
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!timeLimit) {
    return (
      <>
        <TouchableOpacity
          style={styles.setupCard}
          onPress={() => setShowSetupModal(true)}
        >
          <Clock size={32} color="#0EA5E9" />
          <Text style={styles.setupTitle}>Set Time Limit</Text>
          <Text style={styles.setupSubtitle}>
            Configure race time limit and finishing window
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showSetupModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSetupModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Time Limit Setup</Text>
                <TouchableOpacity onPress={() => setShowSetupModal(false)}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.inputLabel}>Race Time Limit (minutes)</Text>
                <Text style={styles.inputHint}>
                  Max time for first boat to finish (RRS 35)
                </Text>
                <TextInput
                  style={styles.input}
                  value={raceTimeLimit}
                  onChangeText={setRaceTimeLimit}
                  keyboardType="number-pad"
                  placeholder="90"
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.inputLabel}>Finishing Window (minutes)</Text>
                <Text style={styles.inputHint}>
                  Time for remaining boats after first finish
                </Text>
                <TextInput
                  style={styles.input}
                  value={finishingWindow}
                  onChangeText={setFinishingWindow}
                  keyboardType="number-pad"
                  placeholder="30"
                  placeholderTextColor="#9CA3AF"
                />

                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setAutoDNFEnabled(!autoDNFEnabled)}
                >
                  <View style={styles.toggleInfo}>
                    <Zap size={20} color={autoDNFEnabled ? '#10B981' : '#9CA3AF'} />
                    <View>
                      <Text style={styles.toggleLabel}>Auto-DNF</Text>
                      <Text style={styles.toggleHint}>
                        Automatically mark unfinished boats as DNF
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.toggle,
                    autoDNFEnabled && styles.toggleActive,
                  ]}>
                    <View style={[
                      styles.toggleKnob,
                      autoDNFEnabled && styles.toggleKnobActive,
                    ]} />
                  </View>
                </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateTimeLimit}
              >
                <Text style={styles.createButtonText}>Create Time Limit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  const statusInfo = getStatusInfo();
  const isActive = timeLimit.status === 'racing' || timeLimit.status === 'first_finished';
  const isWarning = minutes <= 5 && isActive;
  const isCritical = minutes <= 1 && isActive;

  return (
    <View style={styles.container}>
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusInfo?.bgColor }]}>
        <Text style={[styles.statusText, { color: statusInfo?.color }]}>
          {statusInfo?.label}
        </Text>
        <TouchableOpacity
          style={styles.alertToggle}
          onPress={() => setAlertsEnabled(!alertsEnabled)}
        >
          {alertsEnabled ? (
            <Bell size={18} color={statusInfo?.color} />
          ) : (
            <BellOff size={18} color="#9CA3AF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Countdown Display */}
      {isActive && (
        <View style={[
          styles.countdownContainer,
          isCritical && styles.countdownCritical,
          isWarning && !isCritical && styles.countdownWarning,
        ]}>
          <Text style={[
            styles.countdownLabel,
            isCritical && styles.countdownLabelCritical,
          ]}>
            {timeLimit.status === 'first_finished' ? 'Finishing Window' : 'Time Remaining'}
          </Text>
          <Text style={[
            styles.countdown,
            isCritical && styles.countdownTextCritical,
            isWarning && !isCritical && styles.countdownTextWarning,
          ]}>
            {formatTime()}
          </Text>
          {isCritical && (
            <View style={styles.criticalAlert}>
              <AlertTriangle size={16} color="#DC2626" />
              <Text style={styles.criticalText}>Time limit expiring!</Text>
            </View>
          )}
        </View>
      )}

      {/* Info Cards */}
      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Timer size={18} color="#6B7280" />
          <Text style={styles.infoValue}>
            {timeLimit.race_time_limit_minutes ?? '∞'}
          </Text>
          <Text style={styles.infoLabel}>Race Limit</Text>
        </View>
        <View style={styles.infoCard}>
          <Flag size={18} color="#6B7280" />
          <Text style={styles.infoValue}>
            {timeLimit.finishing_window_minutes}
          </Text>
          <Text style={styles.infoLabel}>Finish Window</Text>
        </View>
        <View style={styles.infoCard}>
          <Zap size={18} color={timeLimit.auto_dnf_enabled ? '#10B981' : '#9CA3AF'} />
          <Text style={styles.infoValue}>
            {timeLimit.auto_dnf_enabled ? 'ON' : 'OFF'}
          </Text>
          <Text style={styles.infoLabel}>Auto-DNF</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {timeLimit.status === 'pending' && (
          <TouchableOpacity style={styles.actionButton} onPress={handleStartRace}>
            <PlayCircle size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Start Race</Text>
          </TouchableOpacity>
        )}

        {timeLimit.status === 'racing' && (
          <TouchableOpacity style={styles.actionButton} onPress={handleFirstFinish}>
            <Flag size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>First Finish</Text>
          </TouchableOpacity>
        )}

        {isActive && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={handleExpire}
          >
            <AlertTriangle size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Expire Now</Text>
          </TouchableOpacity>
        )}

        {(timeLimit.status === 'time_expired' || timeLimit.status === 'window_expired') && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSuccess]}
            onPress={handleComplete}
          >
            <CheckCircle size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* DNF Info */}
      {timeLimit.boats_dnf_count > 0 && (
        <View style={styles.dnfInfo}>
          <Users size={16} color="#DC2626" />
          <Text style={styles.dnfText}>
            {timeLimit.boats_dnf_count} boat(s) marked DNF
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  loadingText: {
    padding: 24,
    textAlign: 'center',
    color: '#6B7280',
  },
  setupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  setupSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  alertToggle: {
    padding: 4,
  },
  countdownContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  countdownWarning: {
    backgroundColor: '#FEF3C7',
  },
  countdownCritical: {
    backgroundColor: '#FEE2E2',
  },
  countdownLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  countdownLabelCritical: {
    color: '#DC2626',
  },
  countdown: {
    fontSize: 56,
    fontWeight: '700',
    color: '#1F2937',
    fontVariant: ['tabular-nums'],
  },
  countdownTextWarning: {
    color: '#D97706',
  },
  countdownTextCritical: {
    color: '#DC2626',
  },
  criticalAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  criticalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  infoRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0EA5E9',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonDanger: {
    backgroundColor: '#DC2626',
  },
  actionButtonSuccess: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dnfInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEE2E2',
  },
  dnfText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  compactWarning: {
    backgroundColor: '#FEF3C7',
  },
  compactCritical: {
    backgroundColor: '#FEE2E2',
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    fontVariant: ['tabular-nums'],
  },
  compactTimeWarning: {
    color: '#D97706',
  },
  compactTimeCritical: {
    color: '#DC2626',
  },
  compactButton: {
    padding: 4,
  },
  compactSetup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  compactSetupText: {
    fontSize: 13,
    color: '#6B7280',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    marginTop: 16,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  toggleHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#10B981',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  createButton: {
    backgroundColor: '#0EA5E9',
    margin: 16,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TimeLimitTracker;

