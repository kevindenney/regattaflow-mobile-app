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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TufteTokens } from '@/constants/designSystem';
import { Sparkline } from '@/components/shared/charts/Sparkline';
import { useUserActivityData } from '@/hooks/useUserActivityData';

interface NavigationHeaderProps {
  backgroundColor?: string;
  borderBottom?: boolean;
  hidden?: boolean;
}

export function NavigationHeader({
  backgroundColor = '#FFFFFF',
  borderBottom = true,
  hidden = false
}: NavigationHeaderProps) {
  // Allow pages to hide the global header and render their own
  if (hidden) return null;
  const { user, userProfile, signOut } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<TouchableOpacity>(null);

  // Activity data for profile sheet
  const activityData = useUserActivityData();

  // Determine which page we're on
  const isLoginPage = pathname === '/(auth)/login' || pathname === '/login';
  const isSignupPage = pathname === '/(auth)/signup' || pathname === '/signup';
  const isOnboardingPage = pathname === '/(auth)/onboarding' || pathname === '/onboarding';

  const handleDropdownToggle = () => {
    if (dropdownVisible) {
      setDropdownVisible(false);
    } else {
      // On web, use simpler positioning; on native, use measure()
      if (Platform.OS === 'web') {
        // Position dropdown in top-right area for web
        setDropdownPosition({
          x: windowWidth - 280 - 16, // Right-aligned with padding
          y: 50, // Below header
        });
        setDropdownVisible(true);
      } else {
        buttonRef.current?.measure((x, y, buttonWidth, height, pageX, pageY) => {
          const dropdownWidth = 280;
          const horizontalPadding = 16;
          const targetLeft = pageX + buttonWidth - dropdownWidth;
          const maxLeft = windowWidth - dropdownWidth - horizontalPadding;
          const adjustedLeft = Math.min(Math.max(targetLeft, horizontalPadding), Math.max(maxLeft, horizontalPadding));

          setDropdownPosition({
            x: adjustedLeft,
            y: pageY + height + 8,
          });
          setDropdownVisible(true);
        });
      }
    }
  };

  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);

    try {
      await signOut();
    } catch (e) {
      alert('Sign out failed. See console.');
    } finally {
      setSigningOut(false);
      setDropdownVisible(false);
    }
  };

  const handleNavigation = (route: string) => {
    setDropdownVisible(false);
    router.push(route);
  };

  // Get user initial for avatar
  const userInitial = (userProfile?.full_name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <>
      <View style={[
        styles.navigationHeader,
        {
          backgroundColor,
          paddingTop: Platform.OS !== 'web' ? insets.top + 8 : 12
        },
        borderBottom && styles.withBorder
      ]}>
        <View style={styles.navigationContent}>
          {/* Spacer to push avatar to the right */}
          <View style={styles.spacer} />

          {/* Navigation Actions */}
          <View style={styles.navigationActions}>
            {user && !isOnboardingPage ? (
              /* Minimal Avatar Button */
              <TouchableOpacity
                ref={buttonRef}
                style={styles.avatarButton}
                onPress={handleDropdownToggle}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Open profile menu"
              >
                <View style={styles.smallAvatar}>
                  <Text style={styles.avatarInitial}>{userInitial}</Text>
                </View>
              </TouchableOpacity>
            ) : !user ? (
              /* Unauthenticated User Buttons */
              <View style={styles.authButtons}>
                {!isLoginPage && (
                  <TouchableOpacity
                    style={styles.signInButton}
                    onPress={() => router.push('/(auth)/login')}
                  >
                    <Text style={styles.signInText}>Sign In</Text>
                  </TouchableOpacity>
                )}

                {!isSignupPage && (
                  <TouchableOpacity
                    style={styles.signUpButton}
                    onPress={() => router.push('/(auth)/signup')}
                  >
                    <Text style={styles.signUpText}>Sign Up</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Profile Sheet Modal */}
      {user && (
        <Modal
          visible={dropdownVisible}
          transparent={true}
          animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
          onRequestClose={() => setDropdownVisible(false)}
        >
          <View style={[
            styles.modalContainer,
            Platform.OS !== 'web' && styles.bottomSheetContainer
          ]}>
            {/* Backdrop */}
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setDropdownVisible(false)}
            />

            {/* Content */}
            <View
              style={[
                styles.dropdown,
                Platform.OS === 'web' ? {
                  position: 'absolute',
                  top: dropdownPosition.y,
                  left: dropdownPosition.x,
                  zIndex: 1000,
                } : styles.bottomSheet
              ]}
            >
              {/* Drag Handle for mobile */}
              {Platform.OS !== 'web' && (
                <View style={styles.bottomSheetHandle}>
                  <View style={styles.handleBar} />
                </View>
              )}

              {/* User Info Section - Tufte style */}
              <View style={styles.userSection}>
                <View style={styles.userInfoRow}>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {userProfile?.full_name || 'Sailor'}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>{userInitial}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.hairlineDivider} />

              {/* Your Week Section */}
              <View style={styles.dataSection}>
                <Text style={styles.sectionLabel}>YOUR WEEK</Text>
                <Text style={styles.dataRow}>
                  {activityData.loading ? '...' : (
                    `${activityData.upcomingRacesCount} races  ·  ${activityData.trainingSessionsThisWeek} training`
                  )}
                </Text>
              </View>

              {/* Activity Section with Sparkline */}
              <View style={styles.dataSection}>
                <View style={styles.activityHeader}>
                  <Text style={styles.sectionLabel}>ACTIVITY</Text>
                  {activityData.activityData.length >= 2 && (
                    <Sparkline
                      data={activityData.activityData}
                      width={100}
                      height={20}
                      color="#6B7280"
                      strokeWidth={1.5}
                      highlightMax={true}
                    />
                  )}
                </View>
                <Text style={styles.dataRow}>
                  {activityData.loading ? '...' : (
                    `${activityData.monthlyTotal} sessions this month${activityData.monthlyVsAvg !== 0 ? ` (${activityData.monthlyVsAvg > 0 ? '+' : ''}${activityData.monthlyVsAvg} vs avg)` : ''}`
                  )}
                </Text>
              </View>

              <View style={styles.hairlineDivider} />

              {/* Minimal Menu */}
              <View style={styles.menuSection}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/notifications')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuItemText}>Notifications</Text>
                  <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(tabs)/settings')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuItemText}>Settings</Text>
                  <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleSignOut}
                  activeOpacity={0.7}
                  disabled={signingOut}
                >
                  <Text style={styles.signOutText}>
                    {signingOut ? 'Signing out...' : 'Sign out'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Safe area padding for bottom sheet */}
              {Platform.OS !== 'web' && <View style={{ height: insets.bottom + 8 }} />}
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // Header
  navigationHeader: {
    paddingVertical: TufteTokens.spacing.standard,
    paddingHorizontal: TufteTokens.spacing.section,
    zIndex: 1000,
  },
  withBorder: {
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.color,
  },
  navigationContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  spacer: {
    flex: 1,
  },
  navigationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Avatar Button
  avatarButton: {
    padding: 4,
  },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  // Auth Buttons
  authButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signInButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  signInText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  signUpButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: TufteTokens.borderRadius.subtle,
    backgroundColor: '#3B82F6',
  },
  signUpText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  // Modal
  modalContainer: {
    flex: 1,
    position: 'relative',
  },
  bottomSheetContainer: {
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdown: {
    backgroundColor: TufteTokens.backgrounds.paper,
    borderRadius: TufteTokens.borderRadius.subtle,
    minWidth: 280,
    borderWidth: TufteTokens.borders.hairline,
    borderColor: TufteTokens.borders.color,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }
      : { elevation: 4 }
    ),
  },
  bottomSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    minWidth: '100%',
    paddingBottom: 12,
  },
  bottomSheetHandle: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },

  // User Section
  userSection: {
    padding: TufteTokens.spacing.section,
    paddingBottom: TufteTokens.spacing.standard,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userDetails: {
    flex: 1,
    marginRight: TufteTokens.spacing.standard,
  },
  userName: {
    ...TufteTokens.typography.primary,
    marginBottom: 2,
  },
  userEmail: {
    ...TufteTokens.typography.tertiary,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },

  // Data Sections
  dataSection: {
    paddingHorizontal: TufteTokens.spacing.section,
    paddingVertical: TufteTokens.spacing.compact,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: TufteTokens.spacing.tight,
  },
  dataRow: {
    ...TufteTokens.typography.secondary,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: TufteTokens.spacing.tight,
  },

  // Dividers
  hairlineDivider: {
    height: TufteTokens.borders.hairline,
    backgroundColor: TufteTokens.borders.colorSubtle,
    marginVertical: TufteTokens.spacing.compact,
    marginHorizontal: TufteTokens.spacing.section,
  },

  // Menu
  menuSection: {
    paddingHorizontal: TufteTokens.spacing.section,
    paddingVertical: TufteTokens.spacing.compact,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: TufteTokens.spacing.standard,
  },
  menuItemText: {
    ...TufteTokens.typography.secondary,
    fontWeight: '500',
  },
  signOutText: {
    ...TufteTokens.typography.secondary,
    fontWeight: '500',
    color: '#DC2626',
  },
});
