// @ts-nocheck

import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';

interface NavigationHeaderProps {
  showLogo?: boolean;
  backgroundColor?: string;
  borderBottom?: boolean;
}

export function NavigationHeader({
  showLogo = true,
  backgroundColor = '#FFFFFF',
  borderBottom = true
}: NavigationHeaderProps) {
  const { user, userProfile, signOut, userType } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth > 768;
  const pathname = usePathname();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<TouchableOpacity>(null);
  const quickActionsRef = useRef<TouchableOpacity>(null);

  // Determine which page we're on
  const isLoginPage = pathname === '/(auth)/login' || pathname === '/login';
  const isSignupPage = pathname === '/(auth)/signup' || pathname === '/signup';
  const isOnboardingPage = pathname === '/(auth)/onboarding' || pathname === '/onboarding';
  const isRacesTab =
    pathname === '/(tabs)/races' ||
    pathname === '/races' ||
    pathname?.startsWith('/(tabs)/races/');

  const handleDropdownToggle = () => {
    if (dropdownVisible) {
      setDropdownVisible(false);
    } else {
      // Get button position for dropdown placement
      buttonRef.current?.measure((x, y, buttonWidth, height, pageX, pageY) => {
        const dropdownWidth = 240; // match dropdown min width for web alignment
        const horizontalPadding = 16;
        const targetLeft = pageX + buttonWidth - dropdownWidth;
        const maxLeft = windowWidth - dropdownWidth - horizontalPadding;
        const adjustedLeft = Math.min(Math.max(targetLeft, horizontalPadding), Math.max(maxLeft, horizontalPadding));

        setDropdownPosition({
          x: adjustedLeft,
          y: pageY + height + 5, // Position below button with small gap
        });
        setDropdownVisible(true);
      });
    }
  };

  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return

    setSigningOut(true)

    try {
      await signOut()
      // AuthProvider handles navigation; no extra fallback needed here
    } catch (e) {
      alert('Sign out failed. See console.')
    } finally {
      setSigningOut(false)
      setDropdownVisible(false)
    }
  }

  const handleNavigation = (route: string) => {
    setDropdownVisible(false);
    setQuickActionsVisible(false);
    router.push(route);
  };

  const handleQuickActionsToggle = () => {
    if (quickActionsVisible) {
      setQuickActionsVisible(false);
    } else {
      // Get button position for dropdown placement
      quickActionsRef.current?.measure((x, y, width, height, pageX, pageY) => {
        setDropdownPosition({
          x: pageX - 160, // Position dropdown to the left of button
          y: pageY + height + 5, // Position below button with small gap
        });
        setQuickActionsVisible(true);
      });
    }
  };

  const getQuickActions = () => {
    switch (userType) {
      case 'sailor':
        return [
          { key: 'create-strategy', label: 'Create Strategy', icon: 'bulb-outline', route: '/(tabs)/dashboard' },
          { key: 'upload-document', label: 'Upload Document', icon: 'document-outline', route: '/(tabs)/dashboard' },
          { key: 'view-races', label: 'Upcoming Races', icon: 'trophy-outline', route: '/(tabs)/dashboard' },
        ];
      case 'coach':
        return [
          { key: 'schedule-session', label: 'Schedule Session', icon: 'calendar-outline', route: '/(tabs)/dashboard' },
          { key: 'add-client', label: 'Add Client', icon: 'person-add-outline', route: '/(tabs)/dashboard' },
          { key: 'view-earnings', label: 'View Earnings', icon: 'card-outline', route: '/(tabs)/dashboard' },
        ];
      case 'club':
        return [
          { key: 'create-event', label: 'Create Event', icon: 'add-circle-outline', route: '/(tabs)/dashboard' },
          { key: 'manage-members', label: 'Manage Members', icon: 'people-outline', route: '/(tabs)/dashboard' },
          { key: 'facility-status', label: 'Facilities', icon: 'business-outline', route: '/(tabs)/dashboard' },
        ];
      default:
        return [];
    }
  };

  const quickActions = getQuickActions();

  return (
    <>
      <View style={[
        styles.navigationHeader,
        { backgroundColor },
        borderBottom && styles.withBorder
      ]}>
        <View
          style={[
            styles.navigationContent,
            showLogo && styles.navigationContentCentered
          ]}
        >
          {/* Logo */}
          {showLogo && (
            <TouchableOpacity
              style={styles.logoContainer}
              onPress={() => router.push('/')}
            >
              <Text style={styles.logoText}>RegattaFlow</Text>
            </TouchableOpacity>
          )}

          {/* Navigation Actions */}
          <View style={styles.navigationActions}>
            {user && !isOnboardingPage ? (
              /* Authenticated User Actions */
              <View style={styles.userActions}>
                {/* User Dropdown */}
                <TouchableOpacity
                  ref={buttonRef}
                  style={styles.userButton}
                  onPress={handleDropdownToggle}
                  activeOpacity={0.7}
                >
                  <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={20} color="#FFFFFF" />
                    </View>
                    {isDesktop && userProfile && (
                      <Text style={styles.userName} numberOfLines={1}>
                        {userProfile.full_name}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name={dropdownVisible ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            ) : !user ? (
              /* Unauthenticated User Buttons - Context Aware */
              <View style={styles.authButtons}>
                {!isLoginPage && (
                  <TouchableOpacity
                    style={styles.signInButton}
                    onPress={() => router.push('/(auth)/login')}
                  >
                    <Ionicons name="log-in-outline" size={20} color="#374151" />
                    <Text style={styles.signInText}>Sign In</Text>
                  </TouchableOpacity>
                )}

                {!isSignupPage && (
                  <TouchableOpacity
                    style={styles.signUpButton}
                    onPress={() => router.push('/(auth)/signup')}
                  >
                    <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.signUpText}>Sign Up</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null /* Hide all buttons during onboarding */}
          </View>
        </View>
      </View>

      {/* Dropdown Modal */}
      {user && (
        <Modal
          visible={dropdownVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <View style={styles.modalContainer}>
            {/* Backdrop - handles outside clicks */}
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setDropdownVisible(false)}
            />

            {/* Content - positioned dropdown menu */}
            <View
              style={[
                styles.dropdown,
                Platform.OS === 'web' ? {
                  position: 'absolute',
                  top: dropdownPosition.y,
                  left: dropdownPosition.x,
                  zIndex: 1000,
                } : {}
              ]}
            >
              {/* User Profile Section */}
              <View style={styles.dropdownHeader}>
                <View style={styles.dropdownAvatar}>
                  <Ionicons name="person" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.dropdownUserInfo}>
                  <Text style={styles.dropdownUserName} numberOfLines={1}>
                    {userProfile?.full_name || 'User'}
                  </Text>
                  <Text style={styles.dropdownUserEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              </View>

              <View style={styles.dropdownDivider} />

              {/* Menu Items */}
              <Pressable
                style={({ pressed }) => [
                  styles.dropdownItem,
                  pressed && styles.dropdownItemPressed
                ]}
                onPress={() => handleNavigation('/(tabs)/dashboard')}
              >
                <Ionicons name="apps" size={20} color="#374151" />
                <Text style={styles.dropdownItemText}>
                  {userType === 'sailor' && 'Sailor Dashboard'}
                  {userType === 'coach' && 'Coach Dashboard'}
                  {userType === 'club' && 'Club Dashboard'}
                  {!userType && 'Dashboard'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.dropdownItem,
                  pressed && styles.dropdownItemPressed
                ]}
                onPress={() => handleNavigation('/(tabs)/settings')}
              >
                <Ionicons name="settings-outline" size={20} color="#374151" />
                <Text style={styles.dropdownItemText}>Settings</Text>
              </Pressable>

              <View style={styles.dropdownDivider} />

              <Pressable
                onPress={async () => {
                  try {
                    await signOut()
                  } catch (error) {
                  }
                }}
                style={({ pressed }) => ({
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: pressed ? 'rgba(0,0,0,0.06)' : 'transparent'
                })}
                disabled={signingOut}
              >
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text style={[styles.dropdownItemText, styles.signOutText]}>
                  {signingOut ? 'Signing out...' : 'Sign Out'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Quick Actions Modal */}
      {user && (
        <Modal
          visible={quickActionsVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setQuickActionsVisible(false)}
        >
          <View style={styles.modalContainer}>
            {/* Backdrop */}
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setQuickActionsVisible(false)}
            />

            {/* Quick Actions Dropdown */}
            <View
              style={[
                styles.quickActionsDropdown,
                Platform.OS === 'web' ? {
                  position: 'absolute',
                  top: dropdownPosition.y,
                  left: dropdownPosition.x,
                  zIndex: 1000,
                } : {}
              ]}
            >
              <View style={styles.quickActionsHeader}>
                <Ionicons name="flash" size={20} color="#3B82F6" />
                <Text style={styles.quickActionsTitle}>
                  {userType === 'sailor' && 'Sailor Actions'}
                  {userType === 'coach' && 'Coach Actions'}
                  {userType === 'club' && 'Club Actions'}
                </Text>
              </View>

              <View style={styles.dropdownDivider} />

              {quickActions.map((action) => (
                <Pressable
                  key={action.key}
                  style={({ pressed }) => [
                    styles.dropdownItem,
                    pressed && styles.dropdownItemPressed
                  ]}
                  onPress={() => {
                    handleNavigation(action.route);
                  }}
                >
                  <Ionicons name={action.icon as any} size={18} color="#3B82F6" />
                  <Text style={[styles.dropdownItemText, styles.quickActionItemText]}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  navigationHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    zIndex: 1000,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }
      : {
          boxShadow: '0px 1px',
          elevation: 1,
        }
    ),
  },
  withBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navigationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  navigationContentCentered: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
  navigationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    flexShrink: 0,
    paddingRight: 12,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickActionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 6,
  },
  quickActionsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    maxWidth: 120,
  },
  authButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
    gap: 6,
  },
  signInText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    gap: 6,
  },
  signUpText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    position: 'relative',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 240,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }
      : {
          boxShadow: '0px 4px',
          elevation: 8,
        }
    ),
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  dropdownAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownUserInfo: {
    flex: 1,
  },
  dropdownUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  dropdownUserEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  dropdownItemPressed: {
    backgroundColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  signOutItem: {
    backgroundColor: '#FEF2F2',
  },
  signOutItemPressed: {
    backgroundColor: '#FEE2E2',
  },
  signOutText: {
    color: '#EF4444',
  },
  quickActionsDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }
      : {
          boxShadow: '0px 4px',
          elevation: 8,
        }
    ),
  },
  quickActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    gap: 8,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  quickActionItemText: {
    color: '#3B82F6',
  },
});
