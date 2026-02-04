/**
 * MessagingSkeleton - Skeleton loading components for messaging UI
 *
 * Provides smooth, polished loading states for thread lists and chat messages
 * following iOS Human Interface Guidelines.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  IOSSkeleton,
  IOSSkeletonCircle,
} from '@/components/ui/ios/IOSSkeletonLoader';
import {
  IOS_COLORS,
  IOS_SPACING,
} from '@/lib/design-tokens-ios';

// =============================================================================
// THREAD LIST SKELETON
// =============================================================================

interface ThreadSkeletonRowProps {
  compact?: boolean;
}

/**
 * Single thread row skeleton - matches ThreadRow layout
 */
export function ThreadSkeletonRow({ compact = false }: ThreadSkeletonRowProps) {
  const avatarSize = compact ? 40 : 48;

  return (
    <View style={[styles.threadRow, compact && styles.threadRowCompact]}>
      {/* Avatar */}
      <IOSSkeletonCircle size={avatarSize} />

      {/* Content */}
      <View style={styles.threadContent}>
        {/* Header: Name + Time */}
        <View style={styles.threadHeader}>
          <IOSSkeleton width="55%" height={16} />
          <IOSSkeleton width={32} height={12} />
        </View>

        {/* Last message */}
        <IOSSkeleton width="75%" height={14} style={styles.lastMessageSkeleton} />

        {/* Member count (groups only, non-compact) */}
        {!compact && (
          <View style={styles.memberRow}>
            <IOSSkeleton width={12} height={12} borderRadius={6} />
            <IOSSkeleton width={60} height={12} />
          </View>
        )}
      </View>
    </View>
  );
}

interface ThreadListSkeletonProps {
  /** Number of skeleton rows to show */
  count?: number;
  /** Compact mode for preview */
  compact?: boolean;
}

/**
 * Full thread list skeleton - shows multiple thread rows
 */
export function ThreadListSkeleton({ count = 5, compact = false }: ThreadListSkeletonProps) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index}>
          <ThreadSkeletonRow compact={compact} />
          {index < count - 1 && <View style={styles.separator} />}
        </View>
      ))}
    </View>
  );
}

// =============================================================================
// CHAT MESSAGE SKELETON
// =============================================================================

interface MessageSkeletonBubbleProps {
  /** Whether this is the current user's message (right-aligned, blue) */
  isOwn?: boolean;
  /** Width percentage of the bubble (20-80) */
  widthPercent?: number;
}

/**
 * Single message bubble skeleton
 */
export function MessageSkeletonBubble({
  isOwn = false,
  widthPercent = 60,
}: MessageSkeletonBubbleProps) {
  return (
    <View
      style={[
        styles.messageBubbleContainer,
        isOwn ? styles.messageBubbleRight : styles.messageBubbleLeft,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
          { width: `${widthPercent}%` },
        ]}
      >
        <IOSSkeleton
          width="100%"
          height={16}
          style={styles.messageTextSkeleton}
        />
        {widthPercent > 50 && (
          <IOSSkeleton
            width="70%"
            height={16}
            style={styles.messageTextSkeleton}
          />
        )}
        <IOSSkeleton width={40} height={10} style={styles.timestampSkeleton} />
      </View>
    </View>
  );
}

interface ChatMessageSkeletonProps {
  /** Number of message groups to show */
  groups?: number;
}

/**
 * Full chat skeleton with date header and mixed messages
 */
export function ChatMessageSkeleton({ groups = 2 }: ChatMessageSkeletonProps) {
  // Generate a realistic-looking message pattern
  const messagePatterns = [
    { isOwn: false, width: 65 },
    { isOwn: false, width: 40 },
    { isOwn: true, width: 55 },
    { isOwn: false, width: 75 },
    { isOwn: true, width: 45 },
    { isOwn: true, width: 30 },
  ];

  return (
    <View style={styles.chatContainer}>
      {Array.from({ length: groups }).map((_, groupIndex) => (
        <View key={groupIndex} style={styles.messageGroup}>
          {/* Date header skeleton */}
          <View style={styles.dateHeaderContainer}>
            <IOSSkeleton
              width={80}
              height={14}
              borderRadius={7}
              style={styles.dateHeader}
            />
          </View>

          {/* Messages */}
          {messagePatterns.slice(0, 3 + groupIndex).map((msg, msgIndex) => (
            <MessageSkeletonBubble
              key={msgIndex}
              isOwn={msg.isOwn}
              widthPercent={msg.width}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// =============================================================================
// CONTACT PICKER SKELETON
// =============================================================================

/**
 * Contact row skeleton for search results
 */
export function ContactSkeletonRow() {
  return (
    <View style={styles.contactRow}>
      <IOSSkeletonCircle size={44} />
      <View style={styles.contactContent}>
        <IOSSkeleton width="50%" height={17} />
      </View>
    </View>
  );
}

interface ContactListSkeletonProps {
  count?: number;
}

/**
 * Contact list skeleton for picker
 */
export function ContactListSkeleton({ count = 4 }: ContactListSkeletonProps) {
  return (
    <View style={styles.contactListContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index}>
          <ContactSkeletonRow />
          {index < count - 1 && <View style={styles.contactSeparator} />}
        </View>
      ))}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Thread list
  listContainer: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    gap: IOS_SPACING.md,
  },
  threadRowCompact: {
    paddingVertical: IOS_SPACING.sm,
  },
  threadContent: {
    flex: 1,
    gap: 6,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessageSkeleton: {
    marginTop: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: 80,
  },

  // Chat messages
  chatContainer: {
    flex: 1,
    paddingHorizontal: IOS_SPACING.md,
    paddingBottom: IOS_SPACING.md,
  },
  messageGroup: {
    marginBottom: IOS_SPACING.lg,
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: IOS_SPACING.md,
  },
  dateHeader: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
  messageBubbleContainer: {
    marginVertical: 2,
  },
  messageBubbleLeft: {
    alignItems: 'flex-start',
  },
  messageBubbleRight: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
  },
  messageBubbleOwn: {
    backgroundColor: IOS_COLORS.systemBlue + '30', // Light blue tint
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: IOS_COLORS.systemGray5,
    borderBottomLeftRadius: 4,
  },
  messageTextSkeleton: {
    marginBottom: 4,
  },
  timestampSkeleton: {
    alignSelf: 'flex-end',
    marginTop: 2,
  },

  // Contact picker
  contactListContainer: {
    paddingVertical: IOS_SPACING.xs,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: IOS_SPACING.lg,
    gap: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: IOS_SPACING.lg + 44 + 12,
  },
});

export default ThreadListSkeleton;
