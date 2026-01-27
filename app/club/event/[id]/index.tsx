/**
 * Event Detail Screen
 * View event details with edit/delete capabilities and navigation to entries/documents
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import EventService, { ClubEvent, EventRegistrationStats } from '@/services/eventService';
import { format } from 'date-fns';
import { useClubWorkspace } from '@/hooks/useClubWorkspace';

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = id as string;
  const { clubId, loading: personaLoading, refresh: refreshPersonaContext } = useClubWorkspace();

  const [event, setEvent] = useState<ClubEvent | null>(null);
  const [stats, setStats] = useState<EventRegistrationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) return;
    loadEvent();
  }, [eventId, clubId]);

  const loadEvent = async () => {
    if (!clubId) return;
    try {
      setLoading(true);
      const [eventData, statsData] = await Promise.all([
        EventService.getEvent(eventId),
        EventService.getRegistrationStats(eventId),
      ]);
      setEvent(eventData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Error', 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await EventService.deleteEvent(eventId);
              Alert.alert('Success', 'Event deleted', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/events') },
              ]);
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const handlePublish = async () => {
    try {
      await EventService.publishEvent(eventId);
      await loadEvent();
      Alert.alert('Success', 'Event published');
    } catch (error) {
      console.error('Error publishing event:', error);
      Alert.alert('Error', 'Failed to publish event');
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Event',
      'Are you sure you want to cancel this event?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel Event',
          style: 'destructive',
          onPress: async () => {
            try {
              await EventService.cancelEvent(eventId);
              await loadEvent();
              Alert.alert('Success', 'Event cancelled');
            } catch (error) {
              console.error('Error cancelling event:', error);
              Alert.alert('Error', 'Failed to cancel event');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!event) return;

    const message = `Check out ${event.title}\n${format(new Date(event.start_date), 'MMM dd, yyyy')}`;
    try {
      if (Platform.OS === 'web') {
        const nav = typeof navigator !== 'undefined' ? navigator : undefined;
        if (nav?.share) {
          await nav.share({ title: event.title, text: message });
        } else if (nav?.clipboard?.writeText) {
          await nav.clipboard.writeText(message);
          Alert.alert('Copied', 'Event details copied to clipboard');
        }
      } else {
        await Share.share({
          title: event.title,
          message,
        });
      }
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration_open':
        return '#10B981';
      case 'registration_closed':
      case 'in_progress':
        return '#007AFF';
      case 'completed':
        return '#64748B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#F59E0B';
    }
  };

  if (personaLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      </ThemedView>
    );
  }

  if (!clubId) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.missingContainer}>
          <Ionicons name="people-circle-outline" size={48} color="#94A3B8" />
          <ThemedText style={styles.missingTitle}>Connect Your Club Workspace</ThemedText>
          <ThemedText style={styles.missingDescription}>
            This event lives inside a club workspace. Finish onboarding or refresh your connection to manage it.
          </ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={refreshPersonaContext}>
            <ThemedText style={styles.retryButtonText}>Retry Connection</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryLink}
            onPress={() => router.push('/(auth)/club-onboarding-chat')}
          >
            <ThemedText style={styles.secondaryLinkText}>Open Club Onboarding</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ThemedView>
    );
  }

  if (!event) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <ThemedText style={styles.errorText}>Event not found</ThemedText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)/events')}
          >
            <ThemedText style={styles.backButtonText}>Back to Events</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const statusColor = getStatusColor(event.status);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Header */}
        <View style={styles.eventHeader}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <ThemedText style={[styles.statusText, { color: statusColor }]}>
              {event.status.replace('_', ' ')}
            </ThemedText>
          </View>
          <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
          <ThemedText style={styles.eventType}>{event.event_type.replace('_', ' ')}</ThemedText>
          {event.description && (
            <ThemedText style={styles.eventDescription}>{event.description}</ThemedText>
          )}
        </View>

        {/* Stats */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color="#007AFF" />
              <ThemedText style={styles.statValue}>{stats.approved_count}</ThemedText>
              <ThemedText style={styles.statLabel}>Registered</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color="#F59E0B" />
              <ThemedText style={styles.statValue}>{stats.pending_count}</ThemedText>
              <ThemedText style={styles.statLabel}>Pending</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="list" size={24} color="#3B82F6" />
              <ThemedText style={styles.statValue}>{stats.waitlist_count}</ThemedText>
              <ThemedText style={styles.statLabel}>Waitlist</ThemedText>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push(`/club/event/${eventId}/entries`)}
          >
            <View style={styles.actionCardLeft}>
              <Ionicons name="people-outline" size={28} color="#007AFF" />
              <View style={styles.actionCardText}>
                <ThemedText style={styles.actionCardTitle}>Manage Entries</ThemedText>
                <ThemedText style={styles.actionCardSubtitle}>
                  View and approve registrations
                </ThemedText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push(`/club/event/${eventId}/documents`)}
          >
            <View style={styles.actionCardLeft}>
              <Ionicons name="documents-outline" size={28} color="#007AFF" />
              <View style={styles.actionCardText}>
                <ThemedText style={styles.actionCardTitle}>Event Documents</ThemedText>
                <ThemedText style={styles.actionCardSubtitle}>
                  NOR, SIs, and results
                </ThemedText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Event Details */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Event Details</ThemedText>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#64748B" />
            <View style={styles.detailText}>
              <ThemedText style={styles.detailLabel}>Start Date</ThemedText>
              <ThemedText style={styles.detailValue}>
                {format(new Date(event.start_date), 'EEEE, MMMM dd, yyyy HH:mm')}
              </ThemedText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#64748B" />
            <View style={styles.detailText}>
              <ThemedText style={styles.detailLabel}>End Date</ThemedText>
              <ThemedText style={styles.detailValue}>
                {format(new Date(event.end_date), 'EEEE, MMMM dd, yyyy HH:mm')}
              </ThemedText>
            </View>
          </View>

          {event.registration_opens && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color="#64748B" />
              <View style={styles.detailText}>
                <ThemedText style={styles.detailLabel}>Registration Opens</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {format(new Date(event.registration_opens), 'MMM dd, yyyy HH:mm')}
                </ThemedText>
              </View>
            </View>
          )}

          {event.registration_closes && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color="#64748B" />
              <View style={styles.detailText}>
                <ThemedText style={styles.detailLabel}>Registration Closes</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {format(new Date(event.registration_closes), 'MMM dd, yyyy HH:mm')}
                </ThemedText>
              </View>
            </View>
          )}

          {event.max_participants && (
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={20} color="#64748B" />
              <View style={styles.detailText}>
                <ThemedText style={styles.detailLabel}>Max Participants</ThemedText>
                <ThemedText style={styles.detailValue}>{event.max_participants}</ThemedText>
              </View>
            </View>
          )}

          {event.registration_fee && (
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={20} color="#64748B" />
              <View style={styles.detailText}>
                <ThemedText style={styles.detailLabel}>Registration Fee</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {event.currency} {event.registration_fee.toFixed(2)}
                </ThemedText>
              </View>
            </View>
          )}

          {event.boat_classes && event.boat_classes.length > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="boat-outline" size={20} color="#64748B" />
              <View style={styles.detailText}>
                <ThemedText style={styles.detailLabel}>Boat Classes</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {event.boat_classes.join(', ')}
                </ThemedText>
              </View>
            </View>
          )}

          {event.contact_email && (
            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={20} color="#64748B" />
              <View style={styles.detailText}>
                <ThemedText style={styles.detailLabel}>Contact Email</ThemedText>
                <ThemedText style={styles.detailValue}>{event.contact_email}</ThemedText>
              </View>
            </View>
          )}

          {event.contact_phone && (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={20} color="#64748B" />
              <View style={styles.detailText}>
                <ThemedText style={styles.detailLabel}>Contact Phone</ThemedText>
                <ThemedText style={styles.detailValue}>{event.contact_phone}</ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* Event Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Event Actions</ThemedText>

          {event.status === 'draft' && (
            <TouchableOpacity style={styles.primaryButton} onPress={handlePublish}>
              <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
              <ThemedText style={styles.primaryButtonText}>Publish Event</ThemedText>
            </TouchableOpacity>
          )}

          {event.status !== 'cancelled' && event.status !== 'completed' && (
            <TouchableOpacity style={styles.dangerButton} onPress={handleCancel}>
              <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />
              <ThemedText style={styles.dangerButtonText}>Cancel Event</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F8FAFC',
  },
  missingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  missingDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0EA5E9',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryLink: {
    marginTop: 16,
  },
  secondaryLinkText: {
    color: '#0EA5E9',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  eventHeader: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  eventType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'capitalize',
    marginBottom: 12,
  },
  eventDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  actionCardText: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
