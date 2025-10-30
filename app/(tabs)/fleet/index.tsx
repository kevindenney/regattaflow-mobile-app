import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { DashboardSection, QuickActionGrid, type QuickAction } from '@/components/dashboard/shared';
import { useAuth } from '@/providers/AuthProvider';
import { useFleetOverview, useUserFleets } from '@/hooks/useFleetData';
import { useFleetPosts } from '@/hooks/useFleetSocial';
import { useFleetSuggestions } from '@/hooks/useFleetDiscovery';
import { useFleetResources } from '@/hooks/useFleetResources';
import { useFleetSharedContent } from '@/hooks/useFleetSharedContent';
import type { FleetPost } from '@/services/FleetSocialService';
import {
  PostComposer,
  AnnouncementComposer,
  ResourceUploadComposer,
} from '@/components/fleets';
import {
  fleetService,
  type FleetCourseSummary,
  type FleetRaceSummary,
  type FleetResource,
  type FleetMembership,
} from '@/services/fleetService';
import type { Fleet as SuggestedFleet } from '@/services/FleetDiscoveryService';
import { RealtimeConnectionIndicator } from '@/components/ui/RealtimeConnectionIndicator';
import { createLogger } from '@/lib/utils/logger';

export default function FleetOverviewScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [showAnnouncementComposer, setShowAnnouncementComposer] = useState(false);
  const [showResourceUpload, setShowResourceUpload] = useState(false);
  const [selectedFleetIndex, setSelectedFleetIndex] = useState(0);
  const [joiningFleetId, setJoiningFleetId] = useState<string | null>(null);
  const [leavingFleetId, setLeavingFleetId] = useState<string | null>(null);
  const [pendingHighlightFleetId, setPendingHighlightFleetId] = useState<string | null>(null);

  logger.debug('[FleetOverview] Component render - user:', user?.id);

  const { fleets, loading: fleetsLoading, refresh: refreshFleets } = useUserFleets(user?.id);
  logger.debug('[FleetOverview] After useUserFleets:', { fleetsCount: fleets.length, fleetsLoading });

  // Refresh fleets when screen comes into focus (after returning from select screen)
  useFocusEffect(
    React.useCallback(() => {
      logger.debug('[FleetOverview] useFocusEffect triggered - refreshing fleets');
      refreshFleets();
    }, [refreshFleets])
  );

  useEffect(() => {
    if (pendingHighlightFleetId && fleets.length > 0) {
      const matchedIndex = fleets.findIndex(membership => membership.fleet.id === pendingHighlightFleetId);
      if (matchedIndex !== -1 && matchedIndex !== selectedFleetIndex) {
        setSelectedFleetIndex(matchedIndex);
      }
      setPendingHighlightFleetId(null);
      return;
    }

    if (selectedFleetIndex >= fleets.length && fleets.length > 0) {
      setSelectedFleetIndex(Math.max(0, fleets.length - 1));
    } else if (fleets.length === 0 && selectedFleetIndex !== 0) {
      setSelectedFleetIndex(0);
    }
  }, [fleets, pendingHighlightFleetId, selectedFleetIndex]);

  const activeFleetMembership = fleets[selectedFleetIndex];
  const activeFleet = activeFleetMembership?.fleet;
  logger.debug('[FleetOverview] Active fleet:', activeFleet?.id, activeFleet?.name);

  const { overview, loading: overviewLoading } = useFleetOverview(activeFleet?.id);
  const { posts, loading: postsLoading, likePost, unlikePost, createPost } = useFleetPosts(activeFleet?.id, { limit: 10 });
  const { resources, loading: resourcesLoading } = useFleetResources(activeFleet?.id, { limit: 6 });
  const {
    courses: sharedCourses,
    races: sharedRaces,
    loading: sharedContentLoading,
  } = useFleetSharedContent({ clubId: activeFleet?.clubId, classId: activeFleet?.classId });
  const {
    suggestions,
    loading: suggestionsLoading,
    refresh: refreshSuggestions,
  } = useFleetSuggestions({ userId: user?.id, classId: activeFleet?.classId });

  const membershipFleetIds = useMemo(() => new Set(fleets.map(item => item.fleet.id)), [fleets]);
  const filteredSuggestions = useMemo(
    () => suggestions.filter(fleet => !membershipFleetIds.has(fleet.id)),
    [suggestions, membershipFleetIds]
  );
  const summaryFleet = overview?.fleet ?? activeFleet ?? null;

  const handleCreatePost = async (params: { postType: any; content: string }) => {
    await createPost(params);
    setShowPostComposer(false);
  };

  const handleCreateAnnouncement = async (params: { content: string; isPinned: boolean }) => {
    await createPost({
      postType: 'announcement',
      content: params.content,
      metadata: { isPinned: params.isPinned },
    });
    setShowAnnouncementComposer(false);
  };

  const handleResourceUpload = async (params: { documentId: string; tags: string[]; notifyFollowers: boolean }) => {
    if (!activeFleet?.id || !user?.id) return;

    await fleetService.shareDocumentWithFleet({
      fleetId: activeFleet.id,
      documentId: params.documentId,
      sharedBy: user.id,
      tags: params.tags,
      notifyFollowers: params.notifyFollowers,
    });

    setShowResourceUpload(false);
  };

  const handleSelectFleet = useCallback((index: number) => {
    setSelectedFleetIndex(index);
  }, []);

  const handleJoinFleet = useCallback(async (fleetId: string) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Sign in to join fleets and access shared content.');
      return;
    }

    setJoiningFleetId(fleetId);
    try {
      await fleetService.joinFleet(user.id, fleetId);
      await refreshFleets();
      setPendingHighlightFleetId(fleetId);
      refreshSuggestions();
      Alert.alert('Success', 'You have joined the fleet. Shared resources will appear shortly.');
    } catch (error: any) {
      logger.error('[FleetOverview] Failed to join fleet:', error);
      Alert.alert('Unable to join fleet', error?.message ?? 'Please try again in a few moments.');
    } finally {
      setJoiningFleetId(null);
    }
  }, [user?.id, refreshFleets, refreshSuggestions]);

  const handleLeaveFleetConfirmed = useCallback(async (fleetId: string) => {
    if (!user?.id) {
      return;
    }

    setLeavingFleetId(fleetId);
    try {
      await fleetService.leaveFleet(user.id, fleetId);
      await refreshFleets();
      refreshSuggestions();
      Alert.alert('You left the fleet', 'You can rejoin anytime from the discovery list.');
    } catch (error: any) {
      logger.error('[FleetOverview] Failed to leave fleet:', error);
      Alert.alert('Unable to leave fleet', error?.message ?? 'Please try again later.');
    } finally {
      setLeavingFleetId(null);
    }
  }, [user?.id, refreshFleets, refreshSuggestions]);

  const confirmLeaveFleet = useCallback((fleetId: string, fleetName?: string) => {
    Alert.alert(
      `Leave ${fleetName ?? 'this fleet'}?`,
      'You will lose access to shared documents, planning updates, and fleet messaging.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => handleLeaveFleetConfirmed(fleetId) },
      ]
    );
  }, [handleLeaveFleetConfirmed]);

  // Memoized handlers for posts
  const handleLike = useCallback((postId: string, isLiked: boolean) => {
    if (isLiked) {
      unlikePost(postId);
    } else {
      likePost(postId);
    }
  }, [likePost, unlikePost]);

  const quickActions: QuickAction[] = useMemo(() => {
    if (!overview?.fleet) {
      return [];
    }

    const whatsappLink = overview.fleet.whatsappLink;

    return [
      {
        id: 'share-update',
        title: 'Share Update',
        icon: 'message-plus-outline',
        iconSet: 'mci',
        gradientColors: ['#10B981', '#059669'],
        onPress: () => {
          setShowPostComposer(true);
        },
      },
      {
        id: 'open-whatsapp',
        title: 'Open WhatsApp',
        icon: whatsappLink ? 'whatsapp' : 'message-processing',
        iconSet: 'mci',
        gradientColors: ['#25D366', '#128C7E'],
        onPress: () => {
          if (whatsappLink) {
            Linking.openURL(whatsappLink).catch(err => {
              console.warn('Unable to open WhatsApp link:', err);
            });
          }
        },
      },
      {
        id: 'upload-resource',
        title: 'Upload Fleet Doc',
        icon: 'file-upload-outline',
        iconSet: 'mci',
        gradientColors: ['#6366F1', '#8B5CF6'],
        onPress: () => {
          setShowResourceUpload(true);
        },
      },
      {
        id: 'message-fleet',
        title: 'Post Announcement',
        icon: 'bullhorn-variant-outline',
        iconSet: 'mci',
        gradientColors: ['#0EA5E9', '#0284C7'],
        onPress: () => {
          setShowAnnouncementComposer(true);
        },
      },
    ];
  }, [overview?.fleet]);

  const shouldShowEmpty = !fleetsLoading && (!fleets.length || !activeFleet);
  logger.debug('[FleetOverview] Empty state check:', { shouldShowEmpty, fleetsLoading });

  if (shouldShowEmpty) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.emptyStateContent}>
        <View style={styles.heroBanner}>
          <View style={styles.heroTextGroup}>
            <Text style={styles.heroEyebrow}>Fleet collaboration</Text>
            <Text style={styles.heroTitle}>Join fleets to unlock shared planning</Text>
            <Text style={styles.heroSubtitle}>
              Follow your class, share documents, coordinate regattas, and review race insights with your squad.
            </Text>
          </View>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="account-group" size={56} color="#2563EB" />
          </View>
        </View>

        <View style={styles.ctaRow}>
          <Link href="/(tabs)/fleet/select" asChild>
            <TouchableOpacity style={styles.primaryCta}>
              <MaterialCommunityIcons name="account-plus" size={20} color="#FFFFFF" />
              <Text style={styles.primaryCtaText}>Find Fleets</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(tabs)/fleet/settings" asChild>
            <TouchableOpacity style={styles.secondaryCta}>
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#2563EB" />
              <Text style={styles.secondaryCtaText}>Create Fleet</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <DashboardSection
          title="Suggested fleets"
          subtitle="Match by class, venue, and active activity"
          showBorder={false}
        >
          {suggestionsLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.loadingLabel}>Looking for fleets near you…</Text>
            </View>
          )}

          {!suggestionsLoading && filteredSuggestions.length === 0 && (
            <Text style={styles.placeholderText}>
              We don’t see obvious matches yet. Tap “Find Fleets” to browse the full directory.
            </Text>
          )}

          {!suggestionsLoading && filteredSuggestions.length > 0 && (
            <View style={styles.suggestionGrid}>
              {filteredSuggestions.slice(0, 6).map(fleet => (
                <FleetSuggestionCard
                  key={fleet.id}
                  fleet={fleet}
                  isMember={membershipFleetIds.has(fleet.id)}
                  joining={joiningFleetId === fleet.id}
                  onJoin={() => handleJoinFleet(fleet.id)}
                />
              ))}
            </View>
          )}
        </DashboardSection>

        <DashboardSection
          title="What fleets share"
          subtitle="Keep your team aligned from briefing to debrief"
          showBorder={false}
        >
          <View style={styles.benefitsList}>
            <BenefitRow
              icon="file-upload-outline"
              label="Central document library"
              description="Upload tuning guides, NOR/SSI files, and rig checklists once for everyone."
            />
            <BenefitRow
              icon="calendar-clock"
              label="Shared courses & calendars"
              description="Clone proven courses, coordinate race days, and keep everyone on schedule."
            />
            <BenefitRow
              icon="message-text"
              label="Fleet messaging & announcements"
              description="Post updates, tag coaches, and keep dock talk organized across channels."
            />
            <BenefitRow
              icon="chart-line-variant"
              label="Race replays & analysis"
              description="Replay GPS tracks, review mark roundings, and compare notes after racing."
            />
          </View>
        </DashboardSection>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.connectionStatusContainer}>
        <RealtimeConnectionIndicator variant="full" />
      </View>

      <DashboardSection
        title="Your Fleets"
        subtitle="Switch between classes and clubs"
        showBorder={false}
        headerAction={{
          label: 'Manage',
          onPress: () => router.push('/(tabs)/fleet/select'),
        }}
      >
        <View style={styles.fleetChipsRow}>
          {fleets.map((membership, index) => (
            <FleetChip
              key={membership.fleet.id}
              label={membership.fleet.name}
              role={membership.role}
              active={index === selectedFleetIndex}
              onPress={() => handleSelectFleet(index)}
            />
          ))}
          <Link href="/(tabs)/fleet/select" asChild>
            <TouchableOpacity style={styles.fleetAddChip}>
              <MaterialCommunityIcons name="plus" size={18} color="#2563EB" />
              <Text style={styles.fleetAddChipLabel}>Join</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </DashboardSection>

      <DashboardSection
        title={summaryFleet?.name ?? 'Fleet workspace'}
        subtitle={summaryFleet?.region ?? 'Status and shared insights'}
        showBorder={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>{summaryFleet?.name ?? 'Fleet'}</Text>
              <Text style={styles.summarySubtitle}>
                {summaryFleet?.region ?? 'Class workspace'}
                {activeFleetMembership?.role ? ` • ${formatRole(activeFleetMembership.role)}` : ''}
              </Text>
            </View>
            {summaryFleet?.id && (
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={() => confirmLeaveFleet(summaryFleet.id, summaryFleet.name)}
              >
                {leavingFleetId === summaryFleet.id ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="logout" size={18} color="#DC2626" />
                    <Text style={styles.leaveButtonText}>Leave</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.metricsRow}>
            <FleetMetric label="Members" value={overview?.metrics.members ?? 0} loading={overviewLoading} />
            <FleetMetric label="Followers" value={overview?.metrics.followers ?? 0} loading={overviewLoading} />
            <FleetMetric label="Resources" value={overview?.metrics.documents ?? 0} loading={overviewLoading} />
          </View>

          <View style={styles.metaRow}>
            <InfoPill icon="shield-account" text={`Visibility: ${summaryFleet?.visibility ?? 'private'}`} />
            {summaryFleet?.region && <InfoPill icon="map-marker" text={summaryFleet.region} />}
            {summaryFleet?.whatsappLink && <InfoPill icon="whatsapp" text="WhatsApp linked" highlight />}
          </View>

          <View style={styles.summaryFooter}>
            <TouchableOpacity style={styles.summaryAction} onPress={() => setShowPostComposer(true)}>
              <MaterialCommunityIcons name="message-plus" size={18} color="#2563EB" />
              <Text style={styles.summaryActionText}>Share update</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.summaryAction} onPress={() => setShowResourceUpload(true)}>
              <MaterialCommunityIcons name="file-upload-outline" size={18} color="#2563EB" />
              <Text style={styles.summaryActionText}>Upload doc</Text>
            </TouchableOpacity>
            {!!summaryFleet?.whatsappLink && (
              <TouchableOpacity
                style={styles.summaryAction}
                onPress={() => {
                  if (summaryFleet?.whatsappLink) {
                    Linking.openURL(summaryFleet.whatsappLink).catch(err =>
                      console.warn('Unable to open WhatsApp link:', err)
                    );
                  }
                }}
              >
                <MaterialCommunityIcons name="whatsapp" size={18} color="#22C55E" />
                <Text style={styles.summaryActionText}>Open chat</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </DashboardSection>

      <DashboardSection title="Quick Actions" showBorder={false}>
        <QuickActionGrid actions={quickActions} />
      </DashboardSection>

      <DashboardSection
        title="Shared Resources"
        subtitle="Fleet documents, guides, and playbooks"
        showBorder={false}
        headerAction={activeFleet ? {
          label: 'Library',
          onPress: () => router.push('/(tabs)/fleet/resources'),
        } : undefined}
      >
        {resourcesLoading && <Text style={styles.placeholderText}>Loading documents…</Text>}
        {!resourcesLoading && resources.length === 0 && (
          <Text style={styles.placeholderText}>
            No documents yet. Upload tuning guides, NOR/SSI, or debrief notes to get started.
          </Text>
        )}
        {!resourcesLoading && resources.length > 0 && (
          <View style={styles.resourceGrid}>
            {resources.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </View>
        )}
      </DashboardSection>

      <DashboardSection
        title="Planning Board"
        subtitle="Upcoming races and saved courses for this fleet"
      >
        <View style={styles.planningGrid}>
          <PlanningColumn
            title="Upcoming races"
            icon="flag-checkered"
            loading={sharedContentLoading}
            items={sharedRaces}
            renderItem={race => <RaceCard key={race.id} race={race} />}
            emptyMessage="No upcoming races shared yet. Add race days from the Races tab."
          />
          <PlanningColumn
            title="Favorite courses"
            icon="map-marker-distance"
            loading={sharedContentLoading}
            items={sharedCourses}
            renderItem={course => <CourseCard key={course.id} course={course} />}
            emptyMessage="No shared courses yet. Save a course from the Course Library to surface it here."
          />
        </View>
      </DashboardSection>

      <DashboardSection
        title="Recent Activity"
        subtitle="Posts, announcements, and fleet updates"
      >
        {postsLoading && <Text style={styles.placeholderText}>Loading activity…</Text>}
        {!postsLoading && !posts.length && (
          <Text style={styles.placeholderText}>No activity yet. Share a post to get started.</Text>
        )}
        {!postsLoading && posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onLike={() => handleLike(post.id, !!post.isLikedByUser)}
          />
        ))}
      </DashboardSection>

      {filteredSuggestions.length > 0 && (
        <DashboardSection
          title="More fleets to follow"
          subtitle="Expand your network with nearby classes"
          showBorder={false}
          headerAction={{
            label: 'Browse',
            onPress: () => router.push('/(tabs)/fleet/select'),
          }}
        >
          <View style={styles.suggestionGrid}>
            {filteredSuggestions.slice(0, 3).map(fleet => (
              <FleetSuggestionCard
                key={`more-${fleet.id}`}
                fleet={fleet}
                compact
                isMember={membershipFleetIds.has(fleet.id)}
                joining={joiningFleetId === fleet.id}
                onJoin={() => handleJoinFleet(fleet.id)}
              />
            ))}
          </View>
        </DashboardSection>
      )}

      {/* Post Composers */}
      <PostComposer
        visible={showPostComposer}
        onClose={() => setShowPostComposer(false)}
        onSubmit={handleCreatePost}
        fleetName={overview?.fleet.name}
      />
      <AnnouncementComposer
        visible={showAnnouncementComposer}
        onClose={() => setShowAnnouncementComposer(false)}
        onSubmit={handleCreateAnnouncement}
        fleetName={overview?.fleet.name}
      />
      {user && (
        <ResourceUploadComposer
          visible={showResourceUpload}
          onClose={() => setShowResourceUpload(false)}
          onSubmit={handleResourceUpload}
          fleetName={overview?.fleet.name}
          userId={user.id}
        />
      )}
    </ScrollView>
  );
}

const logger = createLogger('index');

const formatRole = (role: FleetMembership['role']): string => {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'captain':
      return 'Fleet captain';
    case 'coach':
      return 'Coach';
    case 'support':
      return 'Support crew';
    default:
      return 'Member';
  }
};

const FleetMetric = ({ label, value, loading }: { label: string; value: number; loading?: boolean }) => (
  <View style={styles.metricItem}>
    <Text style={styles.metricValue}>{loading ? '—' : value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const InfoPill = ({ icon, text, highlight }: { icon: string; text: string; highlight?: boolean }) => (
  <View style={[styles.pill, highlight && styles.pillHighlight]}>
    <MaterialCommunityIcons
      name={icon as any}
      size={14}
      color={highlight ? '#047857' : '#334155'}
    />
    <Text style={[styles.pillText, highlight && styles.pillTextHighlight]}>{text}</Text>
  </View>
);

const PostCard = React.memo(({ post, onLike }: { post: FleetPost; onLike: () => void }) => {
  const getPostIcon = (postType: FleetPost['postType']): string => {
    switch (postType) {
      case 'announcement':
        return 'bullhorn';
      case 'tuning_guide':
        return 'file-document-outline';
      case 'race_result':
        return 'trophy-outline';
      case 'event':
        return 'calendar-star';
      case 'check_in':
        return 'map-marker-check';
      case 'discussion':
        return 'message-text-outline';
      default:
        return 'information-outline';
    }
  };

  const getPostTypeColor = (postType: FleetPost['postType']): string => {
    switch (postType) {
      case 'announcement':
        return '#DC2626';
      case 'tuning_guide':
        return '#2563EB';
      case 'race_result':
        return '#059669';
      case 'event':
        return '#7C3AED';
      case 'check_in':
        return '#0891B2';
      default:
        return '#64748B';
    }
  };

  const renderPostContent = () => {
    if (post.postType === 'announcement') {
      return (
        <View style={styles.announcementBadge}>
          <MaterialCommunityIcons name="bullhorn" size={14} color="#DC2626" />
          <Text style={styles.announcementText}>ANNOUNCEMENT</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={[styles.postIcon, { backgroundColor: `${getPostTypeColor(post.postType)}15` }]}>
          <MaterialCommunityIcons
            name={getPostIcon(post.postType) as any}
            size={22}
            color={getPostTypeColor(post.postType)}
          />
        </View>
        <View style={styles.postHeaderContent}>
          <Text style={styles.postAuthor}>{post.author?.name || 'Unknown'}</Text>
          <Text style={styles.postMeta}>
            {new Date(post.createdAt).toLocaleDateString()} • {post.postType.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {renderPostContent()}

      {post.content && <Text style={styles.postContent}>{post.content}</Text>}

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postAction} onPress={onLike}>
          <MaterialCommunityIcons
            name={post.isLikedByUser ? 'heart' : 'heart-outline'}
            size={20}
            color={post.isLikedByUser ? '#DC2626' : '#64748B'}
          />
          <Text style={styles.postActionText}>{post.likesCount || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction}>
          <MaterialCommunityIcons name="comment-outline" size={20} color="#64748B" />
          <Text style={styles.postActionText}>{post.commentsCount || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const FleetChip = ({ label, role, active, onPress }: {
  label: string;
  role?: FleetMembership['role'];
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.fleetChip, active && styles.fleetChipActive]}
    onPress={onPress}
  >
    <MaterialCommunityIcons
      name="sail-boat"
      size={18}
      color={active ? '#2563EB' : '#64748B'}
    />
    <View style={styles.fleetChipText}>
      <Text style={[styles.fleetChipLabel, active && styles.fleetChipLabelActive]} numberOfLines={1}>
        {label}
      </Text>
      {role && (
        <Text style={styles.fleetChipRole}>{formatRole(role)}</Text>
      )}
    </View>
  </TouchableOpacity>
);

const ResourceCard = React.memo(({ resource }: { resource: FleetResource }) => {
  const filename = resource.document?.filename ?? 'Shared resource';
  const uploadedAt = resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : '';
  const owner = resource.ownerProfile?.fullName ?? 'Fleet library';

  return (
    <View style={styles.resourceCard}>
      <View style={styles.resourceHeader}>
        <MaterialCommunityIcons name="file-document-outline" size={22} color="#2563EB" />
        <View style={styles.resourceHeaderText}>
          <Text style={styles.resourceTitle} numberOfLines={2}>{filename}</Text>
          <Text style={styles.resourceMeta} numberOfLines={1}>
            {owner}{uploadedAt ? ` • ${uploadedAt}` : ''}
          </Text>
        </View>
      </View>

      {resource.tags.length > 0 && (
        <View style={styles.resourceTags}>
          {resource.tags.slice(0, 3).map(tag => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagPillText}>{tag}</Text>
            </View>
          ))}
          {resource.tags.length > 3 && (
            <View style={styles.tagPillMuted}>
              <Text style={styles.tagPillMutedText}>+{resource.tags.length - 3}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

type PlanningColumnProps<T> = {
  title: string;
  icon: string;
  loading: boolean;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyMessage: string;
};

const PlanningColumn = <T,>({
  title,
  icon,
  loading,
  items,
  renderItem,
  emptyMessage,
}: PlanningColumnProps<T>) => (
  <View style={styles.planningColumn}>
    <View style={styles.planningHeader}>
      <MaterialCommunityIcons name={icon as any} size={20} color="#2563EB" />
      <Text style={styles.planningTitle}>{title}</Text>
    </View>

    {loading && <Text style={styles.placeholderText}>Loading…</Text>}

    {!loading && items.length === 0 && (
      <Text style={styles.placeholderText}>{emptyMessage}</Text>
    )}

    {!loading && items.length > 0 && (
      <View style={styles.planningList}>
        {items.slice(0, 4).map(renderItem)}
      </View>
    )}
  </View>
);

const RaceCard = ({ race }: { race: FleetRaceSummary }) => {
  const startText = race.startTime
    ? new Date(race.startTime).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })
    : 'Timing TBA';

  return (
    <View style={styles.planningCard}>
      <Text style={styles.planningCardTitle} numberOfLines={2}>{race.raceName}</Text>
      <Text style={styles.planningCardMeta}>
        {startText}
        {race.venueName ? ` • ${race.venueName}` : ''}
      </Text>
      {race.racingAreaName && (
        <Text style={styles.planningCardCaption} numberOfLines={1}>{race.racingAreaName}</Text>
      )}
    </View>
  );
};

const CourseCard = ({ course }: { course: FleetCourseSummary }) => {
  const lastUsed = course.lastUsedDate
    ? `Last used ${new Date(course.lastUsedDate).toLocaleDateString()}`
    : 'Never used';

  return (
    <View style={styles.planningCard}>
      <Text style={styles.planningCardTitle} numberOfLines={2}>{course.name}</Text>
      <Text style={styles.planningCardMeta}>
        {course.courseType ? course.courseType.replace('_', ' ') : 'Course'} • {lastUsed}
      </Text>
      {course.description && (
        <Text style={styles.planningCardCaption} numberOfLines={2}>{course.description}</Text>
      )}
    </View>
  );
};

interface FleetSuggestionCardProps {
  fleet: SuggestedFleet;
  isMember: boolean;
  joining: boolean;
  onJoin: () => void;
  compact?: boolean;
}

const FleetSuggestionCard = ({
  fleet,
  isMember,
  joining,
  onJoin,
  compact,
}: FleetSuggestionCardProps) => (
  <View style={[styles.suggestionCard, compact && styles.suggestionCardCompact]}>
    <View style={styles.suggestionHeader}>
      <MaterialCommunityIcons name="sail-boat" size={24} color="#2563EB" />
      <View style={styles.suggestionHeaderText}>
        <Text style={styles.suggestionTitle} numberOfLines={compact ? 1 : 2}>{fleet.name}</Text>
        {fleet.region && (
          <Text style={styles.suggestionSubtitle} numberOfLines={1}>{fleet.region}</Text>
        )}
      </View>
    </View>

    {!compact && fleet.description && (
      <Text style={styles.suggestionDescription} numberOfLines={3}>{fleet.description}</Text>
    )}

    <View style={styles.suggestionMeta}>
      {fleet.boat_classes?.name && (
        <View style={styles.suggestionMetaItem}>
          <MaterialCommunityIcons name="sail-boat" size={14} color="#64748B" />
          <Text style={styles.suggestionMetaText}>{fleet.boat_classes.name}</Text>
        </View>
      )}
      {typeof fleet.member_count === 'number' && (
        <View style={styles.suggestionMetaItem}>
          <MaterialCommunityIcons name="account-group" size={14} color="#64748B" />
          <Text style={styles.suggestionMetaText}>{fleet.member_count} sailors</Text>
        </View>
      )}
    </View>

    <View style={styles.suggestionFooter}>
      {isMember ? (
        <View style={styles.suggestionJoined}>
          <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />
          <Text style={styles.suggestionJoinedText}>Already joined</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.suggestionButton,
            joining && styles.suggestionButtonDisabled,
          ]}
          onPress={onJoin}
          disabled={joining}
        >
          {joining ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="account-plus" size={18} color="#FFFFFF" />
              <Text style={styles.suggestionButtonText}>Join fleet</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const BenefitRow = ({ icon, label, description }: { icon: string; label: string; description: string }) => (
  <View style={styles.benefitRow}>
    <MaterialCommunityIcons name={icon as any} size={22} color="#2563EB" />
    <View style={styles.benefitText}>
      <Text style={styles.benefitLabel}>{label}</Text>
      <Text style={styles.benefitDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  connectionStatusContainer: {
    marginBottom: 12,
  },
  emptyStateContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 18,
  },
  heroBanner: {
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  heroTextGroup: {
    flex: 1,
    gap: 8,
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4338CA',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#4338CA',
    lineHeight: 20,
  },
  heroIcon: {
    backgroundColor: '#E0E7FF',
    borderRadius: 14,
    padding: 12,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryCtaText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    boxShadow: '0px 8px',
    elevation: 4,
  },
  fleetChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  fleetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5F5',
    backgroundColor: '#F8FAFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  fleetChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  fleetChipText: {
    maxWidth: 160,
  },
  fleetChipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  fleetChipLabelActive: {
    color: '#1D4ED8',
  },
  fleetChipRole: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  fleetAddChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  fleetAddChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E40AF',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillHighlight: {
    backgroundColor: '#DCFCE7',
  },
  pillText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  pillTextHighlight: {
    color: '#047857',
  },
  summaryFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  summaryActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FDA4AF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
  },
  leaveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  placeholderText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  resourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resourceCard: {
    flexBasis: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
  },
  resourceHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  resourceHeaderText: {
    flex: 1,
    gap: 4,
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  resourceMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  resourceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: '#E0E7FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3730A3',
  },
  tagPillMuted: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagPillMutedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  planningGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  planningColumn: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  planningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  planningList: {
    gap: 10,
  },
  planningCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  planningCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  planningCardMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  planningCardCaption: {
    fontSize: 12,
    color: '#94A3B8',
  },
  suggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  suggestionCard: {
    flexBasis: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  suggestionCardCompact: {
    flexBasis: '30%',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestionHeaderText: {
    flex: 1,
    gap: 4,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  suggestionDescription: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  suggestionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  suggestionMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  suggestionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  suggestionButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  suggestionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  suggestionJoined: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionJoinedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
  },
  benefitsList: {
    gap: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  benefitText: {
    flex: 1,
    gap: 4,
  },
  benefitLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  benefitDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  postIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postHeaderContent: {
    flex: 1,
  },
  postAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  postMeta: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  announcementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  announcementText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  postContent: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});
