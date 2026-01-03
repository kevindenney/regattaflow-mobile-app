/**
 * Coach Feature Descriptions Component
 * Displays coach-focused feature descriptions in a two-column layout around the demo
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type CoachFeatureId =
  | 'session-management'
  | 'client-acquisition'
  | 'program-building'
  | 'video-analysis'
  | 'payment-processing'
  | 'progress-tracking'
  | 'earnings-dashboard'
  | 'automated-reminders';

interface Feature {
  id: CoachFeatureId;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface CoachFeatureDescriptionsProps {
  /** Currently highlighted feature */
  highlightedFeature?: CoachFeatureId | null;
  /** Callback when a feature is clicked */
  onFeatureClick: (featureId: CoachFeatureId) => void;
  /** Which column to display (left or right) */
  column: 'left' | 'right';
}

// Left column features
const LEFT_FEATURES: Feature[] = [
  {
    id: 'session-management',
    title: 'Session Management',
    description: 'Schedule and track all coaching sessions. Manage on-water training, video reviews, and strategy calls.',
    icon: 'calendar-outline',
  },
  {
    id: 'client-acquisition',
    title: 'Client Acquisition',
    description: 'Get discovered by sailors looking for coaching. Your profile showcases experience and specialties.',
    icon: 'search-outline',
  },
  {
    id: 'program-building',
    title: 'Program Building',
    description: 'Create structured multi-week training programs with milestones, focus areas, and progression.',
    icon: 'layers-outline',
  },
  {
    id: 'video-analysis',
    title: 'Video Analysis',
    description: 'Upload and review race footage with clients. Annotate key moments and share tactical insights.',
    icon: 'videocam-outline',
  },
];

// Right column features
const RIGHT_FEATURES: Feature[] = [
  {
    id: 'payment-processing',
    title: 'Payment Processing',
    description: 'Stripe integration for seamless payments. Accept payments globally with automatic invoicing.',
    icon: 'card-outline',
  },
  {
    id: 'progress-tracking',
    title: 'Progress Tracking',
    description: 'Monitor student development over time. Track improvements in starts, tactics, and boat handling.',
    icon: 'trending-up-outline',
  },
  {
    id: 'earnings-dashboard',
    title: 'Earnings Dashboard',
    description: 'Track revenue, payouts, and growth. See monthly trends and client lifetime value.',
    icon: 'stats-chart-outline',
  },
  {
    id: 'automated-reminders',
    title: 'Automated Reminders',
    description: 'Never miss a session with notifications. Automatic reminders for you and your clients.',
    icon: 'notifications-outline',
  },
];

export function CoachFeatureDescriptions({
  highlightedFeature,
  onFeatureClick,
  column,
}: CoachFeatureDescriptionsProps) {
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const features = column === 'left' ? LEFT_FEATURES : RIGHT_FEATURES;

  // Inject CSS for hover effects on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const styleId = 'coach-feature-card-hover-styles';
      if (document.getElementById(styleId)) return;

      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .coach-feature-card-hoverable:hover {
          border-color: #8B5CF6 !important;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15) !important;
          transform: translateX(4px) !important;
        }
        .coach-feature-card-hoverable.coach-feature-card-highlighted:hover {
          border-color: #8B5CF6 !important;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2) !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, []);

  // On mobile, render as horizontal scroll
  if (isMobile) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mobileScrollContainer}
        style={styles.mobileScrollView}
      >
        {features.map((feature) => {
          const isHighlighted = highlightedFeature === feature.id;

          return (
            <TouchableOpacity
              key={feature.id}
              style={[
                styles.featureCard,
                styles.featureCardMobile,
                isHighlighted && styles.featureCardHighlighted,
              ]}
              onPress={() => onFeatureClick(feature.id)}
              activeOpacity={0.7}
            >
              <View style={styles.featureIconContainer}>
                <Ionicons
                  name={feature.icon}
                  size={24}
                  color="#8B5CF6"
                />
              </View>

              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, isHighlighted && styles.featureTitleHighlighted]}>
                  {feature.title}
                </Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {features.map((feature) => {
        const isHighlighted = highlightedFeature === feature.id;

        return (
          <TouchableOpacity
            key={feature.id}
            style={[
              styles.featureCard,
              isHighlighted && styles.featureCardHighlighted,
            ]}
            // @ts-ignore - web only className
            {...(Platform.OS === 'web' ? {
              className: `coach-feature-card-hoverable ${isHighlighted ? 'coach-feature-card-highlighted' : ''}`,
            } : {})}
            onPress={() => onFeatureClick(feature.id)}
            activeOpacity={0.7}
          >
            <View style={styles.featureIconContainer}>
              <Ionicons
                name={feature.icon}
                size={24}
                color="#8B5CF6"
              />
            </View>

            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, isHighlighted && styles.featureTitleHighlighted]}>
                {feature.title}
              </Text>
              <Text style={styles.featureDescription}>
                {feature.description}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#9CA3AF"
              style={styles.featureChevron}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...Platform.select({
      web: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      },
    }),
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    minHeight: 120,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  featureCardHighlighted: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
        transform: 'translateX(4px)',
      },
      default: {
        shadowColor: '#8B5CF6',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  featureContent: {
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 20,
  },
  featureTitleHighlighted: {
    color: '#8B5CF6',
  },
  featureDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  featureChevron: {
    marginTop: 4,
    flexShrink: 0,
  },
  // Mobile horizontal scroll styles
  mobileScrollView: {
    marginHorizontal: -16,
  },
  mobileScrollContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  featureCardMobile: {
    width: 280,
    minHeight: 100,
    marginBottom: 0,
  },
});
