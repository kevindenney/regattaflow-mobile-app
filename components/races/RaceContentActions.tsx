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
  Share2,
  Users,
} from 'lucide-react-native';
import { IOS_COLORS, IOS_SPACING, IOS_RADIUS, IOS_TYPOGRAPHY } from '@/lib/design-tokens-ios';
import { supabase } from '@/services/supabase';
import { useReflectProfile } from '@/hooks/useReflectProfile';
import { Toast, ToastTitle, useToast } from '@/components/ui/toast';
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

  // Get follower count for social context
  const { data: profileData } = useReflectProfile();
  const followerCount = profileData?.profile?.followerCount ?? 0;

  // Toast for save confirmation
  const toast = useToast();

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

  const handlePrepSaved = useCallback(() => {
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
    // Show toast
    toast.show({
      placement: 'top',
      duration: 3000,
      render: ({ id }) => (
        <Toast nativeID={`toast-${id}`} action="success">
          <ToastTitle>Prep shared with your fleet</ToastTitle>
        </Toast>
      ),
    });
    onContentSaved?.();
  }, [regattaId, onContentSaved, toast]);

  const handlePostRaceSaved = useCallback(() => {
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
    // Show toast
    toast.show({
      placement: 'top',
      duration: 3000,
      render: ({ id }) => (
        <Toast nativeID={`toast-${id}`} action="success">
          <ToastTitle>Debrief shared - your lessons help others improve</ToastTitle>
        </Toast>
      ),
    });
    onContentSaved?.();
  }, [regattaId, onContentSaved, toast]);

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
          onSaved={handlePrepSaved}
        />
        <PostRaceForm
          regattaId={regattaId}
          raceName={raceName}
          visible={showPostRaceForm}
          onClose={() => setShowPostRaceForm(false)}
          onSaved={handlePostRaceSaved}
        />
      </>
    );
  }

  // Full variant
  return (
    <>
      <View style={styles.container}>
        {/* Section Header with Social Context */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLine} />
          <Text style={styles.sectionHeaderText}>
            {followerCount > 0 ? 'Help Your Fleet' : 'Share Your Knowledge'}
          </Text>
          <View style={styles.sectionHeaderLine} />
        </View>
        <Text style={styles.sectionSubtext}>
          {followerCount > 0
            ? `Your insights help ${followerCount} sailor${followerCount === 1 ? '' : 's'} prepare better`
            : 'Top sailors share their prep - build your reputation'}
        </Text>

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
              <Share2 size={16} color={IOS_COLORS.systemBlue} />
            )}
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionLabel}>
              {contentStatus.hasPrepNotes ? 'Edit Your Prep' : 'Share Your Prep'}
            </Text>
            <Text style={styles.actionHint}>
              {contentStatus.hasPrepNotes ? 'Update your prep notes' : 'Help others prepare for similar conditions'}
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
                <Share2 size={16} color={IOS_COLORS.systemYellow} />
              )}
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>
                {contentStatus.hasPostRaceNotes ? 'Edit Debrief' : 'Share Your Debrief'}
              </Text>
              <Text style={styles.actionHint}>
                {contentStatus.hasPostRaceNotes
                  ? 'Update your race analysis'
                  : 'Your lessons help the fleet improve'}
              </Text>
            </View>
            <Lightbulb
              size={20}
              color={contentStatus.hasPostRaceNotes ? IOS_COLORS.systemYellow : IOS_COLORS.systemGray3}
            />
          </Pressable>
        )}

        {/* Follower count indicator */}
        {followerCount > 0 && (
          <View style={styles.followerIndicator}>
            <Users size={14} color={IOS_COLORS.systemBlue} />
            <Text style={styles.followerIndicatorText}>
              Helps {followerCount} follower{followerCount === 1 ? '' : 's'}
            </Text>
          </View>
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
        onSaved={handlePrepSaved}
      />
      <PostRaceForm
        regattaId={regattaId}
        raceName={raceName}
        visible={showPostRaceForm}
        onClose={() => setShowPostRaceForm(false)}
        onSaved={handlePostRaceSaved}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    marginBottom: IOS_SPACING.xs,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: IOS_COLORS.systemGray5,
  },
  sectionHeaderText: {
    ...IOS_TYPOGRAPHY.caption1,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtext: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
    marginBottom: IOS_SPACING.md,
  },
  followerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: IOS_SPACING.xs,
    paddingVertical: IOS_SPACING.sm,
  },
  followerIndicatorText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.systemBlue,
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
