/**
 * For Organizations Landing Page
 * Professional B2B marketing page for yacht clubs and regatta organizers
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ForOrganizationsPage() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const handleScheduleDemo = () => {
    // Navigate to contact/demo page or open email
    if (Platform.OS === 'web') {
      window.location.href = 'mailto:demo@regattaflow.com?subject=Schedule Demo Request';
    } else {
      Linking.openURL('mailto:demo@regattaflow.com?subject=Schedule Demo Request');
    }
  };

  const handleViewPortfolio = () => {
    // Navigate to portfolio/case studies page
    router.push('/events');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>RF</Text>
            </View>
            <Text style={styles.brandName}>RegattaFlow</Text>
          </View>

          {/* Desktop Navigation */}
          {isDesktop && (
            <View style={styles.nav}>
              <TouchableOpacity style={styles.navItem}>
                <Text style={styles.navText}>Products</Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem}>
                <Text style={styles.navText}>Pricing</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem}>
                <Text style={styles.navText}>Resources</Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={() => router.push('/signup')}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Text style={styles.breadcrumbText}>Home</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={16} color="#999" />
        <Text style={[styles.breadcrumbText, styles.breadcrumbActive]}>
          For Organizations
        </Text>
      </View>

      {/* Badge */}
      <View style={styles.badgeContainer}>
        <View style={styles.badge}>
          <Ionicons name="business" size={14} color="#4169E1" />
          <Text style={styles.badgeText}>For Organizations</Text>
        </View>
      </View>

      {/* Hero Section */}
      <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
        <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
          Custom Mobile Apps for Your{' '}
          <Text style={styles.heroTitleAccent}>Sailing Events</Text>
        </Text>

        <Text style={[styles.heroSubtitle, isDesktop && styles.heroSubtitleDesktop]}>
          Full-service app development from design to app store. Give your sailors
          {'\n'}and spectators a professional mobile experience.
        </Text>

        {/* Feature Pills */}
        <View style={[styles.featurePills, isDesktop && styles.featurePillsDesktop]}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Increase regatta participation</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Modernize your event</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Delight your sailors</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Showcase sponsors effectively</Text>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={[styles.ctaButtons, isDesktop && styles.ctaButtonsDesktop]}>
          <TouchableOpacity
            style={styles.primaryCTA}
            onPress={handleScheduleDemo}
          >
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={styles.primaryCTAText}>Schedule Demo</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryCTA}
            onPress={handleViewPortfolio}
          >
            <Ionicons name="grid" size={20} color="#4169E1" />
            <Text style={styles.secondaryCTAText}>View Portfolio</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* iPhone Mockups Section */}
      <View style={[styles.mockupsSection, isDesktop && styles.mockupsSectionDesktop]}>
        <View style={[styles.mockupsContainer, isDesktop && styles.mockupsContainerDesktop]}>
          {/* Left Phone - Newport YC */}
          <View style={[styles.phone, styles.phoneLeft]}>
            <View style={styles.phoneHeader}>
              <View style={[styles.phoneStatusBar, { backgroundColor: '#4169E1' }]}>
                <Text style={styles.phoneLocation}>Newport YC</Text>
                <View style={styles.phoneStatusIcons} />
              </View>
            </View>
            <View style={styles.phoneContent}>
              <Text style={styles.phoneEventTitle}>Spring Series 2024</Text>
              <Text style={styles.phoneEventSubtitle}>Live Tracking</Text>
              <View style={styles.phoneContentBody}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={styles.phoneContentLine} />
                ))}
              </View>
              <View style={styles.phoneDots}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>
          </View>

          {/* Center Phone - San Francisco YC */}
          <View style={[styles.phone, styles.phoneCenter]}>
            <View style={styles.phoneHeader}>
              <View style={[styles.phoneStatusBar, { backgroundColor: '#2D8B54' }]}>
                <Text style={styles.phoneLocation}>San Francisco YC</Text>
                <View style={styles.phoneStatusIcons} />
              </View>
            </View>
            <View style={styles.phoneContent}>
              <Text style={styles.phoneEventTitle}>Big Boat Series</Text>
              <Text style={styles.phoneEventSubtitle}>Results & Scoring</Text>
              <View style={styles.phoneContentBody}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={styles.phoneContentLine} />
                ))}
              </View>
              <View style={styles.phoneDots}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>
          </View>

          {/* Right Phone - Royal YS */}
          <View style={[styles.phone, styles.phoneRight]}>
            <View style={styles.phoneHeader}>
              <View style={[styles.phoneStatusBar, { backgroundColor: '#7B68EE' }]}>
                <Text style={styles.phoneLocation}>Royal YS</Text>
                <View style={styles.phoneStatusIcons} />
              </View>
            </View>
            <View style={styles.phoneContent}>
              <Text style={styles.phoneEventTitle}>Cowes Week 2024</Text>
              <Text style={styles.phoneEventSubtitle}>Event Schedule</Text>
              <View style={styles.phoneContentBody}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={styles.phoneContentLine} />
                ))}
              </View>
              <View style={styles.phoneDots}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={[styles.dot, styles.dotActive]} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#4169E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  nav: {
    flexDirection: 'row',
    gap: 32,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  signInText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  getStartedButton: {
    backgroundColor: '#4169E1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#6B7280',
  },
  breadcrumbActive: {
    color: '#111827',
    fontWeight: '500',
  },
  badgeContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeText: {
    fontSize: 13,
    color: '#4169E1',
    fontWeight: '600',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 48,
  },
  heroDesktop: {
    paddingTop: 60,
    paddingBottom: 80,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 44,
    maxWidth: 800,
  },
  heroTitleDesktop: {
    fontSize: 56,
    lineHeight: 68,
  },
  heroTitleAccent: {
    color: '#4169E1',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 600,
    lineHeight: 24,
  },
  heroSubtitleDesktop: {
    fontSize: 20,
    lineHeight: 30,
    marginTop: 24,
  },
  featurePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 32,
    justifyContent: 'center',
    maxWidth: 700,
  },
  featurePillsDesktop: {
    marginTop: 48,
  },
  pill: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pillText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 40,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  ctaButtonsDesktop: {
    marginTop: 48,
  },
  primaryCTA: {
    backgroundColor: '#4169E1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#4169E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryCTAText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryCTA: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  secondaryCTAText: {
    color: '#4169E1',
    fontSize: 16,
    fontWeight: '600',
  },
  mockupsSection: {
    paddingVertical: 60,
    backgroundColor: '#F9FAFB',
  },
  mockupsSectionDesktop: {
    paddingVertical: 100,
  },
  mockupsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
    paddingHorizontal: 24,
  },
  mockupsContainerDesktop: {
    gap: 40,
  },
  phone: {
    width: 280,
    height: 580,
    backgroundColor: '#1F2937',
    borderRadius: 36,
    borderWidth: 8,
    borderColor: '#1F2937',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 10,
  },
  phoneLeft: {
    transform: [{ rotate: '-3deg' }, { translateY: 20 }],
  },
  phoneCenter: {
    transform: [{ scale: 1.05 }],
    zIndex: 2,
  },
  phoneRight: {
    transform: [{ rotate: '3deg' }, { translateY: 20 }],
  },
  phoneHeader: {
    backgroundColor: '#FFFFFF',
  },
  phoneStatusBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneLocation: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  phoneStatusIcons: {
    width: 60,
    height: 12,
  },
  phoneContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  phoneEventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  phoneEventSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  phoneContentBody: {
    flex: 1,
    gap: 12,
  },
  phoneContentLine: {
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  phoneDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    backgroundColor: '#4169E1',
  },
});
