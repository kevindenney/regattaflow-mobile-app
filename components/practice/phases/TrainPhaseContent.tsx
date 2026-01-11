/**
 * TrainPhaseContent
 *
 * Content for the Train phase (during session):
 * - Minimal UI to stay focused on training
 * - Quick drill completion toggles
 * - Timer/stopwatch (optional)
 * - Notes capture
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput } from 'react-native';
import { Check, Clock, MessageSquare } from 'lucide-react-native';
import { IOS_COLORS, TUFTE_BACKGROUND, TUFTE_TEXT } from '@/components/cards/constants';
import { TufteDrillRow } from '../tufte/TufteDrillRow';
import { unicodeBar } from '@/lib/tufte';
import type { PracticeSession, PracticeSessionDrill } from '@/types/practice';

interface TrainPhaseContentProps {
  session: PracticeSession;
  onCompleteDrill: (drillId: string) => void;
  onSkipDrill?: (drillId: string, reason?: string) => void;
  onUpdateNotes?: (notes: string) => void;
  onCompleteSession: () => void;
}

export function TrainPhaseContent({
  session,
  onCompleteDrill,
  onSkipDrill,
  onUpdateNotes,
  onCompleteSession,
}: TrainPhaseContentProps) {
  const [notes, setNotes] = useState(session.notes || '');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Simple elapsed time counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Drill stats
  const drills = session.drills || [];
  const completedCount = drills.filter((d) => d.completed).length;
  const skippedCount = drills.filter((d) => d.skipped).length;
  const remainingCount = drills.length - completedCount - skippedCount;
  const progress = drills.length > 0
    ? ((completedCount + skippedCount) / drills.length) * 100
    : 0;

  // Current drill (first incomplete, non-skipped)
  const currentDrill = drills.find((d) => !d.completed && !d.skipped);
  const currentIndex = currentDrill
    ? drills.findIndex((d) => d.id === currentDrill.id)
    : -1;

  // Format elapsed time
  const formatElapsed = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Session Timer */}
      <View style={styles.timerCard}>
        <Clock size={18} color={IOS_COLORS.blue} />
        <Text style={styles.timerText}>
          {formatElapsed(elapsedTime)} elapsed
        </Text>
      </View>

      {/* Progress Overview */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>PROGRESS</Text>
          <Text style={styles.progressCount}>
            {completedCount}/{drills.length} complete
          </Text>
        </View>
        <Text style={styles.progressBar}>{unicodeBar(progress, 20)}</Text>
        <View style={styles.progressStats}>
          <Text style={styles.statText}>
            {remainingCount} remaining
          </Text>
          {skippedCount > 0 && (
            <Text style={styles.statTextMuted}>
              · {skippedCount} skipped
            </Text>
          )}
        </View>
      </View>

      {/* Current Drill (Prominent) */}
      {currentDrill && (
        <View style={styles.currentDrillCard}>
          <Text style={styles.currentLabel}>NOW</Text>
          <Text style={styles.currentDrillName}>
            {currentDrill.drill?.name || `Drill ${currentIndex + 1}`}
          </Text>
          {currentDrill.drill?.description && (
            <Text style={styles.currentDrillDesc} numberOfLines={2}>
              {currentDrill.drill.description}
            </Text>
          )}
          <View style={styles.currentActions}>
            <Pressable
              style={styles.completeButton}
              onPress={() => onCompleteDrill(currentDrill.id)}
            >
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Complete</Text>
            </Pressable>
            {onSkipDrill && (
              <Pressable
                style={styles.skipButton}
                onPress={() => onSkipDrill(currentDrill.id)}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* All Session Complete */}
      {!currentDrill && drills.length > 0 && (
        <View style={styles.allCompleteCard}>
          <Text style={styles.allCompleteText}>
            All drills complete!
          </Text>
          <Pressable
            style={styles.finishButton}
            onPress={onCompleteSession}
          >
            <Text style={styles.finishButtonText}>
              Finish Session
            </Text>
          </Pressable>
        </View>
      )}

      {/* Remaining Drills */}
      {remainingCount > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>UP NEXT</Text>
          <View style={styles.drillsList}>
            {drills
              .filter((d) => !d.completed && !d.skipped && d.id !== currentDrill?.id)
              .slice(0, 3)
              .map((drill, idx) => {
                const originalIndex = drills.findIndex((d) => d.id === drill.id);
                return (
                  <TufteDrillRow
                    key={drill.id}
                    drill={drill}
                    index={originalIndex}
                  />
                );
              })}
          </View>
        </View>
      )}

      {/* Quick Notes */}
      <View style={styles.notesSection}>
        <View style={styles.notesHeader}>
          <MessageSquare size={16} color={IOS_COLORS.gray} />
          <Text style={styles.sectionLabel}>QUICK NOTES</Text>
        </View>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={(text) => {
            setNotes(text);
            onUpdateNotes?.(text);
          }}
          placeholder="Jot down observations..."
          placeholderTextColor={IOS_COLORS.gray3}
          multiline
          numberOfLines={3}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: `${IOS_COLORS.blue}10`,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
  },
  progressCard: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },
  progressCount: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  progressBar: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: IOS_COLORS.green,
    letterSpacing: -1,
  },
  progressStats: {
    flexDirection: 'row',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  statTextMuted: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.gray,
  },
  currentDrillCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  currentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    letterSpacing: 1,
  },
  currentDrillName: {
    fontSize: 20,
    fontWeight: '700',
    color: TUFTE_TEXT,
  },
  currentDrillDesc: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },
  currentActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: IOS_COLORS.green,
    borderRadius: 10,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray4,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  allCompleteCard: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 24,
  },
  allCompleteText: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  finishButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 10,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },
  drillsList: {
    gap: 2,
  },
  notesSection: {
    gap: 8,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesInput: {
    backgroundColor: TUFTE_BACKGROUND,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.gray4,
    padding: 12,
    fontSize: 14,
    color: TUFTE_TEXT,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default TrainPhaseContent;
