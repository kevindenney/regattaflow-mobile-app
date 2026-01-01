/**
 * Coaches Landing Page
 * Placeholder page for coach features
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LandingNav } from '@/components/landing/LandingNav';

export default function CoachesPage() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <View style={styles.container}>
      <LandingNav transparent={false} sticky={true} />
      <LinearGradient
        colors={['#0A2463', '#3E92CC', '#0A2463']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={[styles.content, isDesktop && styles.contentDesktop]}>
          <View style={styles.iconContainer}>
            <Ionicons name="people-outline" size={64} color="#FFFFFF" />
          </View>

          <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
            Coach Features Coming Soon
          </Text>

          <Text style={[styles.subtitle, isDesktop && styles.subtitleDesktop]}>
            We're building powerful coaching tools to help you manage sessions, track student progress, and grow your coaching business.
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.featureText}>Session management & scheduling</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.featureText}>Video analysis tools</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.featureText}>Payment processing</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.featureText}>Student progress tracking</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.location.href = 'mailto:hello@regattaflow.io?subject=Coach Features Inquiry';
              } else {
                // On mobile, could open email client
                router.push('/');
              }
            }}
          >
            <Text style={styles.contactButtonText}>Contact Us</Text>
            <Ionicons name="mail-outline" size={18} color="#0A2463" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/')}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  content: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  contentDesktop: {
    paddingVertical: 120,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  titleDesktop: {
    fontSize: 48,
  },
  subtitle: {
    fontSize: 18,
    color: '#E3F2FD',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 48,
  },
  subtitleDesktop: {
    fontSize: 20,
  },
  featuresList: {
    width: '100%',
    gap: 16,
    marginBottom: 48,
    maxWidth: 500,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  contactButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
      default: {
        elevation: 4,
      },
    }),
  },
  contactButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A2463',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});
