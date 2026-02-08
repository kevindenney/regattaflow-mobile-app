/**
 * ShareInsightsTile - Apple Weather-inspired share insights widget
 *
 * Compact 155x155 pressable tile matching the RaceResultTile pattern.
 * Shows whether the sailor has shared prep notes and post-race debrief
 * with their fleet.
 *
 * Before sharing, shows a teaser of available insights (key learning,
 * strength identified) to encourage sharing.
 *
 * Follows IOSWidgetCard animation (Reanimated scale 0.96 spring, haptics)
 * and IOSConditionsWidgets visual style.
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Share2, Check, Lightbulb, FileText, MessageSquare } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';
import { IOS_ANIMATIONS, IOS_SHADOWS } from '@/lib/design-tokens-ios';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  background: '#FFFFFF',
};

export interface ShareInsightsTileProps {
  /** Whether prep notes have been shared */
  hasPrepNotes: boolean;
  /** Whether post-race notes have been shared */
  hasPostRaceNotes: boolean;
  /** Key learning from race analysis — shown as teaser */
  keyLearning?: string;
  /** Strength identified from AI analysis — shown as teaser */
  strengthIdentified?: string;
  /** Whether debrief is complete (good content to share) */
  debriefComplete?: boolean;
  /** Callback when tile is pressed */
  onPress: () => void;
}

export function ShareInsightsTile({
  hasPrepNotes,
  hasPostRaceNotes,
  keyLearning,
  strengthIdentified,
  debriefComplete,
  onPress,
}: ShareInsightsTileProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, IOS_ANIMATIONS.spring.snappy);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
  };
  const handlePress = () => {
    triggerHaptic('impactLight');
    onPress();
  };

  const isComplete = hasPrepNotes && hasPostRaceNotes;
  const sharedCount = (hasPrepNotes ? 1 : 0) + (hasPostRaceNotes ? 1 : 0);
  const isPartial = sharedCount === 1;

  // Determine what teaser to show before sharing
  const teaserText = keyLearning || strengthIdentified;
  const hasTeaser = !!teaserText && !isComplete;

  const getHint = () => {
    if (isComplete) return 'View / edit';
    if (isPartial) return 'Share more';
    if (debriefComplete) return 'Share debrief';
    return 'Share insights';
  };

  // Render the "not shared" body content
  const renderNotSharedContent = () => {
    // Has a teaser from analysis — show it to encourage sharing
    if (hasTeaser) {
      return (
        <>
          <Lightbulb size={16} color={COLORS.orange} />
          <Text style={styles.teaserLabel}>Ready to share</Text>
          <Text style={styles.teaserText} numberOfLines={2}>
            {teaserText}
          </Text>
        </>
      );
    }

    // Debrief complete but no analysis yet — nudge to share debrief
    if (debriefComplete) {
      return (
        <>
          <MessageSquare size={20} color={COLORS.blue} />
          <Text style={styles.nudgeText}>Share your debrief</Text>
        </>
      );
    }

    // Default — generic share prompt with mini status
    return (
      <>
        <Share2 size={20} color={COLORS.blue} />
        <View style={styles.statusPills}>
          <View style={[styles.pill, hasPrepNotes && styles.pillDone]}>
            <FileText size={10} color={hasPrepNotes ? COLORS.green : COLORS.gray3} />
            <Text style={[styles.pillText, hasPrepNotes && styles.pillTextDone]}>Prep</Text>
          </View>
          <View style={[styles.pill, hasPostRaceNotes && styles.pillDone]}>
            <Lightbulb size={10} color={hasPostRaceNotes ? COLORS.green : COLORS.gray3} />
            <Text style={[styles.pillText, hasPostRaceNotes && styles.pillTextDone]}>Debrief</Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <AnimatedPressable
      style={[
        styles.tile,
        isComplete && styles.tileComplete,
        animatedStyle,
        Platform.OS !== 'web' && IOS_SHADOWS.card,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={
        isComplete
          ? 'Insights shared. View or edit'
          : isPartial
            ? 'Insights partially shared: 1 of 2'
            : 'Share your insights'
      }
    >
      {/* Completion badge */}
      {isComplete && (
        <View style={styles.completeBadge}>
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
        </View>
      )}

      {/* Header row */}
      <View style={styles.header}>
        <Lightbulb size={12} color={COLORS.purple} />
        <Text style={styles.headerLabel}>INSIGHTS</Text>
      </View>

      {/* Central content area */}
      <View style={styles.body}>
        {isComplete ? (
          <>
            <View style={styles.completeIcon}>
              <Check size={24} color={COLORS.green} />
            </View>
            <Text style={styles.completeText}>Shared</Text>
          </>
        ) : isPartial ? (
          <>
            <Check size={16} color={COLORS.green} />
            <Text style={styles.partialLabel}>
              {hasPrepNotes ? 'Prep shared' : 'Debrief shared'}
            </Text>
            <Text style={styles.partialNudge}>
              {hasPrepNotes ? '+ Share debrief' : '+ Share prep'}
            </Text>
          </>
        ) : (
          renderNotSharedContent()
        )}
      </View>

      {/* Footer */}
      <Text style={styles.hint} numberOfLines={1}>
        {getHint()}
      </Text>
    </AnimatedPressable>
  );
}

const TILE_SIZE = 155;

const styles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray5,
    padding: 12,
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
      },
      default: {},
    }),
  },
  tileComplete: {
    borderColor: `${COLORS.green}60`,
    backgroundColor: `${COLORS.green}06`,
  },
  completeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  // Complete state
  completeIcon: {
    marginBottom: 2,
  },
  completeText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  // Partial state
  partialLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.green,
  },
  partialNudge: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.blue,
  },
  // Teaser state (has analysis insight to share)
  teaserLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.orange,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  teaserText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 14,
  },
  // Nudge state (debrief complete, ready to share)
  nudgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.blue,
    textAlign: 'center',
  },
  // Default state — mini status pills
  statusPills: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: COLORS.gray6,
  },
  pillDone: {
    backgroundColor: `${COLORS.green}12`,
  },
  pillText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.gray3,
  },
  pillTextDone: {
    color: COLORS.green,
  },
  // Footer
  hint: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.blue,
  },
});

export default ShareInsightsTile;
