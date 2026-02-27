import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { PhoneMockup } from '@/components/landing/PhoneMockup';
import { MiniSailorDashboard } from '@/components/landing/MiniSailorDashboard';
import { MiniCoachDashboard } from '@/components/landing/MiniCoachDashboard';
import { MiniClubDashboard } from '@/components/landing/MiniClubDashboard';
import { FeatureDescriptions } from '@/components/landing/FeatureDescriptions';
import { CoachFeatureDescriptions } from '@/components/landing/CoachFeatureDescriptions';
import { ClubFeatureDescriptions } from '@/components/landing/ClubFeatureDescriptions';
import { PricingSection } from '@/components/landing/PricingSection';

type Persona = 'sailor' | 'coach' | 'club';

interface PersonaSectionProps {
  persona: Persona;
  reversed?: boolean;
}

const PERSONA_CONFIG = {
  sailor: {
    heading: 'For Sailors',
    tagline: 'AI-powered race preparation, real-time strategy, and performance analytics.',
    accentColor: '#3E92CC',
    bgColor: '#F0F9FF',
    ctaText: 'Start Sailing Free',
  },
  coach: {
    heading: 'For Coaches',
    tagline: 'Grow your coaching business with tools to manage clients, sessions, and payments.',
    accentColor: '#8B5CF6',
    bgColor: '#F5F3FF',
    ctaText: 'Start Coaching Free',
  },
  club: {
    heading: 'For Clubs',
    tagline: 'Manage races, members, and results with a modern platform built for yacht clubs.',
    accentColor: '#10B981',
    bgColor: '#ECFDF5',
    ctaText: 'Start Managing Free',
  },
};

export function PersonaSection({ persona, reversed = false }: PersonaSectionProps) {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDesktop = mounted && width > 768;
  const config = PERSONA_CONFIG[persona];
  const sectionId = `for-${persona === 'club' ? 'clubs' : persona + 's'}`;

  const renderMockup = () => {
    const mockupWidth = isDesktop ? 280 : Math.min(260, width - 80);
    const mockupHeight = isDesktop ? 560 : Math.min(500, (width - 80) * 2);

    return (
      <View style={styles.mockupContainer}>
        <PhoneMockup width={mockupWidth} height={mockupHeight}>
          {persona === 'sailor' && <MiniSailorDashboard />}
          {persona === 'coach' && <MiniCoachDashboard />}
          {persona === 'club' && <MiniClubDashboard />}
        </PhoneMockup>
      </View>
    );
  };

  const noop = () => {};

  const renderFeatures = () => {
    return (
      <View style={styles.featuresContainer}>
        {persona === 'sailor' && (
          <>
            <FeatureDescriptions
              column="left"
              onFeatureClick={noop}
            />
            <FeatureDescriptions
              column="right"
              onFeatureClick={noop}
            />
          </>
        )}
        {persona === 'coach' && (
          <>
            <CoachFeatureDescriptions
              column="left"
              onFeatureClick={noop}
            />
            <CoachFeatureDescriptions
              column="right"
              onFeatureClick={noop}
            />
          </>
        )}
        {persona === 'club' && (
          <>
            <ClubFeatureDescriptions
              column="left"
              onFeatureClick={noop}
            />
            <ClubFeatureDescriptions
              column="right"
              onFeatureClick={noop}
            />
          </>
        )}
      </View>
    );
  };

  return (
    <View
      id={sectionId}
      style={[styles.container, { backgroundColor: config.bgColor }]}
      // @ts-ignore - web only nativeID
      nativeID={sectionId}
    >
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        {/* Heading */}
        <Text style={[styles.heading, { color: config.accentColor }]}>
          {config.heading}
        </Text>
        <Text style={styles.tagline}>{config.tagline}</Text>

        {/* Two-column layout: mockup + features */}
        <View
          style={[
            styles.columnsRow,
            isDesktop && styles.columnsRowDesktop,
            isDesktop && reversed && styles.columnsRowReversed,
          ]}
        >
          {renderMockup()}
          {renderFeatures()}
        </View>

        {/* Pricing */}
        <PricingSection variant={persona} />

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: config.accentColor }]}
            onPress={() =>
              router.push({
                pathname: '/(auth)/signup',
                params: { persona },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={config.ctaText}
          >
            <Text style={styles.ctaText}>{config.ctaText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  content: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  contentDesktop: {},

  heading: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 17,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: 560,
    alignSelf: 'center',
    lineHeight: 26,
  },

  columnsRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 32,
    marginBottom: 48,
  },
  columnsRowDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 48,
  },
  columnsRowReversed: {
    flexDirection: 'row-reverse',
  },

  mockupContainer: {
    alignItems: 'center',
    flexShrink: 0,
  },

  featuresContainer: {
    flex: 1,
    minWidth: 0,
  },

  ctaContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  ctaButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 36,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
