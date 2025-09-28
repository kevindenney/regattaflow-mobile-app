/**
 * Features Page - Comprehensive feature overview
 */

import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';

export default function FeaturesScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#334155']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Ionicons name="rocket" size={48} color="#0ea5e9" />
            <ThemedText style={styles.title}>RegattaFlow Features</ThemedText>
            <ThemedText style={styles.subtitle}>
              Professional sailing tools designed for competitive success
            </ThemedText>
          </View>
        </View>

        {/* Core Features */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Core Features</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            Everything you need for race-winning performance
          </ThemedText>

          <View style={styles.featuresList}>
            <FeatureCard
              icon="document-text"
              title="AI Document Processing"
              description="Upload sailing instructions, NOCs, and race documents. Our AI extracts course details, timing, and tactical information automatically."
              features={[
                "PDF and image OCR processing",
                "Automatic course extraction",
                "Key information highlighting",
                "Multi-language support"
              ]}
              color="#3b82f6"
            />

            <FeatureCard
              icon="globe"
              title="Global Venue Intelligence"
              description="Comprehensive database of 147+ major sailing venues with local conditions, cultural insights, and tactical knowledge."
              features={[
                "Venue-specific weather patterns",
                "Local sailing customs and protocols",
                "Historical race data and results",
                "Equipment recommendations"
              ]}
              color="#10b981"
            />

            <FeatureCard
              icon="analytics"
              title="AI Race Strategy"
              description="Monte Carlo simulations and tactical analysis powered by machine learning and meteorological data."
              features={[
                "Wind and current optimization",
                "Start line analysis",
                "Tactical decision recommendations",
                "Real-time strategy updates"
              ]}
              color="#8b5cf6"
            />

            <FeatureCard
              icon="map"
              title="3D Course Visualization"
              description="Professional-grade 3D mapping with bathymetry, weather overlays, and tactical annotations."
              features={[
                "Interactive 3D race courses",
                "Depth contours and hazards",
                "Wind and current visualization",
                "Mark positioning tools"
              ]}
              color="#f59e0b"
            />
          </View>
        </View>

        {/* Performance Tools */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Performance Tools</ThemedText>

          <View style={styles.featuresList}>
            <FeatureCard
              icon="speedometer"
              title="GPS Race Tracking"
              description="Precise GPS tracking with AI-powered performance analysis and tactical insights."
              features={[
                "High-precision GPS recording",
                "Speed and heading analysis",
                "VMG optimization tracking",
                "Comparative performance data"
              ]}
              color="#ef4444"
            />

            <FeatureCard
              icon="trending-up"
              title="Performance Analytics"
              description="Comprehensive race analysis with improvement recommendations and venue comparison."
              features={[
                "Detailed race breakdowns",
                "Performance trend analysis",
                "Venue-specific comparisons",
                "Equipment correlation tracking"
              ]}
              color="#06b6d4"
            />

            <FeatureCard
              icon="settings"
              title="Equipment Optimization"
              description="Track boat setup, sail selection, and equipment performance across different conditions."
              features={[
                "Setup configuration tracking",
                "Sail performance analysis",
                "Weather-based recommendations",
                "Equipment maintenance logs"
              ]}
              color="#84cc16"
            />
          </View>
        </View>

        {/* Professional Tools */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Professional Tools</ThemedText>

          <View style={styles.featuresList}>
            <FeatureCard
              icon="people"
              title="Coach Marketplace"
              description="Connect with professional sailing coaches worldwide for personalized training and race preparation."
              features={[
                "Verified coach profiles",
                "Session booking and payments",
                "Performance data sharing",
                "Progress tracking tools"
              ]}
              color="#ec4899"
            />

            <FeatureCard
              icon="trophy"
              title="Event Management"
              description="Complete regatta management tools for race committees and sailing organizations."
              features={[
                "Registration management",
                "Live race tracking",
                "Automated results calculation",
                "Spectator engagement tools"
              ]}
              color="#f97316"
            />

            <FeatureCard
              icon="users"
              title="Team Collaboration"
              description="Share strategies, coordinate crew, and analyze performance as a team."
              features={[
                "Real-time strategy sharing",
                "Crew communication tools",
                "Role-based access control",
                "Team performance analytics"
              ]}
              color="#6366f1"
            />
          </View>
        </View>

        {/* Technical Features */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Technical Excellence</ThemedText>

          <View style={styles.techGrid}>
            <TechFeature
              icon="cloud-offline"
              title="Offline First"
              description="Full functionality without internet connection"
            />
            <TechFeature
              icon="sync"
              title="Real-time Sync"
              description="Seamless data synchronization across devices"
            />
            <TechFeature
              icon="shield-checkmark"
              title="Marine-Grade Reliability"
              description="Built to perform under pressure"
            />
            <TechFeature
              icon="globe-outline"
              title="Universal Platform"
              description="iOS, Android, and Web with consistent experience"
            />
            <TechFeature
              icon="lock-closed"
              title="Secure & Private"
              description="End-to-end encryption for sensitive data"
            />
            <TechFeature
              icon="flash"
              title="Lightning Fast"
              description="Optimized performance for mobile and web"
            />
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={['#0ea5e9', '#0284c7']}
            style={styles.ctaCard}
          >
            <ThemedText style={styles.ctaTitle}>Ready to Upgrade Your Racing?</ThemedText>
            <ThemedText style={styles.ctaSubtitle}>
              Join thousands of competitive sailors using RegattaFlow to achieve their racing goals.
            </ThemedText>

            <View style={styles.ctaButtons}>
              <TouchableOpacity
                style={styles.ctaPrimaryButton}
                onPress={() => router.push('/(auth)/signup')}
              >
                <ThemedText style={styles.ctaPrimaryButtonText}>Start Free Trial</ThemedText>
                <Ionicons name="arrow-forward" size={20} color="#0ea5e9" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ctaSecondaryButton}
                onPress={() => router.push('/(app)/pricing')}
              >
                <ThemedText style={styles.ctaSecondaryButtonText}>View Pricing</ThemedText>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  features: string[];
  color: string;
}

function FeatureCard({ icon, title, description, features, color }: FeatureCardProps) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureHeader}>
        <View style={[styles.featureIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={32} color={color} />
        </View>
        <View style={styles.featureHeaderContent}>
          <ThemedText style={styles.featureTitle}>{title}</ThemedText>
          <ThemedText style={styles.featureDescription}>{description}</ThemedText>
        </View>
      </View>

      <View style={styles.featureDetails}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark" size={16} color="#22c55e" />
            <ThemedText style={styles.featureItemText}>{feature}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

interface TechFeatureProps {
  icon: string;
  title: string;
  description: string;
}

function TechFeature({ icon, title, description }: TechFeatureProps) {
  return (
    <View style={styles.techFeature}>
      <View style={styles.techIcon}>
        <Ionicons name={icon as any} size={24} color="#0ea5e9" />
      </View>
      <ThemedText style={styles.techTitle}>{title}</ThemedText>
      <ThemedText style={styles.techDescription}>{description}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 24,
  },

  // Features
  featuresList: {
    gap: 24,
  },
  featureCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  featureHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureHeaderContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  featureDetails: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureItemText: {
    fontSize: 14,
    color: '#cbd5e1',
    flex: 1,
  },

  // Tech Grid
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  techFeature: {
    width: '45%',
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  techIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  techTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 6,
  },
  techDescription: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
  },

  // CTA
  ctaSection: {
    paddingHorizontal: 24,
  },
  ctaCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  ctaPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  ctaPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  ctaSecondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 8,
  },
  ctaSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});