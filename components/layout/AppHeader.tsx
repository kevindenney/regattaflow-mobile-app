// @ts-nocheck

/**
 * App Header - Universal Navigation Header
 * Provides authentication, dashboard access, settings, and user management
 * Adapts based on user type and authentication state
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { signOutEverywhere } from '@/lib/auth-actions';
import { getDashboardRoute } from '@/lib/utils/userTypeRouting';

interface AppHeaderProps {
  transparent?: boolean;
  showLogo?: boolean;
  title?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  transparent = false,
  showLogo = true,
  title,
}) => {
  const { width } = useWindowDimensions();
  const { user, userProfile, userType, loading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isDesktop = width > 768;
  const isLoggedIn = !!user;

  // Debug logging

  const handleDashboardAccess = () => {
    if (!isLoggedIn) {
      router.push('/(auth)/login');
      return;
    }

    // Use unified routing for all user types
    const dashboardRoute = getDashboardRoute(userType);

    router.push(dashboardRoute);
    setShowMobileMenu(false);
  };

  const handleSettingsAccess = () => {
    if (!isLoggedIn) {
      router.push('/(auth)/login');
      return;
    }

    router.push('/(tabs)/profile');
    setShowMobileMenu(false);
    setShowUserMenu(false);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOutEverywhere();
              setShowUserMenu(false);
              setShowMobileMenu(false);
              router.replace('/');
            } catch (error) {
              console.error('Sign out error:', error);
            }
          }
        }
      ]
    );
  };

  const renderUserTypeIcon = () => {
    switch (userType) {
      case 'sailor':
        return '⛵';
      case 'coach':
        return '👨‍🏫';
      case 'club':
        return '🏁';
      default:
        return '👤';
    }
  };

  const renderDesktopNavigation = () => (
    <View style={styles.desktopNav}>
      {/* Logo/Title */}
      <TouchableOpacity
        style={styles.logoContainer}
        onPress={() => router.push('/')}
      >
        {showLogo ? (
          <>
            <Text style={styles.logoIcon}>⚓</Text>
            <Text style={styles.logoText}>RegattaFlow</Text>
          </>
        ) : (
          <Text style={styles.titleText}>{title}</Text>
        )}
      </TouchableOpacity>

      {/* Navigation Links */}
      <View style={styles.navLinks}>
        {isLoggedIn ? (
          <>
            <TouchableOpacity
              style={styles.navButton}
              onPress={handleDashboardAccess}
            >
              <Ionicons name="home" size={20} color="#0066CC" />
              <Text style={styles.navButtonText}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push('/(tabs)/strategy')}
            >
              <Ionicons name="compass" size={20} color="#0066CC" />
              <Text style={styles.navButtonText}>Strategy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push('/(tabs)/regattas')}
            >
              <Ionicons name="trophy" size={20} color="#0066CC" />
              <Text style={styles.navButtonText}>Regattas</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.navButtonText}>Features</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.navButtonText}>Pricing</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* User Actions */}
      <View style={styles.userActions}>
        {isLoggedIn ? (
          <>
            <TouchableOpacity
              style={styles.userProfile}
              onPress={() => setShowUserMenu(!showUserMenu)}
            >
              <Text style={styles.userTypeIcon}>{renderUserTypeIcon()}</Text>
              <Text style={styles.userName}>
                {userProfile?.full_name?.split(' ')[0] || 'User'}
              </Text>
              <Ionicons
                name={showUserMenu ? "chevron-up" : "chevron-down"}
                size={16}
                color="#666"
              />
            </TouchableOpacity>

            {showUserMenu && (
              <View style={styles.userMenu}>
                <TouchableOpacity
                  style={styles.userMenuItem}
                  onPress={handleSettingsAccess}
                >
                  <Ionicons name="settings" size={18} color="#333" />
                  <Text style={styles.userMenuText}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.userMenuItem}
                  onPress={() => router.push('/(tabs)/profile')}
                >
                  <Ionicons name="person" size={18} color="#333" />
                  <Text style={styles.userMenuText}>Profile</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={[styles.userMenuItem, styles.signOutItem]}
                  onPress={handleSignOut}
                >
                  <Ionicons name="log-out" size={18} color="#FF4444" />
                  <Text style={[styles.userMenuText, styles.signOutText]}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signupButton}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={styles.signupButtonText}>Get Started</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  const renderMobileNavigation = () => (
    <View style={styles.mobileNav}>
      {/* Logo/Title */}
      <TouchableOpacity
        style={styles.mobileLogoContainer}
        onPress={() => router.push('/')}
      >
        {showLogo ? (
          <>
            <Text style={styles.mobileLogoIcon}>⚓</Text>
            <Text style={styles.mobileLogoText}>RegattaFlow</Text>
          </>
        ) : (
          <Text style={styles.mobileTitleText}>{title}</Text>
        )}
      </TouchableOpacity>

      {/* Mobile Menu Toggle */}
      <View style={styles.mobileActions}>
        {isLoggedIn && (
          <TouchableOpacity
            style={styles.dashboardButton}
            onPress={handleDashboardAccess}
          >
            <Ionicons name="home" size={24} color="#0066CC" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.menuToggle}
          onPress={() => setShowMobileMenu(!showMobileMenu)}
        >
          <Ionicons
            name={showMobileMenu ? "close" : "menu"}
            size={24}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      {/* Mobile Menu Modal */}
      <Modal
        visible={showMobileMenu}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMobileMenu(false)}
      >
        <View style={styles.mobileMenu}>
          <View style={styles.mobileMenuHeader}>
            <Text style={styles.mobileMenuTitle}>Menu</Text>
            <TouchableOpacity
              onPress={() => setShowMobileMenu(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.mobileMenuContent}>
            {isLoggedIn ? (
              <>
                {/* User Info */}
                <View style={styles.mobileUserInfo}>
                  <Text style={styles.mobileUserIcon}>{renderUserTypeIcon()}</Text>
                  <View>
                    <Text style={styles.mobileUserName}>
                      {userProfile?.full_name || 'User'}
                    </Text>
                    <Text style={styles.mobileUserType}>
                      {userType?.charAt(0).toUpperCase() + userType?.slice(1) || 'Sailor'}
                    </Text>
                  </View>
                </View>

                {/* Menu Items */}
                <TouchableOpacity
                  style={styles.mobileMenuItem}
                  onPress={handleDashboardAccess}
                >
                  <Ionicons name="home" size={24} color="#0066CC" />
                  <Text style={styles.mobileMenuItemText}>Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mobileMenuItem}
                  onPress={() => {
                    router.push('/(tabs)/strategy');
                    setShowMobileMenu(false);
                  }}
                >
                  <Ionicons name="compass" size={24} color="#0066CC" />
                  <Text style={styles.mobileMenuItemText}>Strategy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mobileMenuItem}
                  onPress={() => {
                    router.push('/(tabs)/regattas');
                    setShowMobileMenu(false);
                  }}
                >
                  <Ionicons name="trophy" size={24} color="#0066CC" />
                  <Text style={styles.mobileMenuItemText}>Regattas</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mobileMenuItem}
                  onPress={handleSettingsAccess}
                >
                  <Ionicons name="settings" size={24} color="#666" />
                  <Text style={styles.mobileMenuItemText}>Settings</Text>
                </TouchableOpacity>

                <View style={styles.mobileMenuDivider} />

                <TouchableOpacity
                  style={styles.mobileMenuItem}
                  onPress={handleSignOut}
                >
                  <Ionicons name="log-out" size={24} color="#FF4444" />
                  <Text style={[styles.mobileMenuItemText, styles.signOutText]}>Sign Out</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.mobileAuthButton}
                  onPress={() => {
                    router.push('/(auth)/login');
                    setShowMobileMenu(false);
                  }}
                >
                  <Text style={styles.mobileAuthButtonText}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mobileAuthButton, styles.mobileSignupButton]}
                  onPress={() => {
                    router.push('/(auth)/signup');
                    setShowMobileMenu(false);
                  }}
                >
                  <Text style={[styles.mobileAuthButtonText, styles.mobileSignupButtonText]}>
                    Get Started
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );

  return (
    <View style={[
      styles.container,
      transparent && styles.transparentContainer
    ]}>
      {isDesktop ? renderDesktopNavigation() : renderMobileNavigation()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      },
    }),
  },
  transparentContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: 'rgba(229, 229, 229, 0.8)',
  },

  // Desktop Navigation
  desktopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    fontSize: 24,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0066CC',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  userTypeIcon: {
    fontSize: 20,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    boxShadow: '0px 4px',
    elevation: 8,
    minWidth: 180,
    zIndex: 1000,
  },
  userMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  userMenuText: {
    fontSize: 16,
    color: '#333',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 4,
  },
  signOutItem: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  signOutText: {
    color: '#FF4444',
  },
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0066CC',
    backgroundColor: 'transparent',
    boxShadow: '0px 2px',
    elevation: 2,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066CC',
  },
  signupButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#0066CC',
    borderWidth: 2,
    borderColor: '#0066CC',
    boxShadow: '0px 4px',
    elevation: 8,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },

  // Mobile Navigation
  mobileNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mobileLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mobileLogoIcon: {
    fontSize: 20,
  },
  mobileLogoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0066CC',
  },
  mobileTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  mobileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dashboardButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F7FF',
  },
  menuToggle: {
    padding: 8,
  },

  // Mobile Menu
  mobileMenu: {
    flex: 1,
    backgroundColor: 'white',
  },
  mobileMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  mobileMenuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  mobileMenuContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
  },
  mobileUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 16,
  },
  mobileUserIcon: {
    fontSize: 32,
  },
  mobileUserName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  mobileUserType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  mobileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  mobileMenuItemText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  mobileMenuDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 16,
  },
  mobileAuthButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0066CC',
    alignItems: 'center',
    marginVertical: 8,
  },
  mobileAuthButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066CC',
  },
  mobileSignupButton: {
    backgroundColor: '#0066CC',
  },
  mobileSignupButtonText: {
    color: 'white',
  },
});

export default AppHeader;
