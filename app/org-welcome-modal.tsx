/**
 * Org Welcome Modal
 *
 * Root-level route that presents the org welcome/catalog as a transparent modal
 * overlay. Used when a user taps an "org_membership_approved" notification.
 *
 * On web, wraps content in a centered card overlay (same pattern as account.tsx).
 * On native, Expo Router's presentation: 'transparentModal' handles it.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useOrganizationBlueprints } from '@/hooks/useBlueprint';
import { BlueprintPickerCard } from '@/components/onboarding/BlueprintPickerCard';
import { getOnboardingContext } from '@/lib/onboarding/interestContext';
import { useInterest } from '@/providers/InterestProvider';
import { useOrgPeers } from '@/hooks/useOrgPeers';

interface OrgOnboardingConfig {
  welcome_message?: string;
  key_links?: { label: string; url: string }[];
  orientation_text?: string;
}

export default function OrgWelcomeModal() {
  const router = useRouter();
  const { addInterest, switchInterest } = useInterest();
  const { orgId, orgName: paramOrgName } = useLocalSearchParams<{
    orgId: string;
    orgName?: string;
  }>();

  const [interestSlug, setInterestSlug] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(paramOrgName || null);
  const [onboardingConfig, setOnboardingConfig] = useState<OrgOnboardingConfig | null>(null);

  const { data: orgBlueprints } = useOrganizationBlueprints(orgId || null);
  const publishedBlueprints = orgBlueprints?.filter((bp) => bp.is_published) ?? [];

  const { data: peers } = useOrgPeers(orgId || null, { limit: 5 });

  const ctx = getOnboardingContext(interestSlug || undefined);

  useEffect(() => {
    if (!orgId) return;
    void (async () => {
      try {
        const { data: orgRow } = await supabase
          .from('organizations')
          .select('name, onboarding_config, interest_slug')
          .eq('id', orgId)
          .maybeSingle();
        if (orgRow?.name && !paramOrgName) {
          setOrgName(orgRow.name);
        }
        if (orgRow?.onboarding_config) {
          setOnboardingConfig(orgRow.onboarding_config as OrgOnboardingConfig);
        }
        if (orgRow?.interest_slug) {
          setInterestSlug(orgRow.interest_slug);
          try {
            await addInterest(orgRow.interest_slug);
            await switchInterest(orgRow.interest_slug);
          } catch {
            // Non-critical
          }
        }
      } catch {
        // Non-critical
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const handleDismiss = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  const handleGoToTimeline = useCallback(() => {
    router.replace('/(tabs)/races' as any);
  }, [router]);

  const content = (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={22} color="#64748B" />
        </TouchableOpacity>

        <View style={[styles.iconCircle, { backgroundColor: '#16A34A15' }]}>
          <Ionicons name="checkmark-circle" size={56} color="#16A34A" />
        </View>

        <Text style={styles.title}>Welcome to {orgName}!</Text>
        <Text style={styles.description}>
          Your membership is now active. Explore pathways and connect with others.
        </Text>

        {/* Org custom welcome message */}
        {onboardingConfig?.welcome_message && (
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeMessage}>{onboardingConfig.welcome_message}</Text>
            {onboardingConfig.key_links && onboardingConfig.key_links.length > 0 && (
              <View style={styles.keyLinks}>
                {onboardingConfig.key_links.map((link, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.keyLinkRow}
                    onPress={() => Linking.openURL(link.url)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="link" size={14} color={ctx.color} />
                    <Text style={[styles.keyLinkText, { color: ctx.color }]}>{link.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* People you might know */}
        {peers && peers.length > 0 && (
          <View style={styles.peersSection}>
            <Text style={styles.sectionLabel}>People already here</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.peersRow}
            >
              {peers.map((peer) => (
                <TouchableOpacity
                  key={peer.id}
                  style={styles.peerCard}
                  onPress={() => router.push(`/person/${peer.id}`)}
                  activeOpacity={0.7}
                >
                  {peer.avatar_url ? (
                    <Image source={{ uri: peer.avatar_url }} style={styles.peerAvatar} />
                  ) : (
                    <View style={[styles.peerAvatarPlaceholder, { backgroundColor: ctx.color + '20' }]}>
                      <Ionicons name="person" size={18} color={ctx.color} />
                    </View>
                  )}
                  <Text style={styles.peerName} numberOfLines={1}>
                    {peer.full_name || 'Member'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Blueprint picker */}
        {publishedBlueprints.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>
              Subscribe to pathways to add steps to your timeline:
            </Text>
            <View style={styles.blueprintList}>
              {publishedBlueprints.map((bp) => (
                <BlueprintPickerCard
                  key={bp.id}
                  blueprint={bp}
                  accentColor={ctx.color}
                />
              ))}
            </View>
          </>
        )}

        {/* Guidance */}
        <View style={[styles.guidanceCard, { backgroundColor: ctx.color + '08' }]}>
          <Ionicons name="bulb-outline" size={18} color={ctx.color} />
          <Text style={styles.guidanceText}>
            {onboardingConfig?.orientation_text ||
              (publishedBlueprints.length > 0
                ? 'Subscribe to a pathway above, then open your timeline to see your first steps.'
                : 'Explore your timeline and add your first steps.')}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: ctx.color }]}
          onPress={handleGoToTimeline}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>Go to Timeline</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Web: centered card overlay with backdrop
  if (Platform.OS === 'web') {
    return (
      <View style={webStyles.overlay}>
        <Pressable style={webStyles.backdrop} onPress={handleDismiss} />
        <View style={webStyles.card}>
          {content}
        </View>
      </View>
    );
  }

  // Native: rendered as transparentModal by Expo Router
  return (
    <View style={styles.container}>
      {content}
    </View>
  );
}

// Web modal overlay styles
const webStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: 480,
    maxWidth: '90%' as any,
    maxHeight: '85vh' as any,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any)
      : {}),
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  blueprintList: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  continueButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  welcomeCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  welcomeMessage: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  keyLinks: {
    marginTop: 12,
    gap: 8,
  },
  keyLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  keyLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  peersSection: {
    width: '100%',
    marginBottom: 20,
  },
  peersRow: {
    gap: 12,
    paddingVertical: 4,
  },
  peerCard: {
    alignItems: 'center',
    width: 64,
  },
  peerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 4,
  },
  peerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  peerName: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
  },
  guidanceCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  guidanceText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
});
