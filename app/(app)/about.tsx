/**
 * About Page - RegattaFlow Company and Mission
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

export default function AboutScreen() {
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
            <Ionicons name="boat" size={48} color="#0ea5e9" />
            <ThemedText style={styles.title}>About RegattaFlow</ThemedText>
            <ThemedText style={styles.subtitle}>
              Revolutionizing competitive sailing through intelligent technology
            </ThemedText>
          </View>
        </View>

        {/* Mission Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Our Mission</ThemedText>
          <ThemedText style={styles.sectionText}>
            To transform competitive sailing by providing world-class tools that help sailors at every level
            achieve their racing goals. We believe that success on the water comes from combining deep local
            knowledge with cutting-edge technology and strategic intelligence.
          </ThemedText>
        </View>

        {/* Vision Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>The Vision</ThemedText>
          <ThemedText style={styles.sectionText}>
            RegattaFlow was born from the frustration of scattered PDFs, fragmented race data, and the
            challenge of mastering new sailing venues. As international competitors ourselves, we experienced
            firsthand the pain of preparing for regattas in unfamiliar waters without local expertise.
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            Our platform serves as "OnX Maps for Sailing" - providing comprehensive venue intelligence,
            AI-powered race strategy, and professional tools that level the playing field for sailors
            competing globally.
          </ThemedText>
        </View>

        {/* Values */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Our Values</ThemedText>

          <View style={styles.valuesList}>
            <ValueItem
              icon="compass"
              title="Precision"
              description="Every feature is crafted with the accuracy and reliability that competitive sailing demands."
            />
            <ValueItem
              icon="globe"
              title="Global Perspective"
              description="We understand sailing is international - our platform works seamlessly across all major venues."
            />
            <ValueItem
              icon="people"
              title="Community"
              description="Connecting sailors, coaches, and race organizers in a unified ecosystem."
            />
            <ValueItem
              icon="trending-up"
              title="Excellence"
              description="Empowering sailors to achieve their personal best through data-driven insights."
            />
          </View>
        </View>

        {/* Team Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Built by Sailors</ThemedText>
          <ThemedText style={styles.sectionText}>
            Our team combines decades of competitive sailing experience with expertise in AI, mobile
            development, and maritime technology. We've raced at world championships, coached Olympic
            campaigns, and organized major regattas.
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            This unique perspective ensures RegattaFlow solves real problems that sailors face,
            not theoretical challenges dreamed up in a boardroom.
          </ThemedText>
        </View>

        {/* Technology Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Advanced Technology</ThemedText>

          <View style={styles.techList}>
            <TechItem
              icon="brain"
              title="AI-Powered Analysis"
              description="Google AI processes sailing instructions and generates strategic insights automatically."
            />
            <TechItem
              icon="map"
              title="3D Mapping"
              description="Professional-grade 3D mapping with bathymetry, weather overlays, and tactical visualization."
            />
            <TechItem
              icon="cloud"
              title="Real-time Data"
              description="Live weather, tides, and current data integrated from global meteorological services."
            />
            <TechItem
              icon="shield-checkmark"
              title="Marine-Grade Reliability"
              description="Built to perform under pressure with offline capabilities and robust data synchronization."
            />
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>147+</ThemedText>
              <ThemedText style={styles.statLabel}>Sailing Venues</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>50+</ThemedText>
              <ThemedText style={styles.statLabel}>Countries</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>1000+</ThemedText>
              <ThemedText style={styles.statLabel}>Active Sailors</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>24/7</ThemedText>
              <ThemedText style={styles.statLabel}>Support</ThemedText>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <ThemedText style={styles.ctaTitle}>Ready to Transform Your Racing?</ThemedText>
          <ThemedText style={styles.ctaSubtitle}>
            Join the growing community of sailors using RegattaFlow to achieve their racing goals.
          </ThemedText>

          <View style={styles.ctaButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(auth)/signup')}
            >
              <ThemedText style={styles.primaryButtonText}>Start Free Trial</ThemedText>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(app)/pricing')}
            >
              <ThemedText style={styles.secondaryButtonText}>View Pricing</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

interface ValueItemProps {
  icon: string;
  title: string;
  description: string;
}

function ValueItem({ icon, title, description }: ValueItemProps) {
  return (
    <View style={styles.valueItem}>
      <View style={styles.valueIcon}>
        <Ionicons name={icon as any} size={24} color="#0ea5e9" />
      </View>
      <View style={styles.valueContent}>
        <ThemedText style={styles.valueTitle}>{title}</ThemedText>
        <ThemedText style={styles.valueDescription}>{description}</ThemedText>
      </View>
    </View>
  );
}

interface TechItemProps {
  icon: string;
  title: string;
  description: string;
}

function TechItem({ icon, title, description }: TechItemProps) {
  return (
    <View style={styles.techItem}>
      <View style={styles.techIcon}>
        <Ionicons name={icon as any} size={28} color="#22c55e" />
      </View>
      <View style={styles.techContent}>
        <ThemedText style={styles.techTitle}>{title}</ThemedText>
        <ThemedText style={styles.techDescription}>{description}</ThemedText>
      </View>
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 24,
    marginBottom: 16,
  },

  // Values
  valuesList: {
    gap: 20,
  },
  valueItem: {
    flexDirection: 'row',
    gap: 16,
  },
  valueIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  valueDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },

  // Technology
  techList: {
    gap: 20,
  },
  techItem: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  techIcon: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  techContent: {
    flex: 1,
  },
  techTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 6,
  },
  techDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },

  // Stats
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
    minWidth: '45%',
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0ea5e9',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },

  // CTA
  ctaSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#cbd5e1',
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
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#cbd5e1',
  },
});