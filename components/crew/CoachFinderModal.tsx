/**
 * CoachFinderModal
 *
 * Simplified modal for finding and inviting coaches to a race.
 * Coaches get view-only access (can view + chat).
 *
 * Two sections:
 * - My Fleets: Find coaches from fleets you're in
 * - Search: Search for specific users by name
 *
 * Extracted and simplified from CrewFinderScreen.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  Pressable,
  TextInput,
  FlatList,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Search,
  Users,
  UserPlus,
  Sailboat,
  CheckCircle,
  GraduationCap,
} from 'lucide-react-native';
import { Avatar, AvatarFallbackText } from '@/components/ui/avatar';
import { useCrewFinder } from '@/hooks/useCrewFinder';
import { SailorProfileSummary } from '@/services/CrewFinderService';
import { IOS_COLORS } from '@/components/cards/constants';

// =============================================================================
// TYPES
// =============================================================================

type ActiveSection = 'search' | 'fleets';

interface CoachFinderModalProps {
  regattaId: string;
  isVisible: boolean;
  onClose: () => void;
  onInviteSent?: () => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CoachFinderModal({
  regattaId,
  isVisible,
  onClose,
  onInviteSent,
}: CoachFinderModalProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>('fleets');
  const [invitedUserIds, setInvitedUserIds] = useState<Set<string>>(new Set());

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    fleetMates,
    isLoadingFleetMates,
    inviteUser,
    isInviting,
  } = useCrewFinder();

  // Invite user as coach (view access, role: 'coach')
  const handleInviteCoach = useCallback(async (userId: string) => {
    try {
      await inviteUser(userId, regattaId, 'view');
      setInvitedUserIds((prev) => new Set(prev).add(userId));
      onInviteSent?.();
    } catch (error) {
      console.error('Failed to invite coach:', error);
    }
  }, [inviteUser, regattaId, onInviteSent]);

  // Render user row
  const renderUserRow = useCallback(({ item }: { item: SailorProfileSummary }) => {
    const isInvited = invitedUserIds.has(item.userId);
    return (
      <View style={styles.userRow}>
        <Avatar
          size="sm"
          style={{ backgroundColor: item.avatarColor || IOS_COLORS.blue }}
        >
          {item.avatarEmoji ? (
            <AvatarFallbackText>{item.avatarEmoji}</AvatarFallbackText>
          ) : (
            <AvatarFallbackText>{getInitials(item.fullName)}</AvatarFallbackText>
          )}
        </Avatar>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.fullName}</Text>
          {item.sailingExperience && (
            <Text style={styles.userExperience}>{item.sailingExperience}</Text>
          )}
        </View>
        <Pressable
          style={[
            styles.inviteButton,
            isInvited && styles.inviteButtonDisabled,
          ]}
          onPress={() => handleInviteCoach(item.userId)}
          disabled={isInvited || isInviting}
        >
          {isInvited ? (
            <>
              <CheckCircle size={16} color={IOS_COLORS.green} />
              <Text style={[styles.inviteButtonText, { color: IOS_COLORS.green }]}>Sent</Text>
            </>
          ) : (
            <>
              <GraduationCap size={16} color={IOS_COLORS.purple} />
              <Text style={[styles.inviteButtonText, { color: IOS_COLORS.purple }]}>
                Invite as Coach
              </Text>
            </>
          )}
        </Pressable>
      </View>
    );
  }, [handleInviteCoach, invitedUserIds, isInviting]);

  // Render fleet mates section
  const renderFleetSection = useCallback(() => {
    if (isLoadingFleetMates) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.blue} />
        </View>
      );
    }

    if (fleetMates.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Sailboat size={48} color={IOS_COLORS.gray3} />
          <Text style={styles.emptyStateTitle}>No Fleets Yet</Text>
          <Text style={styles.emptyStateText}>
            Join a fleet to find coaches from your sailing community
          </Text>
        </View>
      );
    }

    const sections = fleetMates.map((fleet) => ({
      title: fleet.name,
      subtitle: fleet.boatClassName,
      data: fleet.members,
    }));

    return (
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.userId}
        renderItem={renderUserRow}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.subtitle && (
              <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
            )}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />
    );
  }, [fleetMates, isLoadingFleetMates, renderUserRow]);

  // Render search section
  const renderSearchSection = useCallback(() => {
    if (searchQuery.length < 2) {
      return (
        <View style={styles.emptyState}>
          <Search size={48} color={IOS_COLORS.gray3} />
          <Text style={styles.emptyStateTitle}>Search for Coaches</Text>
          <Text style={styles.emptyStateText}>
            Type at least 2 characters to search for users by name
          </Text>
        </View>
      );
    }

    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.blue} />
        </View>
      );
    }

    if (searchResults.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Users size={48} color={IOS_COLORS.gray3} />
          <Text style={styles.emptyStateTitle}>No Results</Text>
          <Text style={styles.emptyStateText}>
            No users found matching "{searchQuery}"
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.userId}
        renderItem={renderUserRow}
        contentContainerStyle={styles.listContent}
      />
    );
  }, [searchQuery, searchResults, isSearching, renderUserRow]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <GraduationCap size={20} color={IOS_COLORS.purple} />
            <Text style={styles.title}>Find a Coach</Text>
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={24} color={IOS_COLORS.gray} />
          </Pressable>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            Coaches can view your race and chat with you, but cannot edit.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color={IOS_COLORS.gray2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            placeholderTextColor={IOS_COLORS.gray2}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={18} color={IOS_COLORS.gray2} />
            </Pressable>
          )}
        </View>

        {/* Section Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeSection === 'fleets' && styles.tabActive]}
            onPress={() => setActiveSection('fleets')}
          >
            <Text style={[styles.tabText, activeSection === 'fleets' && styles.tabTextActive]}>
              My Fleets
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeSection === 'search' && styles.tabActive]}
            onPress={() => setActiveSection('search')}
          >
            <Text style={[styles.tabText, activeSection === 'search' && styles.tabTextActive]}>
              Search
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeSection === 'fleets' && renderFleetSection()}
          {activeSection === 'search' && renderSearchSection()}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  closeButton: {
    padding: 4,
  },
  infoBanner: {
    backgroundColor: `${IOS_COLORS.purple}10`,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  infoBannerText: {
    fontSize: 13,
    color: IOS_COLORS.purple,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.gray6,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: IOS_COLORS.label,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: IOS_COLORS.purple,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: IOS_COLORS.systemBackground,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  userExperience: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${IOS_COLORS.purple}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteButtonDisabled: {
    backgroundColor: `${IOS_COLORS.green}15`,
  },
  inviteButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    backgroundColor: IOS_COLORS.gray6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
});

export default CoachFinderModal;
