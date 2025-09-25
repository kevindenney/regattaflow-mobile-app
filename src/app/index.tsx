/**
 * Marketing Homepage - Main landing page for RegattaFlow
 */

import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  Dimensions,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/src/lib/contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

export default function HomePage() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const handleGetStarted = () => {
    if (user) {
      router.push('/(tabs)/dashboard');
    } else {
      router.push('/(auth)/signup');
    }
  };

  const handleWatchDemo = () => {
    // TODO: Implement demo video
    alert('Demo video coming soon!');
  };

  const handlePricing = () => {
    router.push('/pricing');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#E6F4FE', '#FFFFFF', '#F5F5F5']}
          style={[styles.hero, isDesktop && styles.heroDesktop]}
        >
          <View style={[styles.heroContent, isDesktop && styles.heroContentDesktop]}>
            {/* Badge */}
            <View style={styles.badge}>
              <Ionicons name="trophy" size={16} color="#007AFF" />
              <Text style={styles.badgeText}>Professional Race Management Platform</Text>
            </View>

            {/* Main Heading */}
            <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
              Professional Racing Tools for Every Level
            </Text>

            <Text style={[styles.heroSubtitle, isDesktop && styles.heroSubtitleDesktop]}>
              From personal race planning to custom regatta apps
            </Text>

            {/* CTA Buttons */}
            <View style={[styles.ctaContainer, isDesktop && styles.ctaContainerDesktop]}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
                <Text style={styles.primaryButtonText}>
                  {user ? 'Go to Dashboard' : 'Start Free Trial'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleWatchDemo}>
                <Ionicons name="play" size={20} color="#007AFF" />
                <Text style={styles.secondaryButtonText}>Watch Demo</Text>
              </TouchableOpacity>
            </View>

            {/* Feature Highlights */}
            <View style={[styles.featureGrid, isDesktop && styles.featureGridDesktop]}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="partly-sunny" size={20} color="#2196F3" />
                </View>
                <Text style={styles.featureText}>Weather Intelligence</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#E8F5E8' }]}>
                  <Ionicons name="boat" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.featureText}>Race Planning</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="analytics" size={20} color="#9C27B0" />
                </View>
                <Text style={styles.featureText}>Performance Analytics</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Everything you need to excel in sailing</Text>
          <Text style={styles.sectionSubtitle}>
            AI-powered tools designed for competitive sailors
          </Text>

          <View style={[styles.featuresGrid, isDesktop && styles.featuresGridDesktop]}>
            {/* Feature Cards */}
            <View style={styles.featureCard}>
              <View style={[styles.featureCardIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="document-text" size={32} color="#2196F3" />
              </View>
              <Text style={styles.featureCardTitle}>AI Document Processing</Text>
              <Text style={styles.featureCardDescription}>
                Upload sailing instructions and race documents. Our AI extracts key information and creates actionable insights.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureCardIcon, { backgroundColor: '#E8F5E8' }]}>
                <Ionicons name="compass" size={32} color="#4CAF50" />
              </View>
              <Text style={styles.featureCardTitle}>Strategic Planning</Text>
              <Text style={styles.featureCardDescription}>
                Advanced race strategy tools with weather routing, tactical analysis, and performance optimization.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureCardIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="location" size={32} color="#FF9800" />
              </View>
              <Text style={styles.featureCardTitle}>Global Venue Intelligence</Text>
              <Text style={styles.featureCardDescription}>
                Comprehensive sailing venue database with local conditions, cultural insights, and historical data.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureCardIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="people" size={32} color="#9C27B0" />
              </View>
              <Text style={styles.featureCardTitle}>Coach Marketplace</Text>
              <Text style={styles.featureCardDescription}>
                Connect with professional sailing coaches worldwide. Book sessions and track your progress.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureCardIcon, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="trophy" size={32} color="#F44336" />
              </View>
              <Text style={styles.featureCardTitle}>Event Management</Text>
              <Text style={styles.featureCardDescription}>
                Complete regatta management tools for race committees, including registration and results.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureCardIcon, { backgroundColor: '#E1F5FE' }]}>
                <Ionicons name="analytics" size={32} color="#00BCD4" />
              </View>
              <Text style={styles.featureCardTitle}>Performance Analytics</Text>
              <Text style={styles.featureCardDescription}>
                Detailed race analysis with performance tracking, comparative studies, and improvement recommendations.
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing CTA */}
        <LinearGradient
          colors={['#007AFF', '#0056D3']}
          style={styles.pricingCTA}
        >
          <Text style={styles.pricingTitle}>Ready to elevate your sailing?</Text>
          <Text style={styles.pricingSubtitle}>
            Join thousands of competitive sailors worldwide
          </Text>
          <View style={styles.pricingButtons}>
            <TouchableOpacity style={styles.pricingButton} onPress={handleGetStarted}>
              <Text style={styles.pricingButtonText}>Start Free Trial</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pricingSecondaryButton} onPress={handlePricing}>
              <Text style={styles.pricingSecondaryButtonText}>View Pricing</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 RegattaFlow. All rights reserved.
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => alert('Privacy Policy')}>
              <Text style={styles.footerLink}>Privacy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => alert('Terms of Service')}>
              <Text style={styles.footerLink}>Terms</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => alert('Contact Us')}>
              <Text style={styles.footerLink}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  hero: {
    minHeight: Platform.OS === 'web' ? '90vh' : 600,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  heroDesktop: {
    paddingHorizontal: 40,
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 600,
  },
  heroContentDesktop: {
    maxWidth: 800,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 16,
    lineHeight: 40,
  },
  heroTitleDesktop: {
    fontSize: 56,
    lineHeight: 64,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  heroSubtitleDesktop: {
    fontSize: 24,
    lineHeight: 32,
  },
  ctaContainer: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 48,
    alignItems: 'center',
  },
  ctaContainerDesktop: {
    flexDirection: 'row',
    gap: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  featureGrid: {
    flexDirection: 'column',
    gap: 24,
    alignItems: 'center',
  },
  featureGridDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    maxWidth: 800,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
  },
  featuresGrid: {
    gap: 24,
  },
  featuresGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 32,
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({
      web: {
        width: screenWidth > 768 ? '30%' : '100%',
      }
    })
  },
  featureCardIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  featureCardDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  pricingCTA: {
    paddingHorizontal: 20,
    paddingVertical: 60,
    alignItems: 'center',
  },
  pricingTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  pricingSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
  },
  pricingButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  pricingButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  pricingButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  pricingSecondaryButton: {
    borderWidth: 2,
    borderColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  pricingSecondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 24,
  },
  footerLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});