/**
 * Embedded Coaching Demo Component
 * Displays a demo of the coaching dashboard for the coaches landing page
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CoachFeatureId } from './CoachFeatureDescriptions';

interface EmbeddedCoachingDemoProps {
  highlightedFeature?: CoachFeatureId | null;
  onFeatureHighlight?: (featureId: CoachFeatureId | null) => void;
}

// Demo data
const DEMO_METRICS = [
  { label: 'Upcoming sessions', value: '8', helper: 'Next 7 days', icon: 'calendar-outline' as const },
  { label: 'Active clients', value: '24', helper: 'This month', icon: 'people-outline' as const },
  { label: 'Avg. rating', value: '4.9', helper: 'Last 30 days', icon: 'star-outline' as const },
  { label: 'Revenue', value: '$4.2k', helper: 'This month', icon: 'trending-up-outline' as const },
];

const DEMO_SESSIONS = [
  {
    id: 'session-1',
    coachName: 'Emily Carter',
    coachPhoto: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=80&q=60',
    sessionType: 'Race Strategy',
    datetime: 'Tomorrow, 10:00 AM',
    location: 'Royal HKYC',
    focusAreas: ['start line', 'wind shifts'],
    status: 'confirmed',
  },
  {
    id: 'session-2',
    coachName: 'Luke Anders',
    coachPhoto: 'https://images.unsplash.com/photo-1542144582-1ba00456b5d5?auto=format&fit=crop&w=80&q=60',
    sessionType: 'Video Review',
    datetime: 'Wed, 2:00 PM',
    location: 'Zoom Call',
    focusAreas: ['downwind modes', 'mark rounding'],
    status: 'scheduled',
  },
  {
    id: 'session-3',
    coachName: 'Sophia Lin',
    coachPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=60',
    sessionType: 'Boat Setup',
    datetime: 'Fri, 9:00 AM',
    location: 'ABC Marina',
    focusAreas: ['rig tension', 'sail trim'],
    status: 'pending',
  },
];

const DEMO_COACHES = [
  {
    id: 'coach-1',
    name: 'Emily Carter',
    photo: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=120&q=60',
    bio: 'Olympic campaign strategist specializing in match racing & keelboats.',
    specialties: ['pre-starts', 'match racing', 'race strategy'],
    rating: 4.9,
    sessions: 318,
    price: '$240/hr',
    location: 'Royal Hong Kong YC',
  },
  {
    id: 'coach-2',
    name: 'Luke Anders',
    photo: 'https://images.unsplash.com/photo-1542144582-1ba00456b5d5?auto=format&fit=crop&w=120&q=60',
    bio: 'AC40 flight controller turned performance coach.',
    specialties: ['downwind modes', 'foiling', 'video analysis'],
    rating: 4.8,
    sessions: 204,
    price: '$200/hr',
    location: 'SailGP Programme',
  },
];

const DEMO_PROGRAMS = [
  {
    id: 'prog-1',
    title: 'Elite Start Line Mastery',
    subtitle: 'Six-week micro-season for one-design keelboats',
    duration: '6 weeks',
    focus: ['time & distance', 'mixed-fleet tactics'],
    color: '#DBEAFE',
  },
  {
    id: 'prog-2',
    title: 'Downwind VMG Accelerator',
    subtitle: 'Foiling & planing playbook with video-driven progression',
    duration: '4 weeks',
    focus: ['mode transitions', 'pressure mapping'],
    color: '#DCFCE7',
  },
];

export function EmbeddedCoachingDemo({
  highlightedFeature,
  onFeatureHighlight,
}: EmbeddedCoachingDemoProps) {
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to relevant section when feature is highlighted
  useEffect(() => {
    if (highlightedFeature && scrollViewRef.current && Platform.OS === 'web') {
      const sectionMap: Record<CoachFeatureId, string> = {
        'session-management': 'sessions-section',
        'client-acquisition': 'coaches-section',
        'program-building': 'programs-section',
        'video-analysis': 'sessions-section',
        'payment-processing': 'metrics-section',
        'progress-tracking': 'coaches-section',
        'earnings-dashboard': 'metrics-section',
        'automated-reminders': 'sessions-section',
      };

      const sectionId = sectionMap[highlightedFeature];
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [highlightedFeature]);

  // Inject scrollbar styles for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const styleId = 'coaching-demo-scrollbar-styles';
      if (document.getElementById(styleId)) return;

      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .coaching-demo-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .coaching-demo-scroll::-webkit-scrollbar-track {
          background: #F3F4F6;
          border-radius: 3px;
        }
        .coaching-demo-scroll::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 3px;
        }
        .coaching-demo-scroll::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
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

  const containerWidth = Math.min(width - 48, 500);

  return (
    <View style={[styles.container, { maxWidth: containerWidth }]}>
      {/* Header */}
      <LinearGradient
        colors={['#7C3AED', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerSubtitle}>COACHING WORKSPACE</Text>
        <Text style={styles.headerTitle}>Build elite race outcomes with world-class coaches</Text>
      </LinearGradient>

      {/* Scrollable content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        // @ts-ignore - web only className
        {...(Platform.OS === 'web' ? { className: 'coaching-demo-scroll' } : {})}
      >
        {/* Metrics Section */}
        <View style={styles.section} nativeID="metrics-section">
          <View style={styles.metricsGrid}>
            {DEMO_METRICS.map((metric) => (
              <View
                key={metric.label}
                style={[
                  styles.metricCard,
                  (highlightedFeature === 'earnings-dashboard' || highlightedFeature === 'payment-processing') &&
                    (metric.label === 'Revenue' || metric.label === 'Avg. rating') &&
                    styles.cardHighlighted,
                ]}
              >
                <View style={styles.metricIconContainer}>
                  <Ionicons name={metric.icon} size={18} color="#7C3AED" />
                </View>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricHelper}>{metric.helper}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sessions Section */}
        <View style={styles.section} nativeID="sessions-section">
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <Text style={styles.sectionLink}>View calendar</Text>
          </View>

          {DEMO_SESSIONS.map((session) => (
            <View
              key={session.id}
              style={[
                styles.sessionCard,
                (highlightedFeature === 'session-management' ||
                 highlightedFeature === 'automated-reminders' ||
                 highlightedFeature === 'video-analysis') &&
                  styles.cardHighlighted,
              ]}
            >
              <View style={styles.sessionHeader}>
                <View style={styles.sessionCoach}>
                  <Image
                    source={{ uri: session.coachPhoto }}
                    style={styles.sessionCoachPhoto}
                  />
                  <View>
                    <Text style={styles.sessionCoachName}>{session.coachName}</Text>
                    <Text style={styles.sessionDatetime}>{session.datetime}</Text>
                  </View>
                </View>
                <View style={styles.sessionTypeBadge}>
                  <Text style={styles.sessionTypeText}>{session.sessionType}</Text>
                </View>
              </View>
              <Text style={styles.sessionLocation}>{session.location}</Text>
              <View style={styles.focusTagsContainer}>
                {session.focusAreas.map((focus) => (
                  <View key={focus} style={styles.focusTag}>
                    <Text style={styles.focusTagText}>{focus}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Coach Spotlights Section */}
        <View style={styles.section} nativeID="coaches-section">
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Coach Spotlights</Text>
            <Text style={styles.sectionLink}>See all</Text>
          </View>

          {DEMO_COACHES.map((coach) => (
            <View
              key={coach.id}
              style={[
                styles.coachCard,
                (highlightedFeature === 'client-acquisition' ||
                 highlightedFeature === 'progress-tracking') &&
                  styles.cardHighlighted,
              ]}
            >
              <View style={styles.coachHeader}>
                <Image source={{ uri: coach.photo }} style={styles.coachPhoto} />
                <View style={styles.coachInfo}>
                  <Text style={styles.coachName}>{coach.name}</Text>
                  <Text style={styles.coachLocation}>{coach.location}</Text>
                  <View style={styles.coachStats}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.coachRating}>{coach.rating}</Text>
                    <Text style={styles.coachSessions}>{coach.sessions} sessions</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.coachBio} numberOfLines={2}>{coach.bio}</Text>
              <View style={styles.specialtiesContainer}>
                {coach.specialties.map((specialty) => (
                  <View key={specialty} style={styles.specialtyTag}>
                    <Text style={styles.specialtyTagText}>{specialty}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.coachFooter}>
                <Text style={styles.coachPrice}>{coach.price}</Text>
                <View style={styles.coachActions}>
                  <View style={styles.viewProfileButton}>
                    <Text style={styles.viewProfileText}>View</Text>
                  </View>
                  <View style={styles.bookButton}>
                    <Text style={styles.bookButtonText}>Book</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Programs Section */}
        <View style={styles.section} nativeID="programs-section">
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Structured Programs</Text>
            <Text style={styles.sectionLink}>Build custom</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.programsRow}>
              {DEMO_PROGRAMS.map((program) => (
                <View
                  key={program.id}
                  style={[
                    styles.programCard,
                    { backgroundColor: program.color },
                    highlightedFeature === 'program-building' && styles.cardHighlightedSubtle,
                  ]}
                >
                  <Text style={styles.programDuration}>{program.duration}</Text>
                  <Text style={styles.programTitle}>{program.title}</Text>
                  <Text style={styles.programSubtitle}>{program.subtitle}</Text>
                  <View style={styles.programFocusContainer}>
                    {program.focus.map((focus) => (
                      <View key={focus} style={styles.programFocusTag}>
                        <Text style={styles.programFocusText}>{focus}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        maxHeight: 650,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
      },
    }),
  },
  header: {
    padding: 20,
    paddingTop: 24,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionLink: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
  },
  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  metricHelper: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  // Sessions
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  sessionCoach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sessionCoachPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
  },
  sessionCoachName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  sessionDatetime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sessionTypeBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sessionTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
    textTransform: 'uppercase',
  },
  sessionLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  focusTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  focusTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  focusTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6D28D9',
  },
  // Coaches
  coachCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  coachHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  coachPhoto: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  coachLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  coachStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  coachRating: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
  },
  coachSessions: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  coachBio: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 10,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  specialtyTag: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  specialtyTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  coachFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  coachPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
  },
  coachActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewProfileButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  bookButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Programs
  programsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  programCard: {
    width: 220,
    borderRadius: 14,
    padding: 16,
  },
  programDuration: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  programTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  programSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  programFocusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  programFocusTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  programFocusText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4B5563',
  },
  // Highlighted states
  cardHighlighted: {
    borderColor: '#8B5CF6',
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.15)',
      },
    }),
  },
  cardHighlightedSubtle: {
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.2)',
      },
    }),
  },
});
