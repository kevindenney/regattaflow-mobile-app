/**
 * SailorSearchContent - Sailors tab content with sub-tabs
 *
 * Sub-tabs:
 * - Suggested: Algorithm-based sailor suggestions
 * - Contacts: Import from device contacts (future)
 * - QR Code: Display user's QR code for sharing
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
} from 'react-native';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';
import { SuggestedSailorsSection } from './SuggestedSailorsSection';
import { ProfileQRCodeSection } from './ProfileQRCodeSection';
import { InviteFriendsBanner } from './InviteFriendsBanner';
import { DemoPeerCard } from '@/components/connect/DemoCards';
import { getConnectDemoData } from '@/configs/connectDemoData';
import { useInterestEventConfig } from '@/hooks/useInterestEventConfig';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';
import { useAuth } from '@/providers/AuthProvider';

type SailorSubTab = 'suggested' | 'contacts' | 'qr';

const SUB_TABS = [
  { value: 'suggested' as const, label: 'Suggested' },
  { value: 'contacts' as const, label: 'Contacts' },
  { value: 'qr' as const, label: 'QR Code' },
];

interface SailorSearchContentProps {
  toolbarOffset?: number;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function SailorSearchContent({
  toolbarOffset = 0,
  onScroll,
}: SailorSearchContentProps) {
  const { user } = useAuth();
  const eventConfig = useInterestEventConfig();
  const isSailing = eventConfig.interestSlug === 'sail-racing';
  const demoData = useMemo(
    () => (isSailing ? null : getConnectDemoData(eventConfig.interestSlug)),
    [eventConfig.interestSlug, isSailing]
  );
  const [activeSubTab, setActiveSubTab] = useState<SailorSubTab>('suggested');
  const [searchQuery, setSearchQuery] = useState('');
  const [demoFollowedIds, setDemoFollowedIds] = useState<Set<string>>(new Set());

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleToggleDemoFollow = useCallback((id: string) => {
    setDemoFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const filteredDemoPeers = useMemo(() => {
    if (!demoData) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return demoData.peers;
    return demoData.peers.filter((peer) => (
      peer.name.toLowerCase().includes(query)
      || peer.subtitle.toLowerCase().includes(query)
    ));
  }, [demoData, searchQuery]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: toolbarOffset + IOS_SPACING.md },
      ]}
      showsVerticalScrollIndicator={true}
      keyboardDismissMode="on-drag"
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search
            size={16}
            color={IOS_COLORS.placeholderText}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={isSailing ? 'Search sailors' : (demoData?.searchPlaceholder || 'Search people')}
            placeholderTextColor={IOS_COLORS.placeholderText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClearSearch} hitSlop={8}>
              <X size={16} color={IOS_COLORS.systemGray2} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Sub-tabs */}
      {isSailing && (
        <View style={styles.subTabContainer}>
          <IOSSegmentedControl<SailorSubTab>
            segments={SUB_TABS}
            selectedValue={activeSubTab}
            onValueChange={setActiveSubTab}
          />
        </View>
      )}

      {/* Tab Content */}
      {!isSailing && demoData && (
        <View style={styles.nonSailingSection}>
          <Text style={styles.nonSailingHeader}>{demoData.peersHeader}</Text>
          {filteredDemoPeers.map((peer) => (
            <DemoPeerCard
              key={peer.id}
              peer={peer}
              isFollowing={demoFollowedIds.has(peer.id)}
              onToggleFollow={handleToggleDemoFollow}
            />
          ))}
          {filteredDemoPeers.length === 0 && (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderTitle}>No people found</Text>
              <Text style={styles.placeholderText}>
                Try a different name or keyword.
              </Text>
            </View>
          )}
        </View>
      )}

      {isSailing && activeSubTab === 'suggested' && (
        <>
          <SuggestedSailorsSection searchQuery={searchQuery} />
          <InviteFriendsBanner />
        </>
      )}

      {isSailing && activeSubTab === 'contacts' && (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderTitle}>Find Contacts</Text>
          <Text style={styles.placeholderText}>
            Connect your contacts to find sailors you know. Coming soon!
          </Text>
        </View>
      )}

      {isSailing && activeSubTab === 'qr' && user && (
        <ProfileQRCodeSection userId={user.id} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: IOS_SPACING.xxxxl,
  },
  searchContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.md,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    borderRadius: IOS_RADIUS.sm,
    paddingHorizontal: IOS_SPACING.md,
    height: 36,
  },
  searchIcon: {
    marginRight: IOS_SPACING.xs,
  },
  searchInput: {
    flex: 1,
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
    paddingVertical: 0,
  },
  subTabContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.lg,
  },
  nonSailingSection: {
    paddingHorizontal: IOS_SPACING.lg,
    gap: IOS_SPACING.sm,
  },
  nonSailingHeader: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: IOS_SPACING.xs,
  },
  placeholderContainer: {
    padding: IOS_SPACING.xl,
    alignItems: 'center',
  },
  placeholderTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.sm,
  },
  placeholderText: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
});
