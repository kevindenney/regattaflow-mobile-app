/**
 * ContactPicker - Search and select contacts for messaging
 *
 * Supports single-select mode (for direct messages) and
 * multi-select mode (for group creation).
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  Keyboard,
} from 'react-native';
import { ChevronLeft, Search, X, Check } from 'lucide-react-native';
import { CrewThreadService } from '@/services/CrewThreadService';
import { getInitials } from '@/components/account/accountStyles';
import {
  IOS_COLORS,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

// =============================================================================
// TYPES
// =============================================================================

interface ContactPickerProps {
  mode: 'single' | 'multi';
  title: string;
  onSelect: (threadIdOrUserIds: string | string[]) => void;
  onBack: () => void;
  onClose: () => void;
  /** For multi mode: callback when selected users change */
  onSelectionChange?: (userIds: string[]) => void;
  /** Initial selected user IDs (for multi mode) */
  initialSelected?: string[];
  /** Show a "Next" button in multi mode */
  showNextButton?: boolean;
  /** Callback when Next is pressed in multi mode */
  onNext?: (selectedUserIds: string[]) => void;
}

interface SearchUser {
  id: string;
  fullName: string;
  avatarEmoji: string | null;
  avatarColor: string | null;
}

// =============================================================================
// USER ROW
// =============================================================================

function UserRow({
  user,
  isSelected,
  onPress,
  isLast,
  mode,
}: {
  user: SearchUser;
  isSelected: boolean;
  onPress: () => void;
  isLast: boolean;
  mode: 'single' | 'multi';
}) {
  const initials = getInitials(user.fullName);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.userRow,
        pressed && styles.userRowPressed,
      ]}
      onPress={onPress}
    >
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: user.avatarColor || IOS_COLORS.systemGray4 },
        ]}
      >
        {user.avatarEmoji ? (
          <Text style={styles.avatarEmoji}>{user.avatarEmoji}</Text>
        ) : (
          <Text style={styles.avatarInitials}>{initials}</Text>
        )}
      </View>

      {/* Name */}
      <Text style={styles.userName} numberOfLines={1}>
        {user.fullName}
      </Text>

      {/* Selection indicator (for multi mode) */}
      {mode === 'multi' && (
        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
          ]}
        >
          {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </View>
      )}

      {/* Separator */}
      {!isLast && <View style={styles.separator} />}
    </Pressable>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ContactPicker({
  mode,
  title,
  onSelect,
  onBack,
  onClose,
  onSelectionChange,
  initialSelected = [],
  showNextButton = false,
  onNext,
}: ContactPickerProps) {
  const inputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelected));
  const [isCreatingDirect, setIsCreatingDirect] = useState(false);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      const result = await CrewThreadService.searchUsers(searchQuery);

      if (result.error) {
        setSearchError(result.error);
        setSearchResults([]);
      } else {
        setSearchResults(result.users);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange?.(Array.from(selectedIds));
  }, [selectedIds, onSelectionChange]);

  const handleUserPress = useCallback(
    async (user: SearchUser) => {
      if (mode === 'single') {
        // Create direct message thread
        setIsCreatingDirect(true);
        Keyboard.dismiss();
        const thread = await CrewThreadService.getOrCreateDirectThread(user.id);
        setIsCreatingDirect(false);

        if (thread) {
          onSelect(thread.id);
        } else {
          setSearchError('Could not create conversation');
        }
      } else {
        // Toggle selection
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(user.id)) {
            next.delete(user.id);
          } else {
            next.add(user.id);
          }
          return next;
        });
      }
    },
    [mode, onSelect]
  );

  const handleNext = useCallback(() => {
    if (selectedIds.size > 0 && onNext) {
      onNext(Array.from(selectedIds));
    }
  }, [selectedIds, onNext]);

  const renderUser = useCallback(
    ({ item, index }: { item: SearchUser; index: number }) => (
      <UserRow
        user={item}
        isSelected={selectedIds.has(item.id)}
        onPress={() => handleUserPress(item)}
        isLast={index === searchResults.length - 1}
        mode={mode}
      />
    ),
    [selectedIds, searchResults.length, handleUserPress, mode]
  );

  const selectedUsers = searchResults.filter((u) => selectedIds.has(u.id));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          onPress={onBack}
        >
          <ChevronLeft size={24} color={IOS_COLORS.systemBlue} />
        </Pressable>

        <Text style={styles.headerTitle}>{title}</Text>

        {showNextButton && mode === 'multi' ? (
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              selectedIds.size === 0 && styles.nextButtonDisabled,
              pressed && selectedIds.size > 0 && styles.nextButtonPressed,
            ]}
            onPress={handleNext}
            disabled={selectedIds.size === 0}
          >
            <Text
              style={[
                styles.nextButtonText,
                selectedIds.size === 0 && styles.nextButtonTextDisabled,
              ]}
            >
              Next
            </Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Selected users preview (multi mode) */}
      {mode === 'multi' && selectedIds.size > 0 && (
        <View style={styles.selectedPreview}>
          <Text style={styles.selectedCount}>
            {selectedIds.size} selected
          </Text>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={16} color={IOS_COLORS.secondaryLabel} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search by name..."
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <X size={16} color={IOS_COLORS.secondaryLabel} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      {isSearching || isCreatingDirect ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
          {isCreatingDirect && (
            <Text style={styles.loadingText}>Creating conversation...</Text>
          )}
        </View>
      ) : searchError ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>Unable to search</Text>
          <Text style={styles.emptySubtext}>
            Please check your connection and try again
          </Text>
        </View>
      ) : searchQuery.trim() === '' ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Search for sailors</Text>
          <Text style={styles.emptySubtext}>
            Type a name to find people to message
          </Text>
        </View>
      ) : searchResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No sailors found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const AVATAR_SIZE = 44;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 400,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: IOS_SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  backButton: {
    padding: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.full,
  },
  backButtonPressed: {
    backgroundColor: IOS_COLORS.quaternarySystemFill,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  headerSpacer: {
    width: 40,
  },
  nextButton: {
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.xs,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonPressed: {
    opacity: 0.7,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  nextButtonTextDisabled: {
    color: IOS_COLORS.tertiaryLabel,
  },

  // Selected preview
  selectedPreview: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.systemGray6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  selectedCount: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },

  // Search
  searchContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: IOS_COLORS.label,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },

  // Loading/Empty
  loadingContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: IOS_SPACING.md,
  },
  loadingText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  emptyContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 15,
    color: IOS_COLORS.systemRed,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 4,
    textAlign: 'center',
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: IOS_SPACING.xs,
  },

  // User Row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: IOS_SPACING.lg,
    position: 'relative',
  },
  userRowPressed: {
    backgroundColor: IOS_COLORS.quaternarySystemFill,
  },

  // Avatar
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // User Name
  userName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: IOS_COLORS.label,
    letterSpacing: -0.4,
  },

  // Checkbox
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: IOS_COLORS.systemGray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: IOS_COLORS.systemBlue,
    borderColor: IOS_COLORS.systemBlue,
  },

  // Separator
  separator: {
    position: 'absolute',
    left: IOS_SPACING.lg + AVATAR_SIZE + 12,
    right: IOS_SPACING.lg,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
  },
});

export default ContactPicker;
