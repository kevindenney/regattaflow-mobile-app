/**
 * PostRaceInterview Component
 *
 * Tufte-inspired race logbook entry after race completion.
 * Designed to feel like filling in a logbook, not completing a survey.
 *
 * Design principles:
 * - Data-ink ratio: minimal labels, placeholder text guides
 * - Information density: all fields visible at once (no wizard)
 * - Typography hierarchy: race name bold, fields regular, hints gray
 * - Absence as data: underline inputs, not boxes
 * - Quiet action: "Done" not "Submit & Get AI Analysis →"
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { X, Sparkles, CheckCircle, ChevronRight, Target } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { RaceAnalysisService, type AnalysisResult } from '@/services/RaceAnalysisService';
import { AdaptiveLearningService } from '@/services/AdaptiveLearningService';
import { createLogger } from '@/lib/utils/logger';
import { MorningDecisionsReview } from './MorningDecisionsReview';

const logger = createLogger('PostRaceInterview');

// iOS System Colors
const IOS_COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  quaternaryLabel: '#3C3C434D',
  separator: '#3C3C434A',
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  blue: '#007AFF',
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  green: '#34C759',
};

interface PostRaceInterviewProps {
  visible: boolean;
  sessionId: string;
  raceName: string;
  raceId?: string;
  raceDate?: string;
  onClose: () => void;
  onComplete: () => void;
  gpsPointCount?: number;
}

// Per-race result entry for multi-race regattas
interface RaceResultEntry {
  raceNumber: number;
  position: string;
  fleetSize: string;
  keyMoment: string;
}

interface RaceLogEntry {
  raceCount: number;  // Number of races in the regatta
  raceResults: RaceResultEntry[];  // Per-race results
  narrative: string;
  startEnd: 'pin' | 'middle' | 'boat' | null;
  notes: string;
}

// Helper to create initial race results array
const createInitialRaceResults = (count: number): RaceResultEntry[] =>
  Array.from({ length: count }, (_, i) => ({
    raceNumber: i + 1,
    position: '',
    fleetSize: '',
    keyMoment: '',
  }));

type ModalState = 'form' | 'morning_review' | 'analyzing' | 'results';

export function PostRaceInterview({
  visible,
  sessionId,
  raceName,
  raceId,
  raceDate,
  onClose,
  onComplete,
  gpsPointCount,
}: PostRaceInterviewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [entry, setEntry] = useState<RaceLogEntry>({
    raceCount: 1,
    raceResults: createInitialRaceResults(1),
    narrative: '',
    startEnd: null,
    notes: '',
  });
  const [modalState, setModalState] = useState<ModalState>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [hasMorningIntentions, setHasMorningIntentions] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if there are morning intentions for this race
  useEffect(() => {
    if (!visible || !raceId) {
      setHasMorningIntentions(null);
      return;
    }

    async function checkMorningIntentions() {
      try {
        const { data } = await supabase
          .from('sailor_race_preparation')
          .select('morning_intentions')
          .eq('race_event_id', raceId)
          .maybeSingle();

        const intentions = data?.morning_intentions;
        const hasIntentions = !!(
          intentions?.forecast ||
          intentions?.rigTuning ||
          intentions?.sailSelection ||
          intentions?.tactics
        );
        setHasMorningIntentions(hasIntentions);
      } catch (err) {
        logger.error('Error checking morning intentions:', err);
        setHasMorningIntentions(false);
      }
    }

    checkMorningIntentions();
  }, [visible, raceId]);

  // Load existing session data when editing (pre-fill form)
  useEffect(() => {
    if (!visible || !sessionId) {
      return;
    }

    async function loadExistingData() {
      try {
        logger.debug('[POST_RACE_EDIT] Loading existing session data', { sessionId });
        const { data, error } = await supabase
          .from('race_timer_sessions')
          .select('self_reported_position, self_reported_fleet_size, key_moment, notes, race_count, race_results')
          .eq('id', sessionId)
          .single();

        if (error) {
          logger.warn('[POST_RACE_EDIT] Error loading session data:', error);
          return;
        }

        if (!data) {
          logger.debug('[POST_RACE_EDIT] No existing data found');
          return;
        }

        logger.debug('[POST_RACE_EDIT] Found existing data', {
          position: data.self_reported_position,
          fleetSize: data.self_reported_fleet_size,
          hasNotes: !!data.notes,
          raceCount: data.race_count,
        });

        // Parse existing data to pre-fill form
        const raceCount = data.race_count || 1;
        let raceResults: RaceResultEntry[] = createInitialRaceResults(raceCount);

        // If we have per-race results, use them
        if (data.race_results && Array.isArray(data.race_results)) {
          raceResults = data.race_results.map((r: any, i: number) => ({
            raceNumber: r.race_number || i + 1,
            position: r.position?.toString() || '',
            fleetSize: r.fleet_size?.toString() || '',
            keyMoment: r.key_moment || '',
          }));
          // Ensure we have enough entries
          while (raceResults.length < raceCount) {
            raceResults.push({
              raceNumber: raceResults.length + 1,
              position: '',
              fleetSize: '',
              keyMoment: '',
            });
          }
        } else if (data.self_reported_position || data.key_moment) {
          // Fall back to single-race data
          raceResults[0] = {
            raceNumber: 1,
            position: data.self_reported_position?.toString() || '',
            fleetSize: data.self_reported_fleet_size?.toString() || '',
            keyMoment: data.key_moment || '',
          };
        }

        // Parse notes to extract narrative and start end (if stored in combined format)
        let narrative = '';
        let startEnd: 'pin' | 'middle' | 'boat' | null = null;
        let notes = '';

        if (data.notes) {
          const noteLines = data.notes.split('\n\n');
          for (const line of noteLines) {
            if (line.startsWith('Start: ')) {
              const startValue = line.replace('Start: ', '').replace(' end', '').toLowerCase();
              if (startValue === 'pin' || startValue === 'middle' || startValue === 'boat') {
                startEnd = startValue;
              }
            } else if (!narrative) {
              narrative = line;
            } else {
              notes = notes ? notes + '\n\n' + line : line;
            }
          }
        }

        setEntry({
          raceCount,
          raceResults,
          narrative,
          startEnd,
          notes,
        });
      } catch (err) {
        logger.error('[POST_RACE_EDIT] Unexpected error loading session data:', err);
      }
    }

    loadExistingData();
  }, [visible, sessionId]);

  const resetForm = () => {
    setEntry({
      raceCount: 1,
      raceResults: createInitialRaceResults(1),
      narrative: '',
      startEnd: null,
      notes: '',
    });
    setModalState('form');
    setAnalysisResult(null);
    setAnalysisError(null);
    setHasMorningIntentions(null);
  };

  // Update race results when race count changes
  const handleRaceCountChange = (newCount: number) => {
    const count = Math.max(1, Math.min(10, newCount));  // Clamp 1-10
    setEntry(prev => {
      const newResults = createInitialRaceResults(count);
      // Preserve existing data for races that still exist
      prev.raceResults.forEach((result, i) => {
        if (i < count) {
          newResults[i] = { ...result, raceNumber: i + 1 };
        }
      });
      return { ...prev, raceCount: count, raceResults: newResults };
    });
  };

  // Update a specific race's result
  const updateRaceResult = (raceIndex: number, field: keyof RaceResultEntry, value: string) => {
    // Clear validation error when user edits
    if (validationError) setValidationError(null);

    setEntry(prev => {
      const newResults = [...prev.raceResults];
      if (newResults[raceIndex]) {
        newResults[raceIndex] = { ...newResults[raceIndex], [field]: value };
      }
      return { ...prev, raceResults: newResults };
    });
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleDone = () => {
    onComplete();
    onClose();
    resetForm();
  };

  const handleViewFullAnalysis = () => {
    onComplete();
    onClose();
    resetForm();
    if (raceId) {
      // Navigate with section=analysis to scroll to the analysis section
      router.push(`/(tabs)/race/scrollable/${raceId}?section=analysis`);
    }
  };

  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const handleSubmit = async () => {
    // DEBUG: Log sessionId at start
    logger.debug('[POST_RACE_SAVE] handleSubmit called', {
      sessionId,
      sessionIdType: typeof sessionId,
      sessionIdLength: sessionId?.length,
      hasSessionId: !!sessionId,
    });

    // Validate: if position is entered, fleet size is required
    for (const race of entry.raceResults) {
      if (race.position && !race.fleetSize) {
        logger.debug('[POST_RACE_SAVE] Validation failed: missing fleet size');
        setValidationError(`Enter fleet size for race ${entry.raceCount > 1 ? race.raceNumber : ''} result`);
        return;
      }
      // Also validate position <= fleet size
      if (race.position && race.fleetSize) {
        const pos = parseInt(race.position, 10);
        const fleet = parseInt(race.fleetSize, 10);
        if (pos > fleet) {
          logger.debug('[POST_RACE_SAVE] Validation failed: position > fleet size');
          setValidationError(`Position can't be greater than fleet size`);
          return;
        }
      }
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      // Build notes from narrative + additional notes
      const fullNotes = [
        entry.narrative,
        entry.startEnd ? `Start: ${entry.startEnd} end` : '',
        entry.notes,
      ].filter(Boolean).join('\n\n');

      // Build race results array for JSONB storage
      const raceResultsJson = entry.raceResults
        .filter(r => r.position || r.keyMoment)  // Only include races with data
        .map(r => ({
          race_number: r.raceNumber,
          position: r.position ? parseInt(r.position, 10) : null,
          fleet_size: r.fleetSize ? parseInt(r.fleetSize, 10) : null,
          key_moment: r.keyMoment || null,
        }));

      // For backwards compatibility, use first race result as primary
      const firstRaceWithResult = entry.raceResults.find(r => r.position);
      const position = firstRaceWithResult?.position ? parseInt(firstRaceWithResult.position, 10) : null;
      const fleetSize = firstRaceWithResult?.fleetSize ? parseInt(firstRaceWithResult.fleetSize, 10) : null;

      // Primary key moment: first non-empty key moment
      const primaryKeyMoment = entry.raceResults.find(r => r.keyMoment?.trim())?.keyMoment || null;

      // DEBUG: Log what we're about to save
      const updatePayload = {
        notes: fullNotes || null,
        key_moment: primaryKeyMoment,
        self_reported_position: position,
        self_reported_fleet_size: fleetSize,
        race_count: entry.raceCount,
        race_results: raceResultsJson.length > 0 ? raceResultsJson : null,
      };
      logger.debug('[POST_RACE_SAVE] About to update race_timer_sessions', {
        sessionId,
        updatePayload,
      });

      // Save to database
      const { error, data, count } = await supabase
        .from('race_timer_sessions')
        .update(updatePayload)
        .eq('id', sessionId)
        .select();

      // DEBUG: Log result
      logger.debug('[POST_RACE_SAVE] Supabase update result', {
        error: error ? { message: error.message, code: error.code, details: error.details } : null,
        dataReturned: data,
        rowCount: data?.length ?? 0,
      });

      if (error) throw error;

      // DEBUG: Verify the save by re-reading
      const { data: verifyData, error: verifyError } = await supabase
        .from('race_timer_sessions')
        .select('id, self_reported_position, self_reported_fleet_size, key_moment, notes')
        .eq('id', sessionId)
        .single();

      logger.debug('[POST_RACE_SAVE] Verification read', {
        verifyData,
        verifyError: verifyError ? { message: verifyError.message } : null,
      });

      // Trigger adaptive learning extraction in background (don't await)
      if (user?.id && raceId && (entry.narrative.trim() || entry.raceResults.some(r => r.keyMoment?.trim()))) {
        const keyMoments = entry.raceResults
          .filter(r => r.keyMoment?.trim())
          .map(r => ({
            description: r.keyMoment,
            phase: 'race' as const,
          }));

        AdaptiveLearningService.processRaceCompletion(
          user.id,
          raceId,
          {
            narrative: entry.narrative || undefined,
            keyMoments: keyMoments.length > 0 ? keyMoments : undefined,
          }
        ).catch(err => {
          logger.warn('Failed to extract learning events (non-critical):', err);
        });
      }

      setIsSubmitting(false);

      // If there are morning intentions, show the review step
      if (hasMorningIntentions && raceId) {
        setModalState('morning_review');
        return;
      }

      // Otherwise proceed directly to analysis
      await proceedToAnalysis();
    } catch (error: any) {
      logger.error('Error saving race log:', error);
      setIsSubmitting(false);
      // Still complete - data might have partially saved
      handleDone();
    }
  };

  // Proceed to AI analysis after form (and optionally morning review)
  const proceedToAnalysis = async () => {
    const hasAnyKeyMoment = entry.raceResults.some(r => r.keyMoment?.trim());

    if (entry.narrative.trim() || hasAnyKeyMoment) {
      setModalState('analyzing');

      logger.debug('Starting AI analysis for session:', sessionId);
      const result = await RaceAnalysisService.analyzeRaceSession(sessionId);

      if (result) {
        logger.debug('AI analysis complete:', result.id);
        setAnalysisResult(result);
        setModalState('results');
      } else {
        // Poll for results
        let attempts = 0;
        const maxAttempts = 6;
        const pollInterval = 2000;

        const pollForResults = async () => {
          attempts++;
          const polledResult = await RaceAnalysisService.getAnalysis(sessionId);

          if (polledResult) {
            setAnalysisResult(polledResult);
            setModalState('results');
            return;
          }

          if (attempts < maxAttempts) {
            setTimeout(pollForResults, pollInterval);
          } else {
            setAnalysisError('Analysis processing. Check race detail later.');
            setModalState('results');
          }
        };

        setTimeout(pollForResults, pollInterval);
      }
    } else {
      // No narrative content - just saved result/key moment, complete immediately
      handleDone();
    }
  };

  // Handle morning review completion
  const handleMorningReviewComplete = () => {
    proceedToAnalysis();
  };

  // Handle morning review skip
  const handleMorningReviewSkip = () => {
    proceedToAnalysis();
  };

  // Render morning decisions review
  const renderMorningReview = () => {
    if (!raceId) return null;

    return (
      <MorningDecisionsReview
        raceEventId={raceId}
        onComplete={handleMorningReviewComplete}
        onSkip={handleMorningReviewSkip}
      />
    );
  };

  // Render Tufte-style logbook form
  const renderForm = () => (
    <ScrollView
      style={styles.formContainer}
      contentContainerStyle={styles.formContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Race Header */}
      <View style={styles.header}>
        <Text style={styles.raceName}>{raceName}</Text>
        {raceDate && (
          <Text style={styles.raceDate}>{formatDate(raceDate)}</Text>
        )}
      </View>

      {/* Race Count Selector */}
      <View style={styles.raceCountRow}>
        <Text style={styles.fieldLabel}>Races</Text>
        <View style={styles.raceCountButtons}>
          {[1, 2, 3, 4, 5].map((count) => (
            <TouchableOpacity
              key={count}
              style={[
                styles.raceCountButton,
                entry.raceCount === count && styles.raceCountButtonActive,
              ]}
              onPress={() => handleRaceCountChange(count)}
            >
              <Text style={[
                styles.raceCountButtonText,
                entry.raceCount === count && styles.raceCountButtonTextActive,
              ]}>
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Per-Race Results */}
      {entry.raceResults.map((race, index) => (
        <View key={race.raceNumber} style={styles.raceResultSection}>
          {entry.raceCount > 1 && (
            <Text style={styles.raceNumberLabel}>Race {race.raceNumber}</Text>
          )}

          {/* Result Row */}
          <View style={styles.resultRow}>
            <Text style={styles.fieldLabel}>Result</Text>
            <View style={styles.resultInputs}>
              <TextInput
                style={styles.numberInput}
                value={race.position}
                onChangeText={(text) => updateRaceResult(index, 'position', text.replace(/[^0-9]/g, ''))}
                placeholder="—"
                placeholderTextColor={IOS_COLORS.gray3}
                keyboardType="number-pad"
                maxLength={3}
                textAlign="center"
              />
              <Text style={styles.resultSeparator}>of</Text>
              <TextInput
                style={styles.numberInput}
                value={race.fleetSize}
                onChangeText={(text) => updateRaceResult(index, 'fleetSize', text.replace(/[^0-9]/g, ''))}
                placeholder="—"
                placeholderTextColor={IOS_COLORS.gray3}
                keyboardType="number-pad"
                maxLength={3}
                textAlign="center"
              />
            </View>
          </View>

          {/* Key Moment for this race */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Key moment</Text>
            <TextInput
              style={styles.textInput}
              value={race.keyMoment}
              onChangeText={(text) => updateRaceResult(index, 'keyMoment', text)}
              placeholder={entry.raceCount > 1 ? `Race ${race.raceNumber} highlight...` : "What stood out?"}
              placeholderTextColor={IOS_COLORS.gray3}
            />
          </View>
        </View>
      ))}

      {/* Narrative (overall) */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{entry.raceCount > 1 ? 'Overall' : 'The race'}</Text>
        <TextInput
          style={styles.textArea}
          value={entry.narrative}
          onChangeText={(text) => setEntry({ ...entry, narrative: text })}
          placeholder={entry.raceCount > 1 ? "How did the day go?" : "How did it go?"}
          placeholderTextColor={IOS_COLORS.gray3}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Start End - iOS Segmented Control Style */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Start</Text>
        <View style={styles.segmentedControl}>
          {(['pin', 'middle', 'boat'] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.segmentedOption,
                entry.startEnd === option && styles.segmentedOptionSelected
              ]}
              onPress={() => setEntry({ ...entry, startEnd: entry.startEnd === option ? null : option })}
            >
              <Text style={[
                styles.segmentedLabel,
                entry.startEnd === option && styles.segmentedLabelSelected
              ]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Notes</Text>
        <TextInput
          style={styles.textArea}
          value={entry.notes}
          onChangeText={(text) => setEntry({ ...entry, notes: text })}
          placeholder="Anything else to remember"
          placeholderTextColor={IOS_COLORS.gray3}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Validation Error */}
      {validationError && (
        <Text style={styles.validationError}>{validationError}</Text>
      )}

      {/* Done Button */}
      <TouchableOpacity
        style={[styles.doneButton, isSubmitting && styles.doneButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={IOS_COLORS.systemBackground} size="small" />
        ) : (
          <Text style={styles.doneButtonText}>Done</Text>
        )}
      </TouchableOpacity>

      {/* Skip link */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleClose}
        disabled={isSubmitting}
      >
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      {/* GPS indicator */}
      {gpsPointCount !== undefined && gpsPointCount > 0 && (
        <Text style={styles.gpsIndicator}>
          {gpsPointCount} GPS points recorded
        </Text>
      )}
    </ScrollView>
  );

  // Render analyzing state (simplified)
  const renderAnalyzing = () => (
    <View style={styles.analyzingContainer}>
      <Sparkles size={32} color={IOS_COLORS.gray} />
      <Text style={styles.analyzingText}>Analyzing...</Text>
      <ActivityIndicator size="small" color={IOS_COLORS.gray} style={{ marginTop: 16 }} />
    </View>
  );

  // Render results state (simplified)
  const renderResults = () => (
    <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
      <View style={styles.resultsHeader}>
        <CheckCircle size={32} color={IOS_COLORS.green} />
        <Text style={styles.resultsTitle}>Saved</Text>
      </View>

      {analysisResult?.overall_summary && (
        <View style={styles.insightCard}>
          <Text style={styles.insightText}>
            {(() => {
              // Safely extract first 2 sentences, handling edge cases
              const summary = analysisResult.overall_summary.trim();
              if (!summary || summary === '.' || /^\.+$/.test(summary)) {
                return 'Analysis saved.';
              }
              const result = summary.split('.').slice(0, 2).join('.');
              // Ensure we don't return just a period or empty string
              return result && result.trim() !== '' && result !== '.' ? result : 'Analysis saved.';
            })()}
          </Text>
        </View>
      )}

      {analysisError && (
        <Text style={styles.errorText}>{analysisError}</Text>
      )}

      {raceId && (
        <TouchableOpacity
          style={styles.viewAnalysisButton}
          onPress={handleViewFullAnalysis}
        >
          <Target size={18} color={IOS_COLORS.blue} />
          <Text style={styles.viewAnalysisText}>View full analysis</Text>
          <ChevronRight size={18} color={IOS_COLORS.blue} />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.doneButton}
        onPress={handleDone}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Minimal Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerSpacer} />
          <TouchableOpacity
            onPress={modalState === 'analyzing' ? undefined : handleClose}
            disabled={modalState === 'analyzing'}
            style={styles.closeButton}
          >
            <X size={24} color={modalState === 'analyzing' ? IOS_COLORS.gray3 : IOS_COLORS.label} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {modalState === 'form' && renderForm()}
        {modalState === 'morning_review' && renderMorningReview()}
        {modalState === 'analyzing' && renderAnalyzing()}
        {modalState === 'results' && renderResults()}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: 4,
  },
  headerSpacer: {
    width: 24,
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 20,
    marginTop: 4,
  },
  raceName: {
    fontSize: 24,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.5,
  },
  raceDate: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
  },
  raceCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  raceCountButtons: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  raceCountButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
    justifyContent: 'center',
    alignItems: 'center',
  },
  raceCountButtonActive: {
    backgroundColor: IOS_COLORS.label,
    borderColor: IOS_COLORS.label,
  },
  raceCountButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  raceCountButtonTextActive: {
    color: IOS_COLORS.systemBackground,
  },
  raceResultSection: {
    marginBottom: 4,
  },
  raceNumberLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    width: 70,
  },
  resultInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  numberInput: {
    fontSize: 20,
    fontWeight: '500',
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 56,
  },
  resultSeparator: {
    fontSize: 15,
    color: IOS_COLORS.gray,
    marginHorizontal: 12,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  textInput: {
    fontSize: 16,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  textArea: {
    fontSize: 16,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
    minHeight: 56,
  },
  // iOS Segmented Control (replaces radio buttons)
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    borderRadius: 8,
    padding: 2,
    marginTop: 6,
  },
  segmentedOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  segmentedOptionSelected: {
    backgroundColor: IOS_COLORS.systemBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentedLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  segmentedLabelSelected: {
    color: IOS_COLORS.label,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  doneButtonDisabled: {
    opacity: 0.5,
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.systemBackground,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 15,
    color: IOS_COLORS.gray,
  },
  gpsIndicator: {
    fontSize: 12,
    color: IOS_COLORS.gray2,
    textAlign: 'center',
    marginTop: 8,
  },
  validationError: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: -16,
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    fontSize: 17,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 16,
  },
  resultsHeader: {
    alignItems: 'center',
    marginVertical: 32,
    gap: 12,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  insightCard: {
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  insightText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 22,
  },
  errorText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  viewAnalysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  viewAnalysisText: {
    fontSize: 15,
    color: IOS_COLORS.blue,
  },
});
