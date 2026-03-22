import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BetterAtLogo } from '@/components/BetterAtLogo';
import { InterestDropdown } from './InterestDropdown';
import { SAMPLE_INTERESTS } from '@/lib/landing/sampleData';
import { useAuth } from '@/providers/AuthProvider';
import { getDashboardRoute } from '@/lib/utils/userTypeRouting';
import { usePathname } from 'expo-router';

interface SimpleLandingNavProps {
  currentInterestSlug?: string;
}

export function SimpleLandingNav({ currentInterestSlug }: SimpleLandingNavProps = {}) {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, userProfile, isGuest } = useAuth();
  const isLoggedIn = !!user && !isGuest;
  const pathname = usePathname();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDesktop = mounted && width > 768;


  const goToDashboard = () => {
    setMobileMenuOpen(false);
    const dest = getDashboardRoute(userProfile?.user_type ?? null);
    router.push(dest as any);
  };

  const initials = userProfile?.display_name
    ? userProfile.display_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <>
      <View
        style={[
          styles.nav,
          Platform.OS === 'web' && (styles.navWeb as any),
        ]}
      >
        <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
          {/* Logo */}
          <TouchableOpacity
            style={styles.logoRow}
            onPress={() => {
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            accessibilityLabel="BetterAt home"
          >
            <BetterAtLogo size={32} variant="white" />
            <Text style={styles.logoText}>BetterAt</Text>
          </TouchableOpacity>

          {/* Desktop links */}
          {isDesktop ? (
            <View style={styles.desktopLinks}>
              <InterestDropdown currentSlug={currentInterestSlug} />
              <TouchableOpacity
                onPress={() => router.push('/pricing')}
              >
                <Text style={styles.navLink}>Pricing</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              {isLoggedIn ? (
                <View style={styles.profileContainer}>
                  <TouchableOpacity
                    style={styles.avatarBtn}
                    onPress={() => setProfileMenuOpen(!profileMenuOpen)}
                    accessibilityLabel="Open profile menu"
                  >
                    <Text style={styles.avatarText}>{initials}</Text>
                  </TouchableOpacity>
                  {profileMenuOpen && (
                    <Pressable
                      style={styles.profileBackdrop}
                      onPress={() => setProfileMenuOpen(false)}
                    >
                      <Pressable
                        style={styles.profileDropdown}
                        onPress={(e) => e.stopPropagation?.()}
                      >
                        <TouchableOpacity
                          style={styles.profileMenuItem}
                          onPress={() => { setProfileMenuOpen(false); goToDashboard(); }}
                        >
                          <Ionicons name="grid-outline" size={16} color="#374151" />
                          <Text style={styles.profileMenuText}>Dashboard</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.profileMenuItem}
                          onPress={() => { setProfileMenuOpen(false); router.push('/(tabs)/reflect' as any); }}
                        >
                          <Ionicons name="person-outline" size={16} color="#374151" />
                          <Text style={styles.profileMenuText}>My Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.profileMenuItem}
                          onPress={() => { setProfileMenuOpen(false); router.push('/(tabs)/settings' as any); }}
                        >
                          <Ionicons name="settings-outline" size={16} color="#374151" />
                          <Text style={styles.profileMenuText}>Settings</Text>
                        </TouchableOpacity>
                      </Pressable>
                    </Pressable>
                  )}
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/(auth)/login', params: { returnTo: pathname } } as any)}
                  >
                    <Text style={styles.navLink}>Log In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.getStartedBtn}
                    onPress={() => router.push('/(auth)/signup')}
                  >
                    <Text style={styles.getStartedText}>Get Started Free</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            /* Mobile hamburger */
            <TouchableOpacity
              onPress={() => setMobileMenuOpen(true)}
              style={styles.hamburger}
              accessibilityLabel="Open navigation menu"
            >
              <Ionicons name="menu" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mobile menu modal */}
      {!isDesktop && (
        <Modal
          visible={mobileMenuOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setMobileMenuOpen(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setMobileMenuOpen(false)}
          >
            <Pressable style={styles.mobileMenu} onPress={() => {}}>
              {/* Close button */}
              <View style={styles.mobileMenuHeader}>
                <View style={styles.logoRow}>
                  <BetterAtLogo size={28} variant="white" />
                  <Text style={styles.logoText}>BetterAt</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setMobileMenuOpen(false)}
                  accessibilityLabel="Close menu"
                >
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Menu items */}
              <ScrollView style={styles.mobileMenuItems} showsVerticalScrollIndicator={false}>
                {SAMPLE_INTERESTS.map((interest) => (
                  <TouchableOpacity
                    key={interest.slug}
                    style={styles.mobileMenuItem}
                    onPress={() => {
                      setMobileMenuOpen(false);
                      router.push(`/${interest.slug}` as any);
                    }}
                  >
                    <Ionicons
                      name={(interest.icon + '-outline') as any}
                      size={22}
                      color={interest.color}
                    />
                    <Text style={styles.mobileMenuText}>{interest.name}</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={styles.mobileMenuItem}
                  onPress={() => {
                    setMobileMenuOpen(false);
                    router.push('/pricing');
                  }}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={22}
                    color="rgba(255, 255, 255, 0.7)"
                  />
                  <Text style={styles.mobileMenuText}>Pricing</Text>
                </TouchableOpacity>

                <View style={styles.mobileMenuDivider} />

                {isLoggedIn ? (
                  <>
                    <TouchableOpacity
                      style={styles.mobileMenuItem}
                      onPress={goToDashboard}
                    >
                      <Ionicons
                        name="grid-outline"
                        size={22}
                        color="rgba(255, 255, 255, 0.7)"
                      />
                      <Text style={styles.mobileMenuText}>Dashboard</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.mobileMenuItem}
                      onPress={() => {
                        setMobileMenuOpen(false);
                        router.push('/(tabs)/reflect' as any);
                      }}
                    >
                      <Ionicons
                        name="person-outline"
                        size={22}
                        color="rgba(255, 255, 255, 0.7)"
                      />
                      <Text style={styles.mobileMenuText}>My Profile</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.mobileMenuItem}
                      onPress={() => {
                        setMobileMenuOpen(false);
                        router.push({ pathname: '/(auth)/login', params: { returnTo: pathname } } as any);
                      }}
                    >
                      <Ionicons
                        name="log-in-outline"
                        size={22}
                        color="rgba(255, 255, 255, 0.7)"
                      />
                      <Text style={styles.mobileMenuText}>Log In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.mobileGetStarted}
                      onPress={() => {
                        setMobileMenuOpen(false);
                        router.push('/(auth)/signup');
                      }}
                    >
                      <Text style={styles.mobileGetStartedText}>
                        Get Started Free
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#1A1A1A',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  navWeb: {
    position: 'fixed',
    backdropFilter: 'blur(8px)',
  } as any,

  inner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  innerDesktop: {},

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  desktopLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  navLink: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'color 0.2s' },
    }),
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  getStartedBtn: {
    backgroundColor: '#3E92CC',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  getStartedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  profileContainer: {
    position: 'relative',
  },
  profileBackdrop: {
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
      } as any,
    }),
  },
  profileDropdown: {
    position: 'absolute',
    top: 44,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 6,
    minWidth: 180,
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      } as any,
    }),
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  profileMenuText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  hamburger: {
    padding: 4,
  },

  // Mobile menu
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mobileMenu: {
    backgroundColor: '#1A1A1A',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  mobileMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  mobileMenuItems: {
    flex: 1,
  },
  mobileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  mobileMenuText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mobileMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 8,
  },
  mobileGetStarted: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  mobileGetStartedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});
