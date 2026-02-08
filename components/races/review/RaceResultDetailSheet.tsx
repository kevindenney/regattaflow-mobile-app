/**
 * RaceResultDetailSheet - Actionsheet for viewing/editing race results
 *
 * Apple Weather-inspired detail popup with larger sparkline, position form,
 * fleet position bar, and save logic reused from PostRaceInterview.
 *
 * Key difference from PostRaceInterview: no morning_review, analyzing, or
 * results modal states. Purely data entry. AI analysis auto-triggers from
 * AfterRaceContent when both result + debrief are complete.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, Platform, ActivityIndicator, Modal, ScrollView, SafeAreaView } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { FleetPositionBar } from './FleetPositionBar';
import { useRecentRaceResults, type RecentRacePosition } from '@/hooks/useRecentRaceResults';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { AdaptiveLearningService } from '@/services/AdaptiveLearningService';
import type { RaceAnalysisData } from '@/hooks/useRaceAnalysisData';

// iOS System Colors
const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  background: '#FFFFFF',
};

interface RaceResultDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  raceId: string;
  raceName: string;
  raceDate?: string;
  userId?: string;
  /** Existing analysis data to pre-fill form */
  analysisData: RaceAnalysisData | null;
  /** Existing timer session ID (may be null if no session yet) */
  timerSessionId?: string;
  /** Called after successful save */
  onSaveComplete: () => void;
}

// Per-race result entry
interface RaceResultEntry {
  raceNumber: number;
  position: string;
  fleetSize: string;
  keyMoment: string;
}

// ─── Larger Sparkline for Sheet ──────────────────────────────────────

const SPARKLINE_PADDING = 12;

interface SheetSparklineProps {
  recentResults: RecentRacePosition[];
  currentPosition?: number;
  currentFleetSize?: number;
  width: number;
  height: number;
}

function SheetSparkline({
  recentResults,
  currentPosition,
  currentFleetSize,
  width,
  height,
}: SheetSparklineProps) {
  const allPositions = recentResults.map((r) => r.position);
  const allFleetSizes = recentResults.map((r) => r.fleetSize);
  if (currentPosition) allPositions.push(currentPosition);
  if (currentFleetSize) allFleetSizes.push(currentFleetSize);

  const maxFleet = Math.max(...allFleetSizes, currentFleetSize || 0, 1);
  const minPos = 1;
  const maxPos = Math.max(...allPositions, maxFleet);

  const totalPoints = recentResults.length + 1;
  const innerWidth = width - SPARKLINE_PADDING * 2;
  const innerHeight = height - SPARKLINE_PADDING * 2;

  const posToY = (pos: number) => {
    if (maxPos <= minPos) return SPARKLINE_PADDING + innerHeight / 2;
    return SPARKLINE_PADDING + ((pos - minPos) / (maxPos - minPos)) * innerHeight;
  };

  const idxToX = (idx: number) => {
    if (totalPoints <= 1) return SPARKLINE_PADDING + innerWidth / 2;
    return SPARKLINE_PADDING + (idx / (totalPoints - 1)) * innerWidth;
  };

  const pastPoints = recentResults.map((r, i) => ({
    x: idxToX(i),
    y: posToY(r.position),
  }));

  const currentIdx = recentResults.length;
  const currentX = idxToX(currentIdx);
  const currentY = currentPosition ? posToY(currentPosition) : posToY(maxPos / 2);

  const pastPolylinePoints = pastPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const fullPolylinePoints = currentPosition
    ? `${pastPolylinePoints} ${currentX},${posToY(currentPosition)}`
    : pastPolylinePoints;

  return (
    <Svg width={width} height={height}>
      {/* Grid lines */}
      <Line
        x1={SPARKLINE_PADDING} y1={posToY(1)}
        x2={width - SPARKLINE_PADDING} y2={posToY(1)}
        stroke={COLORS.gray5} strokeWidth={0.5}
      />
      <Line
        x1={SPARKLINE_PADDING} y1={posToY(maxPos)}
        x2={width - SPARKLINE_PADDING} y2={posToY(maxPos)}
        stroke={COLORS.gray5} strokeWidth={0.5}
      />

      {/* Position labels */}
      {/* Connecting line */}
      {pastPoints.length > 0 && (
        <Polyline
          points={fullPolylinePoints}
          fill="none"
          stroke={currentPosition ? COLORS.green : COLORS.gray3}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Dashed line to empty current */}
      {!currentPosition && pastPoints.length > 0 && (
        <Line
          x1={pastPoints[pastPoints.length - 1].x}
          y1={pastPoints[pastPoints.length - 1].y}
          x2={currentX} y2={currentY}
          stroke={COLORS.gray3}
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />
      )}

      {/* Past dots */}
      {pastPoints.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={4}
          fill={COLORS.gray} stroke={COLORS.background} strokeWidth={1.5} />
      ))}

      {/* Current dot */}
      {currentPosition ? (
        <Circle cx={currentX} cy={posToY(currentPosition)} r={5}
          fill={COLORS.green} stroke={COLORS.background} strokeWidth={2} />
      ) : (
        <Circle cx={currentX} cy={currentY} r={5}
          fill="none" stroke={COLORS.gray3} strokeWidth={2} strokeDasharray="3,3" />
      )}
    </Svg>
  );
}

// ─── Helper ──────────────────────────────────────────────────────────

const createInitialRaceResults = (count: number): RaceResultEntry[] =>
  Array.from({ length: count }, (_, i) => ({
    raceNumber: i + 1,
    position: '',
    fleetSize: '',
    keyMoment: '',
  }));

// ─── Main Sheet ─────────────────────────────────────────────────────

export function RaceResultDetailSheet({
  isOpen,
  onClose,
  raceId,
  raceName,
  raceDate,
  userId,
  analysisData,
  timerSessionId: propTimerSessionId,
  onSaveComplete,
}: RaceResultDetailSheetProps) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;
  const { recentResults } = useRecentRaceResults(effectiveUserId, raceId);

  // Session management
  const [sessionId, setSessionId] = useState<string | null>(propTimerSessionId || null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Form state
  const [raceCount, setRaceCount] = useState(1);
  const [raceResults, setRaceResults] = useState<RaceResultEntry[]>(createInitialRaceResults(1));
  const [narrative, setNarrative] = useState('');
  const [startEnd, setStartEnd] = useState<'pin' | 'middle' | 'boat' | null>(null);
  const [notes, setNotes] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update session ID when prop changes
  useEffect(() => {
    if (propTimerSessionId) {
      setSessionId(propTimerSessionId);
    }
  }, [propTimerSessionId]);

  // Pre-fill form from existing data when sheet opens
  useEffect(() => {
    if (!isOpen) return;

    if (analysisData) {
      const count = analysisData.raceCount || 1;
      setRaceCount(count);

      if (analysisData.raceResults && analysisData.raceResults.length > 0) {
        setRaceResults(
          analysisData.raceResults.map((r) => ({
            raceNumber: r.raceNumber,
            position: r.position?.toString() || '',
            fleetSize: r.fleetSize?.toString() || '',
            keyMoment: r.keyMoment || '',
          }))
        );
      } else if (analysisData.selfReportedPosition) {
        const results = createInitialRaceResults(count);
        results[0].position = analysisData.selfReportedPosition.toString();
        results[0].fleetSize = analysisData.selfReportedFleetSize?.toString() || '';
        results[0].keyMoment = analysisData.keyMoment || '';
        setRaceResults(results);
      } else {
        setRaceResults(createInitialRaceResults(count));
      }
    } else {
      setRaceCount(1);
      setRaceResults(createInitialRaceResults(1));
      setNarrative('');
      setStartEnd(null);
      setNotes('');
    }

    setValidationError(null);
  }, [isOpen, analysisData]);

  // Ensure session exists when sheet opens
  useEffect(() => {
    if (!isOpen || sessionId || isCreatingSession || !effectiveUserId) return;

    async function ensureSession() {
      setIsCreatingSession(true);
      try {
        // Fetch existing session first
        const { data: existing, error: fetchError } = await supabase
          .from('race_timer_sessions')
          .select('id')
          .eq('regatta_id', raceId)
          .eq('sailor_id', effectiveUserId!)
          .order('end_time', { ascending: false })
          .limit(1);

        if (fetchError) {
          console.warn('[RaceResultDetailSheet] Fetch session error:', fetchError);
        }

        if (existing && existing.length > 0) {
          setSessionId(existing[0].id);
          return;
        }

        // Create new session
        const nowIso = new Date().toISOString();
        const { data: created, error: createError } = await supabase
          .from('race_timer_sessions')
          .insert({
            sailor_id: effectiveUserId,
            regatta_id: raceId,
            start_time: raceDate || nowIso,
            end_time: nowIso,
            duration_seconds: 0,
          })
          .select('id')
          .single();

        if (createError) {
          console.error('[RaceResultDetailSheet] Create session error:', createError);
          return;
        }

        setSessionId(created.id);
      } catch (err) {
        console.error('[RaceResultDetailSheet] Session error:', err);
      } finally {
        setIsCreatingSession(false);
      }
    }

    ensureSession();
  }, [isOpen, sessionId, isCreatingSession, effectiveUserId, raceId, raceDate]);

  // Haptic on open
  useEffect(() => {
    if (isOpen && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [isOpen]);

  // Handle race count change
  const handleRaceCountChange = useCallback((count: number) => {
    setRaceCount(count);
    setRaceResults((prev) => {
      if (count > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: count - prev.length }, (_, i) => ({
            raceNumber: prev.length + i + 1,
            position: '',
            fleetSize: '',
            keyMoment: '',
          })),
        ];
      }
      return prev.slice(0, count);
    });
  }, []);

  // Update a race result field
  const updateRaceResult = useCallback((index: number, field: keyof RaceResultEntry, value: string) => {
    setRaceResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
    setValidationError(null);
  }, []);

  // Current live position for sparkline preview
  const livePosition = raceResults[0]?.position ? parseInt(raceResults[0].position, 10) : undefined;
  const liveFleetSize = raceResults[0]?.fleetSize ? parseInt(raceResults[0].fleetSize, 10) : undefined;

  // Save
  const handleSave = useCallback(async () => {
    if (!sessionId) {
      setValidationError('No race session found. Please try again.');
      return;
    }

    // Validate
    for (const race of raceResults) {
      if (race.position && !race.fleetSize) {
        setValidationError(`Enter fleet size for race ${raceCount > 1 ? race.raceNumber : ''} result`);
        return;
      }
      if (race.position && race.fleetSize) {
        const pos = parseInt(race.position, 10);
        const fleet = parseInt(race.fleetSize, 10);
        if (pos > fleet) {
          setValidationError("Position can't be greater than fleet size");
          return;
        }
      }
    }

    // Must have at least a position entered
    if (!raceResults.some((r) => r.position)) {
      setValidationError('Enter at least one race position');
      return;
    }

    setValidationError(null);
    setIsSaving(true);

    try {
      const fullNotes = [
        narrative,
        startEnd ? `Start: ${startEnd} end` : '',
        notes,
      ].filter(Boolean).join('\n\n');

      const raceResultsJson = raceResults
        .filter((r) => r.position || r.keyMoment)
        .map((r) => ({
          race_number: r.raceNumber,
          position: r.position ? parseInt(r.position, 10) : null,
          fleet_size: r.fleetSize ? parseInt(r.fleetSize, 10) : null,
          key_moment: r.keyMoment || null,
        }));

      const firstRaceWithResult = raceResults.find((r) => r.position);
      const position = firstRaceWithResult?.position ? parseInt(firstRaceWithResult.position, 10) : null;
      const fleetSize = firstRaceWithResult?.fleetSize ? parseInt(firstRaceWithResult.fleetSize, 10) : null;
      const primaryKeyMoment = raceResults.find((r) => r.keyMoment?.trim())?.keyMoment || null;

      const updatePayload = {
        notes: fullNotes || null,
        key_moment: primaryKeyMoment,
        self_reported_position: position,
        self_reported_fleet_size: fleetSize,
        race_count: raceCount,
        race_results: raceResultsJson.length > 0 ? raceResultsJson : null,
      };

      const { error } = await supabase
        .from('race_timer_sessions')
        .update(updatePayload)
        .eq('id', sessionId);

      if (error) throw error;

      // Trigger adaptive learning in background
      if (effectiveUserId && raceId && (narrative.trim() || raceResults.some((r) => r.keyMoment?.trim()))) {
        const keyMoments = raceResults
          .filter((r) => r.keyMoment?.trim())
          .map((r) => ({
            description: r.keyMoment,
            phase: 'race' as const,
          }));

        AdaptiveLearningService.processRaceCompletion(effectiveUserId, raceId, {
          narrative: narrative || undefined,
          keyMoments: keyMoments.length > 0 ? keyMoments : undefined,
        }).catch((err) => {
          console.warn('[RaceResultDetailSheet] Learning extraction failed (non-critical):', err);
        });
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      onSaveComplete();
      onClose();
    } catch (err) {
      console.error('[RaceResultDetailSheet] Save error:', err);
      setValidationError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [sessionId, raceResults, raceCount, narrative, startEnd, notes, effectiveUserId, raceId, onSaveComplete, onClose]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackground}>
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Race Result</Text>
          <Pressable
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={COLORS.gray} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Sparkline (larger version) */}
            {recentResults.length > 0 && (
              <View style={styles.sparklineContainer}>
                <SheetSparkline
                  recentResults={recentResults}
                  currentPosition={livePosition}
                  currentFleetSize={liveFleetSize}
                  width={320}
                  height={80}
                />
                <Text style={styles.sparklineLabel}>Position trend (last {recentResults.length} races)</Text>
              </View>
            )}

            {/* Race count selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>RACES</Text>
              <View style={styles.pillRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable
                    key={n}
                    style={[styles.pill, raceCount === n && styles.pillActive]}
                    onPress={() => handleRaceCountChange(n)}
                  >
                    <Text style={[styles.pillText, raceCount === n && styles.pillTextActive]}>
                      {n}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Per-race result entry */}
            {raceResults.map((race, idx) => (
              <View key={race.raceNumber} style={styles.raceEntry}>
                {raceCount > 1 && (
                  <Text style={styles.raceEntryLabel}>Race {race.raceNumber}</Text>
                )}

                {/* Position / Fleet size inputs */}
                <View style={styles.positionRow}>
                  <View style={styles.positionInputGroup}>
                    <Text style={styles.inputLabel}>Position</Text>
                    <TextInput
                      style={styles.numberInput}
                      value={race.position}
                      onChangeText={(v) => updateRaceResult(idx, 'position', v)}
                      placeholder="—"
                      placeholderTextColor={COLORS.gray3}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                  </View>
                  <Text style={styles.ofText}>of</Text>
                  <View style={styles.positionInputGroup}>
                    <Text style={styles.inputLabel}>Fleet size</Text>
                    <TextInput
                      style={styles.numberInput}
                      value={race.fleetSize}
                      onChangeText={(v) => updateRaceResult(idx, 'fleetSize', v)}
                      placeholder="—"
                      placeholderTextColor={COLORS.gray3}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                  </View>
                </View>

                {/* Fleet position bar (live preview) */}
                {race.position && race.fleetSize && (
                  <FleetPositionBar
                    position={parseInt(race.position, 10)}
                    fleetSize={parseInt(race.fleetSize, 10)}
                    height={6}
                    showLabel
                  />
                )}

                {/* Key moment */}
                <TextInput
                  style={styles.textInput}
                  value={race.keyMoment}
                  onChangeText={(v) => updateRaceResult(idx, 'keyMoment', v)}
                  placeholder="Key moment of the race..."
                  placeholderTextColor={COLORS.gray3}
                  multiline
                  numberOfLines={2}
                />
              </View>
            ))}

            {/* Start end segmented control */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>START END</Text>
              <View style={styles.pillRow}>
                {(['pin', 'middle', 'boat'] as const).map((option) => (
                  <Pressable
                    key={option}
                    style={[styles.segmentPill, startEnd === option && styles.segmentPillActive]}
                    onPress={() => setStartEnd(startEnd === option ? null : option)}
                  >
                    <Text style={[styles.segmentPillText, startEnd === option && styles.segmentPillTextActive]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Narrative */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NARRATIVE</Text>
              <TextInput
                style={[styles.textInput, styles.narrativeInput]}
                value={narrative}
                onChangeText={setNarrative}
                placeholder="What happened out there..."
                placeholderTextColor={COLORS.gray3}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NOTES</Text>
              <TextInput
                style={styles.textInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional notes..."
                placeholderTextColor={COLORS.gray3}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Validation error */}
            {validationError && (
              <Text style={styles.errorText}>{validationError}</Text>
            )}

            {/* Done button */}
            <Pressable
              style={[styles.doneButton, isSaving && styles.doneButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving || isCreatingSession}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.doneButtonText}>Done</Text>
              )}
            </Pressable>

            {/* Skip link */}
            <Pressable style={styles.skipLink} onPress={handleClose}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    width: '100%',
    position: 'relative',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.gray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    gap: 20,
  },

  // Sparkline
  sparklineContainer: {
    alignItems: 'center',
    gap: 4,
  },
  sparklineLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.gray,
  },

  // Fields
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Race count pills
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    width: 40,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: COLORS.blue,
  },
  pillText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.label,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },

  // Per-race entry
  raceEntry: {
    gap: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray5,
  },
  raceEntryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  positionInputGroup: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.gray,
  },
  numberInput: {
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
    padding: 12,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.label,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  ofText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray,
    paddingBottom: 12,
  },
  textInput: {
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.label,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  narrativeInput: {
    minHeight: 72,
  },

  // Segment control
  segmentPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.gray6,
    alignItems: 'center',
  },
  segmentPillActive: {
    backgroundColor: COLORS.blue,
  },
  segmentPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.label,
  },
  segmentPillTextActive: {
    color: '#FFFFFF',
  },

  // Error
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.red,
    textAlign: 'center',
  },

  // Done button
  doneButton: {
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonDisabled: {
    opacity: 0.6,
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Skip
  skipLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.blue,
  },
});

export default RaceResultDetailSheet;
