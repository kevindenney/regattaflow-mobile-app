import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SAMPLE_INTERESTS } from '@/lib/landing/sampleData';

interface InterestDropdownProps {
  currentSlug?: string;
}

export function InterestDropdown({ currentSlug }: InterestDropdownProps) {
  const [open, setOpen] = useState(false);
  const current = SAMPLE_INTERESTS.find((i) => i.slug === currentSlug);

  const handleSelect = (slug: string) => {
    setOpen(false);
    router.push(`/${slug}` as any);
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrapper}>
        <TouchableOpacity style={styles.trigger} onPress={() => setOpen(!open)}>
          {current && (
            <Ionicons name={(current.icon + '-outline') as any} size={16} color={current.color} />
          )}
          <Text style={styles.triggerText}>{current?.name ?? 'Interests'}</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {open && (
          <>
            <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
            <View style={styles.dropdown}>
              {SAMPLE_INTERESTS.map((interest) => (
                <TouchableOpacity
                  key={interest.slug}
                  style={[styles.dropdownItem, interest.slug === currentSlug && styles.dropdownItemActive]}
                  onPress={() => handleSelect(interest.slug)}
                >
                  <Ionicons name={(interest.icon + '-outline') as any} size={18} color={interest.color} />
                  <Text style={styles.dropdownText}>{interest.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    );
  }

  // Native: use Modal
  return (
    <View>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerText}>{current?.name ?? 'Interests'}</Text>
        <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Interest</Text>
            {SAMPLE_INTERESTS.map((interest) => (
              <TouchableOpacity
                key={interest.slug}
                style={styles.modalItem}
                onPress={() => handleSelect(interest.slug)}
              >
                <Ionicons name={(interest.icon + '-outline') as any} size={22} color={interest.color} />
                <Text style={styles.modalItemText}>{interest.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 200,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backdrop: {
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      } as any,
    }),
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 6,
    minWidth: 180,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      } as any,
    }),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  dropdownItemActive: {
    backgroundColor: '#F3F4F6',
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  // Native modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: 280,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
});
