/**
 * Club Feature Descriptions Component
 * Displays club-focused feature descriptions in a two-column layout around the demo
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ClubFeatureId =
  | 'entry-management'
  | 'live-scoring'
  | 'member-management'
  | 'volunteer-coordination'
  | 'document-automation'
  | 'white-label-microsites'
  | 'results-publishing'
  | 'payment-processing';

interface Feature {
  id: ClubFeatureId;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface ClubFeatureDescriptionsProps {
  /** Currently highlighted feature */
  highlightedFeature?: ClubFeatureId | null;
  /** Callback when a feature is clicked */
  onFeatureClick: (featureId: ClubFeatureId) => void;
  /** Which column to display (left or right) */
  column: 'left' | 'right';
}

// Left column features
const LEFT_FEATURES: Feature[] = [
  {
    id: 'entry-management',
    title: 'Entry Management',
    description: 'Online registration with payment processing. Manage entries, waivers, and fees in one place.',
    icon: 'clipboard-outline',
  },
  {
    id: 'live-scoring',
    title: 'Live Race Scoring',
    description: 'Real-time results during racing. Race committee can score from mobile devices on the water.',
    icon: 'timer-outline',
  },
  {
    id: 'member-management',
    title: 'Member Management',
    description: 'Roster, roles, and permissions. Approve members, assign roles, and track dues.',
    icon: 'people-outline',
  },
  {
    id: 'volunteer-coordination',
    title: 'Volunteer Coordination',
    description: 'PRO, signal boats, committee assignments. Manage race day operations and crew.',
    icon: 'hand-left-outline',
  },
];

// Right column features
const RIGHT_FEATURES: Feature[] = [
  {
    id: 'document-automation',
    title: 'Document Automation',
    description: 'Generate NORs, SIs, bulletins. Automated document creation with club branding.',
    icon: 'document-text-outline',
  },
  {
    id: 'white-label-microsites',
    title: 'White-label Microsites',
    description: 'Custom branded regatta sites. Your domain, your branding, professional results pages.',
    icon: 'globe-outline',
  },
  {
    id: 'results-publishing',
    title: 'Results Publishing',
    description: 'One-click publishing to web. Automatic results to your website and social channels.',
    icon: 'share-outline',
  },
  {
    id: 'payment-processing',
    title: 'Payment Processing',
    description: 'Multi-currency Stripe integration. Accept payments globally with automatic invoicing.',
    icon: 'card-outline',
  },
];

export function ClubFeatureDescriptions({
  highlightedFeature,
  onFeatureClick,
  column,
}: ClubFeatureDescriptionsProps) {
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const features = column === 'left' ? LEFT_FEATURES : RIGHT_FEATURES;

  // Inject CSS for hover effects on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const styleId = 'club-feature-card-hover-styles';
      if (document.getElementById(styleId)) return;

      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .club-feature-card-hoverable:hover {
          border-color: #10B981 !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15) !important;
          transform: translateX(4px) !important;
        }
        .club-feature-card-hoverable.club-feature-card-highlighted:hover {
          border-color: #10B981 !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2) !important;
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
                  color="#10B981"
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
              className: `club-feature-card-hoverable ${isHighlighted ? 'club-feature-card-highlighted' : ''}`,
            } : {})}
            onPress={() => onFeatureClick(feature.id)}
            activeOpacity={0.7}
          >
            <View style={styles.featureIconContainer}>
              <Ionicons
                name={feature.icon}
                size={24}
                color="#10B981"
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
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
        transform: 'translateX(4px)',
      },
      default: {
        shadowColor: '#10B981',
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
    backgroundColor: '#ECFDF5',
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
    color: '#10B981',
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
