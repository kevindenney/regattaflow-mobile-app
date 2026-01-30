/**
 * NotificationBellButton - Toolbar notification bell with badge
 *
 * Shows a bell icon with unread count badge, navigates to
 * notifications screen when pressed.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';

interface NotificationBellButtonProps {
  size?: number;
  color?: string;
}

export function NotificationBellButton({
  size = 24,
  color = IOS_COLORS.systemBlue,
}: NotificationBellButtonProps) {
  const router = useRouter();
  const { unreadCount, isLoading } = useUnreadNotificationCount();

  const handlePress = () => {
    router.push('/social-notifications');
  };

  // Format badge count (99+ for large numbers)
  const formatBadgeCount = (count: number): string => {
    if (count > 99) return '99+';
    return count.toString();
  };

  const showBadge = !isLoading && unreadCount > 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons
        name={showBadge ? 'notifications' : 'notifications-outline'}
        size={size}
        color={color}
      />
      {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {formatBadgeCount(unreadCount)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: IOS_COLORS.systemRed,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: IOS_COLORS.systemBackground,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default NotificationBellButton;
