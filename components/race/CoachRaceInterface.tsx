import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';

interface CoachingSession {
  id: string;
  studentName: string;
  venue: string;
  date: string;
  focus: string;
  performance: number; // 1-10 rating
}

interface StudentProgress {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  currentRating: number;
  improvement: number;
  sessions: number;
}

export function CoachRaceInterface() {
  const [selectedTab, setSelectedTab] = useState<'students' | 'sessions' | 'analytics' | 'marketplace'>('students');

  // Mock coaching data
  const mockSessions: CoachingSession[] = [
    {
      id: '1',
      studentName: 'Alex Chen',
      venue: 'Victoria Harbor',
      date: '2025-03-01',
      focus: 'Start line tactics',
      performance: 8
    },
    {
      id: '2',
      studentName: 'Maria Rodriguez',
      venue: 'Deep Water Bay',
      date: '2025-02-28',
      focus: 'Mark rounding technique',
      performance: 7
    },
    {
      id: '3',
      studentName: 'John Smith',
      venue: 'Aberdeen Harbor',
      date: '2025-02-25',
      focus: 'Weather strategy',
      performance: 9
    }
  ];

  const mockStudents: StudentProgress[] = [
    {
      id: '1',
      name: 'Alex Chen',
      level: 'intermediate',
      currentRating: 1425,
      improvement: 8.5,
      sessions: 12
    },
    {
      id: '2',
      name: 'Maria Rodriguez',
      level: 'beginner',
      currentRating: 1180,
      improvement: 15.2,
      sessions: 8
    },
    {
      id: '3',
      name: 'John Smith',
      level: 'advanced',
      currentRating: 1650,
      improvement: 3.1,
      sessions: 24
    }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#22C55E';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 8) return '#22C55E';
    if (performance >= 6) return '#F59E0B';
    return '#EF4444';
  };

  const TabButton = ({
    id,
    label,
    active
  }: {
    id: typeof selectedTab;
    label: string;
    active: boolean
  }) => (
    <Button
      variant={active ? "default" : "outline"}
      onPress={() => setSelectedTab(id)}
      style={styles.tabButton}
    >
      <ThemedText type="defaultSemiBold" style={{
        color: active ? '#fff' : '#0066CC'
      }}>
        {label}
      </ThemedText>
    </Button>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title">🧑‍🏫 Coach Dashboard</ThemedText>
        <ThemedText type="subtitle">Student performance and race analytics</ThemedText>
      </View>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        <TabButton id="students" label="👨‍🎓 Students" active={selectedTab === 'students'} />
        <TabButton id="sessions" label="📚 Sessions" active={selectedTab === 'sessions'} />
        <TabButton id="analytics" label="📊 Analytics" active={selectedTab === 'analytics'} />
        <TabButton id="marketplace" label="💼 Marketplace" active={selectedTab === 'marketplace'} />
      </ScrollView>

      {/* Content Area */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {selectedTab === 'students' && (
          <View style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>👨‍🎓 Student Progress</ThemedText>

            {mockStudents.map((student) => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentHeader}>
                  <View style={styles.studentInfo}>
                    <ThemedText style={styles.studentName}>{student.name}</ThemedText>
                    <View style={styles.studentMeta}>
                      <View style={[styles.levelBadge, { backgroundColor: getLevelColor(student.level) }]}>
                        <ThemedText style={styles.levelText}>
                          {student.level.charAt(0).toUpperCase() + student.level.slice(1)}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.sessionCount}>{student.sessions} sessions</ThemedText>
                    </View>
                  </View>
                  <View style={styles.ratingContainer}>
                    <ThemedText style={styles.ratingValue}>{student.currentRating}</ThemedText>
                    <ThemedText style={styles.ratingLabel}>Rating</ThemedText>
                  </View>
                </View>

                <View style={styles.studentStats}>
                  <View style={styles.statItem}>
                    <ThemedText style={[styles.statValue, { color: student.improvement > 5 ? '#22C55E' : '#F59E0B' }]}>
                      +{student.improvement}%
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>Improvement</ThemedText>
                  </View>
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statValue}>
                      {Math.floor(Math.random() * 5 + 6)}/10
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>Last Session</ThemedText>
                  </View>
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statValue}>
                      {Math.floor(Math.random() * 3 + 1)} days
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>Since Session</ThemedText>
                  </View>
                </View>

                <View style={styles.studentActions}>
                  <Button variant="default" style={styles.actionButton} onPress={() => {}}>
                    <ThemedText style={{ color: '#fff' }}>📊 View Progress</ThemedText>
                  </Button>
                  <Button variant="outline" style={styles.actionButton} onPress={() => {}}>
                    <ThemedText style={{ color: '#0066CC' }}>📅 Schedule Session</ThemedText>
                  </Button>
                </View>
              </View>
            ))}
          </View>
        )}

        {selectedTab === 'sessions' && (
          <View style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>📚 Recent Coaching Sessions</ThemedText>

            {mockSessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <ThemedText style={styles.sessionStudent}>{session.studentName}</ThemedText>
                  <View style={[styles.performanceBadge, { backgroundColor: getPerformanceColor(session.performance) }]}>
                    <ThemedText style={styles.performanceText}>{session.performance}/10</ThemedText>
                  </View>
                </View>

                <View style={styles.sessionDetails}>
                  <ThemedText style={styles.sessionFocus}>🎯 Focus: {session.focus}</ThemedText>
                  <ThemedText style={styles.sessionVenue}>📍 Venue: {session.venue}</ThemedText>
                  <ThemedText style={styles.sessionDate}>📅 Date: {new Date(session.date).toLocaleDateString()}</ThemedText>
                </View>

                <Button variant="outline" style={styles.sessionButton} onPress={() => {}}>
                  <ThemedText style={{ color: '#0066CC' }}>📝 View Session Notes</ThemedText>
                </Button>
              </View>
            ))}

            <Button style={styles.primaryButton} onPress={() => {}}>
              <ThemedText style={{ color: '#fff' }}>➕ Schedule New Session</ThemedText>
            </Button>
          </View>
        )}

        {selectedTab === 'analytics' && (
          <View style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>📊 Performance Analytics</ThemedText>

            <View style={styles.analyticsCard}>
              <ThemedText style={styles.cardTitle}>📈 Coaching Insights</ThemedText>
              <ThemedText style={styles.cardDescription}>
                Advanced analytics to track student progress and optimize coaching effectiveness
              </ThemedText>

              <View style={styles.analyticsFeatures}>
                <View style={styles.featureItem}>
                  <ThemedText style={styles.featureIcon}>📊</ThemedText>
                  <View style={styles.featureContent}>
                    <ThemedText style={styles.featureTitle}>Performance Trends</ThemedText>
                    <ThemedText style={styles.featureDescription}>
                      Track student improvement over time across different skills
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <ThemedText style={styles.featureIcon}>🏆</ThemedText>
                  <View style={styles.featureContent}>
                    <ThemedText style={styles.featureTitle}>Race Results Correlation</ThemedText>
                    <ThemedText style={styles.featureDescription}>
                      Connect coaching sessions to actual race performance
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <ThemedText style={styles.featureIcon}>🎯</ThemedText>
                  <View style={styles.featureContent}>
                    <ThemedText style={styles.featureTitle}>Venue-Specific Analysis</ThemedText>
                    <ThemedText style={styles.featureDescription}>
                      Performance insights tailored to different sailing venues
                    </ThemedText>
                  </View>
                </View>
              </View>

              <Button style={styles.primaryButton} onPress={() => {}}>
                <ThemedText style={{ color: '#fff' }}>📊 View Full Analytics</ThemedText>
              </Button>
            </View>
          </View>
        )}

        {selectedTab === 'marketplace' && (
          <View style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>💼 Coach Marketplace</ThemedText>

            <View style={styles.marketplaceCard}>
              <ThemedText style={styles.cardTitle}>🌟 Professional Coaching</ThemedText>
              <ThemedText style={styles.cardDescription}>
                Connect with sailors worldwide and grow your coaching practice
              </ThemedText>

              <View style={styles.marketplaceStats}>
                <View style={styles.marketplaceStat}>
                  <ThemedText style={styles.marketplaceValue}>4.9</ThemedText>
                  <ThemedText style={styles.marketplaceLabel}>⭐ Rating</ThemedText>
                </View>
                <View style={styles.marketplaceStat}>
                  <ThemedText style={styles.marketplaceValue}>147</ThemedText>
                  <ThemedText style={styles.marketplaceLabel}>💬 Reviews</ThemedText>
                </View>
                <View style={styles.marketplaceStat}>
                  <ThemedText style={styles.marketplaceValue}>89</ThemedText>
                  <ThemedText style={styles.marketplaceLabel}>👨‍🎓 Students</ThemedText>
                </View>
              </View>

              <View style={styles.marketplaceFeatures}>
                <ThemedText style={styles.marketplaceFeature}>✅ Global venue expertise</ThemedText>
                <ThemedText style={styles.marketplaceFeature}>✅ Multi-language support</ThemedText>
                <ThemedText style={styles.marketplaceFeature}>✅ Flexible scheduling</ThemedText>
                <ThemedText style={styles.marketplaceFeature}>✅ Performance tracking included</ThemedText>
              </View>

              <View style={styles.marketplaceActions}>
                <Button variant="outline" style={styles.actionButton} onPress={() => {}}>
                  <ThemedText style={{ color: '#0066CC' }}>⚙️ Manage Profile</ThemedText>
                </Button>
                <Button style={styles.actionButton} onPress={() => {}}>
                  <ThemedText style={{ color: '#fff' }}>📈 View Earnings</ThemedText>
                </Button>
              </View>
            </View>

            <View style={styles.bookingCard}>
              <ThemedText style={styles.cardTitle}>📅 Upcoming Bookings</ThemedText>
              <ThemedText style={styles.bookingText}>• Alex Chen - March 5th, 2:00 PM (Victoria Harbor)</ThemedText>
              <ThemedText style={styles.bookingText}>• Maria Rodriguez - March 7th, 10:00 AM (Deep Water Bay)</ThemedText>
              <ThemedText style={styles.bookingText}>• John Smith - March 10th, 4:00 PM (Aberdeen Harbor)</ThemedText>

              <Button variant="outline" style={styles.bookingButton} onPress={() => {}}>
                <ThemedText style={{ color: '#0066CC' }}>📅 Manage Bookings</ThemedText>
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    boxShadow: '0px 1px',
    gap: 12,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentInfo: {
    flex: 1,
    gap: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  sessionCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  ratingLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  studentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  studentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    boxShadow: '0px 1px',
    gap: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionStudent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  performanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  performanceText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  sessionDetails: {
    gap: 4,
  },
  sessionFocus: {
    fontSize: 14,
    color: '#374151',
  },
  sessionVenue: {
    fontSize: 14,
    color: '#6B7280',
  },
  sessionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  sessionButton: {
    alignSelf: 'flex-start',
  },
  primaryButton: {
    backgroundColor: '#0066CC',
  },
  analyticsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    boxShadow: '0px 1px',
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  analyticsFeatures: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 12,
  },
  featureIcon: {
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  featureContent: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  featureDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  marketplaceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    boxShadow: '0px 1px',
    gap: 16,
  },
  marketplaceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  marketplaceStat: {
    alignItems: 'center',
    gap: 4,
  },
  marketplaceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  marketplaceLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  marketplaceFeatures: {
    gap: 8,
  },
  marketplaceFeature: {
    fontSize: 14,
    color: '#374151',
  },
  marketplaceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    boxShadow: '0px 1px',
    gap: 12,
  },
  bookingText: {
    fontSize: 14,
    color: '#374151',
  },
  bookingButton: {
    alignSelf: 'flex-start',
  },
});