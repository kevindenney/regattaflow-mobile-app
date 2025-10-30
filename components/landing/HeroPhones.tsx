import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { getDashboardRoute, shouldCompleteOnboarding, getOnboardingRoute } from '@/lib/utils/userTypeRouting';
import { MiniSailorDashboard } from './MiniSailorDashboard';
import { MiniCoachDashboard } from './MiniCoachDashboard';
import { MiniClubDashboard } from './MiniClubDashboard';
import { PricingSection } from './PricingSection';
import { supabase } from '@/services/supabase';

export function HeroPhones() {
  const { user, userProfile } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  // DEV: Logout function for testing
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Force reload to clear all state
    if (Platform.OS === 'web') {
      window.location.href = '/';
    } else {
      router.replace('/');
    }
  };

  const handleGetStarted = () => {

    if (user && userProfile) {
      // Check if onboarding is needed
      if (shouldCompleteOnboarding(userProfile)) {
        const onboardingRoute = getOnboardingRoute(userProfile);
        router.push(onboardingRoute);
      } else {
        router.push(getDashboardRoute(userProfile.user_type));
      }
    } else {
      // For new users, default to sailor persona (can be changed later if we add tabs)
      router.push({
        pathname: '/(auth)/signup',
        params: { persona: 'sailor' }
      });
    }
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      {/* Hero Section with 3 Overlapping Phones */}
      <LinearGradient
        colors={['#0A2463', '#3E92CC', '#0A2463']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroSection}
      >
        {/* DEV: Logout button (only show if logged in) */}
        {user && (
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Logout (Dev)</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.heroContent, isDesktop && styles.heroContentDesktop]}>
          {/* Left Side - Text Content */}
          <View style={[styles.heroText, isDesktop && styles.heroTextDesktop]}>
            <View style={styles.badgeContainer}>
              <View style={styles.logoRow}>
                <Ionicons name="water-outline" size={24} color="#3E92CC" />
                <Text style={styles.logoText}>RegattaFlow</Text>
              </View>
              <Text style={styles.tagline}>The Complete Sailing Ecosystem</Text>
            </View>

            <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
              Race Smarter.{'\n'}Coach Better.{'\n'}Manage Easier.
            </Text>

            <Text style={[styles.heroSubtitle, isDesktop && styles.heroSubtitleDesktop]}>
              One platform that brings sailors, coaches, and yacht clubs together with AI-powered race strategy, performance analytics, and complete regatta management.
            </Text>

            <View style={[styles.ctaButtons, isDesktop && styles.ctaButtonsDesktop]}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
                <Text style={styles.primaryButtonText}>Get Started Free</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn}>
                <Text style={styles.secondaryButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* App Download Buttons */}
            <View style={[styles.downloadButtons, isDesktop && styles.downloadButtonsDesktop]}>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => {
                  // TODO: Replace with actual App Store URL
                  if (Platform.OS === 'web') {
                    window.open('https://apps.apple.com/app/regattaflow', '_blank');
                  }
                }}
              >
                <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
                <View style={styles.downloadButtonText}>
                  <Text style={styles.downloadButtonLabel}>Download on the</Text>
                  <Text style={styles.downloadButtonStore}>App Store</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => {
                  // TODO: Replace with actual Google Play URL
                  if (Platform.OS === 'web') {
                    window.open('https://play.google.com/store/apps/details?id=com.regattaflow', '_blank');
                  }
                }}
              >
                <Ionicons name="logo-google-playstore" size={18} color="#FFFFFF" />
                <View style={styles.downloadButtonText}>
                  <Text style={styles.downloadButtonLabel}>GET IT ON</Text>
                  <Text style={styles.downloadButtonStore}>Google Play</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => {
                  // Already on web - could scroll to features or show modal
                  if (Platform.OS === 'web') {
                    // User is already on the web app
                    alert('You\'re already using the web version!');
                  }
                }}
              >
                <Ionicons name="desktop-outline" size={18} color="#FFFFFF" />
                <View style={styles.downloadButtonText}>
                  <Text style={styles.downloadButtonLabel}>Use On</Text>
                  <Text style={styles.downloadButtonStore}>Web Browser</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={[styles.stats, isDesktop && styles.statsDesktop]}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>10K+</Text>
                <Text style={styles.statLabel}>Sailors</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNumber}>500+</Text>
                <Text style={styles.statLabel}>Clubs</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNumber}>50+</Text>
                <Text style={styles.statLabel}>Countries</Text>
              </View>
            </View>
          </View>

          {/* Right Side - 3 Overlapping Phones */}
          <View style={[styles.phonesContainer, isDesktop && styles.phonesContainerDesktop]}>
            {/* Left Phone - Sailor */}
            <View style={[styles.phone, styles.phoneLeft]}>
              <View style={styles.phoneFrame}>
                <View style={styles.phoneScreen}>
                  {/* Status Bar */}
                  <View style={[styles.statusBar, { backgroundColor: '#3E92CC' }]}>
                    <Text style={styles.statusText}>3:58</Text>
                    <View style={styles.statusIcons}>
                      <Ionicons name="cellular" size={12} color="#FFF" />
                      <Ionicons name="wifi" size={12} color="#FFF" style={{ marginLeft: 4 }} />
                      <Ionicons name="battery-full" size={12} color="#FFF" style={{ marginLeft: 4 }} />
                    </View>
                  </View>

                  {/* App Header */}
                  <View style={[styles.appHeader, { backgroundColor: '#3E92CC' }]}>
                    <Ionicons name="menu" size={24} color="#FFF" />
                    <Text style={styles.appTitle}>SAILOR</Text>
                    <Ionicons name="notifications-outline" size={24} color="#FFF" />
                  </View>

                  {/* Content - Mini Sailor Dashboard */}
                  <View style={styles.appContent}>
                    <MiniSailorDashboard />
                  </View>
                </View>
                <View style={styles.homeIndicator} />
              </View>
            </View>

            {/* Center Phone - Coach */}
            <View style={[styles.phone, styles.phoneCenter]}>
              <View style={styles.phoneFrame}>
                <View style={styles.phoneScreen}>
                  {/* Status Bar */}
                  <View style={[styles.statusBar, { backgroundColor: '#8B5CF6' }]}>
                    <Text style={styles.statusText}>3:58</Text>
                    <View style={styles.statusIcons}>
                      <Ionicons name="cellular" size={12} color="#FFF" />
                      <Ionicons name="wifi" size={12} color="#FFF" style={{ marginLeft: 4 }} />
                      <Ionicons name="battery-full" size={12} color="#FFF" style={{ marginLeft: 4 }} />
                    </View>
                  </View>

                  {/* App Header */}
                  <View style={[styles.appHeader, { backgroundColor: '#8B5CF6' }]}>
                    <Ionicons name="menu" size={24} color="#FFF" />
                    <Text style={styles.appTitle}>COACH</Text>
                    <Ionicons name="people-outline" size={24} color="#FFF" />
                  </View>

                  {/* Content - Mini Coach Dashboard */}
                  <View style={styles.appContent}>
                    <MiniCoachDashboard />
                  </View>
                </View>
                <View style={styles.homeIndicator} />
              </View>
            </View>

            {/* Right Phone - Club */}
            <View style={[styles.phone, styles.phoneRight]}>
              <View style={styles.phoneFrame}>
                <View style={styles.phoneScreen}>
                  {/* Status Bar */}
                  <View style={[styles.statusBar, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.statusText}>3:58</Text>
                    <View style={styles.statusIcons}>
                      <Ionicons name="cellular" size={12} color="#FFF" />
                      <Ionicons name="wifi" size={12} color="#FFF" style={{ marginLeft: 4 }} />
                      <Ionicons name="battery-full" size={12} color="#FFF" style={{ marginLeft: 4 }} />
                    </View>
                  </View>

                  {/* App Header */}
                  <View style={[styles.appHeader, { backgroundColor: '#10B981' }]}>
                    <Ionicons name="menu" size={24} color="#FFF" />
                    <Text style={styles.appTitle}>CLUB</Text>
                    <Ionicons name="settings-outline" size={24} color="#FFF" />
                  </View>

                  {/* Content - Mini Club Dashboard */}
                  <View style={styles.appContent}>
                    <MiniClubDashboard />
                  </View>
                </View>
                <View style={styles.homeIndicator} />
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Pricing Section */}
      <PricingSection />

      {/* Features Section with 3 Phones */}
      <View style={styles.featuresSection}>
        <Text style={[styles.featuresTitle, isDesktop && styles.featuresTitleDesktop]}>
          Built for every role in sailing
        </Text>
        <Text style={styles.featuresSubtitle}>
          Powerful features tailored to sailors, coaches, and yacht clubs
        </Text>

        <View style={[styles.featuresGrid, isDesktop && styles.featuresGridDesktop]}>
          {/* Sailor Features */}
          <View style={styles.featureColumn}>
            <View style={styles.featurePhoneContainer}>
              <View style={styles.featurePhone}>
                <View style={styles.phoneFrame}>
                  <View style={styles.phoneScreen}>
                    <View style={[styles.statusBar, { backgroundColor: '#3E92CC' }]}>
                      <Text style={styles.statusText}>3:58</Text>
                    </View>
                    <View style={[styles.appHeader, { backgroundColor: '#3E92CC' }]}>
                      <Text style={styles.appTitle}>SAILOR</Text>
                    </View>
                    <View style={styles.appContent}>
                      <MiniSailorDashboard />
                    </View>
                  </View>
                  <View style={styles.homeIndicator} />
                </View>
              </View>
            </View>

            <Text style={styles.featureRole}>For Sailors</Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#3E92CC" />
                <Text style={styles.featureText}>AI race strategy planning</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#3E92CC" />
                <Text style={styles.featureText}>Real-time weather intelligence</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#3E92CC" />
                <Text style={styles.featureText}>Performance analytics</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#3E92CC" />
                <Text style={styles.featureText}>Venue intelligence</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#3E92CC" />
                <Text style={styles.featureText}>Race timer & countdown</Text>
              </View>
            </View>
          </View>

          {/* Coach Features */}
          <View style={styles.featureColumn}>
            <View style={styles.featurePhoneContainer}>
              <View style={styles.featurePhone}>
                <View style={styles.phoneFrame}>
                  <View style={styles.phoneScreen}>
                    <View style={[styles.statusBar, { backgroundColor: '#8B5CF6' }]}>
                      <Text style={styles.statusText}>3:58</Text>
                    </View>
                    <View style={[styles.appHeader, { backgroundColor: '#8B5CF6' }]}>
                      <Text style={styles.appTitle}>COACH</Text>
                    </View>
                    <View style={styles.appContent}>
                      <MiniCoachDashboard />
                    </View>
                  </View>
                  <View style={styles.homeIndicator} />
                </View>
              </View>
            </View>

            <Text style={styles.featureRole}>For Coaches</Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                <Text style={styles.featureText}>Session management</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                <Text style={styles.featureText}>Video analysis tools</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                <Text style={styles.featureText}>Progress tracking</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                <Text style={styles.featureText}>Payment processing</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                <Text style={styles.featureText}>Marketplace listing</Text>
              </View>
            </View>
          </View>

          {/* Club Features */}
          <View style={styles.featureColumn}>
            <View style={styles.featurePhoneContainer}>
              <View style={styles.featurePhone}>
                <View style={styles.phoneFrame}>
                  <View style={styles.phoneScreen}>
                    <View style={[styles.statusBar, { backgroundColor: '#10B981' }]}>
                      <Text style={styles.statusText}>3:58</Text>
                    </View>
                    <View style={[styles.appHeader, { backgroundColor: '#10B981' }]}>
                      <Text style={styles.appTitle}>CLUB</Text>
                    </View>
                    <View style={styles.appContent}>
                      <MiniClubDashboard />
                    </View>
                  </View>
                  <View style={styles.homeIndicator} />
                </View>
              </View>
            </View>

            <Text style={styles.featureRole}>For Clubs</Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Regatta management</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Live race scoring</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Entry management</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Results publication</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Member management</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom CTA */}
        <View style={styles.bottomCta}>
          <TouchableOpacity style={styles.ctaPrimaryButton} onPress={handleGetStarted}>
            <Text style={styles.ctaPrimaryButtonText}>Start Your Free Trial</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // DEV: Logout button
  logoutButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Hero Section
  heroSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    ...Platform.select({
      web: {
        minHeight: 600,
      },
    }),
  },
  heroContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  heroContentDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroText: {
    alignItems: 'center',
    marginBottom: 48,
  },
  heroTextDesktop: {
    flex: 1,
    alignItems: 'flex-start',
    marginBottom: 0,
    paddingRight: 48,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E3F2FD',
    opacity: 0.9,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(62, 146, 204, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E3F2FD',
    marginLeft: 8,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 44,
  },
  heroTitleDesktop: {
    fontSize: 56,
    textAlign: 'left',
    lineHeight: 64,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#E3F2FD',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 28,
  },
  heroSubtitleDesktop: {
    fontSize: 20,
    textAlign: 'left',
  },
  ctaButtons: {
    gap: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 48,
  },
  ctaButtonsDesktop: {
    flexDirection: 'row',
    width: 'auto',
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
      default: {
        elevation: 4,
      },
    }),
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A2463',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  downloadButtons: {
    gap: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  downloadButtonsDesktop: {
    flexDirection: 'row',
    width: 'auto',
    gap: 12,
  },
  downloadButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 8,
    minWidth: 150,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  downloadButtonText: {
    flexDirection: 'column',
    gap: 1,
  },
  downloadButtonLabel: {
    fontSize: 8,
    fontWeight: '400',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  downloadButtonStore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  statsDesktop: {
    gap: 48,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#E3F2FD',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Phones Container
  phonesContainer: {
    position: 'relative',
    width: '100%',
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phonesContainerDesktop: {
    flex: 1,
    height: 500,
  },
  phone: {
    position: 'absolute',
  },
  phoneLeft: {
    left: 0,
    zIndex: 1,
    transform: [{ rotate: '-5deg' }],
  },
  phoneCenter: {
    zIndex: 3,
  },
  phoneRight: {
    right: 0,
    zIndex: 2,
    transform: [{ rotate: '5deg' }],
  },
  phoneFrame: {
    width: 180,
    height: 360,
    backgroundColor: '#1F2937',
    borderRadius: 32,
    padding: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      },
      default: {
        elevation: 8,
      },
    }),
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    overflow: 'hidden',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  appContent: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  mapArea: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    position: 'relative',
  },
  mapLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  marker: {
    position: 'absolute',
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  statsValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sessionName: {
    fontSize: 11,
    color: '#374151',
  },
  sessionTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  analyticsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  analyticsBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  analyticsProgress: {
    height: '100%',
    borderRadius: 4,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  eventName: {
    fontSize: 11,
    color: '#374151',
  },
  eventDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  membersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  membersTitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  membersCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  quickAction: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  homeIndicator: {
    width: 100,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 6,
  },

  // Features Section
  featuresSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  featuresTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  featuresTitleDesktop: {
    fontSize: 40,
  },
  featuresSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 64,
  },
  featuresGrid: {
    gap: 48,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  featuresGridDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 32,
  },
  featureColumn: {
    flex: 1,
    alignItems: 'center',
  },
  featurePhoneContainer: {
    marginBottom: 24,
  },
  featurePhone: {
    // Same as regular phone but no rotation
  },
  featureRole: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  featuresList: {
    gap: 16,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },

  // Bottom CTA
  bottomCta: {
    alignItems: 'center',
    marginTop: 64,
  },
  ctaPrimaryButton: {
    backgroundColor: '#0A2463',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(10, 36, 99, 0.3)',
      },
      default: {
        elevation: 4,
      },
    }),
  },
  ctaPrimaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
