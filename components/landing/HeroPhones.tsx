// @ts-nocheck - This component uses web-specific styles that conflict with RN types
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { EmbeddedRacesDemo } from './EmbeddedRacesDemo';
import { Footer } from './Footer';
// Removed: MiniClubDashboard, MiniCoachDashboard, MiniSailorDashboard - no longer used
import { FeatureDescriptions, type FeatureId } from './FeatureDescriptions';
import { MissionSection } from './MissionSection';
import { PricingSection } from './PricingSection';
import { RacingAcademySection } from './RacingAcademySection';

// Web-only component to render title without React Native Web duplication
const WebHeroTitle = ({ text, style }: { text: string; style: any }) => {
  if (Platform.OS !== 'web') return null;
  
  React.useEffect(() => {
    // Ensure only one element exists - remove duplicates
    const elements = document.querySelectorAll('[data-hero-title-native]');
    if (elements.length > 1) {
      // Remove duplicates, keep only first
      for (let i = 1; i < elements.length; i++) {
        elements[i].remove();
      }
    }
  }, []);
  
  // Convert \n to actual line breaks - handle both literal \n and actual newlines
  const htmlText = text
    .replace(/\\n/g, '<br/>')  // Replace literal \n string
    .replace(/\n/g, '<br/>');  // Replace actual newline characters
  
  // @ts-ignore - web only, using native HTML div
  return (
    <div
      data-hero-title-native="true"
      style={{
        fontSize: '56px',
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 1.2,
        marginBottom: '20px',
        maxWidth: '900px',
        width: '100%',
        display: 'block',
        whiteSpace: 'pre-line',
        position: 'relative',
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: htmlText }}
    />
  );
};

export function HeroPhones() {
  const { user, userProfile } = useAuth();
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);
  const [highlightedFeature, setHighlightedFeature] = React.useState<FeatureId | null>(null);
  const [zoomedFeature, setZoomedFeature] = React.useState<FeatureId | null>(null);
  const [highlightedRaceId, setHighlightedRaceId] = React.useState<string | null>(null);

  // Ensure we only check dimensions after mount to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDesktop = mounted && width > 1024; // MacBook on desktop (>1024px)
  const isTablet = mounted && width > 768 && width <= 1024;
  const isMobile = mounted && width <= 768;
  const isSmallMobile = mounted && width <= 430; // iPhone Pro Max and smaller
  const isExtraSmallMobile = mounted && width <= 375; // iPhone SE and smaller
  const isSmallDesktop = mounted && width > 1200; // For three-column layout
  const shouldStackColumns = mounted && width <= 1200; // Stack below 1200px
  const showDevControls =
    (typeof __DEV__ !== 'undefined' && __DEV__) ||
    process.env.EXPO_PUBLIC_SHOW_DEV_CONTROLS === 'true';

  // Inject responsive CSS for three-column layout and hero section (web only)
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const styleId = 'hero-phones-responsive-layout';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = `
        /* Global responsive utilities */
        * {
          box-sizing: border-box;
        }
        
        body, html {
          width: 100%;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
        }
        
        /* Three-column layout responsive styles */
        @media (max-width: 1200px) {
          [data-demo-with-features] {
            flex-direction: column !important;
            padding: 30px 20px !important;
            gap: 20px !important;
          }
          [data-features-left] {
            flex: 1 1 100% !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            position: static !important;
            order: 2 !important;
            margin-top: 24px !important;
          }
          [data-demo-center] {
            flex: 1 1 100% !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            order: 1 !important;
            margin-bottom: 24px !important;
          }
          [data-features-right] {
            flex: 1 1 100% !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            position: static !important;
            order: 3 !important;
            margin-top: 24px !important;
          }
        }
        
        /* Mobile: Stack everything vertically, horizontal scroll for features */
        @media (max-width: 768px) {
          [data-demo-with-features] {
            flex-direction: column !important;
            padding: 20px 16px !important;
            gap: 16px !important;
          }
          [data-features-left],
          [data-features-right] {
            order: 2 !important;
            margin-top: 16px !important;
            margin-bottom: 0 !important;
          }
          [data-demo-center] {
            order: 1 !important;
            margin-bottom: 16px !important;
          }
        }
        
        /* Hero section responsive styles */
        @media (max-width: 768px) {
          [data-hero-section] {
            min-height: 400px !important;
            padding: 60px 20px !important;
          }
        }

        /* Small mobile (iPhone Pro Max and smaller) */
        @media (max-width: 430px) {
          [data-hero-section] {
            min-height: 350px !important;
            padding: 48px 16px !important;
          }
          [data-hero-title] {
            font-size: 32px !important;
            line-height: 1.3 !important;
          }
          [data-hero-subtitle] {
            font-size: 15px !important;
          }
          [data-demo-with-features] {
            padding: 16px !important;
            gap: 12px !important;
          }
          [data-demo-center] {
            padding: 0 8px !important;
          }
        }

        /* Extra small mobile (iPhone SE and smaller) */
        @media (max-width: 375px) {
          [data-hero-section] {
            min-height: 320px !important;
            padding: 40px 12px !important;
          }
          [data-hero-title] {
            font-size: 26px !important;
            line-height: 1.4 !important;
          }
          [data-hero-subtitle] {
            font-size: 14px !important;
          }
          [data-demo-with-features] {
            padding: 12px 8px !important;
          }
        }
        
        /* CRITICAL: Prevent text duplication - clean, simple styles only */
        [data-hero-title-wrapper] {
          position: relative !important;
          display: block !important;
          width: 100% !important;
          /* Prevent any duplication at wrapper level */
        }
        
        [data-hero-title] {
          position: relative !important;
          display: block !important;
          white-space: pre-line !important;
          /* Force single rendering - hide any duplicates */
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Remove any pseudo-elements that might duplicate content */
        [data-hero-title]::before,
        [data-hero-title]::after {
          content: none !important;
          display: none !important;
          visibility: hidden !important;
        }
        
        /* Nuclear option: Hide any duplicate elements */
        [data-hero-title] + [data-hero-title] {
          display: none !important;
        }
        
        /* Ensure only first instance is visible */
        [data-hero-title-wrapper] > [data-hero-title]:not(:first-child) {
          display: none !important;
        }
        
        /* Races Demo Scrollbar Styling */
        [data-races-demo-container] {
          scrollbar-width: thin;
          scrollbar-color: #2563eb #f1f1f1;
        }

        [data-races-demo-container]::-webkit-scrollbar {
          width: 8px;
        }

        [data-races-demo-container]::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        [data-races-demo-container]::-webkit-scrollbar-thumb {
          background: #2563eb;
          border-radius: 4px;
        }

        [data-races-demo-container]::-webkit-scrollbar-thumb:hover {
          background: #1d4ed8;
        }

        /* CRITICAL FIX: Native div wrappers for CSS containment */
        /* Keep overflow clipping at outer level but allow inner scrolling */
        .demo-center-wrapper {
          flex: 1 1 0;
          min-width: 0;
          max-width: 1400px;
          display: flex;
          flex-direction: column;
          position: relative;
          /* Lower z-index so sidebar columns paint on top of any visual overflow */
          z-index: 1;
          /* Constrain width but allow inner scroll */
          overflow: hidden;
        }

        .demo-center-stacked {
          flex: 1 1 100% !important;
          max-width: 100% !important;
          width: 100% !important;
          order: 1 !important;
          margin-bottom: 24px !important;
        }

        .demo-container-wrapper {
          width: 100%;
          position: relative;
          border-radius: 16px;
          border: 1px solid #E5E7EB;
          background-color: #FFFFFF;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
          /* overflow:hidden clips content but layout is constrained by parent */
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        .demo-scroll-container {
          width: 100%;
          max-width: 100%;
          max-height: 650px;
          overflow-y: auto;
          overflow-x: hidden; /* Container clips, but inner ScrollView handles horizontal */
          scroll-behavior: smooth;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          box-sizing: border-box;
          min-width: 0;
          scrollbar-width: thin;
          scrollbar-color: #2563eb #f1f1f1;
        }

        /* Allow race cards horizontal ScrollView to scroll within clipped container */
        .demo-scroll-container [class*="r-overflowX-auto"],
        .demo-scroll-container [class*="r-WebkitOverflowScrolling"] {
          overflow-x: auto !important;
          max-width: 100% !important;
        }

        .demo-scroll-container::-webkit-scrollbar {
          width: 8px;
        }

        .demo-scroll-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .demo-scroll-container::-webkit-scrollbar-thumb {
          background: #2563eb;
          border-radius: 4px;
        }

        .demo-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #1d4ed8;
        }

      `;
      
      return () => {
        const existing = document.getElementById(styleId);
        if (existing && existing.parentNode) {
          existing.remove();
        }
      };
    }
  }, []);

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
    // Always route to signup - signed-in users are auto-redirected from landing page
    router.push({
      pathname: '/(auth)/signup',
      params: { persona: 'sailor' }
    });
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  const handleExploreVenues = () => {
    if (user && userProfile) {
      router.push('/(tabs)/venue');
    } else {
      router.push('/(tabs)/venue');
    }
  };

  const handleScrollToPricing = () => {
    if (Platform.OS === 'web') {
      // Scroll to pricing section
      const pricingSection = document.getElementById('pricing-section');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback: navigate to pricing page
        router.push('/pricing');
      }
    } else {
      // Native: navigate to pricing page
      router.push('/pricing');
    }
  };

  return (
    <View style={styles.rootContainer}>
      <View style={styles.pageWrapper}>
      {/* Hero Section with 3 Overlapping Phones */}
      <LinearGradient
        colors={['#0A2463', '#3E92CC', '#0A2463']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroSection}
        {...(Platform.OS === 'web' ? { 'data-hero-section': true } : {})}
      >
        {/* DEV: Logout button removed - not for public landing page */}

        {/* Hero Content - Centered */}
        <View style={styles.heroContent}>
          {/* Simplified Logo - Text Only */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>RegattaFlow</Text>
          </View>

          {/* MAIN TITLE - USE WEB COMPONENT TO PREVENT DUPLICATION */}
          <View 
            style={styles.heroTitleWrapper}
            {...(Platform.OS === 'web' ? { 'data-hero-title-wrapper': true } : {})}
          >
            {Platform.OS === 'web' ? (
              <WebHeroTitle 
                text="Race Smarter with\nAI-Powered Strategy"
                style={{}}
              />
            ) : (
              <Text 
                key="hero-title-single" 
                style={styles.heroTitle}
              >
                Race Smarter with{'\n'}AI-Powered Strategy
              </Text>
            )}
          </View>

          <Text 
            style={styles.heroSubtitle}
            {...(Platform.OS === 'web' ? { 'data-hero-subtitle': true } : {})}
          >
            147+ global sailing venues • Unlimited race planning • Community-powered intelligence
          </Text>

          <View style={styles.ctaButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
              <Text style={styles.primaryButtonText}>Start Free Trial</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleExploreVenues}>
              <Text style={styles.secondaryButtonText}>Explore Venues</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In link for existing users */}
          {!user && (
            <View style={styles.signInLink}>
              <Text style={styles.signInLinkText}>
                Already have an account?{' '}
                <Text style={styles.signInLinkButton} onPress={handleSignIn}>
                  Sign In
                </Text>
              </Text>
            </View>
          )}

          {/* Also available for coaches and clubs */}
          <View style={styles.otherUserTypes}>
            <Text style={styles.otherUserTypesText}>
              Also available for{' '}
              <Text
                style={styles.otherUserTypesLink}
                onPress={() => router.push('/coaches')}
              >
                coaches
              </Text>
              {' '}and{' '}
              <Text
                style={styles.otherUserTypesLink}
                onPress={() => router.push('/clubs')}
              >
                clubs
              </Text>
            </Text>
          </View>

          {/* App Download Buttons */}
          <View style={styles.downloadButtons}>
            <View style={[styles.downloadButton, styles.downloadButtonDisabled]}>
              <Ionicons name="logo-apple" size={18} color="rgba(255,255,255,0.6)" />
              <View style={styles.downloadButtonText}>
                <Text style={[styles.downloadButtonLabel, styles.downloadButtonLabelDisabled]}>COMING SOON</Text>
                <Text style={[styles.downloadButtonStore, styles.downloadButtonStoreDisabled]}>App Store</Text>
              </View>
            </View>

            <View style={[styles.downloadButton, styles.downloadButtonDisabled]}>
              <Ionicons name="logo-google-playstore" size={18} color="rgba(255,255,255,0.6)" />
              <View style={styles.downloadButtonText}>
                <Text style={[styles.downloadButtonLabel, styles.downloadButtonLabelDisabled]}>COMING SOON</Text>
                <Text style={[styles.downloadButtonStore, styles.downloadButtonStoreDisabled]}>Google Play</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => {
                if (Platform.OS === 'web') {
                  alert('You\'re already using the web version!');
                }
              }}
            >
              <Ionicons name="desktop-outline" size={18} color="#FFFFFF" />
              <View style={styles.downloadButtonText}>
                <Text style={styles.downloadButtonLabel}>USE ON</Text>
                <Text style={styles.downloadButtonStore}>Web Browser</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* /races Demo with Features - Three Column Layout (Left | Center | Right) */}
      <View style={styles.demoSection} id="features-demo" {...(Platform.OS === 'web' ? { 'data-section': 'features-demo' } : {})}>
        <View 
          style={[
            styles.demoWithFeatures,
            shouldStackColumns && styles.demoWithFeaturesStacked,
          ]}
          {...(Platform.OS === 'web' ? { 'data-demo-with-features': true } : {})}
        >
          {/* LEFT COLUMN - Feature Cards */}
          <View 
            style={[
              styles.featuresLeft,
              shouldStackColumns && styles.featuresLeftStacked,
            ]}
            {...(Platform.OS === 'web' ? { 'data-features-left': true } : {})}
          >
            <FeatureDescriptions
              column="left"
              highlightedFeature={highlightedFeature}
              onFeatureClick={(featureId, raceId, sectionId) => {
                setHighlightedFeature(featureId);
                if (raceId) {
                  setHighlightedRaceId(raceId);
                  // Auto-clear after 3 seconds
                  setTimeout(() => {
                    setHighlightedRaceId(null);
                  }, 3000);
                }
              }}
              zoomedFeature={zoomedFeature}
              onFeatureZoom={setZoomedFeature}
            />
          </View>

          {/* CENTER - /races Demo */}
          {Platform.OS === 'web' ? (
            // @ts-ignore - Web only: use native div for data attributes and CSS containment
            <div
              data-demo-center="true"
              className={`demo-center-wrapper ${shouldStackColumns ? 'demo-center-stacked' : ''}`}
            >
              {/* @ts-ignore */}
              <div
                data-races-demo-container="true"
                className="demo-container-wrapper"
              >
                {/* @ts-ignore */}
                <div className="demo-scroll-container">
                  <EmbeddedRacesDemo
                    mode={isSmallMobile ? 'mobile-native' : 'fullscreen'}
                    scrollable={true}
                    readOnly={true}
                    autoReset={false}
                    hideHeader={true}
                    highlightedFeature={highlightedFeature}
                    highlightedRaceId={highlightedRaceId}
                    showTabs={false}
                  />
                </div>
              </div>
            </div>
          ) : (
            <View
              style={[
                styles.demoCenter,
                shouldStackColumns && styles.demoCenterStacked,
              ]}
            >
              <View style={styles.demoContainerWrapper}>
                <View style={styles.demoContainer}>
                  <EmbeddedRacesDemo
                    mode={isSmallMobile ? 'mobile-native' : 'fullscreen'}
                    scrollable={true}
                    readOnly={true}
                    autoReset={false}
                    hideHeader={true}
                    highlightedFeature={highlightedFeature}
                    highlightedRaceId={highlightedRaceId}
                    showTabs={false}
                  />
                </View>
              </View>
            </View>
          )}

          {/* RIGHT COLUMN - Feature Cards */}
          <View 
            style={[
              styles.featuresRight,
              shouldStackColumns && styles.featuresRightStacked,
            ]}
            {...(Platform.OS === 'web' ? { 'data-features-right': true } : {})}
          >
            <FeatureDescriptions
              column="right"
              highlightedFeature={highlightedFeature}
              onFeatureClick={(featureId, raceId, sectionId) => {
                setHighlightedFeature(featureId);
                if (raceId) {
                  setHighlightedRaceId(raceId);
                  // Auto-clear after 3 seconds
                  setTimeout(() => {
                    setHighlightedRaceId(null);
                  }, 3000);
                }
              }}
              zoomedFeature={zoomedFeature}
              onFeatureZoom={setZoomedFeature}
            />
          </View>
        </View>
      </View>

      {/* Pricing Section */}
      <View id="pricing-section" {...(Platform.OS === 'web' ? { 'data-section': 'pricing-section' } : {})}>
        <PricingSection />
      </View>

      {/* Racing Academy Section */}
      <RacingAcademySection />

      {/* "Built for every role" section removed - sailor-first strategy */}

      {/* Mission Section */}
      <MissionSection />

      {/* Founder Section - Minimized for sailor-first strategy */}
      {/* <FounderSection /> */}

      {/* Footer */}
      <Footer />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    width: '100%',
    ...Platform.select({
      web: {
        minWidth: 320,
        maxWidth: '100vw',
        overflowX: 'hidden',
      },
    }),
  },
  pageWrapper: {
    width: '100%',
    ...Platform.select({
      web: {
        minWidth: 320,
        maxWidth: '100vw',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      },
    }),
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
    width: '100%',
    ...Platform.select({
      web: {
        minHeight: 500,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        position: 'relative',
        '@media (max-width: 768px)': {
          minHeight: 400,
          paddingVertical: 60,
          paddingHorizontal: 20,
        },
        '@media (max-width: 480px)': {
          minHeight: 350,
          paddingVertical: 40,
          paddingHorizontal: 16,
        },
      } as any,
    }),
  },
  heroContent: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
    ...Platform.select({
      web: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        position: 'relative', // Not absolute
      } as any,
    }),
  },
  heroText: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  heroTextDesktop: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 48,
  },
  // Simplified Logo Container
  logoContainer: {
    marginBottom: 32,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  heroTitleWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      web: {
        display: 'block',
        marginBottom: 20,
      } as any,
    }),
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 48,
    maxWidth: 900,
    // CRITICAL: Clean styles only - NO position, NO transform, NO animation, NO nested text
    ...Platform.select({
      web: {
        fontSize: 'clamp(32px, 5vw, 56px)',
        lineHeight: 1.2,
        display: 'block',
        width: '100%',
        // Force single rendering
        position: 'relative',
        zIndex: 1,
        '@media (max-width: 768px)': {
          fontSize: 42,
        },
        '@media (max-width: 480px)': {
          fontSize: 32,
        },
      } as any,
    }),
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#E3F2FD',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 28,
    ...Platform.select({
      web: {
        fontSize: 'clamp(14px, 2.5vw, 18px)',
        maxWidth: 700,
      } as any,
    }),
  },
  ctaButtons: {
    gap: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      web: {
        flexDirection: 'row',
        width: 'auto',
        '@media (max-width: 480px)': {
          flexDirection: 'column',
          width: '100%',
          maxWidth: 300,
        },
      },
    }),
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
    marginTop: 8,
    ...Platform.select({
      web: {
        flexDirection: 'row',
        width: 'auto',
        gap: 12,
        alignItems: 'flex-start',
      },
    }),
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
  downloadButtonDisabled: {
    opacity: 0.6,
    ...Platform.select({
      web: {
        cursor: 'default',
      } as any,
    }),
  },
  downloadButtonLabelDisabled: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  downloadButtonStoreDisabled: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherUserTypes: {
    marginTop: 32,
    marginBottom: 24,
    alignItems: 'center',
    ...Platform.select({
      web: {
        alignItems: 'flex-start',
      },
    }),
  },
  otherUserTypesText: {
    fontSize: 14,
    color: '#E3F2FD',
    opacity: 0.9,
  },
  otherUserTypesLink: {
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  signInLink: {
    marginTop: 12,
    alignItems: 'center',
  },
  signInLinkText: {
    fontSize: 14,
    color: '#E3F2FD',
    opacity: 0.9,
  },
  signInLinkButton: {
    color: '#FFFFFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  demoMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  demoMessageText: {
    fontSize: 14,
    color: '#E3F2FD',
    flex: 1,
    lineHeight: 20,
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

  // Full-Width Demo Section
  demoSection: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    paddingVertical: 60,
    paddingHorizontal: 0, // Remove horizontal padding
    ...Platform.select({
      web: {
        paddingVertical: 80,
        paddingHorizontal: '1%', // Minimal horizontal padding
      },
    }),
  },
  demoWithFeatures: {
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        display: 'flex',
        flexDirection: 'row',
        gap: 24,
        alignItems: 'flex-start',
        maxWidth: 1800,
        alignSelf: 'center',
        paddingVertical: 40,
        paddingHorizontal: 24,
        minWidth: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        '@media (max-width: 1200px)': {
          flexDirection: 'column',
          paddingVertical: 30,
          paddingHorizontal: 20,
          gap: 20,
        },
      } as any,
    }),
    gap: 16,
  },
  demoWithFeaturesStacked: {
    ...Platform.select({
      web: {
        flexDirection: 'column',
        paddingVertical: 30,
        paddingHorizontal: 20,
        gap: 20,
      },
    }),
  },
  featuresLeft: {
    ...Platform.select({
      web: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 280,
        maxWidth: 280,
        minWidth: 280,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'sticky',
        top: 80,
        alignSelf: 'flex-start',
        overflow: 'visible',
        height: 'auto',
      } as any,
      default: {
        width: '100%',
      },
    }),
  },
  featuresLeftStacked: {
    ...Platform.select({
      web: {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: '100%',
        maxWidth: '100%',
        minWidth: 0,
        width: '100%',
        position: 'static',
        maxHeight: 'none',
        overflowY: 'visible',
        order: 2, // Show after demo on mobile
        marginTop: 24,
        '@media (max-width: 1200px)': {
          order: 2,
        },
      } as any,
    }),
  },
  demoCenter: {
    ...Platform.select({
      web: {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
        minWidth: 0, // Important: allows flex child to shrink below content size
        maxWidth: 1400,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden', // Clip content that exceeds container bounds
      } as any,
      default: {
        width: '100%',
      },
    }),
  },
  demoCenterStacked: {
    ...Platform.select({
      web: {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: '100%',
        maxWidth: '100%',
        width: '100%',
        order: 1, // Show demo first on mobile
        marginBottom: 24,
        '@media (max-width: 1200px)': {
          order: 1,
        },
      },
    }),
  },
  featuresRight: {
    ...Platform.select({
      web: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 280,
        maxWidth: 280,
        minWidth: 280,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'sticky',
        top: 80,
        alignSelf: 'flex-start',
        overflow: 'visible',
        height: 'auto',
      } as any,
      default: {
        width: '100%',
      },
    }),
  },
  featuresRightStacked: {
    ...Platform.select({
      web: {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: '100%',
        maxWidth: '100%',
        minWidth: 0,
        width: '100%',
        position: 'static',
        maxHeight: 'none',
        overflowY: 'visible',
        order: 3, // Show last on mobile
        marginTop: 24,
        '@media (max-width: 1200px)': {
          order: 3,
        },
      } as any,
    }),
  },
  demoContainerWrapper: {
    width: '100%',
    position: 'relative',
    ...Platform.select({
      web: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        // CRITICAL FIX: CSS containment forces all descendants (including GPU-accelerated
        // transformed elements from React Native Web's ScrollView) to paint within bounds
        contain: 'paint',
        // Create isolated stacking context
        isolation: 'isolate',
      },
      default: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
    }),
  },
  demoContainer: {
    width: '100%',
    maxHeight: 650,
    ...Platform.select({
      web: {
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollBehavior: 'smooth',
        scrollbarWidth: 'thin',
        scrollbarColor: '#2563eb #f1f1f1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        boxSizing: 'border-box',
        minWidth: 0,
        // CSS containment prevents transformed children from painting outside bounds
        contain: 'paint',
      },
      default: {
        // Native: use ScrollView wrapper if needed
      },
    }),
  },
  scrollFadeGradient: {
    ...Platform.select({
      web: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 8, // Leave space for scrollbar
        height: 40,
        pointerEvents: 'none',
        backgroundImage: 'linear-gradient(to top, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.7) 50%, transparent 100%)',
        zIndex: 1,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16, // Match container border radius
      } as any,
      default: {},
    }),
  },
  phoneFrame: {
    backgroundColor: '#1F2937',
    borderRadius: 40,
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
  phoneFrameMobile: {
    width: 296, // 280 + 16 padding
    height: 576, // 560 + 16 padding
  },
  phoneFrameTablet: {
    width: 336, // 320 + 16 padding
    height: 656, // 640 + 16 padding
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

