/**
 * BoatClassPickerSheet — Bottom sheet for selecting a boat class.
 *
 * Extracted from the old onboarding boat-picker screen for reuse
 * as an in-app contextual prompt (e.g. when user adds a race but
 * hasn't set their boat class yet).
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BoatClassPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (boatClass: string) => void;
  /** Common boat classes to show as quick picks. */
  popularClasses?: string[];
}

const DEFAULT_POPULAR_CLASSES = [
  'Laser/ILCA',
  'Optimist',
  '420',
  '49er',
  'J/70',
  'Nacra 17',
  'RS Feva',
  'Finn',
  'Sunfish',
  '29er',
  'Moth',
  'Star',
];

export function BoatClassPickerSheet({
  visible,
  onClose,
  onSelect,
  popularClasses = DEFAULT_POPULAR_CLASSES,
}: BoatClassPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filtered = search
    ? popularClasses.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    : popularClasses;

  const handleSelect = useCallback(
    (boatClass: string) => {
      onSelect(boatClass);
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
          <Text style={styles.title}>What do you sail?</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Select your primary boat class so we can tailor strategy and analytics.
        </Text>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search boat classes..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.classItem} onPress={() => handleSelect(item)}>
              <Text style={styles.classText}>{item}</Text>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No matches found</Text>
              {search.length > 0 && (
                <TouchableOpacity
                  style={styles.customButton}
                  onPress={() => handleSelect(search.trim())}
                >
                  <Text style={styles.customButtonText}>Use &quot;{search.trim()}&quot;</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />

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
  listContent: {
    paddingBottom: 12,
  },
  classItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  classText: {
    fontSize: 16,
    color: '#0F172A',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 32,
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 12,
  },
  customButton: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  customButtonText: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '600',
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
