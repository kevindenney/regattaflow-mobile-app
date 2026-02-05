/**
 * CommunityPicker
 *
 * Modal/Sheet for selecting a community when creating a post.
 * Shows user's joined communities first, then allows search.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  IOS_COLORS,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_TYPOGRAPHY,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import { useUserCommunities, useCommunitySearch } from '@/hooks/useCommunities';
import type { Community } from '@/types/community';
import { COMMUNITY_TYPE_CONFIG } from '@/types/community';

interface CommunityPickerProps {
  visible: boolean;
  selectedCommunityId?: string | null;
  onSelect: (community: Community) => void;
  onDismiss: () => void;
}

export function CommunityPicker({
  visible,
  selectedCommunityId,
  onSelect,
  onDismiss,
}: CommunityPickerProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: userCommunities, isLoading: isLoadingUser } = useUserCommunities();
  const { data: searchResults, isLoading: isSearching } = useCommunitySearch(
    searchQuery,
    {},
    searchQuery.length >= 2
  );

  const isFiltering = searchQuery.trim().length >= 2;

  // Combine user communities with search results
  const displayCommunities = useMemo(() => {
    if (isFiltering && searchResults) {
      return searchResults.data;
    }
    return userCommunities?.joined || [];
  }, [isFiltering, searchResults, userCommunities]);

  const handleSelect = useCallback(
    (community: Community) => {
      triggerHaptic('impactLight');
      onSelect(community);
      onDismiss();
    },
    [onSelect, onDismiss]
  );

  const renderItem = useCallback(
    ({ item }: { item: Community }) => {
      const typeConfig = COMMUNITY_TYPE_CONFIG[item.community_type] || COMMUNITY_TYPE_CONFIG.general;
      const isSelected = selectedCommunityId === item.id;

      return (
        <Pressable
          onPress={() => handleSelect(item)}
          style={({ pressed }) => [
            styles.item,
            pressed && styles.itemPressed,
            isSelected && styles.itemSelected,
          ]}
        >
          <View style={[styles.itemIcon, { backgroundColor: typeConfig.bgColor }]}>
            <Ionicons name={typeConfig.icon as any} size={20} color={typeConfig.color} />
          </View>
          <View style={styles.itemContent}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemMeta}>
              {item.member_count.toLocaleString()} members · {typeConfig.label}
            </Text>
          </View>
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={IOS_COLORS.systemBlue}
            />
          )}
        </Pressable>
      );
    },
    [selectedCommunityId, handleSelect]
  );

  const ListHeader = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>
          {isFiltering ? 'SEARCH RESULTS' : 'YOUR COMMUNITIES'}
        </Text>
      </View>
    ),
    [isFiltering]
  );

  const ListEmpty = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        {isLoadingUser || isSearching ? (
          <ActivityIndicator size="small" color={IOS_COLORS.systemGray3} />
        ) : isFiltering ? (
          <>
            <Ionicons name="search-outline" size={32} color={IOS_COLORS.systemGray3} />
            <Text style={styles.emptyText}>No communities found</Text>
          </>
        ) : (
          <>
            <Ionicons name="people-outline" size={32} color={IOS_COLORS.systemGray3} />
            <Text style={styles.emptyText}>No communities joined yet</Text>
            <Text style={styles.emptySubtext}>Search to find communities</Text>
          </>
        )}
      </View>
    ),
    [isLoadingUser, isSearching, isFiltering]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={[styles.modalHeader, { paddingTop: insets.top > 0 ? 8 : 16 }]}>
          <View style={styles.headerLeft}>
            <Pressable onPress={onDismiss} hitSlop={8}>
              <Ionicons name="close" size={28} color={IOS_COLORS.label} />
            </Pressable>
          </View>
          <Text style={styles.modalTitle}>Select Community</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={IOS_COLORS.tertiaryLabel}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search communities..."
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>

        {/* Community List */}
        <FlatList
          data={displayCommunities}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * CommunityPickerButton
 *
 * Button that opens the community picker.
 */
export function CommunityPickerButton({
  selectedCommunity,
  onPress,
}: {
  selectedCommunity: Community | null;
  onPress: () => void;
}) {
  const typeConfig = selectedCommunity
    ? COMMUNITY_TYPE_CONFIG[selectedCommunity.community_type] || COMMUNITY_TYPE_CONFIG.general
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        buttonStyles.container,
        pressed && buttonStyles.pressed,
      ]}
    >
      {selectedCommunity ? (
        <>
          <View style={[buttonStyles.icon, { backgroundColor: typeConfig?.bgColor }]}>
            <Ionicons
              name={typeConfig?.icon as any}
              size={18}
              color={typeConfig?.color}
            />
          </View>
          <Text style={buttonStyles.selectedText} numberOfLines={1}>
            {selectedCommunity.name}
          </Text>
        </>
      ) : (
        <>
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={IOS_COLORS.systemBlue}
          />
          <Text style={buttonStyles.placeholderText}>Select a community</Text>
        </>
      )}
      <Ionicons
        name="chevron-down"
        size={16}
        color={IOS_COLORS.secondaryLabel}
        style={buttonStyles.chevron}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  headerLeft: {
    width: 60,
  },
  headerRight: {
    width: 60,
  },
  modalTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: IOS_SPACING.lg,
    marginVertical: IOS_SPACING.md,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: IOS_RADIUS.md,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: IOS_COLORS.label,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
      default: {},
    }),
  },
  listContent: {
    paddingHorizontal: IOS_SPACING.lg,
  },
  header: {
    paddingTop: IOS_SPACING.sm,
    paddingBottom: IOS_SPACING.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: IOS_COLORS.secondaryLabel,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: IOS_SPACING.md,
    marginBottom: 1,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    marginTop: 8,
  },
  itemPressed: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  itemSelected: {
    backgroundColor: `${IOS_COLORS.systemBlue}15`,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: IOS_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: IOS_SPACING.md,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  itemMeta: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: IOS_SPACING.sm,
  },
  emptyText: {
    fontSize: 16,
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 14,
    color: IOS_COLORS.tertiaryLabel,
  },
});

const buttonStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
  },
  pressed: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: IOS_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: IOS_SPACING.sm,
  },
  selectedText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    color: IOS_COLORS.systemBlue,
  },
  chevron: {
    marginLeft: 4,
  },
});

export default CommunityPicker;
