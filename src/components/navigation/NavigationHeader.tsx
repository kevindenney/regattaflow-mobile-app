import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/providers/AuthProvider';
import { signOutEverywhere } from '@/src/lib/auth-actions';

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
  const { user, userProfile } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const pathname = usePathname();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<TouchableOpacity>(null);

  // Determine which page we're on
  const isLoginPage = pathname === '/(auth)/login' || pathname === '/login';
  const isSignupPage = pathname === '/(auth)/signup' || pathname === '/signup';
  const isOnboardingPage = pathname === '/(auth)/onboarding' || pathname === '/onboarding';

  const handleDropdownToggle = () => {
    console.log('🔴 [NAV-HEADER] User clicked dropdown toggle, current state:', dropdownVisible);

    if (dropdownVisible) {
      console.log('🔴 [NAV-HEADER] Closing dropdown');
      setDropdownVisible(false);
    } else {
      console.log('🔴 [NAV-HEADER] Opening dropdown...');
      // Get button position for dropdown placement
      buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
        console.log('🔴 [NAV-HEADER] Button position:', { x, y, width, height, pageX, pageY });
        setDropdownPosition({
          x: pageX - 200 + width, // Position dropdown to the right edge of button
          y: pageY + height + 5, // Position below button with small gap
        });
        console.log('🔴 [NAV-HEADER] Setting dropdown visible to true');
        setDropdownVisible(true);
      });
    }
  };

  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;

    console.log('🛎️ [NAV] signOut pressed');
    setSigningOut(true);

    try {
      await signOutEverywhere();
      // AuthProvider will react to SIGNED_OUT; fallback safety:
      setTimeout(() => router.replace('/(auth)/login'), 1500);
    } catch (e) {
      console.error('💥 [NAV] signOut error', e);
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

  return (
    <>
      <View style={[
        styles.navigationHeader,
        { backgroundColor },
        borderBottom && styles.withBorder
      ]}>
        <View style={styles.navigationContent}>
          {/* Logo */}
          {showLogo && (
            <TouchableOpacity style={styles.logoContainer} onPress={() => router.push('/')}>
              <Ionicons name="boat" size={28} color="#3B82F6" />
              <Text style={styles.logoText}>RegattaFlow</Text>
            </TouchableOpacity>
          )}

          {/* Navigation Actions */}
          <View style={styles.navigationActions}>
            {user && !isOnboardingPage ? (
              /* Authenticated User Dropdown - Hide during onboarding */
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
                <Text style={styles.dropdownItemText}>Dashboard</Text>
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
                onPress={() => {
                  console.log('🛎️ [NAV] signOut pressed')
                  void signOutEverywhere()
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
    </>
  );
}

const styles = StyleSheet.create({
  navigationHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    zIndex: 1000,
  },
  withBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navigationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
    marginLeft: 8,
  },
  navigationActions: {
    alignItems: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
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
});