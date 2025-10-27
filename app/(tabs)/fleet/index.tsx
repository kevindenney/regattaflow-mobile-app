import React, { useMemo, useState, useCallback } from 'react';
import { Link, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Linking, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { DashboardSection, QuickActionGrid, type QuickAction } from '@/components/dashboard/shared';
import { useAuth } from '@/providers/AuthProvider';
import { useFleetOverview, useUserFleets } from '@/hooks/useFleetData';
import { useFleetPosts } from '@/hooks/useFleetSocial';
import { FleetPost } from '@/services/FleetSocialService';
import { PostComposer } from '@/components/fleets/PostComposer';
import { AnnouncementComposer } from '@/components/fleets/AnnouncementComposer';
import { ResourceUploadComposer } from '@/components/fleets/ResourceUploadComposer';
import { fleetService } from '@/services/fleetService';
import { RealtimeConnectionIndicator } from '@/components/ui/RealtimeConnectionIndicator';

export default function FleetOverviewScreen() {
  const { user } = useAuth();
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [showAnnouncementComposer, setShowAnnouncementComposer] = useState(false);
  const [showResourceUpload, setShowResourceUpload] = useState(false);

  console.log('[FleetOverview] Component render - user:', user?.id);

  const { fleets, loading: fleetsLoading, refresh: refreshFleets } = useUserFleets(user?.id);
  console.log('[FleetOverview] After useUserFleets:', { fleetsCount: fleets.length, fleetsLoading });

  // Refresh fleets when screen comes into focus (after returning from select screen)
  useFocusEffect(
    React.useCallback(() => {
      console.log('[FleetOverview] useFocusEffect triggered - refreshing fleets');
      refreshFleets();
    }, [refreshFleets])
  );

  const activeFleet = fleets[0]?.fleet;
  console.log('[FleetOverview] Active fleet:', activeFleet?.id, activeFleet?.name);

  const { overview, loading: overviewLoading } = useFleetOverview(activeFleet?.id);
  const { posts, loading: postsLoading, likePost, unlikePost, createPost } = useFleetPosts(activeFleet?.id, { limit: 10 });

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
  console.log('[FleetOverview] Empty state check:', {
    fleetsLoading,
    fleetsLength: fleets.length,
    hasActiveFleet: !!activeFleet,
    shouldShowEmpty
  });

  if (shouldShowEmpty) {
    console.log('[FleetOverview] Rendering empty state');
    return (
      <ScrollView contentContainerStyle={[styles.container, styles.centerContent]}>
        <MaterialCommunityIcons name="sail-boat" size={52} color="#94A3B8" />
        <Text style={styles.emptyTitle}>Join your fleets</Text>
        <Text style={styles.emptySubtitle}>
          Fleets are groups of sailors in the same class (e.g., "Hong Kong Dragon Fleet").
          This is separate from your individual boats. Join fleets to see updates, documents, and connect with other sailors.
        </Text>
        <Link href="/(tabs)/fleet/select" style={styles.link}>
          Join Fleets
        </Link>
      </ScrollView>
    );
  }

  console.log('[FleetOverview] Rendering fleet content');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Real-time Connection Status */}
      <View style={styles.connectionStatusContainer}>
        <RealtimeConnectionIndicator variant="full" />
      </View>

      <DashboardSection
        title={overview?.fleet.name ?? 'Fleet overview'}
        subtitle={overview?.fleet.region ?? 'Fleet status and key metrics'}
        showBorder={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>{overview?.fleet.name ?? 'Fleet'}</Text>
              {overview?.fleet.classId && (
                <Text style={styles.summarySubtitle}>Class ID: {overview.fleet.classId}</Text>
              )}
            </View>
            <MaterialCommunityIcons name="sail-boat" size={36} color="#1D4ED8" />
          </View>

          <View style={styles.metricsRow}>
            <FleetMetric label="Members" value={overview?.metrics.members ?? 0} loading={overviewLoading} />
            <FleetMetric label="Followers" value={overview?.metrics.followers ?? 0} loading={overviewLoading} />
            <FleetMetric label="Resources" value={overview?.metrics.documents ?? 0} loading={overviewLoading} />
          </View>

          <View style={styles.metaRow}>
            <InfoPill icon="shield-account" text={`Visibility: ${overview?.fleet.visibility ?? 'private'}`} />
            {overview?.fleet.region && <InfoPill icon="map-marker" text={overview.fleet.region} />}
            {overview?.fleet.whatsappLink && <InfoPill icon="whatsapp" text="WhatsApp linked" highlight />}
          </View>
        </View>
      </DashboardSection>

      <DashboardSection title="Quick Actions" showBorder={false}>
        <QuickActionGrid actions={quickActions} />
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
            onLike={() => handleLike(post.id, post.isLikedByUser)}
          />
        ))}
      </DashboardSection>

      <DashboardSection
        title="Fleet Directory"
        subtitle="See everyone sailing in this fleet"
        footerAction={{ label: 'View members', href: '/(tabs)/fleet/members' }}
      >
        <Text style={styles.placeholderText}>
          Member list coming soon. You'll be able to follow sailors, invite crew, and connect with coaches.
        </Text>
      </DashboardSection>

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
  centerContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  link: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    boxShadow: '0px 8px',
    elevation: 4,
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
  placeholderText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
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
