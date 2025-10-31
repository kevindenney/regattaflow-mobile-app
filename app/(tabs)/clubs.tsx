import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { useClubs } from '@/hooks/useData';
import { useAuth } from '@/providers/AuthProvider';
import {
  ClubIntegrationSnapshot,
  ClubDocumentSnapshot,
  useClubIntegrationSnapshots,
} from '@/hooks/useClubIntegrationSnapshots';
import yachtClubsDirectory from '@/data/yacht-clubs.json';
import {
  bulkUpsertUserManualClubs,
  deleteUserManualClub,
  fetchUserManualClubs,
  upsertUserManualClub,
} from '@/services/userManualClubsService';
import {
  ClubRole,
  getClubRoleDefinition,
  hasAdminAccess,
  isManagementRole,
  normalizeClubRole,
} from '@/types/club';

type ManualClub = {
  id: string;
  name: string;
  relationship: string;
  notes?: string;
  addedAt: string;
};

const MANUAL_STORAGE_KEY = '@regattaflow/manual_clubs_tracker';

const formatDate = (iso?: string | null) => {
  if (!iso) return 'TBD';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const formatLongDate = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const directoryClubs = Object.values((yachtClubsDirectory as any).clubs || {}).map(
  (club: any) => ({
    id: club.id || club.slug,
    name: club.name,
    tagline: club.overview?.summary || club.description || '',
    country: club.country || club.region || '',
    website: club.website,
    founded: club.founded || club.headquarters?.established || null,
    headquarters: club.headquarters?.name || '',
    membershipTotal: club.membership?.total || null,
    reciprocal: club.membership?.reciprocal || [],
  })
);

type AdminActionConfig = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  roles?: ClubRole[];
};

const ADMIN_ACTIONS: AdminActionConfig[] = [
  {
    id: 'create-regatta',
    title: 'Create Regatta',
    description: 'Set dates, fleets, scoring, and registration windows.',
    emoji: '📅',
    roles: ['admin', 'race_officer', 'sailing_manager'],
  },
  {
    id: 'manage-entries',
    title: 'Manage Entries & Payments',
    description: 'Review entries, reconcile payments, issue refunds.',
    emoji: '💳',
    roles: ['admin', 'treasurer'],
  },
  {
    id: 'publish-documents',
    title: 'Publish Race Documents',
    description: 'Upload NORs, SIs, and automate expiry reminders.',
    emoji: '📄',
    roles: ['admin', 'communications', 'race_officer'],
  },
  {
    id: 'configure-microsite',
    title: 'Configure Microsite & Widgets',
    description: 'Brand the public site and embed live widgets.',
    emoji: '🖥️',
    roles: ['admin', 'communications'],
  },
  {
    id: 'membership-approvals',
    title: 'Membership & Roles',
    description: 'Approve applications and assign club roles.',
    emoji: '✅',
    roles: ['admin', 'membership_manager'],
  },
  {
    id: 'volunteer-roster',
    title: 'Volunteer & RC Roster',
    description: 'Assign PRO, signal boats, and volunteer shifts.',
    emoji: '🚩',
    roles: ['admin', 'race_officer', 'sailing_manager', 'race_committee'],
  },
  {
    id: 'results-center',
    title: 'Results & Scoring Center',
    description: 'Validate finishes and publish standings.',
    emoji: '🏆',
    roles: ['admin', 'scorer', 'race_officer'],
  },
];

const ADMIN_ACTION_DESTINATIONS: Partial<Record<string, { view?: string; tab?: string }>> = {
  'create-regatta': { view: 'events' },
  'manage-entries': { view: 'entries' },
  'publish-documents': { view: 'documents' },
  'configure-microsite': { view: 'publishing' },
  'membership-approvals': { view: 'members' },
  'volunteer-roster': { view: 'volunteers' },
  'results-center': { view: 'results' },
};

export default function ClubsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: memberships, loading: membershipsLoading, error, refetch } = useClubs();
  const {
    snapshots,
    loading: integrationLoading,
    error: integrationError,
    refetch: refetchSnapshots,
  } = useClubIntegrationSnapshots(memberships || []);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [manualClubs, setManualClubs] = useState<ManualClub[]>([]);
  const [manualForm, setManualForm] = useState({ name: '', relationship: '', notes: '' });
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const manualClubsRef = useRef<ManualClub[]>([]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const stored = await AsyncStorage.getItem(MANUAL_STORAGE_KEY);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setManualClubs(parsed);
          }
        }
      } catch (storageError) {
        console.warn('[ClubsScreen] Failed to load manual clubs', storageError);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    manualClubsRef.current = manualClubs;
  }, [manualClubs]);

  const persistManualClubs = useCallback(async (records: ManualClub[]) => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(MANUAL_STORAGE_KEY, JSON.stringify(records));
    } catch (storageError) {
      console.warn('[ClubsScreen] Failed to persist manual clubs', storageError);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let cancelled = false;

    (async () => {
      const result = await fetchUserManualClubs(user.id);

      if (cancelled) {
        return;
      }

      if (result.missingTable) {
        return;
      }

      if (result.error) {
        console.warn('[ClubsScreen] Failed to fetch manual clubs from Supabase', result.error);
        return;
      }

      const remoteClubs = (result.clubs || []).map((record) => ({
        id: record.id,
        name: record.club_name,
        relationship: record.relationship || 'Member',
        notes: record.notes || undefined,
        addedAt: record.added_at || new Date().toISOString(),
      }));

      if (remoteClubs.length > 0) {
        remoteClubs.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        setManualClubs(remoteClubs);
        await persistManualClubs(remoteClubs);
      } else if (manualClubsRef.current.length > 0) {
        const syncResult = await bulkUpsertUserManualClubs(user.id, manualClubsRef.current);
        if (syncResult.error && !syncResult.missingTable) {
          console.warn('[ClubsScreen] Failed to push local manual clubs to Supabase', syncResult.error);
        }
      }
    })().catch((err) => {
      if (!cancelled) {
        console.warn('[ClubsScreen] Error syncing manual clubs', err);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, persistManualClubs]);

  useEffect(() => {
    if (snapshots.length === 0) {
      setSelectedClubId(null);
      return;
    }

    if (!selectedClubId || !snapshots.some((snapshot) => snapshot.clubId === selectedClubId)) {
      setSelectedClubId(snapshots[0].clubId);
    }
  }, [snapshots, selectedClubId]);

  useEffect(() => {
    if (error && error.message && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      Alert.alert('Error', `Failed to load clubs: ${error.message}`);
    }
  }, [error]);

  useEffect(() => {
    if (integrationError) {
      Alert.alert('Club data unavailable', integrationError);
    }
  }, [integrationError]);

  const hasConnectedClub = snapshots.length > 0;
  const selectedSnapshot = useMemo<ClubIntegrationSnapshot | null>(() => {
    if (!selectedClubId) return null;
    return snapshots.find((snapshot) => snapshot.clubId === selectedClubId) || null;
  }, [selectedClubId, snapshots]);
  const selectedRole = useMemo<ClubRole | null>(() => {
    if (!selectedSnapshot) return null;
    return normalizeClubRole(selectedSnapshot.membership.role);
  }, [selectedSnapshot]);
  const roleDefinition = selectedRole ? getClubRoleDefinition(selectedRole) : null;
  const hasAdminPrivileges = selectedRole ? hasAdminAccess(selectedRole) : false;
  const hasManagementPrivileges = selectedRole ? isManagementRole(selectedRole) : false;

  const upcomingVolunteers = useMemo(() => {
    if (!selectedSnapshot) return [];
    return selectedSnapshot.events.filter((event) => {
      if (!event.eventType) return false;
      const type = event.eventType.toLowerCase();
      return type.includes('maintenance') || type.includes('training') || type.includes('volunteer');
    });
  }, [selectedSnapshot]);

  const communityEvents = useMemo(() => {
    if (!selectedSnapshot) return [];
    return selectedSnapshot.events.filter((event) => {
      if (!event.eventType) return false;
      const type = event.eventType.toLowerCase();
      return type.includes('social') || type.includes('member') || type.includes('community');
    });
  }, [selectedSnapshot]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([refetch?.(), refetchSnapshots()]);
    setRefreshing(false);
  }, [refetch, refetchSnapshots]);

  const handleManualAdd = useCallback(async () => {
    const name = manualForm.name.trim();
    const relationship = manualForm.relationship.trim() || 'Member';
    const notes = manualForm.notes.trim();

    if (!name) {
      Alert.alert('Add club', 'Please provide a club or association name.');
      return;
    }

    const exists = manualClubs.some(
      (club) => club.name.toLowerCase() === name.toLowerCase() && club.relationship === relationship
    );

    if (exists) {
      Alert.alert('Already tracked', 'You are already tracking this club.');
      return;
    }

    setManualSaving(true);

    try {
      const newClub: ManualClub = {
        id: `${Date.now()}`,
        name,
        relationship,
        notes: notes || undefined,
        addedAt: new Date().toISOString(),
      };

      const next: ManualClub[] = [
        ...manualClubs,
        newClub,
      ];

      setManualClubs(next);
      setManualForm({ name: '', relationship: '', notes: '' });
      setShowManualForm(false);
      await persistManualClubs(next);

      if (user?.id) {
        const result = await upsertUserManualClub(user.id, newClub);
        if (result.error && !result.missingTable) {
          Alert.alert('Sync issue', 'Saved locally but we could not sync to the cloud yet.');
        }
      }
    } finally {
      setManualSaving(false);
    }
  }, [manualForm, manualClubs, persistManualClubs, user?.id]);

  const handleManualRemove = useCallback(
    async (clubId: string) => {
      const next = manualClubs.filter((club) => club.id !== clubId);
      setManualClubs(next);
      await persistManualClubs(next);

      if (user?.id) {
        const result = await deleteUserManualClub(user.id, clubId);
        if (result.error && !result.missingTable) {
          Alert.alert('Sync issue', 'Removed locally but the cloud record may still exist.');
        }
      }
    },
    [manualClubs, persistManualClubs, user?.id]
  );

  const handleQuickTrack = useCallback(
    async (name: string) => {
      if (manualClubs.some((club) => club.name.toLowerCase() === name.toLowerCase())) {
        Alert.alert('Already saved', 'This club is already in your personal tracker.');
        return;
      }

      const next: ManualClub[] = [
        ...manualClubs,
        {
          id: `${Date.now()}`,
          name,
          relationship: 'Interested',
          addedAt: new Date().toISOString(),
        },
      ];

      setManualClubs(next);
      await persistManualClubs(next);

      if (user?.id) {
        const result = await upsertUserManualClub(user.id, next[next.length - 1]);
        if (result.error && !result.missingTable) {
          Alert.alert('Sync issue', 'We saved this club locally but cloud sync failed.');
        }
      }

      Alert.alert('Tracked', `${name} was added to your personal club list.`);
    },
    [manualClubs, persistManualClubs, user?.id]
  );

  const openWebsite = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Unable to open website', 'Please try again later.');
    }
  }, []);

  const handleAdminActionPress = useCallback(
    (actionId: string) => {
      if (!selectedSnapshot) {
        return;
      }

      const clubName = selectedSnapshot.club.name;
      const destination = ADMIN_ACTION_DESTINATIONS[actionId];

      if (destination) {
        router.push({
          pathname: '/club-dashboard',
          params: {
            clubId: selectedSnapshot.clubId,
            view: destination.view,
            tab: destination.tab,
          },
        });
        return;
      }

      switch (actionId) {
        case 'create-regatta':
          Alert.alert(
            'Regatta workspace',
            `The regatta creation flow for ${clubName} is being finalised. Your admin board will soon let you add dates, fleets, and scoring in one place.`
          );
          return;
        case 'manage-entries':
          Alert.alert(
            'Entries & payments',
            'Entry approvals, invoices, and refunds are wiring up now. Expect a ledger view and payout reconciliation in the next build.'
          );
          return;
        case 'publish-documents':
          Alert.alert(
            'Publishing tools',
            'Document automation will roll out with template support and scheduled expiry. For now, upload documents via the web console.'
          );
          return;
        case 'configure-microsite':
          Alert.alert(
            'Microsite configuration',
            'Branding, custom domains, and widget embeds are on the roadmap. We will notify you when the white-label publisher is ready.'
          );
          return;
        case 'membership-approvals':
          Alert.alert(
            'Membership approvals',
            'The role-based approval queue is nearly complete. You will soon be able to approve members and assign roles here.'
          );
          return;
        case 'volunteer-roster':
          Alert.alert(
            'Volunteer roster',
            'Volunteer scheduling and race committee assignments are in development. Keep an eye on updates in the Club Control Center.'
          );
          return;
        case 'results-center':
          Alert.alert(
            'Results center',
            'Live scoring review, protest tracking, and standings publishing will land after the entry pipeline ships.'
          );
          return;
        default:
          Alert.alert('Coming soon', 'Club control center modules are being assembled.');
      }
    },
    [selectedSnapshot]
  );

  const renderAdminPanel = () => {
    if (!selectedSnapshot || !selectedRole || !hasManagementPrivileges || !roleDefinition) {
      return null;
    }

    const actions = ADMIN_ACTIONS.filter((action) => {
      if (!action.roles || action.roles.length === 0) {
        return true;
      }

      return action.roles.includes(selectedRole);
    });

    if (actions.length === 0) {
      return null;
    }

    const adminStats = [
      {
        id: 'open-entries',
        label: 'Open entries',
        value: selectedSnapshot.insights.openRegistrations ?? 0,
      },
      {
        id: 'volunteer-needs',
        label: 'Volunteer shifts',
        value: selectedSnapshot.insights.volunteerNeeds ?? 0,
      },
      {
        id: 'docs',
        label: 'New documents',
        value: selectedSnapshot.insights.newDocuments ?? 0,
      },
    ];

    return (
      <View style={styles.adminPanel}>
        <View style={styles.adminHeader}>
          <Text style={styles.adminTitle}>Club Control Center</Text>
          <Text style={styles.adminSubtitle}>
            Signed in as {roleDefinition.label}
            {hasAdminPrivileges ? ' • full access' : ' • management access'}
          </Text>
        </View>

        <View style={styles.adminStatsRow}>
          {adminStats.map((stat, index) => (
            <View
              key={stat.id}
              style={[
                styles.adminStatCard,
                index === adminStats.length - 1 && { marginRight: 0 },
              ]}
            >
              <Text style={styles.adminStatValue}>{stat.value}</Text>
              <Text style={styles.adminStatLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.adminActionGrid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.adminActionCard}
              onPress={() => handleAdminActionPress(action.id)}
            >
              <Text style={styles.adminActionEmoji}>{action.emoji}</Text>
              <Text style={styles.adminActionTitle}>{action.title}</Text>
              <Text style={styles.adminActionDescription}>{action.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderInsightCards = () => {
    if (!selectedSnapshot) return null;

    const cards = [
      {
        id: 'next-action',
        title: selectedSnapshot.insights.nextAction || 'All caught up',
        subtitle: selectedSnapshot.membership.membershipType
          ? `Membership: ${selectedSnapshot.membership.membershipType}`
          : 'Stay active with your club',
        accent: '#0A84FF',
        emoji: '⚡️',
      },
      {
        id: 'open-registrations',
        title: `${selectedSnapshot.insights.openRegistrations} open registrations`,
        subtitle: 'Upcoming race entries ready for you',
        accent: '#34C759',
        emoji: '🏁',
      },
      {
        id: 'volunteer-needs',
        title: `${selectedSnapshot.insights.volunteerNeeds} volunteer shifts`,
        subtitle: 'Help keep the club running smoothly',
        accent: '#FF9F0A',
        emoji: '🛠️',
      },
      {
        id: 'documents',
        title: `${selectedSnapshot.insights.newDocuments} new documents`,
        subtitle: 'NORs, SIs, and club bulletins',
        accent: '#AF52DE',
        emoji: '📄',
      },
    ];

    return (
      <View style={styles.insightGrid}>
        {cards.map((card) => (
          <View key={card.id} style={[styles.insightCard, { borderColor: card.accent }]}>
            <Text style={styles.insightEmoji}>{card.emoji}</Text>
            <Text style={styles.insightTitle}>{card.title}</Text>
            <Text style={styles.insightSubtitle}>{card.subtitle}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderRegattaList = () => {
    if (!selectedSnapshot || selectedSnapshot.regattas.length === 0) {
      return (
        <View style={styles.emptyList}>
          <Text style={styles.emptyListText}>No upcoming regattas yet. Ask your club to publish the race calendar.</Text>
        </View>
      );
    }

    return selectedSnapshot.regattas.slice(0, 4).map((regatta) => (
      <View key={regatta.id} style={styles.listItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listItemTitle}>{regatta.name}</Text>
          <Text style={styles.listItemMeta}>
            {formatDate(regatta.startDate)}
            {regatta.endDate ? ` • Ends ${formatDate(regatta.endDate)}` : ''}
          </Text>
          {regatta.eventType && (
            <Text style={styles.listItemTag}>{regatta.eventType.replace(/_/g, ' ')}</Text>
          )}
        </View>
        {regatta.entryFee ? (
          <Text style={styles.listItemFee}>
            {regatta.currency || 'USD'} {regatta.entryFee}
          </Text>
        ) : (
          <Text style={styles.listItemFee}>Free</Text>
        )}
      </View>
    ));
  };

  const handleVolunteerPress = useCallback(
    (eventId?: string | null) => {
      if (eventId) {
        router.push({
          pathname: '/calendar',
          params: { focusEventId: eventId },
        });
        return;
      }
      router.push('/crew');
    },
    [router]
  );

  const handleOpenDocument = useCallback(
    async (document: ClubDocumentSnapshot) => {
      if (document.url) {
        try {
          await Linking.openURL(document.url);
          return;
        } catch (err) {
          console.warn('[ClubsScreen] Failed to open document URL', err);
        }
      }

      router.push('/documents');
    },
    [router]
  );

  const renderVolunteerList = () => {
    if (upcomingVolunteers.length === 0) {
      return (
        <View style={styles.emptyList}>
          <Text style={styles.emptyListText}>
            No volunteer assignments posted. Offer to lead the next race committee or maintenance day.
          </Text>
        </View>
      );
    }

    return upcomingVolunteers.slice(0, 3).map((event) => (
      <View key={event.id} style={styles.listItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listItemTitle}>{event.title}</Text>
          <Text style={styles.listItemMeta}>{formatDate(event.startDate)}</Text>
          <Text style={styles.listItemTag}>Volunteer shift</Text>
        </View>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleVolunteerPress(event.id)}
        >
          <Text style={styles.secondaryButtonText}>Volunteer</Text>
        </TouchableOpacity>
      </View>
    ));
  };

  const renderDocumentList = () => {
    if (!selectedSnapshot || selectedSnapshot.documents.length === 0) {
      return (
        <View style={styles.emptyList}>
          <Text style={styles.emptyListText}>Your club has not published documents yet.</Text>
        </View>
      );
    }

    return selectedSnapshot.documents.slice(0, 4).map((doc) => (
      <View key={doc.id} style={styles.listItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listItemTitle}>{doc.title}</Text>
          <Text style={styles.listItemMeta}>{doc.documentType || 'Document'}</Text>
          <Text style={styles.listItemMeta}>Published {formatDate(doc.publishDate)}</Text>
        </View>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleOpenDocument(doc)}
        >
          <Text style={styles.secondaryButtonText}>Open</Text>
        </TouchableOpacity>
      </View>
    ));
  };

  const renderCommunityList = () => {
    if (communityEvents.length === 0) {
      return (
        <View style={styles.emptyList}>
          <Text style={styles.emptyListText}>No social events yet—encourage your club to share more.</Text>
        </View>
      );
    }

    return communityEvents.slice(0, 3).map((event) => (
      <View key={event.id} style={styles.listItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listItemTitle}>{event.title}</Text>
          <Text style={styles.listItemMeta}>{formatDate(event.startDate)}</Text>
          <Text style={styles.listItemTag}>Community</Text>
        </View>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>RSVP</Text>
        </TouchableOpacity>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Clubs</Text>
          <Text style={styles.subtitle}>
            {hasConnectedClub
              ? 'Stay in sync with your yacht club'
              : 'Track clubs you sail with and invite them to RegattaFlow'}
          </Text>
        </View>

        {(membershipsLoading || integrationLoading) && (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading club data…</Text>
          </View>
        )}

        {hasConnectedClub && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Connected Clubs</Text>
              <Text style={styles.sectionHeaderMeta}>{snapshots.length} linked</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectorStrip}
            >
              {snapshots.map((snapshot) => {
                const isSelected = snapshot.clubId === selectedClubId;
                return (
                  <TouchableOpacity
                    key={snapshot.clubId}
                    style={[
                      styles.clubChip,
                      isSelected && { backgroundColor: '#0A84FF' },
                    ]}
                    onPress={() => setSelectedClubId(snapshot.clubId)}
                  >
                    <Text style={[styles.clubChipName, isSelected && { color: '#fff' }]}>
                      {snapshot.club.name}
                    </Text>
                    <Text style={[styles.clubChipMeta, isSelected && { color: '#E5F0FF' }]}>
                      {snapshot.membership.membershipType || 'Member'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedSnapshot && (
              <View style={styles.membershipCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.membershipTitle}>{selectedSnapshot.club.name}</Text>
                  <Text style={styles.membershipMeta}>
                    Member since {formatLongDate(selectedSnapshot.membership.joinedDate)}
                  </Text>
                  <Text style={styles.membershipMeta}>
                    Status: {selectedSnapshot.membership.paymentStatus || 'current'}
                  </Text>
                  {roleDefinition && (
                    <Text style={styles.membershipMeta}>
                      Role: {roleDefinition.label}
                    </Text>
                  )}
                  {selectedSnapshot.membership.memberNumber && (
                    <Text style={styles.membershipMeta}>
                      Member #{selectedSnapshot.membership.memberNumber}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    !selectedSnapshot && { opacity: 0.6 },
                    !hasManagementPrivileges && { backgroundColor: '#1f5fbf' },
                  ]}
                  onPress={() => {
                    if (!selectedSnapshot) return;
                    router.push({
                      pathname: '/club-dashboard',
                      params: { clubId: selectedSnapshot.clubId },
                    });
                  }}
                >
                  <Text style={styles.primaryButtonText}>
                    {hasManagementPrivileges ? 'Open Club Workspace' : 'View Club Workspace'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {renderAdminPanel()}

            {renderInsightCards()}
          </View>
        )}

        {hasConnectedClub && selectedSnapshot && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Regattas</Text>
                <TouchableOpacity onPress={() => router.push('/calendar')}>
                  <Text style={styles.sectionLink}>View calendar →</Text>
                </TouchableOpacity>
              </View>
              {renderRegattaList()}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Duty Roster & Volunteers</Text>
                <TouchableOpacity onPress={() => router.push('/crew')}>
                  <Text style={styles.sectionLink}>Manage crew →</Text>
                </TouchableOpacity>
              </View>
              {renderVolunteerList()}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Club Bulletins & Documents</Text>
                <TouchableOpacity onPress={() => router.push('/documents')}>
                  <Text style={styles.sectionLink}>All documents →</Text>
                </TouchableOpacity>
              </View>
              {renderDocumentList()}
            </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Community Updates</Text>
                  <Text style={styles.sectionHeaderMeta}>
                    {communityEvents.length} upcoming socials
                  </Text>
                </View>
                {renderCommunityList()}
              </View>
          </>
        )}

        {!hasConnectedClub && (
          <View style={styles.section}>
            <View style={styles.emptyConnected}>
              <Text style={styles.emptyEmoji}>⛵</Text>
              <Text style={styles.emptyHeadline}>No connected clubs yet</Text>
              <Text style={styles.emptyCopy}>
                Invite your club to RegattaFlow to unlock live race management, volunteer scheduling,
                and automated results.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/club-dashboard')}
              >
                <Text style={styles.primaryButtonText}>Share Club Overview</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Personal Club Tracker {manualClubs.length > 0 ? `(${manualClubs.length})` : ''}
            </Text>
            <TouchableOpacity onPress={() => setShowManualForm((visible) => !visible)}>
              <Text style={styles.sectionLink}>{showManualForm ? 'Cancel' : 'Add club +'}</Text>
            </TouchableOpacity>
          </View>

          {showManualForm && (
            <View style={styles.manualForm}>
              <TextInput
                style={styles.textInput}
                placeholder="Club or association name"
                value={manualForm.name}
                onChangeText={(value) => setManualForm((prev) => ({ ...prev, name: value }))}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.textInput}
                placeholder="Relationship (member, visiting sailor, coach...)"
                value={manualForm.relationship}
                onChangeText={(value) => setManualForm((prev) => ({ ...prev, relationship: value }))}
                placeholderTextColor="#999"
              />
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Key details (locker combo, upcoming visit, gate code...)"
                multiline
                value={manualForm.notes}
                onChangeText={(value) => setManualForm((prev) => ({ ...prev, notes: value }))}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={[styles.primaryButton, manualSaving && { opacity: 0.6 }]}
                onPress={handleManualAdd}
                disabled={manualSaving}
              >
                <Text style={styles.primaryButtonText}>
                  {manualSaving ? 'Saving…' : 'Save to tracker'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {manualClubs.length === 0 ? (
            <View style={styles.emptyList}>
              <Text style={styles.emptyListText}>
                Keep locker codes, reciprocal privileges, and travel plans here—even if the club
                is not on RegattaFlow yet.
              </Text>
            </View>
          ) : (
            manualClubs.map((club) => (
              <View key={club.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemTitle}>{club.name}</Text>
                  <Text style={styles.listItemMeta}>{club.relationship}</Text>
                  <Text style={styles.listItemMeta}>
                    Added {formatDate(club.addedAt)}
                  </Text>
                  {club.notes && <Text style={styles.listItemNotes}>{club.notes}</Text>}
                </View>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => handleManualRemove(club.id)}>
                  <Text style={styles.secondaryButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse Clubs & Associations</Text>
            <TouchableOpacity onPress={() => router.push('/clubs')}>
              <Text style={styles.sectionLink}>Full directory →</Text>
            </TouchableOpacity>
          </View>

          {directoryClubs.slice(0, 6).map((club) => (
            <View key={club.id} style={styles.directoryCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.directoryName}>{club.name}</Text>
                <Text style={styles.directoryMeta}>
                  {club.headquarters ? `${club.headquarters}` : club.country}
                </Text>
                {club.founded && (
                  <Text style={styles.directoryMeta}>Founded {club.founded}</Text>
                )}
                {club.tagline && <Text style={styles.directoryNotes}>{club.tagline}</Text>}
                {club.membershipTotal && (
                  <Text style={styles.directoryMeta}>
                    {club.membershipTotal.toLocaleString()} members
                  </Text>
                )}
              </View>
              <View style={styles.directoryActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => handleQuickTrack(club.name)}>
                  <Text style={styles.secondaryButtonText}>Track</Text>
                </TouchableOpacity>
                {club.website && (
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => openWebsite(club.website)}
                  >
                    <Text style={styles.secondaryButtonText}>Website</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <View style={styles.directoryFooter}>
            <Text style={styles.directoryFooterText}>
              Can't find your club? Tap below and we'll generate an invite packet for the race
              officers.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/support')}
            >
              <Text style={styles.primaryButtonText}>Invite my club</Text>
            </TouchableOpacity>
          </View>
        </View>

        {__DEV__ && error && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            <Text style={styles.debugText}>{error.message || 'Unknown error'}</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderMeta: {
    fontSize: 13,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  sectionLink: {
    fontSize: 14,
    color: '#0A84FF',
    fontWeight: '500',
  },
  selectorStrip: {
    gap: 12,
  },
  clubChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    minWidth: 160,
  },
  clubChipName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  clubChipMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  membershipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A84FF',
    padding: 16,
    borderRadius: 14,
    marginTop: 16,
    gap: 12,
  },
  membershipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  membershipMeta: {
    fontSize: 13,
    color: '#E5F0FF',
    marginTop: 2,
  },
  adminPanel: {
    backgroundColor: '#0B2C4A',
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
  },
  adminHeader: {
    marginBottom: 12,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  adminSubtitle: {
    fontSize: 13,
    color: '#C7E1FF',
    marginTop: 4,
  },
  adminStatsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  adminStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
  },
  adminStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  adminStatLabel: {
    fontSize: 12,
    color: '#E5F0FF',
    marginTop: 4,
  },
  adminActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  adminActionCard: {
    flexBasis: '48%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 6,
    marginBottom: 12,
    minHeight: 120,
  },
  adminActionEmoji: {
    fontSize: 22,
  },
  adminActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },
  adminActionDescription: {
    fontSize: 12,
    color: '#DAE9FF',
    marginTop: 6,
    lineHeight: 16,
  },
  insightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  insightCard: {
    flexGrow: 1,
    minWidth: '46%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    backgroundColor: '#FBFBFD',
  },
  insightEmoji: {
    fontSize: 20,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    color: '#1c1c1e',
  },
  insightSubtitle: {
    fontSize: 13,
    color: '#6e6e73',
    marginTop: 4,
  },
  listItem: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
    gap: 12,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  listItemMeta: {
    fontSize: 13,
    color: '#6e6e73',
    marginTop: 2,
  },
  listItemTag: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#0A84FF',
    textTransform: 'capitalize',
  },
  listItemNotes: {
    fontSize: 13,
    color: '#5c5c5c',
    marginTop: 8,
  },
  listItemFee: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A84FF',
    alignSelf: 'flex-start',
  },
  emptyList: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9F9FB',
  },
  emptyListText: {
    fontSize: 14,
    color: '#6e6e73',
  },
  emptyConnected: {
    alignItems: 'center',
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyHeadline: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  emptyCopy: {
    fontSize: 14,
    color: '#6e6e73',
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#0A84FF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#0A84FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#0A84FF',
    fontSize: 13,
    fontWeight: '600',
  },
  manualForm: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    padding: 12,
    fontSize: 14,
    color: '#1c1c1e',
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  directoryCard: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  directoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  directoryMeta: {
    fontSize: 13,
    color: '#6e6e73',
    marginTop: 3,
  },
  directoryNotes: {
    fontSize: 13,
    color: '#3a3a3c',
    marginTop: 6,
  },
  directoryActions: {
    justifyContent: 'center',
    gap: 8,
  },
  directoryFooter: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
    alignItems: 'flex-start',
    gap: 8,
  },
  directoryFooterText: {
    fontSize: 13,
    color: '#6e6e73',
  },
  debugContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 10,
  },
  debugTitle: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#8a6d3b',
  },
  debugText: {
    fontSize: 12,
    color: '#8a6d3b',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  loadingText: {
    fontSize: 14,
    color: '#6e6e73',
  },
});
