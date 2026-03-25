/**
 * OrgBlueprintsStrip
 *
 * Shows available blueprints from the user's organization that they haven't
 * subscribed to yet. Appears on the races/timeline tab for org members.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useOrganizationBlueprints,
  useSubscribedBlueprints,
  useSubscribe,
} from '@/hooks/useBlueprint';
import { NotificationService } from '@/services/NotificationService';
import { useAuth } from '@/providers/AuthProvider';

const C = {
  bg: 'rgba(0,137,123,0.06)',
  border: 'rgba(0,137,123,0.12)',
  accent: '#00897B',
  label: '#1A1918',
  labelMid: '#6D6C6A',
} as const;

interface OrgBlueprintsStripProps {
  orgId?: string | null;
  orgName?: string | null;
  interestId?: string | null;
}

export function OrgBlueprintsStrip({ orgId, orgName, interestId }: OrgBlueprintsStripProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { data: orgBlueprints } = useOrganizationBlueprints(orgId);
  const { data: subscribed } = useSubscribedBlueprints(interestId);
  const subscribeMutation = useSubscribe();
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  if (!orgBlueprints || !user) return null;

  // Filter to current interest and exclude already-subscribed
  const subscribedIds = new Set((subscribed ?? []).map((s) => s.blueprint_id));
  const available = orgBlueprints.filter(
    (bp) =>
      bp.is_published &&
      bp.user_id !== user.id &&
      (!interestId || bp.interest_id === interestId) &&
      !subscribedIds.has(bp.id),
  );

  if (available.length === 0) return null;

  const handleSubscribe = async (bp: (typeof available)[0]) => {
    setSubscribingId(bp.id);
    try {
      await subscribeMutation.mutateAsync(bp.id);
      if (bp.user_id !== user.id) {
        NotificationService
          .notifyBlueprintSubscribed({
            blueprintOwnerId: bp.user_id,
            subscriberId: user.id,
            subscriberName: user.user_metadata?.full_name || user.email || 'Someone',
            blueprintId: bp.id,
            blueprintTitle: bp.title,
          })
          .catch(() => {});
      }
    } finally {
      setSubscribingId(null);
    }
  };

  return (
    <View style={styles.strip}>
      <View style={styles.header}>
        <Ionicons name="business-outline" size={12} color={C.accent} />
        <Text style={styles.headerText}>
          {orgName ? `${orgName} Pathways` : 'Organization Pathways'}
        </Text>
      </View>
      {available.map((bp) => (
        <View key={bp.id} style={styles.row}>
          <Pressable
            style={styles.info}
            onPress={() => router.push(`/blueprint/${bp.slug}` as any)}
          >
            <Ionicons name="layers-outline" size={12} color={C.accent} />
            <Text style={styles.title} numberOfLines={1}>
              {bp.title}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {bp.subscriber_count} subscriber{bp.subscriber_count !== 1 ? 's' : ''}
            </Text>
          </Pressable>
          <Pressable
            style={styles.subscribeBtn}
            onPress={() => handleSubscribe(bp)}
            disabled={subscribingId === bp.id}
          >
            {subscribingId === bp.id ? (
              <ActivityIndicator size="small" color={C.accent} />
            ) : (
              <Text style={styles.subscribeBtnText}>Subscribe</Text>
            )}
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: C.accent,
    flexShrink: 1,
  },
  meta: {
    fontSize: 10,
    color: C.labelMid,
    flexShrink: 0,
  },
  subscribeBtn: {
    backgroundColor: C.accent,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  subscribeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
