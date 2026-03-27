/**
 * DiscoverOrgsContent — Organizations segment for the Discover tab
 *
 * Shows organizations for the current interest, with search and join functionality.
 * Adapted from app/onboarding/org-discovery.tsx.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';
import { useInterest } from '@/providers/InterestProvider';
import {
  organizationDiscoveryService,
  type OrganizationJoinMode,
} from '@/services/OrganizationDiscoveryService';
import { supabase } from '@/services/supabase';
import { IOS_COLORS, IOS_SPACING, IOS_RADIUS } from '@/lib/design-tokens-ios';

// =============================================================================
// TYPES
// =============================================================================

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  join_mode: OrganizationJoinMode;
}

type OrgJoinState = 'idle' | 'joining' | 'joined' | 'pending' | 'blocked';

interface DiscoverOrgsContentProps {
  toolbarOffset: number;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DiscoverOrgsContent({
  toolbarOffset,
  onScroll,
}: DiscoverOrgsContentProps) {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const isLoggedIn = !!user && !isGuest;
  const { currentInterest } = useInterest();
  const interestSlug = currentInterest?.slug;
  const accentColor = currentInterest?.accent_color || '#4338CA';

  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OrgRow[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [joinStates, setJoinStates] = useState<Record<string, OrgJoinState>>({});

  const loadOrgs = async () => {
    setLoading(true);
    try {
      if (!interestSlug) {
        setOrgs([]);
        return;
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, join_mode')
        .eq('interest_slug', interestSlug)
        .eq('is_active', true)
        .order('name')
        .limit(30);

      if (error) throw error;

      setOrgs(
        (data || []).map((o) => ({
          ...o,
          join_mode: o.join_mode || 'invite_only',
        }))
      );
    } catch (err) {
      console.error('[DiscoverOrgs] Error loading orgs:', err);
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  };

  // Load orgs for current interest
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadOrgs(); }, [interestSlug]);

  // Search handler with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await organizationDiscoveryService.searchOrganizations({
          query: searchQuery,
          limit: 20,
        });
        setSearchResults(
          results.map((r) => ({
            id: r.id,
            name: r.name,
            slug: r.slug || '',
            join_mode: r.join_mode,
          }))
        );
      } catch (err) {
        console.error('[DiscoverOrgs] Search error:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleJoin = useCallback(
    async (org: OrgRow) => {
      if (!isLoggedIn) {
        router.push('/(auth)/signup');
        return;
      }

      setJoinStates((prev) => ({ ...prev, [org.id]: 'joining' }));
      try {
        const result = await organizationDiscoveryService.requestJoin({
          orgId: org.id,
          mode: org.join_mode,
        });

        if (result.status === 'active' || result.status === 'existing') {
          setJoinStates((prev) => ({ ...prev, [org.id]: 'joined' }));
        } else if (result.status === 'pending') {
          setJoinStates((prev) => ({ ...prev, [org.id]: 'pending' }));
        } else {
          setJoinStates((prev) => ({ ...prev, [org.id]: 'blocked' }));
        }
      } catch (err) {
        console.error('[DiscoverOrgs] Join error:', err);
        setJoinStates((prev) => ({ ...prev, [org.id]: 'idle' }));
      }
    },
    [isLoggedIn, router]
  );

  const handleOrgPress = useCallback(
    (org: OrgRow) => {
      if (org.slug) {
        router.push(`/org/${org.slug}` as any);
      }
    },
    [router]
  );

  const renderOrgCard = (org: OrgRow) => {
    const state = joinStates[org.id] || 'idle';
    const isInviteOnly = org.join_mode === 'invite_only';

    return (
      <TouchableOpacity
        key={org.id}
        style={styles.orgCard}
        onPress={() => handleOrgPress(org)}
        activeOpacity={0.7}
      >
        <View style={styles.orgInfo}>
          <View style={[styles.orgIcon, { backgroundColor: accentColor + '12' }]}>
            <Ionicons name="business-outline" size={20} color={accentColor} />
          </View>
          <View style={styles.orgText}>
            <Text style={styles.orgName}>{org.name}</Text>
            {isInviteOnly && <Text style={styles.orgMeta}>Invite only</Text>}
            {org.join_mode === 'request_to_join' && (
              <Text style={styles.orgMeta}>Requires approval</Text>
            )}
            {org.join_mode === 'open_join' && (
              <Text style={styles.orgMeta}>Open to join</Text>
            )}
          </View>
        </View>

        {isInviteOnly ? (
          <View style={styles.inviteOnlyBadge}>
            <Ionicons name="lock-closed-outline" size={14} color="#94A3B8" />
          </View>
        ) : state === 'joined' ? (
          <View style={[styles.statusBadge, { backgroundColor: '#16A34A' }]}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
        ) : state === 'pending' ? (
          <View style={[styles.statusBadge, { backgroundColor: '#D97706' }]}>
            <Ionicons name="time" size={16} color="#FFFFFF" />
          </View>
        ) : state === 'joining' ? (
          <View style={styles.statusBadge}>
            <ActivityIndicator size="small" color={accentColor} />
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.joinButton, { borderColor: accentColor }]}
            onPress={(e) => {
              e.stopPropagation?.();
              handleJoin(org);
            }}
          >
            <Text style={[styles.joinButtonText, { color: accentColor }]}>
              {org.join_mode === 'request_to_join' ? 'Request' : 'Join'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: toolbarOffset }]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={IOS_COLORS.secondaryLabel} style={styles.searchIconStyle} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search organizations..."
              placeholderTextColor={IOS_COLORS.secondaryLabel}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
            {searching && <ActivityIndicator size="small" color={IOS_COLORS.secondaryLabel} />}
          </View>
        </View>

        {/* No interest selected */}
        {!interestSlug && (
          <View style={styles.emptyContainer}>
            <Ionicons name="compass-outline" size={40} color={IOS_COLORS.tertiaryLabel} />
            <Text style={styles.emptyTitle}>No interest selected</Text>
            <Text style={styles.emptyText}>
              Pick an interest to see related organizations.
            </Text>
          </View>
        )}

        {/* Loading */}
        {loading && interestSlug && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accentColor} />
          </View>
        )}

        {/* Org list */}
        {!loading && interestSlug && (
          <>
            {searchResults && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  SEARCH RESULTS · {searchResults.length}
                </Text>
                {searchResults.length > 0 ? (
                  <View style={styles.orgList}>
                    {searchResults.map(renderOrgCard)}
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No organizations found</Text>
                  </View>
                )}
              </View>
            )}

            {!searchResults && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {currentInterest?.name?.toUpperCase() || 'ALL'} ORGANIZATIONS · {orgs.length}
                </Text>
                {orgs.length > 0 ? (
                  <View style={styles.orgList}>{orgs.map(renderOrgCard)}</View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="business-outline" size={28} color={IOS_COLORS.tertiaryLabel} />
                    <Text style={styles.emptyText}>
                      No organizations for this interest yet.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  // Search
  searchContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.sm,
    paddingBottom: IOS_SPACING.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    borderRadius: IOS_RADIUS.sm,
    paddingHorizontal: IOS_SPACING.sm,
    height: 36,
  },
  searchIconStyle: { marginRight: IOS_SPACING.xs },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: IOS_COLORS.label,
    paddingVertical: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
      default: {},
    }),
  },

  // Sections
  section: {
    marginTop: IOS_SPACING.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: IOS_COLORS.secondaryLabel,
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.md,
    paddingBottom: IOS_SPACING.sm,
  },

  // Org list
  orgList: {
    paddingHorizontal: IOS_SPACING.lg,
    gap: 10,
  },
  orgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  orgInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orgIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgText: {
    flex: 1,
  },
  orgName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  orgMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  inviteOnlyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty / loading
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
});
