/**
 * CollaboratorPicker — Modal for selecting platform users or adding external people
 * as collaborators on a step.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { STEP_COLORS } from '@/lib/step-theme';
import { useAuth } from '@/providers/AuthProvider';
import { useOrganization } from '@/providers/OrganizationProvider';
import { SailorProfileService } from '@/services/SailorProfileService';
import { CrewFinderService } from '@/services/CrewFinderService';
import { supabase } from '@/services/supabase';
import type { StepCollaborator } from '@/types/step-detail';

interface CollaboratorPickerProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (collaborator: StepCollaborator) => void;
  existingIds: Set<string>; // user_ids or collaborator ids already added
}

interface UserRow {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  avatarEmoji?: string;
  avatarColor?: string;
}

export function CollaboratorPicker({ visible, onClose, onAdd, existingIds }: CollaboratorPickerProps) {
  const { user } = useAuth();
  const { activeOrganizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [orgMembers, setOrgMembers] = useState<UserRow[]>([]);
  const [following, setFollowing] = useState<UserRow[]>([]);
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [searchResults, setSearchResults] = useState<UserRow[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showExternalInput, setShowExternalInput] = useState(false);
  const [externalName, setExternalName] = useState('');
  const [hasFollows, setHasFollows] = useState(false);
  const [hasOrgMembers, setHasOrgMembers] = useState(false);

  // Load org members + following/all users on mount
  useEffect(() => {
    if (!visible || !user?.id) return;
    setLoadingPeople(true);

    const loadOrgMembers = async (): Promise<UserRow[]> => {
      if (!activeOrganizationId) return [];
      try {
        const { data: memberships } = await supabase
          .from('organization_memberships')
          .select('user_id, role')
          .eq('organization_id', activeOrganizationId)
          .in('status', ['active', 'verified'])
          .neq('user_id', user.id)
          .limit(100);
        if (!memberships || memberships.length === 0) return [];
        const memberIds = memberships.map((m) => m.user_id);
        // Use `users` table for names (has the editable full_name)
        const { data: usersData } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', memberIds);
        const { data: sailorProfiles } = await supabase
          .from('sailor_profiles')
          .select('user_id, avatar_emoji, avatar_color')
          .in('user_id', memberIds);
        const spMap: Record<string, any> = {};
        if (sailorProfiles) for (const sp of sailorProfiles) spMap[sp.user_id] = sp;
        const usersMap: Record<string, any> = {};
        if (usersData) for (const u of usersData) usersMap[u.id] = u;
        return memberIds.map((uid) => ({
          userId: uid,
          displayName: usersMap[uid]?.full_name || usersMap[uid]?.email || 'Unknown',
          avatarEmoji: spMap[uid]?.avatar_emoji,
          avatarColor: spMap[uid]?.avatar_color,
        }));
      } catch {
        return [];
      }
    };

    const loadPeople = async () => {
      // Load org members first (if in an org)
      const orgResults = await loadOrgMembers();
      if (orgResults.length > 0) {
        setHasOrgMembers(true);
        setOrgMembers(orgResults);
      } else {
        setHasOrgMembers(false);
      }

      // Then load following/all users
      try {
        const { users } = await SailorProfileService.getFollowing(user.id, user.id, { limit: 50, offset: 0 });
        if (users.length > 0) {
          setHasFollows(true);
          setFollowing(
            users.map((u) => ({
              userId: u.userId,
              displayName: u.displayName,
              avatarUrl: u.avatarUrl,
              avatarEmoji: u.avatarEmoji,
              avatarColor: u.avatarColor,
            }))
          );
        } else {
          setHasFollows(false);
          const results = await CrewFinderService.getAllUsers(50, 0);
          setAllUsers(
            results
              .filter((r) => r.userId !== user?.id)
              .map((r) => ({
                userId: r.userId,
                displayName: r.fullName,
                avatarEmoji: r.avatarEmoji,
                avatarColor: r.avatarColor,
              }))
          );
        }
      } catch (err) {
        console.error('[CollaboratorPicker] Failed to load people:', err);
      }
      setLoadingPeople(false);
    };

    loadPeople();
  }, [visible, user?.id, activeOrganizationId]);

  // Search users when query changes
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    const timeout = setTimeout(() => {
      CrewFinderService.searchUsers(query.trim(), 20)
        .then((results) => {
          setSearchResults(
            results
              .filter((r) => r.userId !== user?.id)
              .map((r) => ({
                userId: r.userId,
                displayName: r.fullName,
                avatarEmoji: r.avatarEmoji,
                avatarColor: r.avatarColor,
              }))
          );
        })
        .catch(() => setSearchResults([]))
        .finally(() => setLoadingSearch(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, user?.id]);

  const handleSelectUser = useCallback(
    (row: UserRow) => {
      onAdd({
        id: `platform_${row.userId}`,
        type: 'platform',
        user_id: row.userId,
        display_name: row.displayName,
        avatar_url: row.avatarUrl,
        avatar_emoji: row.avatarEmoji,
        avatar_color: row.avatarColor,
      });
    },
    [onAdd]
  );

  const handleAddExternal = useCallback(() => {
    const trimmed = externalName.trim();
    if (!trimmed) return;
    onAdd({
      id: `external_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'external',
      display_name: trimmed,
    });
    setExternalName('');
    setShowExternalInput(false);
  }, [externalName, onAdd]);

  const handleClose = useCallback(() => {
    setQuery('');
    setSearchResults([]);
    setShowExternalInput(false);
    setExternalName('');
    onClose();
  }, [onClose]);

  const otherPeopleList = hasFollows ? following : allUsers;
  const displayList = query.trim() ? searchResults : otherPeopleList;
  const isSearching = query.trim().length > 0;

  const renderUserRow = ({ item }: { item: UserRow }) => {
    const alreadyAdded = existingIds.has(item.userId) || existingIds.has(`platform_${item.userId}`);
    return (
      <Pressable
        style={[styles.userRow, alreadyAdded && styles.userRowDisabled]}
        onPress={() => !alreadyAdded && handleSelectUser(item)}
        disabled={alreadyAdded}
      >
        <View style={[styles.avatar, { backgroundColor: item.avatarColor || IOS_COLORS.systemGray5 }]}>
          {item.avatarEmoji ? (
            <Text style={styles.avatarEmoji}>{item.avatarEmoji}</Text>
          ) : (
            <Ionicons name="person" size={18} color={IOS_COLORS.systemGray2} />
          )}
        </View>
        <Text style={styles.userName} numberOfLines={1}>
          {item.displayName}
        </Text>
        {alreadyAdded ? (
          <Ionicons name="checkmark-circle" size={22} color={IOS_COLORS.systemGreen} />
        ) : (
          <Ionicons name="add-circle-outline" size={22} color={STEP_COLORS.accent} />
        )}
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add People</Text>
          <Pressable onPress={handleClose} hitSlop={8}>
            <Ionicons name="close-circle-outline" size={28} color={IOS_COLORS.secondaryLabel} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={IOS_COLORS.tertiaryLabel} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search people..."
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={6}>
              <Ionicons name="close-circle" size={18} color={IOS_COLORS.systemGray3} />
            </Pressable>
          )}
        </View>

        {/* Section header */}
        {!isSearching && hasOrgMembers && orgMembers.length > 0 && (
          <Text style={styles.sectionLabel}>YOUR ORGANIZATION</Text>
        )}

        {/* List — combined org members + other people, or search results */}
        {(loadingPeople && !isSearching) || (loadingSearch && isSearching) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={STEP_COLORS.accent} />
          </View>
        ) : isSearching ? (
          searchResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>SEARCH RESULTS</Text>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.userId}
                renderItem={renderUserRow}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
              />
            </>
          )
        ) : (
          <FlatList
            data={[
              ...(hasOrgMembers ? orgMembers : []),
              // Separator + other people (only if there are other people to show)
              ...(displayList.length > 0
                ? [{ userId: '__section__', displayName: hasFollows ? 'PEOPLE YOU FOLLOW' : 'PEOPLE ON BETTERAT' } as UserRow, ...displayList]
                : []),
            ]}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => {
              if (item.userId === '__section__') {
                return <Text style={styles.sectionLabelInline}>{item.displayName}</Text>;
              }
              return renderUserRow({ item });
            }}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No people found — try searching above</Text>
              </View>
            }
          />
        )}

        {/* External person entry */}
        <View style={styles.externalSection}>
          {showExternalInput ? (
            <View style={styles.externalInputRow}>
              <TextInput
                style={styles.externalInput}
                value={externalName}
                onChangeText={setExternalName}
                placeholder="Person's name..."
                placeholderTextColor={IOS_COLORS.tertiaryLabel}
                autoFocus
                onSubmitEditing={handleAddExternal}
                returnKeyType="done"
              />
              <Pressable
                style={[styles.externalAddButton, !externalName.trim() && styles.externalAddButtonDisabled]}
                onPress={handleAddExternal}
                disabled={!externalName.trim()}
              >
                <Text style={styles.externalAddText}>Add</Text>
              </Pressable>
              <Pressable onPress={() => { setShowExternalInput(false); setExternalName(''); }} hitSlop={6}>
                <Ionicons name="close" size={20} color={IOS_COLORS.secondaryLabel} />
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.addExternalButton} onPress={() => setShowExternalInput(true)}>
              <Ionicons name="person-add-outline" size={18} color={STEP_COLORS.accent} />
              <Text style={styles.addExternalText}>Add someone not on BetterAt</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.md,
    paddingTop: IOS_SPACING.md,
    paddingBottom: IOS_SPACING.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 10,
    marginHorizontal: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: IOS_COLORS.label,
    padding: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    letterSpacing: 0.5,
    paddingHorizontal: IOS_SPACING.md,
    paddingTop: IOS_SPACING.md,
    paddingBottom: IOS_SPACING.xs,
  },
  loadingContainer: {
    paddingVertical: IOS_SPACING.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: IOS_SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.tertiaryLabel,
  },
  sectionLabelInline: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    letterSpacing: 0.5,
    paddingTop: IOS_SPACING.md,
    paddingBottom: IOS_SPACING.xs,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: IOS_SPACING.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.systemGray5,
  },
  userRowDisabled: {
    opacity: 0.5,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  userName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  externalSection: {
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.systemGray4,
  },
  addExternalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: IOS_SPACING.xs,
  },
  addExternalText: {
    fontSize: 15,
    fontWeight: '500',
    color: STEP_COLORS.accent,
  },
  externalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  externalInput: {
    flex: 1,
    fontSize: 15,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 8,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: 8,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  externalAddButton: {
    backgroundColor: STEP_COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  externalAddButtonDisabled: {
    backgroundColor: IOS_COLORS.systemGray4,
  },
  externalAddText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
