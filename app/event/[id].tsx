/**
 * Participant Event View
 * View event details and register - no club admin permissions required
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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import EventService, {
  ClubEvent,
  EventRegistrationStats,
  EventDocument,
  EventRegistration,
} from '@/services/eventService';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';
import { useClubWorkspace } from '@/hooks/useClubWorkspace';
import { supabase } from '@/services/supabase';

export default function ParticipantEventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = id as string;
  const { user } = useAuth();
  const { hasManagementPrivileges, clubId: activeClubId } = useClubWorkspace();

  const [event, setEvent] = useState<ClubEvent | null>(null);
  const [isEventAdmin, setIsEventAdmin] = useState(false);
  const [stats, setStats] = useState<EventRegistrationStats | null>(null);
  const [documents, setDocuments] = useState<EventDocument[]>([]);
  const [myRegistration, setMyRegistration] = useState<EventRegistration | null>(null);
  const [canRegister, setCanRegister] = useState<{ canRegister: boolean; reason?: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventData();
  }, [eventId, user?.id]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const [eventData, statsData, docsData] = await Promise.all([
        EventService.getEvent(eventId),
        EventService.getRegistrationStats(eventId).catch(() => null),
        EventService.getEventDocuments(eventId).catch(() => []),
      ]);
      setEvent(eventData);
      setStats(statsData);
      // Only show public documents
      setDocuments(docsData.filter((doc) => doc.is_public));

      // Check if user is an admin for this event's club
      if (eventData?.club_id && hasManagementPrivileges && eventData.club_id === activeClubId) {
        setIsEventAdmin(true);
      }

      // Check user's registration status
      if (user?.id) {
        const [registrationCheck, userRegs] = await Promise.all([
          EventService.canRegister(eventId, user.id).catch(() => ({
            canRegister: false,
            reason: 'Unable to check registration status',
          })),
          EventService.getUserRegistrations(user.id).catch(() => []),
        ]);
        setCanRegister(registrationCheck);

        // Find registration for this event
        const existingReg = userRegs.find((r: any) => r.event_id === eventId);
        setMyRegistration(existingReg || null);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!event) return;

    try {
      await Share.share({
        title: event.title,
        message: `Check out ${event.title}\n${format(new Date(event.start_date), 'MMM dd, yyyy')}`,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  const handleRegister = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to register for this event.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    if (!canRegister?.canRegister) {
      Alert.alert('Cannot Register', canRegister?.reason || 'Registration is not available');
      return;
    }

    // Navigate to event registration form
    router.push(`/event/register/${eventId}`);
  };

  const handleOpenDocument = async (doc: EventDocument) => {
    try {
      await Linking.openURL(doc.file_url);
    } catch (error) {
      Alert.alert('Error', 'Could not open document');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration_open':
        return '#10B981';
      case 'registration_closed':
      case 'in_progress':
        return '#3B82F6';
      case 'completed':
        return '#64748B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#F59E0B';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'Registration Open';
      case 'registration_closed':
        return 'Registration Closed';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'published':
        return 'Published';
      default:
        return 'Draft';
    }
  };

  const getRegistrationStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'rejected':
        return '#EF4444';
      case 'waitlist':
        return '#8B5CF6';
      case 'withdrawn':
      case 'cancelled':
        return '#64748B';
      default:
        return '#94A3B8';
    }
  };

  const getDocumentIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'nor':
        return 'document-text';
      case 'si':
        return 'list';
      case 'results':
        return 'trophy';
      case 'course_map':
        return 'map';
      default:
        return 'document';
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <ThemedText style={styles.loadingText}>Loading event...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!event) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <ThemedText style={styles.errorTitle}>Event Not Found</ThemedText>
          <ThemedText style={styles.errorText}>
            This event may have been removed or is no longer available.
          </ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const statusColor = getStatusColor(event.status);
  const isRegistrationOpen =
    event.status === 'registration_open' ||
    (event.status === 'published' &&
      (!event.registration_opens || isPast(new Date(event.registration_opens))) &&
      (!event.registration_closes || isFuture(new Date(event.registration_closes))));

  const spotsRemaining =
    event.max_participants && stats ? event.max_participants - stats.approved_count : null;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {isEventAdmin && (
            <TouchableOpacity
              onPress={() => router.push(`/club/event/${eventId}`)}
              style={styles.headerButton}
            >
              <Ionicons name="build-outline" size={24} color="#0EA5E9" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <ThemedText style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(event.status)}
            </ThemedText>
          </View>

          <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>

          <View style={styles.eventTypeRow}>
            <Ionicons
              name={event.event_type === 'regatta' ? 'boat' : 'flag'}
              size={16}
              color="#64748B"
            />
            <ThemedText style={styles.eventType}>
              {event.event_type.replace('_', ' ')}
            </ThemedText>
          </View>

          {event.description && (
            <ThemedText style={styles.eventDescription}>{event.description}</ThemedText>
          )}
        </View>

        {/* My Registration Status */}
        {myRegistration && (
          <View style={styles.registrationStatusCard}>
            <View style={styles.registrationStatusHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <ThemedText style={styles.registrationStatusTitle}>You're Registered</ThemedText>
            </View>
            <View style={styles.registrationDetails}>
              <View style={styles.registrationRow}>
                <ThemedText style={styles.registrationLabel}>Status:</ThemedText>
                <View
                  style={[
                    styles.regStatusBadge,
                    { backgroundColor: `${getRegistrationStatusColor(myRegistration.status)}20` },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.regStatusText,
                      { color: getRegistrationStatusColor(myRegistration.status) },
                    ]}
                  >
                    {myRegistration.status.charAt(0).toUpperCase() + myRegistration.status.slice(1)}
                  </ThemedText>
                </View>
              </View>
              {myRegistration.boat_class && (
                <View style={styles.registrationRow}>
                  <ThemedText style={styles.registrationLabel}>Class:</ThemedText>
                  <ThemedText style={styles.registrationValue}>{myRegistration.boat_class}</ThemedText>
                </View>
              )}
              {myRegistration.sail_number && (
                <View style={styles.registrationRow}>
                  <ThemedText style={styles.registrationLabel}>Sail #:</ThemedText>
                  <ThemedText style={styles.registrationValue}>{myRegistration.sail_number}</ThemedText>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={20} color="#0EA5E9" />
            <ThemedText style={styles.statValue}>
              {format(new Date(event.start_date), 'MMM d')}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Start Date</ThemedText>
          </View>

          {stats && (
            <View style={styles.statCard}>
              <Ionicons name="people" size={20} color="#10B981" />
              <ThemedText style={styles.statValue}>{stats.approved_count}</ThemedText>
              <ThemedText style={styles.statLabel}>Registered</ThemedText>
            </View>
          )}

          {spotsRemaining !== null && (
            <View style={styles.statCard}>
              <Ionicons
                name={spotsRemaining > 0 ? 'ticket' : 'close-circle'}
                size={20}
                color={spotsRemaining > 0 ? '#F59E0B' : '#EF4444'}
              />
              <ThemedText style={styles.statValue}>
                {spotsRemaining > 0 ? spotsRemaining : 'Full'}
              </ThemedText>
              <ThemedText style={styles.statLabel}>
                {spotsRemaining > 0 ? 'Spots Left' : 'Waitlist Open'}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Event Details */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Event Details</ThemedText>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#64748B" />
              <View style={styles.detailText}>
                <ThemedText style={styles.detailLabel}>When</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}
                </ThemedText>
                <ThemedText style={styles.detailSubValue}>
                  {format(new Date(event.start_date), 'h:mm a')} -{' '}
                  {format(new Date(event.end_date), 'h:mm a')}
                </ThemedText>
              </View>
            </View>

            {event.registration_closes && isFuture(new Date(event.registration_closes)) && (
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color="#F59E0B" />
                <View style={styles.detailText}>
                  <ThemedText style={styles.detailLabel}>Registration Closes</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {formatDistanceToNow(new Date(event.registration_closes), { addSuffix: true })}
                  </ThemedText>
                  <ThemedText style={styles.detailSubValue}>
                    {format(new Date(event.registration_closes), 'MMM d, yyyy h:mm a')}
                  </ThemedText>
                </View>
              </View>
            )}

            {event.registration_fee && event.registration_fee > 0 && (
              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={20} color="#10B981" />
                <View style={styles.detailText}>
                  <ThemedText style={styles.detailLabel}>Entry Fee</ThemedText>
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
                  <ThemedText style={styles.detailValue}>{event.boat_classes.join(', ')}</ThemedText>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Documents */}
        {documents.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Documents</ThemedText>

            {documents.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.documentCard}
                onPress={() => handleOpenDocument(doc)}
              >
                <View style={styles.documentIcon}>
                  <Ionicons name={getDocumentIcon(doc.document_type)} size={24} color="#0EA5E9" />
                </View>
                <View style={styles.documentInfo}>
                  <ThemedText style={styles.documentTitle}>{doc.title}</ThemedText>
                  <ThemedText style={styles.documentType}>
                    {doc.document_type.toUpperCase()} • v{doc.version}
                  </ThemedText>
                </View>
                <Ionicons name="open-outline" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Contact Info */}
        {(event.contact_email || event.contact_phone) && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Contact</ThemedText>

            <View style={styles.contactCard}>
              {event.contact_email && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => Linking.openURL(`mailto:${event.contact_email}`)}
                >
                  <Ionicons name="mail-outline" size={20} color="#0EA5E9" />
                  <ThemedText style={styles.contactValue}>{event.contact_email}</ThemedText>
                </TouchableOpacity>
              )}
              {event.contact_phone && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => Linking.openURL(`tel:${event.contact_phone}`)}
                >
                  <Ionicons name="call-outline" size={20} color="#0EA5E9" />
                  <ThemedText style={styles.contactValue}>{event.contact_phone}</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Bottom spacing for CTA */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky CTA */}
      {!myRegistration && isRegistrationOpen && (
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={[
              styles.ctaButton,
              !canRegister?.canRegister && styles.ctaButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={!canRegister?.canRegister && !!user}
          >
            <Ionicons name="boat" size={20} color="#FFFFFF" />
            <ThemedText style={styles.ctaButtonText}>
              {!user
                ? 'Sign In to Register'
                : canRegister?.canRegister
                ? 'Register for Event'
                : canRegister?.reason || 'Registration Unavailable'}
            </ThemedText>
          </TouchableOpacity>
          {event.registration_fee && event.registration_fee > 0 && (
            <ThemedText style={styles.ctaSubtext}>
              {event.currency} {event.registration_fee.toFixed(2)} entry fee
            </ThemedText>
          )}
        </View>
      )}

      {/* Closed Registration Message */}
      {!myRegistration && !isRegistrationOpen && event.status !== 'cancelled' && (
        <View style={styles.ctaContainer}>
          <View style={styles.closedBanner}>
            <Ionicons name="lock-closed" size={20} color="#64748B" />
            <ThemedText style={styles.closedText}>
              {event.status === 'completed'
                ? 'This event has ended'
                : 'Registration is currently closed'}
            </ThemedText>
          </View>
        </View>
      )}
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
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  errorText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  eventTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textTransform: 'capitalize',
  },
  eventDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  registrationStatusCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  registrationStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  registrationStatusTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#065F46',
  },
  registrationDetails: {
    gap: 8,
  },
  registrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  registrationLabel: {
    fontSize: 14,
    color: '#065F46',
  },
  registrationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  regStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  regStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  detailSubValue: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  documentType: {
    fontSize: 12,
    color: '#64748B',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contactValue: {
    fontSize: 15,
    color: '#0EA5E9',
    fontWeight: '500',
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0EA5E9',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 10,
    width: '100%',
  },
  ctaButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctaSubtext: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
    width: '100%',
  },
  closedText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
});

