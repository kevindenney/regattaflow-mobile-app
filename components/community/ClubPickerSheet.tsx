/**
 * ClubPickerSheet — Bottom sheet for selecting a home sailing club.
 *
 * Extracted from the old onboarding club-nearby screen for reuse
 * as an in-app contextual prompt (e.g. when user wants club-specific
 * features but hasn't set their home club yet).
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ClubItem {
  id: string;
  name: string;
  location?: string;
}

interface ClubPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (club: ClubItem) => void;
  /** List of clubs to display. */
  clubs: ClubItem[];
  /** Whether clubs are still loading. */
  isLoading?: boolean;
  /** Callback when search text changes (for server-side search). */
  onSearchChange?: (query: string) => void;
}

export function ClubPickerSheet({
  visible,
  onClose,
  onSelect,
  clubs,
  isLoading = false,
  onSearchChange,
}: ClubPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearch(text);
      onSearchChange?.(text);
    },
    [onSearchChange],
  );

  const filtered = onSearchChange
    ? clubs // Server-side filtering
    : clubs.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.location?.toLowerCase().includes(search.toLowerCase()),
      );

  const handleSelect = useCallback(
    (club: ClubItem) => {
      onSelect(club);
      onClose();
    },
    [onSelect, onClose],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Find your club</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Select your home sailing club to connect with fellow members and access club events.
        </Text>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clubs..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={handleSearchChange}
            autoCorrect={false}
          />
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Finding nearby clubs...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.clubItem} onPress={() => handleSelect(item)}>
                <View style={styles.clubInfo}>
                  <Text style={styles.clubName}>{item.name}</Text>
                  {item.location && (
                    <Text style={styles.clubLocation}>{item.location}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {search ? 'No clubs match your search' : 'No clubs found nearby'}
                </Text>
              </View>
            }
          />
        )}

        {/* Skip */}
        <TouchableOpacity style={styles.skipButton} onPress={onClose}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 16 : 24,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
  },
  listContent: {
    paddingBottom: 12,
  },
  clubItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  clubInfo: {
    flex: 1,
    marginRight: 12,
  },
  clubName: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  clubLocation: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 32,
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  skipText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
});
