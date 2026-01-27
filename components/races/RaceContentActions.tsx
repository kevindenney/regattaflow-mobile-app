/**
 * RaceContentActions Component
 *
 * Provides buttons for adding/editing race prep notes and post-race analysis.
 * Integrates with RacePrepForm and PostRaceForm modals.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BookOpen,
  Check,
  Edit3,
  FileText,
  Lightbulb,
  Plus,
} from 'lucide-react-native';
import { IOS_COLORS, IOS_SPACING, IOS_RADIUS, IOS_TYPOGRAPHY } from '@/lib/design-tokens-ios';
import { supabase } from '@/services/supabase';
import { RacePrepForm } from './RacePrepForm';
import { PostRaceForm } from './PostRaceForm';

// =============================================================================
// TYPES
// =============================================================================

export interface RaceContentActionsProps {
  /** Regatta ID */
  regattaId: string;
  /** Race name for display in forms */
  raceName?: string;
  /** Race start date to determine if post-race is available */
  raceDate?: string | Date;
  /** Display mode - compact shows icons only, full shows labels */
  variant?: 'compact' | 'full';
  /** Callback when content is saved */
  onContentSaved?: () => void;
}

interface ContentStatus {
  hasPrepNotes: boolean;
  hasPostRaceNotes: boolean;
  hasLessonsLearned: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RaceContentActions({
  regattaId,
  raceName,
  raceDate,
  variant = 'full',
  onContentSaved,
}: RaceContentActionsProps) {
  const [showPrepForm, setShowPrepForm] = useState(false);
  const [showPostRaceForm, setShowPostRaceForm] = useState(false);
  const [contentStatus, setContentStatus] = useState<ContentStatus>({
    hasPrepNotes: false,
    hasPostRaceNotes: false,
    hasLessonsLearned: false,
  });

  // Check if race is in the past (post-race available)
  const isPastRace = raceDate ? new Date(raceDate) < new Date() : false;

  // Load content status
  useEffect(() => {
    if (!regattaId) return;

    const loadStatus = async () => {
      const { data } = await supabase
        .from('regattas')
        .select('prep_notes, post_race_notes, lessons_learned')
        .eq('id', regattaId)
        .single();

      if (data) {
        setContentStatus({
          hasPrepNotes: !!data.prep_notes,
          hasPostRaceNotes: !!data.post_race_notes,
          hasLessonsLearned: data.lessons_learned && data.lessons_learned.length > 0,
        });
      }
    };

    loadStatus();
  }, [regattaId]);

  const handleSaved = useCallback(() => {
    // Reload status after save
    supabase
      .from('regattas')
      .select('prep_notes, post_race_notes, lessons_learned')
      .eq('id', regattaId)
      .single()
      .then(({ data }) => {
        if (data) {
          setContentStatus({
            hasPrepNotes: !!data.prep_notes,
            hasPostRaceNotes: !!data.post_race_notes,
            hasLessonsLearned: data.lessons_learned && data.lessons_learned.length > 0,
          });
        }
      });
    onContentSaved?.();
  }, [regattaId, onContentSaved]);

  if (variant === 'compact') {
    return (
      <>
        <View style={styles.compactContainer}>
          {/* Prep Notes Button */}
          <Pressable
            style={[
              styles.compactButton,
              contentStatus.hasPrepNotes && styles.compactButtonFilled,
            ]}
            onPress={() => setShowPrepForm(true)}
          >
            {contentStatus.hasPrepNotes ? (
              <Check size={16} color={IOS_COLORS.systemGreen} />
            ) : (
              <FileText size={16} color={IOS_COLORS.systemBlue} />
            )}
          </Pressable>

          {/* Post-Race Button (only if race is past) */}
          {isPastRace && (
            <Pressable
              style={[
                styles.compactButton,
                contentStatus.hasPostRaceNotes && styles.compactButtonFilled,
              ]}
              onPress={() => setShowPostRaceForm(true)}
            >
              {contentStatus.hasPostRaceNotes ? (
                <Check size={16} color={IOS_COLORS.systemGreen} />
              ) : (
                <Lightbulb size={16} color={IOS_COLORS.systemYellow} />
              )}
            </Pressable>
          )}
        </View>

        {/* Forms */}
        <RacePrepForm
          regattaId={regattaId}
          raceName={raceName}
          visible={showPrepForm}
          onClose={() => setShowPrepForm(false)}
          onSaved={handleSaved}
        />
        <PostRaceForm
          regattaId={regattaId}
          raceName={raceName}
          visible={showPostRaceForm}
          onClose={() => setShowPostRaceForm(false)}
          onSaved={handleSaved}
        />
      </>
    );
  }

  // Full variant
  return (
    <>
      <View style={styles.container}>
        {/* Prep Notes Button */}
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            contentStatus.hasPrepNotes && styles.actionButtonFilled,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => setShowPrepForm(true)}
        >
          <View style={[
            styles.actionIcon,
            contentStatus.hasPrepNotes && styles.actionIconFilled,
          ]}>
            {contentStatus.hasPrepNotes ? (
              <Edit3 size={16} color={IOS_COLORS.systemGreen} />
            ) : (
              <Plus size={16} color={IOS_COLORS.systemBlue} />
            )}
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionLabel}>
              {contentStatus.hasPrepNotes ? 'Edit Prep Notes' : 'Add Prep Notes'}
            </Text>
            <Text style={styles.actionHint}>
              {contentStatus.hasPrepNotes ? 'Tuning & strategy saved' : 'Equipment, tuning, strategy'}
            </Text>
          </View>
          <FileText
            size={20}
            color={contentStatus.hasPrepNotes ? IOS_COLORS.systemGreen : IOS_COLORS.systemGray3}
          />
        </Pressable>

        {/* Post-Race Button (only if race is past) */}
        {isPastRace && (
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              contentStatus.hasPostRaceNotes && styles.actionButtonFilled,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => setShowPostRaceForm(true)}
          >
            <View style={[
              styles.actionIcon,
              contentStatus.hasPostRaceNotes && styles.actionIconFilledYellow,
            ]}>
              {contentStatus.hasPostRaceNotes ? (
                <Edit3 size={16} color={IOS_COLORS.systemYellow} />
              ) : (
                <Plus size={16} color={IOS_COLORS.systemYellow} />
              )}
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>
                {contentStatus.hasPostRaceNotes ? 'Edit Analysis' : 'Add Post-Race Analysis'}
              </Text>
              <Text style={styles.actionHint}>
                {contentStatus.hasLessonsLearned
                  ? `${contentStatus.hasLessonsLearned ? 'Lessons captured' : ''}`
                  : 'What went well, lessons learned'}
              </Text>
            </View>
            <Lightbulb
              size={20}
              color={contentStatus.hasPostRaceNotes ? IOS_COLORS.systemYellow : IOS_COLORS.systemGray3}
            />
          </Pressable>
        )}

        {/* Pre-race hint if not past */}
        {!isPastRace && (
          <View style={styles.hintContainer}>
            <BookOpen size={14} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.hintText}>
              Post-race analysis will be available after the race
            </Text>
          </View>
        )}
      </View>

      {/* Forms */}
      <RacePrepForm
        regattaId={regattaId}
        raceName={raceName}
        visible={showPrepForm}
        onClose={() => setShowPrepForm(false)}
        onSaved={handleSaved}
      />
      <PostRaceForm
        regattaId={regattaId}
        raceName={raceName}
        visible={showPostRaceForm}
        onClose={() => setShowPostRaceForm(false)}
        onSaved={handleSaved}
      />
    </>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    gap: IOS_SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    padding: IOS_SPACING.md,
    borderRadius: IOS_RADIUS.lg,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray5,
  },
  actionButtonFilled: {
    borderColor: `${IOS_COLORS.systemGreen}40`,
    backgroundColor: `${IOS_COLORS.systemGreen}08`,
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${IOS_COLORS.systemBlue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconFilled: {
    backgroundColor: `${IOS_COLORS.systemGreen}15`,
  },
  actionIconFilledYellow: {
    backgroundColor: `${IOS_COLORS.systemYellow}20`,
  },
  actionText: {
    flex: 1,
  },
  actionLabel: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  actionHint: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    padding: IOS_SPACING.md,
  },
  hintText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    gap: IOS_SPACING.xs,
  },
  compactButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.systemGray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButtonFilled: {
    backgroundColor: `${IOS_COLORS.systemGreen}15`,
  },
});

export default RaceContentActions;
