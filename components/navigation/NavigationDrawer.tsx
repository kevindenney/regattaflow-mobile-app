/**
 * NavigationDrawer - Tufte-Style Navigation Panel
 *
 * Replaces bottom tab bar to reclaim vertical space for content.
 * Slides in from the left with persona-aware navigation items.
 */

import React from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { TUFTE_BACKGROUND, TUFTE_BACKGROUND_SECONDARY, TUFTE_TEXT } from '@/components/cards/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 320);

interface NavItem {
  key: string;
  label: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// Navigation items by persona
const SAILOR_NAV_ITEMS: NavItem[] = [
  { key: 'races', label: 'Races', route: '/(tabs)/races', icon: 'flag-outline' },
  { key: 'learn', label: 'Learn', route: '/(tabs)/learn', icon: 'school-outline' },
  { key: 'courses', label: 'Courses', route: '/(tabs)/courses', icon: 'map-outline' },
  { key: 'boat', label: 'Boat', route: '/(tabs)/boat/index', icon: 'boat-outline' },
  { key: 'venue', label: 'Venue', route: '/(tabs)/venue', icon: 'location-outline' },
];

const SAILOR_SECONDARY_ITEMS: NavItem[] = [
  { key: 'affiliations', label: 'Affiliations', route: '/(tabs)/affiliations', icon: 'people-circle-outline' },
  { key: 'crew', label: 'Crew', route: '/(tabs)/crew', icon: 'people-outline' },
  { key: 'coaches', label: 'Coaches', route: '/(tabs)/coaching', icon: 'school-outline' },
];

const COACH_NAV_ITEMS: NavItem[] = [
  { key: 'clients', label: 'Clients', route: '/(tabs)/clients', icon: 'people-outline' },
  { key: 'schedule', label: 'Schedule', route: '/(tabs)/schedule', icon: 'calendar-outline' },
  { key: 'earnings', label: 'Earnings', route: '/(tabs)/earnings', icon: 'cash-outline' },
];

const CLUB_NAV_ITEMS: NavItem[] = [
  { key: 'events', label: 'Events', route: '/(tabs)/events', icon: 'calendar-outline' },
  { key: 'members', label: 'Members', route: '/(tabs)/members', icon: 'people-outline' },
  { key: 'racing', label: 'Racing', route: '/(tabs)/race-management', icon: 'flag-outline' },
  { key: 'club', label: 'Club', route: '/(tabs)/profile', icon: 'business-outline' },
];

const COMMON_FOOTER_ITEMS: NavItem[] = [
  { key: 'account', label: 'Account', route: '/(tabs)/account', icon: 'person-outline' },
];

interface NavigationDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function NavigationDrawer({ visible, onClose }: NavigationDrawerProps) {
  const { userType, userProfile, user, signOut } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleNavigation = (route: string) => {
    onClose();
    // Small delay to let drawer close animation start
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  };

  const handleSignOut = async () => {
    onClose();
    try {
      await signOut();
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  // Get navigation items based on persona
  const getNavItems = (): { primary: NavItem[]; secondary: NavItem[] } => {
    switch (userType) {
      case 'coach':
        return { primary: COACH_NAV_ITEMS, secondary: [] };
      case 'club':
        return { primary: CLUB_NAV_ITEMS, secondary: [] };
      case 'sailor':
      default:
        return { primary: SAILOR_NAV_ITEMS, secondary: SAILOR_SECONDARY_ITEMS };
    }
  };

  const { primary, secondary } = getNavItems();

  // Check if route is active
  const isActive = (route: string) => {
    const normalizedRoute = route.replace('/(tabs)/', '/').replace('/index', '');
    return pathname === normalizedRoute || pathname.startsWith(normalizedRoute + '/');
  };

  // Get current section name for header
  const getCurrentSectionName = () => {
    const allItems = [...primary, ...secondary, ...COMMON_FOOTER_ITEMS];
    const activeItem = allItems.find(item => isActive(item.route));
    return activeItem?.label || 'RegattaFlow';
  };

  const userInitial = (userProfile?.full_name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          {/* User Section */}
          <View style={styles.userSection}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{userInitial}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {userProfile?.full_name || 'Sailor'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Primary Navigation */}
          <View style={styles.navSection}>
            {primary.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.navItem,
                  isActive(item.route) && styles.navItemActive,
                ]}
                onPress={() => handleNavigation(item.route)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={isActive(item.route) ? '#007AFF' : TUFTE_TEXT}
                />
                <Text
                  style={[
                    styles.navItemText,
                    isActive(item.route) && styles.navItemTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Secondary Navigation (Sailors only) */}
          {secondary.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>MORE</Text>
              <View style={styles.navSection}>
                {secondary.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.navItem,
                      isActive(item.route) && styles.navItemActive,
                    ]}
                    onPress={() => handleNavigation(item.route)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={isActive(item.route) ? '#007AFF' : TUFTE_TEXT}
                    />
                    <Text
                      style={[
                        styles.navItemText,
                        isActive(item.route) && styles.navItemTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Footer */}
          <View style={styles.divider} />
          <View style={styles.navSection}>
            {COMMON_FOOTER_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.navItem,
                  isActive(item.route) && styles.navItemActive,
                ]}
                onPress={() => handleNavigation(item.route)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={isActive(item.route) ? '#007AFF' : TUFTE_TEXT}
                />
                <Text
                  style={[
                    styles.navItemText,
                    isActive(item.route) && styles.navItemTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.navItem}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              <Text style={[styles.navItemText, styles.signOutText]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Helper to get current section name (exported for header use)
export function getCurrentSectionName(pathname: string, userType: string | null): string {
  const allItems = [
    ...SAILOR_NAV_ITEMS,
    ...SAILOR_SECONDARY_ITEMS,
    ...COACH_NAV_ITEMS,
    ...CLUB_NAV_ITEMS,
    ...COMMON_FOOTER_ITEMS,
  ];

  const normalizedPathname = pathname.replace('/(tabs)/', '/').replace('/index', '');

  for (const item of allItems) {
    const normalizedRoute = item.route.replace('/(tabs)/', '/').replace('/index', '');
    if (normalizedPathname === normalizedRoute || normalizedPathname.startsWith(normalizedRoute + '/')) {
      return item.label;
    }
  }

  return 'RegattaFlow';
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: TUFTE_BACKGROUND,
    ...Platform.select({
      web: {
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 16,
      },
    }),
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: TUFTE_BACKGROUND_SECONDARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: TUFTE_TEXT,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: TUFTE_TEXT,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  navSection: {
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
  },
  navItemActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  navItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: TUFTE_TEXT,
    marginLeft: 12,
  },
  navItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  signOutText: {
    color: '#DC2626',
  },
});

export default NavigationDrawer;
