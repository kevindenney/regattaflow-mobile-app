/**
 * WebSidebarNav - Overlay drawer navigation for web
 *
 * Slides in from the left as an overlay drawer (not persistent sidebar).
 * Contains:
 * - Close button
 * - User profile header (avatar, name)
 * - Primary nav items (persona-aware, from shared config)
 * - Secondary items (all "More" menu items flattened)
 * - Footer: Account, Sign Out
 *
 * Only rendered on web when USE_WEB_SIDEBAR_LAYOUT feature flag is enabled.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import {
  type NavItem,
  COMMON_FOOTER_ITEMS,
  getNavItemsForUserType,
  isRouteActive,
} from '@/lib/navigation-config';

export const WEB_SIDEBAR_WIDTH = 280;

interface WebSidebarNavProps {
  onClose?: () => void;
}

function WebSidebarNav({ onClose }: WebSidebarNavProps) {
  const { userType, userProfile, user, signOut, isGuest } = useAuth();
  const { isFree } = useFeatureGate();
  const pathname = usePathname();
  const router = useRouter();

  const { primary, secondary } = getNavItemsForUserType(userType ?? null);

  const userInitial = isGuest
    ? 'G'
    : (userProfile?.full_name || user?.email || 'U').charAt(0).toUpperCase();
  const displayName = isGuest ? 'Guest' : (userProfile?.full_name || 'Sailor');

  const handleNavigation = (route: string) => {
    router.push(route as Parameters<typeof router.push>[0]);
    onClose?.();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose?.();
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  const renderNavItem = (item: NavItem) => {
    const active = isRouteActive(item.route, pathname);
    return (
      <TouchableOpacity
        key={item.key}
        style={[styles.navItem, active && styles.navItemActive]}
        onPress={() => handleNavigation(item.route)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={item.icon}
          size={20}
          color={active ? IOS_COLORS.systemBlue : IOS_COLORS.label}
        />
        <Text style={[styles.navItemText, active && styles.navItemTextActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Collapse button row */}
      <View style={styles.collapseRow}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.collapseButton, pressed && { opacity: 0.6 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Collapse sidebar"
        >
          <Ionicons name="chevron-back" size={20} color={IOS_COLORS.secondaryLabel} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Header */}
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{userInitial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            {!isGuest && user?.email && (
              <Text style={styles.userEmail} numberOfLines={1}>
                {user.email}
              </Text>
            )}
            {isGuest && (
              <Text style={styles.userEmail} numberOfLines={1}>
                Exploring the app
              </Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Primary Navigation */}
        <View style={styles.navSection}>
          {primary.map(renderNavItem)}
        </View>

        {/* Secondary Navigation */}
        {secondary.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>MORE</Text>
            <View style={styles.navSection}>
              {secondary.map(renderNavItem)}
            </View>
          </>
        )}

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Footer */}
        <View style={styles.divider} />
        <View style={styles.navSection}>
          {!isGuest && COMMON_FOOTER_ITEMS.map(renderNavItem)}

          {(isGuest || isFree) && (
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNavigation('/pricing')}
              activeOpacity={0.7}
            >
              <Ionicons name="pricetags-outline" size={20} color={IOS_COLORS.label} />
              <Text style={styles.navItemText}>Plans</Text>
            </TouchableOpacity>
          )}

          {isGuest ? (
            <>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => handleNavigation('/(auth)/login')}
                activeOpacity={0.7}
              >
                <Ionicons name="log-in-outline" size={20} color={IOS_COLORS.systemBlue} />
                <Text style={[styles.navItemText, styles.signInText]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => handleNavigation('/(auth)/signup')}
                activeOpacity={0.7}
              >
                <Ionicons name="person-add-outline" size={20} color={IOS_COLORS.systemBlue} />
                <Text style={[styles.navItemText, styles.signInText]}>Sign Up</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {isFree && (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => handleNavigation('/pricing?upgrade=pro')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="rocket" size={18} color="#FFFFFF" />
                  <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.navItem}
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={20} color={IOS_COLORS.systemRed} />
                <Text style={[styles.navItemText, styles.signOutText]}>Sign Out</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default WebSidebarNav;

const styles = StyleSheet.create({
  container: {
    width: WEB_SIDEBAR_WIDTH,
    backgroundColor: IOS_COLORS.systemBackground,
    height: '100%',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: IOS_COLORS.separator,
  },
  collapseRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 12,
    paddingLeft: 12,
    paddingBottom: 4,
  },
  collapseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    minHeight: '100%',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: IOS_COLORS.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 1,
  },
  userEmail: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  navSection: {
    paddingHorizontal: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 1,
    minHeight: 44,
  },
  navItemActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  navItemText: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.label,
    marginLeft: 12,
  },
  navItemTextActive: {
    color: IOS_COLORS.systemBlue,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  signOutText: {
    color: IOS_COLORS.systemRed,
  },
  signInText: {
    color: IOS_COLORS.systemBlue,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#0284c7',
    marginBottom: 6,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
