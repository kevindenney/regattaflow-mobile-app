/**
 * ProfileDropdown
 *
 * Unified profile avatar + dropdown menu used in both the landing nav
 * and the tab screen toolbar. Shows profile/settings/sign-out for
 * authenticated users, and log-in/sign-up for guests.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { IOS_COLORS, IOS_ANIMATIONS } from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import { getDashboardRoute } from '@/lib/utils/userTypeRouting';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ProfileDropdownProps {
  /** Visual variant: 'light' for toolbar (blue avatar), 'dark' for landing nav (translucent white) */
  variant?: 'light' | 'dark';
  /** Avatar size in pixels (default: 30) */
  size?: number;
  /** Current interest slug for signup routing */
  currentInterestSlug?: string;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileDropdown({
  variant = 'light',
  size = 30,
  currentInterestSlug,
}: ProfileDropdownProps) {
  const { user, userProfile, isGuest, signOut } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const scale = useSharedValue(1);

  const isLoggedIn = !!user && !isGuest;

  const initials = isGuest
    ? '?'
    : getInitials(userProfile?.full_name || userProfile?.display_name || user?.email);

  const avatarUrl = userProfile?.avatar_url;
  const safeAvatarUrl = useMemo(() => {
    const raw = String(avatarUrl || '').trim();
    if (!raw) return null;
    if (Platform.OS === 'web' && /^(file:|content:|\/data\/|data\/user\/)/i.test(raw)) {
      return null;
    }
    return raw;
  }, [avatarUrl]);
  const showAvatarImage = Boolean(!isGuest && safeAvatarUrl && !imageFailed);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDark = variant === 'dark';
  const halfSize = size / 2;

  const avatarDynamic = {
    width: size,
    height: size,
    borderRadius: halfSize,
  };

  const handleClose = () => setOpen(false);

  const navigate = (path: string) => {
    setOpen(false);
    router.push(path as any);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <View style={s.container}>
      <AnimatedPressable
        style={[
          !isLoggedIn ? s.signUpBtn : s.avatar,
          !isLoggedIn ? (isDark ? s.signUpBtnDark : s.signUpBtnLight) : avatarDynamic,
          isLoggedIn && (isDark ? s.avatarDark : s.avatarLight),
          showAvatarImage && s.avatarWithImage,
          animStyle,
        ]}
        accessibilityLabel={!isLoggedIn ? 'Sign up' : 'Profile menu'}
        accessibilityRole="button"
        onPress={() => {
          triggerHaptic('selection');
          setOpen((v) => !v);
        }}
        onPressIn={() => {
          scale.value = withSpring(0.9, IOS_ANIMATIONS.spring.stiff);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
        }}
      >
        {!isLoggedIn ? (
          <Text style={[s.signUpText, isDark && s.signUpTextDark]}>Sign Up / Sign In</Text>
        ) : showAvatarImage ? (
          <Image
            source={{ uri: safeAvatarUrl! }}
            style={[avatarDynamic, { borderRadius: halfSize }]}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Text
            style={[
              s.avatarText,
              { fontSize: size * 0.43 },
              isDark && s.avatarTextDark,
            ]}
          >
            {initials}
          </Text>
        )}
      </AnimatedPressable>

      {open && (
        <Pressable style={s.backdrop} onPress={handleClose}>
          <Pressable
            style={[s.dropdown, { top: size + 8 }]}
            onPress={(e) => e.stopPropagation?.()}
          >
            {isLoggedIn ? (
              <>
                <DropdownItem
                  icon="home-outline"
                  label="Home"
                  onPress={() => navigate('/?view=landing')}
                />
                <DropdownItem
                  icon="grid-outline"
                  label="Dashboard"
                  onPress={() => {
                    setOpen(false);
                    const dest = getDashboardRoute(userProfile?.user_type ?? null);
                    router.push(dest as any);
                  }}
                />
                <DropdownItem
                  icon="person-outline"
                  label="My Profile"
                  onPress={() => navigate(`/person/${user!.id}`)}
                />
                <DropdownItem
                  icon="settings-outline"
                  label="Settings"
                  onPress={() => navigate('/account')}
                />
                <View style={s.divider} />
                <DropdownItem
                  icon="log-out-outline"
                  label="Sign Out"
                  onPress={handleSignOut}
                  destructive
                />
              </>
            ) : (
              <>
                <DropdownItem
                  icon="log-in-outline"
                  label="Log In"
                  onPress={() =>
                    navigate(
                      `/(auth)/login?returnTo=${encodeURIComponent(pathname)}`,
                    )
                  }
                />
                <DropdownItem
                  icon="person-add-outline"
                  label="Sign Up"
                  onPress={() =>
                    navigate(
                      currentInterestSlug
                        ? `/(auth)/signup?interest=${currentInterestSlug}`
                        : '/(auth)/signup',
                    )
                  }
                />
              </>
            )}
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Internal: dropdown menu item
// ---------------------------------------------------------------------------

function DropdownItem({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      style={({ hovered }: any) => [
        s.menuItem,
        hovered && s.menuItemHover,
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon as any}
        size={16}
        color={destructive ? '#EF4444' : '#374151'}
      />
      <Text style={[s.menuText, destructive && s.menuTextDestructive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: {
    position: 'relative',
  },

  // Sign Up button (guest state)
  signUpBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  signUpBtnDark: {
    backgroundColor: '#FFFFFF',
  },
  signUpBtnLight: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  signUpText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  signUpTextDark: {
    color: '#1A1A1A',
  },

  // Avatar variants
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLight: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  avatarDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarWithImage: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  avatarTextDark: {
    fontWeight: '700',
  },

  // Backdrop
  backdrop: {
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
      },
    }),
  },

  // Dropdown card
  dropdown: {
    position: 'absolute',
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 6,
    minWidth: 190,
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      } as any,
    }),
  },

  // Menu items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  menuItemHover: {
    backgroundColor: '#F3F4F6',
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  menuTextDestructive: {
    color: '#EF4444',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
    marginHorizontal: 12,
  },
});

export default ProfileDropdown;
