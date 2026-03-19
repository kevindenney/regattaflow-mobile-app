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
import { SailorProfileService } from '@/services/SailorProfileService';
import { CrewFinderService } from '@/services/CrewFinderService';
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
  const [query, setQuery] = useState('');
  const [following, setFollowing] = useState<UserRow[]>([]);
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [searchResults, setSearchResults] = useState<UserRow[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showExternalInput, setShowExternalInput] = useState(false);
  const [externalName, setExternalName] = useState('');
  const [hasFollows, setHasFollows] = useState(false);

  // Load following list on mount, fall back to all users if empty
  useEffect(() => {
    if (!visible || !user?.id) return;
    setLoadingPeople(true);
    SailorProfileService.getFollowing(user.id, user.id, { limit: 50, offset: 0 })
      .then(({ users }) => {
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
          setLoadingPeople(false);
        } else {
          // No follows — load all discoverable users instead
          setHasFollows(false);
          return CrewFinderService.getAllUsers(50, 0)
            .then((results) => {
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
            })
            .catch(() => {})
            .finally(() => setLoadingPeople(false));
        }
      })
      .catch((err) => {
        console.error('[CollaboratorPicker] Failed to load people:', err);
        setLoadingPeople(false);
      });
  }, [visible, user?.id]);

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

  const defaultList = hasFollows ? following : allUsers;
  const displayList = query.trim() ? searchResults : defaultList;
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
        <Text style={styles.sectionLabel}>
          {isSearching ? 'SEARCH RESULTS' : hasFollows ? 'PEOPLE YOU FOLLOW' : 'PEOPLE ON BETTERAT'}
        </Text>

        {/* List */}
        {(loadingPeople && !isSearching) || (loadingSearch && isSearching) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={STEP_COLORS.accent} />
          </View>
        ) : displayList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isSearching ? 'No results found' : 'No people found — try searching above'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayList}
            keyExtractor={(item) => item.userId}
            renderItem={renderUserRow}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
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
