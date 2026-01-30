/**
 * SailorRaceRow - Compact scannable list row for sailor+race
 *
 * Apple iOS HIG list row pattern:
 * [Avatar]  Name                        [>]
 *           Boat class · Race
 *           [Prep] [Tuning] [+2]
 *           In 3 days · Venue
 *
 * Avatar shows two-letter initials on a deterministic color circle (like Contacts.app).
 * Content tags show labeled pills instead of cryptic dots.
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight, X, Heart, MessageCircle, UserPlus, UserCheck } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { getInitials } from '@/components/account/accountStyles';

// =============================================================================
// TYPES
// =============================================================================

export interface SailorRaceRowData {
  id: string;
  name: string;
  startDate: string;
  venue?: string;
  userId: string;
  userName: string;
  avatarEmoji?: string;
  avatarColor?: string;
  boatClass?: string;
  hasPrepNotes: boolean;
  hasTuning: boolean;
  hasPostRaceNotes: boolean;
  hasLessons: boolean;
  isPast: boolean;
  daysUntil: number;
  isFollowing?: boolean;
  // Social interaction data
  isLiked?: boolean;
  likeCount?: number;
  commentCount?: number;
}

interface SailorRaceRowProps {
  data: SailorRaceRowData;
  onPress: (data: SailorRaceRowData) => void;
  onAvatarPress?: (userId: string) => void;
  onDismiss?: (data: SailorRaceRowData) => void;
  onLikePress?: (data: SailorRaceRowData) => void;
  onCommentPress?: (data: SailorRaceRowData) => void;
  onFollowToggle?: (userId: string) => void;
  isOwnUser?: boolean;
  showSeparator?: boolean;
  isLast?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** 12 iOS system colors for deterministic avatar backgrounds */
const AVATAR_COLORS = [
  IOS_COLORS.systemBlue,
  IOS_COLORS.systemGreen,
  IOS_COLORS.systemOrange,
  IOS_COLORS.systemRed,
  IOS_COLORS.systemPurple,
  IOS_COLORS.systemPink,
  IOS_COLORS.systemTeal,
  IOS_COLORS.systemIndigo,
  IOS_COLORS.systemMint,
  IOS_COLORS.systemCyan,
  IOS_COLORS.systemBrown,
  IOS_COLORS.systemYellow,
] as const;

/** Default sailboat emoji — only show emoji if user set a custom one */
const DEFAULT_EMOJI = '\u26F5';

/** Content tags with labels replacing cryptic dots */
const CONTENT_TAGS = [
  { key: 'hasPrepNotes', color: IOS_COLORS.systemBlue, label: 'Prep' },
  { key: 'hasTuning', color: IOS_COLORS.systemOrange, label: 'Tuning' },
  { key: 'hasPostRaceNotes', color: IOS_COLORS.systemGreen, label: 'Analysis' },
  { key: 'hasLessons', color: IOS_COLORS.systemYellow, label: 'Lessons' },
] as const;

const MAX_VISIBLE_TAGS = 2;

// =============================================================================
// HELPERS
// =============================================================================

function getAvatarColor(userId: string): string {
  return AVATAR_COLORS[userId.charCodeAt(0) % AVATAR_COLORS.length];
}

function formatRelativeDate(daysUntil: number, isPast: boolean): string {
  if (isPast) {
    const daysAgo = Math.abs(daysUntil);
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 14) return '1 week ago';
    return `${Math.floor(daysAgo / 7)} weeks ago`;
  }
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  if (daysUntil < 7) return `In ${daysUntil} days`;
  if (daysUntil < 14) return 'In 1 week';
  return `In ${Math.floor(daysUntil / 7)} weeks`;
}

// =============================================================================
// COMPONENT
// =============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SailorRaceRow({ data, onPress, onAvatarPress, onDismiss, onLikePress, onCommentPress, onFollowToggle, isOwnUser = false, showSeparator = true, isLast = false }: SailorRaceRowProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, IOS_ANIMATIONS.spring.snappy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
  }, [scale]);

  const handlePress = useCallback(() => {
    onPress(data);
  }, [onPress, data]);

  const handleDismiss = useCallback((e: any) => {
    e?.stopPropagation?.();
    onDismiss?.(data);
  }, [onDismiss, data]);

  const handleLikePress = useCallback((e: any) => {
    e?.stopPropagation?.();
    onLikePress?.(data);
  }, [onLikePress, data]);

  const handleCommentPress = useCallback((e: any) => {
    e?.stopPropagation?.();
    onCommentPress?.(data);
  }, [onCommentPress, data]);

  const handleFollowToggle = useCallback((e: any) => {
    e?.stopPropagation?.();
    onFollowToggle?.(data.userId);
  }, [onFollowToggle, data.userId]);

  const handleAvatarPress = useCallback((e: any) => {
    e?.stopPropagation?.();
    onAvatarPress?.(data.userId);
  }, [onAvatarPress, data.userId]);

  const relativeDate = formatRelativeDate(data.daysUntil, data.isPast);
  const activeTags = CONTENT_TAGS.filter(
    (tag) => data[tag.key as keyof SailorRaceRowData]
  );
  const visibleTags = activeTags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = activeTags.length - MAX_VISIBLE_TAGS;
  const tagNames = activeTags.map((t) => t.label).join(', ');

  const subtitle = [data.boatClass, data.name].filter(Boolean).join(' \u00B7 ');
  const footnote = [relativeDate, data.venue].filter(Boolean).join(' \u00B7 ');

  // Avatar: show custom emoji if set; otherwise show initials on colored circle
  const showEmoji = data.avatarEmoji && data.avatarEmoji !== DEFAULT_EMOJI;
  const avatarBg = showEmoji
    ? (data.avatarColor || IOS_COLORS.systemGray5)
    : getAvatarColor(data.userId);
  const initials = getInitials(data.userName);

  // Urgency coloring for the date/venue line
  const isUrgent = !data.isPast && data.daysUntil <= 3;
  const isToday = !data.isPast && data.daysUntil === 0;
  const footnoteColor = isToday
    ? IOS_COLORS.systemRed
    : isUrgent
      ? IOS_COLORS.systemOrange
      : IOS_COLORS.secondaryLabel;
  const footnoteWeight = isToday ? '600' as const : '400' as const;

  // Follow button config
  const showFollowButton = !isOwnUser && !!onFollowToggle;
  const FollowIcon = data.isFollowing ? UserCheck : UserPlus;
  const followColor = data.isFollowing
    ? IOS_COLORS.systemGreen
    : IOS_COLORS.systemBlue;
  const followLabel = data.isFollowing
    ? `Unfollow ${data.userName}`
    : `Follow ${data.userName}`;

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.container,
        isLast && styles.containerLast,
        animatedStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${data.userName}, ${subtitle}, ${footnote}${tagNames ? `, content: ${tagNames}` : ''}`}
    >
      {/* Avatar - tappable to view profile */}
      <Pressable
        onPress={onAvatarPress ? handleAvatarPress : undefined}
        disabled={!onAvatarPress}
        hitSlop={4}
        accessibilityRole={onAvatarPress ? 'button' : undefined}
        accessibilityLabel={onAvatarPress ? `View ${data.userName}'s profile` : undefined}
      >
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          {showEmoji ? (
            <Text style={styles.avatarEmoji} maxFontSizeMultiplier={1.5}>
              {data.avatarEmoji}
            </Text>
          ) : (
            <Text style={styles.avatarInitials} maxFontSizeMultiplier={1.5}>
              {initials}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Center content */}
      <View style={styles.content}>
        <Text style={styles.headline} numberOfLines={1} maxFontSizeMultiplier={1.5}>
          {data.userName}
        </Text>
        {subtitle ? (
          <Text style={styles.subhead} numberOfLines={1} maxFontSizeMultiplier={1.5}>
            {subtitle}
          </Text>
        ) : null}

        {/* Content tags row */}
        {activeTags.length > 0 && (
          <View style={styles.tagsRow}>
            {visibleTags.map((tag) => (
              <View
                key={tag.key}
                style={[styles.tag, { backgroundColor: `${tag.color}15` }]}
              >
                <Text
                  style={[styles.tagLabel, { color: tag.color }]}
                  maxFontSizeMultiplier={1.5}
                >
                  {tag.label}
                </Text>
              </View>
            ))}
            {overflowCount > 0 && (
              <Text style={styles.tagOverflow} maxFontSizeMultiplier={1.5}>
                +{overflowCount}
              </Text>
            )}
          </View>
        )}

        {/* Footer row: Date/Venue + Social interactions */}
        <View style={styles.footerRow}>
          <Text
            style={[
              styles.footnote,
              { color: footnoteColor, fontWeight: footnoteWeight },
            ]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.5}
          >
            {footnote}
          </Text>

          {/* Social interaction buttons */}
          {(onLikePress || onCommentPress) && (
            <View style={styles.socialRow}>
              {onLikePress && (
                <Pressable
                  onPress={handleLikePress}
                  hitSlop={6}
                  style={styles.socialButton}
                  accessibilityRole="button"
                  accessibilityLabel={data.isLiked ? 'Unlike' : 'Like'}
                >
                  <Heart
                    size={14}
                    color={data.isLiked ? IOS_COLORS.systemRed : IOS_COLORS.systemGray2}
                    fill={data.isLiked ? IOS_COLORS.systemRed : 'transparent'}
                  />
                  {(data.likeCount ?? 0) > 0 && (
                    <Text style={[styles.socialCount, data.isLiked && styles.socialCountLiked]}>
                      {data.likeCount}
                    </Text>
                  )}
                </Pressable>
              )}
              {onCommentPress && (
                <Pressable
                  onPress={handleCommentPress}
                  hitSlop={6}
                  style={styles.socialButton}
                  accessibilityRole="button"
                  accessibilityLabel="Comments"
                >
                  <MessageCircle size={14} color={IOS_COLORS.systemGray2} />
                  {(data.commentCount ?? 0) > 0 && (
                    <Text style={styles.socialCount}>{data.commentCount}</Text>
                  )}
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Follow button — visible when onFollowToggle is provided and not own user */}
      {showFollowButton && (
        <Pressable
          onPress={handleFollowToggle}
          hitSlop={8}
          style={styles.followButton}
          accessibilityRole="button"
          accessibilityLabel={followLabel}
        >
          <FollowIcon size={18} color={followColor} />
        </Pressable>
      )}

      {/* Dismiss button — visible when onDismiss is provided (Discover section) */}
      {onDismiss && (
        <Pressable
          onPress={handleDismiss}
          hitSlop={8}
          style={styles.dismissButton}
          accessibilityRole="button"
          accessibilityLabel={`Not interested in ${data.userName}'s race`}
        >
          <X size={14} color={IOS_COLORS.systemGray3} />
        </Pressable>
      )}

      {/* Trailing chevron */}
      <ChevronRight size={16} color={IOS_COLORS.systemGray3} />

      {/* Separator */}
      {showSeparator && <View style={styles.separator} />}
    </AnimatedPressable>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    marginHorizontal: 16,
    minHeight: 62,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  containerLast: {
    borderBottomLeftRadius: IOS_RADIUS.md,
    borderBottomRightRadius: IOS_RADIUS.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: IOS_SPACING.md,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  avatarInitials: {
    ...IOS_TYPOGRAPHY.caption1,
    fontWeight: '700',
    color: '#FFFFFF',
    fontSize: 14,
  },
  content: {
    flex: 1,
    marginRight: IOS_SPACING.sm,
  },
  headline: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  subhead: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagLabel: {
    ...IOS_TYPOGRAPHY.caption2,
    fontWeight: '600',
  },
  tagOverflow: {
    ...IOS_TYPOGRAPHY.caption2,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginLeft: 2,
  },
  followButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: IOS_SPACING.xs,
  },
  dismissButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  footnote: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    flex: 1,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: IOS_SPACING.sm,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    padding: 2,
  },
  socialCount: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.systemGray2,
    fontWeight: '500',
  },
  socialCountLiked: {
    color: IOS_COLORS.systemRed,
  },
  separator: {
    position: 'absolute',
    left: IOS_SPACING.lg + 40 + IOS_SPACING.md,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
  },
});
