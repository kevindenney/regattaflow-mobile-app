import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const VALUES = [
  {
    icon: 'compass-outline' as const,
    title: 'Democratize Racing Intelligence',
    description: 'World-class race strategy shouldn\'t be reserved for elite teams. We bring AI-powered insights to every sailor.',
  },
  {
    icon: 'people-outline' as const,
    title: 'Unite the Sailing Community',
    description: 'Sailors, coaches, and clubs working together in one seamless ecosystem, sharing knowledge and growing together.',
  },
  {
    icon: 'analytics-outline' as const,
    title: 'Data-Driven Performance',
    description: 'Transform race data into actionable insights. Learn from every start, every mark rounding, every finish.',
  },
  {
    icon: 'globe-outline' as const,
    title: 'Global, Yet Local',
    description: 'Venue-specific intelligence that understands your local conditions while connecting you to the worldwide sailing community.',
  },
];

export function MissionSection() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDesktop = mounted && width > 768;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F8FAFC', '#EFF6FF', '#F8FAFC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={[styles.content, isDesktop && styles.contentDesktop]}>
          {/* Mission Statement */}
          <View style={styles.missionHeader}>
            <View style={styles.badge}>
              <Ionicons name="flag-outline" size={16} color="#3E92CC" />
              <Text style={styles.badgeText}>Our Mission</Text>
            </View>
            
            <Text style={[styles.missionTitle, isDesktop && styles.missionTitleDesktop]}>
              Empowering Every Sailor to{'\n'}Race at Their Best
            </Text>
            
            <Text style={[styles.missionDescription, isDesktop && styles.missionDescriptionDesktop]}>
              We believe that great sailing comes from the intersection of preparation, knowledge, 
              and passion. RegattaFlow exists to give every sailor—from weekend club racers to 
              Olympic hopefuls—the tools they need to understand their racing environment, 
              make smarter decisions on the water, and continuously improve their craft.
            </Text>
          </View>

          {/* Values Grid */}
          <View style={[styles.valuesGrid, isDesktop && styles.valuesGridDesktop]}>
            {VALUES.map((value, index) => (
              <View key={index} style={[styles.valueCard, isDesktop && styles.valueCardDesktop]}>
                <View style={styles.valueIconContainer}>
                  <Ionicons name={value.icon} size={28} color="#3E92CC" />
                </View>
                <Text style={styles.valueTitle}>{value.title}</Text>
                <Text style={styles.valueDescription}>{value.description}</Text>
              </View>
            ))}
          </View>

          {/* Quote */}
          <View style={styles.quoteContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={32} color="#3E92CC" style={styles.quoteIcon} />
            <Text style={[styles.quote, isDesktop && styles.quoteDesktop]}>
              "The wind is always changing. The best sailors don't just react—they anticipate. 
              We built RegattaFlow to help every sailor see what's coming and make it there first."
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  gradient: {
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  content: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  contentDesktop: {
    // Additional desktop styles
  },

  // Mission Header
  missionHeader: {
    alignItems: 'center',
    marginBottom: 64,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },
  missionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 24,
  },
  missionTitleDesktop: {
    fontSize: 44,
    lineHeight: 52,
  },
  missionDescription: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 800,
  },
  missionDescriptionDesktop: {
    fontSize: 20,
    lineHeight: 32,
  },

  // Values Grid
  valuesGrid: {
    gap: 24,
    marginBottom: 64,
  },
  valuesGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  valueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      },
      default: {
        elevation: 1,
      },
    }),
  },
  valueCardDesktop: {
    flex: 1,
    minWidth: 260,
    maxWidth: 280,
  },
  valueIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  valueTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  valueDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 24,
  },

  // Quote
  quoteContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  quoteIcon: {
    marginBottom: 16,
    opacity: 0.4,
  },
  quote: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 32,
    maxWidth: 800,
  },
  quoteDesktop: {
    fontSize: 24,
    lineHeight: 36,
  },
});

