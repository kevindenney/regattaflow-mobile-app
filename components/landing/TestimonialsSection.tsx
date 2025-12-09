import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TESTIMONIALS = [
  {
    quote: "RegattaFlow transformed how I prepare for races. The AI strategy suggestions are like having a coach in my pocket.",
    author: "Sarah M.",
    role: "J/70 Sailor",
    location: "San Francisco, CA",
    rating: 5,
  },
  {
    quote: "As a club, we've cut our race management time in half. Results are published before boats even reach the dock.",
    author: "Mike T.",
    role: "Race Committee Chair",
    location: "Chicago YC",
    rating: 5,
  },
  {
    quote: "The venue intelligence feature gave me insights about local conditions that took competitors years to learn.",
    author: "Elena R.",
    role: "Laser Radial Sailor",
    location: "Miami, FL",
    rating: 5,
  },
  {
    quote: "I've grown my coaching business 3x since joining the marketplace. The tools make session management effortless.",
    author: "James K.",
    role: "US Sailing Coach",
    location: "Annapolis, MD",
    rating: 5,
  },
];

// Stats removed - will add real metrics when available

export function TestimonialsSection() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDesktop = mounted && width > 768;

  return (
    <View style={styles.container}>
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        {/* Section Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.badgeText}>Trusted by Sailors Worldwide</Text>
          </View>
          <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
            What Our Community Says
          </Text>
          <Text style={styles.subtitle}>
            Join thousands of sailors, coaches, and clubs who are racing smarter
          </Text>
        </View>

        {/* Testimonials Grid */}
        <ScrollView
          horizontal={!isDesktop}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.testimonialsContainer,
            isDesktop && styles.testimonialsContainerDesktop,
          ]}
        >
          {TESTIMONIALS.map((testimonial, index) => (
            <View key={index} style={[styles.testimonialCard, isDesktop && styles.testimonialCardDesktop]}>
              {/* Stars */}
              <View style={styles.stars}>
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Ionicons key={i} name="star" size={16} color="#F59E0B" />
                ))}
              </View>
              
              {/* Quote */}
              <Text style={styles.quote}>"{testimonial.quote}"</Text>
              
              {/* Author */}
              <View style={styles.authorSection}>
                <View style={styles.authorAvatar}>
                  <Text style={styles.authorInitial}>
                    {testimonial.author.charAt(0)}
                  </Text>
                </View>
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{testimonial.author}</Text>
                  <Text style={styles.authorRole}>{testimonial.role}</Text>
                  <Text style={styles.authorLocation}>{testimonial.location}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Trust Badges */}
        <View style={styles.trustSection}>
          <Text style={styles.trustTitle}>Recognized by:</Text>
          <View style={styles.trustBadges}>
            <View style={styles.trustBadge}>
              <Ionicons name="ribbon-outline" size={24} color="#6B7280" />
              <Text style={styles.trustBadgeText}>US Sailing</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#6B7280" />
              <Text style={styles.trustBadgeText}>World Sailing</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="trophy-outline" size={24} color="#6B7280" />
              <Text style={styles.trustBadgeText}>ISAF Member</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0A2463',
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

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FDE68A',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  titleDesktop: {
    fontSize: 40,
  },
  subtitle: {
    fontSize: 18,
    color: '#BFDBFE',
    textAlign: 'center',
    maxWidth: 600,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 64,
    paddingVertical: 32,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsRowDesktop: {
    gap: 64,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 100,
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#93C5FD',
  },

  // Testimonials
  testimonialsContainer: {
    gap: 24,
    paddingBottom: 8,
  },
  testimonialsContainerDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  testimonialCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    minWidth: 300,
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  testimonialCardDesktop: {
    flex: 1,
    minWidth: 260,
    maxWidth: 280,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 16,
  },
  quote: {
    fontSize: 16,
    color: '#E0E7FF',
    lineHeight: 26,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3E92CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authorRole: {
    fontSize: 14,
    color: '#93C5FD',
  },
  authorLocation: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Trust Section
  trustSection: {
    alignItems: 'center',
    marginTop: 64,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  trustTitle: {
    fontSize: 14,
    color: '#93C5FD',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trustBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 32,
  },
  trustBadge: {
    alignItems: 'center',
    gap: 8,
    opacity: 0.6,
  },
  trustBadgeText: {
    fontSize: 12,
    color: '#BFDBFE',
    fontWeight: '500',
  },
});

