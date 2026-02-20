/**
 * Landing Page Navigation Component
 * OnX Maps-style navigation for landing pages
 * 
 * Features:
 * - Product sections (For Sailors, For Coaches, For Clubs)
 * - Content sections (Racing Academy, Podcast)
 * - Utility links (Pricing, Sign In, Start Free Trial)
 * - Active state highlighting
 * - Mobile hamburger menu
 * - Sticky nav with transparent/solid states
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { RegattaFlowLogo } from '@/components/RegattaFlowLogo';
import { getDashboardRoute } from '@/lib/utils/userTypeRouting';

interface NavItem {
  label: string;
  route: string;
  icon?: string;
  comingSoon?: boolean;
}

interface LandingNavProps {
  /**
   * Whether nav should be transparent (over hero section)
   * Default: false
   */
  transparent?: boolean;
  /**
   * Whether nav should be sticky
   * Default: true
   */
  sticky?: boolean;
}

export function LandingNav({ transparent = false, sticky = true }: LandingNavProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [appTabsMenuOpen, setAppTabsMenuOpen] = useState(false);

  // Close app tabs dropdown when clicking outside (desktop only)
  useEffect(() => {
    if (!appTabsMenuOpen || !isDesktop) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside the dropdown container
      if (!target.closest('[data-app-tabs-dropdown]')) {
        setAppTabsMenuOpen(false);
      }
    };

    if (Platform.OS === 'web') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [appTabsMenuOpen, isDesktop]);

  // Product sections (user types)
  const productSections: NavItem[] = [
    { label: 'For Sailors', route: '/', icon: 'boat-outline' },
    { label: 'For Coaches', route: '/coaches', icon: 'people-outline', comingSoon: true },
    { label: 'For Clubs', route: '/clubs', icon: 'business-outline', comingSoon: true },
  ];

  // Content sections
  const contentSections: NavItem[] = [
    { label: 'Learn', route: '/learn', icon: 'school-outline' },
    { label: 'Podcast', route: '/podcasts', icon: 'mic-outline' },
  ];

  // Handle smooth scroll to Learn section on landing page
  const handleRacingAcademyClick = () => {
    if (pathname === '/' && Platform.OS === 'web') {
      // Smooth scroll to Learn section
      const element = document.getElementById('learn-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    // Otherwise navigate to learn page (use tabs route)
    handleNavClick('/(tabs)/learn');
  };

  // Get app tabs for authenticated users based on user type
  const getAppTabs = (): Array<{ label: string; route: string; icon: string }> => {
    if (!user || !userProfile) return [];
    
    const userType = userProfile.user_type;
    
    switch (userType) {
      case 'sailor':
        return [
          { label: 'Race', route: '/(tabs)/races', icon: 'flag-outline' },
          { label: 'Learn', route: '/(tabs)/learn', icon: 'school-outline' },
          { label: 'Courses', route: '/(tabs)/courses', icon: 'map-outline' },
          { label: 'Boats', route: '/(tabs)/boat/index', icon: 'boat-outline' },
          { label: 'Discuss', route: '/(tabs)/connect', icon: 'chatbubbles-outline' },
        ];
      case 'coach':
        return [
          { label: 'Clients', route: '/(tabs)/clients', icon: 'people-outline' },
          { label: 'Schedule', route: '/(tabs)/schedule', icon: 'calendar-outline' },
          { label: 'Earnings', route: '/(tabs)/earnings', icon: 'cash-outline' },
        ];
      case 'club':
        return [
          { label: 'Events', route: '/(tabs)/events', icon: 'calendar-outline' },
          { label: 'Members', route: '/(tabs)/members', icon: 'people-outline' },
          { label: 'Racing', route: '/(tabs)/race-management', icon: 'flag-outline' },
        ];
      default:
        return [
          { label: 'Race', route: '/(tabs)/races', icon: 'flag-outline' },
        ];
    }
  };

  // Check if current path matches a route
  const isActiveRoute = (route: string): boolean => {
    if (route === '/') {
      return pathname === '/' || pathname === '';
    }
    return pathname === route || pathname?.startsWith(route);
  };

  // Handle scroll detection for sticky nav background change
  useEffect(() => {
    if (!sticky || Platform.OS !== 'web') return;

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      setIsScrolled(scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sticky]);

  const handleNavClick = (route: string, comingSoon?: boolean) => {
    if (comingSoon) {
      // Could show a "coming soon" toast/modal
      return;
    }
    setMobileMenuOpen(false);
    // Type assertion for router.push - routes are validated at compile time
    router.push(route as any);
  };

  const renderNavLink = (item: NavItem, isMobile = false) => {
    const isActive = isActiveRoute(item.route);
    const isComingSoon = item.comingSoon;
  const isLearnLink = item.label === 'Learn';

    const handleClick = () => {
      if (isLearnLink) {
        handleRacingAcademyClick();
      } else {
        handleNavClick(item.route, isComingSoon);
      }
    };

    return (
      <TouchableOpacity
        key={item.route}
        style={[
          styles.navLink,
          isMobile && styles.navLinkMobile,
          isActive && styles.navLinkActive,
          isComingSoon && styles.navLinkComingSoon,
        ]}
        onPress={handleClick}
        disabled={isComingSoon}
      >
        {item.icon && (
          <Ionicons
            name={item.icon as any}
            size={isMobile ? 20 : 18}
            color={isActive ? '#3E92CC' : isComingSoon ? '#9CA3AF' : '#1F2937'}
            style={styles.navLinkIcon}
          />
        )}
        <Text
          style={[
            styles.navLinkText,
            isMobile && styles.navLinkTextMobile,
            isActive && styles.navLinkTextActive,
            isComingSoon && styles.navLinkTextComingSoon,
          ]}
        >
          {item.label}
        </Text>
        {isActive && !isMobile && (
          <View style={styles.activeIndicator} />
        )}
        {isComingSoon && (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDesktopNav = () => {
    // Always use solid background with blur for readability (OnX Maps style)
    // When transparent prop is true, use semi-transparent white with blur overlay
    const useBlurBackground = transparent && !isScrolled;
    const navBackground = useBlurBackground 
      ? 'rgba(255, 255, 255, 0.95)' 
      : '#FFFFFF';
    const showBorder = !useBlurBackground;

    return (
      <View
        style={[
          styles.navContainer,
          styles.navContainerDesktop,
          { backgroundColor: navBackground },
          useBlurBackground && styles.navBlurBackground,
          sticky && styles.navSticky,
        ]}
      >
        <View style={[styles.navContent, styles.navContentDesktop]}>
          {/* Logo */}
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={() => handleNavClick('/')}
          >
            <RegattaFlowLogo size={28} variant="filled" />
            <Text style={styles.logoText}>RegattaFlow</Text>
          </TouchableOpacity>

          {/* Visual Separator */}
          <View style={styles.navDivider} />

          {/* Product Sections */}
          <View style={styles.navSection}>
            {productSections.map((item) => renderNavLink(item))}
          </View>

          {/* Visual Separator */}
          <View style={styles.navDivider} />

          {/* Content Sections */}
          <View style={styles.navSection}>
            {contentSections.map((item) => renderNavLink(item))}
          </View>

          {/* Spacer */}
          <View style={styles.navSpacer} />

          {/* Utility Links */}
          <View style={styles.navUtility}>
            {!user ? (
              <>
                <TouchableOpacity
                  style={styles.utilityLink}
                  onPress={() => handleNavClick('/(auth)/login')}
                >
                  <Text style={styles.utilityLinkText}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => handleNavClick('/(auth)/signup')}
                >
                  <Text style={styles.ctaButtonText}>Start Free Trial</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.utilityLink}
                  onPress={() => {
                    const destination = getDashboardRoute(userProfile?.user_type ?? null);
                    router.push(destination as any);
                  }}
                >
                  <Text style={styles.utilityLinkText}>Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Border */}
        {showBorder && <View style={styles.navBorder} />}
      </View>
    );
  };

  const renderMobileNav = () => {
    // Always use solid background for mobile readability
    const useBlurBackground = transparent && !isScrolled;
    const navBackground = useBlurBackground 
      ? 'rgba(255, 255, 255, 0.95)' 
      : '#FFFFFF';

    return (
      <>
        <View
          style={[
            styles.navContainer,
            styles.navContainerMobile,
            { backgroundColor: navBackground },
            useBlurBackground && styles.navBlurBackground,
            sticky && styles.navSticky,
          ]}
        >
          <View style={styles.navContentMobile}>
            {/* Logo */}
            <TouchableOpacity
              style={styles.logoContainer}
              onPress={() => handleNavClick('/')}
            >
              <RegattaFlowLogo size={24} variant="filled" />
              <Text style={[styles.logoText, styles.logoTextMobile]}>RegattaFlow</Text>
            </TouchableOpacity>

            {/* Right side: Sign In + Hamburger */}
            <View style={styles.mobileNavRight}>
              {!user ? (
                <TouchableOpacity
                  style={styles.mobileSignInButton}
                  onPress={() => handleNavClick('/(auth)/login')}
                >
                  <Text style={styles.mobileSignInText}>Sign In</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.mobileUserButton}
                  onPress={() => handleNavClick('/(tabs)/races')}
                >
                  <Ionicons name="person-circle-outline" size={24} color="#3E92CC" />
                </TouchableOpacity>
              )}

              {/* Hamburger Menu Button */}
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setMobileMenuOpen(true)}
              >
                <Ionicons name="menu" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Border */}
          {!useBlurBackground && <View style={styles.navBorder} />}
        </View>

        {/* Mobile Menu Modal */}
        <Modal
          visible={mobileMenuOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setMobileMenuOpen(false)}
        >
          <View style={styles.mobileMenuContainer}>
            {/* Backdrop */}
            <Pressable
              style={styles.mobileMenuBackdrop}
              onPress={() => setMobileMenuOpen(false)}
            />

            {/* Menu Content */}
            <View style={styles.mobileMenuContent}>
              {/* Header */}
              <View style={styles.mobileMenuHeader}>
                <View style={styles.logoContainer}>
                  <RegattaFlowLogo size={28} variant="filled" />
                  <Text style={styles.logoText}>RegattaFlow</Text>
                </View>
                <TouchableOpacity
                  style={styles.menuCloseButton}
                  onPress={() => setMobileMenuOpen(false)}
                >
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.mobileMenuScroll}>
                {/* Product Sections */}
                <View style={styles.mobileMenuSection}>
                  <Text style={styles.mobileMenuSectionTitle}>For</Text>
                  {productSections.map((item) => renderNavLink(item, true))}
                </View>

                {/* Content Sections */}
                <View style={styles.mobileMenuSection}>
                  <Text style={styles.mobileMenuSectionTitle}>Resources</Text>
                  {contentSections.map((item) => renderNavLink(item, true))}
                </View>

                {/* Utility Links */}
                <View style={styles.mobileMenuSection}>
                  {!user ? (
                    <>
                      <TouchableOpacity
                        style={styles.mobileUtilityLink}
                        onPress={() => handleNavClick('/(auth)/login')}
                      >
                        <Ionicons name="log-in-outline" size={20} color="#374151" />
                        <Text style={styles.mobileUtilityLinkText}>Sign In</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.mobileCtaButton, styles.mobileCtaButtonPrimary]}
                        onPress={() => handleNavClick('/(auth)/signup')}
                      >
                        <Text style={styles.mobileCtaButtonText}>Start Free Trial</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.mobileUtilityLink}
                      onPress={() => {
                        setMobileMenuOpen(false);
                        const destination = getDashboardRoute(userProfile?.user_type ?? null);
                        router.push(destination as any);
                      }}
                    >
                      <Ionicons name="log-in-outline" size={20} color="#374151" />
                      <Text style={styles.mobileUtilityLinkText}>Sign In</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </>
    );
  };

  return isDesktop ? renderDesktopNav() : renderMobileNav();
}

const styles = StyleSheet.create({
  navContainer: {
    zIndex: 1000,
    ...Platform.select({
      web: {
        position: 'relative',
      },
    }),
  },
  navContainerDesktop: {
    paddingVertical: 0,
  },
  navBlurBackground: {
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      },
    }),
  },
  navContainerMobile: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  navSticky: {
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
      },
    }),
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  navContentDesktop: {
    gap: 24,
  },
  navContentMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 22,
    fontFamily: 'Manrope_600SemiBold',
    fontWeight: '600',
    color: '#3E92CC',
    letterSpacing: -0.5,
  },
  logoTextMobile: {
    fontSize: 18,
  },
  navSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  navSpacer: {
    flex: 1,
  },
  navUtility: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20, // More space between utility items
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
    position: 'relative',
    minHeight: 40,
  },
  navLinkMobile: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  navLinkActive: {
    // Active state handled by indicator and text color
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: '#3E92CC',
    borderRadius: 1,
  },
  navLinkComingSoon: {
    opacity: 0.6,
  },
  navLinkIcon: {
    marginRight: 0,
  },
  navLinkText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937', // Darker for better contrast
    letterSpacing: -0.2,
  },
  navLinkTextMobile: {
    fontSize: 16,
    flex: 1,
  },
  navLinkTextActive: {
    color: '#3E92CC',
    fontWeight: '700', // Bolder for active state
  },
  navLinkTextComingSoon: {
    color: '#9CA3AF',
  },
  comingSoonBadge: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 6,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
  utilityLink: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  utilityLinkText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937', // Darker for better contrast
    letterSpacing: -0.2,
  },
  utilityLinkTextActive: {
    color: '#3E92CC',
    fontWeight: '700',
  },
  ctaButton: {
    backgroundColor: '#3E92CC',
    paddingVertical: 11,
    paddingHorizontal: 24,
    borderRadius: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(62, 146, 204, 0.3)',
        transition: 'all 0.2s ease',
      },
      default: {
        elevation: 2,
        shadowColor: '#3E92CC',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
    }),
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '700', // Bolder for prominence
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  navBorder: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  menuButton: {
    padding: 4,
  },
  mobileNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mobileSignInButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mobileSignInText: {
    color: '#3E92CC',
    fontWeight: '600',
    fontSize: 14,
  },
  mobileUserButton: {
    padding: 4,
  },
  // Mobile Menu Styles
  mobileMenuContainer: {
    flex: 1,
  },
  mobileMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mobileMenuContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    ...Platform.select({
      web: {
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
      },
      default: {
        elevation: 10,
      },
    }),
  },
  mobileMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuCloseButton: {
    padding: 4,
  },
  mobileMenuScroll: {
    flex: 1,
  },
  mobileMenuSection: {
    paddingVertical: 8,
  },
  mobileMenuSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  mobileUtilityLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mobileUtilityLinkText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  mobileCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    margin: 16,
    borderRadius: 12,
    gap: 8,
  },
  mobileCtaButtonPrimary: {
    backgroundColor: '#3E92CC',
  },
  mobileCtaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Authenticated User Actions
  authenticatedUserActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // App Tabs Dropdown (Desktop)
  appTabsDropdownContainer: {
    position: 'relative',
  },
  appTabsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3E92CC',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  appTabsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appTabsDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    minWidth: 180,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      default: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 1001,
  },
  appTabsDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  appTabsDropdownItemPressed: {
    backgroundColor: '#F9FAFB',
  },
  appTabsDropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  // Mobile App Tabs Section
  mobileAppTabsSection: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
  },
  mobileAppTabsSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  mobileAppTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mobileAppTabItemPressed: {
    backgroundColor: '#F9FAFB',
  },
  mobileAppTabItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
});
