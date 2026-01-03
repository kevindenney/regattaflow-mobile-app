/**
 * Embedded Club Demo Component
 * Displays a demo of the club dashboard for the clubs landing page
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ClubFeatureId } from './ClubFeatureDescriptions';

interface EmbeddedClubDemoProps {
  highlightedFeature?: ClubFeatureId | null;
  onFeatureHighlight?: (featureId: ClubFeatureId | null) => void;
}

// Demo data
const DEMO_METRICS = [
  { label: 'Total entries', value: '156', helper: 'This season', icon: 'clipboard-outline' as const },
  { label: 'Pending payment', value: '12', helper: 'Awaiting', icon: 'card-outline' as const },
  { label: 'Collected', value: '$24.8k', helper: 'USD', icon: 'trending-up-outline' as const },
  { label: 'Members', value: '247', helper: 'Active', icon: 'people-outline' as const },
];

const DEMO_REGATTAS = [
  {
    id: 'regatta-1',
    name: 'Spring Championship Series',
    date: 'Mar 15-17',
    entries: '42/50',
    status: 'open',
    fee: '$125',
  },
  {
    id: 'regatta-2',
    name: 'Wednesday Evening Series',
    date: 'Apr 3 - Jun 26',
    entries: '64',
    status: 'open',
    fee: '$75',
  },
  {
    id: 'regatta-3',
    name: 'Junior Development Regatta',
    date: 'May 4-5',
    entries: '28/40',
    status: 'open',
    fee: '$50',
  },
];

const DEMO_MEMBERS = [
  {
    id: 'member-1',
    name: 'Sarah Chen',
    role: 'Admin',
    status: 'Active',
    memberNumber: '001',
  },
  {
    id: 'member-2',
    name: 'James Wilson',
    role: 'Race Officer',
    status: 'Active',
    memberNumber: '015',
  },
  {
    id: 'member-3',
    name: 'Maria Santos',
    role: 'Scorer',
    status: 'Active',
    memberNumber: '023',
  },
  {
    id: 'member-4',
    name: 'David Park',
    role: 'Member',
    status: 'Active',
    memberNumber: '089',
  },
];

const DEMO_ENTRIES = [
  {
    id: 'entry-1',
    regatta: 'Spring Championship',
    sailNumber: 'USA 1234',
    skipper: 'John Smith',
    status: 'confirmed',
    fee: '$125',
  },
  {
    id: 'entry-2',
    regatta: 'Spring Championship',
    sailNumber: 'GBR 567',
    skipper: 'Emma Wilson',
    status: 'pending',
    fee: '$125',
  },
  {
    id: 'entry-3',
    regatta: 'Wednesday Series',
    sailNumber: 'HKG 42',
    skipper: 'Michael Lee',
    status: 'confirmed',
    fee: '$75',
  },
];

export function EmbeddedClubDemo({
  highlightedFeature,
  onFeatureHighlight,
}: EmbeddedClubDemoProps) {
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to relevant section when feature is highlighted
  useEffect(() => {
    if (highlightedFeature && scrollViewRef.current && Platform.OS === 'web') {
      const sectionMap: Record<ClubFeatureId, string> = {
        'entry-management': 'entries-section',
        'live-scoring': 'regattas-section',
        'member-management': 'members-section',
        'volunteer-coordination': 'members-section',
        'document-automation': 'regattas-section',
        'white-label-microsites': 'metrics-section',
        'results-publishing': 'regattas-section',
        'payment-processing': 'entries-section',
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
      const styleId = 'club-demo-scrollbar-styles';
      if (document.getElementById(styleId)) return;

      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .club-demo-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .club-demo-scroll::-webkit-scrollbar-track {
          background: #F3F4F6;
          border-radius: 3px;
        }
        .club-demo-scroll::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 3px;
        }
        .club-demo-scroll::-webkit-scrollbar-thumb:hover {
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
        colors={['#047857', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerSubtitle}>CLUB DASHBOARD</Text>
        <Text style={styles.headerTitle}>Royal Hong Kong Yacht Club</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>Admin Access</Text>
        </View>
      </LinearGradient>

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabs}>
            <View style={[styles.tab, styles.tabActive]}>
              <Ionicons name="grid-outline" size={14} color="#10B981" />
              <Text style={[styles.tabText, styles.tabTextActive]}>Overview</Text>
            </View>
            <View style={styles.tab}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.tabText}>Events</Text>
            </View>
            <View style={styles.tab}>
              <Ionicons name="card-outline" size={14} color="#6B7280" />
              <Text style={styles.tabText}>Entries</Text>
            </View>
            <View style={styles.tab}>
              <Ionicons name="people-outline" size={14} color="#6B7280" />
              <Text style={styles.tabText}>Members</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Scrollable content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        // @ts-ignore - web only className
        {...(Platform.OS === 'web' ? { className: 'club-demo-scroll' } : {})}
      >
        {/* Metrics Section */}
        <View style={styles.section} nativeID="metrics-section">
          <View style={styles.metricsGrid}>
            {DEMO_METRICS.map((metric) => (
              <View
                key={metric.label}
                style={[
                  styles.metricCard,
                  (highlightedFeature === 'white-label-microsites' ||
                   highlightedFeature === 'payment-processing') &&
                    styles.cardHighlighted,
                ]}
              >
                <View style={styles.metricIconContainer}>
                  <Ionicons name={metric.icon} size={18} color="#10B981" />
                </View>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricHelper}>{metric.helper}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Regattas Section */}
        <View style={styles.section} nativeID="regattas-section">
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Regattas</Text>
            <Text style={styles.sectionLink}>View all</Text>
          </View>

          {DEMO_REGATTAS.map((regatta) => (
            <View
              key={regatta.id}
              style={[
                styles.regattaCard,
                (highlightedFeature === 'live-scoring' ||
                 highlightedFeature === 'document-automation' ||
                 highlightedFeature === 'results-publishing') &&
                  styles.cardHighlighted,
              ]}
            >
              <View style={styles.regattaHeader}>
                <View style={styles.regattaInfo}>
                  <Text style={styles.regattaName}>{regatta.name}</Text>
                  <Text style={styles.regattaDate}>{regatta.date}</Text>
                </View>
                <View style={styles.regattaStatusBadge}>
                  <Text style={styles.regattaStatusText}>OPEN</Text>
                </View>
              </View>
              <View style={styles.regattaFooter}>
                <Text style={styles.regattaEntries}>{regatta.entries} entries</Text>
                <Text style={styles.regattaFee}>{regatta.fee}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Entries Section */}
        <View style={styles.section} nativeID="entries-section">
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Entries</Text>
            <Text style={styles.sectionLink}>View all</Text>
          </View>

          {DEMO_ENTRIES.map((entry) => (
            <View
              key={entry.id}
              style={[
                styles.entryCard,
                (highlightedFeature === 'entry-management' ||
                 highlightedFeature === 'payment-processing') &&
                  styles.cardHighlighted,
              ]}
            >
              <View style={styles.entryMain}>
                <Text style={styles.entrySailNumber}>{entry.sailNumber}</Text>
                <Text style={styles.entrySkipper}>{entry.skipper}</Text>
                <Text style={styles.entryRegatta}>{entry.regatta}</Text>
              </View>
              <View style={styles.entryRight}>
                <View style={[
                  styles.entryStatusBadge,
                  entry.status === 'pending' && styles.entryStatusPending
                ]}>
                  <Text style={[
                    styles.entryStatusText,
                    entry.status === 'pending' && styles.entryStatusTextPending
                  ]}>
                    {entry.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </Text>
                </View>
                <Text style={styles.entryFee}>{entry.fee}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Members Section */}
        <View style={styles.section} nativeID="members-section">
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Club Roster</Text>
            <Text style={styles.sectionLink}>Manage</Text>
          </View>

          {DEMO_MEMBERS.map((member) => (
            <View
              key={member.id}
              style={[
                styles.memberCard,
                (highlightedFeature === 'member-management' ||
                 highlightedFeature === 'volunteer-coordination') &&
                  styles.cardHighlighted,
              ]}
            >
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
              <View style={styles.memberBadge}>
                <Text style={styles.memberNumber}>#{member.memberNumber}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
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
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 10,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#10B981',
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
    color: '#10B981',
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
    backgroundColor: '#ECFDF5',
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
  // Regattas
  regattaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  regattaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  regattaInfo: {
    flex: 1,
  },
  regattaName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  regattaDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  regattaStatusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  regattaStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  regattaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  regattaEntries: {
    fontSize: 12,
    color: '#6B7280',
  },
  regattaFee: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  // Entries
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryMain: {
    flex: 1,
  },
  entrySailNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  entrySkipper: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  entryRegatta: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  entryStatusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  entryStatusPending: {
    backgroundColor: '#FEF3C7',
  },
  entryStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  entryStatusTextPending: {
    color: '#D97706',
  },
  entryFee: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Members
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  memberRole: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  memberBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Highlighted states
  cardHighlighted: {
    borderColor: '#10B981',
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.15)',
      },
    }),
  },
});
