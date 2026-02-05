/**
 * CommunityCard
 *
 * Compact iOS-style list row for community directories.
 * Shows community name, type badge, member count, and Join/Joined pill.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  IOS_COLORS,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import type { Community, CommunityType } from '@/types/community';
import { COMMUNITY_TYPE_CONFIG } from '@/types/community';

interface CommunityCardProps {
  community: Community;
  onPress: () => void;
  onJoinToggle: () => void;
  isJoinPending?: boolean;
  showChevron?: boolean;
  compact?: boolean;
}

function formatMemberCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export function CommunityCard({
  community,
  onPress,
  onJoinToggle,
  isJoinPending = false,
  showChevron = true,
  compact = false,
}: CommunityCardProps) {
  const typeConfig = COMMUNITY_TYPE_CONFIG[community.community_type] || COMMUNITY_TYPE_CONFIG.general;
  const isJoined = community.is_member ?? false;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        compact && styles.cardCompact,
      ]}
    >
      <View style={styles.row}>
        {/* Community Icon */}
        <View style={[styles.iconContainer, { backgroundColor: typeConfig.bgColor }]}>
          {community.icon_url ? (
            <Image
              source={{ uri: community.icon_url }}
              style={styles.iconImage}
            />
          ) : (
            <Ionicons
              name={typeConfig.icon as any}
              size={compact ? 18 : 22}
              color={typeConfig.color}
            />
          )}
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
              {community.name}
            </Text>
            {community.is_official && (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={IOS_COLORS.systemBlue}
                style={styles.verifiedIcon}
              />
            )}
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.memberCount}>
              {formatMemberCount(community.member_count)} members
            </Text>
            <Text style={styles.separator}>·</Text>
            <Text style={[styles.typeBadge, { color: typeConfig.color }]}>
              {typeConfig.label}
            </Text>
          </View>

          {!compact && community.description && (
            <Text style={styles.description} numberOfLines={2}>
              {community.description}
            </Text>
          )}
        </View>

        {/* Join Button */}
        <Pressable
          onPress={() => {
            triggerHaptic('impactLight');
            onJoinToggle();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[
            styles.joinPill,
            isJoined && styles.joinedPill,
            isJoinPending && styles.joinPillPending,
          ]}
          disabled={isJoinPending}
        >
          <Text style={[styles.joinText, isJoined && styles.joinedText]}>
            {isJoinPending ? '...' : isJoined ? 'Joined' : 'Join'}
          </Text>
        </Pressable>

        {showChevron && (
          <Ionicons
            name="chevron-forward"
            size={14}
            color={IOS_COLORS.tertiaryLabel}
            style={styles.chevron}
          />
        )}
      </View>
    </Pressable>
  );
}

/**
 * CommunityCardCompact
 *
 * Even more compact version for horizontal lists and pickers.
 */
export function CommunityCardCompact({
  community,
  onPress,
  isSelected = false,
}: {
  community: Community;
  onPress: () => void;
  isSelected?: boolean;
}) {
  const typeConfig = COMMUNITY_TYPE_CONFIG[community.community_type] || COMMUNITY_TYPE_CONFIG.general;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        compactStyles.card,
        pressed && compactStyles.cardPressed,
        isSelected && compactStyles.cardSelected,
      ]}
    >
      <View style={[compactStyles.iconContainer, { backgroundColor: typeConfig.bgColor }]}>
        {community.icon_url ? (
          <Image source={{ uri: community.icon_url }} style={compactStyles.iconImage} />
        ) : (
          <Ionicons name={typeConfig.icon as any} size={18} color={typeConfig.color} />
        )}
      </View>
      <Text style={compactStyles.name} numberOfLines={1}>
        {community.name}
      </Text>
      {isSelected && (
        <Ionicons
          name="checkmark-circle-outline"
          size={18}
          color={IOS_COLORS.systemBlue}
          style={compactStyles.checkmark}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  cardPressed: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  cardCompact: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: IOS_SPACING.lg,
    paddingRight: IOS_SPACING.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: IOS_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: IOS_SPACING.md,
  },
  iconImage: {
    width: 44,
    height: 44,
    borderRadius: IOS_RADIUS.md,
  },
  textContainer: {
    flex: 1,
    marginRight: IOS_SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.label,
    letterSpacing: -0.24,
    flexShrink: 1,
  },
  nameCompact: {
    fontSize: 15,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  memberCount: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: -0.08,
  },
  separator: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
    marginHorizontal: 4,
  },
  typeBadge: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.08,
  },
  description: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: -0.08,
    marginTop: 4,
    lineHeight: 18,
  },
  joinPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: IOS_COLORS.systemBlue,
    marginRight: 6,
  },
  joinedPill: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
  },
  joinPillPending: {
    opacity: 0.5,
  },
  joinText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  joinedText: {
    color: IOS_COLORS.secondaryLabel,
  },
  chevron: {
    marginLeft: 2,
  },
});

const compactStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: IOS_SPACING.md,
    borderRadius: IOS_RADIUS.md,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginRight: 8,
    minWidth: 140,
    maxWidth: 200,
  },
  cardPressed: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  cardSelected: {
    backgroundColor: `${IOS_COLORS.systemBlue}15`,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemBlue,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: IOS_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconImage: {
    width: 32,
    height: 32,
    borderRadius: IOS_RADIUS.sm,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
    letterSpacing: -0.24,
  },
  checkmark: {
    marginLeft: 4,
  },
});

export default CommunityCard;
