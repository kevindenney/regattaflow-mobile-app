/**
 * AddMemberModal - Search and add members to a thread
 *
 * iOS-style modal with search input for finding users to add.
 * Shows search results with add buttons.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Animated,
  TextInput,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Search, UserPlus, Check } from 'lucide-react-native';
import { CrewThreadService, CrewThreadMember } from '@/services/CrewThreadService';
import { getInitials } from '@/components/account/accountStyles';
import {
  IOS_COLORS,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

// =============================================================================
// TYPES
// =============================================================================

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  threadId: string;
  threadName?: string;
  onMemberAdded?: () => void;
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
  isAdded,
  isAdding,
  onAdd,
  isLast,
}: {
  user: SearchUser;
  isAdded: boolean;
  isAdding: boolean;
  onAdd: () => void;
  isLast: boolean;
}) {
  const initials = getInitials(user.fullName);

  return (
    <View style={[styles.userRow, !isLast && styles.userRowBorder]}>
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

      {/* Add button */}
      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          isAdded && styles.addButtonAdded,
          pressed && !isAdded && styles.addButtonPressed,
        ]}
        onPress={onAdd}
        disabled={isAdded || isAdding}
      >
        {isAdding ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : isAdded ? (
          <>
            <Check size={14} color={IOS_COLORS.label} strokeWidth={2.5} />
            <Text style={styles.addButtonTextAdded}>Added</Text>
          </>
        ) : (
          <>
            <UserPlus size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addButtonText}>Add</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AddMemberModal({
  isOpen,
  onClose,
  threadId,
  threadName,
  onMemberAdded,
}: AddMemberModalProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [existingMemberIds, setExistingMemberIds] = useState<Set<string>>(new Set());

  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(400));

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Fetch existing members to exclude from results
      CrewThreadService.getThreadMembers(threadId).then((members) => {
        setExistingMemberIds(new Set(members.map((m) => m.userId)));
      });

      // Focus input after animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    } else {
      // Reset state when closed
      setSearchQuery('');
      setSearchResults([]);
      setSearchError(null);
      setAddedIds(new Set());
    }
  }, [isOpen, threadId]);

  // Animations
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 28,
          stiffness: 400,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 400,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, fadeAnim, slideAnim]);

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
        // Filter out existing members and already added users
        const filtered = result.users.filter(
          (u) => !existingMemberIds.has(u.id) && !addedIds.has(u.id)
        );
        setSearchResults(filtered);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, existingMemberIds, addedIds]);

  const handleAddUser = useCallback(
    async (user: SearchUser) => {
      setAddingId(user.id);
      const success = await CrewThreadService.addMember(threadId, user.id);
      setAddingId(null);

      if (success) {
        setAddedIds((prev) => new Set(prev).add(user.id));
        onMemberAdded?.();
      } else {
        Alert.alert('Error', 'Could not add member');
      }
    },
    [threadId, onMemberAdded]
  );

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const renderUser = useCallback(
    ({ item, index }: { item: SearchUser; index: number }) => {
      return (
        <UserRow
          user={item}
          isAdded={addedIds.has(item.id)}
          isAdding={addingId === item.id}
          onAdd={() => handleAddUser(item)}
          isLast={index === searchResults.length - 1}
        />
      );
    },
    [addedIds, addingId, searchResults.length, handleAddUser]
  );

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={styles.backdropPressable} onPress={handleClose} />
      </Animated.View>

      {/* Modal */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            paddingBottom: insets.bottom || IOS_SPACING.lg,
            transform: [{ translateY: slideAnim }],
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Add Member</Text>
              {threadName && (
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {threadName}
                </Text>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              onPress={handleClose}
            >
              <X size={20} color={IOS_COLORS.secondaryLabel} strokeWidth={2} />
            </Pressable>
          </View>

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
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
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
              <Text style={styles.emptyText}>Search for sailors to add</Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No sailors found</Text>
              <Text style={styles.emptySubtext}>
                Try a different search term
              </Text>
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

          {/* Added count */}
          {addedIds.size > 0 && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {addedIds.size} member{addedIds.size !== 1 ? 's' : ''} added
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const AVATAR_SIZE = 44;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdropPressable: {
    flex: 1,
  },

  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
  },

  modal: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: 'hidden',
    minHeight: 300,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: IOS_SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: IOS_COLORS.quaternarySystemFill,
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
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
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
  },

  // List
  list: {
    maxHeight: 350,
  },
  listContent: {
    paddingVertical: IOS_SPACING.sm,
  },

  // User Row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: IOS_SPACING.lg,
  },
  userRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    marginLeft: IOS_SPACING.lg + AVATAR_SIZE + 12,
    paddingLeft: 0,
    marginRight: 0,
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
    marginRight: IOS_SPACING.sm,
  },

  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: IOS_RADIUS.lg,
    minWidth: 72,
    gap: 4,
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonAdded: {
    backgroundColor: IOS_COLORS.tertiarySystemFill,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButtonTextAdded: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },

  // Footer
  footer: {
    paddingVertical: 12,
    paddingHorizontal: IOS_SPACING.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
  },
  footerText: {
    fontSize: 13,
    color: IOS_COLORS.systemGreen,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default AddMemberModal;
