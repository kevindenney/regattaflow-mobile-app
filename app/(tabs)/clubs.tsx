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
  ActivityIndicator,
  ImageBackground,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { useClubs, useJoinClub, useClubDirectory } from '@/hooks/useData';
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
import MutationQueueService from '@/services/MutationQueueService';
import {
  ClubRole,
  getClubRoleDefinition,
  hasAdminAccess,
  isManagementRole,
  normalizeClubRole,
} from '@/types/club';
import { ensureUuid, generateUuid } from '@/utils/uuid';
import rhkycClubData from '@/data/demo/rhkycClubData.json';

type ManualClub = {
  id: string;
  name: string;
  relationship: string;
  notes?: string;
  addedAt: string;
};

type SignatureSeries = {
  name: string;
  season?: string;
  blurb?: string;
};

type FleetSpotlight = {
  name: string;
  emoji?: string;
  boats?: number;
  captain?: string;
  recentResult?: string;
  practiceNight?: string;
};

type HistoryEntry = {
  year: number | string;
  title?: string;
  detail?: string;
};

type ClubMetadataExtras = {
  tagline?: string;
  heroImage?: string;
  accentColor?: string;
  featuredStats?: Record<string, number>;
  signatureSeries?: SignatureSeries[];
  fleetSpotlights?: FleetSpotlight[];
  historyTimeline?: HistoryEntry[];
  insightsOverrides?: Partial<ClubInsightSnapshot>;
  [key: string]: any;
};

const MANUAL_STORAGE_KEY = '@regattaflow/manual_clubs_tracker';
const MANUAL_CLUB_COLLECTION = 'user_manual_clubs';

const demoClubMetadataById: Record<string, ClubMetadataExtras> = {};
if (rhkycClubData?.club?.id && rhkycClubData?.club?.metadata) {
  demoClubMetadataById[rhkycClubData.club.id] = rhkycClubData.club.metadata as ClubMetadataExtras;
}

const normalizeManualClubRecords = (records: ManualClub[]) => {
  let changed = false;
  const clubs = records.map((club) => {
    const normalizedId = ensureUuid(club.id);
    if (normalizedId !== club.id) {
      changed = true;
      return { ...club, id: normalizedId };
    }
    return club;
  });
  return { clubs, changed };
};

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

const inferRegionFromCountry = (country?: string, fallback?: string) => {
  const value = (country || fallback || '').toLowerCase();
  if (!value) return 'other';
  if (
    value.includes('hong kong') ||
    value.includes('singapore') ||
    value.includes('asia') ||
    value.includes('australia') ||
    value.includes('new zealand')
  ) {
    return 'asia-pacific';
  }
  if (
    value.includes('united states') ||
    value.includes('canada') ||
    value.includes('america') ||
    value.includes('brazil')
  ) {
    return 'americas';
  }
  if (
    value.includes('united kingdom') ||
    value.includes('uk') ||
    value.includes('europe') ||
    value.includes('france') ||
    value.includes('germany') ||
    value.includes('spain') ||
    value.includes('italy')
  ) {
    return 'europe';
  }
  return 'other';
};

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
    data: clubDirectory,
    loading: directoryLoading,
    error: directoryError,
    refetch: refetchDirectory,
  } = useClubDirectory();

  // DEBUG: Log club directory state
  useEffect(() => {
    console.log('[ClubsScreen] Club Directory Debug:', {
      loading: directoryLoading,
      error: directoryError?.message,
      dataLength: clubDirectory?.length,
      data: clubDirectory,
    });
  }, [clubDirectory, directoryLoading, directoryError]);
  const { mutateAsync: joinClub } = useJoinClub();
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
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<'all' | 'asia-pacific' | 'americas' | 'europe' | 'other'>('all');
  const [connectingClubId, setConnectingClubId] = useState<string | null>(null);
  const manualClubsRef = useRef<ManualClub[]>([]);

  const persistManualClubs = useCallback(async (records: ManualClub[]) => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(MANUAL_STORAGE_KEY, JSON.stringify(records));
    } catch (storageError) {
      console.warn('[ClubsScreen] Failed to persist manual clubs', storageError);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const stored = await AsyncStorage.getItem(MANUAL_STORAGE_KEY);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const { clubs, changed } = normalizeManualClubRecords(parsed);
            if (isMounted) {
              setManualClubs(clubs);
            }
            if (changed) {
              await persistManualClubs(clubs);
              try {
                await MutationQueueService.clearCollection(MANUAL_CLUB_COLLECTION);
              } catch (queueError) {
                console.warn('[ClubsScreen] Failed to reset manual club queue', queueError);
              }
            }
          }
        }
      } catch (storageError) {
        console.warn('[ClubsScreen] Failed to load manual clubs', storageError);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [persistManualClubs]);

  useEffect(() => {
    manualClubsRef.current = manualClubs;
  }, [manualClubs]);

  const directoryMetaIndex = useMemo(() => {
    const map = new Map<string, (typeof directoryClubs)[number]>();
    directoryClubs.forEach((club) => {
      const keys = [
        String(club.id || '').toLowerCase(),
        club.name?.toLowerCase(),
        club.headquarters?.toLowerCase(),
      ].filter(Boolean) as string[];
      keys.forEach((key) => map.set(key, club));
    });
    return map;
  }, []);

  const membershipByClubId = useMemo(() => {
    const map = new Map<string, any>();
    (memberships || []).forEach((membership: any) => {
      const id =
        membership?.club_id ||
        membership?.clubs?.id ||
        membership?.club?.id ||
        membership?.yacht_clubs?.id ||
        membership?.club?.club_id;
      if (id) {
        map.set(id, membership);
      }
    });
    return map;
  }, [memberships]);

  const regionFilters = useMemo(
    () => [
      { id: 'all' as const, label: 'All' },
      { id: 'asia-pacific' as const, label: 'Asia Pacific' },
      { id: 'americas' as const, label: 'Americas' },
      { id: 'europe' as const, label: 'Europe' },
      { id: 'other' as const, label: 'Global' },
    ],
    []
  );

  const enrichedDirectory = useMemo(() => {
    console.log('[ClubsScreen] Enriching directory:', {
      hasClubDirectory: !!clubDirectory,
      clubDirectoryLength: clubDirectory?.length,
      clubDirectorySample: clubDirectory?.[0],
    });

    if (!clubDirectory) return [];

    return (clubDirectory as any[]).map((club) => {
      const keyCandidates = [
        String(club.id || '').toLowerCase(),
        String(club.short_name || '').toLowerCase(),
        String(club.name || '').toLowerCase(),
      ].filter(Boolean) as string[];

      let meta: (typeof directoryClubs)[number] | undefined;
      for (const key of keyCandidates) {
        if (directoryMetaIndex.has(key)) {
          meta = directoryMetaIndex.get(key);
          break;
        }
      }

      const region = meta?.country
        ? inferRegionFromCountry(meta.country, meta.region)
        : inferRegionFromCountry(club.country, meta?.region);

      return {
        ...club,
        meta,
        region: region || 'other',
        country: club.country || meta?.country || '',
        website: club.website || meta?.website || '',
      };
    });
  }, [clubDirectory, directoryMetaIndex]);

  const filteredDirectory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = enrichedDirectory.filter((club: any) => {
      const matchesQuery =
        !query ||
        [club.name, club.short_name, club.country, club.meta?.headquarters, club.meta?.tagline]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query));

      const matchesRegion = regionFilter === 'all' || club.region === regionFilter;

      return matchesQuery && matchesRegion;
    });

    console.log('[ClubsScreen] Filtered directory:', {
      enrichedLength: enrichedDirectory.length,
      filteredLength: filtered.length,
      searchQuery,
      regionFilter,
      sampleFiltered: filtered[0],
    });

    return filtered;
  }, [enrichedDirectory, searchQuery, regionFilter]);

  const displayedDirectory = useMemo(() => filteredDirectory.slice(0, 10), [filteredDirectory]);

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
        if (syncResult.failedIds?.length) {
          const remaining = manualClubsRef.current.filter(
            (club) => !syncResult.failedIds?.includes(club.id)
          );
          setManualClubs(remaining);
          await persistManualClubs(remaining);
          try {
            await MutationQueueService.clearCollection(MANUAL_CLUB_COLLECTION);
          } catch (queueError) {
            console.warn('[ClubsScreen] Failed to clear manual club queue after RLS violation', queueError);
          }
          Alert.alert(
            'Cleaned up personal clubs',
            'Some locally stored clubs could not be synced and were removed because they belonged to a different account.'
          );
        } else if (syncResult.error && !syncResult.missingTable) {
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
  const resolvedClubMetadata = useMemo<ClubMetadataExtras | null>(() => {
    if (!selectedSnapshot) return null;
    const providedMeta = (selectedSnapshot.club.metadata || null) as ClubMetadataExtras | null;
    if (providedMeta && Object.keys(providedMeta).length > 0) {
      return providedMeta;
    }
    return demoClubMetadataById[selectedSnapshot.clubId] || null;
  }, [selectedSnapshot]);
  const resolvedInsights = useMemo<ClubInsightSnapshot | null>(() => {
    if (!selectedSnapshot) return null;
    const overrides = resolvedClubMetadata?.insightsOverrides;
    if (!overrides) {
      return selectedSnapshot.insights;
    }
    return {
      ...selectedSnapshot.insights,
      ...overrides,
    };
  }, [resolvedClubMetadata, selectedSnapshot]);

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
    await Promise.allSettled([refetch?.(), refetchSnapshots(), refetchDirectory()]);
    setRefreshing(false);
  }, [refetch, refetchSnapshots, refetchDirectory]);

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
        id: generateUuid(),
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
          id: generateUuid(),
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

  const handleConnectClub = useCallback(
    async (clubId: string, clubName: string) => {
      if (!user?.id) {
        Alert.alert('Sign in required', 'Sign in to connect with clubs and sync their schedules.');
        return;
      }

      try {
        setConnectingClubId(clubId);
        await joinClub({ clubId, membershipType: 'member' });
        Alert.alert(
          'Connection requested',
          `We've notified ${clubName}. Their calendars will appear once the club accepts your connection.`
        );
        await Promise.allSettled([refetch?.(), refetchSnapshots()]);
      } catch (err: any) {
        console.error('[ClubsScreen] Failed to connect to club:', err);
        Alert.alert('Unable to connect', err?.message || 'Please try again later.');
      } finally {
        setConnectingClubId(null);
      }
    },
    [joinClub, refetch, refetchSnapshots, user?.id]
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

    const insights = resolvedInsights ?? selectedSnapshot.insights;
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
        value: insights.openRegistrations ?? 0,
      },
      {
        id: 'volunteer-needs',
        label: 'Volunteer shifts',
        value: insights.volunteerNeeds ?? 0,
      },
      {
        id: 'docs',
        label: 'New documents',
        value: insights.newDocuments ?? 0,
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
          {adminStats.map((stat, index) => {
            const cardStyle = StyleSheet.flatten([
              styles.adminStatCard,
              index === adminStats.length - 1 ? { marginRight: 0 } : null,
            ]);
            return (
              <View
                key={stat.id}
                style={cardStyle}
              >
                <Text style={styles.adminStatValue}>{stat.value}</Text>
                <Text style={styles.adminStatLabel}>{stat.label}</Text>
              </View>
            );
          })}
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

    const insights = resolvedInsights ?? selectedSnapshot.insights;
    const cards = [
      {
        id: 'next-action',
        title: insights.nextAction || 'All caught up',
        subtitle: selectedSnapshot.membership.membershipType
          ? `Membership: ${selectedSnapshot.membership.membershipType}`
          : 'Stay active with your club',
        accent: '#0A84FF',
        emoji: '⚡️',
      },
      {
        id: 'open-registrations',
        title: `${insights.openRegistrations} open registrations`,
        subtitle: 'Upcoming race entries ready for you',
        accent: '#34C759',
        emoji: '🏁',
      },
      {
        id: 'volunteer-needs',
        title: `${insights.volunteerNeeds} volunteer shifts`,
        subtitle: 'Help keep the club running smoothly',
        accent: '#FF9F0A',
        emoji: '🛠️',
      },
      {
        id: 'documents',
        title: `${insights.newDocuments} new documents`,
        subtitle: 'NORs, SIs, and club bulletins',
        accent: '#AF52DE',
        emoji: '📄',
      },
    ];

    return (
      <View style={styles.insightGrid}>
        {cards.map((card) => (
          <View
            key={card.id}
            style={StyleSheet.flatten([styles.insightCard, { borderColor: card.accent }])}
          >
            <Text style={styles.insightEmoji}>{card.emoji}</Text>
            <Text style={styles.insightTitle}>{card.title}</Text>
            <Text style={styles.insightSubtitle}>{card.subtitle}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderClubHero = () => {
    if (!selectedSnapshot) return null;
    const meta = resolvedClubMetadata;
    const insights = resolvedInsights ?? selectedSnapshot.insights;
    const stats: { id: string; label: string; value: string }[] = [];

    if (meta?.featuredStats) {
      Object.entries(meta.featuredStats).forEach(([label, value]) => {
        if (stats.length >= 3) return;
        const prettyLabel = label.replace(/_/g, ' ');
        stats.push({
          id: label,
          label: prettyLabel.charAt(0).toUpperCase() + prettyLabel.slice(1),
          value: typeof value === 'number' ? value.toLocaleString() : String(value),
        });
      });
    }

    if (!stats.some((stat) => stat.id === 'regattas')) {
      stats.push({
        id: 'regattas',
        label: 'Upcoming regattas',
        value: `${selectedSnapshot.regattas.length}`,
      });
    }

    if (!stats.some((stat) => stat.id === 'volunteers')) {
      stats.push({
        id: 'volunteers',
        label: 'Volunteer shifts',
        value: `${insights.volunteerNeeds ?? 0}`,
      });
    }

    const statsToDisplay = stats.slice(0, 3);
    const locationLabel =
      selectedSnapshot.club.location ||
      selectedSnapshot.club.country ||
      'RegattaFlow club';
    const website = selectedSnapshot.club.website;

    return (
      <View style={[styles.section, styles.heroSection]}>
        <View style={styles.heroCard}>
          {meta?.heroImage ? (
            <ImageBackground
              source={{ uri: meta.heroImage }}
              style={styles.heroImage}
              imageStyle={styles.heroImageInner}
            >
              <View style={styles.heroOverlay} />
            </ImageBackground>
          ) : (
            <View style={[styles.heroImage, styles.heroImageFallback]} />
          )}
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>{locationLabel}</Text>
            <Text style={styles.heroTitle}>{selectedSnapshot.club.name}</Text>
            <Text style={styles.heroTagline}>
              {meta?.tagline || 'Connected via RegattaFlow'}
            </Text>
            {statsToDisplay.length > 0 && (
              <View style={styles.heroStatsRow}>
                {statsToDisplay.map((stat) => (
                  <View key={stat.id} style={styles.heroStatCard}>
                    <Text style={styles.heroStatValue}>{stat.value}</Text>
                    <Text style={styles.heroStatLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            )}
            {website && (
              <TouchableOpacity
                style={styles.heroLinkButton}
                onPress={() => openWebsite(website)}
              >
                <Text style={styles.heroLinkText}>Visit club site →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderSignatureSeries = () => {
    if (!selectedSnapshot || !resolvedClubMetadata?.signatureSeries?.length) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Signature regattas</Text>
          <Text style={styles.sectionHeaderMeta}>Club calendar highlights</Text>
        </View>
        <View style={styles.signatureGrid}>
          {resolvedClubMetadata.signatureSeries.map((series) => (
            <View key={series.name} style={styles.signatureCard}>
              <Text style={styles.signatureTitle}>{series.name}</Text>
              {series.season && <Text style={styles.signatureMeta}>{series.season}</Text>}
              {series.blurb && <Text style={styles.signatureBlurb}>{series.blurb}</Text>}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderFleetSpotlights = () => {
    if (!selectedSnapshot || !resolvedClubMetadata?.fleetSpotlights?.length) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fleet spotlights</Text>
          <Text style={styles.sectionHeaderMeta}>Programs featured by the club</Text>
        </View>
        <View style={styles.spotlightGrid}>
          {resolvedClubMetadata.fleetSpotlights.map((fleet) => {
            const metaPieces = [];
            if (fleet.boats) metaPieces.push(`${fleet.boats} boats`);
            if (fleet.practiceNight) metaPieces.push(fleet.practiceNight);
            return (
              <View key={fleet.name} style={styles.spotlightCard}>
                <Text style={styles.spotlightEmoji}>{fleet.emoji || '⛵️'}</Text>
                <Text style={styles.spotlightTitle}>{fleet.name}</Text>
                {metaPieces.length > 0 && <Text style={styles.spotlightMeta}>{metaPieces.join(' • ')}</Text>}
                {fleet.recentResult && <Text style={styles.spotlightDetail}>{fleet.recentResult}</Text>}
                {fleet.captain && <Text style={styles.spotlightDetail}>Lead: {fleet.captain}</Text>}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderHistoryTimeline = () => {
    if (!selectedSnapshot || !resolvedClubMetadata?.historyTimeline?.length) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Harbour history</Text>
          <Text style={styles.sectionHeaderMeta}>Moments shaping the clubhouse</Text>
        </View>
        <View style={styles.timelineCard}>
          {resolvedClubMetadata.historyTimeline.map((entry, index) => (
            <View key={`${entry.year}-${index}`} style={styles.timelineItem}>
              <View style={styles.timelineYearBubble}>
                <Text style={styles.timelineYearText}>{entry.year}</Text>
              </View>
              <View style={styles.timelineContent}>
                {entry.title && <Text style={styles.timelineTitle}>{entry.title}</Text>}
                {entry.detail && <Text style={styles.timelineDetail}>{entry.detail}</Text>}
              </View>
            </View>
          ))}
        </View>
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
            {regatta.endDate && ` • Ends ${formatDate(regatta.endDate)}`}
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
                const chipStyle = StyleSheet.flatten([
                  styles.clubChip,
                  isSelected ? { backgroundColor: '#0A84FF' } : null,
                ]);
                return (
                  <TouchableOpacity
                    key={snapshot.clubId}
                    style={chipStyle}
                    onPress={() => setSelectedClubId(snapshot.clubId)}
                  >
                    <Text style={isSelected ? styles.clubChipNameSelected : styles.clubChipName}>
                      {snapshot.club.name}
                    </Text>
                    <Text style={isSelected ? styles.clubChipMetaSelected : styles.clubChipMeta}>
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
                {(() => {
                  const workspaceButtonStyle = StyleSheet.flatten([
                    styles.primaryButton,
                    !selectedSnapshot ? { opacity: 0.6 } : null,
                    !hasManagementPrivileges ? { backgroundColor: '#1f5fbf' } : null,
                  ]);
                  return (
                    <TouchableOpacity
                      style={workspaceButtonStyle}
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
                  );
                })()}
              </View>
            )}

            {hasConnectedClub && selectedSnapshot && (<>
              {renderClubHero()}
              {renderSignatureSeries()}
              {renderFleetSpotlights()}
              {renderHistoryTimeline()}
            </>)}
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
              Personal Club Tracker {manualClubs.length > 0 && `(${manualClubs.length})`}
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
                style={StyleSheet.flatten([styles.textInput, styles.textArea])}
                placeholder="Key details (locker combo, upcoming visit, gate code...)"
                multiline
                value={manualForm.notes}
                onChangeText={(value) => setManualForm((prev) => ({ ...prev, notes: value }))}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={StyleSheet.flatten([
                  styles.primaryButton,
                  manualSaving ? { opacity: 0.6 } : null,
                ])}
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
            <Text style={styles.sectionTitle}>Discover Yacht Clubs</Text>
            {directoryLoading && <ActivityIndicator size="small" color="#0284c7" />}
          </View>
          <Text style={styles.sectionCopy}>
            Connect with clubs you sail with to sync their race calendars, fleets, and volunteer
            opportunities into your Add Race workflow.
          </Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search by club name, initials, or country"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {regionFilters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={StyleSheet.flatten([
                  styles.filterChip,
                  regionFilter === filter.id ? styles.filterChipActive : null,
                ])}
                onPress={() => setRegionFilter(filter.id)}
              >
                <Text
                  style={StyleSheet.flatten([
                    styles.filterChipText,
                    regionFilter === filter.id ? styles.filterChipTextActive : null,
                  ])}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {directoryError && (
            <Text style={styles.errorText}>
              We couldn't load the club directory. Pull to refresh or try again shortly.
            </Text>
          )}

          {displayedDirectory.length === 0 ? (
            directoryLoading ? (
              <ActivityIndicator style={{ marginTop: 16 }} color="#0284c7" />
            ) : (
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>
                  No clubs match your search yet. Try a different name or region.
                </Text>
              </View>
            )
          ) : (
            displayedDirectory.map((club: any) => {
              const membership = membershipByClubId.get(club.id);
              const isConnected = Boolean(membership);
              const isPending = isConnected && membership?.status && membership.status !== 'active';
              const buttonLabel = isConnected
                ? isPending
                  ? 'Pending'
                  : 'Connected'
                : connectingClubId === club.id
                ? 'Connecting…'
                : 'Connect';
              return (
                <View key={club.id} style={styles.discoveryCard}>
                  {[
                    <View key="details" style={styles.discoveryDetails}>
                      <View style={styles.discoveryHeader}>
                        <Text style={styles.directoryName}>{club.name}</Text>
                        {club.region && club.region !== 'other' && (
                          <View style={styles.regionPill}>
                            <Text style={styles.regionPillText}>
                              {
                                {
                                  'asia-pacific': 'Asia Pacific',
                                  americas: 'Americas',
                                  europe: 'Europe',
                                  other: 'Global',
                                }[club.region] || 'Global'
                              }
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.directoryMeta}>
                        {club.meta?.headquarters || club.address || club.country || 'Location TBD'}
                      </Text>
                      {club.meta?.tagline && (
                        <Text style={styles.directoryNotes}>{club.meta.tagline}</Text>
                      )}
                      {club.meta?.membershipTotal && (
                        <Text style={styles.directoryMeta}>
                          {club.meta.membershipTotal.toLocaleString()} members
                        </Text>
                      )}
                    </View>,
                    <View key="actions" style={styles.discoveryActions}>
                      <TouchableOpacity
                        style={StyleSheet.flatten([
                          styles.connectButton,
                          isConnected || connectingClubId === club.id ? styles.connectButtonDisabled : null,
                        ])}
                    disabled={isConnected || connectingClubId === club.id}
                    onPress={() => handleConnectClub(club.id, club.name)}
                  >
                    {connectingClubId === club.id ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.connectButtonText}>{buttonLabel}</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleQuickTrack(club.name)}
                  >
                    <Text style={styles.secondaryButtonText}>Track</Text>
                  </TouchableOpacity>
                      {(club.website || club.meta?.website) && (
                        <TouchableOpacity
                          style={styles.secondaryButton}
                          onPress={() => openWebsite(club.website || club.meta?.website)}
                        >
                          <Text style={styles.secondaryButtonText}>Website</Text>
                        </TouchableOpacity>
                      )}
                    </View>,
                  ]}
                </View>
              );
            })
          )}
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
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 8px 20px rgba(15, 23, 42, 0.08)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        }),
  },
  heroSection: {
    padding: 0,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#081423',
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  heroImageInner: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  heroImageFallback: {
    backgroundColor: '#0A2540',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroContent: {
    padding: 20,
    gap: 6,
  },
  heroEyebrow: {
    color: '#9cc9ff',
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  heroTagline: {
    color: '#d7e8ff',
    fontSize: 15,
    lineHeight: 20,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  heroStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroStatValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  heroStatLabel: {
    color: '#d7e8ff',
    fontSize: 12,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  heroLinkButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  heroLinkText: {
    color: '#fff',
    fontWeight: '600',
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
  sectionCopy: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  sectionLink: {
    fontSize: 14,
    color: '#0A84FF',
    fontWeight: '500',
  },
  signatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  signatureCard: {
    flexBasis: '48%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  signatureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  signatureMeta: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  signatureBlurb: {
    fontSize: 13,
    color: '#475569',
    marginTop: 6,
    lineHeight: 18,
  },
  spotlightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  spotlightCard: {
    flexBasis: '48%',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#051933',
  },
  spotlightEmoji: {
    fontSize: 28,
    color: '#fff',
  },
  spotlightTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  spotlightMeta: {
    color: '#c3ddff',
    fontSize: 12,
    marginTop: 4,
  },
  spotlightDetail: {
    color: '#f1f5f9',
    fontSize: 13,
    marginTop: 6,
  },
  timelineCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  timelineItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  timelineYearBubble: {
    backgroundColor: '#0F172A',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  timelineYearText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  timelineDetail: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
    lineHeight: 18,
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
  clubChipNameSelected: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  clubChipMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  clubChipMetaSelected: {
    fontSize: 12,
    color: '#E5F0FF',
    marginTop: 4,
  },
  searchInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  errorText: {
    fontSize: 13,
    color: '#B91C1C',
    marginBottom: 8,
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
  discoveryCard: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  discoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  regionPill: {
    backgroundColor: '#E0F2FE',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  regionPillText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
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
  discoveryDetails: {
    flex: 1,
  },
  discoveryActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  connectButton: {
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  connectButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  connectButtonText: {
    color: '#fff',
    fontWeight: '600',
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
