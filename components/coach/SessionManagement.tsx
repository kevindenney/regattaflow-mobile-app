import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '@/lib/utils/crossPlatformAlert';
import { useAuth } from '../../contexts/AuthContext';
import { CoachingSession, SessionStatus } from '../../types/coach';
import { CoachMarketplaceService } from '@/services/CoachingService';

type TabType = 'upcoming' | 'past' | 'cancelled';

interface SessionManagementProps {
  /** 'student' shows sessions where user is the sailor, 'coach' shows sessions where user is the coach */
  role?: 'student' | 'coach';
}

export default function SessionManagement({ role = 'student' }: SessionManagementProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, role]);

  const loadSessions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userSessions = await CoachMarketplaceService.getUserSessions(user.id, role);
      setSessions(userSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      showAlert('Error', 'Failed to load your sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = (session: CoachingSession) => {
    router.push({
      pathname: '/coach/cancel-session',
      params: { sessionId: session.id },
    });
  };

  const handleCompleteSession = (session: CoachingSession) => {
    router.push({
      pathname: '/coach/complete-session',
      params: { sessionId: session.id },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const getSessionsByTab = (tab: TabType) => {
    const now = new Date();
    switch (tab) {
      case 'upcoming':
        return sessions.filter(
          session =>
            new Date(session.scheduled_start) > now &&
            ['pending', 'confirmed'].includes(session.status)
        );
      case 'past':
        return sessions.filter(
          session =>
            new Date(session.scheduled_start) <= now ||
            session.status === 'completed'
        );
      case 'cancelled':
        return sessions.filter(session => session.status === 'cancelled');
      default:
        return [];
    }
  };

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case 'pending': return '#FF8800';
      case 'confirmed': return '#00AA33';
      case 'completed': return '#0066CC';
      case 'cancelled': return '#FF4444';
      case 'no_show': return '#666';
      default: return '#666';
    }
  };

  const getStatusText = (status: SessionStatus) => {
    switch (status) {
      case 'pending': return 'Pending Confirmation';
      case 'confirmed': return 'Confirmed';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'no_show': return 'No Show';
      default: return status;
    }
  };

  /** Cancel is allowed at any time window — the refund amount adjusts based on proximity to session */
  const canCancelSession = (session: CoachingSession) => {
    return ['pending', 'confirmed'].includes(session.status);
  };

  /** Complete is available on confirmed sessions whose scheduled time has passed */
  const canCompleteSession = (session: CoachingSession) => {
    const sessionStart = new Date(session.scheduled_start);
    const now = new Date();
    const isPast = sessionStart <= now;
    const validStatus = ['confirmed', 'scheduled', 'in_progress'].includes(session.status);
    return isPast && validStatus;
  };

  const canJoinSession = (session: CoachingSession) => {
    const sessionStart = new Date(session.scheduled_start);
    const sessionEnd = new Date(session.scheduled_end);
    const now = new Date();
    return now >= sessionStart && now <= sessionEnd && session.status === 'confirmed';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading your sessions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Sessions</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['upcoming', 'past', 'cancelled'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sessions List */}
      <ScrollView style={styles.sessionsList} showsVerticalScrollIndicator={false}>
        {getSessionsByTab(activeTab).map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                <Text style={styles.sessionCoach}>
                  with {session.coach_profiles?.first_name} {session.coach_profiles?.last_name}
                </Text>
              </View>
              <View style={styles.sessionPrice}>
                <Text style={styles.priceText}>{formatPrice(session.total_amount)}</Text>
              </View>
            </View>

            <View style={styles.sessionDetails}>
              <Text style={styles.sessionDate}>
                📅 {formatDate(session.scheduled_start)} at {formatTime(session.scheduled_start)}
              </Text>
              <Text style={styles.sessionDuration}>
                ⏱ {Math.round((new Date(session.scheduled_end).getTime() - new Date(session.scheduled_start).getTime()) / (1000 * 60))} minutes
              </Text>
            </View>

            <View style={styles.sessionStatus}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(session.status) }
                ]}
              >
                <Text style={styles.statusText}>{getStatusText(session.status)}</Text>
              </View>
            </View>

            {session.student_goals && (
              <View style={styles.sessionGoals}>
                <Text style={styles.goalsLabel}>Your Goals:</Text>
                <Text style={styles.goalsText}>{session.student_goals}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.sessionActions}>
              {canJoinSession(session) && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.joinButton]}
                  onPress={() => showAlert('Join Session', 'This would open the video call interface.')}
                >
                  <Text style={styles.actionButtonText}>Join Session</Text>
                </TouchableOpacity>
              )}

              {activeTab === 'upcoming' && session.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.rescheduleButton]}
                  onPress={() => showAlert('Reschedule', 'Rescheduling interface would open here.')}
                >
                  <Text style={[styles.actionButtonText, styles.rescheduleButtonText]}>
                    Reschedule
                  </Text>
                </TouchableOpacity>
              )}

              {canCancelSession(session) && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleCancelSession(session)}
                >
                  <Ionicons name="close-circle-outline" size={16} color="#FF4444" />
                  <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}

              {canCompleteSession(session) && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={() => handleCompleteSession(session)}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
                  <Text style={[styles.actionButtonText, styles.completeButtonText]}>
                    Complete
                  </Text>
                </TouchableOpacity>
              )}

              {activeTab === 'past' && session.status === 'completed' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.reviewButton]}
                  onPress={() => showAlert('Review', 'Review interface would open here')}
                >
                  <Text style={[styles.actionButtonText, styles.reviewButtonText]}>
                    Write Review
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {getSessionsByTab(activeTab).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming' && 'No upcoming sessions'}
              {activeTab === 'past' && 'No past sessions'}
              {activeTab === 'cancelled' && 'No cancelled sessions'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming' && 'Book a session with a coach to get started!'}
              {activeTab === 'past' && 'Your completed sessions will appear here.'}
              {activeTab === 'cancelled' && 'Cancelled sessions will appear here.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#0066CC',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  sessionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sessionCoach: {
    fontSize: 14,
    color: '#666',
  },
  sessionPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  sessionDetails: {
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  sessionDuration: {
    fontSize: 14,
    color: '#333',
  },
  sessionStatus: {
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sessionGoals: {
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  goalsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  goalsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
  },
  joinButton: {
    backgroundColor: '#00AA33',
  },
  rescheduleButton: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  completeButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  reviewButton: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rescheduleButtonText: {
    color: '#FF8800',
  },
  cancelButtonText: {
    color: '#FF4444',
  },
  completeButtonText: {
    color: '#059669',
  },
  reviewButtonText: {
    color: '#0066CC',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
