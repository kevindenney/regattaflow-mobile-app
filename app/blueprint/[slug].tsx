/**
 * Blueprint Public Page
 *
 * Landing page for a published blueprint. Shows the author's timeline steps
 * with a subscribe CTA. Accessible via /blueprint/{slug}.
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import {
  useBlueprint,
  useBlueprintSteps,
  useBlueprintSubscription,
  useSubscribe,
  useUnsubscribe,
} from '@/hooks/useBlueprint';
import { getBlueprintAccessInfo } from '@/services/BlueprintService';
import type { TimelineStepRecord } from '@/types/timeline-steps';

const C = {
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  accent: '#00897B',
  accentBg: 'rgba(0,137,123,0.08)',
  accentLight: '#E0F2F1',
  border: '#E5E4E1',
  labelDark: '#1A1918',
  labelMid: '#6D6C6A',
  labelLight: '#9C9B99',
  gold: '#D4A64A',
  green: '#3D8A5A',
  coral: '#D89575',
} as const;

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  pending: { color: C.labelMid, icon: 'ellipse-outline', label: 'Pending' },
  in_progress: { color: C.gold, icon: 'play-circle', label: 'In Progress' },
  completed: { color: C.green, icon: 'checkmark-circle', label: 'Completed' },
  skipped: { color: C.coral, icon: 'close-circle-outline', label: 'Skipped' },
};

export default function BlueprintPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const { data: blueprint, isLoading: blueprintLoading } = useBlueprint(slug);
  const { data: steps, isLoading: stepsLoading } = useBlueprintSteps(blueprint?.id);
  const { data: subscription } = useBlueprintSubscription(blueprint?.id);
  const subscribeMutation = useSubscribe();
  const unsubscribeMutation = useUnsubscribe();

  // Access info for restricted blueprints (fetched when blueprint is null but might exist)
  const [accessInfo, setAccessInfo] = useState<{
    exists: boolean;
    access_level?: string;
    org_name?: string;
    org_slug?: string;
    title?: string;
  } | null>(null);

  useEffect(() => {
    if (!blueprintLoading && !blueprint && slug) {
      getBlueprintAccessInfo(slug).then(setAccessInfo);
    }
  }, [blueprintLoading, blueprint, slug]);

  const isSubscribed = !!subscription;
  const isOwner = user?.id === blueprint?.user_id;

  const handleSubscribe = useCallback(async () => {
    if (!user) {
      router.push('/(auth)/signup');
      return;
    }
    if (!blueprint) return;

    if (isSubscribed) {
      await unsubscribeMutation.mutateAsync(blueprint.id);
    } else {
      await subscribeMutation.mutateAsync(blueprint.id);
    }
  }, [user, blueprint, isSubscribed, subscribeMutation, unsubscribeMutation, router]);

  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  const containerStyle: ViewStyle[] =
    Platform.OS === 'web'
      ? [styles.container, styles.webContainer]
      : [styles.container];

  if (blueprintLoading) {
    return (
      <Container style={containerStyle}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      </Container>
    );
  }

  if (!blueprint) {
    // Check if it's access-restricted vs truly not found
    const isRestricted = accessInfo?.exists && accessInfo?.access_level !== 'public';

    return (
      <Container style={containerStyle}>
        <View style={styles.emptyContainer}>
          <Ionicons
            name={isRestricted ? 'lock-closed-outline' : 'layers-outline'}
            size={48}
            color={C.labelLight}
          />
          <Text style={styles.emptyTitle}>
            {isRestricted ? 'Members Only Blueprint' : 'Blueprint not found'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isRestricted
              ? `"${accessInfo?.title}" is available to members of ${accessInfo?.org_name ?? 'this organization'}. Join to subscribe.`
              : 'This blueprint may have been unpublished or the URL is incorrect.'}
          </Text>
          {isRestricted && accessInfo?.org_slug && (
            <Pressable
              style={styles.joinOrgBtn}
              onPress={() => router.push(`/${accessInfo.org_slug}` as any)}
            >
              <Ionicons name="business-outline" size={16} color="#FFFFFF" />
              <Text style={styles.joinOrgBtnText}>
                Join {accessInfo.org_name}
              </Text>
            </Pressable>
          )}
        </View>
      </Container>
    );
  }

  const completedCount = steps?.filter((s) => s.status === 'completed').length ?? 0;
  const totalCount = steps?.length ?? 0;

  return (
    <Container style={containerStyle}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="layers" size={28} color={C.accent} />
          </View>
          <Text style={styles.heroTitle}>{blueprint.title}</Text>
          {blueprint.description && (
            <Text style={styles.heroDescription}>{blueprint.description}</Text>
          )}

          {/* Organization badge */}
          {blueprint.organization_name && (
            <Pressable
              style={styles.orgBadgeRow}
              onPress={() => {
                if (blueprint.organization_slug) {
                  router.push(`/${blueprint.organization_slug}` as any);
                }
              }}
            >
              <Ionicons name="business-outline" size={14} color={C.accent} />
              <Text style={styles.orgBadgeText}>
                Published by {blueprint.organization_name}
              </Text>
              {blueprint.access_level === 'org_members' && (
                <View style={styles.membersOnlyBadge}>
                  <Ionicons name="lock-closed" size={8} color={C.accent} />
                  <Text style={styles.membersOnlyText}>Members</Text>
                </View>
              )}
            </Pressable>
          )}

          {/* Author */}
          <View style={styles.authorRow}>
            <View
              style={[
                styles.authorAvatar,
                { backgroundColor: blueprint.author_avatar_color ?? C.accentBg },
              ]}
            >
              <Text style={styles.authorEmoji}>
                {blueprint.author_avatar_emoji ?? '👤'}
              </Text>
            </View>
            <View>
              <Text style={styles.authorName}>
                {blueprint.author_name ?? 'Anonymous'}
              </Text>
              <Text style={styles.authorMeta}>
                {blueprint.subscriber_count} subscriber
                {blueprint.subscriber_count !== 1 ? 's' : ''} · {totalCount} step
                {totalCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Subscribe CTA */}
          {!isOwner && (
            <Pressable
              style={[styles.subscribeBtn, isSubscribed && styles.subscribedBtn]}
              onPress={handleSubscribe}
              disabled={subscribeMutation.isPending || unsubscribeMutation.isPending}
            >
              <Ionicons
                name={isSubscribed ? 'checkmark-circle' : 'add-circle-outline'}
                size={18}
                color={isSubscribed ? C.accent : '#FFFFFF'}
              />
              <Text
                style={[styles.subscribeBtnText, isSubscribed && styles.subscribedBtnText]}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe to Blueprint'}
              </Text>
            </Pressable>
          )}

          {isOwner && (
            <View style={styles.ownerBadge}>
              <Ionicons name="person-circle-outline" size={12} color={C.accent} />
              <Text style={styles.ownerBadgeText}>Your Blueprint</Text>
            </View>
          )}
        </View>

        {/* Progress summary */}
        <View style={styles.progressBar}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {completedCount}/{totalCount} steps completed
          </Text>
        </View>

        {/* Steps timeline */}
        <View style={styles.stepsSection}>
          <Text style={styles.sectionTitle}>Timeline Steps</Text>
          {stepsLoading ? (
            <ActivityIndicator size="small" color={C.accent} style={{ marginTop: 20 }} />
          ) : (
            steps?.map((step, index) => (
              <StepRow
                key={step.id}
                step={step}
                isLast={index === (steps.length ?? 0) - 1}
              />
            ))
          )}
        </View>
      </ScrollView>
    </Container>
  );
}

// ---------------------------------------------------------------------------
// Step row component
// ---------------------------------------------------------------------------

function StepRow({ step, isLast }: { step: TimelineStepRecord; isLast: boolean }) {
  const cfg = STATUS_CONFIG[step.status] ?? STATUS_CONFIG.pending;

  return (
    <View style={styles.stepRow}>
      {/* Timeline line */}
      <View style={styles.stepTimeline}>
        <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
        {!isLast && <View style={styles.stepLine} />}
      </View>

      {/* Content */}
      <View style={[styles.stepContent, isLast && { paddingBottom: 0 }]}>
        <Text style={styles.stepTitle}>{step.title}</Text>
        {step.description && (
          <Text style={styles.stepDescription} numberOfLines={2}>
            {step.description}
          </Text>
        )}
        <View style={styles.stepMeta}>
          <View style={[styles.stepStatusPill, { backgroundColor: `${cfg.color}15` }]}>
            <Text style={[styles.stepStatusText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
          {step.category !== 'general' && (
            <Text style={styles.stepCategory}>{step.category}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  webContainer: {
    minHeight: '100vh' as any,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.labelDark,
  },
  emptySubtitle: {
    fontSize: 13,
    color: C.labelMid,
    textAlign: 'center',
  },
  joinOrgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  joinOrgBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  orgBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.accentBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 10,
  },
  orgBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.accent,
  },
  membersOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: C.accentLight,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  membersOnlyText: {
    fontSize: 9,
    fontWeight: '600',
    color: C.accent,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },

  // Hero
  hero: {
    backgroundColor: C.cardBg,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.accentBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.labelDark,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 14,
    color: C.labelMid,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 16,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorEmoji: {
    fontSize: 18,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.labelDark,
  },
  authorMeta: {
    fontSize: 11,
    color: C.labelMid,
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 300,
  },
  subscribedBtn: {
    backgroundColor: C.accentLight,
    borderWidth: 1,
    borderColor: C.accent,
  },
  subscribeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subscribedBtnText: {
    color: C.accent,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.accentBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  ownerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.accent,
  },

  // Progress
  progressBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: C.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  progressTrack: {
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: 4,
    backgroundColor: C.green,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: C.labelMid,
  },

  // Steps
  stepsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.labelDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepTimeline: {
    alignItems: 'center',
    width: 16,
  },
  stepLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: C.border,
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.labelDark,
  },
  stepDescription: {
    fontSize: 12,
    color: C.labelMid,
    marginTop: 2,
    lineHeight: 17,
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  stepStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  stepStatusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  stepCategory: {
    fontSize: 9,
    color: C.labelLight,
  },
});
