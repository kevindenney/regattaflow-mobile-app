/**
 * NotificationBell - Header bell icon with unread badge
 */

import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

interface NotificationBellProps {
  size?: number;
  color?: string;
}

export function NotificationBell({
  size = 24,
  color = IOS_COLORS.label,
}: NotificationBellProps) {
  const router = useRouter();
  const { unreadCount } = useUnreadNotificationCount();

  const handlePress = () => {
    router.push('/social-notifications');
  };

  const formatBadge = (count: number): string => {
    if (count > 99) return '99+';
    return count.toString();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      onPress={handlePress}
    >
      <Bell size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{formatBadge(unreadCount)}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: IOS_SPACING.xs,
    position: 'relative',
  },
  containerPressed: {
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: IOS_COLORS.systemRed,
    borderRadius: IOS_RADIUS.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.white,
    fontWeight: '700',
    fontSize: 11,
  },
});
